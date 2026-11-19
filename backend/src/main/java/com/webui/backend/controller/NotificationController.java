package com.webui.backend.controller;

import com.webui.backend.dto.notification.NotificationDto;
import com.webui.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "In-App Notifications", description = "User notification feed, unread counters, and mark-as-read controls")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get notification feed for authenticated user")
    public ResponseEntity<Page<NotificationDto.NotificationResponse>> getNotifications(
            @RequestParam(required = false, defaultValue = "false") Boolean unreadOnly,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication auth
    ) {
        String username = auth.getName();
        return ResponseEntity.ok(notificationService.getNotificationsForUser(username, unreadOnly, pageable));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get count of unread notifications for badge display")
    public ResponseEntity<NotificationDto.UnreadCountResponse> getUnreadCount(Authentication auth) {
        String username = auth.getName();
        return ResponseEntity.ok(notificationService.getUnreadCount(username));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark single notification as read")
    public ResponseEntity<NotificationDto.NotificationResponse> markAsRead(
            @PathVariable UUID id,
            Authentication auth
    ) {
        String username = auth.getName();
        return ResponseEntity.ok(notificationService.markAsRead(id, username));
    }

    @PostMapping("/mark-all-read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark all notifications as read for current user")
    public ResponseEntity<Map<String, Object>> markAllAsRead(Authentication auth) {
        String username = auth.getName();
        int count = notificationService.markAllAsRead(username);
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "markedAsReadCount", count,
                "username", username
        ));
    }
}
