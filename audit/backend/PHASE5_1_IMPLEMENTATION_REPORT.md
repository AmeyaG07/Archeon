# Phase 5.1 — Client GST Invoicing, In-App Notifications & Dashboards Implementation Report

**Project:** ArcheOn Design Studio  
**Role:** Senior Java Backend Engineer & Application Security Architect  
**Phase:** 5.1 (Sprint 5.1)  
**Scope:** Client GST Tax Invoicing (SAC 998321), Line Items, PDF Generation, In-App Notification Center, Unified Aggregation Dashboards, and Global Audit Center  
**Working Branch:** `backend/phase5.1-invoicing-notifications-dashboards`  
**Baseline Branch:** `backend/phase4.4.1.1-sensitive-data-audit-remediation`  
**Baseline HEAD Commit:** `087f3911f68868a32bcd359e4b6336acc43071d8` (`087f391`)  
**Code Remediation Commit:** `192d9bf39a15825ded9cd304ff37bca8b572e43e` (`192d9bf`)  
**Date:** 2026-11-19  

---

## 1. Executive Summary

Sprint 5.1 expands the ArcheOn Design Studio backend to fulfill the core operational and financial capabilities specified in the 29-page Requirements specification (Sections 06, 08, 09, 10, 12, and 14):

1. **Client GST Tax Invoicing & Line Items:**
   - Formal statutory client invoicing with automatic Indian GST tax calculations:
     - Studio Home State: Maharashtra (`State Code: 27`, GSTIN: `27AABCU9603R1ZM`).
     - Intra-state (client GSTIN `27...` or location in Maharashtra): **9.00% CGST + 9.00% SGST** (IGST: 0.00%).
     - Inter-state (client GSTIN outside Maharashtra): **18.00% IGST** (CGST: 0.00%, SGST: 0.00%).
     - Architectural & Design Services SAC Standard: **`998321`**.
     - Sequenced invoice number format: `INV-YYYY-XXXX` (e.g. `INV-2026-0001`).
     - Automatic running balance tracking on payments: `outstandingAmount = totalAmount - paidAmount`.
2. **Standard Printable PDF Generation:**
   - Authored `InvoicePdfGeneratorService.java` providing direct standard PDF 1.4 stream generation with zero external library vulnerabilities.
   - Generates compliant Indian Tax Invoices featuring Studio credentials (Ar. Mandar Bhalekar), client tax details, itemized table, tax breakdown, and bank remittance instructions.
3. **In-App Notification Center:**
   - Persistent user notification feed (`/api/notifications`) with unread counters, single mark-as-read, bulk mark-all-read, and strict ownership authorization.
   - Integrated event-driven notification dispatch triggers for invoice issuance and verified payments.
4. **Unified Aggregation Dashboards:**
   - `GET /api/dashboards/admin`: Aggregates active/completed projects, total clients/vendors, pending bill approvals, pending cash settlements, receivables aging buckets (`current`, `days1To30`, `days31To60`, `daysOver60`), and recent activity stream.
   - `GET /api/dashboards/client`: Scoped to authenticated client, returning active projects, outstanding bills, next due date, and unread notification counts.
   - `GET /api/dashboards/vendor`: Scoped to authenticated vendor, returning submitted bill statuses, pending cash vouchers, and pending payment amounts.
5. **Global Administrative Audit Center:**
   - `GET /api/admin/audit`: Administrative query endpoint with multi-criteria filtering (`entityName`, `actorId`, `action`, `startDate`, `endDate`).

The full regression test suite of **170 tests passed with 0 failures, 0 errors, and 0 skipped** across all 12 test classes.

---

## 2. Database Schema & Flyway Migration

### Flyway Migration: `V10__create_client_invoices_and_notifications.sql`

