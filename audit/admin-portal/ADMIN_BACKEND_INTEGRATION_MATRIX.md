# ArcheOn Design Studio — Admin Portal Backend Integration Matrix
**Audit Date:** November 18, 2026  
**Auditor:** Senior Frontend Architect & Independent Code Auditor  
**Audit Scope:** Mapping of Admin Portal UI actions to local Spring Boot 3.4.3 backend endpoints and DTOs  
**Execution Mode:** STRICT READ-ONLY AUDIT  

---

## 1. Backend Architecture & Controller Inventory

An exhaustive inspection of the Spring Boot backend (`D:\WEBUI\backend\src\main\java\com\webui\backend`) reveals exactly **6 REST Controllers** and **8 JPA Repositories**:

1. **`AuthController` (`/api/auth`)**:
   - `POST /api/auth/login` (RequestBody: `LoginRequest { username, password }`, Response: `AuthResponse { token, username, role }`)
2. **`BillApprovalController` (`/api/approvals`)**:
   - `GET /api/approvals/config` (Returns studio legal metadata, high-value threshold ₹1,00,000, and approval policy)
   - `POST /api/approvals/initiate` (Initiates bill workflow)
   - `POST /api/approvals/{billId}/approve-primary` (First signature / checker 1)
   - `POST /api/approvals/{billId}/approve-secondary` (Second signature / checker 2 for high value)
   - `POST /api/approvals/{billId}/reject` (Rejection with reason)
   - `GET /api/approvals/all` (List all approvals)
   - `GET /api/approvals/{billId}` (Single approval status)
   - `GET /api/approvals/{billId}/audit` (Audit events trail for bill)
3. **`FinancialOperationsController` (`/api/finance`)**:
   - `POST /api/finance/payment-proof` (Submit payment receipt/UTR)
   - `POST /api/finance/verify-payment/{transactionId}` (Reconcile with bank statement)
   - `POST /api/finance/dispute` (Raise billing dispute)
   - `POST /api/finance/cash/initiate` (Initiate two-party physical cash settlement)
   - `POST /api/finance/cash/{ref}/respond` (Counterparty acknowledge/dispute cash)
   - `POST /api/finance/cash/{ref}/approve` (Studio finance manager final cash approval)
   - `GET /api/finance/cash/all` (List all cash settlements)
   - `GET /api/finance/transactions/{billId}` (List transactions for bill)
   - `GET /api/finance/reports/aging-receivables` (Calculates <30d, 30-60d, >60d aging buckets)
   - `GET /api/finance/reports/export-bills-csv` (CSV streaming with export audit timestamp)
4. **`LeadController` (`/api/leads`)**:
   - `POST /api/leads` (Public consultation form submission)
   - `GET /api/leads` (List all leads ordered by date)
   - `PATCH /api/leads/{id}/status` (Update lead status: Contacted, Converted, etc.)
5. **`ProjectController` (`/api/projects`)**:
   - `GET /api/projects` (List projects)
   - `GET /api/projects/{id}` (Get single project)
   - `POST /api/projects` (Create project)
   - `PUT /api/projects/{id}` (Update project)
   - `DELETE /api/projects/{id}` (Delete project)
6. **`ManifestoController` (`/api/manifesto`)**:
   - `GET /api/manifesto` (Get manifesto statement)
   - `PUT /api/manifesto` (Update manifesto)

---

## 2. Action-to-Endpoint Integration Matrix

The following table maps every major administrative action across the frontend components to backend endpoints.

### Integration Classifications:
- **VERIFIED API:** Complete backend endpoint, DTO contract, and database persistence verified.
- **PARTIAL API:** Related backend functionality exists, but required frontend contract, fields, or parameters are incomplete.
- **NO API FOUND:** No supporting backend controller, entity, or endpoint exists in the codebase.
- **NEEDS CONFIRMATION:** Business rules or authorization requirements are unclear or provisional.

