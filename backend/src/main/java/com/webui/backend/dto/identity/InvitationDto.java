package com.webui.backend.dto.identity;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class InvitationDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InviteUserRequest {
        private String email;
        private String targetRole; // ROLE_CLIENT, ROLE_VENDOR, ROLE_STAFF, etc.
        private UUID clientId;
        private UUID vendorId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvitationResponse {
        private UUID invitationId;
        private String email;
        private String targetRole;
        private UUID clientId;
        private UUID vendorId;
        private String rawToken;
        private String invitationUrl;
        private String status;
        private LocalDateTime expiresAt;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AcceptInvitationRequest {
        private String token;
        private String username;
        private String password;
        private String fullName;
        private String phone;
    }
}
