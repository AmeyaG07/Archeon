# ArcheOn Backend — Independent Phase 4.1 Acceptance Audit

**Audit Target:** `backend/phase4.1-business-identity`  
**Target Commit:** `bb8b0b0f1ec2ba00faecdaa6422ee79e2aab52eb`  
**Base Commit:** `de8702e2e2623dc5d9652b286d89adcfaec7eb8f`  
**Role:** Independent Senior Backend Security Auditor & Principal Java Architect  
**Audit Date:** 2026-11-18  
**Audit Mode:** STRICT READ-ONLY AUDIT (Zero code, migration, or git modifications)  
**Final Verdict:** **ACCEPTED WITH CONDITIONS**

---

## 1. Executive Audit Summary

An independent, read-only architectural and security acceptance audit of Phase 4.1 (**Business Identity Domain**) was conducted on commit `bb8b0b0`. The audit examined all domain models, repositories, business services, controllers, DTOs, security configurations, database migrations, and preflight scripts.

The implementation successfully fulfills the core architectural and security requirements:
- Establishes full CRUD and lifecycle management for Clients, Vendors, and Users.
- Enforces strict invitation-only onboarding with cryptographically secure single-use tokens (SHA-256 hashed at rest).
- Enforces Broken Object-Level Authorization (BOLA / IDOR) tenant isolation for clients and vendors.
- Implements strict administrative non-self-escalation and non-self-demotion invariants.
- Maintains 100% backward compatibility for legacy financial records in `FinancialOperationsService`.
- Passes all 89 automated tests across all test suites with zero failures and zero regressions.

One **MEDIUM** finding and three **LOW** findings were identified, regarding sensitive banking data encryption at rest, data masking, and database constraint rigor. These findings do not block progression to Phase 4.2 development, but must be resolved prior to production deployment.

---

## 2. Step 1 — Git and Baseline Verification

| Inspection Item | Requirement | Observed Status | Evidence |
| :--- | :--- | :---: | :--- |
| **Current Branch** | `backend/phase4.1-business-identity` | **VERIFIED** | `git branch --show-current` -> `backend/phase4.1-business-identity` |
| **Target Commit** | `bb8b0b0` | **VERIFIED** | `bb8b0b0f1ec2ba00faecdaa6422ee79e2aab52eb` |
| **Base Commit** | `de8702e` | **VERIFIED** | Parent commit is `de8702e2e2623dc5d9652b286d89adcfaec7eb8f` |
| **Frontend Isolation** | Zero frontend modifications | **VERIFIED** | Diff against `de8702e` contains zero frontend files. Only `backend/src/` and `audit/` changed. |
| **Working Tree Status** | Clean backend tree | **VERIFIED** | `git status backend/src/` reports "nothing to commit, working tree clean". |
| **Commit Cleanliness** | No unexpected/unrelated files | **VERIFIED** | Commit contains 33 files (source code, tests, DDL, and audit reports). |

---

## 3. Step 2 — Client & Vendor Security Audit

### 3.1 Endpoint Authorization & RBAC
Inspection of `SecurityConfig.java` and controller routing:
- **Client Management:**
  - `GET /api/clients`, `POST /api/clients`, `PATCH /api/clients/*/status`, `POST /api/clients/*/invite` require `ROLE_ADMIN` or `ROLE_STAFF`.
  - `GET /api/clients/me`, `PUT /api/clients/me` require `ROLE_CLIENT`.
  - `GET /api/clients/{id}`, `PUT /api/clients/{id}` permit `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CLIENT`, subject to programmatic BOLA checks.
- **Vendor Management:**
  - `GET /api/vendors`, `POST /api/vendors`, `PATCH /api/vendors/*/status`, `POST /api/vendors/*/invite` require `ROLE_ADMIN` or `ROLE_STAFF`.
  - `GET /api/vendors/me`, `PUT /api/vendors/me` require `ROLE_VENDOR`.
  - `GET /api/vendors/{id}`, `PUT /api/vendors/{id}` permit `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_VENDOR`, subject to programmatic BOLA checks.

### 3.2 BOLA / IDOR Verification
In `ClientService.validateClientAccess(ClientEntity client, Authentication auth)`:
- Admin/Staff callers are granted studio-wide access.
- For client callers (`ROLE_CLIENT`):
  - Access is granted if `user.getClientId().equals(client.getId())`.
  - Or if `auth.getName()` matches `client.getClientReference()` or `client.getEmail()`.
  - Any attempt by Client A to supply Client B's UUID or Reference throws `AccessDeniedException` -> HTTP 403 Forbidden.
