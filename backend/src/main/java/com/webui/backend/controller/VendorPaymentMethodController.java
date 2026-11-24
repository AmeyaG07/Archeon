package com.webui.backend.controller;

import com.webui.backend.model.VendorPaymentMethodEntity;
import com.webui.backend.service.VendorPaymentMethodService;
import com.webui.backend.service.VendorPaymentMethodService.SavePaymentMethodRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/vendor-payment-methods")
public class VendorPaymentMethodController {

    @Autowired
    private VendorPaymentMethodService paymentMethodService;

    @GetMapping("/me")
    public ResponseEntity<?> getMyPaymentMethod(Authentication auth) {
        try {
            return paymentMethodService.getPaymentMethodForCurrentVendor(auth)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.noContent().build());
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyPaymentMethod(@RequestBody SavePaymentMethodRequest req, Authentication auth) {
        try {
            VendorPaymentMethodEntity entity = paymentMethodService.savePaymentMethodForCurrentVendor(req, auth);
            return ResponseEntity.ok(entity);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<?> getByVendorId(@PathVariable UUID vendorId) {
        return paymentMethodService.getPaymentMethodByVendorId(vendorId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/vendor/{vendorId}")
    public ResponseEntity<?> updatePaymentMethodForVendor(
            @PathVariable UUID vendorId,
            @RequestBody SavePaymentMethodRequest req,
            Authentication auth) {
        try {
            VendorPaymentMethodEntity entity = paymentMethodService.savePaymentMethodForAdmin(vendorId, req, auth);
            return ResponseEntity.ok(entity);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