```sql
-- 1. Client GST Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    project_id VARCHAR(64),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL,
    cgst_rate NUMERIC(5,2) NOT NULL DEFAULT 9.00,
    cgst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    sgst_rate NUMERIC(5,2) NOT NULL DEFAULT 9.00,
    sgst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    igst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'ISSUED',
    sac_code VARCHAR(16) NOT NULL DEFAULT '998321',
    studio_gstin VARCHAR(15) NOT NULL DEFAULT '27AABCU9603R1ZM',
    client_gstin VARCHAR(15),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- 2. Client GST Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    sac_code VARCHAR(16) NOT NULL DEFAULT '998321',
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit_rate NUMERIC(15,2) NOT NULL,
    taxable_amount NUMERIC(15,2) NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    recipient_username VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    read_status BOOLEAN NOT NULL DEFAULT false,
    action_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Endpoints Inventory

| Domain | Method | Route | Authorization | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Invoicing** | `POST` | `/api/invoices` | `ADMIN`, `FINANCE_MANAGER` | Issue client GST tax invoice with auto tax calculation |
| **Invoicing** | `GET` | `/api/invoices/{id}` | `ADMIN`, `FINANCE_MANAGER`, `STAFF`, `CLIENT` (Self) | Retrieve invoice details with line items |
| **Invoicing** | `GET` | `/api/invoices/ref/{ref}` | `ADMIN`, `FINANCE_MANAGER`, `STAFF`, `CLIENT` (Self) | Retrieve invoice by `INV-YYYY-XXXX` |
| **Invoicing** | `GET` | `/api/invoices` | `ADMIN`, `FINANCE_MANAGER`, `STAFF`, `CLIENT` (Self) | List invoices with client/project/status filters |
| **Invoicing** | `POST` | `/api/invoices/{id}/payments` | `ADMIN`, `FINANCE_MANAGER` | Record verified payment & update running balance |
| **Invoicing** | `GET` | `/api/invoices/{id}/pdf` | `ADMIN`, `FINANCE_MANAGER`, `STAFF`, `CLIENT` (Self) | Download printable statutory GST invoice PDF |
| **Notifications** | `GET` | `/api/notifications` | `Authenticated` | Retrieve current user's notifications (`unreadOnly` toggle) |
| **Notifications** | `GET` | `/api/notifications/unread-count` | `Authenticated` | Get integer unread count for badge display |
| **Notifications** | `PATCH` | `/api/notifications/{id}/read` | `Authenticated` (Owner) | Mark single notification as read |
| **Notifications** | `POST` | `/api/notifications/mark-all-read` | `Authenticated` (Owner) | Mark all notifications as read for current user |
| **Dashboards** | `GET` | `/api/dashboards/admin` | `ADMIN`, `FINANCE_MANAGER`, `STAFF` | Aggregated studio KPIs, aging receivables & activity stream |
| **Dashboards** | `GET` | `/api/dashboards/client` | `CLIENT` | Client-scoped active projects, outstanding bills & alerts |
| **Dashboards** | `GET` | `/api/dashboards/vendor` | `VENDOR` | Vendor-scoped submitted bill statuses & pending vouchers |
| **Audit** | `GET` | `/api/admin/audit` | `ADMIN`, `FINANCE_MANAGER` | Multi-criteria filter query across global audit trail |

---

## 4. Security & Invariant Verification

1. **BOLA / IDOR Record-Level Isolation:**
   - Verified that a client cannot view or download another client's invoice (`INV-05`). Unprivileged attempts throw `AccessDeniedException` (HTTP 403 Forbidden).
   - In notifications, verified that a user cannot mark another user's notification as read (`NOTIF-03`).
2. **Paid-State Invariant:**
   - Invoices remain in `ISSUED` or `PARTIALLY_PAID` status until verified payments cover the entire total amount, at which point status becomes `PAID`.
3. **Decimal Safety:**
   - All financial calculations (`subtotal`, `cgstAmount`, `sgstAmount`, `igstAmount`, `totalAmount`, `paidAmount`) use `BigDecimal` with explicit scale 2 and `RoundingMode.HALF_UP` (zero floating-point arithmetic).
4. **Optimistic Concurrency Control:**
   - `InvoiceEntity` maintains `@Version private Long version = 0L;` to guard against concurrent overwrites.

---

## 5. Automated Test Suite Evidence

### 5.1 Test Execution Command
```powershell
$env:MAVEN_OPTS = "-Xmx256m"
mvn -f backend/pom.xml test "-DargLine=-XX:+EnableDynamicAgentLoading -Xmx384m"
```

- **Exit Code:** `0`
- **Total Tests Run:** **170**
- **Failures:** **0**
- **Errors:** **0**
- **Skipped:** **0**
- **Build Outcome:** `BUILD SUCCESS`

### 5.2 Test Breakdown Across All 12 Test Classes

| Test Suite Class | Tests Run | Failures | Errors | Skipped | Focus Area |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `InvoicingNotificationsAndDashboardsTest` | **11** | **0** | **0** | **0** | GST calculation, PDF generation, notifications, dashboards, audit |
| `SensitiveDataProtectionTest` | **20** | **0** | **0** | **0** | AES-256-GCM, 15-char GSTIN, converter concurrency, migration utility |
| `ProductionBootstrapHardeningTest`| **17** | **0** | **0** | **0** | Production startup validation (AES key, ClamAV, Redis, JWT) |
| `ProductionProfileContextTest` | **1** | **0** | **0** | **0** | Production profile context isolation |
| `ClamAvMalwareScannerTest` | **6** | **0** | **0** | **0** | ClamAV INSTREAM protocol & socket timeouts |
| `DocumentServiceAndSecurityTest` | **25** | **0** | **0** | **0** | DMS validation, quarantine release checksum verification |
| `BusinessIdentityServiceAndSecurityTest`| **13** | **0** | **0** | **0** | Client/Vendor onboarding & RBAC isolation |
| `OperationalProjectServiceAndSecurityTest`| **13** | **0** | **0** | **0** | Projects, phases, milestones, vendor assignment |
| `Phase3AuthLifecycleTest` | **17** | **0** | **0** | **0** | Auth, refresh tokens, lockout, token revocation |
| `SecurityAndRbacIntegrationTest` | **26** | **0** | **0** | **0** | Global RBAC invariants & route authorization |
| `MakerCheckerAndSafetyInvariantsTest` | **12** | **0** | **0** | **0** | Dual-authorization & financial invariants |
| `FinancialConcurrencyAndOptimisticLockingTest` | **9** | **0** | **0** | **0** | Optimistic locking & concurrent transactions |
| **TOTAL** | **170** | **0** | **0** | **0** | **Full Application Regression Suite** |

---

## 6. Files Created & Modified in Sprint 5.1

| File | Action | Purpose |
| :--- | :--- | :--- |
| `backend/src/main/resources/db/migration/V10__create_client_invoices_and_notifications.sql` | Created | Database tables for invoices, invoice_items, and notifications |
| `backend/src/main/java/com/webui/backend/model/InvoiceEntity.java` | Created | JPA entity for client GST invoices with @Version |
| `backend/src/main/java/com/webui/backend/model/InvoiceItemEntity.java` | Created | JPA entity for invoice line items |
| `backend/src/main/java/com/webui/backend/model/NotificationEntity.java` | Created | JPA entity for in-app user notification feed |
| `backend/src/main/java/com/webui/backend/repository/InvoiceRepository.java` | Created | Repository for invoice lookups, counting, receivables sums |
| `backend/src/main/java/com/webui/backend/repository/InvoiceItemRepository.java` | Created | Repository for invoice line items |
| `backend/src/main/java/com/webui/backend/repository/NotificationRepository.java` | Created | Repository for notifications and unread counts |
| `backend/src/main/java/com/webui/backend/dto/invoice/InvoiceDto.java` | Created | DTOs for invoice requests, responses, line items, payments |
| `backend/src/main/java/com/webui/backend/dto/notification/NotificationDto.java` | Created | DTOs for notification feed, responses, unread counter |
| `backend/src/main/java/com/webui/backend/dto/dashboard/DashboardDto.java` | Created | DTOs for Admin, Client, and Vendor aggregate dashboards |
| `backend/src/main/java/com/webui/backend/service/InvoicePdfGeneratorService.java` | Created | Zero-dependency standard PDF 1.4 generator for GST invoices |
| `backend/src/main/java/com/webui/backend/service/InvoiceService.java` | Created | Service for tax calculation, invoice issuance, and payments |
| `backend/src/main/java/com/webui/backend/service/NotificationService.java` | Created | Service for in-app notification dispatch and management |
| `backend/src/main/java/com/webui/backend/service/DashboardService.java` | Created | Service for aggregate metrics, receivables aging, activity streams |
| `backend/src/main/java/com/webui/backend/controller/InvoiceController.java` | Created | REST controller for `/api/invoices` |
| `backend/src/main/java/com/webui/backend/controller/NotificationController.java` | Created | REST controller for `/api/notifications` |
| `backend/src/main/java/com/webui/backend/controller/DashboardController.java` | Created | REST controller for `/api/dashboards` |
| `backend/src/main/java/com/webui/backend/controller/AuditController.java` | Created | REST controller for `/api/admin/audit` |
| `backend/src/main/java/com/webui/backend/config/SecurityConfig.java` | Modified | Added route authorization rules for Sprint 5.1 endpoints |
| `backend/src/main/java/com/webui/backend/repository/AuditEventRepository.java` | Modified | Added paginated audit query with multi-criteria filters |
| `backend/src/main/java/com/webui/backend/repository/BillApprovalRepository.java` | Modified | Added count & sum helper queries for dashboards |
| `backend/src/main/java/com/webui/backend/repository/CashSettlementRepository.java` | Modified | Added count helper queries for dashboards |
| `backend/src/test/java/com/webui/backend/invoicing/InvoicingNotificationsAndDashboardsTest.java` | Created | 11 comprehensive automated tests for Sprint 5.1 |
| `audit/backend/PHASE5_1_IMPLEMENTATION_REPORT.md` | Created | Full sprint implementation report & test evidence |
