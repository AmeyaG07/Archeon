package com.webui.backend.repository;

import com.webui.backend.model.NotificationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, UUID> {

    Page<NotificationEntity> findByRecipientUsernameOrderByCreatedAtDesc(String recipientUsername, Pageable pageable);

    Page<NotificationEntity> findByRecipientUsernameAndReadStatusOrderByCreatedAtDesc(
            String recipientUsername, Boolean readStatus, Pageable pageable
    );

    long countByRecipientUsernameAndReadStatus(String recipientUsername, Boolean readStatus);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.readStatus = true WHERE n.recipientUsername = :recipientUsername AND n.readStatus = false")
    int markAllAsReadForUser(@Param("recipientUsername") String recipientUsername);
}
