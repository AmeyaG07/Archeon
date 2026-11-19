# ARCHÉON — SPRINT 5.4.2
## Admin Portal Acceptance & Functional Audit Report

**Project:** ArcheOn Design Studio  
**Audit Target:** Admin Portal (11 Pages & Supporting Backend Services)  
**Target Role:** `ROLE_ADMIN` (`admin`)  
**Repository:** `D:\WEBUI`  
**Date:** 2026-11-19  
**Execution Mode:** Controlled Live Staging Testing (Read-Only)

---

### 1. Executive Summary

The Admin Portal was subjected to live testing logged in as `ROLE_ADMIN` across all 11 admin routes. While core administrative functionality (Audit Logs, Client & Vendor directory listing, GST Invoicing with PDF generation, Financial Reports, and Settings) operates robustly, **three critical API contract mismatches** prevent full end-to-end functionality in the Admin Overview (`/admin`), the Approvals Queue (`/admin/approvals`), and the Invitation Dispatch buttons on the Client/Vendor directory pages.

---

### 2. Page-by-Page Audit Findings

#### 2.1 `/admin` — Studio Executive Dashboard
- **Route:** [frontend/src/app/admin/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/page.tsx)
- **Component:** [AdminDashboardOverview.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminDashboardOverview.tsx)
- **Live Test Results:**
  - `GET /api/dashboards/admin` -> **HTTP 200 OK**. Metrics returned: total active projects, receivables, pending bill counts, and activity stream.
  - `GET /api/projects/operational` -> **HTTP 404 NOT FOUND**.
    - *Issue:* Frontend requests `/api/projects/operational` (line 35), but the backend controller [OperationalProjectController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/OperationalProjectController.java) is mapped to `@RequestMapping("/api/operational-projects")`.
    - *Impact:* The dashboard catches and swallows the error, causing the active projects section to display empty.
  - `GET /api/approvals` -> **HTTP 401 UNAUTHORIZED**.
    - *Issue:* Frontend requests `/api/approvals` (line 63), but the backend controller [BillApprovalController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/BillApprovalController.java) defines `@GetMapping("/all")`, meaning the valid endpoint is `/api/approvals/all`.
    - *Impact:* Unmapped route triggers Spring Security's error handler returning 401, swallowed by the page fallback, leaving the pending approvals widget empty.
- **Status:** **PARTIALLY WORKING (Tolerant Fallbacks Active)**

---