- In `VendorService.validateVendorAccess(VendorEntity vendor, Authentication auth)`:
  - Equivalent validation ensures Vendor A cannot query or mutate Vendor B's record.
- **Verified via Unit Tests:**
  - `testClientBOLAIsolation`: Client user accessing a different client's UUID received `AccessDeniedException`.
  - `testVendorBOLAIsolation`: Vendor user accessing a different vendor's UUID received `AccessDeniedException`.

### 3.3 Account Suspension & Session Invalidation
- When a client or vendor status is updated to `SUSPENDED`:
  - `ClientService.updateClientStatus` and `VendorService.updateVendorStatus` find all linked user accounts (`findByClientId` / `findByVendorId`).
  - Sets `enabled = false`, `status = "SUSPENDED"`, increments `tokenVersion`.
  - Calls `refreshTokenRepository.revokeAllForUser(username)` and `tokenRevocationService.revokeAllForUser(username)`.
  - **Verdict:** Immediate session termination on organization suspension is properly implemented.

---

## 4. Step 3 — User & Role Security Audit

### 4.1 Self-Escalation & Non-Self-Lockout
In `UserService.updateUserRole`:
```java
// Strict Invariant: Admin CANNOT modify their own role
if (auth.getName().equals(user.getUsername())) {
    throw new IllegalStateException("Security Invariant Violation: Administrators cannot modify their own role to prevent self-lockout or privilege manipulation.");
}
```
In `UserService.updateUserStatus`:
```java
// Strict Invariant: Admin CANNOT deactivate their own account
if (auth.getName().equals(user.getUsername())) {
    throw new IllegalStateException("Security Invariant Violation: Administrators cannot deactivate their own account.");
}
```
- Non-admin users attempting to call `/api/users/**` endpoints are rejected by Spring Security (`hasRole('ADMIN')` -> HTTP 403).
- **Verified via Unit Tests:**
  - `testAdminCannotDemoteSelf`: Throws `IllegalStateException`.
  - `testAdminCannotDeactivateSelf`: Throws `IllegalStateException`.

### 4.2 Mass-Assignment Prevention
- `UpdateProfileRequest` contains only:
  - `fullName`
  - `phone`
- Email, role, `clientId`, `vendorId`, `status`, and `enabled` cannot be modified via self-service profile APIs.

### 4.3 Password Rotation & Session Termination
In `UserService.changePassword`:
- Verifies current password using `passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())`.
- Encodes new password with BCrypt.
- Increments `tokenVersion`.
- Terminates all active refresh tokens and in-memory/Redis revocations:
  - `refreshTokenRepository.revokeAllForUser(username)`
  - `tokenRevocationService.revokeAllForUser(username)`
- **Verified via Unit Test:**
  - `testPasswordChangeAndTokenRevocation`: Successfully verified token version increment and session termination.

### 4.4 Data Exposure Audit
- `UserProfileResponse` and `UserSummaryResponse` DTOs omit `password` and `passwordHash`.
- No sensitive user credential data is exposed.

---

## 5. Step 4 — Invitation Security Audit

### 5.1 Token Cryptography & Storage
- **Generation:** 256-bit cryptographically secure random token (`SecureRandom`, 32 bytes formatted via `HexFormat`).
- **Storage:** Only the SHA-256 digest (`TokenHashUtil.hashToken(rawToken)`) is stored in `user_invitations.token_hash`.
- Raw token is returned only once to the issuer during invitation creation.

### 5.2 Concurrency & Single-Use Enforcement
- In `UserInvitationService.acceptInvitation`:
  - Token hash lookup verifies `invitation.getStatus().equals("PENDING")`.
  - Checks expiration (`invitation.getExpiresAt().isBefore(LocalDateTime.now())`).
  - Creates user record with `targetRole`.
  - Sets `invitation.setStatus("ACCEPTED")` and `acceptedAt`.
  - Saves `invitationRepository.save(invitation)`.
- **Concurrency Protection:**
  - `UserInvitationEntity` is annotated with `@Version Long version`.
  - Under concurrent acceptance requests, Hibernate optimistic locking detects version mismatch and throws `OptimisticLockException`.
  - Global `FinancialConflictExceptionHandler` catches the conflict and returns HTTP 409 Conflict.
  - The second transaction rolls back completely, preventing double-consumption or ghost accounts.

