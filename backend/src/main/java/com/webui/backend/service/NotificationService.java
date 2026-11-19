package com.webui.backend.service;

import com.webui.backend.dto.notification.NotificationDto;
import com.webui.backend.model.NotificationEntity;
import com.webui.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Page<NotificationDto.NotificationResponse> getNotificationsForUser(
            String username, Boolean unreadOnly, Pageable pageable
    ) {
        Page<NotificationEntity> page;
        if (Boolean.TRUE.equals(unreadOnly)) {
            page = notificationRepository.findByRecipientUsernameAndReadStatusOrderByCreatedAtDesc(
                    username, false, pageable
            );
        } else {
            page = notificationRepository.findByRecipientUsernameOrderByCreatedAtDesc(username, pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public NotificationDto.UnreadCountResponse getUnreadCount(String username) {
        long count = notificationRepository.countByRecipientUsernameAndReadStatus(username, false);
        return NotificationDto.UnreadCountResponse.builder()
                .username(username)
                .unreadCount(count)
                .build();
    }

    @Transactional
    public NotificationDto.NotificationResponse markAsRead(UUID id, String username) {
        NotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));

        if (!notification.getRecipientUsername().equalsIgnoreCase(username)) {
            throw new AccessDeniedException("Cannot mark notification belonging to another user");
        }

        notification.setReadStatus(true);
        notification = notificationRepository.save(notification);
        return toResponse(notification);
    }

    @Transactional
    public int markAllAsRead(String username) {
        return notificationRepository.markAllAsReadForUser(username);
    }

    @Transactional
    public NotificationEntity sendNotification(
            String recipientUsername, String title, String message, String category, String actionUrl
    ) {
        NotificationEntity entity = NotificationEntity.builder()
                .recipientUsername(recipientUsername)
                .title(title)
                .message(message)
                .category(category != null ? category : "SYSTEM")
                .readStatus(false)
                .actionUrl(actionUrl)
                .createdAt(LocalDateTime.now())
                .build();

        NotificationEntity saved = notificationRepository.save(entity);
        log.info("Sent notification to {}: title='{}', category='{}'", recipientUsername, title, category);
        return saved;
    }

    private NotificationDto.NotificationResponse toResponse(NotificationEntity entity) {
        return NotificationDto.NotificationResponse.builder()
                .id(entity.getId())
                .recipientUsername(entity.getRecipientUsername())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .category(entity.getCategory())
                .readStatus(entity.getReadStatus())
                .actionUrl(entity.getActionUrl())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
