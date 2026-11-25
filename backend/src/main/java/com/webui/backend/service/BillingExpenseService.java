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

    @Autowired(required = false)
    private InvoiceRepository invoiceRepository;

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
        private List<VendorProjectItemDto> linkedProjects;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VendorProjectItemDto {
        private String id;
        private String reference;
        private String name;
        private String status;
        private String scopeOfWork;
        private BigDecimal contractAmount;
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

    @Transactional
    public BillApprovalEntity submitPaymentProof(String billId, String paymentProofUrl, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        try {
            BillApprovalEntity bill = findBillByIdOrBillId(billId);
            if (paymentProofUrl != null && !paymentProofUrl.isBlank()) {
                bill.setPaymentProofUrl(paymentProofUrl);
            }
            bill.setStatus("PAID_ONLINE");
            bill.setPaidAmount(bill.getAmount());
            bill.setPaidAt(LocalDateTime.now());
            bill.setUpdatedAt(LocalDateTime.now());
            return billRepository.save(bill);
        } catch (IllegalArgumentException notFoundInBills) {
            if (invoiceRepository != null) {
                Optional<InvoiceEntity> invOpt = Optional.empty();
                try {
                    invOpt = invoiceRepository.findById(UUID.fromString(billId));
                } catch (IllegalArgumentException ignored) {
                    // Not a UUID; try invoice number lookup below
                }
                if (invOpt.isEmpty()) {
                    invOpt = invoiceRepository.findByInvoiceNumber(billId);
                }
                if (invOpt.isPresent()) {
                    InvoiceEntity inv = invOpt.get();
                    inv.setPaidAmount(inv.getTotalAmount());
                    inv.setStatus("PAID");
                    inv.setUpdatedAt(LocalDateTime.now());
                    invoiceRepository.save(inv);

                    return BillApprovalEntity.builder()
                            .billId(inv.getInvoiceNumber())
                            .invoiceNumber(inv.getInvoiceNumber())
                            .amount(inv.getTotalAmount())
                            .paidAmount(inv.getTotalAmount())
                            .currency("INR")
                            .vendorId("STUDIO")
                            .clientId(inv.getClient() != null && inv.getClient().getId() != null ? inv.getClient().getId().toString() : null)
                            .projectId(inv.getProjectId() != null ? inv.getProjectId() : "STUDIO")
                            .initiatorId(auth.getName())
                            .status("PAID_ONLINE")
                            .paymentProofUrl(paymentProofUrl)
                            .paidAt(LocalDateTime.now())
                            .build();
                }
            }
            throw notFoundInBills;
        }
    }

    @Transactional
    public BillApprovalEntity attachBillPhoto(String billId, String billPhotoUrl, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        BillApprovalEntity bill = findBillByIdOrBillId(billId);
        if (billPhotoUrl != null && !billPhotoUrl.isBlank()) {
            bill.setBillPhotoUrl(billPhotoUrl);
        }
        bill.setUpdatedAt(LocalDateTime.now());
        return billRepository.save(bill);
    }

    @Transactional
    public BillApprovalEntity confirmDirectCashSettlement(String billId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        BillApprovalEntity bill = findBillByIdOrBillId(billId);
        bill.setStatus("PAID_CASH");
        bill.setPaidAmount(bill.getAmount());
        bill.setPaidAt(LocalDateTime.now());
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
        Set<String> processedVendorKeys = new HashSet<>();
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal totalSettled = BigDecimal.ZERO;
        BigDecimal totalPending = BigDecimal.ZERO;

        for (ProjectVendorAssignmentEntity a : assignments) {
            VendorEntity v = assignedVendorMap.get(a.getVendorId());
            if (v == null || !processedVendorKeys.add(v.getId().toString().toLowerCase())) continue;

            if (v.getVendorReference() != null) processedVendorKeys.add(v.getVendorReference().toLowerCase());
            if (v.getBusinessName() != null) processedVendorKeys.add(v.getBusinessName().toLowerCase());

            List<BillApprovalEntity> vBills = new ArrayList<>();
            if (v.getVendorReference() != null && billsByVendor.containsKey(v.getVendorReference())) {
                vBills.addAll(billsByVendor.get(v.getVendorReference()));
            }
            if (billsByVendor.containsKey(v.getId().toString())) {
                vBills.addAll(billsByVendor.get(v.getId().toString()));
            }

            VendorPaymentMethodEntity vpm = paymentMethodRepository.findByVendorId(v.getId()).orElse(null);
            String categoryLabel = a.getScopeOfWork() != null ? a.getScopeOfWork() : v.getCategory();
            VendorExpenseBreakdownDto dto = buildVendorBreakdown(
                    v.getId().toString(),
                    v.getBusinessName(),
                    categoryLabel,
                    vpm,
                    vBills
            );
            vendorBreakdowns.add(dto);
            totalExpenses = totalExpenses.add(dto.getTotalSpending());
            totalSettled = totalSettled.add(dto.getSettledBillsAmount());
            totalPending = totalPending.add(dto.getPendingBillsAmount());
        }

        // Also include any un-assigned vendors who submitted bills for this project
        for (Map.Entry<String, List<BillApprovalEntity>> entry : billsByVendor.entrySet()) {
            String vKey = entry.getKey();
            if (vKey == null || processedVendorKeys.contains(vKey.toLowerCase())) {
                continue;
            }
            VendorEntity v = vendorRepository.findByVendorReference(vKey).orElse(null);
            if (v == null) {
                try {
                    v = vendorRepository.findById(UUID.fromString(vKey)).orElse(null);
                } catch (Exception ignored) {}
            }
            if (v != null && (processedVendorKeys.contains(v.getId().toString().toLowerCase())
                    || (v.getVendorReference() != null && processedVendorKeys.contains(v.getVendorReference().toLowerCase())))) {
                continue;
            }

            processedVendorKeys.add(vKey.toLowerCase());
            if (v != null) {
                processedVendorKeys.add(v.getId().toString().toLowerCase());
                if (v.getVendorReference() != null) processedVendorKeys.add(v.getVendorReference().toLowerCase());
            }

            List<BillApprovalEntity> vBills = entry.getValue();
            VendorPaymentMethodEntity vpm = (v != null) ? paymentMethodRepository.findByVendorId(v.getId()).orElse(null) : null;
            VendorExpenseBreakdownDto dto = buildVendorBreakdown(
                    v != null ? v.getId().toString() : vKey,
                    v != null ? v.getBusinessName() : vKey,
                    v != null ? v.getCategory() : (vBills.isEmpty() ? "Contractor" : vBills.get(0).getTradeCategory()),
                    vpm,
                    vBills
            );
            vendorBreakdowns.add(dto);
            totalExpenses = totalExpenses.add(dto.getTotalSpending());
            totalSettled = totalSettled.add(dto.getSettledBillsAmount());
            totalPending = totalPending.add(dto.getPendingBillsAmount());
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

    private VendorExpenseBreakdownDto buildVendorBreakdown(
            String vendorId,
            String vendorBusinessName,
            String tradeCategory,
            VendorPaymentMethodEntity paymentMethods,
            List<BillApprovalEntity> bills
    ) {
        int settledCount = 0;
        BigDecimal settledAmt = BigDecimal.ZERO;
        int pendingCount = 0;
        BigDecimal pendingAmt = BigDecimal.ZERO;

        for (BillApprovalEntity b : bills) {
            String st = b.getStatus() != null ? b.getStatus().toUpperCase(Locale.ROOT) : "";
            if ("PAID".equals(st) || "PAID_CASH".equals(st) || "PAID_ONLINE".equals(st) || "APPROVED".equals(st) || "SETTLED".equals(st)) {
                settledCount++;
                settledAmt = settledAmt.add(b.getAmount());
            } else {
                pendingCount++;
                pendingAmt = pendingAmt.add(b.getAmount());
            }
        }

        return VendorExpenseBreakdownDto.builder()
                .vendorId(vendorId)
                .vendorBusinessName(vendorBusinessName)
                .tradeCategory(tradeCategory)
                .paymentMethods(paymentMethods)
                .settledBillsCount(settledCount)
                .settledBillsAmount(settledAmt)
                .pendingBillsCount(pendingCount)
                .pendingBillsAmount(pendingAmt)
                .totalSpending(settledAmt.add(pendingAmt))
                .bills(bills)
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

            List<VendorProjectItemDto> vProjects = allAssignments.stream()
                    .filter(a -> a.getVendorId().equals(v.getId()))
                    .map(a -> {
                        OperationalProjectEntity p = projectMap.get(a.getProjectId());
                        if (p == null) return null;
                        String status = "Under Execution";
                        if ("PLANNING".equalsIgnoreCase(p.getStatus())) status = "Planning";
                        else if ("COMPLETED".equalsIgnoreCase(p.getStatus())) status = "Completed";
                        else if ("ON_HOLD".equalsIgnoreCase(p.getStatus())) status = "On Hold";
                        else if ("IN_PROGRESS".equalsIgnoreCase(p.getStatus())) status = "Under Execution";
                        return VendorProjectItemDto.builder()
                                .id(p.getId().toString())
                                .reference(p.getProjectReference())
                                .name(p.getName())
                                .status(status)
                                .scopeOfWork(a.getScopeOfWork())
                                .contractAmount(a.getContractAmount())
                                .build();
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

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
                    .linkedProjects(vProjects)
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

    // ==========================================
    // 8. WhatsApp Notification for Client Bills
    // ==========================================

    @Transactional
    public List<Map<String, Object>> notifyClientsAboutBillsWhatsApp(String targetClientId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }

        List<ClientEntity> clients;
        if (targetClientId != null && !targetClientId.isBlank()) {
            try {
                UUID cUuid = UUID.fromString(targetClientId);
                clients = clientRepository.findById(cUuid).map(List::of).orElse(Collections.emptyList());
            } catch (Exception e) {
                clients = clientRepository.findByClientReference(targetClientId).map(List::of).orElse(Collections.emptyList());
            }
        } else {
            clients = clientRepository.findAll();
        }

        List<BillApprovalEntity> allBills = billRepository.findAll();
        List<Map<String, Object>> results = new ArrayList<>();

        for (ClientEntity client : clients) {
            String cIdStr = client.getId() != null ? client.getId().toString() : "";
            String cRef = client.getClientReference() != null ? client.getClientReference() : "";

            List<BillApprovalEntity> clientBills = allBills.stream()
                    .filter(b -> (b.getClientId() != null && (b.getClientId().equalsIgnoreCase(cIdStr) || b.getClientId().equalsIgnoreCase(cRef))))
                    .collect(Collectors.toList());

            if (clientBills.isEmpty()) {
                if (clients.size() == 1) {
                    clientBills = allBills.stream()
                            .filter(b -> !"PAID_CASH".equalsIgnoreCase(b.getStatus()) && !"PAID_ONLINE".equalsIgnoreCase(b.getStatus()))
                            .collect(Collectors.toList());
                } else {
                    continue;
                }
            }

            BigDecimal totalOutstanding = BigDecimal.ZERO;
            List<String> billSummaries = new ArrayList<>();
            for (BillApprovalEntity b : clientBills) {
                BigDecimal bal = b.getAmount() != null ? b.getAmount().subtract(b.getPaidAmount() != null ? b.getPaidAmount() : BigDecimal.ZERO) : BigDecimal.ZERO;
                if (bal.compareTo(BigDecimal.ZERO) > 0) {
                    totalOutstanding = totalOutstanding.add(bal);
                    b.setLastReminderSentAt(LocalDateTime.now());
                    billRepository.save(b);
                }
                String ref = b.getInvoiceNumber() != null ? b.getInvoiceNumber() : b.getBillId();
                billSummaries.add(ref + " (₹" + (b.getAmount() != null ? b.getAmount() : 0) + ")");
            }

            String phone = client.getPhone() != null ? client.getPhone().replaceAll("[^0-9+]", "") : "+919876543210";
            if (!phone.startsWith("+") && phone.length() == 10) {
                phone = "+91" + phone;
            }

            String msg = String.format(
                    "Studio ArcheOn · Billing Update for %s\n\nDear %s,\nYour project account has %d bill(s) on record with a total outstanding balance of ₹%,.2f.\n\nBills: %s\n\nPlease review your itemized tax vouchers and records in the Client Portal: http://localhost:3000/client/invoices\n\n— MB's ArcheOn Design Studio",
                    client.getOrganization() != null ? client.getOrganization() : client.getFullName(),
                    client.getFullName(),
                    clientBills.size(),
                    totalOutstanding,
                    String.join(", ", billSummaries)
            );

            String encodedMsg = java.net.URLEncoder.encode(msg, java.nio.charset.StandardCharsets.UTF_8);
            String waLink = "https://wa.me/" + phone.replace("+", "") + "?text=" + encodedMsg;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("clientId", client.getId());
            item.put("clientName", client.getFullName());
            item.put("phone", phone);
            item.put("billCount", clientBills.size());
            item.put("totalOutstanding", totalOutstanding);
            item.put("whatsappMessage", msg);
            item.put("whatsappLink", waLink);
            item.put("status", "DISPATCHED");
            results.add(item);
        }

        return results;
    }
}
