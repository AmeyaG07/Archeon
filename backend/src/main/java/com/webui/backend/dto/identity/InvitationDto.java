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
        private String recipientName;
        @Builder.Default
        private String deliveryMethod = "BOTH"; // "EMAIL", "MANUAL", "BOTH"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvitationResponse {
        private UUID invitationId;
        private String email;
        private String recipientName;
        private String targetRole;
        private UUID clientId;
        private UUID vendorId;
        private String rawToken;
        private String invitationUrl;      // Fully qualified absolute URL for manual sharing & activation
        private String relativeUrl;        // Relative URL path
        private String deliveryMethod;      // "EMAIL", "MANUAL", "BOTH"
        private String emailDeliveryStatus; // "DELIVERED", "FAILED", "SUPPRESSED", "NOT_REQUESTED"
        private String emailMessageId;
        private String manualSharingSnippet; // Formatted snippet for administrators to copy and share
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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResendInvitationRequest {
        @Builder.Default
        private String deliveryMethod = "BOTH"; // "EMAIL", "MANUAL", "BOTH"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvitationValidationResponse {
        private boolean valid;
        private String status;         // PENDING, EXPIRED, REVOKED, ACCEPTED, INVALID
        private String email;          // Safe recipient email
        private String recipientName;  // Display name
        private String targetRole;     // ROLE_CLIENT, ROLE_VENDOR, etc.
        private LocalDateTime expiresAt;
        private String message;
    }
}