### 5.3 Privileged Invitation Restrictions
In `UserInvitationService.createInvitation`:
```java
// Privileged role invariant: only ROLE_ADMIN can invite another ROLE_ADMIN or finance manager
if (("ROLE_ADMIN".equals(targetRole) || targetRole.startsWith("ROLE_FINANCE_")) && !isAdmin(auth.getAuthorities())) {
    throw new AccessDeniedException("Only a studio administrator can invite users with administrative or finance roles");
}
```
- Non-admin staff cannot elevate themselves or external parties to admin or finance manager roles.
- **Verified via Unit Test:**
  - `testStaffCannotInviteAdmin`: Throws `AccessDeniedException`.

---

## 6. Step 5 — Financial Operations Backward Compatibility Audit

In `FinancialOperationsService.validateBillAccess(BillApprovalEntity bill, String actorId, ...)`:
```java
// 5. Check if authenticated user is mapped to a Client or Vendor entity linked to this bill
if (userRepository != null) {
    Optional<UserEntity> userOpt = userRepository.findByUsername(actorId);
    if (userOpt.isPresent()) {
        UserEntity user = userOpt.get();
        if (user.getClientId() != null && bill.getClientId() != null) {
            if (bill.getClientId().equalsIgnoreCase(user.getClientId().toString())) {
                return;
            }
            if (clientRepository != null) {
                Optional<ClientEntity> clientOpt = clientRepository.findById(user.getClientId());
                if (clientOpt.isPresent() && clientOpt.get().getClientReference().equalsIgnoreCase(bill.getClientId())) {
                    return;
                }
            }
        }
        if (user.getVendorId() != null && bill.getVendorId() != null) {
            if (bill.getVendorId().equalsIgnoreCase(user.getVendorId().toString())) {
                return;
            }
            if (vendorRepository != null) {
                Optional<VendorEntity> vendorOpt = vendorRepository.findById(user.getVendorId());
                if (vendorOpt.isPresent() && vendorOpt.get().getVendorReference().equalsIgnoreCase(bill.getVendorId())) {
                    return;
                }
            }
        }
    }
}
```
### Audit Findings on Financial Invariants:
1. **Preservation of Legacy Matching:**
   - Steps 2, 3, 4 preserve exact match on `bill.getInitiatorId()`, `bill.getVendorId()`, and `bill.getClientId()` against `actorId`. Legacy bills referencing `"client1"` or `"vendor-acme"` remain fully accessible to those usernames.
2. **Entity Resolution:**
   - Modern bills storing UUID strings or references (`CLI-...`, `VEN-...`) resolve accurately via `user.getClientId()` and `user.getVendorId()`.
3. **No First-Access Binding:**
   - Unassigned bills (`clientId == null`) throw `AccessDeniedException`. No automatic ownership capture.
4. **Maker-Checker & Verification Safeguards:**
   - Maker-checker state transitions and payment verification flows are untouched and retain their strict RBAC restrictions.

---

## 7. Step 6 — Database & Migration Audit

### 7.1 Migration `V6__create_business_identity_schema.sql`
- **Tables Created:** `clients`, `vendors`, `user_invitations`.
- **Alterations:** Adds profile, foreign key, and audit columns to `users`.
- **Foreign Keys:**
  - `fk_users_client`: `users(client_id) -> clients(id) ON DELETE SET NULL`
  - `fk_users_vendor`: `users(vendor_id) -> vendors(id) ON DELETE SET NULL`
  - `fk_invitations_client`: `user_invitations(client_id) -> clients(id) ON DELETE SET NULL`
  - `fk_invitations_vendor`: `user_invitations(vendor_id) -> vendors(id) ON DELETE SET NULL`
- **Assessment of `ON DELETE SET NULL`:**
  - Neither `ClientService` nor `VendorService` exposes a delete endpoint (soft status updates only).
  - In the event of manual DBA cleanup, `ON DELETE SET NULL` prevents cascading deletion of user login accounts, while preserving transaction records.

### 7.2 Pre-Flight Script `V6_preflight_check.sql`
- Strictly read-only `SELECT` queries inspecting table existence and row counts.
- Verifies absence of table name collisions prior to DDL execution.

---

## 8. Step 7 — Sensitive Data & Encryption Audit

