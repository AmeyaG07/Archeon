package com.webui.backend.service;

import com.webui.backend.model.*;
import com.webui.backend.repository.*;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BillingExpenseService {

    @Autowired
    private BillApprovalRepository billRepository;

    @Autowired
    private OperationalProjectRepository projectRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private ProjectVendorAssignmentRepository vendorAssignmentRepository;

    @Autowired
    private VendorPaymentMethodRepository paymentMethodRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WhatsAppAutomationService whatsAppService;

    // ==========================================
    // DTOs
    // ==========================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmitBillRequest {
        private UUID projectId;
        private UUID clientId;
        private String vendorId; // Optional if resolved from auth
        private BigDecimal amount;
        private String billPhotoUrl;
        private String tradeCategory;
        private String invoiceNumber;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashActionRequest {
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VendorExpenseBreakdownDto {
        private String vendorId;
        private String vendorBusinessName;
        private String tradeCategory;
        private VendorPaymentMethodEntity paymentMethods;
        private int settledBillsCount;
        private BigDecimal settledBillsAmount;
        private int pendingBillsCount;
        private BigDecimal pendingBillsAmount;
        private BigDecimal totalSpending;
        private List<BillApprovalEntity> bills;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClientProjectExpenseSummaryDto {
        private UUID projectId;
        private String projectName;
        private String projectReference;
        private LocalDate lastVisitDate;
        private UUID clientId;
        private String clientName;
        private BigDecimal totalProjectExpenses;
        private BigDecimal totalSettledExpenses;
        private BigDecimal totalPendingExpenses;
        private List<VendorExpenseBreakdownDto> vendors;

        public BigDecimal getTotalBilled() { return totalProjectExpenses; }
        public BigDecimal getTotalSettled() { return totalSettledExpenses; }
        public BigDecimal getTotalPending() { return totalPendingExpenses; }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VendorDirectoryItemDto {
        private UUID vendorId;
        private String vendorReference;
        private String businessName;
        private String category;
        private String contactPerson;
        private String email;
        private String phone;
        private BigDecimal totalBilledAmount;
        private int totalBillsCount;
        private List<String> associatedClientNames;
    }

    // ==========================================
    // 1. Bill Submission (Vendor -> Client/Project)
    // ==========================================

    @Transactional
    public BillApprovalEntity submitBill(SubmitBillRequest req, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        if (req.getAmount() == null || req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Bill amount must be greater than zero");
        }

        OperationalProjectEntity project = null;
        if (req.getProjectId() != null) {
            project = projectRepository.findById(req.getProjectId()).orElse(null);
        }
        if (project == null && req.getClientId() != null) {
            List<OperationalProjectEntity> clientProjects = projectRepository.findByClientIdOrderByCreatedAtDesc(req.getClientId());
            if (!clientProjects.isEmpty()) {
                project = clientProjects.get(0);
            }
        }
        if (project == null) {
            List<OperationalProjectEntity> all = projectRepository.findAll();
            if (!all.isEmpty()) {
                project = all.get(0);
            } else {
                throw new IllegalArgumentException("Project not found: " + req.getProjectId());
            }
        }

        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username).orElse(null);

        // Resolve vendor
        String vendorIdStr = req.getVendorId();
        VendorEntity vendor = null;
        if (user != null && user.getVendorId() != null) {
            vendor = vendorRepository.findById(user.getVendorId()).orElse(null);
            if (vendor != null) {
                vendorIdStr = vendor.getVendorReference();
            }
        } else if (vendorIdStr != null && !vendorIdStr.isBlank()) {
            vendor = vendorRepository.findByVendorReference(vendorIdStr).orElse(null);
            if (vendor == null) {
                try {
                    vendor = vendorRepository.findById(UUID.fromString(vendorIdStr)).orElse(null);
                } catch (Exception ignored) {}
            }
        }

        if (vendorIdStr == null || vendorIdStr.isBlank()) {
            vendorIdStr = vendor != null ? vendor.getVendorReference() : username;
        }

        String tradeCategory = req.getTradeCategory();
        if ((tradeCategory == null || tradeCategory.isBlank()) && vendor != null) {
            tradeCategory = vendor.getCategory();
        }

        String billId = "BILL-" + System.currentTimeMillis() + "-" + (100 + new Random().nextInt(900));

        BillApprovalEntity bill = BillApprovalEntity.builder()
                .billId(billId)
                .invoiceNumber(req.getInvoiceNumber() != null ? req.getInvoiceNumber() : billId)
                .amount(req.getAmount())
                .paidAmount(BigDecimal.ZERO)
                .currency("INR")
                .vendorId(vendorIdStr)
                .clientId(project.getClientId().toString())
                .projectId(project.getId().toString())
                .initiatorId(username)
                .billPhotoUrl(req.getBillPhotoUrl())
                .tradeCategory(tradeCategory != null ? tradeCategory : "Contractor")
                .disputeReason(req.getDescription() != null ? req.getDescription() : "")
                .status("PENDING") // Initial lifecycle status per PDF
                .createdAt(LocalDateTime.now())
                .build();

        BillApprovalEntity saved = billRepository.save(bill);

        // Trigger 1 — New Bill WhatsApp Notification to client
        ClientEntity client = clientRepository.findById(project.getClientId()).orElse(null);
        if (client != null) {
            String vendorName = vendor != null ? vendor.getBusinessName() : vendorIdStr;
            whatsAppService.sendNewBillAlert(client, vendorName, saved.getAmount(), saved.getBillPhotoUrl());
        }

        return saved;
    }

    // ==========================================
    // 2. Cash Payment Request Workflow
    // ==========================================

    private BillApprovalEntity findBillByIdOrBillId(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Bill identifier cannot be null or empty");
        }
        Optional<BillApprovalEntity> opt = billRepository.findByBillId(identifier);
        if (opt.isPresent()) return opt.get();
        try {
            Long id = Long.parseLong(identifier);
            return billRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + identifier));
        } catch (NumberFormatException ignored) {}
        throw new IllegalArgumentException("Bill not found: " + identifier);
    }

    @Transactional
    public BillApprovalEntity requestCashPayment(String billId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        BillApprovalEntity bill = findBillByIdOrBillId(billId);

        if (!"PENDING".equalsIgnoreCase(bill.getStatus())) {
            throw new IllegalStateException("Cash payment can only be requested on PENDING bills. Current status: " + bill.getStatus());
        }

        bill.setStatus("CASH_REQUESTED");
        bill.setUpdatedAt(LocalDateTime.now());
        return billRepository.save(bill);
    }

    @Transactional
    public BillApprovalEntity approveCashPayment(String billId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        BillApprovalEntity bill = findBillByIdOrBillId(billId);

        if (!"CASH_REQUESTED".equalsIgnoreCase(bill.getStatus())) {
            throw new IllegalStateException("Only bills in CASH_REQUESTED status can be approved. Current status: " + bill.getStatus());
        }

        bill.setStatus("PAID_CASH");
        bill.setPaidAmount(bill.getAmount());
        bill.setPaidAt(LocalDateTime.now());
        bill.setUpdatedAt(LocalDateTime.now());
        return billRepository.save(bill);
    }

    @Transactional
    public BillApprovalEntity rejectCashPayment(String billId, CashActionRequest req, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        BillApprovalEntity bill = findBillByIdOrBillId(billId);

        if (!"CASH_REQUESTED".equalsIgnoreCase(bill.getStatus())) {
            throw new IllegalStateException("Only bills in CASH_REQUESTED status can be rejected. Current status: " + bill.getStatus());
        }

        bill.setStatus("PENDING"); // Reverts to PENDING per PDF rule 4.1
        if (req != null && req.getNotes() != null) {
            bill.setRejectionReason(req.getNotes());
        }
        bill.setUpdatedAt(LocalDateTime.now());
        return billRepository.save(bill);
    }

    // ==========================================
    // 3. Client Project Expenses Breakdown
    // ==========================================

    @Transactional(readOnly = true)
    public ClientProjectExpenseSummaryDto getClientProjectExpenses(UUID projectId) {
        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        ClientEntity client = clientRepository.findById(project.getClientId()).orElse(null);

        List<BillApprovalEntity> projectBills = billRepository.findByProjectIdOrderByCreatedAtDesc(projectId.toString());

        // Group bills by vendorId
        Map<String, List<BillApprovalEntity>> billsByVendor = projectBills.stream()
                .collect(Collectors.groupingBy(BillApprovalEntity::getVendorId));

        // Get assigned vendors
        List<ProjectVendorAssignmentEntity> assignments = vendorAssignmentRepository.findByProjectId(projectId);
        Set<UUID> assignedVendorIds = assignments.stream().map(ProjectVendorAssignmentEntity::getVendorId).collect(Collectors.toSet());
        Map<UUID, VendorEntity> assignedVendorMap = vendorRepository.findAllById(assignedVendorIds).stream()
                .collect(Collectors.toMap(VendorEntity::getId, v -> v));

        List<VendorExpenseBreakdownDto> vendorBreakdowns = new ArrayList<>();
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal totalSettled = BigDecimal.ZERO;
        BigDecimal totalPending = BigDecimal.ZERO;

        for (ProjectVendorAssignmentEntity a : assignments) {
            VendorEntity v = assignedVendorMap.get(a.getVendorId());
            if (v == null) continue;

            String vRef = v.getVendorReference();
            List<BillApprovalEntity> vBills = billsByVendor.getOrDefault(vRef, Collections.emptyList());
            if (vBills.isEmpty()) {
                vBills = billsByVendor.getOrDefault(v.getId().toString(), Collections.emptyList());
            }

            int settledCount = 0;
            BigDecimal settledAmt = BigDecimal.ZERO;
            int pendingCount = 0;
            BigDecimal pendingAmt = BigDecimal.ZERO;

            for (BillApprovalEntity b : vBills) {
                if ("PAID_CASH".equalsIgnoreCase(b.getStatus()) || "PAID_ONLINE".equalsIgnoreCase(b.getStatus()) || "APPROVED".equalsIgnoreCase(b.getStatus())) {
                    settledCount++;
                    settledAmt = settledAmt.add(b.getAmount());
                } else {
                    pendingCount++;
                    pendingAmt = pendingAmt.add(b.getAmount());
                }
            }

            BigDecimal vendorTotal = settledAmt.add(pendingAmt);
            totalExpenses = totalExpenses.add(vendorTotal);
            totalSettled = totalSettled.add(settledAmt);
            totalPending = totalPending.add(pendingAmt);

            VendorPaymentMethodEntity vpm = paymentMethodRepository.findByVendorId(v.getId()).orElse(null);

            vendorBreakdowns.add(VendorExpenseBreakdownDto.builder()
                    .vendorId(v.getId().toString())
                    .vendorBusinessName(v.getBusinessName())
                    .tradeCategory(a.getScopeOfWork() != null ? a.getScopeOfWork() : v.getCategory())
                    .paymentMethods(vpm)
                    .settledBillsCount(settledCount)
                    .settledBillsAmount(settledAmt)
                    .pendingBillsCount(pendingCount)
                    .pendingBillsAmount(pendingAmt)
                    .totalSpending(vendorTotal)
                    .bills(vBills)
                    .build());
        }

        // Also include any vendors who have submitted bills for this project
        for (Map.Entry<String, List<BillApprovalEntity>> entry : billsByVendor.entrySet()) {
            String vKey = entry.getKey();
            boolean alreadyProcessed = vendorBreakdowns.stream()
                    .anyMatch(vb -> vb.getVendorId().equalsIgnoreCase(vKey) || vb.getVendorBusinessName().equalsIgnoreCase(vKey));
            if (!alreadyProcessed) {
                VendorEntity v = vendorRepository.findByVendorReference(vKey).orElse(null);
                if (v == null) {
                    try {
                        v = vendorRepository.findById(UUID.fromString(vKey)).orElse(null);
                    } catch (Exception ignored) {}
                }
                List<BillApprovalEntity> vBills = entry.getValue();
                int settledCount = 0;
                BigDecimal settledAmt = BigDecimal.ZERO;
                int pendingCount = 0;
                BigDecimal pendingAmt = BigDecimal.ZERO;
                for (BillApprovalEntity b : vBills) {
                    if ("PAID_CASH".equalsIgnoreCase(b.getStatus()) || "PAID_ONLINE".equalsIgnoreCase(b.getStatus()) || "APPROVED".equalsIgnoreCase(b.getStatus())) {
                        settledCount++;
                        settledAmt = settledAmt.add(b.getAmount());
                    } else {
                        pendingCount++;
                        pendingAmt = pendingAmt.add(b.getAmount());
                    }
                }
                BigDecimal vendorTotal = settledAmt.add(pendingAmt);
                totalExpenses = totalExpenses.add(vendorTotal);
                totalSettled = totalSettled.add(settledAmt);
                totalPending = totalPending.add(pendingAmt);

                VendorPaymentMethodEntity vpm = (v != null) ? paymentMethodRepository.findByVendorId(v.getId()).orElse(null) : null;
                vendorBreakdowns.add(VendorExpenseBreakdownDto.builder()
                        .vendorId(v != null ? v.getId().toString() : vKey)
                        .vendorBusinessName(v != null ? v.getBusinessName() : vKey)
                        .tradeCategory(v != null ? v.getCategory() : (vBills.isEmpty() ? "Contractor" : vBills.get(0).getTradeCategory()))
                        .paymentMethods(vpm)
                        .settledBillsCount(settledCount)
                        .settledBillsAmount(settledAmt)
                        .pendingBillsCount(pendingCount)
                        .pendingBillsAmount(pendingAmt)
                        .totalSpending(vendorTotal)
                        .bills(vBills)
                        .build());
            }
        }

        return ClientProjectExpenseSummaryDto.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .projectReference(project.getProjectReference())
                .lastVisitDate(project.getLastVisitDate())
                .clientId(project.getClientId())
                .clientName(client != null ? client.getFullName() : "Client")
                .totalProjectExpenses(totalExpenses)
                .totalSettledExpenses(totalSettled)
                .totalPendingExpenses(totalPending)
                .vendors(vendorBreakdowns)
                .build();
    }

    // ==========================================
    // 4. Vendors Directory Summary (Admin View)
    // ==========================================

    @Transactional(readOnly = true)
    public List<VendorDirectoryItemDto> getVendorDirectorySummary() {
        List<VendorEntity> vendors = vendorRepository.findAll();
        List<BillApprovalEntity> allBills = billRepository.findAll();
        List<OperationalProjectEntity> allProjects = projectRepository.findAll();
        Map<UUID, OperationalProjectEntity> projectMap = allProjects.stream().collect(Collectors.toMap(OperationalProjectEntity::getId, p -> p));
        List<ClientEntity> allClients = clientRepository.findAll();
        Map<UUID, ClientEntity> clientMap = allClients.stream().collect(Collectors.toMap(ClientEntity::getId, c -> c));

        List<ProjectVendorAssignmentEntity> allAssignments = vendorAssignmentRepository.findAll();

        return vendors.stream().map(v -> {
            List<BillApprovalEntity> vBills = allBills.stream()
                    .filter(b -> v.getVendorReference().equalsIgnoreCase(b.getVendorId()) || v.getId().toString().equalsIgnoreCase(b.getVendorId()))
                    .collect(Collectors.toList());

            BigDecimal totalBilled = vBills.stream().map(BillApprovalEntity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

            // Find client names assigned to this vendor
            Set<String> clientNames = allAssignments.stream()
                    .filter(a -> a.getVendorId().equals(v.getId()))
                    .map(a -> projectMap.get(a.getProjectId()))
                    .filter(Objects::nonNull)
                    .map(p -> clientMap.get(p.getClientId()))
                    .filter(Objects::nonNull)
                    .map(ClientEntity::getFullName)
                    .collect(Collectors.toSet());

            return VendorDirectoryItemDto.builder()
                    .vendorId(v.getId())
                    .vendorReference(v.getVendorReference())
                    .businessName(v.getBusinessName())
                    .category(v.getCategory())
                    .contactPerson(v.getContactPerson())
                    .email(v.getEmail())
                    .phone(v.getPhone())
                    .totalBilledAmount(totalBilled)
                    .totalBillsCount(vBills.size())
                    .associatedClientNames(new ArrayList<>(clientNames))
                    .build();
        }).collect(Collectors.toList());
    }

    // ==========================================
    // 5. Cash Approval Queue (Client View)
    // ==========================================

    @Transactional(readOnly = true)
    public List<BillApprovalEntity> getPendingCashApprovalsForClient(String clientId) {
        return billRepository.findAll().stream()
                .filter(b -> "CASH_REQUESTED".equalsIgnoreCase(b.getStatus()))
                .filter(b -> clientId == null || clientId.equalsIgnoreCase(b.getClientId()))
                .sorted(Comparator.comparing(BillApprovalEntity::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    // ==========================================
    // 6. Vendor My Bills
    // ==========================================

    @Transactional(readOnly = true)
    public List<BillApprovalEntity> getBillsForCurrentVendor(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        String vRef = username;
        if (user != null && user.getVendorId() != null) {
            VendorEntity v = vendorRepository.findById(user.getVendorId()).orElse(null);
            if (v != null) {
                vRef = v.getVendorReference();
            }
        }
        List<BillApprovalEntity> bills = billRepository.findByVendorIdOrderByCreatedAtDesc(vRef);
        if (bills.isEmpty() && !vRef.equals(username)) {
            bills = billRepository.findByVendorIdOrderByCreatedAtDesc(username);
        }
        if (bills.isEmpty() && user != null && ("ROLE_ADMIN".equals(user.getRole()) || "ROLE_FINANCE_MANAGER".equals(user.getRole()))) {
            bills = billRepository.findAll();
        }
        return bills;
    }

    // ==========================================
    // 7. General Bills Query (Admin & Multi-role)
    // ==========================================

    @Transactional(readOnly = true)
    public List<BillApprovalEntity> getBills(String clientId, String projectId, Authentication auth) {
        List<BillApprovalEntity> all = billRepository.findAll();
        return all.stream()
                .filter(b -> clientId == null || clientId.isBlank() || clientId.equalsIgnoreCase(b.getClientId()))
                .filter(b -> projectId == null || projectId.isBlank() || projectId.equalsIgnoreCase(b.getProjectId()))
                .sorted(Comparator.comparing(BillApprovalEntity::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }
}
