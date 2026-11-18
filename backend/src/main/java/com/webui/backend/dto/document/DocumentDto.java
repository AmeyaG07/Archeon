package com.webui.backend.dto.document;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class DocumentDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateDocumentRequest {
        @NotBlank(message = "Document title is required")
        private String title;
        private String description;
        @NotBlank(message = "Document category is required")
        private String category; // CONTRACT, BLUEPRINT_DRAWING, SPECIFICATION, INVOICE_RECEIPT, SITE_PHOTO, LEGAL_PERMIT, OTHER
        private String securityClassification; // PUBLIC_CLIENT, INTERNAL_STAFF, CONFIDENTIAL_FINANCE, RESTRICTED_LEGAL
        private UUID clientId;
        private UUID projectId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateDocumentRequest {
        private String title;
        private String description;
        private String category;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateClassificationRequest {
        @NotBlank(message = "Security classification is required")
        private String securityClassification; // PUBLIC_CLIENT, INTERNAL_STAFF, CONFIDENTIAL_FINANCE, RESTRICTED_LEGAL
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GrantPermissionRequest {
        @NotBlank(message = "Grantee type is required (VENDOR or USER)")
        private String granteeType; // VENDOR, USER
        private UUID granteeId;
        private String permissionLevel; // READ, READ_WRITE
        private LocalDateTime expiresAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentVersionResponse {
        private UUID id;
        private UUID documentId;
        private Integer versionNumber;
        private String originalFilename;
        private String mimeType;
        private Long fileSizeBytes;
        private String sha256Checksum;
        private String storageProvider;
        private String uploadedBy;
        private LocalDateTime uploadedAt;
        private String quarantineStatus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentPermissionResponse {
        private UUID id;
        private UUID documentId;
        private String granteeType;
        private UUID granteeId;
        private String permissionLevel;
        private String grantedBy;
        private LocalDateTime grantedAt;
        private LocalDateTime expiresAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentResponse {
        private UUID id;
        private String documentReference;
        private String title;
        private String description;
        private String category;
        private String securityClassification;
        private UUID clientId;
        private UUID projectId;
        private UUID currentVersionId;
        private String status;
        private String createdBy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime archivedAt;
        private Long version;
        private DocumentVersionResponse currentVersion;
        private List<DocumentPermissionResponse> permissions;
    }

    public record DownloadFileResult(
            String originalFilename,
            String mimeType,
            long fileSizeBytes,
            String sha256Checksum,
            java.io.InputStream inputStream
    ) {}
}
