# INDEPENDENT DUAL INVITATION DELIVERY SECURITY & INTEGRATION ACCEPTANCE AUDIT
**Project:** ArcheOn Design Studio — Integrated Architectural Enterprise Platform  
**Target Branch:** `system/phase5.3.2-dual-invitation-delivery`  
**Base HEAD Commit:** `40d06700d8cb11bd161751b4ca8c62f22dcd7024` (`40d0670`)  
**Parent Commit:** `04f9f0636ff6781f0d025f31bf6721378b349042` (`04f9f06`)  
**Role:** Independent Principal Security Architect, Application Security Auditor & QA Engineer  
**Audit Date:** 2026-11-19  
**Execution Mode:** STRICT READ-ONLY / AUDIT & ACCEPTANCE VERIFICATION (No production deployment authorized)  

---

## 1. EXECUTIVE AUDIT VERDICT

```
========================================================================================
  AUDIT VERDICT: REJECTED
  STATUS: BACKEND CRYPTOGRAPHY HARDENED — REJECTED ON CRITICAL FRONTEND INTEGRATION
  PRIMARY BLOCKERS: 
    1. [P0] Route '/auth/accept-invitation' DOES NOT EXIST in Next.js Router (HTTP 404)
    2. [P1] Frontend Activation Form Contract Mismatch with Backend (Missing Username)
    3. [P1] Synchronous SMTP I/O inside Database Transaction Boundary
========================================================================================
```

### Executive Summary
An independent, adversarial security and integration acceptance audit was conducted across the newly implemented **Dual Invitation Delivery** feature on branch `system/phase5.3.2-dual-invitation-delivery`.

While the backend implementation exhibits high cryptographic rigor (256-bit CSPRNG token entropy, SHA-256 storage hashing, strict optimistic concurrency, and zero privilege escalation), **the feature CANNOT be accepted for production**.

The audit identified a **P0 Critical defect**: the Next.js frontend router **completely lacks the `/auth/accept-invitation` page route**. When an invited client or vendor opens an invitation link from an email or manual link, they encounter an immediate **HTTP 404 Not Found** page. Furthermore, the orphaned activation component (`PortalInvitationActivation.tsx`) does not collect the mandatory `username` parameter required by the backend acceptance endpoint, and the backend performs synchronous third-party SMTP network I/O inside the active database transaction boundary.

---

## 2. REPOSITORY & CHANGE-INTEGRITY VERIFICATION

### 2.1 Git Lineage & Working Tree State
- **Current Branch:** `system/phase5.3.2-dual-invitation-delivery`
- **Base HEAD Commit:** `40d06700d8cb11bd161751b4ca8c62f22dcd7024`
- **Parent Commit:** `04f9f0636ff6781f0d025f31bf6721378b349042`
- **Working Tree Inspection:**
  - Modified tracked files:
    - `backend/pom.xml` (Added `spring-boot-starter-mail`)
    - `backend/src/main/resources/application.yml` (Added `app.mail` and `app.portal.base-url`)
    - `backend/src/main/java/com/webui/backend/dto/identity/InvitationDto.java`
    - `backend/src/main/java/com/webui/backend/service/UserInvitationService.java`
    - `backend/src/main/java/com/webui/backend/service/ClientService.java`
    - `backend/src/main/java/com/webui/backend/service/VendorService.java`
    - `backend/src/main/java/com/webui/backend/controller/InvitationController.java`
  - Added components:
    - `backend/src/main/java/com/webui/backend/service/email/InvitationEmailPayload.java`
    - `backend/src/main/java/com/webui/backend/service/email/EmailDispatchResult.java`
    - `backend/src/main/java/com/webui/backend/service/email/EmailDeliveryService.java`
    - `backend/src/main/java/com/webui/backend/service/email/MockEmailDeliveryService.java`
    - `backend/src/main/java/com/webui/backend/service/email/SmtpEmailDeliveryService.java`
    - `backend/src/main/java/com/webui/backend/service/email/CompositeEmailDeliveryService.java`
    - `backend/src/test/java/com/webui/backend/identity/DualInvitationDeliveryAndSecurityTest.java`
    - `audit/backend/DUAL_INVITATION_DELIVERY_PRE_IMPLEMENTATION_AUDIT.md`
    - `audit/backend/DUAL_INVITATION_DELIVERY_IMPLEMENTATION_REPORT.md`
- **Database Migrations:** Zero schema migrations were added. The existing `user_invitations` table (from Flyway V6) remained unchanged.
- **Dependency Audit:** Added `org.springframework.boot:spring-boot-starter-mail:3.4.0`. No vulnerable or untrusted third-party dependencies were introduced.
- **Secret Scan:** Verified clean. Zero raw passwords, SMTP credentials, or active tokens are present in committed files or application logs.

