# Phase 4.1 Implementation Report — Business Identity Domain

**Target Branch:** `backend/phase4.1-business-identity`  
**Base Branch:** `backend/phase3.2-production-hardening`  
**Base Commit:** `de8702e2e2623dc5d9652b286d89adcfaec7eb8f`  
**System:** ArcheOn Design Studio Enterprise Backend  
**Date:** 2026-11-18  
**Status:** COMPLETE & PASSING (89/89 Tests Passed)

---

## 1. Executive Summary

Phase 4.1 implements the foundational **Business Identity Domain** for ArcheOn Design Studio, completing the transition from mock/transient user management to an enterprise-grade identity, onboarding, and access control model.

This phase introduces:
1. **Client Management:** Structured lifecycle management of client profiles, contacts, organizational records, and portal access flags with strict BOLA/IDOR protection.
2. **Vendor Management:** Structured onboarding and lifecycle management for contractors, fabricators, and consultants, with tax identifiers (GSTIN, PAN), category classifications, and banking details.
3. **User Identity & Lifecycle:** Comprehensive user profile management, password rotation with instant token revocation across active sessions, and administrator-driven role assignment with strict self-modification guardrails.
4. **Invitation-Only Onboarding:** Zero public self-registration. Onboarding is strictly driven by cryptographically random invitations (SHA-256 hashed at rest), enforcing single-use acceptance, expiration windows, and role-escalation prevention.
5. **Multi-Domain Entity Resolution:** Backward-compatible integration with `FinancialOperationsService`, bridging legacy bill/settlement client/vendor strings with modern UUID-backed identity records.

---

## 2. Architecture & Domain Model Design

### 2.1 Entity Relationships and Schema Design

```
+---------------------------------------------------------------------------------+
|                                 users                                           |
|---------------------------------------------------------------------------------|
| id: UUID (PK)                                                                   |
| username: VARCHAR(50) (UQ)                                                      |
| email: VARCHAR(100) (UQ)                                                        |
| password_hash: VARCHAR(255)                                                     |
| role: VARCHAR(50)                                                               |
| full_name: VARCHAR(100)                                                         |
| phone: VARCHAR(20)                                                              |
| client_id: UUID (FK -> clients.id, ON DELETE SET NULL)                          |
| vendor_id: UUID (FK -> vendors.id, ON DELETE SET NULL)                          |
| status: VARCHAR(20) [ACTIVE, SUSPENDED, DEACTIVATED]                            |
| token_version: BIGINT                                                           |
| version: BIGINT (Optimistic Locking)                                            |
+---------------------------------------------------------------------------------+
           |                                                      |
           | (Many:1 optional)                                    | (Many:1 optional)
           v                                                      v
+-----------------------------+                        +------------------------------+
|          clients            |                        |           vendors            |
|-----------------------------|                        |------------------------------|
| id: UUID (PK)               |                        | id: UUID (PK)                |
| client_reference: VARCHAR   |                        | vendor_reference: VARCHAR    |
| full_name: VARCHAR(100)     |                        | business_name: VARCHAR(150)  |
| email: VARCHAR(100)         |                        | contact_person: VARCHAR(100) |
| phone: VARCHAR(20)          |                        | email: VARCHAR(100)          |
| organization: VARCHAR(150)  |                        | phone: VARCHAR(20)           |
| location: VARCHAR(255)      |                        | category: VARCHAR(50)        |
| status: VARCHAR(20)         |                        | location: VARCHAR(255)       |
| portal_access: BOOLEAN      |                        | gstin: VARCHAR(15)           |
| notes: TEXT                 |                        | pan: VARCHAR(10)             |
| version: BIGINT             |                        | bank_details_json: TEXT      |
+-----------------------------+                        | status: VARCHAR(20)          |
                                                       | portal_access: BOOLEAN       |
                                                       | version: BIGINT              |
                                                       +------------------------------+
                                                                      ^
                                                                      |
+---------------------------------------------------------------------+
|                             user_invitations                        |
|---------------------------------------------------------------------|
| id: UUID (PK)                                                       |
| email: VARCHAR(100)                                                 |
| target_role: VARCHAR(50)                                            |
| client_id: UUID (FK -> clients.id, ON DELETE SET NULL)             |
| vendor_id: UUID (FK -> vendors.id, ON DELETE SET NULL)             |
| token_hash: VARCHAR(64) (UQ)                                        |
| status: VARCHAR(20) [PENDING, ACCEPTED, EXPIRED, CANCELLED]         |
| invited_by: VARCHAR(50)                                             |
| expires_at: TIMESTAMP WITH TIME ZONE                                |
| accepted_at: TIMESTAMP WITH TIME ZONE                               |
| version: BIGINT                                                     |
+---------------------------------------------------------------------+
```

