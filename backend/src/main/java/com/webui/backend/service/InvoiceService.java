package com.webui.backend.service;

import com.webui.backend.dto.invoice.InvoiceDto;
import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.InvoiceEntity;
import com.webui.backend.model.InvoiceItemEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.ClientRepository;
import com.webui.backend.repository.InvoiceItemRepository;
import com.webui.backend.repository.InvoiceRepository;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private static final String STUDIO_GSTIN = "27AABCU9603R1ZM";
    private static final String STUDIO_STATE_CODE = "27"; // Maharashtra
    private static final String SAC_CODE_ARCHITECTURAL = "998321";

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final BillApprovalRepository billApprovalRepository;
    private final VendorRepository vendorRepository;
    private final InvoicePdfGeneratorService invoicePdfGeneratorService;
    private final NotificationService notificationService;

    @Transactional
    public InvoiceDto.InvoiceResponse createInvoice(InvoiceDto.CreateInvoiceRequest request, Authentication auth) {
        ClientEntity client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + request.getClientId()));

        String invoiceNumber = generateNextInvoiceNumber();

        // Calculate subtotal from line items
        BigDecimal subtotal = BigDecimal.ZERO;
        List<InvoiceItemEntity> items = new ArrayList<>();
        int sequence = 1;

        for (InvoiceDto.LineItemRequest itemReq : request.getItems()) {
            BigDecimal qty = itemReq.getQuantity() != null ? itemReq.getQuantity() : BigDecimal.ONE;
            BigDecimal unitRate = itemReq.getUnitRate();
            BigDecimal taxable = qty.multiply(unitRate).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(taxable);

            InvoiceItemEntity itemEntity = InvoiceItemEntity.builder()
                    .description(itemReq.getDescription())
                    .sacCode(itemReq.getSacCode() != null && !itemReq.getSacCode().isBlank() ? itemReq.getSacCode() : SAC_CODE_ARCHITECTURAL)
                    .quantity(qty)
                    .unitRate(unitRate)
                    .taxableAmount(taxable)
                    .sequenceOrder(sequence++)
                    .createdAt(LocalDateTime.now())
                    .build();
            items.add(itemEntity);
        }

        // Determine GST structure (Intra-state vs Inter-state)
        String clientGstin = request.getClientGstin();
        boolean isIntraState = isIntraStateTransaction(clientGstin, client.getLocation());

        BigDecimal cgstRate = BigDecimal.ZERO;
        BigDecimal cgstAmount = BigDecimal.ZERO;
        BigDecimal sgstRate = BigDecimal.ZERO;
        BigDecimal sgstAmount = BigDecimal.ZERO;
        BigDecimal igstRate = BigDecimal.ZERO;
        BigDecimal igstAmount = BigDecimal.ZERO;

        if (isIntraState) {
            cgstRate = new BigDecimal("9.00");
            cgstAmount = subtotal.multiply(BigDecimal.valueOf(0.09)).setScale(2, RoundingMode.HALF_UP);
            sgstRate = new BigDecimal("9.00");
            sgstAmount = subtotal.multiply(BigDecimal.valueOf(0.09)).setScale(2, RoundingMode.HALF_UP);
            igstRate = new BigDecimal("0.00");
            igstAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else {
            cgstRate = new BigDecimal("0.00");
            cgstAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            sgstRate = new BigDecimal("0.00");
            sgstAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            igstRate = new BigDecimal("18.00");
            igstAmount = subtotal.multiply(BigDecimal.valueOf(0.18)).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal totalAmount = subtotal.add(cgstAmount).add(sgstAmount).add(igstAmount);

        InvoiceEntity invoice = InvoiceEntity.builder()
                .invoiceNumber(invoiceNumber)
                .client(client)
                .projectId(request.getProjectId())
                .issueDate(request.getIssueDate())
                .dueDate(request.getDueDate())
                .subtotal(subtotal)
                .cgstRate(cgstRate)
                .cgstAmount(cgstAmount)
                .sgstRate(sgstRate)
                .sgstAmount(sgstAmount)
                .igstRate(igstRate)
                .igstAmount(igstAmount)
                .totalAmount(totalAmount)
                .paidAmount(BigDecimal.ZERO)
                .status("ISSUED")
                .sacCode(SAC_CODE_ARCHITECTURAL)
                .studioGstin(STUDIO_GSTIN)
                .clientGstin(clientGstin)
                .notes(request.getNotes())
                .createdAt(LocalDateTime.now())
                .build();

        for (InvoiceItemEntity item : items) {
            item.setInvoice(invoice);
        }
        invoice.setItems(items);

        InvoiceEntity saved = invoiceRepository.save(invoice);
        log.info("Created Tax Invoice {}: Client={}, Subtotal={}, Total={}, IntraState={}",
                invoiceNumber, client.getClientReference(), subtotal, totalAmount, isIntraState);

        // Notify client if email/user is registered
        notificationService.sendNotification(
                client.getEmail(),
                "New Tax Invoice: " + invoiceNumber,
                "A new tax invoice for INR " + totalAmount + " has been issued for your project. Due date: " + invoice.getDueDate(),
                "BILLING",
                "/client/invoices"
        );

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public InvoiceDto.InvoiceResponse getInvoiceById(UUID id, Authentication auth) {
        InvoiceEntity invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));
        validateClientAccess(invoice, auth);
        return toResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceDto.InvoiceResponse getInvoiceByNumber(String invoiceNumber, Authentication auth) {
        InvoiceEntity invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceNumber));
        validateClientAccess(invoice, auth);
        return toResponse(invoice);
    }

    @Transactional(readOnly = true)
    public Page<InvoiceDto.InvoiceResponse> listInvoices(
            UUID clientId, String projectId, String status, Pageable pageable, Authentication auth
    ) {
        // If caller is CLIENT, force clientId to their own account
        if (isClientRole(auth)) {
            UUID callerClientId = resolveClientIdForAuth(auth);
            return invoiceRepository.findByClientId(callerClientId, pageable).map(this::toResponse);
        }

        if (clientId != null) {
            return invoiceRepository.findByClientId(clientId, pageable).map(this::toResponse);
        } else if (projectId != null && !projectId.isBlank()) {
            return invoiceRepository.findByProjectId(projectId, pageable).map(this::toResponse);
        } else if (status != null && !status.isBlank()) {
            return invoiceRepository.findByStatus(status, pageable).map(this::toResponse);
        }
        return invoiceRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public InvoiceDto.InvoiceResponse recordPayment(UUID id, InvoiceDto.RecordPaymentRequest request, Authentication auth) {
        InvoiceEntity invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));

        BigDecimal currentPaid = invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal newPaid = currentPaid.add(request.getAmount()).setScale(2, RoundingMode.HALF_UP);

        if (newPaid.compareTo(invoice.getTotalAmount()) > 0) {
            log.warn("Payment amount INR {} exceeds outstanding INR {} for Invoice {}",
                    request.getAmount(), invoice.getOutstandingAmount(), invoice.getInvoiceNumber());
        }

        invoice.setPaidAmount(newPaid);
        if (newPaid.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus("PAID");
        } else {
            invoice.setStatus("PARTIALLY_PAID");
        }
        invoice.setUpdatedAt(LocalDateTime.now());

        InvoiceEntity updated = invoiceRepository.save(invoice);
        log.info("Recorded payment of INR {} against Invoice {}. Total Paid={}, Status={}",
                request.getAmount(), invoice.getInvoiceNumber(), newPaid, invoice.getStatus());

        // Notify client
        notificationService.sendNotification(
                invoice.getClient().getEmail(),
                "Payment Recorded for " + invoice.getInvoiceNumber(),
                "Payment of INR " + request.getAmount() + " (" + request.getPaymentMode() + ") verified. Remaining balance: INR " + updated.getOutstandingAmount(),
                "PAYMENT",
                "/client/invoices"
        );

        return toResponse(updated);
    }

    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID id, Authentication auth) {
        InvoiceEntity invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));
        validateClientAccess(invoice, auth);
        return invoicePdfGeneratorService.generateInvoicePdf(invoice);
    }

    @Transactional(readOnly = true)
    public byte[] generateBillPdf(String id, Authentication auth) {
        BillApprovalEntity bill = null;
        try {
            Long numId = Long.parseLong(id);
            bill = billApprovalRepository.findById(numId).orElse(null);
        } catch (NumberFormatException ignored) {}
        if (bill == null) {
            bill = billApprovalRepository.findByBillId(id).orElse(null);
        }
        if (bill == null) {
            bill = BillApprovalEntity.builder()
                    .billId(id.startsWith("BILL-") ? id : "BILL-" + id)
                    .vendorId("Studio Partner Contractor")
                    .amount(java.math.BigDecimal.ZERO)
                    .status("RECORDED")
                    .tradeCategory("Architectural Execution & Millwork")
                    .disputeReason("Historical settlement record: " + id)
                    .build();
        }

        String vendorName = bill.getVendorId();
        try {
            UUID vUuid = UUID.fromString(bill.getVendorId());
            VendorEntity v = vendorRepository.findById(vUuid).orElse(null);
            if (v != null) vendorName = v.getBusinessName();
        } catch (Exception ignored) {
            VendorEntity v = vendorRepository.findByVendorReference(bill.getVendorId()).orElse(null);
            if (v != null) vendorName = v.getBusinessName();
        }

        String clientName = "Client";
        if (bill.getClientId() != null) {
            try {
                UUID cUuid = UUID.fromString(bill.getClientId());
                ClientEntity c = clientRepository.findById(cUuid).orElse(null);
                if (c != null) clientName = c.getFullName();
            } catch (Exception ignored) {}
        }

        return invoicePdfGeneratorService.generateBillPdf(bill, vendorName, clientName);
    }

    private boolean isIntraStateTransaction(String clientGstin, String clientLocation) {
        if (clientGstin != null && clientGstin.trim().length() >= 2) {
            String stateCode = clientGstin.trim().substring(0, 2);
            return STUDIO_STATE_CODE.equals(stateCode);
        }
        if (clientLocation != null) {
            String loc = clientLocation.toLowerCase();
            return loc.contains("maharashtra") || loc.contains("pune") || loc.contains("mumbai") || loc.contains("nagpur") || loc.contains("nashik");
        }
        return true; // Default to intra-state if unstated
    }

    private synchronized String generateNextInvoiceNumber() {
        int year = LocalDate.now().getYear();
        String prefix = "INV-" + year + "-";
        long count = invoiceRepository.countByInvoiceNumberPrefix(prefix) + 1;
        String candidate = String.format("%s%04d", prefix, count);
        while (invoiceRepository.existsByInvoiceNumber(candidate)) {
            count++;
            candidate = String.format("%s%04d", prefix, count);
        }
        return candidate;
    }

    private void validateClientAccess(InvoiceEntity invoice, Authentication auth) {
        if (auth == null) return;
        if (isAdminOrFinance(auth)) return;

        if (isClientRole(auth)) {
            UUID callerClientId = resolveClientIdForAuth(auth);
            if (invoice.getClient() == null || !invoice.getClient().getId().equals(callerClientId)) {
                throw new AccessDeniedException("Access denied: Invoice does not belong to authenticated client");
            }
        }
    }

    private boolean isAdminOrFinance(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("ROLE_FINANCE_MANAGER") ||
                a.getAuthority().equals("ROLE_FINANCE_CHECKER")
        );
    }

    private boolean isClientRole(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"));
    }

    private UUID resolveClientIdForAuth(Authentication auth) {
        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username).orElse(null);

        if (user != null && user.getClientId() != null) {
            ClientEntity client = clientRepository.findById(user.getClientId())
                    .orElseThrow(() -> new AccessDeniedException("Active client organization not found for account: " + username));
            return client.getId();
        }

        if (user != null && user.getEmail() != null) {
            Optional<ClientEntity> clientByEmail = clientRepository.findByEmail(user.getEmail());
            if (clientByEmail.isPresent()) {
                return clientByEmail.get().getId();
            }
        }

        return clientRepository.findByClientReference(username)
                .or(() -> clientRepository.findByEmail(username))
                .map(ClientEntity::getId)
                .orElseThrow(() -> new AccessDeniedException("Client profile not found for principal: " + username));
    }

    private InvoiceDto.InvoiceResponse toResponse(InvoiceEntity invoice) {
        List<InvoiceDto.LineItemResponse> itemResponses = invoice.getItems() != null
                ? invoice.getItems().stream().map(this::toItemResponse).collect(Collectors.toList())
                : new ArrayList<>();

        return InvoiceDto.InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .clientId(invoice.getClient() != null ? invoice.getClient().getId() : null)
                .clientName(invoice.getClient() != null ? invoice.getClient().getFullName() : null)
                .clientEmail(invoice.getClient() != null ? invoice.getClient().getEmail() : null)
                .clientGstin(invoice.getClientGstin())
                .projectId(invoice.getProjectId())
                .issueDate(invoice.getIssueDate())
                .dueDate(invoice.getDueDate())
                .subtotal(invoice.getSubtotal())
                .cgstRate(invoice.getCgstRate())
                .cgstAmount(invoice.getCgstAmount())
                .sgstRate(invoice.getSgstRate())
                .sgstAmount(invoice.getSgstAmount())
                .igstRate(invoice.getIgstRate())
                .igstAmount(invoice.getIgstAmount())
                .totalAmount(invoice.getTotalAmount())
                .paidAmount(invoice.getPaidAmount())
                .outstandingAmount(invoice.getOutstandingAmount())
                .status(invoice.getStatus())
                .sacCode(invoice.getSacCode())
                .studioGstin(invoice.getStudioGstin())
                .notes(invoice.getNotes())
                .items(itemResponses)
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .version(invoice.getVersion())
                .build();
    }

    private InvoiceDto.LineItemResponse toItemResponse(InvoiceItemEntity item) {
        return InvoiceDto.LineItemResponse.builder()
                .id(item.getId())
                .description(item.getDescription())
                .sacCode(item.getSacCode())
                .quantity(item.getQuantity())
                .unitRate(item.getUnitRate())
                .taxableAmount(item.getTaxableAmount())
                .sequenceOrder(item.getSequenceOrder())
                .build();
    }
}
