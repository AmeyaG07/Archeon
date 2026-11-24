package com.webui.backend.controller;

import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.service.WhatsAppAutomationService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/whatsapp")
public class WhatsAppWebhookController {

    @Autowired
    private WhatsAppAutomationService whatsAppService;

    @Data
    public static class WhatsAppIncomingPayload {
        private String from;
        private String billId;
        private String screenshotUrl;
        private String caption;
    }

    @PostMapping
    public ResponseEntity<?> handleIncomingWebhook(@RequestBody WhatsAppIncomingPayload payload) {
        if (payload.getBillId() == null || payload.getBillId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "billId is required for payment reconciliation"));
        }
        if (payload.getScreenshotUrl() == null || payload.getScreenshotUrl().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "screenshotUrl is required"));
        }

        try {
            BillApprovalEntity reconciled = whatsAppService.reconcilePaymentScreenshot(
                    payload.getBillId(), payload.getScreenshotUrl()
            );
            return ResponseEntity.ok(Map.of(
                    "status", "RECONCILED",
                    "billId", reconciled.getBillId(),
                    "billStatus", reconciled.getStatus(),
                    "paymentProofUrl", reconciled.getPaymentProofUrl() != null ? reconciled.getPaymentProofUrl() : ""
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
