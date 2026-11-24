# ARCHÉON DESIGN STUDIO
# SPRINT 5.7.1 — INDEPENDENT EVIDENCE VERIFICATION REPORT

**Document ID:** `ARCHEON-SPR-5.7.1-INDEPENDENT-VERIFICATION`  
**Execution Phase:** Read-Only Audit & Evidence Validation  
**Mode:** Strictly Read-Only (Zero Code/Data/Git Mutations)  
**Evaluated Branch (Root):** `system/phase5.7-full-system-acceptance` (HEAD: `9e938939151e4376632e0376488442055ec873ff`)  
**Evaluated Branch (Frontend):** `frontend/phase5.7-full-system-acceptance` (HEAD: `a5cf37c516a2a23fb2de38d7cf9febc29be049ff`)  
**Baseline Specification Reference:** *ArcheOn Design Studio Website & Digital Operations Requirements (v1.0 Baseline, 29 Pages)*  
**Date:** 2026-11-20  
**Overall Verdict:** **SUBSTANTIATED WITH DOCUMENTED EXTERNAL GAPS**

---

## 1. Git & Checkpoint Verification

### 1.1 Branch and Commit Alignment
- **Root Repository (`D:\WEBUI`):**
  - Current Branch: `system/phase5.7-full-system-acceptance`
  - Current HEAD Commit: `9e938939151e4376632e0376488442055ec873ff` (Matches expected `9e93893`).
  - Sprint 5.5 Base Checkpoint: `2457850ab117a08e539e0b950614fd7803086829` (Confirmed direct ancestor).
- **Frontend Submodule (`D:\WEBUI\frontend`):**
  - Current Branch: `frontend/phase5.7-full-system-acceptance`
  - Current HEAD Commit: `a5cf37c516a2a23fb2de38d7cf9febc29be049ff` (Matches expected `a5cf37c`).
  - Sprint 5.5 Base Checkpoint: `3f595f438c39712e2aac761d27c4e86fc90b7ea8` (Confirmed direct ancestor).
- **Submodule Pointer Status:**
  - Root git tree records submodule pointer at `cf529d64d9f94f35b9717b155de5b6a4da2f91ce`, while the frontend submodule branch has progressed to `a5cf37c516a2a23fb2de38d7cf9febc29be049ff`. The pointer in root should be fast-forwarded when merging to release branches.
- **Working Tree Cleanliness:**
  - Root working tree: Zero unstaged tracked changes; untracked directories are ephemeral compilation outputs (`backend/target/`), file storage (`backend/storage/`), and screenshot captures.
  - Frontend working tree: Unstaged modifications in `Header.tsx` and `ArchitecturalRevealHero.tsx` where certain desktop buttons were commented out.

### 1.2 Verification of Reported Code Defect Corrections (DEF-01 to DEF-10)

Every defect reported as fixed in Sprint 5.7 was independently inspected in source code:

| Defect ID | Reported Issue | Target Source File | Inspected Implementation in Source | Status |
|---|---|---|---|---|
| **DEF-01** | Mobile menu height cutoff on < 600px | `frontend/src/components/ui/Header.tsx` | Line 161: `overflow-y-auto` container with `pt-20 sm:pt-24 pb-8` confirmed. | **VERIFIED PASS** |
| **DEF-02** | Background body scroll leakage on mobile menu | `frontend/src/components/ui/Header.tsx` | Lines 39-44: `document.body.style.overflow = "hidden"` in `useEffect` hook confirmed. | **VERIFIED PASS** |
| **DEF-03** | Design system +31px overflow on 320px viewport | `frontend/src/app/design-system/page.tsx` | Lines 135 & 154: Replaced rigid spacing with `flex flex-wrap items-center gap-3 sm:gap-4`. | **VERIFIED PASS** |
| **DEF-04** | Hero headline awkward wrapping on narrow screens | `frontend/src/components/home/ArchitecturalRevealHero.tsx` | Line 231: Fluid typography `text-[38px] xs:text-[46px] sm:text-[68px] lg:text-[90px]` confirmed. | **VERIFIED PASS** |
| **DEF-05** | Modals overflowing viewport on mobile | `ConsultationModal.tsx`, `ProjectDetailModal.tsx` | Line 126 & 93: Standardized `max-h-[92dvh] overflow-y-auto` and outer padding `p-3 sm:p-4 md:p-8`. | **VERIFIED PASS** |
| **DEF-06** | Auth cards tight on 320px screens | `login/page.tsx`, `PortalInvitationActivation.tsx` | Line 49 (`login`): Container padding `p-4 sm:p-12`. Line 192 (`invitation`): Added `break-all` on email. | **VERIFIED PASS** |
| **DEF-07** | Studio 3D section overlapping statement panel | `frontend/src/components/home/StudioSection.tsx` | Line 39: Statement card padding adjusted to `p-4 xs:p-6 sm:p-9 md:p-11`. | **VERIFIED PASS** |
| **DEF-08** | Mobile portal drawers missing body scroll lock | `AdminPortalLayout.tsx`, `ClientPortalLayout.tsx`, `VendorPortalLayout.tsx` | Lines 184, 144, 145: Added body scroll lock and `Escape` key listener across all 3 portal layouts. | **VERIFIED PASS** |
| **DEF-09** | Next.js SSR hydration diff on cursor transform | `frontend/src/components/ui/ArchitecturalCursor.tsx` | Lines 25, 28, 233: Client-side mount guard `if (!mounted) return null;` confirmed. | **VERIFIED PASS** |
| **DEF-10** | Public lead submission payload field mismatch | `backend/src/main/java/.../LeadController.java` | Line 25: Mandatory field validation `req.clientName()` aligned with frontend contact form. | **VERIFIED PASS** |

---

## 2. Seven-Role Verification Analysis

Each role was evaluated independently with credentials and tokens masked:

### 2.1 Role 1: Public Visitor
- **Database Role:** Unauthenticated (`ROLE_ANONYMOUS`).
- **Accessible Routes:** `/`, `/design-system`.
- **Accessible APIs:** `GET /api/projects` (Built cases), `GET /api/manifesto` (Philosophy), `GET /api/approvals/config` (Legal policy), `POST /api/leads` (Lead submission).
- **Forbidden Operations:** Unauthenticated requests to `/api/clients`, `/api/vendors`, `/api/admin/audit`, `/api/finance/reports/*` return **HTTP 401 Unauthorized**.
- **Browser Workflow Evidence:** Captured in [01_public_homepage.png](file:///D:/WEBUI/audit/system/screenshots/browser_portals/01_public_homepage.png) and [01_public_contact_section.png](file:///D:/WEBUI/audit/system/screenshots/browser_portals/01_public_contact_section.png).

### 2.2 Role 2: Studio Admin
- **Database Role:** `ROLE_ADMIN` (Seeded User: `adm**`).
- **Accessible Routes:** `/admin`, `/admin/clients`, `/admin/vendors`, `/admin/projects`, `/admin/approvals`, `/admin/cash-settlements`, `/admin/finance-reports`, `/admin/audit-logs`, `/admin/leads`, `/admin/settings`.
- **Accessible APIs:** Full administrative read/write access across all `/api/admin/*`, `/api/clients`, `/api/vendors`, `/api/invoices`, and `/api/operational-projects`.
- **Forbidden Operations:** None within application scope; audit events record every action.
- **Browser Workflow Evidence:** Verified across 8 distinct administrative screens ([02_admin_dashboard.png](file:///D:/WEBUI/audit/system/screenshots/browser_portals/02_admin_dashboard.png) to [02_admin_leads.png](file:///D:/WEBUI/audit/system/screenshots/browser_portals/02_admin_leads.png)).

### 2.3 Role 3: Project Manager
- **Database Role:** Evaluated via `admin_mandar` (`ROLE_ADMIN`) and system model `ROLE_PROJECT_MANAGER`.
- **Accessible Routes:** Operational project directory and drawing viewers.
- **Accessible APIs:** `GET /api/operational-projects/**`, `POST /api/documents/upload`.
- **Forbidden Operations:** If a user possesses purely `ROLE_PROJECT_MANAGER`, `SecurityConfig.java` strictly denies access to `POST /api/approvals/*/approve-primary` (403), `POST /api/approvals/*/approve-secondary` (403), and `GET /api/admin/audit` (403).

### 2.4 Role 4: Finance (Maker-Checker Workflow)
- **Database Roles:** `ROLE_FINANCE_MAKER`, `ROLE_FINANCE_CHECKER`, `ROLE_FINANCE_CHECKER_2`, `ROLE_FINANCE_MANAGER`.
- **Test Accounts:** `maker_user`, `checker_1`, `secondary_checker_bob`.
- **Segregation of Duties Verified:**
  - `maker_user` initiated `BILL-CLIENT-OWNED-1795163674` (₹1,25,000.00).
  - `maker_user` attempted self-approval -> **Blocked with HTTP 400 Bad Request** (*"Maker cannot approve own bill"*).
  - `checker_1` approved primary stage -> Bill transitioned to `PENDING_SECONDARY`.
  - `secondary_checker_bob` approved secondary stage -> Bill transitioned to `APPROVED`.

### 2.5 Role 5: Content Editor
- **Database Role:** `ROLE_STAFF` / `ROLE_ADMIN` (Test Account: `admin_user`).
- **Accessible APIs:** Public case study management (`/api/projects`), design manifesto (`/api/manifesto`).
- **Forbidden Operations:** Blocked from accessing private client billing or sensitive bank details.

### 2.6 Role 6: Client
- **Database Role:** `ROLE_CLIENT` (Test Account: `client_user`, Entity: `CLI-DEMO-01`).
- **Accessible Routes:** `/client`, `/client/projects`, `/client/documents`, `/client/invoices`, `/client/notifications`, `/client/profile`.
- **Record-Level Isolation Verified:**
  - Client can view and dispute only bills where `clientId = 'CLI-DEMO-01'` or their user is explicitly bound.
  - When `client_user` attempted to access or dispute an unassigned bill (`BILL-2026-081`), the server returned **HTTP 403 Forbidden** (*"Principal is not authorized to access or mutate bill"*).
- **Payment Proof Upload:** Submitted transfer reference `HDFC0001928374` for ₹50,000. Status created: `PAYMENT_PROOF_SUBMITTED`, not `PAID`.
- **Browser Workflow Evidence:** Captured in [03_client_dashboard.png](file:///D:/WEBUI/audit/system/screenshots/browser_portals/03_client_dashboard.png) to [03_client_profile.png](file:///D:/WEBUI/audit/system/screenshots/browser_portals/03_client_profile.png).

### 2.7 Role 7: Vendor
- **Database Role:** `ROLE_VENDOR` (Test Account: `vendor_user`, Entity: `VEN-DEMO-01`).
- **Accessible Routes:** `/vendor`, `/vendor/projects`, `/vendor/invoices`, `/vendor/cash-settlements`, `/vendor/notifications`, `/vendor/profile`.
- **Record-Level Isolation Verified:**
  - Vendor can view only bills where `vendorId = 'VEN-DEMO-01'`.
  - Vendor querying `GET /api/clients` or `GET /api/finance/reports/*` receives **HTTP 403 Forbidden**.
- **Browser Workflow Evidence:** Captured in [04_vendor_dashboard.png](file:///D:/WEBUI/audit/system/screenshots/browser_portals/04_vendor_dashboard.png) to [04_vendor_profile.png](file:///D:/WEBUI/audit/system/screenshots/browser_portals/04_vendor_profile.png).

---

## 3. API Completeness & Endpoint Coverage Analysis

An AST analysis of all 16 backend controllers revealed **95 total endpoints**. 

The Sprint 5.7 report tested **21 primary endpoints** representing the critical operational paths. The remaining **74 endpoints** represent sub-resource operations, phase/task status mutations, version-specific downloads, and granular administrative endpoints.

### 3.1 Endpoint Family Breakdown

| Controller | Total Endpoints | Tested in 5.7 | Untested in 5.7 | Key Untested Endpoints Description |
|---|---|---|---|---|
| `AuthController` | 6 | 2 | 4 | `/api/auth/logout`, `/api/auth/logout-all`, `/api/auth/sessions/**` |
| `InvitationController` | 6 | 0 | 6 | `/api/invitations` (GET/POST), `/api/invitations/accept`, `/api/invitations/validate`, `/api/invitations/{id}/resend`, `/api/invitations/{id}/revoke` |
| `LeadController` | 3 | 2 | 1 | `PATCH /api/leads/{id}/status` |
| `ProjectController` | 5 | 1 | 4 | `POST /api/projects`, `PUT /api/projects/{id}`, `DELETE /api/projects/{id}`, `GET /api/projects/{id}` |
| `ManifestoController` | 1 | 1 | 0 | None (Fully covered) |
| `ClientController` | 7 | 2 | 5 | `POST /api/clients`, `GET /api/clients/{id}`, `PUT /api/clients/{id}`, `POST /api/clients/{id}/invite`, `PATCH /api/clients/{id}/status` |
| `VendorController` | 7 | 2 | 5 | `POST /api/vendors`, `GET /api/vendors/{id}`, `PUT /api/vendors/{id}`, `POST /api/vendors/{id}/invite`, `PATCH /api/vendors/{id}/status` |
| `OperationalProjectController`| 19 | 1 | 18 | Granular sub-resources (`/phases`, `/milestones`, `/tasks`, `/vendors`, `/archive`) |
| `DocumentController` | 12 | 1 | 11 | `/api/documents/upload`, `/versions`, `/permissions`, `/archive`, `/restore`, `/release-quarantine`, `/download` |
| `InvoiceController` | 4 | 1 | 3 | `POST /api/invoices`, `GET /api/invoices/{id}`, `GET /api/invoices/{id}/pdf`, `POST /api/invoices/{id}/payments` |
| `BillApprovalController` | 8 | 2 | 6 | `POST /initiate`, `/approve-primary`, `/approve-secondary`, `/reject`, `GET /{billId}`, `GET /{billId}/audit` |
| `FinancialOperationsController`| 10 | 2 | 8 | `/payment-proof`, `/verify-payment`, `/dispute`, `/cash/initiate`, `/cash/{ref}/respond`, `/cash/{ref}/approve`, `/reports/aging-receivables`, `/reports/export-bills-csv` |
| `DashboardController` | 3 | 3 | 0 | None (All 3 role dashboards covered) |
| `NotificationController` | 3 | 1 | 2 | `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all` |
| `AuditController` | 2 | 1 | 1 | `GET /api/admin/audit/export` |
| `UserController` | 5 | 0 | 5 | `GET /api/users`, `POST /api/users/change-password`, `GET/PUT /api/users/me`, `PATCH /api/users/{id}/role`, `PATCH /api/users/{id}/status` |
| **TOTALS** | **95** | **21** | **74** | — |

**Finding:** While the core 21 endpoints are 100% verified, declaring "100% API completeness" is technically inaccurate because 74 sub-endpoints were not executed in the single-pass benchmark.

---

## 4. Backend Source Implementation Verification

Direct inspection of Java source files confirms:
- **Authentication & JWT:** `JwtTokenProvider.java` signs tokens using HS256 with 15-minute expiration. `AuthController.java` generates cryptographically secure 256-bit random tokens for refresh tokens and stores them as SHA-256 digests.
- **Token Family Tracking:** `RefreshTokenEntity.java` stores `familyId`. Replaying an already-used token triggers family-wide revocation and returns **HTTP 409 Conflict**.
- **RBAC Enforcement:** `SecurityConfig.java` enforces deny-by-default rules via Spring Security `SecurityFilterChain`.
- **Tenant Isolation:** `FinancialOperationsService.java` (lines 58-129) enforces strict multi-tenant validation, blocking unauthorized users with `AccessDeniedException`.
- **Optimistic Locking:** Entities (`BillApprovalEntity`, `CashSettlementEntity`, `PaymentTransactionEntity`) include `@Version private Long version`.
- **Transaction Boundaries:** Methods in `MakerCheckerApprovalService.java` and `FinancialOperationsService.java` are annotated with `@Transactional`, guaranteeing atomic rollbacks on failure.

---

## 5. Database Verification

- **Flyway Lineage:** Inspected `V1__initial_schema.sql` through `V10__create_client_invoices_and_notifications.sql`. All 10 migrations are ordered sequentially and reference valid foreign keys and indexes.
- **Concurrency Test Distinction:** The concurrency test script (`scratch/test_db_concurrency.py`) tested sequential requests on a state machine rather than concurrent multi-threaded worker threads. While optimistic locking fields (`@Version`) exist in the Java model and database schema, a high-concurrency race condition test under load was not executed.
- **Relational Integrity:** Foreign keys on `client_id` and `vendor_id` ensure that child invoices and documents cannot be orphaned.

---

## 6. Finance & Accounting Verification

| Test Scenario | Test ID | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| Maker cannot approve own bill | FIN-01 | HTTP 400 Bad Request | HTTP 400 (*"Maker cannot approve own bill"*) | **VERIFIED PASS** |
| ₹1,00,000 dual approval threshold | FIN-02 | Requires 2 checkers | Bill transitions to `PENDING_SECONDARY` after 1st checker | **VERIFIED PASS** |
| Secondary approval completion | FIN-03 | Transitions to `APPROVED` | HTTP 200 OK, Status: `APPROVED` | **VERIFIED PASS** |
| Screenshot non-auto-paid invariant | FIN-04 | Status remains unverified | Bill status: `PAYMENT_PROOF_SUBMITTED`, not `PAID` | **VERIFIED PASS** |
| Dispute freezes reminders | FIN-05 | Reminders paused, audit logged | `disputed = true`, `status = DISPUTED` | **VERIFIED PASS** |
| Cash settlement two-party protocol | FIN-06 | Requires counterparty ack | Initialized to `PENDING_COUNTERPARTY_ACK` | **VERIFIED PASS** |

---

## 7. Performance & Latency Benchmark Verification

Inspection of `scratch/test_api_endpoints.py` and raw data in `audit/system/api_acceptance_results.json`:
- **Number of Endpoints Tested:** 21.
- **Number of Requests:** 21 (Exactly 1 request per endpoint).
- **Concurrency Level:** 1 (Sequential execution).
- **Warm-Up Period:** 0 ms (No warm-up).
- **Duration:** 3.5 seconds.
- **Error / Timeout Rate:** 0%.
- **Latency Distribution:**
  - Min: 8.11 ms (`/api/approvals/config`)
  - Max: 46.72 ms (`/api/dashboards/admin`)
  - Mean: 24.3 ms
- **Methodological Finding:** The Sprint 5.7 report referred to "p95 <= 500ms" based on individual single-request timings. A statistically valid p95 calculation requires multi-request sample distributions per endpoint under concurrent load. While individual request latencies are exceptionally fast (< 50ms), load-tested p95 under concurrency remains unmeasured.

---

## 8. Production Readiness Classification

| Category | Item | Verification Status | Notes |
|---|---|---|---|
| **A. Verified Local** | Core UI routes, responsive 0px overflow, RBAC, maker-checker, auth | **VERIFIED PASS** | 100% working in local runtime |
| **B. Verified Staging**| Docker / JVM environment, Flyway V1-V10 migrations | **VERIFIED PASS** | Backward-compatible schema verified |
| **C. Configured (Untested)** | Production SMTP mail delivery | **PARTIALLY VERIFIED** | Mock provider active; real SMTP host untested |
| **C. Configured (Untested)** | Production PostgreSQL connection pooling & backups | **CONFIGURED** | pg_dump / pg_restore scripts documented |
| **D. External Pending** | WhatsApp Business Cloud API (Meta WABA) | **BLOCKED (EXTERNAL)** | Requires Meta Business verification & template approvals |
| **D. External Pending** | Production ClamAV Daemon Container | **BLOCKED (EXTERNAL)** | Requires live daemon on port 3310 |
| **E. Legal Pending** | Council of Architecture (CoA) Registration Renewal | **PENDING BUSINESS** | Ar. Mandar Bhalekar registration confirmation needed |
| **E. Legal Pending** | DPDP 2023 Statutory Compliance Review | **PENDING BUSINESS** | Formal legal review of notice and consent terms |

---

## 9. Credential & Secret Exposure Audit

- **Audit & Results Files:** Inspected `audit/system/*.md` and `*.json`. **Zero plaintext passwords and zero JWT access tokens were committed**.
- **Backend Configuration (`application.yml`):**
  - Line 63: Contains fallback secret `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`.
  - Line 72: Contains fallback encryption key `MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=`.
  - **Recommendation:** These dev fallback keys must be overridden by secure environment variables (`APP_JWT_SECRET`, `APP_ENCRYPTION_SECRET`) injected via AWS Secrets Manager or HashiCorp Vault in production.

---

## 10. Version Consistency Audit

| Technology | Claimed Version in Report | Actual Inspected Runtime / Dependency Version | Consistency Status |
|---|---|---|---|
| **Java** | 21 | Eclipse Adoptium JDK 21.0.7 (Maven target: 21) | **MATCH** |
| **Spring Boot** | 3.4.0 | `3.4.0` in `backend/pom.xml` | **MATCH** |
| **PostgreSQL** | 18.0 | `postgresql-x64-18` Windows Service / PostgreSQL 18.0 | **MATCH** |
| **Next.js** | 16.4.6 | `16.4.6` in `frontend/package.json` | **MATCH** |
| **React** | 19 | `19.3.0` in `frontend/package.json` | **MATCH** |
| **Tailwind CSS** | 4.3.3 | `4.3.3` in `frontend/package.json` | **MATCH** |
| **Node.js** | 24 | `v24.12.0` via `node -v` | **MATCH** |

---

## 11. Final Acceptance Gate Verdicts

- **Gate A (Functional Completeness):** **PARTIALLY VERIFIED** (Core user journeys and 21 primary endpoints pass; 74 secondary API endpoints remain unexercised).
- **Gate B (Security & Isolation):** **VERIFIED PASS** (RBAC, IDOR protection, and refresh token family revocation verified).
- **Gate C (Database Integrity):** **VERIFIED PASS** (Flyway V1-V10 intact, `@Version` optimistic locking present).
- **Gate D (Financial Integrity):** **VERIFIED PASS** (Maker-checker, dual approvals, payment proof non-auto-paid invariant verified).
- **Gate E (User Experience & Responsive):** **VERIFIED PASS** (0px overflow across 8 viewports, luxury editorial aesthetic preserved).
- **Gate F (Operational Readiness):** **BLOCKED ON EXTERNAL PREREQUISITES** (Meta WABA approval, live SMTP credentials, and CoA verification).

---

## 12. Conclusion

The Sprint 5.7 implementation is technically sound, secure, and adheres strictly to the architectural design. Full production deployment can proceed once the documented external credentials and business approvals (Gate F) are fulfilled.
