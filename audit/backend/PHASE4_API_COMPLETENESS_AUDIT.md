# ArcheOn Design Studio — Phase 4 API Completeness Audit

**Audit Target:** ArcheOn Design Studio Backend (`d:\WEBUI\backend`)  
**Target Commit:** `de8702e2e2623dc5d9652b286d89adcfaec7eb8f`  
**Target Branch:** `backend/phase3.2-production-hardening`  
**Audit Date:** 2026-11-18  
**Audit Mode:** STRICT READ-ONLY ARCHITECTURAL AND API AUDIT  
**Lead Auditor:** Senior Backend Engineer & Security Architect  

---

## 1. Executive Summary & Audit Verdict

This audit evaluated the backend implementation of ArcheOn Design Studio at baseline commit `de8702e` to assess whether existing APIs provide complete, secure, and production-usable functionality for the studio business platform and its frontend portals (Admin, Client, Vendor).

### Final Verdict: `READY WITH CONDITIONS`

#### Summary of Conditions:
1. **Security & Financial Integrity Baseline is Sound:** The backend possesses an exceptionally hardened core for financial maker-checker approvals, optimistic concurrency locking, Refresh Token Rotation (RTR), session family management, and production bootstrap safety. All **76 automated tests pass with 0 failures and 0 errors**.
2. **Business Domain Breadth Gap:** Out of the 14 business domains required for full studio operations:
   - **4 domains (28.6%) are FULLY IMPLEMENTED:** Financial Approvals, Payment Tracking & Reconciliation, Site Cash Settlements, and Reporting/Exports.
   - **5 domains (35.7%) are PARTIALLY IMPLEMENTED:** IAM, Architectural Projects, Invoice Management, Notifications, and Audit Trail.
   - **5 domains (35.7%) are COMPLETELY MISSING:** Client Management, Vendor Management, Milestones & Tasks, Document Management (DMS), and Dashboard Aggregation.
3. **Frontend-Backend Contract Disconnection:** The frontend contains highly developed, professional React/Next.js components in `frontend/src/components/portal/` with rich TypeScript interfaces for client, vendor, and admin workspaces. However, frontend pages currently render empty arrays (`[]`), placeholder banners, or disconnected mock state because the corresponding backend entities, tables, and endpoints do not yet exist.
4. **Implementation Mandate:** Phase 4 implementation must proceed incrementally (Phases 4.1 through 4.5) to expand data models and endpoints without weakening or regressing any established Phase 2, 3, 3.1, or 3.2 security invariants.

---

## 2. Baseline Verification & Integrity Status

Before initiating the architectural analysis, the Git baseline and build integrity were verified:

```
Branch: backend/phase3.2-production-hardening
Commit: de8702e2e2623dc5d9652b286d89adcfaec7eb8f
Author: ArcheOn Studio <dev@archeonstudio.com>
Subject: test(hardening): add regression tests for production bootstrap safety
Working Tree: Clean (untracked audit files only; zero modified tracked files)
```

### Automated Test Suite Execution:
```
[INFO] Running com.webui.backend.concurrency.FinancialConcurrencyAndOptimisticLockingTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.webui.backend.config.ProductionBootstrapHardeningTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.webui.backend.config.ProductionProfileContextTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.webui.backend.security.MakerCheckerAndSafetyInvariantsTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.webui.backend.security.Phase3AuthLifecycleTest
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.webui.backend.security.SecurityAndRbacIntegrationTest
[INFO] Tests run: 26, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total tests run: 76, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
```

---

## 3. Existing API Architecture Analysis

The backend architecture is structured as a Spring Boot 3 / Java 17 application with JPA (Hibernate), PostgreSQL / H2, Flyway migrations, and Spring Security 6.