---

## 3. BACKEND SECURITY AUDIT (14-POINT AUDIT)

A detailed source-code and execution audit was conducted against the 14 mandatory security verification points:

| # | Verification Area | Audit Findings & Source Evidence | Status |
|---|---|---|:---:|
| 1 | **CSPRNG Token Generation** | `UserInvitationService.generateSecureToken()` utilizes `java.security.SecureRandom` generating 32 random bytes (256 bits entropy) formatted as 64 hex characters. | **VERIFIED** |
| 2 | **Raw Token Non-Persistence** | Raw token is hashed immediately via `TokenHashUtil.hashToken(rawToken)`. Only the 64-char SHA-256 hash is persisted in `user_invitations.token_hash`. Raw token is never stored. | **VERIFIED** |
| 3 | **Token Hashing & Comparison** | Token lookup is performed using index-based hash equality (`findByTokenHash`). Constant-time comparison properties in database lookup protect against timing attacks. | **VERIFIED** |
| 4 | **Server-Side Expiration** | Enforces 7-day expiration (`expires_at`). `acceptInvitation` and `resendInvitation` both verify `expiresAt.isBefore(now())`. Expired tokens transition to `EXPIRED` and fail closed. | **VERIFIED** |
| 5 | **Single-Use & Concurrency** | `acceptInvitation` verifies `status == "PENDING"` and atomically sets `status = "ACCEPTED"`. Optimistic locking (`@Version`) prevents concurrent race conditions. | **VERIFIED** |
| 6 | **Revocation Enforcement** | `revokeInvitation` immediately sets `status = "REVOKED"`. Any subsequent presentation of the token fails with `IllegalStateException`. | **VERIFIED** |
| 7 | **Resend Invalidation** | `resendInvitation` generates a fresh 256-bit token and overwrites `token_hash`. The previous token is permanently orphaned and immediately invalid. | **VERIFIED** |
| 8 | **Role Immutability** | `AcceptInvitationRequest` contains no role parameter. The created `UserEntity` role is assigned strictly from `invitation.getTargetRole()`. Invitee cannot alter role. | **VERIFIED** |
| 9 | **Privilege Escalation Defense** | Staff cannot invite `ROLE_ADMIN` or `ROLE_FINANCE_*` (`AccessDeniedException`). Client and vendor users cannot access `/api/invitations` (`403 Forbidden`). | **VERIFIED** |
| 10 | **Recipient Binding** | The created user account email is hardcoded to `invitation.getEmail()`. Linked entity IDs (`clientId`, `vendorId`) are bound strictly to the invitation record. | **VERIFIED** |
| 11 | **Duplicate & Conflict Handling** | Creation fails if an active user exists with the email. Acceptance fails if the chosen username is taken. Existing pending invitations are auto-revoked upon new invite. | **VERIFIED** |
| 12 | **Authorization Boundaries** | All management endpoints (`POST /api/invitations`, `GET /api/invitations`, `POST /api/invitations/{id}/revoke`, `POST /api/invitations/{id}/resend`) enforce `isInternalStaff`. | **VERIFIED** |
| 13 | **IDOR & Enumeration Defenses** | Invitation IDs are non-sequential UUIDs. Public acceptance endpoint accepts only the 256-bit secret token. No unauthenticated endpoint exposes invitation data by ID. | **VERIFIED** |
| 14 | **Credential Leakage in Audit** | `audit_events` logs record email, role, and message IDs. Passwords, raw tokens, and SMTP credentials are strictly excluded from `details_json`. | **VERIFIED** |

---

## 4. EMAIL DELIVERY AUDIT & TRANSACTION BOUNDARY ANALYSIS

### 4.1 SMTP Configuration & Header Verification
Inspection of `SmtpEmailDeliveryService.java` confirms:
- **Verified Headers:**
  - `From: "ArcheOn Design Studio" <invitations@archeon.design>`
  - `Reply-To: "ArcheOn Support" <support@archeon.design>`
  - `Subject: Welcome to ArcheOn Design Studio — Activate Your Account`
- **Transport Security:** Configured for STARTTLS (`mail.smtp.starttls.required=true`). Certificate validation is active by default.
- **Timeouts:** Enforces 5,000ms connection timeout and 10,000ms socket read/write timeouts.
- **Fail-Safe Isolation:** Catches mail exceptions gracefully; failure does not throw unhandled runtime exceptions.

