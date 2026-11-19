# ArcheOn Backend — Phase 4.4.1 Pre-Implementation Audit
## Sensitive Data Protection: Vendor Banking Encryption & Staff DTO Masking

**Repository:** `D:\WEBUI\backend`  
**Target Branch:** `backend/phase4.4.1-sensitive-data-protection`  
**Base Commit:** `cdf5da7033a677b03f10994eb58108f6e92daf27`  
**Audit Role:** Senior Java Backend Engineer & Application Security Engineer  
**Audit Date:** 2026-11-19  
**Status:** COMPLETE — PRE-IMPLEMENTATION CLEARANCE GRANTED  

---

## 1. Executive Summary

In accordance with Phase 4.4.1 requirements, a comprehensive pre-implementation audit was conducted across the backend codebase to map all sensitive data fields, database storage structures, write paths, read paths, API response exposures, configuration points, and backward compatibility considerations.

The objective of Phase 4.4.1 is twofold:
1. **Requirement 4.1-A (Cryptographic Protection):** Implement authenticated AES-256-GCM encryption at rest for vendor banking data (`bank_details_json`) stored in the `vendors` table.
2. **Requirement 4.1-E (Least Privilege & Information Disclosure Mitigation):** Enforce contextual masking in staff-facing DTO mappings so that general studio staff (`ROLE_STAFF`, `ROLE_ARCHITECT`, `ROLE_PROJECT_MANAGER`, `ROLE_SITE_SUPERVISOR`) cannot view full plaintext PAN, GSTIN, or bank account numbers, reserving full unmasked data strictly for administrators (`ROLE_ADMIN`), finance officers (`ROLE_FINANCE_*`), and the vendor themselves (`ROLE_VENDOR`).

---

## 2. Sensitive Information Field Inventory

An exhaustive inspection of entity models across `com.webui.backend.model.*` was conducted:

| Entity Class | Field Name | Java Type | Database Column | SQL Type | Sensitivity Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VendorEntity` | `bankDetailsJson` | `String` | `bank_details_json` | `TEXT` | **CONFIDENTIAL_FINANCIAL** (Bank account, IFSC, branch, holder name) |
| `VendorEntity` | `pan` | `String` | `pan` | `VARCHAR(32)` | **RESTRICTED_PII** (Permanent Account Number - Indian Income Tax ID) |
| `VendorEntity` | `gstin` | `String` | `gstin` | `VARCHAR(32)` | **RESTRICTED_BUSINESS_ID** (Goods & Services Tax Identification Number) |
| `ClientEntity` | *None* | N/A | N/A | N/A | No banking or tax fields stored |
| `BillApprovalEntity` | `paymentProofUtr` | `String` | `payment_proof_utr` | `VARCHAR(255)` | Transaction reference / UTR (public financial reference) |
| `PaymentTransactionEntity`| `transactionReference`| `String` | `transaction_reference` | `VARCHAR(255)` | Transaction UTR / Cheque number (settlement tracking) |

### Findings:
1. `VendorEntity` is the sole entity that aggregates vendor tax identifiers (`pan`, `gstin`) and bank details (`bankDetailsJson`).
2. `bank_details_json` is stored in the database column `bank_details_json TEXT`. This column can store arbitrary-length strings, making it fully compatible with Base64-encoded AES-256-GCM ciphertext envelopes without schema alteration.

---

## 3. Write and Read Path Analysis

### 3.1 Write Paths (Data Ingestion & Mutation)

```
[HTTP Request]
       │
       ▼
VendorController.createVendor(req, auth) / updateVendor(id, req, auth)
       │
       ▼
VendorService.createVendor / updateVendor
       │
       ▼  (Encryption Boundary: AES-256-GCM)
VendorEntity.bankDetailsJson -> enc:v1:<base64(iv)>:<base64(ciphertext+tag)>
       │
       ▼
VendorRepository.save(vendor)
       │
       ▼
