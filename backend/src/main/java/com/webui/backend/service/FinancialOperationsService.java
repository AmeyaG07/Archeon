package com.webui.backend.service;

import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.model.CashSettlementEntity;
import com.webui.backend.model.PaymentTransactionEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.CashSettlementRepository;
import com.webui.backend.repository.PaymentTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FinancialOperationsService {

    @Autowired
    private BillApprovalRepository billApprovalRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private CashSettlementRepository cashSettlementRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    /**
     * BOLA / Object-Level Authorization Protection (FINDING-03)
     * Verifies that the authenticated principal is an authorized party for the bill.
     */
    public void validateBillAccess(
            BillApprovalEntity bill,
            String actorId,
            java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> authorities) {

        if (actorId == null || actorId.trim().isEmpty()) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: Unauthenticated user.");
        }

        // 1. Studio internal staff (ADMIN, FINANCE_*, STAFF) have studio-wide authorization
        if (authorities != null) {
            boolean isInternalStaff = authorities.stream().anyMatch(a ->
                    a.getAuthority().equals("ROLE_ADMIN") ||
                    a.getAuthority().equals("ROLE_FINANCE_MANAGER") ||
                    a.getAuthority().equals("ROLE_FINANCE_LEAD") ||
                    a.getAuthority().equals("ROLE_FINANCE_CHECKER") ||
                    a.getAuthority().equals("ROLE_FINANCE_CHECKER_1") ||
                    a.getAuthority().equals("ROLE_FINANCE_CHECKER_2") ||
                    a.getAuthority().equals("ROLE_FINANCE_MAKER") ||
                    a.getAuthority().equals("ROLE_STAFF"));
            if (isInternalStaff) {
                return;
            }
        }

        // 2. Bill initiator (maker)
        if (bill.getInitiatorId() != null && bill.getInitiatorId().equalsIgnoreCase(actorId)) {
            return;
        }

        // 3. Designated Vendor
        if (bill.getVendorId() != null && bill.getVendorId().equalsIgnoreCase(actorId)) {
            return;
        }

        // 4. Designated Client (Explicit verified ownership only; NO first-access binding)
        if (bill.getClientId() != null && bill.getClientId().equalsIgnoreCase(actorId)) {
            return;
        }

        // 5. Client who has an existing payment transaction recorded on this bill
        boolean hasExistingTransaction = paymentTransactionRepository.findByBillIdOrderByCreatedAtDesc(bill.getBillId())
                .stream().anyMatch(tx -> tx.getPayerId() != null && tx.getPayerId().equalsIgnoreCase(actorId));
        if (hasExistingTransaction) {
            return;
        }

        // Unassigned legacy bills (clientId == null) and unauthorized third parties are strictly denied access
        throw new org.springframework.security.access.AccessDeniedException(
                "Access denied: Principal '" + actorId + "' is not authorized to access or mutate bill " + bill.getBillId());
    }

    /**
     * Client or vendor uploads payment proof (UTR / receipt).
     * INVARIANT (Section 9.3): Never marks PAID from screenshot; creates PENDING verification record.
     */
    @Transactional
    public PaymentTransactionEntity submitPaymentProof(
            String billId, String payerId, String payeeId, BigDecimal amount,
            String paymentMode, String utrNumber, String proofUrl) {
        return submitPaymentProof(billId, payerId, payeeId, amount, paymentMode, utrNumber, proofUrl, null);
    }

    @Transactional
    public PaymentTransactionEntity submitPaymentProof(
            String billId, String payerId, String payeeId, BigDecimal amount,
            String paymentMode, String utrNumber, String proofUrl,
            java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> authorities) {

        BillApprovalEntity bill = billApprovalRepository.findByBillId(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + billId));

        validateBillAccess(bill, payerId, authorities);

        BigDecimal safeAmount = amount.setScale(2, RoundingMode.HALF_UP);

        PaymentTransactionEntity tx = PaymentTransactionEntity.builder()
                .billId(billId)
                .payerId(payerId)
                .payeeId(payeeId != null ? payeeId : bill.getVendorId())
                .amount(safeAmount)
                .currency("INR")
                .paymentMode(paymentMode != null ? paymentMode : "UPI")
                .transactionReference(utrNumber)
                .proofAttachmentUrl(proofUrl)
                .settlementStatus("SUBMITTED_FOR_VERIFICATION")
                .paymentDate(LocalDateTime.now())
                .build();

        PaymentTransactionEntity savedTx = paymentTransactionRepository.save(tx);

        // Transition bill status to PAYMENT_PROOF_SUBMITTED (never auto-marked PAID)
        bill.setStatus("PAYMENT_PROOF_SUBMITTED");
        bill.setPaymentProofUtr(utrNumber);
        bill.setPaymentProofUrl(proofUrl);
        bill.setUpdatedAt(LocalDateTime.now());
        billApprovalRepository.save(bill);

        // Audit Event
        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(payerId)
                .actorRole("ROLE_PAYER")
                .action("PAYMENT_PROOF_SUBMITTED")
                .entityName("PaymentTransaction")
                .entityId(savedTx.getId().toString())
                .detailsJson(String.format("{\"billId\": \"%s\", \"amount\": %s, \"utr\": \"%s\"}", billId, safeAmount, utrNumber))
                .build());

        return savedTx;
    }

    /**
     * Finance reconciles with bank/statement and validates payment.
     * Recalculates balance: PARTIALLY_PAID or PAID.
     */
    @Transactional
    public PaymentTransactionEntity verifyPayment(UUID transactionId, String verifierId, String notes) {
        PaymentTransactionEntity tx = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));

        tx.setSettlementStatus("VERIFIED_PAID");
        tx.setVerifiedBy(verifierId);
        tx.setVerifiedAt(LocalDateTime.now());
        tx.setVerificationNotes(notes);
        PaymentTransactionEntity savedTx = paymentTransactionRepository.save(tx);

        // Recalculate bill balance
        BillApprovalEntity bill = billApprovalRepository.findByBillId(tx.getBillId())
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + tx.getBillId()));

        BigDecimal totalVerified = paymentTransactionRepository.sumVerifiedPaymentsForBill(bill.getBillId());
        bill.setPaidAmount(totalVerified);

        BigDecimal remainingBalance = bill.getAmount().subtract(totalVerified);
        if (remainingBalance.compareTo(BigDecimal.ZERO) <= 0) {
            bill.setStatus("PAID");
        } else {
            bill.setStatus("PARTIALLY_PAID");
        }
        bill.setUpdatedAt(LocalDateTime.now());
        billApprovalRepository.save(bill);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(verifierId)
                .actorRole("ROLE_FINANCE")
                .action("PAYMENT_VERIFIED")
                .entityName("BillApproval")
                .entityId(bill.getBillId())
                .detailsJson(String.format("{\"verifiedAmount\": %s, \"remainingBalance\": %s, \"status\": \"%s\"}",
                        totalVerified, remainingBalance, bill.getStatus()))
                .build());

        return savedTx;
    }

    /**
     * Open dispute against a bill (Section 11.3).
     * Pauses automated reminders immediately.
     */
    @Transactional
    public BillApprovalEntity openDispute(String billId, String disputedBy, String reason) {
        return openDispute(billId, disputedBy, reason, null);
    }

    @Transactional
    public BillApprovalEntity openDispute(
            String billId, String disputedBy, String reason,
            java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> authorities) {

        BillApprovalEntity bill = billApprovalRepository.findByBillId(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + billId));

        validateBillAccess(bill, disputedBy, authorities);

        bill.setDisputed(true);
        bill.setDisputeReason(reason);
        bill.setStatus("DISPUTED");
        bill.setUpdatedAt(LocalDateTime.now());
        BillApprovalEntity saved = billApprovalRepository.save(bill);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(disputedBy)
                .actorRole("ROLE_CLIENT_OR_VENDOR")
                .action("BILL_DISPUTED")
                .entityName("BillApproval")
                .entityId(billId)
                .detailsJson(String.format("{\"reason\": \"%s\", \"remindersPaused\": true}", reason))
                .build());

        return saved;
    }

    /**
     * Authorized payment transaction lookup for a bill (FINDING-03).
     */
    @Transactional(readOnly = true)
    public List<PaymentTransactionEntity> getTransactionsForBill(
            String billId, String actorId,
            java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> authorities) {

        BillApprovalEntity bill = billApprovalRepository.findByBillId(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + billId));

        validateBillAccess(bill, actorId, authorities);

        return paymentTransactionRepository.findByBillIdOrderByCreatedAtDesc(billId);
    }

    /**
     * Section 11: Two-Party Cash Settlement Protocol
     */
    @Transactional
    public CashSettlementEntity initiateCashSettlement(
            String settlementRef, String billId, String projectId,
            String initiatorId, String counterpartyId, BigDecimal amount,
            String sitePurpose, String receiptRef) {

        CashSettlementEntity csh = CashSettlementEntity.builder()
                .settlementRef(settlementRef)
                .billId(billId)
                .projectId(projectId)
                .initiatorId(initiatorId)
                .counterpartyId(counterpartyId)
                .amount(amount.setScale(2, RoundingMode.HALF_UP))
                .currency("INR")
                .sitePurpose(sitePurpose)
                .receiptReference(receiptRef)
                .counterpartyStatus("PENDING_COUNTERPARTY_ACK")
                .financeApprovalStatus("PENDING_FINANCE_REVIEW")
                .build();

        CashSettlementEntity saved = cashSettlementRepository.save(csh);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(initiatorId)
                .actorRole("ROLE_SITE_SUPERVISOR")
                .action("CASH_SETTLEMENT_INITIATED")
                .entityName("CashSettlement")
                .entityId(settlementRef)
                .detailsJson(String.format("{\"amount\": %s, \"counterparty\": \"%s\"}", amount, counterpartyId))
                .build());

        return saved;
    }

    @Transactional
    public CashSettlementEntity respondToCashSettlement(
            String settlementRef, String counterpartyId, boolean acknowledge, String notes) {

        CashSettlementEntity csh = cashSettlementRepository.findBySettlementRef(settlementRef)
                .orElseThrow(() -> new IllegalArgumentException("Cash settlement not found: " + settlementRef));

        if (!csh.getCounterpartyId().equals(counterpartyId)) {
            throw new IllegalStateException("Only assigned counterparty can respond to cash settlement");
        }

        // FINDING-04: Prevent modifying already settled or rejected vouchers
        if ("SETTLED_VERIFIED".equalsIgnoreCase(csh.getFinanceApprovalStatus())) {
            throw new IllegalStateException("Cash settlement is already finalized and settled; counterparty response cannot be altered.");
        }
        if ("REJECTED".equalsIgnoreCase(csh.getFinanceApprovalStatus())) {
            throw new IllegalStateException("Cash settlement has been rejected by finance; counterparty response cannot be altered.");
        }

        // Prevent duplicate state transitions
        String targetStatus = acknowledge ? "ACKNOWLEDGED" : "REJECTED_CONTESTED";
        if (targetStatus.equalsIgnoreCase(csh.getCounterpartyStatus())) {
            throw new IllegalStateException("Cash settlement is already in status: " + targetStatus);
        }

        csh.setCounterpartyStatus(targetStatus);
        csh.setCounterpartyRespondedAt(LocalDateTime.now());
        csh.setCounterpartyNotes(notes);

        CashSettlementEntity saved = cashSettlementRepository.save(csh);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(counterpartyId)
                .actorRole("ROLE_COUNTERPARTY")
                .action(acknowledge ? "CASH_ACKNOWLEDGED" : "CASH_CONTESTED")
                .entityName("CashSettlement")
                .entityId(settlementRef)
                .detailsJson(String.format("{\"status\": \"%s\", \"notes\": \"%s\"}", csh.getCounterpartyStatus(), notes))
                .build());

        return saved;
    }

    @Transactional
    public CashSettlementEntity financeApproveCashSettlement(String settlementRef, String financeApproverId) {
        CashSettlementEntity csh = cashSettlementRepository.findBySettlementRef(settlementRef)
                .orElseThrow(() -> new IllegalArgumentException("Cash settlement not found: " + settlementRef));

        if (!"ACKNOWLEDGED".equals(csh.getCounterpartyStatus())) {
            throw new IllegalStateException("Cannot finance-settle cash without counterparty acknowledgement");
        }

        csh.setFinanceApprovalStatus("SETTLED_VERIFIED");
        csh.setFinanceApproverId(financeApproverId);
        csh.setFinanceApprovedAt(LocalDateTime.now());
        CashSettlementEntity saved = cashSettlementRepository.save(csh);

        // Record a verified PaymentTransaction for Cash
        PaymentTransactionEntity tx = PaymentTransactionEntity.builder()
                .billId(csh.getBillId())
                .payerId(csh.getInitiatorId())
                .payeeId(csh.getCounterpartyId())
                .amount(csh.getAmount())
                .currency("INR")
                .paymentMode("CASH")
                .transactionReference(settlementRef)
                .settlementStatus("VERIFIED_PAID")
                .verifiedBy(financeApproverId)
                .verifiedAt(LocalDateTime.now())
                .verificationNotes("Two-Party Cash Mutual Acknowledgement Verified by Studio Finance")
                .build();
        paymentTransactionRepository.save(tx);

        // Recalculate bill balance
        billApprovalRepository.findByBillId(csh.getBillId()).ifPresent(bill -> {
            BigDecimal totalVerified = paymentTransactionRepository.sumVerifiedPaymentsForBill(bill.getBillId());
            bill.setPaidAmount(totalVerified);
            BigDecimal remainingBalance = bill.getAmount().subtract(totalVerified);
            if (remainingBalance.compareTo(BigDecimal.ZERO) <= 0) {
                bill.setStatus("PAID");
            } else {
                bill.setStatus("PARTIALLY_PAID");
            }
            bill.setUpdatedAt(LocalDateTime.now());
            billApprovalRepository.save(bill);
        });

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(financeApproverId)
                .actorRole("ROLE_FINANCE")
                .action("CASH_FINANCE_SETTLED")
                .entityName("CashSettlement")
                .entityId(settlementRef)
                .detailsJson(String.format("{\"amount\": %s, \"billId\": \"%s\"}", csh.getAmount(), csh.getBillId()))
                .build());

        return saved;
    }
}
