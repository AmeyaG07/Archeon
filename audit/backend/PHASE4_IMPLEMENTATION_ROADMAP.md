# ArcheOn Design Studio — Phase 4 Implementation Roadmap

**Document Reference:** `audit/backend/PHASE4_IMPLEMENTATION_ROADMAP.md`  
**Target Baseline:** `backend/phase3.2-production-hardening` (`de8702e`)  
**Target Implementation Branch:** `backend/phase4-api-implementation`  
**Generated On:** 2026-11-18  
**Author:** Senior Backend Architect & Security Engineer  

---

## 1. Executive Summary & Objectives

The Phase 4 Audit (`PHASE4_API_COMPLETENESS_AUDIT.md`) established that while ArcheOn Design Studio possesses an exceptionally hardened core for financial transactions, maker-checker approvals, and session lifecycle security, **5 critical business domains are missing** and **5 are partially implemented**.

The objective of Phase 4 Implementation is to expand the backend from its current financial/auth core into a comprehensive, production-grade business platform supporting:
1. **Client & Vendor Management** (Onboarding, Profiles, Portal Access, RBAC).
2. **Operational Project & Milestone Workspaces** (Phases, Deliverables, Budgets, Progress).
3. **Client-Facing GST Tax Invoicing** (CGST/SGST/IGST, Line Items, PDF generation).
4. **Document Management System (DMS)** (Drawings, Contracts, Proofs, SHA-256 integrity).
5. **In-App Notification Center** (Activity feeds, unread badges, multi-channel alerts).
6. **Executive & Portal Dashboards** (Aggregate metrics, receivables/payables ageing, activity streams).
7. **Studio-wide Audit Query Center** (Global audit inspection with filtering).

All new implementations must adhere to the accepted Phase 2, Phase 3, Phase 3.1, and Phase 3.2 security invariants.

---

## 2. Invariant Protection & Architectural Rules

Any code committed during Phase 4 must strictly observe these non-negotiable rules:

1. **Preserve Maker-Checker Separation:**
   - Transaction initiator can never approve their own bill or invoice (`Maker != Checker`).
   - High-value transactions (`>= ₹1,00,000`) require two distinct finance approvals (`Approver2 != Approver1 != Maker`).
2. **Preserve Concurrency Protections:**
   - Every mutable persistent entity must maintain a `@Version` optimistic locking column.
   - Concurrent modification exceptions must map cleanly to HTTP 409 Conflict.
3. **Preserve Refresh Token Rotation (RTR) Invariants:**
   - Refresh tokens must remain hash-only in the database.
   - Single-use consumption must remain atomic (`consumeTokenIfUnused`).
   - Token reuse must trigger immediate session family invalidation.
4. **Preserve BOLA / IDOR Protections:**
   - Client and vendor principals must never access or mutate records belonging to other counterparties.
   - Unassigned records must reject unauthorized binding attempts.
5. **Fail-Closed External Connectors:**
   - WhatsApp Cloud API and external gateways must default to `enabled: false`.
   - Never mark transactions `PAID` from unverified screenshots or webhooks.
6. **No Phantom UI / No Mock Fallbacks:**
   - All frontend components must bind to real backend endpoints; mock data fallbacks must be eliminated once endpoints are deployed.

---

## 3. Staged Implementation Phases

```
+---------------------------------------------------------------------------------+
|                              PHASE 4 EXECUTION ROADMAP                           |
+---------------------------------------------------------------------------------+
|  Phase 4.1: Database Schema Expansion & Core Domain Entities (V6, V7, V8, V9)    |
|       |                                                                         |
|  Phase 4.2: Client, Vendor & Operational Project APIs                           |
|       |                                                                         |
|  Phase 4.3: Client GST Tax Invoicing, Line Items & Global Audit Viewer           |
|       |                                                                         |
|  Phase 4.4: Document Management (DMS) & In-App Notification Center              |
|       |                                                                         |
|  Phase 4.5: Dashboard Aggregation, Frontend Contract Binding & E2E Test Suite   |
+---------------------------------------------------------------------------------+
```

---

### Phase 4.1: Database Schema Expansion & Core Domain Entities

**Objective:** Lay down persistent relational foundations without altering existing tables or breaking existing unit tests.

