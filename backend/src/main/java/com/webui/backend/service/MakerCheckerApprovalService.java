package com.webui.backend.service;

import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.BillApprovalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
public class MakerCheckerApprovalService {

    @Autowired
    private BillApprovalRepository billApprovalRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Value("${app.approval.high-value-threshold:100000.00}")
    private BigDecimal highValueThreshold;

    @Value("${app.approval.split-prevention-window-hours:48}")
    private int splitPreventionWindowHours;

    /**
     * Step 1: Maker submits a bill for approval.
     */
    @Transactional
    public BillApprovalEntity initiateBillApproval(String billId, BigDecimal amount, String vendorId, String projectId, String initiatorId) {
        BigDecimal safeAmount = amount.setScale(2, RoundingMode.HALF_UP);

        // Anti-split detection: Check if cumulative bills for this vendor + project within rolling window exceed threshold
        LocalDateTime windowStart = LocalDateTime.now().minusHours(splitPreventionWindowHours);
        BigDecimal recentSum = billApprovalRepository.sumRecentBillsForVendorAndProject(vendorId, projectId, windowStart);
        BigDecimal cumulativeSum = recentSum.add(safeAmount);

        boolean highValue = safeAmount.compareTo(highValueThreshold) >= 0 || cumulativeSum.compareTo(highValueThreshold) >= 0;

        BillApprovalEntity approval = BillApprovalEntity.builder()
                .billId(billId)
                .amount(safeAmount)
                .currency("INR")
                .vendorId(vendorId)
                .projectId(projectId)
                .initiatorId(initiatorId)
                .status("PENDING_PRIMARY")
                .isHighValue(highValue)
                .createdAt(LocalDateTime.now())
                .build();

        BillApprovalEntity saved = billApprovalRepository.save(approval);

        // Audit Event
        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(initiatorId)
                .actorRole("ROLE_MAKER")
                .action("BILL_INITIATED")
                .entityName("BillApproval")
                .entityId(billId)
                .detailsJson(String.format("{\"amount\": %s, \"highValue\": %s, \"cumulativeWindowSum\": %s}", safeAmount, highValue, cumulativeSum))
                .build());

        return saved;
    }

    /**
     * Step 2: Primary Finance Checker Approval.
     */
    @Transactional
    public BillApprovalEntity approvePrimary(String billId, String approverId) {
        BillApprovalEntity approval = billApprovalRepository.findByBillId(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill approval record not found: " + billId));

        // Invariant: Initiator cannot approve their own transaction
        if (approval.getInitiatorId().equals(approverId)) {
            throw new IllegalStateException("Security Invariant Violation: Transaction initiator cannot approve their own bill (Maker != Checker).");
        }

        if (!"PENDING_PRIMARY".equals(approval.getStatus())) {
            throw new IllegalStateException("Bill is not in PENDING_PRIMARY status: " + approval.getStatus());
        }

        approval.setPrimaryApproverId(approverId);
        approval.setPrimaryApprovedAt(LocalDateTime.now());
        approval.setUpdatedAt(LocalDateTime.now());

        if (approval.isHighValue()) {
            // Requires secondary approval
            approval.setStatus("PENDING_SECONDARY");
        } else {
            // Low value (< threshold): single approval is sufficient
            approval.setStatus("APPROVED");
        }

        BillApprovalEntity saved = billApprovalRepository.save(approval);

        // Audit Event
        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(approverId)
                .actorRole("ROLE_FINANCE_CHECKER_1")
                .action(approval.isHighValue() ? "PRIMARY_APPROVAL_GRANTED" : "FINAL_APPROVAL_GRANTED")
                .entityName("BillApproval")
                .entityId(billId)
                .detailsJson(String.format("{\"approver\": \"%s\", \"nextStatus\": \"%s\"}", approverId, approval.getStatus()))
                .build());

        return saved;
    }

    /**
     * Step 3: Secondary Finance Checker Approval (for High Value >= ₹1,00,000).
     */
    @Transactional
    public BillApprovalEntity approveSecondary(String billId, String approverId) {
        BillApprovalEntity approval = billApprovalRepository.findByBillId(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill approval record not found: " + billId));

        if (!approval.isHighValue()) {
            throw new IllegalStateException("Bill does not require secondary approval.");
        }

        // Invariant: Secondary approver must be distinct from both initiator and primary approver
        if (approverId.equals(approval.getInitiatorId())) {
            throw new IllegalStateException("Security Invariant Violation: Initiator cannot act as secondary approver.");
        }
        if (approverId.equals(approval.getPrimaryApproverId())) {
            throw new IllegalStateException("Security Invariant Violation: Secondary approver must be distinct from primary approver.");
        }

        if (!"PENDING_SECONDARY".equals(approval.getStatus())) {
            throw new IllegalStateException("Bill is not awaiting secondary approval: " + approval.getStatus());
        }

        approval.setSecondaryApproverId(approverId);
        approval.setSecondaryApprovedAt(LocalDateTime.now());
        approval.setStatus("APPROVED");
        approval.setUpdatedAt(LocalDateTime.now());

        BillApprovalEntity saved = billApprovalRepository.save(approval);

        // Audit Event
        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(approverId)
                .actorRole("ROLE_FINANCE_CHECKER_2")
                .action("SECONDARY_APPROVAL_GRANTED")
                .entityName("BillApproval")
                .entityId(billId)
                .detailsJson(String.format("{\"primaryApprover\": \"%s\", \"secondaryApprover\": \"%s\"}", approval.getPrimaryApproverId(), approverId))
                .build());

        return saved;
    }

    /**
     * Reject a bill with mandatory reason.
     */
    @Transactional
    public BillApprovalEntity rejectBill(String billId, String rejecterId, String reason) {
        BillApprovalEntity approval = billApprovalRepository.findByBillId(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill approval record not found: " + billId));

        approval.setStatus("REJECTED");
        approval.setRejectionReason(reason);
        approval.setUpdatedAt(LocalDateTime.now());

        BillApprovalEntity saved = billApprovalRepository.save(approval);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(rejecterId)
                .actorRole("ROLE_FINANCE")
                .action("BILL_REJECTED")
                .entityName("BillApproval")
                .entityId(billId)
                .detailsJson(String.format("{\"reason\": \"%s\"}", reason))
                .build());

        return saved;
    }
}