### 2.2 Security Invariants & Defense-in-Depth Mechanisms

1. **Strict Non-Self-Escalation & Non-Self-Lockout:**
   - Administrators cannot alter their own roles (`PUT /api/users/{id}/role` throws `IllegalArgumentException("Administrators cannot modify their own role")`).
   - Administrators cannot deactivate or suspend their own accounts (`PATCH /api/users/{id}/status` throws `IllegalArgumentException("Administrators cannot deactivate or suspend their own account")`).
2. **Privileged Invitation Restrictions:**
   - Non-administrators (`ROLE_DESIGNER`, `ROLE_STUDIO_STAFF`) cannot issue invitations for `ROLE_ADMIN` or financial management roles. Attempted escalation throws `AccessDeniedException`.
3. **Session Invalidation on State Mutation:**
   - Profile password changes (`POST /api/users/me/change-password`), administrative role updates, and account suspensions immediately increment `tokenVersion`, evict cached tokens in `TokenRevocationService`, and invalidate active refresh token families.
4. **BOLA / IDOR Protection (Broken Object-Level Authorization):**
   - External users (`ROLE_CLIENT`) can only view or modify their own client entity linked via `user.getClientId()`. Attempting to access another client's UUID returns HTTP 403 Forbidden.
   - External vendors (`ROLE_VENDOR`) can only view or modify their own vendor entity linked via `user.getVendorId()`. Attempting to access another vendor's UUID returns HTTP 403 Forbidden.
   - Studio management (`ROLE_ADMIN`, `ROLE_PRINCIPAL_ARCHITECT`, `ROLE_STUDIO_STAFF`) has studio-wide read/write permissions subject to role hierarchy.
5. **Cryptographic Invitation Tokens:**
   - Invitation links deliver a 256-bit secure random token (`SecureRandom`, 32 bytes URL-safe Base64 encoded).
   - Only the SHA-256 digest is stored in the `user_invitations` database table (`TokenHashUtil.sha256Hex`).
   - Token verification checks exact hash matching, `PENDING` status, and `expiresAt.isAfter(Instant.now())`. Acceptance transitions status atomically to `ACCEPTED` with optimistic concurrency guardrails.

---

## 3. Database Migration Details

### 3.1 Migration `V6__create_business_identity_schema.sql`
- **Location:** `backend/src/main/resources/db/migration/V6__create_business_identity_schema.sql`
- **Tables Created:**
  - `clients`: Primary identity record for project sponsors and owners.
  - `vendors`: Primary identity record for suppliers, subcontractors, and consultants.
  - `user_invitations`: Secure onboarding registry for invitation-only registration.
- **Table Alterations:**
  - `users`: Extended with `full_name`, `email`, `phone`, `client_id`, `vendor_id`, `status`, `invited_at`, `invited_by`, `last_login_at`, and `version`.
- **Foreign Keys:**
  - `fk_users_client`: `users(client_id) -> clients(id) ON DELETE SET NULL`
  - `fk_users_vendor`: `users(vendor_id) -> vendors(id) ON DELETE SET NULL`
  - `fk_invitations_client`: `user_invitations(client_id) -> clients(id) ON DELETE SET NULL`
  - `fk_invitations_vendor`: `user_invitations(vendor_id) -> vendors(id) ON DELETE SET NULL`
- **Performance Indexes:**
  - `idx_users_email`, `idx_users_client_id`, `idx_users_vendor_id`, `idx_users_status`
  - `idx_clients_reference`, `idx_clients_email`, `idx_clients_status`
  - `idx_vendors_reference`, `idx_vendors_email`, `idx_vendors_category`, `idx_vendors_status`
  - `idx_invitations_email`, `idx_invitations_token_hash`, `idx_invitations_status`

### 3.2 DBA Pre-Flight Script `V6_preflight_check.sql`
- **Location:** `backend/src/main/resources/db/preflight/V6_preflight_check.sql`
- **Checks Performed:**
  - Validates `users` table exists.
  - Validates absence of orphaned or conflicting schema objects prior to migration.
  - Verifies database user privileges to execute `CREATE TABLE`, `ALTER TABLE`, and `CREATE INDEX`.

---

## 4. API Specification & RBAC Matrix