### 4.2 Transaction Boundary Flaw (FINDING-03)
> [!WARNING]
> **Architectural Risk — Synchronous Third-Party I/O inside `@Transactional` Boundary:**  
> In `UserInvitationService.createInvitation` (and `resendInvitation`), `emailDeliveryService.sendInvitationEmail(emailPayload)` is executed **inside** the database transaction.

**Consequences:**
1. **HikariCP Connection Starvation:** An open database transaction and underlying physical JDBC connection are held while waiting for external SMTP socket I/O (up to 15 seconds under network lag). Under concurrent administrative operations, this can exhaust the HikariCP connection pool.
2. **Phantom Email Delivery on Database Rollback:** If the SMTP server accepts and dispatches the email, but a subsequent database error (or commit timeout) rolls back the transaction, the recipient receives a valid email containing a token that does not exist in the database.
3. **Required Pattern:** A **Transactional Outbox Pattern** or Spring `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` must be adopted to ensure the database transaction commits *before* external network I/O commences.

### 4.3 HTML Template Injection Risk (FINDING-04)
In `SmtpEmailDeliveryService.buildHtmlBody()`, the recipient's name is interpolated directly without HTML entity encoding:
```java
String greeting = (name != null && !name.isBlank()) ? "Hello " + name + "," : "Hello,";
// Interpolated into HTML:
"<h2 style=\"font-size: 18px; margin-top: 0; color: #111111;\">" + greeting + "</h2>"
```
If an administrative user inputs a crafted string (e.g., `Client <img src=x onerror=...`), raw HTML is injected into the outgoing email. All dynamic variables must pass through `HtmlUtils.htmlEscape()`.

---

## 5. MANUAL INVITATION SECURITY AUDIT

- **Trusted Base URL:** The absolute URL is generated from `app.portal.base-url` (`http://localhost:3000` in dev / `https://portal.archeon.design` in prod), preventing HTTP Host Header poisoning.
- **Raw Token Exposure Control:** The raw token is returned **only once** in the immediate response payload of `createInvitation` or `resendInvitation`. Subsequent calls to `GET /api/invitations` return `rawToken: null`.
- **Cache-Control:** Spring Security's default headers apply `Cache-Control: no-cache, no-store, max-age=0, must-revalidate` to all authenticated responses, preventing proxy caching of the raw token.
- **Manual Snippet:** The `manualSharingSnippet` provides a clear, formatted block with recipient, role, activation link, and expiration notice.

---

## 6. FRONTEND INTEGRATION AUDIT & CRITICAL ROUTE MISSING (FINDING-01 & FINDING-02)

### 6.1 Critical Verification: Does `/auth/accept-invitation` Exist?
An exhaustive inspection of the Next.js 16 App Router tree in `frontend/src/app` was conducted:
```
frontend/src/app/
├── (auth)/
│   └── login/
│       └── page.tsx      --> Exists: /login
├── admin/                --> Exists: /admin/*
├── client/               --> Exists: /client/*
├── vendor/               --> Exists: /vendor/*
└── design-system/        --> Exists: /design-system
```

**AUDIT RESULT: The route `/auth/accept-invitation` DOES NOT EXIST in the Next.js router.**
- Attempting to navigate to `http://localhost:3000/auth/accept-invitation?token=...` returns an **HTTP 404 Not Found**.
- The frontend build generates 31 static routes, but none correspond to `/auth/accept-invitation` or `/(auth)/accept-invitation`.

### 6.2 Component Inspection: `PortalInvitationActivation.tsx`
The file `frontend/src/components/forms/PortalInvitationActivation.tsx` exists as an orphaned component:
1. **Contract Mismatch:** The component form requires only `password` and `confirmPassword`:
   ```typescript
   export interface InvitationActivationData {
     invitationToken: string;
     password: string;
     confirmPassword: string;
   }
   ```
   However, the backend endpoint `/api/invitations/accept` **mandates** `username`:
   ```java
   if (!StringUtils.hasText(req.getUsername())) {
       throw new IllegalArgumentException("Username is required");
   }
   ```
   Any submission from this component fails with a `400 BAD_REQUEST`.
2. **Missing Token Pre-Validation:** The component expects an `invitationValid` boolean prop, but there is no frontend page or backend endpoint (`/api/invitations/validate?token=...`) to verify the token and display the recipient's assigned role and email prior to credential entry.
3. **Token History Leakage:** The component reads `params.get("token")` but does not sanitize or remove the query parameter via `window.history.replaceState`.

---

## 7. AUTOMATED VERIFICATION RESULTS