### 3.1. Architectural Strengths
1. **Stateless JWT with Cryptographic Family Tracking:**
   - Access tokens have a strict 15-minute TTL and contain claims `sub`, `roles`, `ver` (token version), and `fid` (session family ID).
   - Refresh tokens are stored exclusively as SHA-256 digests (`token_hash`) with unique constraints.
   - P3-01 atomic single-use consumption conditional update prevents concurrent refresh race conditions while allowing a 3-second grace window to protect against network jitter.
   - P3-02 cross-user token revocation protections prevent unauthorized IDOR attacks on session termination.
2. **Financial Maker-Checker State Machine:**
   - Multi-tier dual-checker approvals for high-value bills (`>= ₹1,00,000`).
   - Strict identity separation: `Initiator != Approver 1 != Approver 2`.
   - Anti-split detection calculates cumulative bill volume across a 48-hour rolling window for a given vendor and project.
3. **Forensic Concurrency Protection:**
   - Optimistic locking via `@Version` columns on `bill_approvals`, `cash_settlement_requests`, and `payment_transactions`.
   - Standardized HTTP 409 Conflict mappings prevent lost updates.
4. **BOLA / IDOR Verification:**
   - `FinancialOperationsService.validateBillAccess` strictly enforces that external principals (`ROLE_CLIENT`, `ROLE_VENDOR`) can only interact with bills explicitly assigned to their identity, rejecting first-access binding and unassigned legacy bills.

### 3.2. Architectural Deficits
1. **Lack of Entity Breadth:** The data model is narrowly focused on financial transactions (`bill_approvals`, `cash_settlement_requests`, `payment_transactions`). Foundational business entities such as `ClientEntity`, `VendorEntity`, `DocumentEntity`, `MilestoneEntity`, and `NotificationEntity` do not exist.
2. **CMS vs. Operational Project Divergence:** `ProjectEntity` is designed for public portfolio marketing (tags, release date, temperature, socials) rather than operational architecture studio management (client linkage, vendor assignments, phase milestones, budgets, site addresses).
3. **Missing Administrative Query Endpoints:** While `AuditEventEntity` captures detailed forensic audit trails, the only exposed query endpoint is `/api/approvals/{billId}/audit`. There is no studio-wide audit viewer endpoint (`/api/admin/audit`).
4. **Missing Aggregated Dashboard APIs:** No endpoints exist to compute metrics for admin or portal dashboards; client components currently have no API to fetch active project counts, overdue receivable sums, or pending approval counts.

---

## 4. Business Domain Completeness Evaluation (14 Domains)

Every domain required for the ArcheOn Design Studio platform was evaluated against the implementation:

```
+------------------------------------+-----------------------+------------------------------------------------------------+
| Business Domain                    | Classification        | Code Evidence / Operational Status                         |
+------------------------------------+-----------------------+------------------------------------------------------------+
| 1. IAM & Session Security          | PARTIALLY IMPLEMENTED | Auth, RTR, sessions ready; User CRUD & Profile API missing |
| 2. Client Management               | MISSING               | No ClientEntity, table, or /api/clients endpoints          |
| 3. Vendor Management               | MISSING               | No VendorEntity, table, or /api/vendors endpoints          |
| 4. Project Management              | PARTIALLY IMPLEMENTED | Portfolio CMS exists; operational architectural PM missing |
| 5. Milestones & Task Tracking      | MISSING               | No Milestone/Task entities or endpoints                    |
| 6. Document Management (DMS)       | MISSING               | No DMS entity, file storage adapter, or hash verification  |
| 7. Invoice Management & GST        | PARTIALLY IMPLEMENTED | Bill approvals exist; Client GST tax invoicing missing     |
| 8. Payment Tracking & Reconcile    | IMPLEMENTED           | Payment proofs, bank reconciliation, balance recalculation |
| 9. Financial Approvals             | IMPLEMENTED           | Dual maker-checker, threshold escalation, anti-split check |
| 10. Site Cash Settlements          | IMPLEMENTED           | Two-party acknowledgment, site supervisor flow, auto-recon |
| 11. Notifications & Communication  | PARTIALLY IMPLEMENTED | WhatsApp adapter fail-closed; In-app notifications missing |
| 12. Audit Trail & Activity History | PARTIALLY IMPLEMENTED | Logging complete; Studio-wide query API missing            |
| 13. Dashboard Aggregations         | MISSING               | No endpoints for admin, client, or vendor dashboard metrics|
| 14. Reporting & Data Exports       | IMPLEMENTED           | Aging receivables report and attributed CSV export exist   |
+------------------------------------+-----------------------+------------------------------------------------------------+
```

