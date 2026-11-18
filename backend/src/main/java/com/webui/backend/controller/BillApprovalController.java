package com.webui.backend.controller;

import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.service.MakerCheckerApprovalService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/approvals")
public class BillApprovalController {

    @Autowired
    private MakerCheckerApprovalService approvalService;

    @Autowired
    private BillApprovalRepository billApprovalRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Value("${app.approval.high-value-threshold:100000.00}")
    private BigDecimal highValueThreshold;

    @Value("${app.approval.status:PROVISIONAL (PENDING BUSINESS APPROVAL)}")
    private String approvalPolicyStatus;

    @Value("${app.legal.brand-name}")
    private String brandName;

    @Value("${app.legal.legal-entity-name}")
    private String legalEntityName;

    @Value("${app.legal.gstin}")
    private String gstin;

    @Data
    public static class InitiateRequest {
        private String billId;
        private BigDecimal amount;
        private String vendorId;
        private String clientId;
        private String projectId;
    }

    @Data
    public static class RejectRequest {
        private String reason;
    }

    @GetMapping("/config")
    public ResponseEntity<?> getApprovalPolicyConfig() {
        return ResponseEntity.ok(Map.of(
                "brandName", brandName,
                "legalEntityName", legalEntityName,
                "gstin", gstin,
                "highValueThreshold", highValueThreshold,
                "currency", "INR",
                "policyStatus", approvalPolicyStatus,
                "makerCheckerRule", "Transactions < ₹1,00,000 require 1 finance approval. Transactions >= ₹1,00,000 require 2 distinct finance approvals. Initiator cannot approve."
        ));
    }

    @PostMapping("/initiate")
    public ResponseEntity<?> initiate(@RequestBody InitiateRequest request, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String actor = auth.getName();
        BillApprovalEntity approval = approvalService.initiateBillApproval(
                request.getBillId(), request.getAmount(), request.getVendorId(), request.getClientId(), request.getProjectId(), actor);
        return ResponseEntity.ok(approval);
    }

    @PostMapping("/{billId}/approve-primary")
    public ResponseEntity<?> approvePrimary(@PathVariable String billId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String approver = auth.getName();
        try {
            BillApprovalEntity approval = approvalService.approvePrimary(billId, approver);
            return ResponseEntity.ok(approval);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{billId}/approve-secondary")
    public ResponseEntity<?> approveSecondary(@PathVariable String billId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String approver = auth.getName();
        try {
            BillApprovalEntity approval = approvalService.approveSecondary(billId, approver);
            return ResponseEntity.ok(approval);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{billId}/reject")
    public ResponseEntity<?> reject(@PathVariable String billId, @RequestBody RejectRequest request, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        String rejecter = auth.getName();
        BillApprovalEntity approval = approvalService.rejectBill(billId, rejecter, request.getReason());
        return ResponseEntity.ok(approval);
    }

    @GetMapping("/all")
    public ResponseEntity<List<BillApprovalEntity>> getAllApprovals() {
        return ResponseEntity.ok(billApprovalRepository.findAll());
    }

    @GetMapping("/{billId}")
    public ResponseEntity<?> getApprovalStatus(@PathVariable String billId) {
        return billApprovalRepository.findByBillId(billId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{billId}/audit")
    public ResponseEntity<List<AuditEventEntity>> getAuditTrail(@PathVariable String billId) {
        List<AuditEventEntity> events = auditEventRepository.findByEntityNameAndEntityIdOrderByTimestampDesc("BillApproval", billId);
        return ResponseEntity.ok(events);
    }
}
