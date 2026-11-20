package com.webui.backend.dto.identity;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class VendorDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateVendorRequest {
        private String vendorReference;
        private String businessName;
        private String contactPerson;
        private String email;
        private String phone;
        private String category; // CARPENTRY, ELECTRICAL, CIVIL_WORK, HVAC, PLUMBING, FABRICATION, MASONRY, OTHER
        private String location;
        private String gstin;
        private String pan;
        private String bankDetailsJson;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateVendorRequest {
        private String businessName;
        private String contactPerson;
        private String phone;
        private String category;
        private String location;
        private String gstin;
        private String pan;
        private String bankDetailsJson;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateVendorStatusRequest {
        private String status; // ACTIVE, INACTIVE, SUSPENDED
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VendorResponse {
        private UUID id;
        private String vendorReference;
        private String businessName;
        private String contactPerson;
        private String email;
        private String phone;
        private String category;
        private String location;
        private String gstin;
        private String pan;
        private String bankDetailsJson;
        private String status;
        private String portalAccess;
        private String notes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long version;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreatePortalAccountRequest {
        private String username;
        private String password;
    }
}
