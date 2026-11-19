package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "document_reference", nullable = false, unique = true, length = 64)
    private String documentReference;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 64)
    private String category; // CONTRACT, BLUEPRINT_DRAWING, SPECIFICATION, INVOICE_RECEIPT, SITE_PHOTO, LEGAL_PERMIT, OTHER

    @Builder.Default
    @Column(name = "security_classification", nullable = false, length = 32)
    private String securityClassification = "INTERNAL_STAFF"; // PUBLIC_CLIENT, INTERNAL_STAFF, CONFIDENTIAL_FINANCE, RESTRICTED_LEGAL

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "current_version_id")
    private UUID currentVersionId;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "AVAILABLE"; // QUARANTINED, AVAILABLE, RESTRICTED, ARCHIVED, REJECTED

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Version
    @Builder.Default
    @Column(nullable = false)
    private Long version = 0L;
}
