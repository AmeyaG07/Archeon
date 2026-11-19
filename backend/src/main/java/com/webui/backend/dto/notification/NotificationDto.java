package com.webui.backend.dto.notification;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class NotificationDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateNotificationRequest {
        @NotBlank(message = "Recipient username is required")
        private String recipientUsername;

        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Message is required")
        private String message;

        private String category; // BILLING, PROJECT, APPROVAL, PAYMENT, SYSTEM

        private String actionUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationResponse {
        private UUID id;
        private String recipientUsername;
        private String title;
        private String message;
        private String category;
        private Boolean readStatus;
        private String actionUrl;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnreadCountResponse {
        private String username;
        private long unreadCount;
    }
}
