package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "support_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicketEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "ticket_reference", unique = true, nullable = false, length = 64)
    private String ticketReference;

    @Column(nullable = false, length = 64)
    private String username;

    @Column(name = "user_role", nullable = false, length = 32)
    private String userRole; // CLIENT, VENDOR, STAFF

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(nullable = false, length = 32)
    private String priority; // Low, Normal, High, Urgent

    @Column(nullable = false, length = 32)
    private String status; // Open, Assigned, In Progress, Awaiting Response, Resolved, Closed

    @Column(name = "related_reference", length = 128)
    private String relatedReference;

    @Column(name = "assigned_team", length = 128)
    private String assignedTeam;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "messages_json", columnDefinition = "TEXT")
    private String messagesJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
