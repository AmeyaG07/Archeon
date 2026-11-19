package com.webui.backend.controller;

import com.webui.backend.dto.identity.InvitationDto.InvitationResponse;
import com.webui.backend.dto.identity.VendorDto.*;
import com.webui.backend.service.VendorService;
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
@RequestMapping("/api/vendors")
public class VendorController {

    @Autowired
    private VendorService vendorService;

    @PostMapping
    public ResponseEntity<?> createVendor(@RequestBody CreateVendorRequest req, Authentication auth) {
        try {
            VendorResponse response = vendorService.createVendor(req, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listVendors(Authentication auth) {
        try {
            List<VendorResponse> vendors = vendorService.listVendors(auth);
            return ResponseEntity.ok(vendors);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentVendor(Authentication auth) {
        try {
            VendorResponse vendor = vendorService.getCurrentVendorProfile(auth);
            return ResponseEntity.ok(vendor);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getVendorById(@PathVariable UUID id, Authentication auth) {
        try {
            VendorResponse vendor = vendorService.getVendorById(id, auth);
            return ResponseEntity.ok(vendor);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/ref/{reference}")
    public ResponseEntity<?> getVendorByReference(@PathVariable String reference, Authentication auth) {
        try {
            VendorResponse vendor = vendorService.getVendorByReference(reference, auth);
            return ResponseEntity.ok(vendor);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVendor(
            @PathVariable UUID id,
            @RequestBody UpdateVendorRequest req,
            Authentication auth) {
        try {
            VendorResponse updated = vendorService.updateVendor(id, req, auth);
            return ResponseEntity.ok(updated);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException | jakarta.persistence.OptimisticLockException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "The vendor record was modified concurrently by another transaction. Please reload and try again.",
                    "status", 409
            ));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateVendorStatus(
            @PathVariable UUID id,
            @RequestBody UpdateVendorStatusRequest req,
            Authentication auth) {
        try {
            VendorResponse updated = vendorService.updateVendorStatus(id, req, auth);
            return ResponseEntity.ok(updated);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException | jakarta.persistence.OptimisticLockException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "The vendor record was modified concurrently by another transaction. Please reload and try again.",
                    "status", 409
            ));
        }
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteVendor(@PathVariable UUID id, Authentication auth) {
        try {
            InvitationResponse invitation = vendorService.inviteVendor(id, auth);
            return ResponseEntity.ok(invitation);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
