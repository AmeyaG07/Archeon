# Phase 4.4.1 — Sensitive Data Protection Implementation Report
**Project:** ArcheOn Design Studio  
**Role:** Senior Java Backend Engineer & Application Security Engineer  
**Phase:** 4.4.1  
**Scope:** Vendor Banking Data Encryption at Rest (AES-256-GCM) + Staff DTO Sensitive Data Masking (PAN, GSTIN, Bank Details)  
**Branch:** `backend/phase4.4.1-sensitive-data-protection`  
**Baseline Branch:** `backend/phase4.3.1.1-dms-audit-remediation`  
**Baseline Commit:** `cdf5da7033a677b03f10994eb58108f6e92daf27`  
**Implementation Commit:** `245e333`  
**Date:** 2026-11-19  

---

## 1. Executive Summary

Phase 4.4.1 implements cryptographic protection and contextual masking for sensitive business identity and financial data within the ArcheOn Design Studio platform. This addresses two critical security invariants:

1. **Requirement 4.1-A (Vendor Banking Data Encryption at Rest):** Transparently encrypts all vendor bank details (`vendors.bank_details_json`) using authenticated AES-256-GCM encryption with 12-byte cryptographically secure random nonces and 128-bit authentication tags.
2. **Requirement 4.1-E (Staff DTO Sensitive Data Masking):** Enforces the Principle of Least Privilege across all staff-facing DTO endpoints. Non-privileged studio staff (`ROLE_STAFF`, `ROLE_ARCHITECT`, `ROLE_SITE_SUPERVISOR`, `ROLE_PROJECT_MANAGER`) receive contextually masked representations of Permanent Account Numbers (PAN), Goods and Services Tax Identification Numbers (GSTIN), and Bank Account Numbers, while privileged administrators (`ROLE_ADMIN`), finance operators (`ROLE_FINANCE_*`), and the authenticated vendor owner retain unmasked visibility.

The implementation maintains 100% backward compatibility, zero database downtime, no destructive schema alterations, and zero regressions across the entire application test suite (155 tests passing).

---

## 2. Cryptographic Architecture (AES-256-GCM)

### 2.1 Authenticated Encryption Service
Located at `com.webui.backend.security.crypto.AesGcmEncryptionService`:
- **Cipher Algorithm:** `AES/GCM/NoPadding`
- **Key Size:** 256 bits (32 bytes), decoded from Base64 configuration.
- **Initialization Vector (IV):** 12 bytes generated per operation using `java.security.SecureRandom`.
- **Authentication Tag:** 128 bits (`GCMParameterSpec(128, iv)`).
- **Envelope Format:** Version-prefixed string representation:
  ```
  enc:v1:<base64(iv)>:<base64(ciphertext+tag)>
  ```
- **Semantic Security:** Encrypting identical plaintext multiple times produces unique ciphertexts due to fresh nonce generation per call.
- **Fail-Closed Verification:** Ciphertext or IV bit tampering causes `AEADBadTagException` and immediately triggers a `SecurityException`.
- **Zero-Downtime Backward Compatibility:** Unencrypted legacy data lacking the `enc:v1:` prefix is returned as plaintext on read, preventing data corruption during migrations.

### 2.2 JPA Attribute Converter
Located at `com.webui.backend.security.crypto.VendorBankDetailsEncryptionConverter`:
- Implements `AttributeConverter<String, String>` attached to `VendorEntity.bankDetailsJson`.
- Annotated with `@Converter` and `@Component`.
- Provides dual Spring DI and static holder resolution (`setStaticEncryptionService`), ensuring Hibernate reflection instantiation cannot bypass encryption.
- **Storage Compatibility:** `vendors.bank_details_json` was provisioned as `TEXT` in Flyway migration `V6__create_business_identity_schema.sql`. Base64-encoded GCM envelopes fit seamlessly without schema alterations.

---

## 3. Contextual Sensitive Data Masking

### 3.1 Masking Engine
Located at `com.webui.backend.security.crypto.SensitiveDataMasker`:
- **PAN Masking:** Preserves the first 5 alpha characters and final 1 alpha check character, masking the middle 4 numeric digits:
  ```
  ABCDE1234F -> ABCDE****F
  ```
- **GSTIN Masking:** Preserves the first 7 characters (2 state digits + 5 entity characters) and final 3 alphanumeric characters, masking the 4 PAN digits:
  ```
  27ABCDE1234F1Z5 -> 27ABCDE****1Z5
  ```
- **Bank Account Number Masking:** Preserves only the last 4 digits:
  ```
  123456789012 -> ********9012
  ```
- **Bank Details JSON Masking:** Deserializes JSON, locates account number fields (`accountNumber`, `account_no`, `accountno`, `bankaccountnumber`, etc.), replaces values with masked strings, and re-serializes while preserving routing metadata (`bankName`, `ifsc`, `branch`).

### 3.2 Authorization & Role Boundary Matrix