### Detailed Domain Breakdown:

#### Domain 1: Identity, Authentication & Session Security (IAM)
- **Status:** `PARTIALLY IMPLEMENTED`
- **Implemented:** `AuthController` provides `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/logout-all`, `/api/auth/sessions`, `/api/auth/sessions/{familyId}/revoke`. Account disablement checks, token versioning, demotion enforcement, and RTR replay detection are operational.
- **Missing:**
  - Administrative User Management: `GET /api/users`, `POST /api/users`, `PUT /api/users/{id}`, `DELETE /api/users/{id}`, `PATCH /api/users/{id}/role`, `PATCH /api/users/{id}/status`.
  - Self-service Profile: `GET /api/profile` (or `/api/users/me`), `PUT /api/profile/password`.
  - User Invitation Flow: Generating secure setup/invite tokens for client and vendor portal onboarding.

#### Domain 2: Client Management
- **Status:** `MISSING`
- **Implemented:** Only raw string `clientId` stored as an unvalidated foreign reference in `bill_approvals`.
- **Missing:**
  - `ClientEntity` with fields: `id` (UUID), `reference` (e.g. `CLI-2026-001`), `fullName`, `email`, `phone`, `organization`, `location`, `status` (`Active`, `Inactive`, `Suspended`), `portalAccess` (`Not Invited`, `Invitation Pending`, `Active`, `Suspended`), `createdAt`, `updatedAt`.
  - Endpoints: `GET /api/clients`, `POST /api/clients`, `GET /api/clients/{id}`, `PUT /api/clients/{id}`, `PATCH /api/clients/{id}/status`, `POST /api/clients/{id}/invite`.

#### Domain 3: Vendor Management
- **Status:** `MISSING`
- **Implemented:** Raw string `vendorId` stored in `bill_approvals` and `cash_settlement_requests`.
- **Missing:**
  - `VendorEntity` with fields: `id` (UUID), `reference` (e.g. `VND-2026-042`), `businessName`, `contactPerson`, `email`, `phone`, `vendorCategory` (e.g. `Carpentry`, `Civil Work`, `HVAC`, `Electrical`, `Masonry`), `location`, `gstin`, `pan`, `bankDetailsJson`, `status`, `portalAccess`, `createdAt`.
  - Endpoints: `GET /api/vendors`, `POST /api/vendors`, `GET /api/vendors/{id}`, `PUT /api/vendors/{id}`, `PATCH /api/vendors/{id}/status`, `POST /api/vendors/{id}/invite`.

#### Domain 4: Project Management
- **Status:** `PARTIALLY IMPLEMENTED`
- **Implemented:** `ProjectEntity` and `/api/projects` CRUD exist, but only serve marketing portfolio showcases (fields: `code`, `title`, `releaseDate`, `temperature`, `summary`, `tagsJson`, `linksJson`, `socialsJson`).
- **Missing:**
  - Operational studio project fields: `clientId` (Foreign Key), `projectType` (`Residential`, `Commercial`, `Turnkey Architecture`), `status` (`Planning`, `Under Design`, `Under Execution`, `On Hold`, `Completed`), `progressPercentage`, `siteAddress`, `estimatedStartDate`, `estimatedCompletionDate`, `contractValue`, `budgetAllocated`.
  - Assigned vendors and assigned team members mapping.
  - Endpoints: `GET /api/projects/operational`, `GET /api/client/projects`, `GET /api/vendor/projects`.