| Endpoint | Method | Allowed Roles | Description | BOLA / IDOR Rule |
| :--- | :---: | :--- | :--- | :--- |
| `/api/clients` | `POST` | `ADMIN`, `PRINCIPAL_ARCHITECT`, `FINANCE_MANAGER`, `STUDIO_STAFF` | Create new client record | System creates, returns reference |
| `/api/clients` | `GET` | `ADMIN`, `PRINCIPAL_ARCHITECT`, `FINANCE_MANAGER`, `STUDIO_STAFF` | List client records with optional search filter | Studio staff access only |
| `/api/clients/{id}` | `GET` | All Authenticated | Retrieve client details by UUID | Staff see all; `ROLE_CLIENT` only see linked record |
| `/api/clients/{id}` | `PUT` | All Authenticated | Update client contact and company details | Staff see all; `ROLE_CLIENT` only edit linked record |
| `/api/clients/{id}/status` | `PATCH` | `ADMIN`, `PRINCIPAL_ARCHITECT` | Update client status (ACTIVE, SUSPENDED, ARCHIVED) | Admin/Principal only; suspends linked user sessions |
| `/api/vendors` | `POST` | `ADMIN`, `PRINCIPAL_ARCHITECT`, `FINANCE_MANAGER`, `PROJECT_MANAGER` | Create new vendor record | System validates category, creates reference |
| `/api/vendors` | `GET` | Studio Staff (excluding Client/Vendor) | List vendor records with search & category filters | Internal studio access only |
| `/api/vendors/{id}` | `GET` | All Authenticated | Retrieve vendor details by UUID | Staff see all; `ROLE_VENDOR` only see linked record |
| `/api/vendors/{id}` | `PUT` | All Authenticated | Update vendor profile and bank details | Staff see all; `ROLE_VENDOR` only edit linked record |
| `/api/vendors/{id}/status` | `PATCH` | `ADMIN`, `PRINCIPAL_ARCHITECT`, `FINANCE_MANAGER` | Update vendor status (ACTIVE, SUSPENDED, BLACKLISTED) | Staff only; suspends linked user sessions |
| `/api/users/me` | `GET` | All Authenticated | Get current authenticated user profile | Scoped to `SecurityContextHolder` caller |
| `/api/users/me` | `PUT` | All Authenticated | Update current user's full name and phone number | Scoped to caller; cannot alter role or email |
| `/api/users/me/change-password` | `POST` | All Authenticated | Change caller password with current password verification | Invalidates all active tokens & increments `tokenVersion` |
| `/api/users` | `GET` | `ADMIN`, `PRINCIPAL_ARCHITECT` | List all users across the platform | Admin/Principal access only |
| `/api/users/{id}/role` | `PUT` | `ADMIN` | Update target user role | Admin only; forbids self-modification |
| `/api/users/{id}/status` | `PATCH` | `ADMIN` | Update user status (ACTIVE, SUSPENDED, DEACTIVATED) | Admin only; forbids self-deactivation; revokes sessions |
| `/api/invitations` | `POST` | Studio Staff (`ADMIN`, `PRINCIPAL_ARCHITECT`, `STUDIO_STAFF`, etc.) | Issue new user invitation with token generation | Non-admins cannot issue `ADMIN` or finance roles |
| `/api/invitations` | `GET` | `ADMIN`, `PRINCIPAL_ARCHITECT` | List active and historical user invitations | Admin/Principal access only |
| `/api/invitations/{id}` | `DELETE` | `ADMIN` | Revoke / cancel a pending user invitation | Admin only |
| `/api/invitations/accept` | `POST` | `permitAll()` | Public invitation acceptance & initial password setting | Requires valid unexpired raw token; atomic consumption |

---

## 5. Financial Operations Compatibility

In earlier phases, `BillApprovalEntity` and `CashSettlementEntity` stored client and vendor identifiers as raw string fields (`clientId`, `vendorId`), e.g., `"client1"`, `"vendor-acme"`.

In `FinancialOperationsService.validateBillAccess(UserEntity user, BillApprovalEntity bill)`:
- Added polymorphic matching:
  - If `user.getRole().equals("ROLE_CLIENT")`, authorization succeeds if `bill.getClientId()` matches either the user's `username`, the linked `ClientEntity.id.toString()`, or `ClientEntity.clientReference`.
  - If `user.getRole().equals("ROLE_VENDOR")`, authorization succeeds if `bill.getVendorId()` matches either the user's `username`, the linked `VendorEntity.id.toString()`, or `VendorEntity.vendorReference`.
- This ensures 100% backward compatibility with legacy seeded data while allowing modern UUID-based linkage.

---

## 6. Changed-File Inventory

### 6.1 Modified Files
- `backend/src/main/java/com/webui/backend/config/SecurityConfig.java`: Configured URL authorization rules for `/api/clients/**`, `/api/vendors/**`, `/api/users/**`, and `/api/invitations/**`.
- `backend/src/main/java/com/webui/backend/model/UserEntity.java`: Added `@Version`, identity profile fields (`fullName`, `email`, `phone`), foreign key relations (`clientId`, `vendorId`), lifecycle status, and invitation tracking.
- `backend/src/main/java/com/webui/backend/repository/UserRepository.java`: Added repository queries for email lookup, uniqueness checks, and client/vendor filtering.
- `backend/src/main/java/com/webui/backend/service/FinancialOperationsService.java`: Enhanced `validateBillAccess` with modern entity identity support alongside legacy string backward compatibility.