### 7.1 Backend Test Execution Evidence
- **Command:** `mvn -f backend/pom.xml test "-Dtest=DualInvitationDeliveryAndSecurityTest" "-DargLine=-XX:+EnableDynamicAgentLoading"`
- **Result:** `BUILD SUCCESS` (10/10 Tests Passed, Time: 25.15s).
- **Full Regression Suite:** `mvn -f backend/pom.xml test "-DargLine=-XX:+EnableDynamicAgentLoading -Xmx384m"`
- **Result:** `BUILD SUCCESS` (180/180 Tests Passed, 0 Failures, 0 Errors, 0 Skipped, Time: 01:18 min).

### 7.2 Frontend Production Build Evidence
- **Command:** `npm --prefix frontend run build`
- **Result:** Exit code `0` (Compiled in 2.2s, TypeScript finished in 24.7s, 31 static pages generated).
- **Route Audit:** Confirmed `/auth/accept-invitation` is **absent** from the generated static route manifest.

---

## 8. FINDINGS CLASSIFICATION MATRIX

| Finding ID | Severity | Category | Description |
|---|:---:|---|---|
| **FINDING-01** | **P0 — CRITICAL** | Frontend Routing | Route `/auth/accept-invitation` does not exist in Next.js App Router (HTTP 404). Complete end-user workflow is broken. |
| **FINDING-02** | **P1 — HIGH** | Contract Mismatch | `PortalInvitationActivation.tsx` does not collect `username`, causing mandatory backend validation to fail (`400 Bad Request`). |
| **FINDING-03** | **P1 — HIGH** | Transaction Boundary | Synchronous SMTP network call inside database transaction creates HikariCP starvation and phantom email risks. |
| **FINDING-04** | **P2 — MEDIUM** | Input Sanitization | Dynamic recipient name in HTML email template is not HTML-escaped, exposing an HTML injection risk. |
| **FINDING-05** | **P2 — MEDIUM** | External Integration | Live external SMTP server delivery remains unverified against a real mailbox (`BLOCKED — EXTERNAL DEPENDENCY`). |
| **FINDING-06** | **P3 — LOW** | Client Information Leak | Raw token remains in browser URL history without `window.history.replaceState` scrubbing. |

---

## 9. REQUIRED REMEDIATION ACTIONS (ACTION PLAN)

Prior to re-auditing for production acceptance:

1. **Create Next.js Route Page (`frontend/src/app/(auth)/accept-invitation/page.tsx`):**
   - Mount the invitation activation form at `/auth/accept-invitation` (or create a rewrite from `/auth/accept-invitation` to `/(auth)/accept-invitation`).
2. **Harmonize Activation Form Contract:**
   - Add a `username` field (and optional `fullName`, `phone`) to `PortalInvitationActivation.tsx` so requests conform to `AcceptInvitationRequest`.
3. **Implement Public Token Inspection Endpoint:**
   - Add `GET /api/invitations/validate?token=...` returning safe metadata (`email`, `targetRole`, `recipientName`, `valid`) to allow the UI to display role and name before password entry.
4. **Decouple SMTP Dispatch from Database Transaction:**
   - Refactor `createInvitation` and `resendInvitation` using Spring `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` or an asynchronous task queue.
5. **Escape HTML in Email Templates:**
   - Wrap dynamic parameters in `HtmlUtils.htmlEscape()` inside `SmtpEmailDeliveryService.java`.
6. **Token Query String Sanitization:**
   - In `PortalInvitationActivation.tsx`, call `window.history.replaceState({}, document.title, window.location.pathname)` immediately after capturing the token to scrub it from the URL bar.

---

## 10. FINAL ACCEPTANCE DECISION

```
========================================================================================
  FINAL VERDICT: REJECTED
========================================================================================
```

### Justification:
Although the backend cryptographic primitives, entity models, and unit regression suite pass 100%, the Dual Invitation Delivery feature **fails end-to-end integration acceptance**. 

The missing Next.js frontend route (`/auth/accept-invitation` returning 404) prevents both email recipients and manual link recipients from ever activating their accounts. In accordance with strict audit standards, **a feature cannot be approved for production go-live while the primary user-facing activation interface is non-existent**.

*Audit conducted and published independently by the Principal Security Architect on 2026-11-19.*  
*Report artifact: [SPRINT_5_3_2_1_DUAL_INVITATION_INDEPENDENT_ACCEPTANCE_AUDIT.md](file:///d:/WEBUI/audit/backend/SPRINT_5_3_2_1_DUAL_INVITATION_INDEPENDENT_ACCEPTANCE_AUDIT.md)*
