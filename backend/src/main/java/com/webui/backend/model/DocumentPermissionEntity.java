package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentPermissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "grantee_type", nullable = false, length = 32)
    private String granteeType; // VENDOR, USER

    @Column(name = "grantee_id", nullable = false)
    private UUID granteeId;

    @Builder.Default
    @Column(name = "permission_level", nullable = false, length = 32)
    private String permissionLevel = "READ"; // READ, READ_WRITE

    @Column(name = "granted_by", nullable = false, length = 50)
    private String grantedBy;

    @Builder.Default
    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Version
    @Builder.Default
    @Column(nullable = false)
    private Long version = 0L;
}