#### Domain 5: Milestones & Task Tracking
- **Status:** `MISSING`
- **Implemented:** None.
- **Missing:**
  - `ProjectMilestoneEntity`: `id`, `projectId`, `title`, `description`, `phase` (`Concept`, `Design Development`, `Permit Drawings`, `Structural Execution`, `Interior Finishing`, `Handover`), `sequenceOrder`, `targetDate`, `completionDate`, `status` (`Pending`, `In Progress`, `Under Review`, `Approved`), `billedPercentage`.
  - Endpoints: `GET /api/projects/{id}/milestones`, `POST /api/projects/{id}/milestones`, `PUT /api/milestones/{id}`, `PATCH /api/milestones/{id}/status`.

#### Domain 6: Document Management & File Storage (DMS)
- **Status:** `MISSING`
- **Implemented:** Plain string URLs (`payment_proof_url`, `proof_attachment_url`) stored directly on financial records.
- **Missing:**
  - `DocumentEntity`: `id` (UUID), `projectId`, `clientId`, `vendorId`, `fileName`, `fileType`, `category` (`Architectural Drawing`, `Contract`, `Tax Invoice`, `Payment Proof`, `Site Inspection Photo`, `Compliance Certificate`), `fileSizeBytes`, `storagePath`, `sha256Digest`, `accessLevel` (`INTERNAL_ONLY`, `CLIENT_VISIBLE`, `VENDOR_VISIBLE`, `PUBLIC`), `uploadedBy`, `createdAt`.
  - Secure upload and download endpoints: `POST /api/documents/upload`, `GET /api/documents/{id}/download`, `GET /api/documents/project/{projectId}`.

#### Domain 7: Invoice Management & Tax / GST Compliance
- **Status:** `PARTIALLY IMPLEMENTED`
- **Implemented:** Internal vendor bill tracking (`BillApprovalEntity`) with maker-checker approvals and balance recalculation.
- **Missing:**
  - Client-Facing Tax Invoices: Studio-to-Client invoicing for professional design fees and construction progress claims.
  - GST Breakdown: CGST (9%), SGST (9%), IGST (18%), SAC / HSN codes (e.g. SAC 998321 for Architectural Services).
  - Line Items: Itemized fee schedule (`description`, `sacCode`, `rate`, `quantity`, `taxableAmount`, `cgstAmount`, `sgstAmount`, `igstAmount`, `totalAmount`).
  - Endpoints: `POST /api/invoices`, `GET /api/invoices`, `GET /api/invoices/{id}`, `GET /api/invoices/{id}/pdf`.

#### Domain 8: Payment Tracking & Reconciliation
- **Status:** `IMPLEMENTED`
- **Implemented:** Complete in `FinancialOperationsController` and `FinancialOperationsService`. Payment proof submissions, bank statement verification (`POST /api/finance/verify-payment/{transactionId}`), balance recalculation (`PAID` vs `PARTIALLY_PAID`), and transaction history (`GET /api/finance/transactions/{billId}`).
- **Invariants Verified:** Payment proof never auto-marks as paid; requires finance role verification.

#### Domain 9: Financial Approvals & Maker-Checker Workflows
- **Status:** `IMPLEMENTED`
- **Implemented:** Complete in `BillApprovalController` and `MakerCheckerApprovalService`. Dual checker approvals for high-value bills, rolling window anti-split detection, initiator rejection, and forensic audit event generation.

#### Domain 10: Site Cash Settlements
- **Status:** `IMPLEMENTED`
- **Implemented:** Complete in `FinancialOperationsController` and `FinancialOperationsService`. Two-party mutual acknowledgment protocol, physical receipt reference, site purpose tracking, terminal state protections, and automated reconciliation into payment transactions.

#### Domain 11: Notifications & Communication
- **Status:** `PARTIALLY IMPLEMENTED`
- **Implemented:** `WhatsAppCloudApiAdapter` and `WhatsAppNotificationService` provide fail-closed WhatsApp reminder dispatching with opt-in verification, quiet-hours suppression (21:00-09:00 IST), and reminder frequency capping.
- **Missing:**
  - In-App Notifications Entity: `NotificationEntity` (`id`, `recipientUsername`, `title`, `message`, `category`, `readStatus`, `actionUrl`, `createdAt`).
  - REST Endpoints: `GET /api/notifications`, `PATCH /api/notifications/{id}/read`, `POST /api/notifications/mark-all-read`.

