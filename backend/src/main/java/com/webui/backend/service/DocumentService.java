package com.webui.backend.service;

import com.webui.backend.dto.document.DocumentDto.*;
import com.webui.backend.model.*;
import com.webui.backend.repository.*;
import com.webui.backend.security.dms.DocumentSecurityValidator;
import com.webui.backend.security.dms.DocumentSecurityValidator.ValidatedFile;
import com.webui.backend.security.dms.MalwareScanner;
import com.webui.backend.security.dms.MalwareScanner.ScanResult;
import com.webui.backend.storage.DocumentStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentPermissionRepository documentPermissionRepository;
    private final DocumentStorageService storageService;
    private final DocumentSecurityValidator securityValidator;
    private final MalwareScanner malwareScanner;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final VendorRepository vendorRepository;
    private final OperationalProjectRepository projectRepository;
    private final ProjectVendorAssignmentRepository vendorAssignmentRepository;
    private final AuditEventRepository auditEventRepository;

    private static final Set<String> VALID_CATEGORIES = Set.of(
            "CONTRACT", "BLUEPRINT_DRAWING", "SPECIFICATION",
            "INVOICE_RECEIPT", "SITE_PHOTO", "LEGAL_PERMIT", "OTHER"
    );

    private static final Set<String> VALID_CLASSIFICATIONS = Set.of(
            "PUBLIC_CLIENT", "INTERNAL_STAFF", "CONFIDENTIAL_FINANCE", "RESTRICTED_LEGAL"
    );

    // ==========================================
    // 1. Upload New Document
    // ==========================================
    @Transactional
    public DocumentResponse uploadDocument(CreateDocumentRequest req, MultipartFile file, Authentication auth) throws IOException {
        validateAuthenticated(auth);
        UserEntity user = getAuthenticatedUser(auth);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File payload is required");
        }

        // Validate Category
        if (!StringUtils.hasText(req.getCategory()) || !VALID_CATEGORIES.contains(req.getCategory().trim().toUpperCase())) {
            throw new IllegalArgumentException("Invalid document category: " + req.getCategory() + ". Valid: " + VALID_CATEGORIES);
        }
        String category = req.getCategory().trim().toUpperCase();

        // Validate / Normalize Security Classification
        String classification = StringUtils.hasText(req.getSecurityClassification())
                ? req.getSecurityClassification().trim().toUpperCase()
                : "INTERNAL_STAFF";

        if (!VALID_CLASSIFICATIONS.contains(classification)) {
            throw new IllegalArgumentException("Invalid security classification: " + classification + ". Valid: " + VALID_CLASSIFICATIONS);
        }

        UUID clientId = req.getClientId();
        UUID projectId = req.getProjectId();

        // Check actor role constraints
        if ("ROLE_CLIENT".equals(user.getRole())) {
            if (user.getClientId() == null) {
                throw new AccessDeniedException("Client account not associated with a valid client organization");
            }
            clientId = user.getClientId();
            classification = "PUBLIC_CLIENT"; // Clients cannot publish internal or restricted documents
        } else if ("ROLE_VENDOR".equals(user.getRole())) {
            if (user.getVendorId() == null) {
                throw new AccessDeniedException("Vendor account not associated with a valid vendor organization");
            }
            if (projectId == null) {
                throw new IllegalArgumentException("Vendor document upload requires an operational projectId");
            }
            if (!vendorAssignmentRepository.existsByProjectIdAndVendorIdAndStatus(projectId, user.getVendorId(), "ACTIVE")) {
                throw new AccessDeniedException("Access denied: You do not have an active assignment on project " + projectId);
            }
            classification = "PUBLIC_CLIENT";
        } else {
            // Internal staff upload
            if (clientId != null && !clientRepository.existsById(clientId)) {
                throw new IllegalArgumentException("Client not found: " + clientId);
            }
            if (projectId != null && !projectRepository.existsById(projectId)) {
                throw new IllegalArgumentException("Project not found: " + projectId);
            }
        }

        // Validate File Integrity, Magic Bytes, Executable Signatures & Checksum
        ValidatedFile validatedFile = securityValidator.validate(
                file.getOriginalFilename(),
                file.getContentType(),
                file.getInputStream(),
                file.getSize()
        );

        // Run Malware Scanner
        ScanResult scanResult = malwareScanner.scan(
                new ByteArrayInputStream(validatedFile.fileBytes()),
                validatedFile.sanitizedFilename(),
                validatedFile.sizeBytes()
        );

        String docStatus = scanResult.passed() ? "AVAILABLE" : "QUARANTINED";
        String verStatus = scanResult.passed() ? "CLEARED" : "QUARANTINED";

        // Generate Server-Side Keys & Path
        UUID docId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        int year = LocalDate.now().getYear();
        int month = LocalDate.now().getMonthValue();
        String storageKey = String.format("documents/%d/%02d/%s/%s.bin", year, month, docId, versionId);

        // Store bytes in isolated physical storage
        storageService.storeFile(
                new ByteArrayInputStream(validatedFile.fileBytes()),
                validatedFile.sizeBytes(),
                validatedFile.verifiedMimeType(),
                storageKey
        );

        String docReference = generateDocumentReference();

        try {
            DocumentEntity document = DocumentEntity.builder()
                    .documentReference(docReference)
                    .title(req.getTitle().trim())
                    .description(req.getDescription())
                    .category(category)
                    .securityClassification(classification)
                    .clientId(clientId)
                    .projectId(projectId)
                    .status(docStatus)
                    .createdBy(auth.getName())
                    .createdAt(LocalDateTime.now())
                    .build();

            DocumentEntity savedDoc = documentRepository.save(document);

            DocumentVersionEntity version = DocumentVersionEntity.builder()
                    .documentId(savedDoc.getId())
                    .versionNumber(1)
                    .originalFilename(validatedFile.sanitizedFilename())
                    .storageKey(storageKey)
                    .mimeType(validatedFile.verifiedMimeType())
                    .fileSizeBytes(validatedFile.sizeBytes())
                    .sha256Checksum(validatedFile.sha256Checksum())
                    .storageProvider("LOCAL_PRIVATE")
                    .uploadedBy(auth.getName())
                    .uploadedAt(LocalDateTime.now())
                    .quarantineStatus(verStatus)
                    .build();

            DocumentVersionEntity savedVer = documentVersionRepository.save(version);
            savedDoc.setCurrentVersionId(savedVer.getId());
            savedDoc = documentRepository.save(savedDoc);

            // Audit Trail
            auditEventRepository.save(AuditEventEntity.builder()
                    .actorId(auth.getName())
                    .actorRole(user.getRole())
                    .action("DOCUMENT_UPLOAD")
                    .entityName("DOCUMENT")
                    .entityId(savedDoc.getId().toString())
                    .detailsJson(String.format("{\"reference\":\"%s\",\"title\":\"%s\",\"filename\":\"%s\",\"size\":%d,\"checksum\":\"%s\",\"status\":\"%s\"}",
                            docReference, savedDoc.getTitle(), validatedFile.sanitizedFilename(), validatedFile.sizeBytes(), validatedFile.sha256Checksum(), docStatus))
                    .build());

            return toDocumentResponse(savedDoc, true);
        } catch (Exception ex) {
            log.error("Failed to persist document metadata for key {}. Cleaning up stored file...", storageKey, ex);
            try {
                storageService.deleteFile(storageKey);
            } catch (Exception cleanEx) {
                log.error("Failed to delete orphaned file after DB failure: {}", storageKey, cleanEx);
            }
            throw ex;
        }
    }

    // ==========================================
    // 2. Upload New Version
    // ==========================================
    @Transactional
    public DocumentResponse uploadVersion(UUID documentId, MultipartFile file, Authentication auth) throws IOException {
        validateAuthenticated(auth);
        DocumentEntity doc = getDocumentEntity(documentId);
        checkNotArchived(doc, "upload new version");
        validateDocumentWriteAccess(doc, auth);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File payload is required");
        }

        UserEntity user = getAuthenticatedUser(auth);

        // Validate File
        ValidatedFile validatedFile = securityValidator.validate(
                file.getOriginalFilename(),
                file.getContentType(),
                file.getInputStream(),
                file.getSize()
        );

        // Scan File
        ScanResult scanResult = malwareScanner.scan(
                new ByteArrayInputStream(validatedFile.fileBytes()),
                validatedFile.sanitizedFilename(),
                validatedFile.sizeBytes()
        );

        String verStatus = scanResult.passed() ? "CLEARED" : "QUARANTINED";

        int nextVersionNumber = (int) documentVersionRepository.countByDocumentId(documentId) + 1;
        UUID versionId = UUID.randomUUID();
        int year = LocalDate.now().getYear();
        int month = LocalDate.now().getMonthValue();
        String storageKey = String.format("documents/%d/%02d/%s/%s.bin", year, month, documentId, versionId);

        storageService.storeFile(
                new ByteArrayInputStream(validatedFile.fileBytes()),
                validatedFile.sizeBytes(),
                validatedFile.verifiedMimeType(),
                storageKey
        );

        try {
            DocumentVersionEntity version = DocumentVersionEntity.builder()
                    .documentId(documentId)
                    .versionNumber(nextVersionNumber)
                    .originalFilename(validatedFile.sanitizedFilename())
                    .storageKey(storageKey)
                    .mimeType(validatedFile.verifiedMimeType())
                    .fileSizeBytes(validatedFile.sizeBytes())
                    .sha256Checksum(validatedFile.sha256Checksum())
                    .storageProvider("LOCAL_PRIVATE")
                    .uploadedBy(auth.getName())
                    .uploadedAt(LocalDateTime.now())
                    .quarantineStatus(verStatus)
                    .build();

            DocumentVersionEntity savedVer = documentVersionRepository.save(version);

            doc.setCurrentVersionId(savedVer.getId());
            doc.setUpdatedAt(LocalDateTime.now());
            if (!scanResult.passed()) {
                doc.setStatus("QUARANTINED");
            }
            DocumentEntity updated = documentRepository.save(doc);

            auditEventRepository.save(AuditEventEntity.builder()
                    .actorId(auth.getName())
                    .actorRole(user.getRole())
                    .action("DOCUMENT_VERSION_UPLOAD")
                    .entityName("DOCUMENT")
                    .entityId(documentId.toString())
                    .detailsJson(String.format("{\"version\":%d,\"filename\":\"%s\",\"size\":%d,\"checksum\":\"%s\",\"quarantineStatus\":\"%s\"}",
                            nextVersionNumber, validatedFile.sanitizedFilename(), validatedFile.sizeBytes(), validatedFile.sha256Checksum(), verStatus))
                    .build());

            return toDocumentResponse(updated, true);
        } catch (Exception ex) {
            log.error("Failed to record new document version. Cleaning up storage key: {}", storageKey, ex);
            try {
                storageService.deleteFile(storageKey);
            } catch (Exception cleanEx) {
                log.error("Failed to delete orphaned file after DB failure: {}", storageKey, cleanEx);
            }
            throw ex;
        }
    }

    // ==========================================
    // 3. Secure File Download (Active Version)
    // ==========================================
    @Transactional(readOnly = true)
    public DownloadFileResult downloadDocument(UUID documentId, Authentication auth) throws IOException {
        validateAuthenticated(auth);
        DocumentEntity doc = getDocumentEntity(documentId);
        validateDocumentReadAccess(doc, auth);

        if ("QUARANTINED".equals(doc.getStatus()) && !isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("This document is quarantined for administrative security inspection");
        }

        if (doc.getCurrentVersionId() == null) {
            throw new FileNotFoundException("No file version associated with document " + doc.getDocumentReference());
        }

        DocumentVersionEntity version = documentVersionRepository.findById(doc.getCurrentVersionId())
                .orElseThrow(() -> new FileNotFoundException("Active version record not found for document"));

        InputStream inputStream = storageService.retrieveFile(version.getStorageKey());

        logAuditEvent(auth, "DOCUMENT_DOWNLOAD", doc.getId().toString(),
                String.format("{\"version\":%d,\"filename\":\"%s\"}", version.getVersionNumber(), version.getOriginalFilename()));

        return new DownloadFileResult(
                version.getOriginalFilename(),
                version.getMimeType(),
                version.getFileSizeBytes(),
                version.getSha256Checksum(),
                inputStream
        );
    }

    // ==========================================
    // 4. Secure File Download (Specific Version)
    // ==========================================
    @Transactional(readOnly = true)
    public DownloadFileResult downloadDocumentVersion(UUID documentId, Integer versionNumber, Authentication auth) throws IOException {
        validateAuthenticated(auth);
        DocumentEntity doc = getDocumentEntity(documentId);
        validateDocumentReadAccess(doc, auth);

        DocumentVersionEntity version = documentVersionRepository.findByDocumentIdAndVersionNumber(documentId, versionNumber)
                .orElseThrow(() -> new FileNotFoundException("Version " + versionNumber + " not found for document " + doc.getDocumentReference()));

        if ("QUARANTINED".equals(version.getQuarantineStatus()) && !isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Requested version is quarantined for administrative security inspection");
        }

        InputStream inputStream = storageService.retrieveFile(version.getStorageKey());

        logAuditEvent(auth, "DOCUMENT_DOWNLOAD", doc.getId().toString(),
                String.format("{\"version\":%d,\"filename\":\"%s\"}", version.getVersionNumber(), version.getOriginalFilename()));

        return new DownloadFileResult(
                version.getOriginalFilename(),
                version.getMimeType(),
                version.getFileSizeBytes(),
                version.getSha256Checksum(),
                inputStream
        );
    }

    // ==========================================
    // 5. Document Query & Detail
    // ==========================================
    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(UUID documentId, Authentication auth) {
        validateAuthenticated(auth);
        DocumentEntity doc = getDocumentEntity(documentId);
        validateDocumentReadAccess(doc, auth);
        return toDocumentResponse(doc, isInternalStaff(auth.getAuthorities()));
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listDocuments(UUID clientId, UUID projectId, String category, String status, Authentication auth) {
        validateAuthenticated(auth);
        UserEntity user = getAuthenticatedUser(auth);

        List<DocumentEntity> candidates;
        if (projectId != null) {
            candidates = documentRepository.findByProjectId(projectId);
        } else if (clientId != null) {
            candidates = documentRepository.findByClientId(clientId);
        } else if (status != null && !status.trim().isEmpty()) {
            candidates = documentRepository.findByStatus(status.trim().toUpperCase());
        } else {
            candidates = documentRepository.findAll();
        }

        return candidates.stream()
                .filter(doc -> {
                    // Category filter
                    if (StringUtils.hasText(category) && !doc.getCategory().equalsIgnoreCase(category.trim())) {
                        return false;
                    }
                    // Status filter
                    if (StringUtils.hasText(status) && !doc.getStatus().equalsIgnoreCase(status.trim())) {
                        return false;
                    }
                    // Role & Ownership Access Verification
                    try {
                        validateDocumentReadAccess(doc, auth);
                        return true;
                    } catch (AccessDeniedException ex) {
                        return false;
                    }
                })
                .map(doc -> toDocumentResponse(doc, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentVersionResponse> getDocumentVersions(UUID documentId, Authentication auth) {
        validateAuthenticated(auth);
        DocumentEntity doc = getDocumentEntity(documentId);
        validateDocumentReadAccess(doc, auth);

        return documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId).stream()
                .map(this::toVersionResponse)
                .collect(Collectors.toList());
    }

    // ==========================================
    // 6. Security Classification Management
    // ==========================================
    @Transactional
    public DocumentResponse updateClassification(UUID documentId, UpdateClassificationRequest req, Authentication auth) {
        validateAuthenticated(auth);
        requireInternalStaff(auth, "update document security classification");
        DocumentEntity doc = getDocumentEntity(documentId);
        checkNotArchived(doc, "update security classification");

        String newClass = req.getSecurityClassification() != null ? req.getSecurityClassification().trim().toUpperCase() : "";
        if (!VALID_CLASSIFICATIONS.contains(newClass)) {
            throw new IllegalArgumentException("Invalid security classification: " + newClass + ". Valid: " + VALID_CLASSIFICATIONS);
        }

        String oldClass = doc.getSecurityClassification();
        doc.setSecurityClassification(newClass);
        doc.setUpdatedAt(LocalDateTime.now());
        DocumentEntity updated = documentRepository.save(doc);

        logAuditEvent(auth, "DOCUMENT_CLASSIFICATION_CHANGED", doc.getId().toString(),
                String.format("{\"oldClassification\":\"%s\",\"newClassification\":\"%s\"}", oldClass, newClass));

        return toDocumentResponse(updated, true);
    }

    // ==========================================
    // 7. Explicit Permission Grants & Revocations
    // ==========================================
    @Transactional
    public DocumentResponse grantPermission(UUID documentId, GrantPermissionRequest req, Authentication auth) {
        validateAuthenticated(auth);
        requireInternalStaff(auth, "grant document permissions");
        DocumentEntity doc = getDocumentEntity(documentId);
        checkNotArchived(doc, "grant permissions");

        if (req.getGranteeId() == null || !StringUtils.hasText(req.getGranteeType())) {
            throw new IllegalArgumentException("Grantee type and grantee ID are required");
        }

        String granteeType = req.getGranteeType().trim().toUpperCase();
        if (!"VENDOR".equals(granteeType) && !"CLIENT".equals(granteeType)) {
            throw new IllegalArgumentException("Grantee type must be VENDOR or CLIENT");
        }

        String permissionLevel = StringUtils.hasText(req.getPermissionLevel())
                ? req.getPermissionLevel().trim().toUpperCase()
                : "READ";

        if (!"READ".equals(permissionLevel) && !"READ_WRITE".equals(permissionLevel)) {
            throw new IllegalArgumentException("Permission level must be READ or READ_WRITE");
        }

        if ("VENDOR".equals(granteeType)) {
            if (!vendorRepository.existsById(req.getGranteeId())) {
                throw new IllegalArgumentException("Vendor not found: " + req.getGranteeId());
            }
            if (doc.getProjectId() != null &&
                    !vendorAssignmentRepository.existsByProjectIdAndVendorIdAndStatus(doc.getProjectId(), req.getGranteeId(), "ACTIVE")) {
                throw new IllegalArgumentException("Cannot grant permissions: Vendor does not have an ACTIVE assignment on project " + doc.getProjectId());
            }
        } else if ("CLIENT".equals(granteeType)) {
            if (!clientRepository.existsById(req.getGranteeId())) {
                throw new IllegalArgumentException("Client not found: " + req.getGranteeId());
            }
        }

        Optional<DocumentPermissionEntity> existing = documentPermissionRepository
                .findByDocumentIdAndGranteeTypeAndGranteeId(documentId, granteeType, req.getGranteeId());

        DocumentPermissionEntity perm;
        if (existing.isPresent()) {
            perm = existing.get();
            perm.setPermissionLevel(permissionLevel);
            perm.setExpiresAt(req.getExpiresAt());
            perm.setGrantedBy(auth.getName());
            perm.setGrantedAt(LocalDateTime.now());
        } else {
            perm = DocumentPermissionEntity.builder()
                    .documentId(documentId)
                    .granteeType(granteeType)
                    .granteeId(req.getGranteeId())
                    .permissionLevel(permissionLevel)
                    .grantedBy(auth.getName())
                    .grantedAt(LocalDateTime.now())
                    .expiresAt(req.getExpiresAt())
                    .build();
        }

        documentPermissionRepository.save(perm);

        logAuditEvent(auth, "DOCUMENT_PERMISSION_GRANTED", doc.getId().toString(),
                String.format("{\"granteeType\":\"%s\",\"granteeId\":\"%s\",\"level\":\"%s\"}",
                        granteeType, req.getGranteeId(), permissionLevel));

        return toDocumentResponse(doc, true);
    }

    @Transactional
    public DocumentResponse revokePermission(UUID documentId, UUID permissionId, Authentication auth) {
        validateAuthenticated(auth);
        requireInternalStaff(auth, "revoke document permissions");
        DocumentEntity doc = getDocumentEntity(documentId);
        checkNotArchived(doc, "revoke permissions");

        DocumentPermissionEntity perm = documentPermissionRepository.findById(permissionId)
                .orElseThrow(() -> new IllegalArgumentException("Permission grant not found: " + permissionId));

        if (!perm.getDocumentId().equals(documentId)) {
            throw new IllegalArgumentException("Permission grant does not belong to document: " + documentId);
        }

        documentPermissionRepository.delete(perm);

        logAuditEvent(auth, "DOCUMENT_PERMISSION_REVOKED", doc.getId().toString(),
                String.format("{\"permissionId\":\"%s\",\"granteeType\":\"%s\",\"granteeId\":\"%s\"}",
                        permissionId, perm.getGranteeType(), perm.getGranteeId()));

        return toDocumentResponse(doc, true);
    }

    // ==========================================
    // 8. Lifecycle Transitions (Archive / Restore)
    // ==========================================
    @Transactional
    public DocumentResponse archiveDocument(UUID documentId, Authentication auth) {
        validateAuthenticated(auth);
        requireInternalStaff(auth, "archive document");
        DocumentEntity doc = getDocumentEntity(documentId);

        if ("ARCHIVED".equals(doc.getStatus())) {
            return toDocumentResponse(doc, true);
        }

        doc.setStatus("ARCHIVED");
        doc.setArchivedAt(LocalDateTime.now());
        doc.setUpdatedAt(LocalDateTime.now());
        DocumentEntity saved = documentRepository.save(doc);

        logAuditEvent(auth, "DOCUMENT_ARCHIVED", doc.getId().toString(), "{\"status\":\"ARCHIVED\"}");
        return toDocumentResponse(saved, true);
    }

    @Transactional
    public DocumentResponse restoreDocument(UUID documentId, Authentication auth) {
        validateAuthenticated(auth);
        requireInternalStaff(auth, "restore document");
        DocumentEntity doc = getDocumentEntity(documentId);

        if (!"ARCHIVED".equals(doc.getStatus())) {
            throw new IllegalArgumentException("Document is not archived");
        }

        doc.setStatus("AVAILABLE");
        doc.setArchivedAt(null);
        doc.setUpdatedAt(LocalDateTime.now());
        DocumentEntity saved = documentRepository.save(doc);

        logAuditEvent(auth, "DOCUMENT_RESTORED", doc.getId().toString(), "{\"status\":\"AVAILABLE\"}");
        return toDocumentResponse(saved, true);
    }

    @Transactional
    public DocumentResponse releaseQuarantine(UUID documentId, Authentication auth) {
        validateAuthenticated(auth);
        if (!isAdmin(auth.getAuthorities())) {
            throw new AccessDeniedException("Only system administrators can release quarantined documents");
        }
        DocumentEntity doc = getDocumentEntity(documentId);

        doc.setStatus("AVAILABLE");
        doc.setUpdatedAt(LocalDateTime.now());
        DocumentEntity saved = documentRepository.save(doc);

        // Update all quarantined versions for this doc
        List<DocumentVersionEntity> versions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId);
        for (DocumentVersionEntity v : versions) {
            if ("QUARANTINED".equals(v.getQuarantineStatus())) {
                v.setQuarantineStatus("CLEARED");
                documentVersionRepository.save(v);
            }
        }

        logAuditEvent(auth, "DOCUMENT_QUARANTINE_RELEASED", doc.getId().toString(), "{\"action\":\"RELEASED_FROM_QUARANTINE\"}");
        return toDocumentResponse(saved, true);
    }

    // ==========================================
    // 9. Document Audit Trail
    // ==========================================
    @Transactional(readOnly = true)
    public List<AuditEventEntity> getDocumentAuditTrail(UUID documentId, Authentication auth) {
        validateAuthenticated(auth);
        requireInternalStaff(auth, "view document audit trail");
        return auditEventRepository.findByEntityNameAndEntityIdOrderByTimestampDesc("DOCUMENT", documentId.toString());
    }

    // ==========================================
    // Authorization & Safety Validation Helpers
    // ==========================================
    public void validateDocumentReadAccess(DocumentEntity doc, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }

        Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();

        // 1. Classification-Level Compartmentalization
        String classification = doc.getSecurityClassification();
        if ("CONFIDENTIAL_FINANCE".equalsIgnoreCase(classification)) {
            if (!isFinance(authorities)) {
                throw new AccessDeniedException("Access denied: Document requires finance role authorization");
            }
            return;
        }

        if ("RESTRICTED_LEGAL".equalsIgnoreCase(classification)) {
            if (!isLegalOrAdmin(authorities)) {
                throw new AccessDeniedException("Access denied: Document requires legal executive authorization");
            }
            return;
        }

        if ("INTERNAL_STAFF".equalsIgnoreCase(classification)) {
            if (!isInternalStaff(authorities) && !isFinance(authorities)) {
                throw new AccessDeniedException("Access denied: Document is reserved for studio internal staff");
            }
            return;
        }

        // Classification is PUBLIC_CLIENT
        if (isInternalStaff(authorities) || isFinance(authorities)) {
            return;
        }

        UserEntity user = getAuthenticatedUser(auth);

        // Client Access Check
        if ("ROLE_CLIENT".equals(user.getRole())) {
            if (user.getClientId() != null && user.getClientId().equals(doc.getClientId())) {
                return;
            }
            if (user.getClientId() != null) {
                Optional<DocumentPermissionEntity> clientPerm = documentPermissionRepository
                        .findByDocumentIdAndGranteeTypeAndGranteeId(doc.getId(), "CLIENT", user.getClientId());
                if (clientPerm.isPresent()) {
                    DocumentPermissionEntity p = clientPerm.get();
                    if (p.getExpiresAt() == null || p.getExpiresAt().isAfter(LocalDateTime.now())) {
                        return;
                    }
                }
            }
            throw new AccessDeniedException("Access denied: You do not own document " + doc.getDocumentReference());
        }

        // Vendor Access Check: Active project assignment + Explicit Permission Grant
        if ("ROLE_VENDOR".equals(user.getRole())) {
            if (user.getVendorId() == null) {
                throw new AccessDeniedException("Vendor user profile is incomplete");
            }

            if (doc.getProjectId() != null &&
                    !vendorAssignmentRepository.existsByProjectIdAndVendorIdAndStatus(doc.getProjectId(), user.getVendorId(), "ACTIVE")) {
                throw new AccessDeniedException("Access denied: You do not have an active assignment on project " + doc.getProjectId());
            }

            // Check explicit document permission grant
            Optional<DocumentPermissionEntity> perm = documentPermissionRepository
                    .findByDocumentIdAndGranteeTypeAndGranteeId(doc.getId(), "VENDOR", user.getVendorId());

            if (perm.isPresent()) {
                DocumentPermissionEntity p = perm.get();
                if (p.getExpiresAt() == null || p.getExpiresAt().isAfter(LocalDateTime.now())) {
                    return;
                }
            }

            throw new AccessDeniedException("Access denied: Explicit document permission has not been granted or has expired");
        }

        throw new AccessDeniedException("Access denied to document " + doc.getDocumentReference());
    }

    public void validateDocumentWriteAccess(DocumentEntity doc, Authentication auth) {
        validateDocumentReadAccess(doc, auth);

        Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();
        if (isInternalStaff(authorities)) {
            return;
        }

        UserEntity user = getAuthenticatedUser(auth);
        if ("ROLE_CLIENT".equals(user.getRole())) {
            if (user.getClientId() != null && user.getClientId().equals(doc.getClientId())
                    && "PUBLIC_CLIENT".equals(doc.getSecurityClassification())) {
                return;
            }
            if (user.getClientId() != null && "PUBLIC_CLIENT".equals(doc.getSecurityClassification())) {
                Optional<DocumentPermissionEntity> clientPerm = documentPermissionRepository
                        .findByDocumentIdAndGranteeTypeAndGranteeId(doc.getId(), "CLIENT", user.getClientId());
                if (clientPerm.isPresent() && "READ_WRITE".equalsIgnoreCase(clientPerm.get().getPermissionLevel())) {
                    if (clientPerm.get().getExpiresAt() == null || clientPerm.get().getExpiresAt().isAfter(LocalDateTime.now())) {
                        return;
                    }
                }
            }
            throw new AccessDeniedException("Client not authorized to edit this document");
        }

        if ("ROLE_VENDOR".equals(user.getRole())) {
            Optional<DocumentPermissionEntity> perm = documentPermissionRepository
                    .findByDocumentIdAndGranteeTypeAndGranteeId(doc.getId(), "VENDOR", user.getVendorId());
            if (perm.isPresent() && "READ_WRITE".equalsIgnoreCase(perm.get().getPermissionLevel())) {
                if (perm.get().getExpiresAt() == null || perm.get().getExpiresAt().isAfter(LocalDateTime.now())) {
                    return;
                }
            }
            throw new AccessDeniedException("Vendor does not possess active READ_WRITE permission on this document");
        }

        throw new AccessDeniedException("Access denied: write permission required");
    }

    private void checkNotArchived(DocumentEntity doc, String operation) {
        if ("ARCHIVED".equalsIgnoreCase(doc.getStatus())) {
            throw new IllegalStateException("Cannot " + operation + ": Document " + doc.getDocumentReference() + " is ARCHIVED");
        }
    }

    private void validateAuthenticated(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }
    }

    private void requireInternalStaff(Authentication auth, String action) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Access denied: Only internal staff can " + action);
        }
    }

    private boolean isInternalStaff(Collection<? extends GrantedAuthority> authorities) {
        return authorities.stream().anyMatch(a ->
                "ROLE_ADMIN".equals(a.getAuthority()) ||
                "ROLE_STAFF".equals(a.getAuthority()) ||
                "ROLE_PROJECT_MANAGER".equals(a.getAuthority()) ||
                "ROLE_PRINCIPAL_ARCHITECT".equals(a.getAuthority())
        );
    }

    private boolean isFinance(Collection<? extends GrantedAuthority> authorities) {
        return authorities.stream().anyMatch(a ->
                "ROLE_ADMIN".equals(a.getAuthority()) ||
                "ROLE_FINANCE_MANAGER".equals(a.getAuthority()) ||
                "ROLE_FINANCE_MAKER".equals(a.getAuthority()) ||
                "ROLE_FINANCE_CHECKER".equals(a.getAuthority()) ||
                "ROLE_FINANCE_AUDIT".equals(a.getAuthority())
        );
    }

    private boolean isLegalOrAdmin(Collection<? extends GrantedAuthority> authorities) {
        return authorities.stream().anyMatch(a ->
                "ROLE_ADMIN".equals(a.getAuthority()) ||
                "ROLE_PRINCIPAL_ARCHITECT".equals(a.getAuthority())
        );
    }

    private boolean isAdmin(Collection<? extends GrantedAuthority> authorities) {
        return authorities.stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private UserEntity getAuthenticatedUser(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found: " + auth.getName()));
    }

    private DocumentEntity getDocumentEntity(UUID id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));
    }

    private String generateDocumentReference() {
        int year = LocalDate.now().getYear();
        String prefix = "DOC-" + year + "-";
        long count = documentRepository.countByDocumentReferenceStartingWith(prefix) + 1;
        return String.format("%s%04d", prefix, count);
    }

    private void logAuditEvent(Authentication auth, String action, String entityId, String detailsJson) {
        try {
            auditEventRepository.save(AuditEventEntity.builder()
                    .actorId(auth.getName())
                    .actorRole(auth.getAuthorities().isEmpty() ? "UNKNOWN" : auth.getAuthorities().iterator().next().getAuthority())
                    .action(action)
                    .entityName("DOCUMENT")
                    .entityId(entityId)
                    .detailsJson(detailsJson)
                    .build());
        } catch (Exception ex) {
            log.error("Failed to record document audit event for action: {}", action, ex);
        }
    }

    private DocumentResponse toDocumentResponse(DocumentEntity doc, boolean includePermissions) {
        DocumentVersionResponse currentVersion = null;
        if (doc.getCurrentVersionId() != null) {
            currentVersion = documentVersionRepository.findById(doc.getCurrentVersionId())
                    .map(this::toVersionResponse)
                    .orElse(null);
        }

        List<DocumentPermissionResponse> permissions = null;
        if (includePermissions) {
            permissions = documentPermissionRepository.findByDocumentId(doc.getId()).stream()
                    .map(p -> DocumentPermissionResponse.builder()
                            .id(p.getId())
                            .documentId(p.getDocumentId())
                            .granteeType(p.getGranteeType())
                            .granteeId(p.getGranteeId())
                            .permissionLevel(p.getPermissionLevel())
                            .grantedBy(p.getGrantedBy())
                            .grantedAt(p.getGrantedAt())
                            .expiresAt(p.getExpiresAt())
                            .build())
                    .collect(Collectors.toList());
        }

        return DocumentResponse.builder()
                .id(doc.getId())
                .documentReference(doc.getDocumentReference())
                .title(doc.getTitle())
                .description(doc.getDescription())
                .category(doc.getCategory())
                .securityClassification(doc.getSecurityClassification())
                .clientId(doc.getClientId())
                .projectId(doc.getProjectId())
                .currentVersionId(doc.getCurrentVersionId())
                .status(doc.getStatus())
                .createdBy(doc.getCreatedBy())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .archivedAt(doc.getArchivedAt())
                .version(doc.getVersion())
                .currentVersion(currentVersion)
                .permissions(permissions)
                .build();
    }

    private DocumentVersionResponse toVersionResponse(DocumentVersionEntity v) {
        return DocumentVersionResponse.builder()
                .id(v.getId())
                .documentId(v.getDocumentId())
                .versionNumber(v.getVersionNumber())
                .originalFilename(v.getOriginalFilename())
                .mimeType(v.getMimeType())
                .fileSizeBytes(v.getFileSizeBytes())
                .sha256Checksum(v.getSha256Checksum())
                .storageProvider(v.getStorageProvider())
                .uploadedBy(v.getUploadedBy())
                .uploadedAt(v.getUploadedAt())
                .quarantineStatus(v.getQuarantineStatus())
                .build();
    }
}