#### 1. Flyway Migrations:
- **`V6__create_clients_and_vendors_tables.sql`:**
  - Create table `clients` (`id UUID PRIMARY KEY`, `reference VARCHAR UNIQUE`, `full_name VARCHAR`, `email VARCHAR`, `phone VARCHAR`, `organization VARCHAR`, `location VARCHAR`, `status VARCHAR`, `portal_access VARCHAR`, `created_at TIMESTAMP`, `updated_at TIMESTAMP`, `version BIGINT DEFAULT 0`).
  - Create table `vendors` (`id UUID PRIMARY KEY`, `reference VARCHAR UNIQUE`, `business_name VARCHAR`, `contact_person VARCHAR`, `email VARCHAR`, `phone VARCHAR`, `category VARCHAR`, `location VARCHAR`, `gstin VARCHAR`, `pan VARCHAR`, `bank_details_json TEXT`, `status VARCHAR`, `portal_access VARCHAR`, `created_at TIMESTAMP`, `updated_at TIMESTAMP`, `version BIGINT DEFAULT 0`).
  - Create unique indexes on `clients(email)`, `clients(reference)`, `vendors(reference)`, `vendors(gstin)`.
- **`V7__expand_operational_projects_and_milestones.sql`:**
  - Alter table `projects` to add operational columns: `client_id UUID REFERENCES clients(id)`, `project_type VARCHAR`, `status VARCHAR DEFAULT 'Planning'`, `progress_percentage INTEGER DEFAULT 0`, `site_address VARCHAR`, `contract_value NUMERIC(15,2)`, `budget_allocated NUMERIC(15,2)`, `estimated_start_date DATE`, `estimated_completion_date DATE`, `version BIGINT DEFAULT 0`.
  - Create table `project_milestones` (`id UUID PRIMARY KEY`, `project_id VARCHAR REFERENCES projects(id)`, `title VARCHAR NOT NULL`, `description TEXT`, `phase VARCHAR NOT NULL`, `sequence_order INTEGER NOT NULL`, `target_date DATE`, `completion_date DATE`, `status VARCHAR DEFAULT 'Pending'`, `billed_percentage INTEGER DEFAULT 0`, `created_at TIMESTAMP`, `version BIGINT DEFAULT 0`).
  - Create table `project_vendor_assignments` (`project_id VARCHAR REFERENCES projects(id)`, `vendor_id UUID REFERENCES vendors(id)`, `assigned_at TIMESTAMP`, `role_description VARCHAR`, PRIMARY KEY(`project_id`, `vendor_id`)).
- **`V8__create_client_invoices_and_documents.sql`:**
  - Create table `invoices` (`id UUID PRIMARY KEY`, `invoice_number VARCHAR NOT NULL UNIQUE`, `client_id UUID REFERENCES clients(id)`, `project_id VARCHAR REFERENCES projects(id)`, `issue_date DATE NOT NULL`, `due_date DATE NOT NULL`, `subtotal NUMERIC(15,2) NOT NULL`, `cgst_rate NUMERIC(5,2) DEFAULT 9.00`, `cgst_amount NUMERIC(15,2) DEFAULT 0.00`, `sgst_rate NUMERIC(5,2) DEFAULT 9.00`, `sgst_amount NUMERIC(15,2) DEFAULT 0.00`, `igst_rate NUMERIC(5,2) DEFAULT 0.00`, `igst_amount NUMERIC(15,2) DEFAULT 0.00`, `total_amount NUMERIC(15,2) NOT NULL`, `paid_amount NUMERIC(15,2) DEFAULT 0.00`, `status VARCHAR NOT NULL DEFAULT 'ISSUED'`, `notes TEXT`, `created_at TIMESTAMP`, `updated_at TIMESTAMP`, `version BIGINT DEFAULT 0`).
  - Create table `invoice_items` (`id UUID PRIMARY KEY`, `invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE`, `description VARCHAR NOT NULL`, `sac_code VARCHAR DEFAULT '998321'`, `quantity NUMERIC(10,2) NOT NULL DEFAULT 1`, `unit_rate NUMERIC(15,2) NOT NULL`, `taxable_amount NUMERIC(15,2) NOT NULL`, `sequence_order INTEGER NOT NULL`).
  - Create table `documents` (`id UUID PRIMARY KEY`, `project_id VARCHAR REFERENCES projects(id)`, `client_id UUID REFERENCES clients(id)`, `vendor_id UUID REFERENCES vendors(id)`, `file_name VARCHAR NOT NULL`, `file_type VARCHAR NOT NULL`, `category VARCHAR NOT NULL`, `file_size_bytes BIGINT NOT NULL`, `storage_path VARCHAR NOT NULL`, `sha256_digest VARCHAR(64) NOT NULL`, `access_level VARCHAR NOT NULL DEFAULT 'INTERNAL_ONLY'`, `uploaded_by VARCHAR NOT NULL`, `created_at TIMESTAMP`).
