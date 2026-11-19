package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentVersionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(name = "mime_type", nullable = false, length = 128)
    private String mimeType;

    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @Column(name = "sha256_checksum", nullable = false, length = 64)
    private String sha256Checksum;

    @Builder.Default
    @Column(name = "storage_provider", nullable = false, length = 32)
    private String storageProvider = "LOCAL_PRIVATE"; // LOCAL_PRIVATE, S3_COMPATIBLE

    @Column(name = "uploaded_by", nullable = false, length = 50)
    private String uploadedBy;

    @Builder.Default
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "quarantine_status", nullable = false, length = 32)
    private String quarantineStatus = "CLEARED"; // QUARANTINED, CLEARED, REJECTED

    @Version
    @Builder.Default
    @Column(nullable = false)
    private Long version = 0L;
}