### 6.2 New Files Added
- **Database Migrations:**
  - `backend/src/main/resources/db/migration/V6__create_business_identity_schema.sql`
  - `backend/src/main/resources/db/preflight/V6_preflight_check.sql`
- **Domain Models:**
  - `backend/src/main/java/com/webui/backend/model/ClientEntity.java`
  - `backend/src/main/java/com/webui/backend/model/VendorEntity.java`
  - `backend/src/main/java/com/webui/backend/model/UserInvitationEntity.java`
- **Data Repositories:**
  - `backend/src/main/java/com/webui/backend/repository/ClientRepository.java`
  - `backend/src/main/java/com/webui/backend/repository/VendorRepository.java`
  - `backend/src/main/java/com/webui/backend/repository/UserInvitationRepository.java`
- **DTOs:**
  - `backend/src/main/java/com/webui/backend/dto/identity/ClientDto.java`
  - `backend/src/main/java/com/webui/backend/dto/identity/VendorDto.java`
  - `backend/src/main/java/com/webui/backend/dto/identity/UserDto.java`
  - `backend/src/main/java/com/webui/backend/dto/identity/InvitationDto.java`
- **Business Services:**
  - `backend/src/main/java/com/webui/backend/service/ClientService.java`
  - `backend/src/main/java/com/webui/backend/service/VendorService.java`
  - `backend/src/main/java/com/webui/backend/service/UserService.java`
  - `backend/src/main/java/com/webui/backend/service/UserInvitationService.java`
- **REST Controllers:**
  - `backend/src/main/java/com/webui/backend/controller/ClientController.java`
  - `backend/src/main/java/com/webui/backend/controller/VendorController.java`
  - `backend/src/main/java/com/webui/backend/controller/UserController.java`
  - `backend/src/main/java/com/webui/backend/controller/InvitationController.java`
- **Automated Tests:**
  - `backend/src/test/java/com/webui/backend/identity/BusinessIdentityServiceAndSecurityTest.java`

---

## 7. Verification and Test Execution Results

All 89 tests across all test suites passed without a single failure or regression.

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
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.832 s
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 89, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Detailed Test Coverage in `BusinessIdentityServiceAndSecurityTest`:
1. `testClientCreationAndRetrieval`: Confirms client entity persistence, reference generation (`CLI-...`), and retrieval.
2. `testClientBOLAIsolation`: Asserts that a client cannot access another client's profile (BOLA/IDOR prevention).
3. `testVendorCreationAndRetrieval`: Confirms vendor persistence, reference generation (`VEN-...`), and category classification.
4. `testVendorBOLAIsolation`: Asserts that a vendor cannot access or update another vendor's profile.
5. `testUserProfileUpdate`: Validates user self-service profile modification.
6. `testPasswordChangeAndTokenRevocation`: Validates password modification and immediate session token version increment.
7. `testAdminCannotDemoteSelf`: Asserts that an administrator attempting to alter their own role is blocked.
8. `testAdminCannotDeactivateSelf`: Asserts that an administrator attempting to deactivate or suspend their own account is blocked.
9. `testStaffCannotInviteAdmin`: Asserts that staff cannot issue privileged administrator invitations.
10. `testUserInvitationLifecycleAndAcceptance`: Tests full invitation workflow (creation, hash storage, unexpired acceptance, user account creation).
11. `testExpiredInvitationRejected`: Asserts that expired invitations cannot be accepted.
12. `testBillAccessWithClientEntity`: Validates `FinancialOperationsService` bill access authorization via modern `ClientEntity` linkage.
13. `testBillAccessWithVendorEntity`: Validates `FinancialOperationsService` bill access authorization via modern `VendorEntity` linkage.

---

## 8. Remaining Risks and Next Steps

1. **Phase 4.2 (Project Management & Task Assignments):**
   - Connecting projects (`ProjectEntity`) directly with `ClientEntity` and assigning project tasks to `VendorEntity` and team members.
2. **Phase 4.3 (Financial Operations Domain Migration):**
   - Updating `BillApprovalEntity` and `CashSettlementEntity` schemas with formal foreign key references to `clients(id)` and `vendors(id)` once all historical records are backfilled.
3. **Email Delivery Provider Integration:**
   - User invitations currently return the raw invitation token in the creation response (for admin dashboard copy/send) and log generation. Production deployment should configure an SMTP/SendGrid mail adapter to dispatch invitation links directly.