- **`V9__create_in_app_notifications_and_user_profiles.sql`:**
  - Create table `notifications` (`id UUID PRIMARY KEY`, `recipient_username VARCHAR NOT NULL`, `title VARCHAR NOT NULL`, `message TEXT NOT NULL`, `category VARCHAR NOT NULL`, `read_status BOOLEAN NOT NULL DEFAULT false`, `action_url VARCHAR`, `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).
  - Add foreign key link from `users` to `clients` or `vendors` (`client_id UUID`, `vendor_id UUID`).

#### 2. JPA Entities & Repositories:
- Implement `ClientEntity`, `VendorEntity`, `ProjectMilestoneEntity`, `InvoiceEntity`, `InvoiceItemEntity`, `DocumentEntity`, `NotificationEntity`.
- Create corresponding Spring Data JPA Repositories with indexed lookup queries.

---

### Phase 4.2: Client, Vendor & Operational Project APIs

**Objective:** Expose management endpoints for clients, vendors, and multi-phase architectural projects.

#### 1. Client Management Controller (`ClientController` / `/api/clients`):
- `GET /api/clients`: Paginated list of clients with filtering (`status`, `search`).
- `GET /api/clients/{id}`: Detailed client profile including linked active projects and billing summary.
- `POST /api/clients`: Create new client profile (enforces unique email and reference).
- `PUT /api/clients/{id}`: Update client profile with `@Version` optimistic locking.
- `PATCH /api/clients/{id}/status`: Activate, deactivate, or suspend client account.
- `POST /api/clients/{id}/invite`: Issue cryptographically secure onboarding invitation for client portal.

#### 2. Vendor Management Controller (`VendorController` / `/api/vendors`):
- `GET /api/vendors`: Paginated list of vendors with filtering (`category`, `status`, `search`).
- `GET /api/vendors/{id}`: Detailed vendor profile with linked contracts, cash settlements, and submitted invoices.
- `POST /api/vendors`: Register new trade contractor/vendor.
- `PUT /api/vendors/{id}`: Update vendor profile and bank details.
- `PATCH /api/vendors/{id}/status`: Update vendor status.
- `POST /api/vendors/{id}/invite`: Issue vendor onboarding invitation.

#### 3. Operational Project & Milestone Controller (`ProjectManagementController` / `/api/projects`):
- `GET /api/projects/operational`: List projects with architectural domain fields (`clientName`, `contractValue`, `progressPercentage`).
- `GET /api/projects/{id}/milestones`: Retrieve project phases and inspection milestones.
- `POST /api/projects/{id}/milestones`: Add new project milestone.
- `PATCH /api/milestones/{id}/status`: Update milestone status (`In Progress`, `Under Review`, `Approved`).

---

### Phase 4.3: Client GST Tax Invoicing, Line Items & Global Audit Viewer

**Objective:** Implement statutory-compliant client invoicing and studio-wide audit trail inspection.

#### 1. Client Invoicing Controller (`InvoiceController` / `/api/invoices`):
- `POST /api/invoices`: Issue itemized GST invoice to a client for architectural services (calculates CGST/SGST/IGST automatically based on studio GSTIN state vs client state).
- `GET /api/invoices`: List issued invoices with filter by client, project, or payment status.
- `GET /api/invoices/{id}`: Retrieve invoice details with line items and payment reconciliation history.
- `GET /api/invoices/{id}/pdf`: Generate printable PDF invoice compliant with Indian GST rules (SAC 998321, GSTIN, PAN, reverse charge declaration).

#### 2. Global Audit Query Controller (`AuditController` / `/api/admin/audit`):
- `GET /api/admin/audit`: Administrative query endpoint with filters:
  - `entityName` (`BillApproval`, `CashSettlement`, `PaymentTransaction`, `Client`, `Vendor`, `User`, `Invoice`)
  - `actorId` (Principal username)
  - `action` (`BILL_INITIATED`, `PRIMARY_APPROVAL_GRANTED`, `PAYMENT_VERIFIED`, etc.)
  - `startDate` and `endDate`
  - Paginated result (`Page<AuditEventEntity>`).

---

### Phase 4.4: Document Management (DMS) & In-App Notification Center

**Objective:** Provide secure document handling with cryptographic integrity digests and real-time user notification feeds.

#### 1. Document Management Service & Controller (`DocumentController` / `/api/documents`):
- `POST /api/documents/upload`: Multipart upload with automated SHA-256 digest computation, file size verification (max 25MB), and virus/MIME screening.
- `GET /api/documents/{id}/download`: Secure streaming download checking principal authorization and access level (`CLIENT_VISIBLE`, `VENDOR_VISIBLE`, `INTERNAL_ONLY`).
- `GET /api/documents/project/{projectId}`: List drawings, contracts, and revisions for a project.

#### 2. In-App Notification Service & Controller (`NotificationController` / `/api/notifications`):
- `GET /api/notifications`: Retrieve calling user's notifications (supports `unreadOnly=true`).
- `PATCH /api/notifications/{id}/read`: Mark notification as read.
- `POST /api/notifications/mark-all-read`: Mark all notifications as read for current user.
- Integration: Trigger in-app notifications automatically on bill approval transitions, cash settlement responses, payment verifications, and dispute filings.

---

### Phase 4.5: Dashboard Aggregation, Frontend Contract Binding & E2E Test Suite

**Objective:** Expose unified dashboard APIs, bind frontend React components via `apiFetch`, and implement regression test coverage.

#### 1. Dashboard Aggregation Controller (`DashboardController` / `/api/dashboards`):
- `GET /api/admin/dashboard`:
  - `activeProjects`, `completedProjects`, `totalClients`, `activeVendors`, `newEnquiries`
  - `pendingApprovals`, `outstandingReceivables`, `overdueReceivables`, `pendingInvoices`
  - `recentActivities` (latest 10 audit events formatted for dashboard).
- `GET /api/client/dashboard`:
  - Client-specific active project summaries, outstanding invoices, recent drawings.
- `GET /api/vendor/dashboard`:
  - Vendor-specific pending cash vouchers, active purchase orders, approved bills.

#### 2. Frontend Contract Normalization & API Client Binding:
- Update `frontend/src/lib/api.ts` with standardized response handlers.
- Bind `AdminClientManagement.tsx`, `AdminVendorManagement.tsx`, `AdminFinanceOverview.tsx`, `AdminDashboardOverview.tsx` to live backend endpoints.
- Bind `ClientInvoiceOverview.tsx`, `ClientPaymentProofForm.tsx`, `ClientDocumentLibrary.tsx` to client portal endpoints.
- Bind `VendorCashSettlement.tsx`, `VendorInvoiceHistory.tsx` to vendor endpoints.

#### 3. Automated Test Suite Expansion:
- Implement unit and integration tests achieving >= 85% coverage on all new controllers and services.
- Verify zero regressions against the 76 accepted Phase 2, 3, 3.1, and 3.2 tests.

---

## 4. API Contract Normalization Matrix

To eliminate friction during frontend-backend binding, all Phase 4 endpoints will standardize on these JSON representations:

| Frontend Property | Backend JSON Property | Format / Type | Description |
| :--- | :--- | :--- | :--- |
| `id` / `invoiceId` | `invoiceId` / `id` | String (UUID or Code) | Primary identifier |
| `invoiceNumber` | `invoiceNumber` | String (e.g. `INV-2026-001`) | Human-readable tax invoice code |
| `totalAmount` | `totalAmount` | BigDecimal (2 decimals) | Total inclusive of GST |
| `paidAmount` | `paidAmount` | BigDecimal (2 decimals) | Reconciled verified payments |
| `outstandingAmount` | `outstandingAmount` | BigDecimal (2 decimals) | Calculated (`totalAmount - paidAmount`) |
| `currency` | `currency` | String (`INR`) | Fixed currency code |
| `status` | `status` | Enum String | Unified status lifecycle |
| `clientName` | `clientName` | String | Resolved human name of organization |
| `vendorName` | `vendorName` | String | Resolved trade business name |
| `projectName` | `projectName` | String | Resolved architectural project title |
| `createdAt` | `createdAt` | ISO-8601 String | E.g. `2026-11-18T10:30:00Z` |

---

## 5. Security & Invariant Checklist for Developers

Before any Phase 4 pull request or commit is merged, verify:
- [ ] Flyway migration script is idempotent (`IF NOT EXISTS`) and tested against clean PostgreSQL.
- [ ] Every persistent entity has `@Version private Long version;` for optimistic locking.
- [ ] Every mutation endpoint catches `OptimisticLockException` and returns HTTP 409 Conflict.
- [ ] All client and vendor endpoints verify caller ownership via `validateAccess(actorId)`.
- [ ] No unassigned record can be claimed without administrative assignment.
- [ ] Maker-checker rules are strictly preserved (`initiatorId != approverId`).
- [ ] Refresh token rotations remain atomic (`consumeTokenIfUnused`).
- [ ] In-app notifications do not expose sensitive financial wire bytes or credentials.
- [ ] All 76 baseline regression tests continue to pass.
- [ ] New unit and integration tests are added for every newly created controller and service.
