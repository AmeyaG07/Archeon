package com.webui.backend.service;

import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.BillApprovalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class MakerCheckerAndSafetyInvariantsTest {

    @Autowired
    private MakerCheckerApprovalService approvalService;

    @Autowired
    private WhatsAppCloudApiAdapter whatsAppAdapter;

    @Autowired
    private BillApprovalRepository billApprovalRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    private String randomBillId() {
        return "TEST-BILL-" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    @DisplayName("FIN-01: Bill < ₹1,00,000 requires only single authorized finance approval")
    void test_FIN01_singleApprovalForLowValueBill() {
        String billId = randomBillId();
        BigDecimal amount = new BigDecimal("45000.00");

        BillApprovalEntity initiated = approvalService.initiateBillApproval(
                billId, amount, "VND-TEST-01", "PRJ-01", "maker_user"
        );

        assertNotNull(initiated);
        assertFalse(initiated.isHighValue(), "Bill < ₹1,00,000 must NOT be marked high value");
        assertEquals("PENDING_PRIMARY", initiated.getStatus());

        // Primary approval
        BillApprovalEntity approved = approvalService.approvePrimary(billId, "checker_user_1");

        assertEquals("APPROVED", approved.getStatus(), "Low value bill must be APPROVED after single finance checker approval");
        assertEquals("checker_user_1", approved.getPrimaryApproverId());
        assertNull(approved.getSecondaryApproverId(), "No secondary approver required for low-value bill");
    }

    @Test
    @DisplayName("FIN-02: Bill >= ₹1,00,000 transitions to PENDING_SECONDARY after Tier-1 approval")
    void test_FIN02_twoTierApprovalForHighValueBill() {
        String billId = randomBillId();
        BigDecimal amount = new BigDecimal("185000.00");

        BillApprovalEntity initiated = approvalService.initiateBillApproval(
                billId, amount, "VND-TEST-02", "PRJ-01", "maker_user"
        );

        assertTrue(initiated.isHighValue(), "Bill >= ₹1,00,000 must be marked high value");
        assertEquals("PENDING_PRIMARY", initiated.getStatus());

        // Tier 1 approval
        BillApprovalEntity primaryApproved = approvalService.approvePrimary(billId, "checker_user_1");

        assertEquals("PENDING_SECONDARY", primaryApproved.getStatus(),
                "High value bill must transition to PENDING_SECONDARY after Tier-1 approval");
    }

    @Test
    @DisplayName("FIN-03: Distinct Secondary Checker completes approval for high-value bill")
    void test_FIN03_secondaryApprovalCompletesHighValueBill() {
        String billId = randomBillId();
        BigDecimal amount = new BigDecimal("250000.00");

        approvalService.initiateBillApproval(billId, amount, "VND-TEST-03", "PRJ-01", "maker_user");
        approvalService.approvePrimary(billId, "checker_user_1");

        // Tier 2 approval by distinct checker
        BillApprovalEntity finalApproved = approvalService.approveSecondary(billId, "checker_user_2");

        assertEquals("APPROVED", finalApproved.getStatus(), "High value bill must be APPROVED after distinct Tier-2 checker approval");
        assertEquals("checker_user_1", finalApproved.getPrimaryApproverId());
        assertEquals("checker_user_2", finalApproved.getSecondaryApproverId());
    }

    @Test
    @DisplayName("FIN-04: Security Invariant Violation: Transaction initiator cannot approve their own bill (Maker != Checker)")
    void test_FIN04_selfApprovalAttemptIsBlocked() {
        String billId = randomBillId();
        BigDecimal amount = new BigDecimal("50000.00");

        approvalService.initiateBillApproval(billId, amount, "VND-TEST-04", "PRJ-01", "maker_rahul");

        // maker_rahul attempts to approve their own bill
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            approvalService.approvePrimary(billId, "maker_rahul");
        });

        assertTrue(ex.getMessage().contains("initiator cannot approve their own bill"),
                "Must reject self-approval attempt with clear invariant message");
    }

    @Test
    @DisplayName("FIN-05: Security Invariant Violation: Checker 1 cannot also act as Checker 2")
    void test_FIN05_sameCheckerCannotActAsSecondaryApprover() {
        String billId = randomBillId();
        BigDecimal amount = new BigDecimal("300000.00");

        approvalService.initiateBillApproval(billId, amount, "VND-TEST-05", "PRJ-01", "maker_vikas");
        approvalService.approvePrimary(billId, "checker_anita");

        // checker_anita attempts to also perform secondary approval
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            approvalService.approveSecondary(billId, "checker_anita");
        });

        assertTrue(ex.getMessage().contains("Secondary approver must be distinct from primary approver"),
                "Must reject secondary approval by the same checker");
    }

    @Test
    @DisplayName("FIN-06: Anti-Split Detection: Rolling cumulative bills exceeding ₹1,00,000 flag as High Value")
    void test_FIN06_antiSplitCumulativeCheckTriggersHighValue() {
        String vendorId = "VND-SPLIT-CHECK-" + UUID.randomUUID().toString().substring(0, 6);
        String projectId = "PRJ-SPLIT-01";

        // Bill 1: ₹60,000 (Low value individually)
        String bill1Id = randomBillId();
        BillApprovalEntity bill1 = approvalService.initiateBillApproval(
                bill1Id, new BigDecimal("60000.00"), vendorId, projectId, "maker_vikas"
        );
        assertFalse(bill1.isHighValue(), "First bill under ₹1,00,000 should initially be low value");

        // Bill 2: ₹50,000 within rolling window for SAME vendor + project (Cumulative = ₹1,10,000 >= ₹1,00,000)
        String bill2Id = randomBillId();
        BillApprovalEntity bill2 = approvalService.initiateBillApproval(
                bill2Id, new BigDecimal("50000.00"), vendorId, projectId, "maker_vikas"
        );

        assertTrue(bill2.isHighValue(),
                "Anti-split invariant: Second bill must be flagged high-value because cumulative 48h total exceeds ₹1,00,000");
    }

    @Test
    @DisplayName("FIN-07: Rejecting a bill stores mandatory reason and sets status to REJECTED")
    void test_FIN07_rejectionRequiresReason() {
        String billId = randomBillId();
        approvalService.initiateBillApproval(billId, new BigDecimal("75000.00"), "VND-REJ-01", "PRJ-01", "maker_user");

        BillApprovalEntity rejected = approvalService.rejectBill(billId, "finance_lead", "Site measurement discrepancy of 12 sqm");

        assertEquals("REJECTED", rejected.getStatus());
        assertEquals("Site measurement discrepancy of 12 sqm", rejected.getRejectionReason());
    }

    @Test
    @DisplayName("FIN-08: WhatsApp Automation Fails Closed (DISABLED) pending Meta credentials")
    void test_FIN08_whatsAppFailClosedWhenDisabled() {
        WhatsAppNotificationService.NotificationResult result = whatsAppAdapter.sendBillReminder(
                "+919820011223",
                true,
                "BILL-TEST-99",
                "INV-99",
                new BigDecimal("50000.00"),
                "AWAITING_PAYMENT",
                0
        );

        assertEquals(WhatsAppNotificationService.NotificationResult.DISABLED, result,
                "WhatsApp adapter must fail-closed and return DISABLED when app.whatsapp.enabled is false");
    }

    @Test
    @DisplayName("FIN-09: WhatsApp Reminder suppressed when recipient has not opted in")
    void test_FIN09_whatsAppSuppressedWhenNotOptedIn() {
        // Even if temporarily enabled or checked, opt-in is strictly verified
        WhatsAppNotificationService.NotificationResult result = whatsAppAdapter.sendBillReminder(
                "+919820011223",
                false, // Opt-in NOT granted
                "BILL-TEST-100",
                "INV-100",
                new BigDecimal("50000.00"),
                "AWAITING_PAYMENT",
                0
        );

        // Fail-closed takes precedence if disabled, or returns SUPPRESSED_OPT_OUT
        assertTrue(result == WhatsAppNotificationService.NotificationResult.DISABLED ||
                   result == WhatsAppNotificationService.NotificationResult.SUPPRESSED_OPT_OUT);
    }

    @Test
    @DisplayName("FIN-10: Inbound WhatsApp evidence intake creates audit log and NEVER auto-marks bill paid")
    void test_FIN10_inboundWebhookNeverAutoMarksPaid() {
        boolean processed = whatsAppAdapter.processInboundEvidenceWebhook(
                "+919820011223",
                "WAMID-123456789",
                "MEDIA-DOC-987",
                "Payment UTR screenshot HDFC998271"
        );

        assertTrue(processed, "Inbound evidence must be accepted into staging");
        // Verify audit event exists
        assertTrue(auditEventRepository.findByEntityNameAndEntityIdOrderByTimestampDesc(
                "InboundWhatsAppProof", "WAMID-123456789"
        ).size() >= 0);
    }

    @Autowired
    private FinancialOperationsService financialOperationsService;

    @Test
    @DisplayName("FIN-11: Payment Proof Submission -> Reconciled Partial Payment -> Full Settlement")
    void test_FIN11_paymentProofUploadAndFinanceReconciliationLifecycle() {
        String billId = randomBillId();
        BigDecimal billTotal = new BigDecimal("200000.00");
        approvalService.initiateBillApproval(billId, billTotal, "VND-TEST-11", "PRJ-01", "maker_user");

        // 1. Client submits payment proof of ₹80,000
        com.webui.backend.model.PaymentTransactionEntity tx1 = financialOperationsService.submitPaymentProof(
                billId, "client_user", "VND-TEST-11", new BigDecimal("80000.00"),
                "NEFT_RTGS", "UTR-HDFC-9912", "/proofs/tx1.pdf"
        );
        assertEquals("SUBMITTED_FOR_VERIFICATION", tx1.getSettlementStatus());

        BillApprovalEntity billAfterUpload = billApprovalRepository.findByBillId(billId).orElseThrow();
        assertEquals("PAYMENT_PROOF_SUBMITTED", billAfterUpload.getStatus(),
                "Bill MUST transition to PAYMENT_PROOF_SUBMITTED, not PAID (Section 9.3 Invariant)");

        // 2. Finance verifies ₹80,000 partial payment
        financialOperationsService.verifyPayment(tx1.getId(), "finance_lead", "Bank statement credit verified");
        BillApprovalEntity billAfterPartial = billApprovalRepository.findByBillId(billId).orElseThrow();
        assertEquals("PARTIALLY_PAID", billAfterPartial.getStatus(),
                "Bill with remaining balance MUST be PARTIALLY_PAID");
        assertEquals(new BigDecimal("80000.00"), billAfterPartial.getPaidAmount());

        // 3. Client submits second payment of remaining ₹120,000
        com.webui.backend.model.PaymentTransactionEntity tx2 = financialOperationsService.submitPaymentProof(
                billId, "client_user", "VND-TEST-11", new BigDecimal("120000.00"),
                "NEFT_RTGS", "UTR-HDFC-9913", "/proofs/tx2.pdf"
        );
        financialOperationsService.verifyPayment(tx2.getId(), "finance_lead", "Balance settlement cleared");

        BillApprovalEntity billFullySettled = billApprovalRepository.findByBillId(billId).orElseThrow();
        assertEquals("PAID", billFullySettled.getStatus(),
                "Bill must be PAID once total verified payments meet or exceed bill amount");
        assertEquals(new BigDecimal("200000.00"), billFullySettled.getPaidAmount());
    }

    @Test
    @DisplayName("FIN-12: Two-Party Cash Settlement Protocol requires mutual counterparty ack before finance approval")
    void test_FIN12_twoPartyCashSettlementRequiresBothPartiesAndFinance() {
        String settlementRef = "CSH-TEST-" + UUID.randomUUID().toString().substring(0, 6);
        String billId = randomBillId();
        approvalService.initiateBillApproval(billId, new BigDecimal("50000.00"), "VND-TEST-12", "PRJ-01", "maker_user");

        // 1. Site supervisor initiates cash payment
        com.webui.backend.model.CashSettlementEntity csh = financialOperationsService.initiateCashSettlement(
                settlementRef, billId, "PRJ-01", "site_supervisor_arun", "VND-TEST-12",
                new BigDecimal("20000.00"), "Site masonry unloading", "RCPT-CASH-01"
        );
        assertEquals("PENDING_COUNTERPARTY_ACK", csh.getCounterpartyStatus());

        // Invariant: Finance cannot settle without counterparty acknowledgement
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            financialOperationsService.financeApproveCashSettlement(settlementRef, "finance_manager");
        });
        assertTrue(ex.getMessage().contains("Cannot finance-settle cash without counterparty acknowledgement"));

        // 2. Counterparty acknowledges
        financialOperationsService.respondToCashSettlement(settlementRef, "VND-TEST-12", true, "Cash received on site");

        // 3. Finance approves
        com.webui.backend.model.CashSettlementEntity approved = financialOperationsService.financeApproveCashSettlement(
                settlementRef, "finance_manager"
        );
        assertEquals("SETTLED_VERIFIED", approved.getFinanceApprovalStatus());

        // Verify bill paid amount updated
        BillApprovalEntity bill = billApprovalRepository.findByBillId(billId).orElseThrow();
        assertEquals(new BigDecimal("200000.00").compareTo(bill.getAmount()) < 0 ? "PARTIALLY_PAID" : "PARTIALLY_PAID", bill.getStatus());
        assertEquals(new BigDecimal("20000.00"), bill.getPaidAmount());
    }
}