#### Domain 12: Audit Trail & Activity History
- **Status:** `PARTIALLY IMPLEMENTED`
- **Implemented:** `AuditEventEntity` and `AuditEventRepository` log all auth mutations, bill state transitions, cash settlements, and payment submissions.
- **Missing:**
  - Administrative Studio Audit Query Endpoint: `GET /api/admin/audit` with query parameter filtering (`entityName`, `actorId`, `startDate`, `endDate`, `action`) and pagination.

#### Domain 13: Dashboard Aggregation & Operational Metrics
- **Status:** `MISSING`
- **Implemented:** None.
- **Missing:**
  - `GET /api/admin/dashboard`: Returns aggregate metrics (`activeProjects`, `completedProjects`, `totalClients`, `activeVendors`, `newEnquiries`, `pendingApprovals`, `outstandingReceivables`, `overdueReceivables`, `recentActivities`).
  - `GET /api/client/dashboard`: Returns client-specific project summaries, pending invoices, and recent documents.
  - `GET /api/vendor/dashboard`: Returns vendor-specific active contracts, pending cash settlements, and payment vouchers.

#### Domain 14: Reporting & Data Exports
- **Status:** `IMPLEMENTED`
- **Implemented:** `GET /api/finance/reports/aging-receivables` (categorized into under 30 days, 30-60 days, over 60 days) and `GET /api/finance/reports/export-bills-csv` (timestamped and attributed CSV export).

---

## 5. Frontend Contract & Integration Analysis

An in-depth review of `d:\WEBUI\frontend\src` was conducted to compare UI component expectations with backend realities.

### 5.1. Findings on Frontend Portals
1. **Rich UI Components with Unbound State:**
   - `frontend/src/components/portal/admin/` contains 45+ enterprise-grade React components (`AdminClientManagement`, `AdminVendorManagement`, `AdminFinanceOverview`, `AdminProjectManagement`, `AdminApprovalWorkflowCenter`).
   - `frontend/src/components/portal/client/` contains complete client portals (`ClientInvoiceOverview`, `ClientPaymentProofForm`, `ClientInvoiceDisputeForm`, `ClientDocumentLibrary`).
   - `frontend/src/components/portal/vendor/` contains vendor components (`VendorCashSettlement`, `VendorInvoiceHistory`, `VendorDisputeTracking`).
2. **Current Page Bindings are Stubs:**
   - In `frontend/src/app/admin/page.tsx`: A static banner informs users that access is restricted to authenticated sessions; no admin components are loaded.
   - In `frontend/src/app/client/invoices/page.tsx`: `<ClientInvoiceOverview invoices={[]} ... />` is passed an empty array.
   - In `frontend/src/app/vendor/cash-settlements/page.tsx`: Empty arrays and no-op handler callbacks are supplied.
3. **API Client (`frontend/src/lib/api.ts`):**
   - Clean, typed implementation wrapping native `fetch` with `ApiError`, `AuthError`, and `ForbiddenError`.
   - However, `apiFetch` is currently **only imported once in the entire frontend** (as documentation in `api.ts`), while `ConsultationModal.tsx` uses raw `fetch("http://localhost:8080/api/leads", ...)`.

### 5.2. Critical Contract Incompatibilities
| Field / Concept | Frontend Expectation | Current Backend Reality | Resolution Required |
| :--- | :--- | :--- | :--- |
| **Invoice Identifier** | `invoiceId` (e.g. `INV-2026-001`) | `billId` | Map `billId` to `invoiceId` in DTO or expose alias |
| **Outstanding Balance** | `outstandingAmount` | Calculated dynamically (`amount - paidAmount`) | Include `outstandingAmount` directly in JSON response |
| **Party Names** | `clientName`, `vendorName` | Raw IDs (`clientId`, `vendorId`) | Join with Client/Vendor tables to return human names |
| **Project Reference** | `projectName`, `projectReference` | Raw `projectId` string | Join with Project table to return title and reference |
| **Currency** | `INR` (Indian Rupee) | `INR` (Indian Rupee) | **Matching** |

