package com.webui.backend.dto.identity;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class ClientDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateClientRequest {
        private String clientReference;
        private String fullName;
        private String email;
        private String phone;
        private String organization;
        private String location;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateClientRequest {
        private String fullName;
        private String phone;
        private String organization;
        private String location;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateClientStatusRequest {
        private String status; // ACTIVE, INACTIVE, SUSPENDED
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClientResponse {
        private UUID id;
        private String clientReference;
        private String fullName;
        private String email;
        private String phone;
        private String organization;
        private String location;
        private String status;
        private String portalAccess;
        private String notes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long version;
    }
}