#### 2.2 `/admin/approvals` — Maker-Checker Invoicing & Bill Approvals
- **Route:** [frontend/src/app/admin/approvals/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/approvals/page.tsx)
- **Component:** [AdminInvoiceApprovalWorkspace.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminInvoiceApprovalWorkspace.tsx)
- **Live Test Results:**
  - `GET /api/approvals` -> **HTTP 401 UNAUTHORIZED**.
    - *Root Cause:* [AdminApprovalsPage](file:///D:/WEBUI/frontend/src/app/admin/approvals/page.tsx#L29) calls `apiFetch("/api/approvals")`. Because no handler exists for `/api/approvals` (only `/api/approvals/all`), Spring Boot forwards to `/error`. Spring Security intercepts this as unauthenticated and emits HTTP 401.
    - *Critical Side Effect:* In [frontend/src/lib/api.ts](file:///D:/WEBUI/frontend/src/lib/api.ts#L181-L184), any 401 automatically triggers `clearAuthSession()`, wiping the admin's `localStorage` credentials and redirecting them to `/login`.
  - `GET /api/approvals/all` -> **HTTP 200 OK** (Verified via direct API call). Returns all 3 seeded bill approvals (`BILL-2026-081`, `BILL-2026-094`, `BILL-2026-102`).
  - `GET /api/approvals/config` -> **HTTP 200 OK**. Returns statutory legal entity details, GSTIN, and maker-checker threshold (`₹1,00,000`).
  - `POST /api/approvals/{billId}/approve-primary` -> **HTTP 200 OK** (Verified for Admin).
  - `POST /api/approvals/{billId}/approve-secondary` -> **HTTP 200 OK** (Verified for Admin).
  - `POST /api/approvals/{billId}/reject` -> **HTTP 200 OK** (Verified for Admin).
- **Status:** **BLOCKED BY CONTRACT MISMATCH** (Requires changing frontend path to `/api/approvals/all`).

---

#### 2.3 `/admin/audit-logs` — Immutable Audit Center
- **Route:** [frontend/src/app/admin/audit-logs/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/audit-logs/page.tsx)
- **Component:** [AdminAuditLogViewer.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminAuditLogViewer.tsx)
- **Live Test Results:**
  - `GET /api/admin/audit?page=0&size=30` -> **HTTP 200 OK**.
  - Returned paginated audit events with timestamp, actor, entity name, action, and changes JSON.
  - Sorting, event filtering by entity type, and pagination controls work cleanly.
- **Status:** **FULLY OPERATIONAL**

---

#### 2.4 `/admin/cash-settlements` — Two-Party Cash Register
- **Route:** [frontend/src/app/admin/cash-settlements/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/cash-settlements/page.tsx)
- **Component:** [AdminCashSettlementsWorkspace.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminCashSettlementsWorkspace.tsx)
- **Live Test Results:**
  - `GET /api/finance/cash/all` -> **HTTP 200 OK**. Returns seeded cash voucher `CSH-SETTLE-409`.
  - `POST /api/finance/cash/{ref}/respond` -> **HTTP 200 OK**. Counterparty acknowledgement works.
  - `POST /api/finance/cash/{ref}/approve` -> **HTTP 200 OK**. Finance manager / Admin approval works.
- **Status:** **FULLY OPERATIONAL**

---

#### 2.5 `/admin/clients` — Client Directory & Onboarding
- **Route:** [frontend/src/app/admin/clients/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/clients/page.tsx)
- **Component:** [AdminClientManagement.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminClientManagement.tsx)
- **Live Test Results:**
  - `GET /api/clients` -> **HTTP 200 OK**. Correctly lists all registered client organizations.
  - `POST /api/clients` -> **HTTP 201 CREATED**. Creates client organization when supplied with required `fullName`, `email`, and `organization`.
  - **Invite Action Failure:**
    - [frontend/src/app/admin/clients/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/clients/page.tsx#L70-L77) defines:
      ```ts
      await apiFetch(`/api/invitations/client/${clientId}`, { method: "POST" })
        .catch(() => apiFetch("/api/invitations/send", { method: "POST", body: { targetId: clientId, type: "CLIENT" } }));
      ```
    - Both `/api/invitations/client/${clientId}` and `/api/invitations/send` return **HTTP 404 / 401**.
    - The actual backend endpoints implemented in [ClientController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/ClientController.java#L97) and [InvitationController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/InvitationController.java#L47) are:
      - `POST /api/clients/{id}/invite`
      - `POST /api/invitations` (with `InviteUserRequest`)
- **Status:** **PARTIALLY OPERATIONAL (Listing works, Direct Invitation button broken)**

---

#### 2.6 `/admin/vendors` — Vendor Directory & Onboarding
- **Route:** [frontend/src/app/admin/vendors/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/vendors/page.tsx)
- **Component:** [AdminVendorManagement.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminVendorManagement.tsx)
- **Live Test Results:**
  - `GET /api/vendors` -> **HTTP 200 OK**. Lists all trade vendors.
  - `POST /api/vendors` -> **HTTP 201 CREATED**. Creates vendor entity with statutory GSTIN, PAN, and category.
  - **Invite Action Failure:**
    - Same contract mismatch as clients: calls `/api/invitations/vendor/${vendorId}` and fallback `/api/invitations/send` instead of the actual `POST /api/vendors/{id}/invite` or `POST /api/invitations`.
- **Status:** **PARTIALLY OPERATIONAL (Listing works, Direct Invitation button broken)**

---

#### 2.7 `/admin/invoices` — Client Statutory GST Invoicing
- **Route:** [frontend/src/app/admin/invoices/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/invoices/page.tsx)
- **Component:** [AdminInvoicingWorkspace.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminInvoicingWorkspace.tsx)
- **Live Test Results:**
  - `GET /api/invoices?size=50` -> **HTTP 200 OK**. Returned seeded invoices with SAC 998321 tax breakdown.
  - `POST /api/invoices` -> **HTTP 201 CREATED**. Creates tax invoice with automated CGST/SGST (intra-state) or IGST (inter-state) calculation.
  - `GET /api/invoices/{id}/pdf` -> **HTTP 200 OK** (`Content-Type: application/pdf`). Binary PDF stream verified.
- **Status:** **FULLY OPERATIONAL**

---

#### 2.8 `/admin/finance-reports` — Financial Reporting & Aging
- **Route:** [frontend/src/app/admin/finance-reports/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/finance-reports/page.tsx)
- **Component:** [AdminFinanceReportsWorkspace.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminFinanceReportsWorkspace.tsx)
- **Live Test Results:**
  - `GET /api/dashboards/admin` -> **HTTP 200 OK**.
  - `GET /api/finance/reports/aging-receivables` -> **HTTP 200 OK**. Returns 0–30, 31–60, 61–90, 90+ day receivable buckets.
  - `GET /api/finance/reports/export-bills-csv` -> **HTTP 200 OK** (`Content-Type: text/csv`).
- **Status:** **FULLY OPERATIONAL**

---

#### 2.9 `/admin/leads` — Studio Inquiries & Pipeline
- **Route:** [frontend/src/app/admin/leads/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/leads/page.tsx)
- **Component:** [AdminLeadManagement.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminLeadManagement.tsx)
- **Live Test Results:**
  - `GET /api/leads` -> **HTTP 200 OK**.
  - `PATCH /api/leads/{id}/status` -> **HTTP 200 OK**. Lead status transition (`NEW` -> `CONTACTED` -> `CONVERTED`) functions correctly.
- **Status:** **FULLY OPERATIONAL**

---

#### 2.10 `/admin/projects` — Operational Projects Execution
- **Route:** [frontend/src/app/admin/projects/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/projects/page.tsx)
- **Component:** [AdminProjectManagement.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminProjectManagement.tsx)
- **Live Test Results:**
  - `GET /api/operational-projects` -> **HTTP 200 OK**.
  - `POST /api/operational-projects` -> **HTTP 201 CREATED**. Full project lifecycle management (phases, milestones, tasks) verified.
- **Status:** **FULLY OPERATIONAL**

---

#### 2.11 `/admin/settings` — System Administration
- **Route:** [frontend/src/app/admin/settings/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/settings/page.tsx)
- **Component:** [AdminSettingsWorkspace.tsx](file:///D:/WEBUI/frontend/src/components/portal/admin/AdminSettingsWorkspace.tsx)
- **Live Test Results:**
  - `GET /api/users/me` -> **HTTP 200 OK**.
  - `GET /api/users` -> **HTTP 200 OK**. Lists 31 platform users across admin, finance, client, and vendor roles.
- **Status:** **FULLY OPERATIONAL**

---

### 3. Summary of Admin Findings & Remediation Requirements

| Finding ID | Severity | Affected Page | Description | Recommended Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **ADM-01** | High | `/admin/approvals` | Calls `/api/approvals` instead of `/api/approvals/all`, resulting in 401 error and session termination. | Update frontend to call `/api/approvals/all` or add `@GetMapping` alias on root in `BillApprovalController`. |
| **ADM-02** | Medium | `/admin` | Calls `/api/projects/operational` instead of `/api/operational-projects`. | Update frontend to request `/api/operational-projects`. |
| **ADM-03** | Medium | `/admin/clients` | "Invite" button targets `/api/invitations/client/${id}` and `/api/invitations/send`. | Update handler to invoke `POST /api/clients/${id}/invite`. |
| **ADM-04** | Medium | `/admin/vendors` | "Invite" button targets `/api/invitations/vendor/${id}` and `/api/invitations/send`. | Update handler to invoke `POST /api/vendors/${id}/invite`. |