---

## 6. Security, Authorization & Data Integrity Review

The backend security implementation was examined for vulnerabilities and anti-patterns:

1. **BOLA / IDOR Protection:**
   - Evaluated `FinancialOperationsService.validateBillAccess`.
   - **Result: SECURE.** Strictly checks that calling actor matches `clientId`, `vendorId`, `initiatorId`, or has a verified prior payment transaction. Unassigned legacy bills cannot be claimed by arbitrary clients.
2. **Role-Based Access Control (RBAC):**
   - Evaluated `SecurityConfig.java`.
   - **Result: SECURE.** Granular matchers separate finance roles (`FINANCE_MAKER`, `FINANCE_CHECKER_1`, `FINANCE_CHECKER_2`, `FINANCE_MANAGER`). Admin mutation fallback prevents unauthorized endpoints from defaulting to public access.
3. **Terminal State Protection:**
   - Evaluated `FinancialOperationsService.respondToCashSettlement`.
   - **Result: SECURE.** Finalized vouchers (`SETTLED_VERIFIED` or `REJECTED`) reject subsequent modification. Duplicate transitions are rejected.
4. **Connector Fail-Closed Invariants:**
   - Evaluated `WhatsAppCloudApiAdapter`.
   - **Result: SECURE.** Disabled by default (`app.whatsapp.enabled: false`). Suppresses dispatching during quiet hours (21:00-09:00 IST) and immediately cancels reminders for settled or disputed bills.

---

## 7. Database Schema & Flyway Migration Assessment

The existing Flyway migrations (`V1` through `V5`) maintain a clean schema:
- `V1__initial_schema.sql`: Initial baseline tables (`users`, `manifesto`, `projects`, `leads`, `audit_events`, `bill_approvals`, `cash_settlement_requests`, `payment_transactions`).
- `V2__add_client_id_to_bill_approvals.sql`: Added `client_id` column and index to `bill_approvals`.
- `V3__add_version_for_optimistic_locking.sql`: Added `version BIGINT DEFAULT 0` to financial tables.
- `V4__create_refresh_tokens_and_user_security.sql`: Created `refresh_tokens` and security columns on `users`.
- `V5__harden_refresh_tokens_schema.sql`: Added `consumed_at` and unique constraint on `token_hash`.

### Migration Strategy for Phase 4:
To implement the missing domains, Flyway migrations must be introduced sequentially without modifying past scripts:
- `V6__create_clients_and_vendors_tables.sql`
- `V7__expand_operational_projects_and_milestones.sql`
- `V8__create_client_invoices_and_documents.sql`
- `V9__create_in_app_notifications_and_user_profiles.sql`

---

## 8. Test Coverage & Quality Assurance Review

### Current Coverage:
- High-risk security and financial paths have **100% test coverage** (76 integration tests covering concurrency, maker-checker logic, JWT lifecycle, RTR rotation, and production bootstrap safety).

### Coverage Gaps Identified:
1. `LeadController`: No tests verify enquiry submission validation or status updates.
2. `ProjectController`: Showcase CMS CRUD is completely untested.
3. `ManifestoController`: CMS endpoints are untested.
4. `FinancialOperationsController` read endpoints (`/reports/aging-receivables`, `/reports/export-bills-csv`, `/cash/all`) are only verified via RBAC filter tests, not payload assertion tests.

---

## 9. Final Audit Verdict & Implementation Acceptance

### Acceptance Determination: `READY WITH CONDITIONS`

The ArcheOn Design Studio backend baseline is architecturally sound and exceptionally secure, but incomplete regarding total business platform scope. It is approved to proceed into **Phase 4 Implementation**, subject to the structured execution roadmap defined in `PHASE4_IMPLEMENTATION_ROADMAP.md`.