| User Role | Vendor Access Path | PAN | GSTIN | Bank Details |
| :--- | :--- | :--- | :--- | :--- |
| `ROLE_ADMIN` | All endpoints (`/api/vendors/**`) | **UNMASKED** | **UNMASKED** | **UNMASKED** |
| `ROLE_FINANCE_*` | All endpoints (`/api/vendors/**`) | **UNMASKED** | **UNMASKED** | **UNMASKED** |
| `ROLE_VENDOR` (Self) | Own profile (`/api/vendors/me`, `/{id}`, `/ref/{ref}`) | **UNMASKED** | **UNMASKED** | **UNMASKED** |
| `ROLE_STAFF` | Roster list, detail, mutation | **MASKED** (`ABCDE****F`) | **MASKED** (`27ABCDE****1Z5`) | **MASKED** (`********9012`) |
| `ROLE_ARCHITECT` | Project operational access | **MASKED** | **MASKED** | **MASKED** |
| `ROLE_SITE_SUPERVISOR`| Project operational access | **MASKED** | **MASKED** | **MASKED** |
| `ROLE_CLIENT` | Any vendor endpoint | **FORBIDDEN (403)** | **FORBIDDEN (403)** | **FORBIDDEN (403)** |
| `ROLE_VENDOR` (Other) | Foreign vendor profile | **FORBIDDEN (403)** | **FORBIDDEN (403)** | **FORBIDDEN (403)** |

---

## 4. Production Hardening & Configuration

### 4.1 Configuration Property
Added to `backend/src/main/resources/application.yml`:
```yaml
app:
  security:
    revocation-strategy: ${APP_SECURITY_REVOCATION_STRATEGY:in-memory}
    encryption:
      secret-key: ${APP_ENCRYPTION_SECRET:MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=}
```

### 4.2 Production Startup Invariant Validator
Enhanced `com.webui.backend.config.SecurityConfigValidator`:
- In production profiles (`prod`, `production`, `staging`, `live`), validates:
  1. `app.security.encryption.secret-key` is present and non-blank.
  2. Reject default development keys (`MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=`) and insecure dummy secrets.
  3. Validate valid Base64 decoding.
  4. Enforce exact 256-bit (32-byte) key length.

---

## 5. Source Modifications Summary

1. `backend/src/main/java/com/webui/backend/security/crypto/AesGcmEncryptionService.java` (New)
   - Enterprise AES-256-GCM authenticated encryption service.
2. `backend/src/main/java/com/webui/backend/security/crypto/VendorBankDetailsEncryptionConverter.java` (New)
   - JPA AttributeConverter for `VendorEntity.bankDetailsJson`.
3. `backend/src/main/java/com/webui/backend/security/crypto/SensitiveDataMasker.java` (New)
   - High-performance data masking engine for PAN, GSTIN, and Bank Details JSON.
4. `backend/src/main/java/com/webui/backend/model/VendorEntity.java` (Modified)
   - Applied `@Convert(converter = VendorBankDetailsEncryptionConverter.class)` to `bankDetailsJson`.
5. `backend/src/main/java/com/webui/backend/service/VendorService.java` (Modified)
   - Injected `SensitiveDataMasker`.
   - Updated `toResponse(VendorEntity entity, Authentication auth)` to apply contextual masking.
   - Updated all service query and mutation methods to pass `Authentication auth`.
6. `backend/src/main/resources/application.yml` (Modified)
   - Added `app.security.encryption.secret-key`.
7. `backend/src/main/java/com/webui/backend/config/SecurityConfigValidator.java` (Modified)
   - Added production startup invariants for AES-256 encryption key.
8. `backend/src/test/java/com/webui/backend/security/SensitiveDataProtectionTest.java` (New)
   - 16 automated tests verifying AES-256-GCM crypto invariants, database at-rest storage, and contextual DTO masking.
9. `backend/src/test/java/com/webui/backend/config/ProductionBootstrapHardeningTest.java` (Modified)
   - Added tests verifying production validation for encryption secrets.
10. `backend/src/test/java/com/webui/backend/config/ProductionProfileContextTest.java` (Modified)
    - Updated mock production properties with a valid 256-bit encryption key.

---

## 6. Verification and Test Results

The complete backend test suite was executed:
```powershell
mvn -f backend/pom.xml test "-DargLine=-XX:+EnableDynamicAgentLoading -Xmx512m"
```

**Results:**
- `SensitiveDataProtectionTest`: 16/16 passed
- `BusinessIdentityServiceAndSecurityTest`: 13/13 passed
- `OperationalProjectServiceAndSecurityTest`: 13/13 passed
- `DocumentServiceAndSecurityTest`: 25/25 passed
- `ProductionBootstrapHardeningTest`: 17/17 passed
- `ProductionProfileContextTest`: 1/1 passed
- `Phase3AuthLifecycleTest`: 17/17 passed
- `MakerCheckerAndSafetyInvariantsTest`: 12/12 passed
- `FinancialConcurrencyAndOptimisticLockingTest`: 6/6 passed
- `SecurityAndRbacIntegrationTest`: 35/35 passed
**Total Suite: 155 Tests Run, 0 Failures, 0 Errors, 0 Skipped.**
**Build Status: BUILD SUCCESS**

---

## 7. Submission for Independent Acceptance Audit

All objectives and security invariants for Phase 4.4.1 have been completed and verified. In accordance with platform governance, this implementation is submitted for a strict read-only independent security acceptance audit.
