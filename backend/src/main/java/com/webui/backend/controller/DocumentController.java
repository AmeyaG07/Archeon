package com.webui.backend.controller;

import com.webui.backend.dto.document.DocumentDto.*;
import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    // ==========================================
    // 1. Upload New Document
    // ==========================================
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "securityClassification", required = false) String securityClassification,
            @RequestParam(value = "clientId", required = false) UUID clientId,
            @RequestParam(value = "projectId", required = false) UUID projectId,
            Authentication auth) {
        try {
            CreateDocumentRequest req = CreateDocumentRequest.builder()
                    .title(title)
                    .category(category)
                    .description(description)
                    .securityClassification(securityClassification)
                    .clientId(clientId)
                    .projectId(projectId)
                    .build();

            DocumentResponse response = documentService.uploadDocument(req, file, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            log.error("I/O error during document upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Storage operation failed: " + e.getMessage()));
        }
    }

    // ==========================================
    // 2. Query Documents
    // ==========================================
    @GetMapping
    public ResponseEntity<?> listDocuments(
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            Authentication auth) {
        try {
            List<DocumentResponse> documents = documentService.listDocuments(clientId, projectId, category, status, auth);
            return ResponseEntity.ok(documents);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocumentById(@PathVariable UUID id, Authentication auth) {
        try {
            DocumentResponse response = documentService.getDocumentById(id, auth);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 3. Secure File Downloads
    // ==========================================
    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadDocument(@PathVariable UUID id, Authentication auth) {
        try {
            DownloadFileResult result = documentService.downloadDocument(id, auth);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(result.mimeType()));
            headers.setContentLength(result.fileSizeBytes());
            headers.setContentDispositionFormData("attachment", result.originalFilename());
            headers.set("X-Checksum-SHA256", result.sha256Checksum());

            // Downstream Cache Protection & Content Sniffing Prevention Headers
            headers.setCacheControl("no-store, no-cache, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);
            headers.set("X-Content-Type-Options", "nosniff");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(new InputStreamResource(result.inputStream()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (FileNotFoundException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to stream document file for id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error streaming file"));
        }
    }

    @GetMapping("/{id}/versions/{versionNumber}/download")
    public ResponseEntity<?> downloadDocumentVersion(
            @PathVariable UUID id,
            @PathVariable Integer versionNumber,
            Authentication auth) {
        try {
            DownloadFileResult result = documentService.downloadDocumentVersion(id, versionNumber, auth);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(result.mimeType()));
            headers.setContentLength(result.fileSizeBytes());
            headers.setContentDispositionFormData("attachment", result.originalFilename());
            headers.set("X-Checksum-SHA256", result.sha256Checksum());

            // Downstream Cache Protection & Content Sniffing Prevention Headers
            headers.setCacheControl("no-store, no-cache, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);
            headers.set("X-Content-Type-Options", "nosniff");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(new InputStreamResource(result.inputStream()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (FileNotFoundException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to stream version {} for document: {}", versionNumber, id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error streaming file"));
        }
    }

    // ==========================================
    // 4. Version Management
    // ==========================================
    @PostMapping(value = "/{id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadVersion(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        try {
            DocumentResponse response = documentService.uploadVersion(id, file, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            log.error("I/O error during version upload for doc: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Storage operation failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<?> getDocumentVersions(@PathVariable UUID id, Authentication auth) {
        try {
            List<DocumentVersionResponse> versions = documentService.getDocumentVersions(id, auth);
            return ResponseEntity.ok(versions);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 5. Security Classification & Permissions
    // ==========================================
    @PatchMapping("/{id}/classification")
    public ResponseEntity<?> updateClassification(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateClassificationRequest req,
            Authentication auth) {
        try {
            DocumentResponse response = documentService.updateClassification(id, req, auth);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/permissions")
    public ResponseEntity<?> grantPermission(
            @PathVariable UUID id,
            @Valid @RequestBody GrantPermissionRequest req,
            Authentication auth) {
        try {
            DocumentResponse response = documentService.grantPermission(id, req, auth);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/permissions/{permissionId}")
    public ResponseEntity<?> revokePermission(
            @PathVariable UUID id,
            @PathVariable UUID permissionId,
            Authentication auth) {
        try {
            DocumentResponse response = documentService.revokePermission(id, permissionId, auth);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 6. Lifecycle Transitions (Archive / Restore / Quarantine Release)
    // ==========================================
    @PostMapping("/{id}/archive")
    public ResponseEntity<?> archiveDocument(@PathVariable UUID id, Authentication auth) {
        try {
            DocumentResponse response = documentService.archiveDocument(id, auth);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restoreDocument(@PathVariable UUID id, Authentication auth) {
        try {
            DocumentResponse response = documentService.restoreDocument(id, auth);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/release-quarantine")
    public ResponseEntity<?> releaseQuarantine(
            @PathVariable UUID id,
            @Valid @RequestBody QuarantineReleaseRequest req,
            Authentication auth) {
        try {
            DocumentResponse response = documentService.releaseQuarantine(id, req, auth);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 7. Audit Trail
    // ==========================================
    @GetMapping("/{id}/audit")
    public ResponseEntity<?> getDocumentAuditTrail(@PathVariable UUID id, Authentication auth) {
        try {
            List<AuditEventEntity> events = documentService.getDocumentAuditTrail(id, auth);
            return ResponseEntity.ok(events);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