### 8.1 Vendor Tax and Banking Data Analysis
In `VendorEntity.java`:
```java
@Column(name = "gstin")
private String gstin;

@Column(name = "pan")
private String pan;

@Column(name = "bank_details_json", columnDefinition = "TEXT")
private String bankDetailsJson;
```
### Audit Findings:
1. **Storage Format:** `bank_details_json` is stored in the database as plaintext JSON string.
2. **Encryption at Rest:** No JPA AttributeConverter (`@Convert`) or AES-256-GCM envelope encryption is applied to `bank_details_json`.
3. **Documentation Discrepancy:** Documentation referenced "encrypted/sanitized banking data representations", but the implementation currently relies on underlying database volume encryption rather than application-layer column encryption.
4. **Data Masking in Responses:** In `VendorDto.VendorResponse`, `bankDetailsJson`, `gstin`, and `pan` are returned unmasked. While only internal staff and the authenticated vendor themselves can view the vendor record, general studio staff views should mask bank account numbers (e.g. `****1234`).
5. **Log Leaks:** Verified that `VendorService` audit logging does NOT log `bankDetailsJson`, `pan`, or `gstin`. Only `reference` and `businessName` are logged.

---

## 9. Step 8 — Test Suite Execution & Negative Security Cases

### 9.1 Test Execution Results
The test suite was executed via Maven:
`mvn -f backend/pom.xml test -DargLine="-Xmx512m"`

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.webui.backend.concurrency.FinancialConcurrencyAndOptimisticLockingTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.887 s
[INFO] Running com.webui.backend.config.ProductionBootstrapHardeningTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.144 s
[INFO] Running com.webui.backend.config.ProductionProfileContextTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.638 s
[INFO] Running com.webui.backend.identity.BusinessIdentityServiceAndSecurityTest
[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.954 s
[INFO] Running com.webui.backend.security.Phase3AuthLifecycleTest
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.110 s
[INFO] Running com.webui.backend.SecurityAndRbacIntegrationTest
[INFO] Tests run: 26, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.251 s
[INFO] Running com.webui.backend.MakerCheckerAndSafetyInvariantsTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.970 s
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 89, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### 9.2 Verification of Negative Cases
- BOLA cross-client access -> **DENIED (403)**
- BOLA cross-vendor access -> **DENIED (403)**
- Admin self-role modification -> **BLOCKED (IllegalStateException)**
- Admin self-deactivation -> **BLOCKED (IllegalStateException)**
- Staff inviting privileged admin/finance roles -> **DENIED (AccessDeniedException)**
- Expired invitation acceptance -> **REJECTED (IllegalStateException)**
- Password change session termination -> **VERIFIED (Token version incremented, tokens revoked)**

---

## 10. Findings Inventory

| Finding ID | Severity | Category | Description | Recommended Remediation |
| :--- | :---: | :--- | :--- | :--- |
| **FINDING-4.1-01** | **MEDIUM** | Cryptography / Data Protection | `bank_details_json` in `vendors` table is stored as plaintext `TEXT` without application-layer AES-256 envelope encryption. | Introduce JPA `@Convert(converter = EncryptedJsonConverter.class)` using an AES-256-GCM key managed via environment variables before production launch. |
| **FINDING-4.1-02** | **LOW** | Information Disclosure | `VendorResponse` returns raw bank details, PAN, and GSTIN to all staff roles without masking. | Mask bank account numbers (e.g. `XXXX-XXXX-1234`) and tax IDs for general staff views; expose full details only to `ROLE_FINANCE_MANAGER` or the vendor itself. |
| **FINDING-4.1-03** | **LOW** | Database Integrity | Column `users.email` lacks a database-level `UNIQUE` constraint (only an index `idx_users_email` exists), relying entirely on application-level checks. | Add `ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);` in Phase 4.2 migration. |
| **FINDING-4.1-04** | **LOW** | Abuse Prevention | Public endpoint `/api/invitations/accept` has no IP-level or request-level rate limiting. | Apply Bucket4j or Spring Security rate-limiting filter to prevent request flood attacks against token verification. |

---

## 11. Final Verdict & Release Conditions

### Verdict: **ACCEPTED WITH CONDITIONS**

Phase 4.1 demonstrates robust software engineering, strict authorization boundaries, reliable concurrency safeguards, and seamless backward compatibility. It is **SAFE TO PROCEED** to Phase 4.2 (Project Management & Task Assignments).

### Conditions for Production Release:
1. **Condition 1 (Remediate FINDING-4.1-01):** Implement application-level AES-256 envelope encryption on `bank_details_json` before production deployment.
2. **Condition 2 (Remediate FINDING-4.1-03):** Add a formal `UNIQUE` constraint on `users(email)` in the Phase 4.2 / 4.3 Flyway migration script.
3. **Condition 3:** Ensure production email delivery provider (SMTP/SendGrid) is integrated to handle invitation delivery securely.
