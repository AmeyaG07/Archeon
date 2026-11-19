# ArcheOn Backend — Phase 4.3.1 Implementation Report
## Document Management System (DMS) Security Remediation

**Repository:** `D:\WEBUI\backend`  
**Branch:** `backend/phase4.3.1-dms-security-remediation`  
**Base Branch:** `backend/phase4.3-document-management`  
**Base Commit:** `57bcf4d313618a4dff18f0dba65176050c818e91`  
**Code Remediation Commit:** `0d9c660f7868fc3e1208990cf1db9729ffea126c`  
**HEAD Commit:** `4027e7fa694c9f13dd48464a9846b9bb7d22dc65`  
**Independent Audit Reference:** [PHASE4_3_INDEPENDENT_ACCEPTANCE.md](file:///D:/WEBUI/audit/backend/PHASE4_3_INDEPENDENT_ACCEPTANCE.md)  
**Implementation Date:** 2026-11-19  

---

## 1. Executive Summary

Phase 4.3.1 delivers comprehensive security remediations for the findings documented during the Phase 4.3 Independent Document Management Security Acceptance Audit. The changes resolve the critical fail-open risk in malware scanning, eliminate client-side document caching vulnerabilities on download routes, optimize memory ingestion during upload validation, and strengthen production environment configuration validation.

Key engineering achievements:
1. **Real Antivirus Scanner Integration (ClamAV TCP):** Replaced the passive `DefaultPolicyMalwareScanner` with a production-grade `ClamAvMalwareScanner` communicating directly with ClamAV (`clamd`) via the standard `zINSTREAM` TCP protocol with 4-byte chunk framing.
2. **Strict Fail-Closed Architecture:** File uploads fail closed under all error conditions (daemon unreachable, connection refused, socket timeout, protocol errors, or infected payloads). A file is placed in `QUARANTINED` status and can never become `AVAILABLE` unless an explicit clean scan is confirmed.
3. **Quarantine Release Rescanning Invariant:** Administrative quarantine release now mandatory rescans the stored file through `MalwareScanner.scan(...)`. If malware is detected or the scanner is offline, quarantine release is strictly rejected with `IllegalStateException`.
4. **Deterministic Mock for Non-Production & Testing:** Introduced `DeterministicMockMalwareScanner` for offline unit/integration test suites and local development. It simulates clean, infected (EICAR), timeout, unavailable, and malformed scanner states without external dependencies.
5. **Production Startup Hardening:** Updated `SecurityConfigValidator` to enforce that production environments (`prod`, `production`, `staging`, `live`) must explicitly configure `app.dms.malware-scan-mode=CLAMAV` and a non-blank `app.dms.clamav.host`. Starting production with mock or pass-through scanning fails immediately at startup.
6. **Downstream Cache Protection:** All file download endpoints (`/api/documents/{id}/download` and `/api/documents/{id}/versions/{versionNumber}/download`) now emit strict cache-prevention and anti-sniffing headers (`Cache-Control: no-store, no-cache, must-revalidate`, `Pragma: no-cache`, `Expires: 0`, `X-Content-Type-Options: nosniff`).
7. **Bounded Ingestion Memory Optimization:** Modified `DocumentSecurityValidator` to ingest uploads in 8KB chunks while tracking cumulative bytes, immediately aborting if the 25MB boundary is exceeded and computing the SHA-256 digest on the fly via `MessageDigest.update()`.
8. **Automated Verification:** The entire backend test suite was executed: **125 of 125 tests passed cleanly** (exit code 0), including 6 new ClamAV protocol unit tests, 2 new production validation tests, and 2 new DMS download/quarantine integration tests.

---

## 2. Source Changes & Git Artifacts

### 2.1 Git Status & Commit Details
- **Branch:** `backend/phase4.3.1-dms-security-remediation`
- **Parent Commit:** `57bcf4d313618a4dff18f0dba65176050c818e91`
- **HEAD Commit:** `0d9c660f7868fc3e1208990cf1db9729ffea126c`
- **Total Changes:** 14 files changed, 848 insertions(+), 65 deletions(-)
- **Frontend Changes:** None (Zero frontend modifications).
- **Migration Changes:** None (Preserved V1..V9 Flyway schema).

### 2.2 Files Modified and Created

| File Path | Type | Role in Remediation |
| :--- | :---: | :--- |
| [ClamAvMalwareScanner.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/ClamAvMalwareScanner.java) | **NEW** | ClamAV TCP `zINSTREAM` adapter with socket timeouts, chunk framing, and fail-closed parsing. |
| [DeterministicMockMalwareScanner.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DeterministicMockMalwareScanner.java) | **NEW** | Deterministic mock scanner for non-production environments with clean/infected/timeout triggers. |
| [DmsScannerConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DmsScannerConfig.java) | **NEW** | Spring configuration router selecting `ClamAvMalwareScanner` or `DeterministicMockMalwareScanner`. |
| [DefaultPolicyMalwareScanner.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DefaultPolicyMalwareScanner.java) | **DELETED** | Removed insecure pass-through scanner. |
| [MalwareScanner.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/MalwareScanner.java) | **MODIFIED** | Added `ScanStatus` enum (`CLEAN`, `INFECTED`, `SCANNER_UNAVAILABLE`, `SCANNER_TIMEOUT`, `SCANNER_ERROR`). |
| [DocumentController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/DocumentController.java) | **MODIFIED** | Applied `Cache-Control`, `Pragma`, `Expires`, and `X-Content-Type-Options` to download endpoints. |
| [DocumentSecurityValidator.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DocumentSecurityValidator.java) | **MODIFIED** | Implemented bounded 8KB chunk streaming with immediate 25MB abort and on-the-fly SHA-256 calculation. |
| [DocumentService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/DocumentService.java) | **MODIFIED** | Enforced fail-closed quarantine audit events and mandatory rescan during administrative quarantine release. |
| [SecurityConfigValidator.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfigValidator.java) | **MODIFIED** | Enforced mandatory `CLAMAV` scan mode and non-blank `app.dms.clamav.host` under production profiles. |
| [application.yml](file:///D:/WEBUI/backend/src/main/resources/application.yml) | **MODIFIED** | Added ClamAV host, port, and timeout configuration with `DETERMINISTIC_MOCK` default for dev. |
| [ClamAvMalwareScannerTest.java](file:///D:/WEBUI/backend/src/test/java/com/webui/backend/document/ClamAvMalwareScannerTest.java) | **NEW** | 6 unit tests with local mock TCP server testing clean, infected, timeout, error, malformed, and down states. |
| [ProductionBootstrapHardeningTest.java](file:///D:/WEBUI/backend/src/test/java/com/webui/backend/config/ProductionBootstrapHardeningTest.java) | **MODIFIED** | Added 2 tests asserting production fails if scan mode is mock or ClamAV host is missing. |
| [ProductionProfileContextTest.java](file:///D:/WEBUI/backend/src/test/java/com/webui/backend/config/ProductionProfileContextTest.java) | **MODIFIED** | Added required production ClamAV properties to context test. |
| [DocumentServiceAndSecurityTest.java](file:///D:/WEBUI/backend/src/test/java/com/webui/backend/document/DocumentServiceAndSecurityTest.java) | **MODIFIED** | Added tests for download cache headers and quarantine release rescan rejection on infected files. |

---

## 3. Remediation 1: Real Malware Scanning (ClamAV TCP Adapter)

### 3.1 Scanner Architecture
The `MalwareScanner` abstraction was overhauled to support granular scan outcomes:
```java
public interface MalwareScanner {
    enum ScanStatus {
        CLEAN,
        INFECTED,
        SCANNER_UNAVAILABLE,
        SCANNER_TIMEOUT,
        SCANNER_ERROR
    }

    record ScanResult(boolean passed, String message, String quarantineReason, ScanStatus status) {}
    
    ScanResult scan(InputStream inputStream, String filename, long sizeBytes);
}
```

### 3.2 ClamAV TCP Protocol Implementation (`ClamAvMalwareScanner`)
[ClamAvMalwareScanner.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/ClamAvMalwareScanner.java) connects to `clamd` over a standard TCP socket:
1. **Handshake:** Sends `zINSTREAM\0` over the wire.
2. **Chunk Framing:** Streams the payload in chunks formatted as:
   `[4-byte big-endian integer chunk length][chunk payload bytes]`
3. **Termination:** Sends a 4-byte zero integer `0x00000000` to indicate EOF.
4. **Response Parsing:** Reads the null-terminated response:
   - `stream: OK` -> `passed = true`, `status = ScanStatus.CLEAN`
   - `stream: <Signature> FOUND` -> `passed = false`, `status = ScanStatus.INFECTED`, extracts virus signature.
   - `stream: ... ERROR` -> `passed = false`, `status = ScanStatus.SCANNER_ERROR`
   - Malformed / unrecognized string -> `passed = false`, `status = ScanStatus.SCANNER_ERROR`

### 3.3 Strict Fail-Closed Behavior
Under no circumstances does an uninspected or errored file pass into `AVAILABLE` status:
- **Connection Refused / Daemon Offline:** Catches `ConnectException`, `UnknownHostException`, logs alert, returns `passed = false`, `quarantineReason = "SCANNER_UNAVAILABLE"`.
- **Socket Timeout:** Configurable `readTimeoutMs` (default 10000ms). If `SocketTimeoutException` occurs, returns `passed = false`, `quarantineReason = "SCANNER_TIMEOUT"`.
- **I/O Communication Failure:** Returns `passed = false`, `quarantineReason = "SCANNER_ERROR"`.

### 3.4 Quarantine Rescanning & Release Invariant
In [DocumentService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/DocumentService.java#L616-L650), `releaseQuarantine` requires administrator authority (`isAdmin`) and **mandatory rescans the stored file**:
```java
List<DocumentVersionEntity> versions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId);
if (!versions.isEmpty()) {
    DocumentVersionEntity latest = versions.get(0);
    try (InputStream is = storageService.retrieveFile(latest.getStorageKey())) {
        ScanResult rescan = malwareScanner.scan(is, latest.getOriginalFilename(), latest.getFileSizeBytes());
        if (!rescan.passed()) {
            log.warn("Administrative quarantine release rejected for doc {}: rescan failed with reason: {}",
                    documentId, rescan.quarantineReason());
            throw new IllegalStateException("Cannot release document from quarantine: Antivirus rescan failed: " + rescan.message());
        }
    }
}
```
If the file is infected or the scanner remains offline, the release is aborted, throwing an `IllegalStateException` and keeping the document in `QUARANTINED` status.

### 3.5 Non-Production Deterministic Mock (`DeterministicMockMalwareScanner`)
To prevent test suite brittleness without mocking away real application logic:
- Triggers on file names or content containing `"EICAR"`, `"INFECTED"`, or `"VIRUS"` to simulate `INFECTED`.
- Triggers on `"UNAVAILABLE"`, `"TIMEOUT"`, or `"MALFORMED"` to simulate fail-closed conditions.
- Confirms clean on benign files.
- Labeled explicitly with `log.warn("DeterministicMockMalwareScanner active: strictly intended for local dev & testing. MUST NOT BE USED IN PRODUCTION.")`.

### 3.6 Production Startup Hardening in `SecurityConfigValidator`
In [SecurityConfigValidator.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfigValidator.java#L104-L121), when running under profiles `prod`, `production`, `staging`, or `live`:
1. `app.dms.malware-scan-mode` MUST equal `"CLAMAV"`. Mock or pass-through configurations throw `IllegalStateException`.
2. `app.dms.clamav.host` must be configured and non-blank.

---

## 4. Remediation 2: Download Cache Protection

In [DocumentController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/DocumentController.java#L113-L118) and [L147-L152](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/DocumentController.java#L147-L152), the following response headers are applied to both active document downloads and specific version downloads:
```http
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Expires: 0
X-Content-Type-Options: nosniff
X-Checksum-SHA256: <sha256>
Content-Disposition: attachment; filename="<sanitized_name>"
```
### Verification:
Tested in `testDownloadHeaders_CacheControlAndNoSniffPresent`, which asserts each of these headers across both `/api/documents/{id}/download` and `/api/documents/{id}/versions/{versionNumber}/download`.

---

## 5. Remediation 3: File Validation Memory Usage Evaluation

In [DocumentSecurityValidator.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/dms/DocumentSecurityValidator.java#L70-L105):
1. **Bounded Streaming Ingestion:** Replaced `inputStream.readAllBytes()` with an 8KB chunk loop.
2. **Immediate Abort on Oversize:** If cumulative read bytes exceed `maxFileSizeBytes` (25MB), the read terminates immediately and throws `IllegalArgumentException` without consuming further heap or disk buffer.
3. **On-the-Fly SHA-256 Hashing:** Calculated incrementally via `digest.update(chunk, 0, bytesRead)` during the read loop, eliminating a second memory pass over the array.
4. **Architectural Evaluation for Next Phase:**
   - For 25MB maximum uploads on the current JVM footprint, buffering the validated file in a `byte[]` allows seamless multi-pass inspection (header magic bytes, ClamAV socket transmission, and local storage write) without disk thrashing.
   - If the studio increases file limits (e.g. for large BIM / Revit files > 100MB), a disk-spooling pipeline (`File.createTempFile`) with streaming ClamAV and storage piping should be introduced.

---

## 6. Phase 4.1 Carry-Forward Status

As instructed, the open Phase 4.1 release conditions were inspected and remain accurately tracked:

| Item | Requirement | Status | Technical Dependency / Rationale |
| :--- | :--- | :---: | :--- |
| **1. Vendor Banking Encryption** | AES-256-GCM encryption of vendor bank accounts and tax IDs at rest | **PENDING** | Requires production key management configuration (`APP_ENCRYPTION_SECRET`), JPA AttributeConverter, and column length schema migration. |
| **2. Case-Insensitive Email** | `LOWER(email)` unique constraint on `users` table | **PENDING** | Requires separate Flyway migration `V10` altering the `users` table. Deferred to avoid uncoordinated migration changes. |
| **3. Invitation Rate Limiting** | Rate-limiting on `/api/users/invite` and `/api/auth/accept-invite` | **PENDING** | Requires Redis token bucket / Bucket4j rate-limiting middleware integration. |
| **4. Production SMTP** | Real TLS/authenticated SMTP provider configuration | **PENDING** | Requires verified transactional email provider credentials (AWS SES / SendGrid / Postmark). Currently stubbed in dev. |
| **5. Staff DTO Masking** | Masking PAN, GSTIN, and bank account in staff-facing DTOs | **PENDING** | Requires field-level masking serializer or dedicated projection DTOs for non-finance staff roles. |

---

## 7. Automated Test Suite Execution Evidence

### 7.1 Maven Command & Exit Code
```powershell
$env:MAVEN_OPTS = "-Xmx384m"
mvn -f backend/pom.xml test "-DargLine=-Xmx384m"
```
**Exit Code:** `0` (`BUILD SUCCESS`)  
**Total Duration:** 1m 18s  

### 7.2 Surefire XML Test Suite Breakdown

| Test Suite Class | Tests Run | Failures | Errors | Skipped | Time (s) | Focus Area |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `FinancialConcurrencyAndOptimisticLockingTest` | 9 | 0 | 0 | 0 | 32.45s | Phase 2 concurrency & locking |
| `ProductionBootstrapHardeningTest` | 13 | 0 | 0 | 0 | 1.84s | Phase 3.2 & 4.3.1 configuration hardening |
| `ProductionProfileContextTest` | 1 | 0 | 0 | 0 | 6.01s | Phase 3.2 & 4.3.1 production profile boot |
| `ClamAvMalwareScannerTest` | 6 | 0 | 0 | 0 | 0.42s | Phase 4.3.1 ClamAV TCP protocol & fail-closed |
| `DocumentServiceAndSecurityTest` | 15 | 0 | 0 | 0 | 7.56s | Phase 4.3 & 4.3.1 DMS, cache headers & rescan |
| `BusinessIdentityServiceAndSecurityTest` | 13 | 0 | 0 | 0 | 9.66s | Phase 4.1 business identity |
| `OperationalProjectServiceAndSecurityTest` | 13 | 0 | 0 | 0 | 3.22s | Phase 4.2.1 operational projects |
| `Phase3AuthLifecycleTest` | 17 | 0 | 0 | 0 | 4.89s | Phase 3.1 auth lifecycle & refresh |
| `SecurityAndRbacIntegrationTest` | 26 | 0 | 0 | 0 | 0.74s | Phase 2 & 3 RBAC invariants |
| `MakerCheckerAndSafetyInvariantsTest` | 12 | 0 | 0 | 0 | 2.23s | Phase 2 maker-checker safety |
| **TOTAL** | **125** | **0** | **0** | **0** | **69.02s** | **Full Backend Test Suite** |

---

## 8. Remaining Limitations & Production Prerequisites

1. **ClamAV Daemon Deployment:** In production, a running ClamAV container or service must be accessible at `APP_DMS_CLAMAV_HOST` on port `3310` with up-to-date virus definitions (`freshclam`).
2. **Reverse Proxy Alignment:** Nginx or AWS ALB reverse proxy fronting the backend must pass through or not strip the `Cache-Control: no-store, no-cache, must-revalidate` and `X-Content-Type-Options: nosniff` headers.
3. **Carry-Forward Conditions 4.1-A through 4.1-E:** Remain mandatory prerequisites for final enterprise production go-live.
