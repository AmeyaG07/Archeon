# ArcheOn Backend — Independent Phase 4.3 Acceptance Audit

**Audit Target:** `backend/phase4.3-document-management`  
**Target Commit:** `57bcf4d313618a4dff18f0dba65176050c818e91`  
**Base Commit:** `506d2eb2ba788c3cbeb59c119508b021466b4cef` (parent: `89637809eae42f44419b44563315c8b5aa42e48c`)  
**Role:** Independent Senior Application Security Auditor & Principal Architect  
**Audit Date:** 2026-11-19  
**Audit Mode:** STRICT READ-ONLY AUDIT (Zero application code, migration, or git modifications)  
**Deliverable:** [PHASE4_3_INDEPENDENT_ACCEPTANCE.md](file:///D:/WEBUI/audit/backend/PHASE4_3_INDEPENDENT_ACCEPTANCE.md)  
**Final Verdict:** **ACCEPTED WITH CONDITIONS**

---

## 1. Executive Summary

An exhaustive, independent, read-only architectural and security acceptance audit was conducted on commit `57bcf4d` of branch `backend/phase4.3-document-management`. The evaluation examined the newly introduced Document Management System (DMS), secure object storage abstraction, file upload validation engine, malware scanning subsystem, multi-tenant authorization policies, cryptographic versioning, tamper-evident audit logging, and Flyway database migration `V9`.

The implementation introduces enterprise-grade object storage decoupling and defensible access boundaries:
1. **Physical Storage Decoupling & Path Traversal Immunity:** File binary payloads are stored in an isolated, private directory structure (`backend/storage/private`), completely outside the application server web root and database. Storage keys are generated strictly server-side using immutable UUIDs and date hierarchies (`documents/{yyyy}/{MM}/{docId}/{versionId}.bin`), eliminating path traversal and overwrite risks.
2. **Pre-Storage File Content Validation:** The `DocumentSecurityValidator` enforces a 25MB maximum file size, restricts file extensions to a strict architectural allowlist (`pdf`, `dwg`, `dxf`, `png`, `jpg`, `jpeg`, `xlsx`, `csv`), actively rejects dangerous executable extensions and script signatures (DOS MZ, Linux ELF, Java Bytecode CAFEBABE, Shebang `#`), verifies magic byte headers, and calculates cryptographic SHA-256 digests.
3. **Multi-Tenant & Role Compartmentalization:** Client isolation, vendor isolation (requiring active project assignment plus explicit document permission), and strict classification boundaries (`INTERNAL_STAFF`, `RESTRICTED_FINANCE`, `CONFIDENTIAL_LEGAL`, `PUBLIC_CLIENT`) are enforced across all read, list, and mutation endpoints.
4. **Lifecycle & Archival Governance:** State transitions (`AVAILABLE`, `QUARANTINED`, `ARCHIVED`, `REJECTED`) are strictly enforced. Archived documents are frozen against version additions, classification edits, and permission grants. Non-admins cannot download quarantined documents.
5. **Tamper-Evident Audit Trail:** Every lifecycle operation (upload, download, version creation, permission grant/revoke, classification change, archival, quarantine release) records structured audit events in `audit_events`.
6. **Automated Verification:** The entire backend test suite was executed: **115 of 115 tests passed** with zero failures, zero errors, and zero JVM crashes.

### Acceptance Determination
While the architecture and access controls are exceptionally solid, **Phase 4.3 is ACCEPTED WITH CONDITIONS** due to two security findings identified during static analysis:
- **Finding 4.3-01 (High):** `DefaultPolicyMalwareScanner` runs in `PASS_THROUGH` mode by default, which performs static heuristic checks but fails open without integrating an active anti-virus engine (e.g. ClamAV).
- **Finding 4.3-02 (Medium):** File download endpoints do not explicitly send downstream cache prevention headers (`Cache-Control: no-cache, no-store, must-revalidate`), risking local disk caching of sensitive blueprints on shared workstations.

---

## 2. Step 1 — Git and Baseline Verification

| Inspection Item | Requirement | Observed Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Current Branch** | `backend/phase4.3-document-management` | **VERIFIED** | `git branch --show-current` confirmed target branch. |
| **Target Commit** | `57bcf4d` | **VERIFIED** | `57bcf4d313618a4dff18f0dba65176050c818e91` |
| **Parent / Base Commit** | `506d2eb` | **VERIFIED** | `git rev-parse HEAD~1` confirmed `506d2eb2ba788c3cbeb59c119508b021466b4cef` (Phase 4.2.1 base). |
| **Frontend Isolation** | Zero frontend modifications | **VERIFIED** | `git diff --stat 506d2eb 57bcf4d` verified that only `backend/src/` and `audit/backend/` files changed. Zero frontend files modified. |
| **Working Tree Status** | Clean application source tree | **VERIFIED** | No uncommitted modifications exist in `backend/src/`. |
| **Commit Scope** | Focused exclusively on Phase 4.3 DMS | **VERIFIED** | 24 files changed (3,493 insertions, 0 deletions) covering models, repos, storage services, validators, controller, migration `V9`, and tests. |

---

## 3. Step 2 — Upload Security & Storage Architecture

### 3.1 Storage Decoupling & Sandboxing
- **Storage Subsystem:** [LocalPrivateStorageService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/storage/LocalPrivateStorageService.java)
- **Path Traversal Prevention:** The service normalizes paths against the absolute canonical root `rootStoragePath` ([L43-L47](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/storage/LocalPrivateStorageService.java#L43-L47)):
  ```java
  Path resolved = this.rootStoragePath.resolve(storageKey).normalize();
  if (!resolved.startsWith(this.rootStoragePath)) {
      log.error("Directory traversal attempt detected! storageKey: {}", storageKey);
      throw new SecurityException("Invalid storage key path: outside configured storage root");
  }
  ```
- **Zero Raw User Input in Keys:** The service does not trust client filenames. Storage keys are generated strictly server-side ([DocumentService.java#L191](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/DocumentService.java#L191)):
  ```java
  String storageKey = String.format("documents/%d/%02d/%s/%s.bin",
          now.getYear(), now.getMonthValue(), doc.getId(), versionId);
  ```
- **Physical Web Root Isolation:** Stored in `./storage/private`, completely disjoint from any static resource handlers or web-accessible roots. Files cannot be accessed directly via URL traversal.
- **Transactional Failure Cleanup:** If database persistence fails after file storage, the catch block calls `storageService.deleteFile(storageKey)` ([DocumentService.java#L225](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/DocumentService.java#L225)), ensuring orphaned binary blobs do not accumulate on disk.

### 3.2 Filename & File Signature Sanitization
- **Inspection Target:** [DocumentSecurityValidator.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DocumentSecurityValidator.java)
- **Filename Sanitization:** Strips directory separators (`/`, `\`), null bytes (`\0`), control characters (`\p{Cntrl}`), and relative dot paths (`.` / `..`) ([L102-L118](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DocumentSecurityValidator.java#L102-L118)).
- **Extension Enforcement:** Rejects forbidden extensions (`.exe`, `.bat`, `.cmd`, `.sh`, `.ps1`, `.vbs`, `.js`, `.jsp`, `.php`, `.jar`, `.py`, `.dll`, etc.) and restricts uploads to an explicit allowlist: `pdf, dwg, dxf, png, jpg, jpeg, xlsx, csv` ([L30-L37](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DocumentSecurityValidator.java#L30-L37)).
- **Dangerous Executable Signatures Check:** Directly inspects raw byte prefixes ([L128-L149](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DocumentSecurityValidator.java#L128-L149)):
  - Windows PE / DOS: `MZ` (`0x4D, 0x5A`)
  - Linux ELF: `\x7fELF` (`0x7F, 0x45, 0x4C, 0x46`)
  - Java Bytecode: `CAFEBABE` (`0xCA, 0xFE, 0xBA, 0xBE`)
  - Shell Script: Shebang `#!` (`0x23, 0x21`)
- **Magic-Byte Header Verification:**
  - PDF: `%PDF-` (`0x25, 0x50, 0x44, 0x46, 0x2D`)
  - PNG: `\x89PNG\r\n\x1a\n`
  - JPEG: `\xFF\xD8\xFF`
  - AutoCAD DWG: `AC10` (`0x41, 0x43, 0x31, 0x30`)
  - AutoCAD DXF: ASCII validation for `SECTION` / `HEADER` blocks
  - Excel XLSX: OpenXML ZIP signature `PK\x03\x04`
  - CSV: Scanned for null bytes to prevent binary smuggling

---

## 4. Step 3 — Malware and Heuristic Scanning Analysis

### 4.1 Scanner Architecture & Implementation
- **Interface:** [MalwareScanner.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/MalwareScanner.java)
- **Implementation:** [DefaultPolicyMalwareScanner.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DefaultPolicyMalwareScanner.java)
- **Scanning Flow:** Invoked during document creation and version upload:
  ```java
  MalwareScanner.ScanResult scanResult = malwareScanner.scan(
          new ByteArrayInputStream(validFile.fileBytes()),
          validFile.sanitizedFilename(),
          validFile.sizeBytes());
  ```
- **Quarantine Enforcement:**
  - If `scanResult.passed()` is false, the document status is set to `QUARANTINED` and the version `quarantineStatus` is set to `QUARANTINED` ([DocumentService.java#L201-L208](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/DocumentService.java#L201-L208)).
  - Quarantined files are strictly blocked from downloads by regular users; only `ROLE_ADMIN` can release or download quarantined documents ([DocumentService.java#L346-L352](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/DocumentService.java#L346-L352)).

### 4.2 Critical Audit Finding: Static Heuristics vs. Active Antivirus
- **Finding 4.3-01:** The current scanner operates in `PASS_THROUGH` mode by default. While `DocumentSecurityValidator` performs static file header and magic byte validation, **static header validation must never be conflated with dynamic anti-virus scanning**.
- **Deficiency:** A valid PDF file starting with `%PDF-` can still contain weaponized JavaScript streams, embedded exploits, or malicious macro payloads in XLSX files. In `PASS_THROUGH` mode without an active anti-virus engine (e.g. ClamAV daemon), such files pass immediately into `AVAILABLE` status.
- **Requirement:** See Section 12 for the required remediation condition.

---

## 5. Step 4 — Multi-Tenant Authorization & Compartmentalization

### 5.1 Authorization Matrix

| Actor / Role | Client Isolation | Vendor Isolation | Internal Documents | Confidential Finance | Restricted Legal | Public Client |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ROLE_ADMIN** | Full (All) | Full (All) | Full Read/Write | Full Read/Write | Full Read/Write | Full Read/Write |
| **ROLE_PRINCIPAL_ARCHITECT** | Full (All) | Full (All) | Full Read/Write | Full Read/Write | Full Read/Write | Full Read/Write |
| **ROLE_PROJECT_MANAGER** | Internal Staff | Active Project Only | Full Read/Write | Denied | Denied | Full Read/Write |
| **ROLE_STAFF** | Internal Staff | Active Project Only | Full Read/Write | Denied | Denied | Full Read/Write |
| **ROLE_FINANCE_MANAGER** | Internal Staff | Active Project Only | Read | Full Read/Write | Denied | Read |
| **ROLE_CLIENT** | Own Client Only | Denied | Denied | Denied | Denied | Own Client Only (or explicit grant) |
| **ROLE_VENDOR** | Denied | Active Project + Explicit Grant Only | Denied | Denied | Denied | Explicit Grant Only |

### 5.2 Direct Object Reference (BOLA / IDOR) Defense
- **Method:** [DocumentService.java#L131-L180](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/DocumentService.java#L131-L180) (`validateDocumentReadAccess`)
- **Client Defense:** If user has `ROLE_CLIENT`, the system verifies `user.getClientId().equals(doc.getClientId())` and requires either `PUBLIC_CLIENT` classification or an explicit `grantee_type = 'CLIENT'` record in `document_permissions`. Attempting to access Document B belonging to another client throws `AccessDeniedException`.
- **Vendor Defense:** If user has `ROLE_VENDOR`, the system verifies:
  1. `user.getVendorId() != null`
  2. An active assignment exists on the document's project:
     `vendorAssignmentRepository.existsByProjectIdAndVendorIdAndStatus(doc.getProjectId(), user.getVendorId(), "ACTIVE")`
  3. An explicit `grantee_type = 'VENDOR'` grant exists in `document_permissions`.
  Terminated or unassigned vendors fail immediately with `AccessDeniedException`.
- **Classification Defense:** Documents classified as `CONFIDENTIAL_FINANCE` are strictly restricted to `FINANCE_MANAGER, FINANCE_MAKER, FINANCE_CHECKER, FINANCE_AUDIT, ADMIN`. Documents classified as `RESTRICTED_LEGAL` are restricted strictly to `PRINCIPAL_ARCHITECT` and `ADMIN`.

---

## 6. Step 5 & 6 — Versioning, Concurrency & Lifecycle Governance

### 6.1 Versioning Invariants
- **Immutable Historical Versions:** Each version is stored in `document_versions` with an incrementing integer `version_number` and a unique `storage_key`.
- **Cryptographic Verification:** Every version calculates and records a SHA-256 digest at upload time.
- **Download Integrity:** During download, the SHA-256 is validated and returned in the `X-Checksum-SHA256` HTTP response header.
- **Concurrent Version Protection:** Handled via `@Version` optimistic locking on `DocumentEntity` and a database unique constraint `uq_docver_doc_version (document_id, version_number)`.

### 6.2 Lifecycle Governance
- **State Machine:** `AVAILABLE` -> `ARCHIVED`, `AVAILABLE` <-> `QUARANTINED`, `REJECTED`.
- **Archival Protection:** Once a document is archived (`status = 'ARCHIVED'`), the following operations are strictly rejected ([DocumentService.java#L119-L123](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/DocumentService.java#L119-L123)):
  - `uploadVersion` (throws `IllegalStateException: Cannot upload a new version to an archived document`)
  - `updateClassification` (throws `IllegalStateException: Cannot alter classification of an archived document`)
  - `grantPermission` (throws `IllegalStateException: Cannot grant permissions on an archived document`)
  - `revokePermission` (throws `IllegalStateException: Cannot alter permissions on an archived document`)
- **Restoration:** Only `ROLE_ADMIN` and `ROLE_PRINCIPAL_ARCHITECT` can restore archived documents.

---

## 7. Step 7 — Tamper-Evident Forensic Audit Trail

Every DMS operation emits structured records to `audit_events` via `auditEventRepository`:
- **Document Creation:** Action `DOCUMENT_UPLOAD`, records document ID, reference, version 1, and SHA-256.
- **Version Upload:** Action `DOCUMENT_VERSION_UPLOAD`, records version number and checksum.
- **Download:** Action `DOCUMENT_DOWNLOAD`, records user, timestamp, document ID, and version streamed.
- **Security Classification Update:** Action `DOCUMENT_CLASSIFICATION_CHANGE`, records previous and new classification.
- **Permission Grant/Revoke:** Actions `DOCUMENT_PERMISSION_GRANT` and `DOCUMENT_PERMISSION_REVOKE`.
- **Archival & Restoration:** Actions `DOCUMENT_ARCHIVE` and `DOCUMENT_RESTORE`.
- **Quarantine Release:** Action `DOCUMENT_QUARANTINE_RELEASE`, captures administrator identity and reason.
- **Security Denial Auditing:** Failed access attempts log descriptive warnings with username, role, document ID, and client/vendor context.

---

## 8. Step 8 — Database Migration & Referential Integrity (V9)

- **Migration Script:** [V9__create_document_management_schema.sql](file:///D:/WEBUI/backend/src/main/resources/db/migration/V9__create_document_management_schema.sql)
- **Preflight Check Script:** [V9_preflight_check.sql](file:///D:/WEBUI/backend/src/main/resources/db/preflight/V9_preflight_check.sql)
- **Referential Integrity Analysis:**
  - `documents.client_id` -> `clients(id)` with `ON DELETE RESTRICT`. Prevents accidental client deletion if documents exist.
  - `documents.project_id` -> `operational_projects(id)` with `ON DELETE RESTRICT`. Prevents project deletion if associated documents exist.
  - `document_versions.document_id` -> `documents(id)` with `ON DELETE RESTRICT`. Prevents document deletion if versions exist.
  - `document_permissions.document_id` -> `documents(id)` with `ON DELETE CASCADE`. Permissions cleanly cascade when document is purged.
- **Uniqueness Constraints:**
  - `uq_docver_doc_version UNIQUE (document_id, version_number)` prevents duplicate version numbers.
  - `uq_docperm_grant UNIQUE (document_id, grantee_type, grantee_id)` prevents duplicate permission records.
  - `documents.document_reference UNIQUE` enforces studio-wide reference uniqueness.
- **Indexing:** Indexes placed on `client_id`, `project_id`, `status`, `security_classification`, `document_reference`, `sha256_checksum`, and composite grantee lookups.

---

## 9. Step 9 — Controller & API Design

- **Controller:** [DocumentController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/DocumentController.java)
- **Base Path:** `/api/documents`
- **Security Configuration:** Added `.requestMatchers("/api/documents/**").authenticated()` in [SecurityConfig.java#L104](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L104).
- **Streaming Response:** File download endpoints return `InputStreamResource` with `Content-Length` and `Content-Type`, preventing JVM memory exhaustion during client streaming.
- **Content Disposition:** Sets `attachment; filename="<sanitized_filename>"` to prevent browser execution of SVG or HTML payloads.
- **Checksum Header:** Emits `X-Checksum-SHA256` for client-side cryptographic integrity verification.
- **Missing Header (Finding 4.3-02):** Download responses omit explicit `Cache-Control: no-cache, no-store, must-revalidate` headers.

---

## 10. Step 10 — Automated Test Suite Execution Evidence

The full backend automated test suite was executed against commit `57bcf4d`:
```bash
$env:MAVEN_OPTS = "-Xmx384m"
mvn -f backend/pom.xml test "-DargLine=-Xmx384m"
```

### Test Suite Execution Summary
- **Total Test Suites Executed:** 9
- **Total Tests Run:** 115
- **Failures:** 0
- **Errors:** 0
- **Skipped:** 0
- **Execution Result:** `BUILD SUCCESS`

### Detailed Test Suite Breakdown

| Test Suite Class | Tests Run | Failures | Errors | Time (s) | Focus Area |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `FinancialConcurrencyAndOptimisticLockingTest` | 9 | 0 | 0 | 22.31s | Phase 2 concurrency & locking |
| `ProductionBootstrapHardeningTest` | 11 | 0 | 0 | 1.72s | Phase 3.2 configuration hardening |
| `ProductionProfileContextTest` | 1 | 0 | 0 | 4.21s | Phase 3.2 production profile boot |
| `Phase3AuthLifecycleTest` | 17 | 0 | 0 | 5.21s | Phase 3.1 auth lifecycle & refresh |
| `SecurityAndRbacIntegrationTest` | 26 | 0 | 0 | 0.77s | Phase 2 & 3 RBAC invariants |
| `MakerCheckerAndSafetyInvariantsTest` | 12 | 0 | 0 | 1.98s | Phase 2 maker-checker safety |
| `BusinessIdentityServiceAndSecurityTest` | 13 | 0 | 0 | 8.05s | Phase 4.1 client & vendor identity |
| `OperationalProjectServiceAndSecurityTest` | 13 | 0 | 0 | 3.13s | Phase 4.2.1 operational projects |
| `DocumentServiceAndSecurityTest` | 13 | 0 | 0 | 4.44s | Phase 4.3 DMS & upload security |
| **TOTAL** | **115** | **0** | **0** | **51.82s** | **Complete Backend Test Suite** |

---

## 11. Complete Findings Log

### 11.1 Finding 4.3-01: Malware Scanner Fails Open in Default Configuration
- **Severity:** HIGH (Acceptance Condition)
- **Target:** [DefaultPolicyMalwareScanner.java#L21-L35](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DefaultPolicyMalwareScanner.java#L21-L35)
- **Description:** `DefaultPolicyMalwareScanner` defaults to `app.dms.malware-scan-mode: PASS_THROUGH`. In this mode, files passing extension and magic-byte checks are cleared automatically without invoking an actual anti-virus or sandbox engine. Static checks cannot detect embedded exploits, zero-days, or obfuscated macros in PDF/Office files.
- **Risk / Impact:** Untrusted client or vendor uploads containing weaponized documents are immediately marked `AVAILABLE` and made downloadable to internal architects and finance staff.
- **Required Remediation:** 
  1. Define a production integration interface and client adapter (e.g., `ClamAvMalwareScanner` communicating via TCP or unix socket).
  2. In production deployments, enforce fail-closed or quarantine behavior: if the anti-virus engine is offline or unreachable, hold the document in `QUARANTINED` status until scanned.

### 11.2 Finding 4.3-02: Missing Explicit Cache Prevention Headers on File Downloads
- **Severity:** MEDIUM (Acceptance Condition)
- **Target:** [DocumentController.java#L106-L114](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/DocumentController.java#L106-L114) and [L133-L141](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/DocumentController.java#L133-L141)
- **Description:** Download endpoints set `Content-Type`, `Content-Length`, `Content-Disposition`, and `X-Checksum-SHA256`, but omit downstream HTTP caching headers.
- **Risk / Impact:** Shared intermediate proxies or local browser caches on client/vendor machines may cache sensitive architectural blueprints, financial invoices, or proprietary vendor contracts on unencrypted disks.
- **Required Remediation:** Explicitly add `headers.setCacheControl(CacheControl.noStore().mustRevalidate())` and `headers.setPragma("no-cache")` to all file download responses.

### 11.3 Finding 4.3-03: In-Memory Buffering During Upload Validation
- **Severity:** LOW (Advisory / Architecture Observation)
- **Target:** [DocumentSecurityValidator.java#L71](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DocumentSecurityValidator.java#L71)
- **Description:** `DocumentSecurityValidator.validate` executes `byte[] bytes = inputStream.readAllBytes();`, buffering the full file (up to 25MB) in heap memory.
- **Risk / Impact:** Acceptable for current single-upload usage. However, under high burst concurrency on memory-constrained containers (e.g. 384MB - 512MB RAM), multiple simultaneous 25MB uploads could induce GC pauses.
- **Advisory Recommendation:** Future iterations should inspect magic bytes from the first 8KB stream buffer and calculate SHA-256 via a streaming `DigestInputStream` directly during file write.

---

## 12. Carried Forward Acceptance Conditions from Prior Phases

The following release conditions from Phase 4.1 remain open and must be fulfilled prior to final production cutover:
1. **Condition 4.1-A (Vendor Banking Field Encryption):** Implement AES-256-GCM encryption at rest for sensitive vendor banking and tax identifier fields (`bankAccountNumber`, `taxIdentifier`).
2. **Condition 4.1-C (Case-Insensitive Email Uniqueness):** Enforce `LOWER(email)` unique index in Flyway migration to eliminate case-variant duplicate accounts.
3. **Condition 4.1-D (Invitation Rate Limiting):** Introduce rate-limiting middleware on user invitation and password onboarding endpoints to prevent token-harvesting / credential abuse.
4. **Condition 4.1-E (Production SMTP Provider):** Replace stubbed email notification logging with a production-grade authenticated SMTP/TLS or transactional email provider.

---

## 13. Final Acceptance Verdict

### **VERDICT: ACCEPTED WITH CONDITIONS**

**Conditions for Next Phase & Production Cutover:**
1. **Remediate Finding 4.3-01:** Implement a production-grade external malware scanner integration (e.g. ClamAV adapter) and enforce fail-closed or automatic quarantine when the scanner is unavailable.
2. **Remediate Finding 4.3-02:** Add `CacheControl.noStore().mustRevalidate()` and `Pragma: no-cache` headers to all file download endpoints in `DocumentController`.
3. **Carry Forward Conditions 4.1-A through 4.1-E:** Maintain and track these requirements for the upcoming enterprise security hardening milestone.
4. **Preserve Security Invariants:** All 115 automated regression and security tests must remain green across future phases.
