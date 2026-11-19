package com.webui.backend.dto.identity;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserProfileResponse {
        private Long id;
        private String username;
        private String role;
        private String fullName;
        private String email;
        private String phone;
        private UUID clientId;
        private String clientReference;
        private String clientName;
        private UUID vendorId;
        private String vendorReference;
        private String vendorBusinessName;
        private String status;
        private boolean enabled;
        private LocalDateTime lastLoginAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateProfileRequest {
        private String fullName;
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateUserRoleRequest {
        private String role;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateUserStatusRequest {
        private String status; // ACTIVE, SUSPENDED
        private Boolean enabled;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummaryResponse {
        private Long id;
        private String username;
        private String role;
        private String fullName;
        private String email;
        private String phone;
        private UUID clientId;
        private UUID vendorId;
        private String status;
        private boolean enabled;
        private Long tokenVersion;
        private Long version;
    }
}