[Database Table: vendors]
```

1. **Vendor Registration (`POST /api/vendors`):**
   - **Caller Role:** Authorized internal staff (`ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_FINANCE_*`).
   - **Method:** [VendorService.createVendor(CreateVendorRequest, Authentication)](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/VendorService.java#L118)
   - **Current Behavior:** Trims `gstin` and `pan`, and writes `bankDetailsJson` as plaintext to `VendorEntity.builder().bankDetailsJson(req.getBankDetailsJson())`.
   - **Remediation:** Plaintext `bankDetailsJson` must be encrypted using AES-256-GCM before database persistence.

2. **Vendor Profile Update (`PUT /api/vendors/{id}`):**
   - **Caller Role:** Authorized internal staff or the vendor organization itself (`isAssignedVendorUser` / `isMatchingReferenceOrEmail`).
   - **Method:** [VendorService.updateVendor(UUID, UpdateVendorRequest, Authentication)](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/VendorService.java#L239)
   - **Current Behavior:** Plaintext assignment `vendor.setBankDetailsJson(req.getBankDetailsJson().trim())`.
   - **Remediation:** If `req.getBankDetailsJson()` is updated, it must be encrypted using a freshly generated, cryptographically random 12-byte IV.

---

### 3.2 Read Paths (Data Retrieval & API Exposure)

Every endpoint returning `VendorResponse` passes through `VendorService.toResponse(VendorEntity)`:

1. **`GET /api/vendors/{id}`:**
   - **Controller:** [VendorController.getVendorById](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/VendorController.java#L58)
   - **Service:** [VendorService.getVendorById](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/VendorService.java#L189)
   - **Authorization:** `validateVendorAccess`: Internal staff or mapped vendor.

2. **`GET /api/vendors/ref/{reference}`:**
   - **Controller:** [VendorController.getVendorByReference](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/VendorController.java#L70)
   - **Service:** [VendorService.getVendorByReference](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/VendorService.java#L198)
   - **Authorization:** `validateVendorAccess`: Internal staff or mapped vendor.

3. **`GET /api/vendors/me`:**
   - **Controller:** [VendorController.getCurrentVendor](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/VendorController.java#L46)
   - **Service:** [VendorService.getCurrentVendorProfile](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/VendorService.java#L207)
   - **Authorization:** Authenticated vendor user.

4. **`GET /api/vendors`:**
   - **Controller:** [VendorController.listVendors](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/VendorController.java#L36)
   - **Service:** [VendorService.listVendors](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/VendorService.java#L229)
   - **Authorization:** Internal staff only (`ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_FINANCE_*`).

### Current Deficiency:
In all read paths, `toResponse(entity)` maps raw database values directly into `VendorResponse`:
```java
private VendorResponse toResponse(VendorEntity entity) {
    return VendorResponse.builder()
            ...
            .gstin(entity.getGstin())
            .pan(entity.getPan())
            .bankDetailsJson(entity.getBankDetailsJson())
            ...
            .build();
}
```
Currently, `toResponse` does not consider the caller's role and returns raw unmasked tax and banking values to general staff.

---

## 4. Existing Database Storage Format & Migration Safety

### 4.1 Storage Format
In `V6__create_business_identity_schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY,
    ...
    gstin VARCHAR(32),
    pan VARCHAR(32),
    bank_details_json TEXT,
    ...
);
```
- Column `bank_details_json` is `TEXT`, which in PostgreSQL (and H2 PostgreSQL mode) allows multi-kilobyte strings.
- AES-256-GCM ciphertext envelopes (consisting of 12-byte IV + ciphertext + 16-byte tag encoded in Base64) will be approximately $100$ to $300$ characters. No `ALTER TABLE` statement or column resizing is necessary.

### 4.2 Backward Compatibility & Zero-Downtime Migration
- **Envelope Format:** `enc:v1:<base64(iv)>:<base64(ciphertext+tag)>`
- **Graceful Plaintext Fallback on Read:**
  If a record in the database contains legacy plaintext (e.g. starting with `{`), the decryption converter will detect that the string does not start with the version prefix `enc:v1:`, log an informational audit trace, and return the plaintext without error.
- **Transparent In-Flight Migration:**
  When any existing record is loaded and saved via `VendorService.updateVendor`, it is automatically written back in encrypted format.
- **Batch Migration Path:**
  For production cutover, a database migration script or startup migration runner can iterate over any legacy records containing plaintext and encrypt them in place.

---

## 5. Architectural Design Specification

### 5.1 Requirement 4.1-A: AES-256-GCM Banking Encryption

#### Cipher Specification:
- **Algorithm:** `AES/GCM/NoPadding`
- **Key Length:** 256 bits (32 bytes)
- **IV / Nonce:** 12 bytes (96 bits) generated per operation using `java.security.SecureRandom`.
- **Authentication Tag:** 128 bits (16 bytes) appended to ciphertext by standard GCM provider.
- **Envelope Storage Format:**
  `enc:v1:<Base64(12-byte IV)>:<Base64(ciphertext + tag)>`

#### Key Management Architecture:
- Key injected via Spring property: `app.security.encryption.secret-key` (environment variable: `APP_ENCRYPTION_SECRET`).
- Format: Base64-encoded 256-bit key.
- **Fail-Closed Configuration:**
  - In production profiles (`prod`, `production`, `staging`, `live`), `SecurityConfigValidator` verifies that `app.security.encryption.secret-key` is configured, non-blank, non-default, decodes to exactly 32 bytes, and fails application bootstrap if missing.
  - In development/test environments, a secure default dev key is provided in `application.yml` for local developer ergonomics.
- **Key Rotation Ready:**
  The version identifier (`v1`) allows future keys (`v2`, `v3`) to coexist seamlessly. Decryption selects the key corresponding to the envelope version, while encryption always uses the active key.

#### Implementation Pattern:
1. `AesGcmEncryptionService`: Handles low-level cryptographic operations, IV generation, GCM parameter spec, encryption, decryption, and authentication tag verification.
2. `VendorBankDetailsEncryptionConverter`: A JPA `@Converter` implementing `AttributeConverter<String, String>` attached to `VendorEntity.bankDetailsJson`. Transparently encrypts on `convertToDatabaseColumn` and decrypts on `convertToEntityAttribute`.

---

### 5.2 Requirement 4.1-E: Staff DTO Sensitive Data Masking

#### Masking Rules:

| Field | Raw Example | Masked Representation | Rule Specification |
| :--- | :--- | :--- | :--- |
| **PAN** | `ABCDE1234F` | `ABCDE****F` | First 5 letters visible, 4 digits masked with `****`, last letter visible. If invalid length (<6), mask all except last 2. |
| **GSTIN** | `27ABCDE1234F1Z5` | `27ABCDE****1Z5` | First 7 characters visible, 4 PAN digits masked with `****`, remaining 4 characters visible. |
| **Bank Account** | `123456789012` | `********9012` | All digits masked except last 4. If length <= 4, mask all (`****`). |
| **Bank Details JSON** | `{"accountNumber":"123456789012", ...}` | `{"accountNumber":"********9012", ...}` | Parses JSON and masks `accountNumber` / `account_no` fields while leaving non-sensitive bank name/branch/IFSC visible for routing. |

#### Role-Based Visibility Policy:

| Role Category | Roles Included | PAN | GSTIN | Bank Account / Details | Rationale |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Privileged Finance & Admin** | `ROLE_ADMIN`, `ROLE_FINANCE_MANAGER`, `ROLE_FINANCE_CHECKER`, `ROLE_FINANCE_MAKER` | **UNMASKED** | **UNMASKED** | **UNMASKED** | Legitimate business need for billing, invoice reconciliation, tax filing, and payment disbursement. |
| **Vendor Self** | `ROLE_VENDOR` (authenticated for own profile) | **UNMASKED** | **UNMASKED** | **UNMASKED** | Vendor owns their own banking credentials and must be able to verify profile accuracy. |
| **General Studio Staff** | `ROLE_STAFF`, `ROLE_SITE_SUPERVISOR`, `ROLE_ARCHITECT`, `ROLE_PROJECT_MANAGER` | **MASKED** | **MASKED** | **MASKED** | Principle of Least Privilege: Project coordination and site tasks do not require raw vendor bank account access. |
| **Clients** | `ROLE_CLIENT` | **BLOCKED** | **BLOCKED** | **BLOCKED** | Multi-tenant isolation: Clients have zero visibility into vendor profiles. |

---

## 6. Pre-Implementation Checklist

- [x] All sensitive fields identified (`bank_details_json`, `pan`, `gstin`).
- [x] Read and write paths mapped across controllers and services.
- [x] Zero impact on `ClientEntity` confirmed.
- [x] Multi-tenant isolation verified (`OperationalProjectService` does not leak vendor banking).
- [x] Backward compatibility strategy designed (prefix `enc:v1:`).
- [x] Masking specification formulated for PAN, GSTIN, and Bank Account numbers.
- [x] Role-based access boundaries clearly defined.
- [x] Production startup validation planned in `SecurityConfigValidator`.

**Auditor Sign-off:** Pre-implementation architectural audit complete. Implementation authorized to proceed.