| Component | UI Action / Capability | Backend Endpoint | HTTP Method | Request / Response DTO | Classification | Notes & Gaps |
|---|---|---|---|---|---|---|
| `AdminDashboardPage` | Fetch Approval Policy Config | `/api/approvals/config` | `GET` | None / `Map<String, Object>` | **VERIFIED API** | Working |
| `AdminDashboardPage` | List All Bills & Approvals | `/api/approvals/all` | `GET` | None / `List<BillApprovalEntity>` | **VERIFIED API** | Working |
| `AdminDashboardPage` | Approve Primary (Checker 1) | `/api/approvals/{billId}/approve-primary` | `POST` | PathParam / `BillApprovalEntity` | **VERIFIED API** | Works, but unauthenticated |
| `AdminDashboardPage` | Approve Secondary (Checker 2) | `/api/approvals/{billId}/approve-secondary` | `POST` | PathParam / `BillApprovalEntity` | **VERIFIED API** | Works, but unauthenticated |
| `AdminDashboardPage` | Reject Bill Approval | `/api/approvals/{billId}/reject` | `POST` | `RejectRequest { reason }` | **VERIFIED API** | Works, but unauthenticated |
| `AdminDashboardPage` | List CRM Leads | `/api/leads` | `GET` | None / `List<LeadEntity>` | **VERIFIED API** | Working |
| `AdminDashboardPage` | List Cash Register Settlements | `/api/finance/cash/all` | `GET` | None / `List<CashSettlementEntity>` | **VERIFIED API** | Working |
| `AdminDashboardPage` | Approve Cash Settlement | `/api/finance/cash/{ref}/approve` | `POST` | PathParam / `CashSettlementEntity` | **VERIFIED API** | Working |
| `AdminDashboardPage` | Fetch Aging Receivables Report | `/api/finance/reports/aging-receivables` | `GET` | None / `AgingReceivablesDto` | **VERIFIED API** | Working |
| `AdminDashboardPage` | Export Bills CSV | `/api/finance/reports/export-bills-csv` | `GET` | None / `byte[] (text/csv)` | **VERIFIED API** | Working |
| `AdminDashboardPage` | Update Lead Status | `/api/leads/{id}/status` | `PATCH` | `Map<String, String> { status }` | **PARTIAL API** | Backend endpoint exists, but frontend page doesn't call it |
| `AdminLeadManagement` | List & Filter Leads | `/api/leads` | `GET` | None / `List<LeadEntity>` | **VERIFIED API** | Subcomponent is unmounted |
| `AdminLeadManagement` | Change Lead Status | `/api/leads/{id}/status` | `PATCH` | `Map<String, String> { status }` | **VERIFIED API** | Supported by backend |
| `AdminLeadManagement` | Assign Lead to Staff | `N/A` | `N/A` | `N/A` | **NO API FOUND** | No `assigneeId` field on `LeadEntity` |
| `AdminLeadManagement` | Schedule Follow-up Date | `N/A` | `N/A` | `N/A` | **NO API FOUND** | No `followUpDate` field on `LeadEntity` |
| `AdminCashSettlementManagement` | List Physical Cash Register | `/api/finance/cash/all` | `GET` | None / `List<CashSettlementEntity>` | **VERIFIED API** | Subcomponent is unmounted |
| `AdminCashSettlementManagement` | Finance Approve Cash Entry | `/api/finance/cash/{ref}/approve` | `POST` | PathParam / `CashSettlementEntity` | **VERIFIED API** | Subcomponent is unmounted |
| `AdminCashSettlementManagement` | Vendor Acknowledge Cash | `/api/finance/cash/{ref}/respond` | `POST` | `CashResponseRequest` | **VERIFIED API** | Subcomponent is unmounted |
| `AdminCashSettlementManagement` | Initiate Site Cash Voucher | `/api/finance/cash/initiate` | `POST` | `CashInitiateRequest` | **VERIFIED API** | Subcomponent is unmounted |
| `AdminApprovalWorkflowCenter` | Maker-Checker Bill Matrix | `/api/approvals/all` | `GET` | None / `List<BillApprovalEntity>` | **PARTIAL API** | Expects role changes, financial adjustments not supported |
| `AdminFinanceOverview` | Revenue & Invoices Summary | `/api/finance/reports/aging-receivables` | `GET` | None / DTO | **PARTIAL API** | Full P&L/Cashflow endpoints do not exist |
| `AdminInvoiceApprovalWorkspace`| Review Invoice Line Items | `/api/approvals/{id}` | `GET` | None / `BillApprovalEntity` | **PARTIAL API** | BillApproval lacks line item breakdown |
| `AdminInvoiceManagement` | Create / Manage Bills | `/api/approvals/initiate` | `POST` | `InitiateRequest` | **PARTIAL API** | Basic initiation only, no invoice PDF generation |
| `AdminAuditLogViewer` | View Global System Audits | `/api/approvals/{billId}/audit` | `GET` | None / `List<AuditEventEntity>` | **PARTIAL API** | Backend only provides bill-scoped audits; no global audit endpoint |
| `AdminProjectManagement` | CRUD Architectural Projects | `/api/projects` | `GET`, `POST`, `PUT`, `DELETE` | `ProjectEntity` | **VERIFIED API** | Backend CRUD exists, but component is unmounted |
| `AdminProjectDetailWorkspace` | Project Workstages & Milestones | `N/A` | `N/A` | `N/A` | **PARTIAL API** | `ProjectEntity` lacks milestone / phase entities |
| `AdminClientManagement` | Client Accounts & Portals | `N/A` | `N/A` | `N/A` | **NO API FOUND** | No `ClientController` or `ClientEntity` |
| `AdminVendorManagement` | Vendor Contracts & Bank Info | `N/A` | `N/A` | `N/A` | **NO API FOUND** | No `VendorController` or `VendorEntity` |
| `AdminDocumentManagement` | Blueprints, CAD, Contracts | `N/A` | `N/A` | `N/A` | **NO API FOUND** | No Document entity or storage adapter |
| `AdminNotificationOperations` | WhatsApp Dispatch & Reminders | `N/A` (Internal Service) | `N/A` | `WhatsAppNotificationService` | **PARTIAL API** | Backend service exists, but lacks REST endpoints for admin triggering |
| `AdminNotificationQueueMonitor` | Live Outbox / Dead Letter Queue | `N/A` | `N/A` | `N/A` | **NO API FOUND** | No queue persistence or DLQ entity |
| `AdminNotificationSuppressionRulesCenter` | Quiet Hours & Opt-Out Rules | `N/A` | `N/A` | `N/A` | **PARTIAL API** | Hardcoded in `application.properties`; no REST config endpoints |
| `AdminUserRoleManagement` | RBAC & Staff User Accounts | `N/A` | `N/A` | `N/A` | **NO API FOUND** | Only hardcoded seed users exist in `DataInitializer.java` |
| `AdminApiKeyManagementCenter` | API Keys & Secret Tokens | `N/A` | `N/A` | `N/A` | **NO API FOUND** | No API Key entity or generation logic |
| `AdminApiRateLimitMonitor` | Rate Limit Tracking | `N/A` | `N/A` | `N/A` | **NO API FOUND** | No rate-limiting interceptor or metrics |
| `AdminDataRetentionCenter` | DPDP Data Retention Policies | `N/A` | `N/A` | `N/A` | **NO API FOUND** | No data retention scheduler |
| `AdminBackupRecoveryCenter` | Database Snapshots & Recovery | `N/A` | `N/A` | `N/A` | **NO API FOUND** | No backup API or script integration |
| `AdminPlatformHealthMonitor` | JVM / System Health | `/actuator/health` | `GET` | Spring Boot Actuator | **NEEDS CONFIRMATION** | Actuator not explicitly configured in `SecurityConfig` |

---

## 3. Critical Backend Capability Gaps

1. **Missing Core Business Domains:**  
   The backend completely lacks domain models, repositories, and controllers for:
   - **Clients** (No `ClientEntity`, no client portal user provisioning).
   - **Vendors** (No `VendorEntity`, no bank account validation, no GSTIN verification).
   - **Documents** (No blueprint / contract metadata, no S3 / local disk binary storage).
2. **Missing Security & Identity Administration:**  
   There are no endpoints to create users, assign roles, reset credentials, review active sessions, or rotate API keys. Only static seed accounts (`admin`, `client`, `vendor`) exist via `DataInitializer.java`.
3. **Notification Service REST Exposure:**  
   The backend contains an implementation of WhatsApp notification logic (`WhatsAppCloudApiAdapter.java`) with quiet hours and opt-out suppression, but exposes **zero REST endpoints** for the frontend to inspect delivery logs, trigger ad-hoc reminders, or manage templates.
