package com.webui.backend.controller;

import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.service.BillingExpenseService;
import com.webui.backend.service.BillingExpenseService.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/billing")
public class BillingExpenseController {

    @Autowired
    private BillingExpenseService billingExpenseService;

    // 1. Submit Bill (Vendor -> Project/Client)
    @PostMapping("/bills")
    public ResponseEntity<?> submitBill(@RequestBody SubmitBillRequest req, Authentication auth) {
        try {
            BillApprovalEntity bill = billingExpenseService.submitBill(req, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(bill);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 1b. My Submitted Bills (Vendor View)
    @GetMapping("/bills/me")
    public ResponseEntity<List<BillApprovalEntity>> getMyBills(Authentication auth) {
        return ResponseEntity.ok(billingExpenseService.getBillsForCurrentVendor(auth));
    }

    // 1c. All Bills (Admin / Multi-role View with filters)
    @GetMapping("/bills")
    public ResponseEntity<List<BillApprovalEntity>> getAllBills(
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String projectId,
            Authentication auth) {
        return ResponseEntity.ok(billingExpenseService.getBills(clientId, projectId, auth));
    }

    // 2. Request Cash Payment (Vendor Action)
    @PostMapping("/bills/{billId}/request-cash")
    public ResponseEntity<?> requestCashPayment(@PathVariable String billId, Authentication auth) {
        try {
            BillApprovalEntity bill = billingExpenseService.requestCashPayment(billId, auth);
            return ResponseEntity.ok(bill);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 3. Approve Cash Payment (Client Action)
    @PostMapping("/bills/{billId}/cash-approve")
    public ResponseEntity<?> approveCashPayment(@PathVariable String billId, Authentication auth) {
        try {
            BillApprovalEntity bill = billingExpenseService.approveCashPayment(billId, auth);
            return ResponseEntity.ok(bill);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 4. Reject Cash Payment (Client Action)
    @PostMapping("/bills/{billId}/cash-reject")
    public ResponseEntity<?> rejectCashPayment(
            @PathVariable String billId,
            @RequestBody(required = false) CashActionRequest req,
            Authentication auth) {
        try {
            BillApprovalEntity bill = billingExpenseService.rejectCashPayment(billId, req, auth);
            return ResponseEntity.ok(bill);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 4b. Submit Payment Proof (Online settlement with receipt screenshot)
    @PostMapping("/bills/{billId}/payment-proof")
    public ResponseEntity<?> submitPaymentProof(
            @PathVariable String billId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        try {
            String proofUrl = body != null ? body.get("paymentProofUrl") : null;
            BillApprovalEntity bill = billingExpenseService.submitPaymentProof(billId, proofUrl, auth);
            return ResponseEntity.ok(bill);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 4c. Direct Cash Settlement Confirmation
    @PostMapping("/bills/{billId}/direct-cash-settle")
    public ResponseEntity<?> confirmDirectCashSettlement(
            @PathVariable String billId,
            Authentication auth) {
        try {
            BillApprovalEntity bill = billingExpenseService.confirmDirectCashSettlement(billId, auth);
            return ResponseEntity.ok(bill);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 5. Client Project Expense Breakdown
    @GetMapping("/project/{projectId}/expenses")
    public ResponseEntity<?> getProjectExpenses(@PathVariable UUID projectId) {
        try {
            ClientProjectExpenseSummaryDto summary = billingExpenseService.getClientProjectExpenses(projectId);
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // 6. Cash Approval Queue (Client Portal)
    @GetMapping("/cash-queue")
    public ResponseEntity<List<BillApprovalEntity>> getCashQueue(
            @RequestParam(required = false) String clientId) {
        return ResponseEntity.ok(billingExpenseService.getPendingCashApprovalsForClient(clientId));
    }

    // 7. Vendors Directory Summary (Admin Portal)
    @GetMapping("/vendors-directory")
    public ResponseEntity<List<VendorDirectoryItemDto>> getVendorsDirectory() {
        return ResponseEntity.ok(billingExpenseService.getVendorDirectorySummary());
    }

    // 8. Notify Clients via WhatsApp about Bills
    @PostMapping("/notify-whatsapp")
    public ResponseEntity<?> notifyClientsViaWhatsApp(
            @RequestBody(required = false) Map<String, Object> req,
            Authentication auth
    ) {
        try {
            String clientId = req != null && req.get("clientId") != null ? req.get("clientId").toString() : null;
            return ResponseEntity.ok(billingExpenseService.notifyClientsAboutBillsWhatsApp(clientId, auth));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
