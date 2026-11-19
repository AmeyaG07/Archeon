# DUAL INVITATION DELIVERY — PRE-IMPLEMENTATION AUDIT
**Project:** ArcheOn Design Studio — Integrated Architectural Enterprise Platform  
**Scope:** Dual Invitation Delivery (Automatic Authenticated Email + Secure Admin Manual Link)  
**Branch:** `system/phase5.3.2-dual-invitation-delivery`  
**Auditor:** Senior Security Architect & Lead Backend Engineer  
**Audit Date:** 2026-11-19  

---

## 1. EXECUTIVE SUMMARY & AUDIT OBJECTIVE

The initial release of ArcheOn Design Studio requires secure onboarding for clients, vendors, and staff through a dual-delivery model:
1. **Automatic Email Delivery:** An authenticated transactional email containing an onboarding activation link dispatched immediately upon invitation issuance.
2. **Admin-Generated Secure Invitation Link:** A secure URL provided directly to administrators in the portal interface for manual transmission (e.g. via direct message, phone, or secure document).

This pre-implementation audit examines the existing invitation codebase (`UserInvitationEntity`, `UserInvitationService`, `InvitationController`, `ClientService`, `VendorService`), verifies existing security invariants, identifies architectural gaps, and specifies the required implementation design.

---

## 2. EXISTING INVITATION IMPLEMENTATION AUDIT

### 2.1 Domain Model & Database Schema (`user_invitations`)
The database schema was established in Flyway migration `V6__create_business_identity_schema.sql` and mapped via `UserInvitationEntity.java`:

- **Primary Identifier:** `id UUID PRIMARY KEY` (RFC 4122 distributed collision resistance).
- **Recipient Address:** `email VARCHAR(255) NOT NULL` (Normalized to lowercase, trimmed).
- **Target Role:** `target_role VARCHAR(64) NOT NULL` (Restricted to `ALLOWED_ROLES`).
- **Entity Linkages:** `client_id UUID` (FK to `clients`), `vendor_id UUID` (FK to `vendors`). Both enforce referential constraints with `ON DELETE SET NULL`.
- **Cryptographic Hash:** `token_hash VARCHAR(64) NOT NULL UNIQUE` (SHA-256 digest of 32-byte raw token).
- **Status State Machine:** `status VARCHAR(32) NOT NULL DEFAULT 'PENDING'` (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`).
- **Issuer Audit:** `invited_by VARCHAR(255) NOT NULL` (Spring Security principal).
- **Lifecycle Timestamps:** `created_at TIMESTAMP NOT NULL`, `expires_at TIMESTAMP NOT NULL` (now + 7 days), `accepted_at TIMESTAMP`.
- **Optimistic Locking:** `version BIGINT NOT NULL DEFAULT 0` (`@Version`).

### 2.2 Security Invariants Audit

#### A. Token Generation & Entropy
- **Implementation:** `UserInvitationService.generateSecureToken()`
- **Mechanism:** `java.security.SecureRandom` generates 32 random bytes -> 64 hex characters.
- **Entropy:** 256 bits of cryptographic entropy, preventing brute-force token enumeration.
- **Storage Invariant:** The raw 64-char token is **never stored** in the database. Only `TokenHashUtil.hashToken(rawToken)` (SHA-256) is persisted.

#### B. Expiration & Revocation
- **Expiration:** Set to exactly 7 calendar days (`LocalDateTime.now().plusDays(7)`). When an invitee submits an acceptance request, `expiresAt.isBefore(now())` is checked; if expired, the record is transitioned to `EXPIRED` and throws `410 GONE / IllegalStateException`.
- **Admin Revocation:** Administrators can revoke pending invitations via `POST /api/invitations/{id}/revoke`.
- **Superseding Invalidation:** When a new invitation is created for an email, any existing `PENDING` invitations for that email are automatically revoked (`status = "REVOKED"`).

#### C. Single-Use Guarantee & Race Condition Defenses
- **Validation:** `acceptInvitation` verifies `status == "PENDING"`.
- **State Transition:** Upon user account creation, `invitation.setStatus("ACCEPTED")` and `invitation.setAcceptedAt(now())` are committed within the same database transaction (`@Transactional`).
- **Replay Invariant:** Subsequent attempts with the same token encounter `status != "PENDING"` and throw `IllegalStateException: Invitation is no longer active`.
- **Optimistic Locking:** The `@Version` field on `UserInvitationEntity` prevents concurrent duplicate acceptance races.

#### D. Privilege Escalation Defenses
- **Fixed Role Binding:** The invitee **cannot** specify or override `targetRole` during acceptance. The user account is instantiated strictly using `invitation.getTargetRole()`.
- **Privilege Separation:**
  - Internal staff (`ROLE_STAFF`, `ROLE_FINANCE_*`, `ROLE_ADMIN`) can invite external parties (`ROLE_CLIENT`, `ROLE_VENDOR`).
  - Only `ROLE_ADMIN` can issue invitations for administrative or financial management roles (`ROLE_ADMIN`, `ROLE_FINANCE_*`).
  - If a non-admin attempts to issue an admin invitation, `UserInvitationService` throws `AccessDeniedException`.

#### E. Account Activation & Entity Binding
- **User Creation:** `UserEntity` is instantiated with `enabled = true`, `status = "ACTIVE"`, `tokenVersion = 0L`, and linked `clientId` or `vendorId`.
- **Portal Access Transition:** If linked to a client or vendor, their `portalAccess` column is transitioned from `INVITATION_PENDING` to `ACTIVE`.

#### F. Audit Logging
- System records transactional audit events in `audit_events` for:
  - `INVITATION_CREATED` (actor, role, email, targetRole)
  - `INVITATION_ACCEPTED` (created username, email, role)
  - `INVITATION_REVOKED` (actor, email)

---

## 3. IDENTIFIED GAPS & ARCHITECTURAL DEFICIENCIES

Prior to this sprint, the invitation subsystem contained several critical limitations:

1. **Zero Outbound Email Dispatch:**
   - `UserInvitationService.createInvitation` generated the token and returned the response, but contained no email delivery integration. No email was dispatched to clients or vendors.
2. **Relative Invitation URLs:**
   - `toResponse()` generated a relative URL (`/auth/accept-invitation?token=...`). For manual sharing, administrators require a fully qualified absolute URL (e.g. `https://portal.archeon.design/auth/accept-invitation?token=...`).
3. **Missing Delivery Status Metadata:**
   - `InvitationResponse` did not communicate delivery channel status (e.g., whether email delivery succeeded, failed, or was suppressed, and whether a manual link is ready).
4. **Missing Explicit Delivery Channel Controls:**
   - `InviteUserRequest` lacked a `deliveryMethod` parameter allowing administrators to choose `EMAIL`, `MANUAL`, or `BOTH` (default).
5. **No Resend / Link Retrieval Capabilities:**
   - Administrators had no endpoint to re-dispatch an invitation email or retrieve an updated secure manual link if the recipient lost the original email.

---

## 4. DUAL INVITATION DELIVERY TECHNICAL DESIGN

### 4.1 Delivery Channel Equivalence Principle
Both delivery methods (Email and Manual Link) are **cryptographically equivalent**:
- Both channels carry the **exact same 256-bit secure single-use token**.
- The security guarantees (256-bit entropy, SHA-256 storage, 7-day expiration, single-use acceptance, immutable role assignment, and audit trail) apply identically regardless of how the link is delivered.
- Acceptance of the invitation via either method permanently consumes the token, preventing any reuse through the alternate channel.

### 4.2 Email Delivery Architecture
1. **Dependency Addition:**
   Add `spring-boot-starter-mail` to `backend/pom.xml` to leverage standard Jakarta Mail / Spring JavaMailSender capabilities.
2. **Service Interface:**
   `com.webui.backend.service.email.EmailDeliveryService`:
   - `EmailDispatchResult sendInvitationEmail(InvitationEmailPayload payload)`
   - `EmailProviderStatus getProviderStatus()`
3. **Production Authenticated SMTP Implementation:**
   - Standard configuration in `application.yml` under `app.mail`:
     - Host, port (587 STARTTLS / 465 SSL), username, password, auth=true, starttls.enable=true.
     - Verified sender configuration:
       - `From: "ArcheOn Design Studio" <invitations@archeon.design>`
       - `Reply-To: "ArcheOn Support" <support@archeon.design>`
       - `Subject: Welcome to ArcheOn Design Studio — Activate Your Account`
     - Professional dual-format content: Multipart MIME with both clean HTML branding and plain-text fallback.
     - Fail-safe error handling: If SMTP transport encounters a socket error, timeout, or auth failure, the error is logged with secrets strictly redacted, an `INVITATION_EMAIL_FAILED` audit event is recorded, and the operation gracefully falls back to returning the manual link to the administrator. Email failures **never abort** the database transaction or prevent manual onboarding.
4. **Mock / Test Email Provider:**
   - For hermetic local and CI testing (`app.mail.provider: mock`), captures dispatched messages in an in-memory queue, enabling deterministic assertions in test suites.

### 4.3 Manual Link Generation
- Configurable base URL: `${app.portal.base-url:http://localhost:3000}`.
- Produces fully qualified URLs: `${app.portal.base-url}/auth/accept-invitation?token=${rawToken}`.
- Included in the administrator API response (`invitationUrl`) alongside a formatted sharing snippet.

### 4.4 Resend & Channel Management Endpoints
- `POST /api/invitations/{id}/resend`: Allows administrators to re-dispatch an invitation email to a pending invitee or regenerate a secure manual link.

---

## 5. AUDIT CONCLUSION & IMPLEMENTATION CLEARANCE

The existing invitation architecture provides strong foundational security (CSPRNG tokens, SHA-256 storage, optimistic concurrency, and role immutability). The implementation of `EmailDeliveryService`, configuration of authenticated SMTP, absolute URL generation, and dual-delivery request/response DTO enhancements will fulfill all requirements for production acceptance.

Implementation is authorized to proceed on branch `system/phase5.3.2-dual-invitation-delivery`.
