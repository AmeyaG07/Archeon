package com.webui.backend.controller;

import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.model.CashSettlementEntity;
import com.webui.backend.model.PaymentTransactionEntity;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.CashSettlementRepository;
import com.webui.backend.repository.PaymentTransactionRepository;
import com.webui.backend.service.FinancialOperationsService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "*")
public class FinancialOperationsController {

    @Autowired
    private FinancialOperationsService financialOperationsService;

    @Autowired
    private BillApprovalRepository billApprovalRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private CashSettlementRepository cashSettlementRepository;

    @Data
    public static class ProofSubmissionRequest {
        private String billId;
        private String payerId;
        private String payeeId;
        private BigDecimal amount;
        private String paymentMode;
        private String utrNumber;
        private String proofUrl;
    }

    @Data
    public static class VerificationRequest {
        private String notes;
    }

    @Data
    public static class DisputeRequest {
        private String billId;
        private String reason;
    }

    @Data
    public static class CashInitiateRequest {
        private String settlementRef;
        private String billId;
        private String projectId;
        private String counterpartyId;
        private BigDecimal amount;
        private String sitePurpose;
        private String receiptRef;
    }

    @Data
    public static class CashResponseRequest {
        private boolean acknowledge;
        private String notes;
    }

    @PostMapping("/payment-proof")
    public ResponseEntity<?> submitProof(@RequestBody ProofSubmissionRequest req, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String actor = auth.getName();
        try {
            PaymentTransactionEntity tx = financialOperationsService.submitPaymentProof(
                    req.getBillId(), actor, req.getPayeeId(), req.getAmount(),
                    req.getPaymentMode(), req.getUtrNumber(), req.getProofUrl(),
                    auth.getAuthorities()
            );
            return ResponseEntity.ok(tx);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-payment/{transactionId}")
    public ResponseEntity<?> verifyPayment(
            @PathVariable UUID transactionId,
            @RequestBody(required = false) VerificationRequest req,
            Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String verifier = auth.getName();
        String notes = req != null && req.getNotes() != null ? req.getNotes() : "Reconciled with HDFC bank statement";
        try {
            PaymentTransactionEntity tx = financialOperationsService.verifyPayment(transactionId, verifier, notes);
            return ResponseEntity.ok(tx);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/dispute")
    public ResponseEntity<?> disputeBill(@RequestBody DisputeRequest req, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String actor = auth.getName();
        try {
            BillApprovalEntity bill = financialOperationsService.openDispute(req.getBillId(), actor, req.getReason(), auth.getAuthorities());
            return ResponseEntity.ok(bill);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cash/initiate")
    public ResponseEntity<?> initiateCash(@RequestBody CashInitiateRequest req, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String initiator = auth.getName();
        try {
            CashSettlementEntity csh = financialOperationsService.initiateCashSettlement(
                    req.getSettlementRef(), req.getBillId(), req.getProjectId(),
                    initiator, req.getCounterpartyId(), req.getAmount(),
                    req.getSitePurpose(), req.getReceiptRef()
            );
            return ResponseEntity.ok(csh);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cash/{ref}/respond")
    public ResponseEntity<?> respondCash(
            @PathVariable String ref,
            @RequestBody CashResponseRequest req,
            Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String counterparty = auth.getName();
        try {
            CashSettlementEntity csh = financialOperationsService.respondToCashSettlement(
                    ref, counterparty, req.isAcknowledge(), req.getNotes()
            );
            return ResponseEntity.ok(csh);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cash/{ref}/approve")
    public ResponseEntity<?> approveCash(@PathVariable String ref, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String approver = auth.getName();
        try {
            CashSettlementEntity csh = financialOperationsService.financeApproveCashSettlement(ref, approver);
            return ResponseEntity.ok(csh);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/cash/all")
    public ResponseEntity<List<CashSettlementEntity>> getAllCashSettlements() {
        return ResponseEntity.ok(cashSettlementRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping({"/transactions/{billId}", "/bills/{billId}/transactions"})
    public ResponseEntity<?> getTransactionsForBill(@PathVariable String billId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        try {
            List<PaymentTransactionEntity> txs = financialOperationsService.getTransactionsForBill(
                    billId, auth.getName(), auth.getAuthorities());
            return ResponseEntity.ok(txs);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Section 12.3: Aging Receivables Report
     */
    @GetMapping("/reports/aging-receivables")
    public ResponseEntity<?> getAgingReceivables() {
        List<BillApprovalEntity> bills = billApprovalRepository.findAll();

        BigDecimal bucketUnder30 = BigDecimal.ZERO;
        BigDecimal bucket30to60 = BigDecimal.ZERO;
        BigDecimal bucketOver60 = BigDecimal.ZERO;
        BigDecimal totalOutstanding = BigDecimal.ZERO;

        LocalDateTime now = LocalDateTime.now();

        for (BillApprovalEntity b : bills) {
            BigDecimal outstanding = b.getAmount().subtract(b.getPaidAmount() != null ? b.getPaidAmount() : BigDecimal.ZERO);
            if (outstanding.compareTo(BigDecimal.ZERO) <= 0) continue;

            totalOutstanding = totalOutstanding.add(outstanding);
            long days = ChronoUnit.DAYS.between(b.getCreatedAt(), now);

            if (days < 30) {
                bucketUnder30 = bucketUnder30.add(outstanding);
            } else if (days <= 60) {
                bucket30to60 = bucket30to60.add(outstanding);
            } else {
                bucketOver60 = bucketOver60.add(outstanding);
            }
        }

        return ResponseEntity.ok(Map.of(
                "currency", "INR",
                "totalOutstanding", totalOutstanding,
                "currentUnder30Days", bucketUnder30,
                "aging30To60Days", bucket30to60,
                "overdueOver60Days", bucketOver60,
                "totalBillsAudited", bills.size()
        ));
    }

    /**
     * Section 12.4: CSV Export with timestamp and user identity
     */
    @GetMapping("/reports/export-bills-csv")
    public ResponseEntity<byte[]> exportBillsCsv(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String actor = auth.getName();
        List<BillApprovalEntity> bills = billApprovalRepository.findAll();

        StringBuilder csv = new StringBuilder();
        csv.append("Export Timestamp: ").append(LocalDateTime.now()).append(", Exported By: ").append(actor).append("\n");
        csv.append("Bill ID,Invoice No,Vendor ID,Project ID,Bill Type,Total Amount (INR),Paid Amount (INR),Outstanding (INR),Status,Disputed,Created At\n");

        for (BillApprovalEntity b : bills) {
            BigDecimal paid = b.getPaidAmount() != null ? b.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal out = b.getAmount().subtract(paid);
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%.2f,%.2f,%.2f,\"%s\",%s,\"%s\"\n",
                    b.getBillId(),
                    b.getInvoiceNumber() != null ? b.getInvoiceNumber() : "",
                    b.getVendorId(),
                    b.getProjectId(),
                    b.getBillType(),
                    b.getAmount(),
                    paid,
                    out,
                    b.getStatus(),
                    b.isDisputed(),
                    b.getCreatedAt()
            ));
        }

        byte[] bytes = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"archeon_bills_export_" + System.currentTimeMillis() + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
