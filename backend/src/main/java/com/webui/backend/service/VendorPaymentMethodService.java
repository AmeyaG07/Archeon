package com.webui.backend.service;

import com.webui.backend.model.UserEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.model.VendorPaymentMethodEntity;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.repository.VendorPaymentMethodRepository;
import com.webui.backend.repository.VendorRepository;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class VendorPaymentMethodService {

    @Autowired
    private VendorPaymentMethodRepository paymentMethodRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private UserRepository userRepository;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SavePaymentMethodRequest {
        private String accountHolderName;
        private String bankName;
        private String accountNumber;
        private String ifscCode;
        private String upiId;
        private String qrCodeUrl;
    }

    private UUID resolveVendorId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("User not found: " + username));

        if (user.getVendorId() != null) {
            return user.getVendorId();
        }

        // If user is admin/staff or has vendor ref
        VendorEntity vendor = vendorRepository.findByEmail(user.getEmail() != null ? user.getEmail() : "")
                .orElse(null);
        if (vendor != null) {
            return vendor.getId();
        }

        throw new AccessDeniedException("User is not associated with a registered vendor account");
    }

    @Transactional
    public VendorPaymentMethodEntity savePaymentMethodForCurrentVendor(SavePaymentMethodRequest req, Authentication auth) {
        UUID vendorId = resolveVendorId(auth);
        return savePaymentMethod(vendorId, req);
    }

    @Transactional
    public VendorPaymentMethodEntity savePaymentMethod(UUID vendorId, SavePaymentMethodRequest req) {
        VendorPaymentMethodEntity existing = paymentMethodRepository.findByVendorId(vendorId).orElse(null);

        if (existing == null) {
            existing = VendorPaymentMethodEntity.builder()
                    .vendorId(vendorId)
                    .accountHolderName(req.getAccountHolderName())
                    .bankName(req.getBankName())
                    .accountNumber(req.getAccountNumber())
                    .ifscCode(req.getIfscCode())
                    .upiId(req.getUpiId())
                    .qrCodeUrl(req.getQrCodeUrl())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        } else {
            existing.setAccountHolderName(req.getAccountHolderName());
            existing.setBankName(req.getBankName());
            existing.setAccountNumber(req.getAccountNumber());
            existing.setIfscCode(req.getIfscCode());
            existing.setUpiId(req.getUpiId());
            existing.setQrCodeUrl(req.getQrCodeUrl());
            existing.setUpdatedAt(LocalDateTime.now());
        }

        return paymentMethodRepository.save(existing);
    }

    @Transactional(readOnly = true)
    public Optional<VendorPaymentMethodEntity> getPaymentMethodForCurrentVendor(Authentication auth) {
        UUID vendorId = resolveVendorId(auth);
        return paymentMethodRepository.findByVendorId(vendorId);
    }

    @Transactional(readOnly = true)
    public Optional<VendorPaymentMethodEntity> getPaymentMethodByVendorId(UUID vendorId) {
        return paymentMethodRepository.findByVendorId(vendorId);
    }
}
