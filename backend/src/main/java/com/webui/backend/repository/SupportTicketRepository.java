package com.webui.backend.repository;

import com.webui.backend.model.SupportTicketEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicketEntity, UUID> {
    List<SupportTicketEntity> findByUsernameOrderByCreatedAtDesc(String username);
    List<SupportTicketEntity> findByUserRoleOrderByCreatedAtDesc(String userRole);
    List<SupportTicketEntity> findAllByOrderByCreatedAtDesc();
    Optional<SupportTicketEntity> findByTicketReference(String ticketReference);
}
