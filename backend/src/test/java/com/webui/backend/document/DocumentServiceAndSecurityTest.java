package com.webui.backend.document;

import com.webui.backend.controller.DocumentController;
import com.webui.backend.dto.document.DocumentDto.*;
import com.webui.backend.model.*;
import com.webui.backend.repository.*;
import com.webui.backend.service.DocumentService;
import com.webui.backend.storage.DocumentStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public class DocumentServiceAndSecurityTest {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private DocumentController documentController;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentVersionRepository documentVersionRepository;

    @Autowired
    private DocumentPermissionRepository documentPermissionRepository;

    @Autowired
    private DocumentStorageService storageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private OperationalProjectRepository projectRepository;

    @Autowired
    private ProjectVendorAssignmentRepository vendorAssignmentRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    private ClientEntity clientA;
    private ClientEntity clientB;
    private VendorEntity vendorA;
    private OperationalProjectEntity projectA;

    private Authentication adminAuth;
    private Authentication staffAuth;
    private Authentication clientAAuth;
    private Authentication clientBAuth;
    private Authentication vendorAAuth;
    private Authentication financeAuth;
    private Authentication architectAuth;

    // Helper: Valid PDF bytes starting with %PDF-
    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF".getBytes(StandardCharsets.ISO_8859_1);
    private static final byte[] VALID_PDF_V2_BYTES = "%PDF-1.4\n2 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF".getBytes(StandardCharsets.ISO_8859_1);

    @org.junit.jupiter.api.AfterEach
    public void cleanup() {
        try {
            documentPermissionRepository.deleteAll();
            documentVersionRepository.deleteAll();
            documentRepository.deleteAll();
            if (projectA != null && projectA.getId() != null) {
                vendorAssignmentRepository.deleteAll();
                projectRepository.delete(projectA);
            }
            if (clientA != null && clientA.getId() != null) {
                clientRepository.delete(clientA);
            }
            if (clientB != null && clientB.getId() != null) {
                clientRepository.delete(clientB);
            }
            if (vendorA != null && vendorA.getId() != null) {
                vendorRepository.delete(vendorA);
            }
        } catch (Exception ignored) {
        }
    }

    @BeforeEach
    public void setup() {
        cleanup();
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        // Setup clients
        clientA = clientRepository.save(ClientEntity.builder()
                .clientReference("CLI-DOC-" + suffix + "-A")
                .fullName("Client Alice")
                .email("alice-" + suffix + "@example.com")
                .phone("9876543211")
                .status("ACTIVE")
                .build());

        clientB = clientRepository.save(ClientEntity.builder()
                .clientReference("CLI-DOC-" + suffix + "-B")
                .fullName("Client Bob")
                .email("bob-" + suffix + "@example.com")
                .phone("9876543212")
                .status("ACTIVE")
                .build());

        // Setup vendor
        vendorA = vendorRepository.save(VendorEntity.builder()
                .vendorReference("VEN-DOC-" + suffix)
                .businessName("Apex Engineering")
                .contactPerson("Apex Contact")
                .email("vendor-" + suffix + "@example.com")
                .phone("9876543210")
                .category("FABRICATION")
                .status("ACTIVE")
                .build());

        // Setup operational project linked to clientA
        projectA = projectRepository.save(OperationalProjectEntity.builder()
                .projectReference("PRJ-DOC-" + suffix)
                .name("Villa Solarium")
                .projectType("RESIDENTIAL_ARCHITECTURE")
                .clientId(clientA.getId())
                .status("IN_PROGRESS")
                .build());

        String adminUser = "doc_admin_" + suffix;
        String staffUser = "doc_staff_" + suffix;
        String finUser = "doc_fin_" + suffix;
        String archUser = "doc_arch_" + suffix;
        String cliAUser = "doc_cli_a_" + suffix;
        String cliBUser = "doc_cli_b_" + suffix;
        String venAUser = "doc_ven_a_" + suffix;

        // Setup users
        userRepository.save(UserEntity.builder()
                .username(adminUser)
                .password("hash")
                .role("ROLE_ADMIN")
                .enabled(true)
                .build());

        userRepository.save(UserEntity.builder()
                .username(staffUser)
                .password("hash")
                .role("ROLE_STAFF")
                .enabled(true)
                .build());

        userRepository.save(UserEntity.builder()
                .username(finUser)
                .password("hash")
                .role("ROLE_FINANCE_MANAGER")
                .enabled(true)
                .build());

        userRepository.save(UserEntity.builder()
                .username(archUser)
                .password("hash")
                .role("ROLE_PRINCIPAL_ARCHITECT")
                .enabled(true)
                .build());

        userRepository.save(UserEntity.builder()
                .username(cliAUser)
                .password("hash")
                .role("ROLE_CLIENT")
                .clientId(clientA.getId())
                .enabled(true)
                .build());

        userRepository.save(UserEntity.builder()
                .username(cliBUser)
                .password("hash")
                .role("ROLE_CLIENT")
                .clientId(clientB.getId())
                .enabled(true)
                .build());

        userRepository.save(UserEntity.builder()
                .username(venAUser)
                .password("hash")
                .role("ROLE_VENDOR")
                .vendorId(vendorA.getId())
                .enabled(true)
                .build());

        // Setup auth tokens
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        staffAuth = new UsernamePasswordAuthenticationToken(staffUser, null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        clientAAuth = new UsernamePasswordAuthenticationToken(cliAUser, null, List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));
        clientBAuth = new UsernamePasswordAuthenticationToken(cliBUser, null, List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));
        vendorAAuth = new UsernamePasswordAuthenticationToken(venAUser, null, List.of(new SimpleGrantedAuthority("ROLE_VENDOR")));
        financeAuth = new UsernamePasswordAuthenticationToken(finUser, null, List.of(new SimpleGrantedAuthority("ROLE_FINANCE_MANAGER")));
        architectAuth = new UsernamePasswordAuthenticationToken(archUser, null, List.of(new SimpleGrantedAuthority("ROLE_PRINCIPAL_ARCHITECT")));
    }

    // ==========================================
    // 1. Upload & Storage Isolation Tests
    // ==========================================

    @Test
    public void testUploadDocumentSuccess_InternalStaff() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "structural_blueprint.pdf", "application/pdf", VALID_PDF_BYTES
        );

        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Structural Blueprint Elevation")
                .description("Foundation drawings for Villa Solarium")
                .category("BLUEPRINT_DRAWING")
                .securityClassification("INTERNAL_STAFF")
                .projectId(projectA.getId())
                .build();

        DocumentResponse response = documentService.uploadDocument(req, file, staffAuth);

        assertNotNull(response.getId());
        assertTrue(response.getDocumentReference().startsWith("DOC-"));
        assertEquals("Structural Blueprint Elevation", response.getTitle());
        assertEquals("BLUEPRINT_DRAWING", response.getCategory());
        assertEquals("INTERNAL_STAFF", response.getSecurityClassification());
        assertEquals("AVAILABLE", response.getStatus());
        assertNotNull(response.getCurrentVersion());
        assertEquals(1, response.getCurrentVersion().getVersionNumber());
        assertEquals("structural_blueprint.pdf", response.getCurrentVersion().getOriginalFilename());

        // Verify storage file exists on disk
        DocumentVersionEntity version = documentVersionRepository.findById(response.getCurrentVersionId()).orElseThrow();
        assertTrue(storageService.fileExists(version.getStorageKey()));

        // Verify audit event
        List<AuditEventEntity> events = auditEventRepository.findByEntityNameAndEntityIdOrderByTimestampDesc("DOCUMENT", response.getId().toString());
        assertFalse(events.isEmpty());
        assertEquals("DOCUMENT_UPLOAD", events.get(0).getAction());
    }

    @Test
    public void testUploadDocument_PathTraversalSanitization() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "../../../../etc/malicious_elevation.pdf", "application/pdf", VALID_PDF_BYTES
        );

        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Path Traversal Test")
                .category("BLUEPRINT_DRAWING")
                .securityClassification("INTERNAL_STAFF")
                .build();

        DocumentResponse response = documentService.uploadDocument(req, file, staffAuth);

        // Original filename must be sanitized to strip path components
        assertEquals("malicious_elevation.pdf", response.getCurrentVersion().getOriginalFilename());

        DocumentVersionEntity version = documentVersionRepository.findById(response.getCurrentVersionId()).orElseThrow();
        // Server storage key must be safe server-generated path
        assertFalse(version.getStorageKey().contains(".."));
        assertTrue(storageService.fileExists(version.getStorageKey()));
    }

    @Test
    public void testUploadDocument_DangerousExecutableRejected() {
        // Forbidden extension .exe
        MockMultipartFile exeFile = new MockMultipartFile(
                "file", "blueprint.exe", "application/octet-stream", "MZsomeexecutablepayload".getBytes()
        );

        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Executable Test")
                .category("OTHER")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                documentService.uploadDocument(req, exeFile, staffAuth));
        assertTrue(ex.getMessage().contains("strictly prohibited"));

        // Dangerous header MZ with .pdf extension
        byte[] fakePdfWithMz = new byte[]{'M', 'Z', 0, 1, 2, 3};
        MockMultipartFile spoofedFile = new MockMultipartFile(
                "file", "invoice.pdf", "application/pdf", fakePdfWithMz
        );

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () ->
                documentService.uploadDocument(req, spoofedFile, staffAuth));
        assertTrue(ex2.getMessage().contains("Windows PE executable signature detected"));

        // Script shebang #!
        byte[] shebangScript = "#!/bin/bash\nrm -rf /".getBytes();
        MockMultipartFile scriptFile = new MockMultipartFile(
                "file", "cleanup.sh", "text/plain", shebangScript
        );

        assertThrows(IllegalArgumentException.class, () ->
                documentService.uploadDocument(req, scriptFile, staffAuth));
    }

    @Test
    public void testUploadDocument_MagicByteMismatchRejected() {
        // Plain text bytes uploaded as .pdf
        byte[] notPdfBytes = "Hello this is plain text, not a real PDF file".getBytes();
        MockMultipartFile fakePdf = new MockMultipartFile(
                "file", "drawing.pdf", "application/pdf", notPdfBytes
        );

        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Magic Byte Check")
                .category("BLUEPRINT_DRAWING")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                documentService.uploadDocument(req, fakePdf, staffAuth));
        assertTrue(ex.getMessage().contains("does not match standard PDF header signature"));
    }

    // ==========================================
    // 2. Multi-Tenant Authorization & Compartmentalization
    // ==========================================

    @Test
    public void testClientIsolation_CrossClientAccessDenied() throws IOException {
        MockMultipartFile fileA = new MockMultipartFile(
                "file", "client_a_contract.pdf", "application/pdf", VALID_PDF_BYTES
        );

        CreateDocumentRequest reqA = CreateDocumentRequest.builder()
                .title("Alice Architecture Agreement")
                .category("CONTRACT")
                .securityClassification("PUBLIC_CLIENT")
                .clientId(clientA.getId())
                .build();

        DocumentResponse docA = documentService.uploadDocument(reqA, fileA, clientAAuth);

        // Client A can read their own document
        assertNotNull(documentService.getDocumentById(docA.getId(), clientAAuth));

        // Client A can download their own document
        DownloadFileResult downloadA = documentService.downloadDocument(docA.getId(), clientAAuth);
        assertNotNull(downloadA);
        assertEquals("client_a_contract.pdf", downloadA.originalFilename());

        // Client B CANNOT read Client A's document
        assertThrows(AccessDeniedException.class, () ->
                documentService.getDocumentById(docA.getId(), clientBAuth));

        // Client B CANNOT download Client A's document
        assertThrows(AccessDeniedException.class, () ->
                documentService.downloadDocument(docA.getId(), clientBAuth));
    }

    @Test
    public void testVendorAccess_RequiresActiveAssignmentAndExplicitGrant() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "project_structural_specs.pdf", "application/pdf", VALID_PDF_BYTES
        );

        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Villa Solarium Structural Specs")
                .category("SPECIFICATION")
                .securityClassification("PUBLIC_CLIENT")
                .projectId(projectA.getId())
                .build();

        DocumentResponse doc = documentService.uploadDocument(req, file, staffAuth);

        // 1. Without assignment or grant -> Vendor cannot access
        assertThrows(AccessDeniedException.class, () ->
                documentService.getDocumentById(doc.getId(), vendorAAuth));

        // 2. Add ACTIVE assignment for Vendor on Project A
        vendorAssignmentRepository.save(ProjectVendorAssignmentEntity.builder()
                .projectId(projectA.getId())
                .vendorId(vendorA.getId())
                .scopeOfWork("Structural Fabrication")
                .status("ACTIVE")
                .assignedBy("staff")
                .build());

        // Still lacks explicit document permission grant
        assertThrows(AccessDeniedException.class, () ->
                documentService.getDocumentById(doc.getId(), vendorAAuth));

        // 3. Grant READ permission to Vendor A
        documentService.grantPermission(doc.getId(), GrantPermissionRequest.builder()
                .granteeType("VENDOR")
                .granteeId(vendorA.getId())
                .permissionLevel("READ")
                .build(), staffAuth);

        // Vendor A now has read and download access
        DocumentResponse vendorDocView = documentService.getDocumentById(doc.getId(), vendorAAuth);
        assertNotNull(vendorDocView);

        DownloadFileResult vendorDownload = documentService.downloadDocument(doc.getId(), vendorAAuth);
        assertNotNull(vendorDownload);

        // 4. Vendor A with READ permission CANNOT upload a new version
        MockMultipartFile v2File = new MockMultipartFile("file", "v2.pdf", "application/pdf", VALID_PDF_V2_BYTES);
        assertThrows(AccessDeniedException.class, () ->
                documentService.uploadVersion(doc.getId(), v2File, vendorAAuth));

        // 5. Upgrade permission to READ_WRITE -> Vendor can upload version
        documentService.grantPermission(doc.getId(), GrantPermissionRequest.builder()
                .granteeType("VENDOR")
                .granteeId(vendorA.getId())
                .permissionLevel("READ_WRITE")
                .build(), staffAuth);

        DocumentResponse updatedByVendor = documentService.uploadVersion(doc.getId(), v2File, vendorAAuth);
        assertEquals(2, updatedByVendor.getCurrentVersion().getVersionNumber());

        // 6. If assignment is terminated -> Vendor loses access immediately
        ProjectVendorAssignmentEntity assignment = vendorAssignmentRepository
                .findByProjectIdAndVendorId(projectA.getId(), vendorA.getId()).orElseThrow();
        assignment.setStatus("TERMINATED");
        vendorAssignmentRepository.save(assignment);

        assertThrows(AccessDeniedException.class, () ->
                documentService.getDocumentById(doc.getId(), vendorAAuth));
    }

    @Test
    public void testClassificationCompartmentalization_FinanceAndLegal() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "financial_audit.pdf", "application/pdf", VALID_PDF_BYTES);

        // A. CONFIDENTIAL_FINANCE Document
        CreateDocumentRequest finReq = CreateDocumentRequest.builder()
                .title("Q3 Studio Financial Audit")
                .category("INVOICE_RECEIPT")
                .securityClassification("CONFIDENTIAL_FINANCE")
                .build();

        DocumentResponse finDoc = documentService.uploadDocument(finReq, file, adminAuth);

        // Client and Vendor blocked
        assertThrows(AccessDeniedException.class, () -> documentService.getDocumentById(finDoc.getId(), clientAAuth));
        assertThrows(AccessDeniedException.class, () -> documentService.getDocumentById(finDoc.getId(), vendorAAuth));

        // Non-finance staff blocked
        assertThrows(AccessDeniedException.class, () -> documentService.getDocumentById(finDoc.getId(), staffAuth));

        // Finance manager & Admin allowed
        assertNotNull(documentService.getDocumentById(finDoc.getId(), financeAuth));
        assertNotNull(documentService.getDocumentById(finDoc.getId(), adminAuth));

        // B. RESTRICTED_LEGAL Document
        CreateDocumentRequest legalReq = CreateDocumentRequest.builder()
                .title("Confidential NDA & Executive Retainer")
                .category("CONTRACT")
                .securityClassification("RESTRICTED_LEGAL")
                .build();

        DocumentResponse legalDoc = documentService.uploadDocument(legalReq, file, adminAuth);

        // Staff and Finance blocked
        assertThrows(AccessDeniedException.class, () -> documentService.getDocumentById(legalDoc.getId(), staffAuth));
        assertThrows(AccessDeniedException.class, () -> documentService.getDocumentById(legalDoc.getId(), financeAuth));

        // Principal Architect & Admin allowed
        assertNotNull(documentService.getDocumentById(legalDoc.getId(), architectAuth));
        assertNotNull(documentService.getDocumentById(legalDoc.getId(), adminAuth));
    }

    // ==========================================
    // 3. Versioning & Download Tests
    // ==========================================

    @Test
    public void testVersioningFlow_DistinctStorageKeysAndIntegrity() throws IOException {
        MockMultipartFile v1 = new MockMultipartFile("file", "design_v1.pdf", "application/pdf", VALID_PDF_BYTES);
        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Interior Layout Evolution")
                .category("BLUEPRINT_DRAWING")
                .securityClassification("INTERNAL_STAFF")
                .build();

        DocumentResponse doc = documentService.uploadDocument(req, v1, staffAuth);
        assertEquals(1, doc.getCurrentVersion().getVersionNumber());
        String v1StorageKey = documentVersionRepository.findById(doc.getCurrentVersionId()).orElseThrow().getStorageKey();

        // Upload Version 2
        MockMultipartFile v2 = new MockMultipartFile("file", "design_v2.pdf", "application/pdf", VALID_PDF_V2_BYTES);
        DocumentResponse docV2 = documentService.uploadVersion(doc.getId(), v2, staffAuth);

        assertEquals(2, docV2.getCurrentVersion().getVersionNumber());
        String v2StorageKey = documentVersionRepository.findById(docV2.getCurrentVersionId()).orElseThrow().getStorageKey();

        // Storage keys must be distinct (append-only, never overwrite)
        assertNotEquals(v1StorageKey, v2StorageKey);
        assertTrue(storageService.fileExists(v1StorageKey));
        assertTrue(storageService.fileExists(v2StorageKey));

        // Download Version 1 specifically
        DownloadFileResult d1 = documentService.downloadDocumentVersion(doc.getId(), 1, staffAuth);
        assertEquals("design_v1.pdf", d1.originalFilename());
        byte[] readV1Bytes = d1.inputStream().readAllBytes();
        assertArrayEquals(VALID_PDF_BYTES, readV1Bytes);

        // Download active version (should be Version 2)
        DownloadFileResult dActive = documentService.downloadDocument(doc.getId(), staffAuth);
        assertEquals("design_v2.pdf", dActive.originalFilename());
        byte[] readV2Bytes = dActive.inputStream().readAllBytes();
        assertArrayEquals(VALID_PDF_V2_BYTES, readV2Bytes);
    }

    // ==========================================
    // 4. Lifecycle & Archival State Machine Tests
    // ==========================================

    @Test
    public void testArchivedDocument_MutationsProhibited() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "contract.pdf", "application/pdf", VALID_PDF_BYTES);
        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Final Terminated Contract")
                .category("CONTRACT")
                .securityClassification("INTERNAL_STAFF")
                .build();

        DocumentResponse doc = documentService.uploadDocument(req, file, staffAuth);

        // Archive document
        DocumentResponse archived = documentService.archiveDocument(doc.getId(), staffAuth);
        assertEquals("ARCHIVED", archived.getStatus());
        assertNotNull(archived.getArchivedAt());

        // Attempting to upload new version to archived doc must fail
        MockMultipartFile newVer = new MockMultipartFile("file", "v2.pdf", "application/pdf", VALID_PDF_V2_BYTES);
        IllegalStateException ex1 = assertThrows(IllegalStateException.class, () ->
                documentService.uploadVersion(doc.getId(), newVer, staffAuth));
        assertTrue(ex1.getMessage().contains("is ARCHIVED"));

        // Attempting to change classification on archived doc must fail
        IllegalStateException ex2 = assertThrows(IllegalStateException.class, () ->
                documentService.updateClassification(doc.getId(), UpdateClassificationRequest.builder()
                        .securityClassification("PUBLIC_CLIENT")
                        .build(), staffAuth));
        assertTrue(ex2.getMessage().contains("is ARCHIVED"));

        // Attempting to grant permission on archived doc must fail
        IllegalStateException ex3 = assertThrows(IllegalStateException.class, () ->
                documentService.grantPermission(doc.getId(), GrantPermissionRequest.builder()
                        .granteeType("VENDOR")
                        .granteeId(vendorA.getId())
                        .build(), staffAuth));
        assertTrue(ex3.getMessage().contains("is ARCHIVED"));

        // Restore document -> mutations permitted again
        DocumentResponse restored = documentService.restoreDocument(doc.getId(), staffAuth);
        assertEquals("AVAILABLE", restored.getStatus());
        assertNull(restored.getArchivedAt());

        DocumentResponse v2Added = documentService.uploadVersion(doc.getId(), newVer, staffAuth);
        assertEquals(2, v2Added.getCurrentVersion().getVersionNumber());
    }

    // ==========================================
    // 5. Quarantine & Security Inspection Tests
    // ==========================================

    @Test
    public void testQuarantinedFile_BlockedForNonAdmin_AdminReleaseFlow() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "suspicious_doc.pdf", "application/pdf", VALID_PDF_BYTES);
        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Suspicious Blueprint")
                .category("BLUEPRINT_DRAWING")
                .securityClassification("PUBLIC_CLIENT")
                .clientId(clientA.getId())
                .build();

        DocumentResponse doc = documentService.uploadDocument(req, file, staffAuth);

        // Manually place in quarantine
        DocumentEntity entity = documentRepository.findById(doc.getId()).orElseThrow();
        entity.setStatus("QUARANTINED");
        documentRepository.save(entity);

        // Non-admin client attempts download -> AccessDeniedException
        assertThrows(AccessDeniedException.class, () ->
                documentService.downloadDocument(doc.getId(), clientAAuth));

        // Staff can inspect or admin can download
        DownloadFileResult staffInspect = documentService.downloadDocument(doc.getId(), staffAuth);
        assertNotNull(staffInspect);

        // Admin releases quarantine
        DocumentResponse released = documentService.releaseQuarantine(doc.getId(), adminAuth);
        assertEquals("AVAILABLE", released.getStatus());

        // Client can now download
        DownloadFileResult clientDownload = documentService.downloadDocument(doc.getId(), clientAAuth);
        assertNotNull(clientDownload);
    }

    @Test
    public void testInfectedFile_AutomaticallyQuarantined_AdminReleaseFailsIfStillInfected() throws IOException {
        // Construct valid PDF that also embeds the standard EICAR test signature
        byte[] infectedPdfBytes = ("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n" +
                "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*\n" +
                "trailer\n<< >>\n%%EOF").getBytes(StandardCharsets.ISO_8859_1);

        MockMultipartFile file = new MockMultipartFile("file", "eicar_test.pdf", "application/pdf", infectedPdfBytes);
        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Infected Blueprint Submission")
                .category("BLUEPRINT_DRAWING")
                .securityClassification("PUBLIC_CLIENT")
                .clientId(clientA.getId())
                .build();

        // 1. Uploading infected file succeeds in ingestion but is automatically QUARANTINED
        DocumentResponse doc = documentService.uploadDocument(req, file, staffAuth);
        assertEquals("QUARANTINED", doc.getStatus());

        // 2. Client is blocked from downloading quarantined file
        assertThrows(AccessDeniedException.class, () ->
                documentService.downloadDocument(doc.getId(), clientAAuth));

        // 3. Admin attempts to release quarantine: rescan detects persistent EICAR malware and throws IllegalStateException
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                documentService.releaseQuarantine(doc.getId(), adminAuth));
        assertTrue(ex.getMessage().contains("Cannot release document from quarantine: Antivirus rescan failed"));

        // 4. Verify document remains in QUARANTINED status
        DocumentEntity entity = documentRepository.findById(doc.getId()).orElseThrow();
        assertEquals("QUARANTINED", entity.getStatus());
    }

    @Test
    public void testDownloadHeaders_CacheControlAndNoSniffPresent() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "secure_plan.pdf", "application/pdf", VALID_PDF_BYTES);
        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Secure Floor Plan")
                .category("BLUEPRINT_DRAWING")
                .securityClassification("INTERNAL_STAFF")
                .build();

        DocumentResponse doc = documentService.uploadDocument(req, file, staffAuth);

        // 1. Verify Active Download Endpoint Headers
        ResponseEntity<?> resp = documentController.downloadDocument(doc.getId(), staffAuth);
        assertTrue(resp.getStatusCode().is2xxSuccessful());

        String cacheControl = resp.getHeaders().getCacheControl();
        assertNotNull(cacheControl, "Cache-Control must not be null");
        assertTrue(cacheControl.contains("no-store"), "Cache-Control must contain no-store");
        assertTrue(cacheControl.contains("no-cache"), "Cache-Control must contain no-cache");
        assertTrue(cacheControl.contains("must-revalidate"), "Cache-Control must contain must-revalidate");

        assertEquals("no-cache", resp.getHeaders().getPragma(), "Pragma must be no-cache");
        assertEquals(0, resp.getHeaders().getExpires(), "Expires header must be 0");
        assertEquals("nosniff", resp.getHeaders().getFirst("X-Content-Type-Options"), "X-Content-Type-Options must be nosniff");
        assertNotNull(resp.getHeaders().getFirst("X-Checksum-SHA256"), "X-Checksum-SHA256 must be present");
        assertTrue(resp.getHeaders().getFirst("Content-Disposition").contains("secure_plan.pdf"));

        // 2. Verify Version Download Endpoint Headers
        ResponseEntity<?> verResp = documentController.downloadDocumentVersion(doc.getId(), 1, staffAuth);
        assertTrue(verResp.getStatusCode().is2xxSuccessful());

        String verCacheControl = verResp.getHeaders().getCacheControl();
        assertNotNull(verCacheControl);
        assertTrue(verCacheControl.contains("no-store"));
        assertTrue(verCacheControl.contains("no-cache"));
        assertTrue(verCacheControl.contains("must-revalidate"));

        assertEquals("no-cache", verResp.getHeaders().getPragma());
        assertEquals(0, verResp.getHeaders().getExpires());
        assertEquals("nosniff", verResp.getHeaders().getFirst("X-Content-Type-Options"));
        assertNotNull(verResp.getHeaders().getFirst("X-Checksum-SHA256"));
    }

    // ==========================================
    // 6. Cryptographic Integrity & Audit Verification
    // ==========================================

    @Test
    public void testSha256ChecksumVerification() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "spec.pdf", "application/pdf", VALID_PDF_BYTES);
        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Specification Document")
                .category("SPECIFICATION")
                .securityClassification("INTERNAL_STAFF")
                .build();

        DocumentResponse doc = documentService.uploadDocument(req, file, staffAuth);

        // Manually compute expected SHA-256
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] expectedHash = md.digest(VALID_PDF_BYTES);
        StringBuilder sb = new StringBuilder();
        for (byte b : expectedHash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) sb.append('0');
            sb.append(hex);
        }
        String expectedSha256 = sb.toString();

        assertEquals(expectedSha256, doc.getCurrentVersion().getSha256Checksum());

        DownloadFileResult download = documentService.downloadDocument(doc.getId(), staffAuth);
        assertEquals(expectedSha256, download.sha256Checksum());
    }

    @Test
    public void testAuditTrailVerification() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "audit_test.pdf", "application/pdf", VALID_PDF_BYTES);
        CreateDocumentRequest req = CreateDocumentRequest.builder()
                .title("Audit Trail Test Doc")
                .category("CONTRACT")
                .securityClassification("INTERNAL_STAFF")
                .build();

        DocumentResponse doc = documentService.uploadDocument(req, file, staffAuth);

        // Download document
        documentService.downloadDocument(doc.getId(), staffAuth);

        // Update classification
        documentService.updateClassification(doc.getId(), UpdateClassificationRequest.builder()
                .securityClassification("PUBLIC_CLIENT")
                .build(), staffAuth);

        // Archive document
        documentService.archiveDocument(doc.getId(), staffAuth);

        // Verify audit trail
        List<AuditEventEntity> auditEvents = documentService.getDocumentAuditTrail(doc.getId(), staffAuth);
        assertNotNull(auditEvents);
        assertTrue(auditEvents.size() >= 4);

        List<String> actions = auditEvents.stream().map(AuditEventEntity::getAction).toList();
        assertTrue(actions.contains("DOCUMENT_UPLOAD"));
        assertTrue(actions.contains("DOCUMENT_DOWNLOAD"));
        assertTrue(actions.contains("DOCUMENT_CLASSIFICATION_CHANGED"));
        assertTrue(actions.contains("DOCUMENT_ARCHIVED"));
    }

    @Test
    public void testListDocuments_MultiTenantFilters() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "villa_drawing.pdf", "application/pdf", VALID_PDF_BYTES);

        CreateDocumentRequest reqA = CreateDocumentRequest.builder()
                .title("Villa Solarium Ground Floor")
                .category("BLUEPRINT_DRAWING")
                .securityClassification("PUBLIC_CLIENT")
                .clientId(clientA.getId())
                .projectId(projectA.getId())
                .build();

        DocumentResponse docA = documentService.uploadDocument(reqA, file, staffAuth);

        // Staff listing without filter sees document
        List<DocumentResponse> staffList = documentService.listDocuments(null, null, null, null, staffAuth);
        assertTrue(staffList.stream().anyMatch(d -> d.getId().equals(docA.getId())));

        // Client A listing sees document
        List<DocumentResponse> clientAList = documentService.listDocuments(null, null, null, null, clientAAuth);
        assertTrue(clientAList.stream().anyMatch(d -> d.getId().equals(docA.getId())));

        // Client B listing DOES NOT see Client A's document
        List<DocumentResponse> clientBList = documentService.listDocuments(null, null, null, null, clientBAuth);
        assertFalse(clientBList.stream().anyMatch(d -> d.getId().equals(docA.getId())));
    }
}
