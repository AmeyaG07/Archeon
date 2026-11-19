# ARCHÉON — SPRINT 5.4 FINAL ACCEPTANCE REPORT
## Live Portal Acceptance & Role-Based E2E Audit

**Project:** ArcheOn Design Studio  
**Sprint:** 5.4  
**Role:** Independent Principal QA Architect, Security Tester & Product Acceptance Auditor  
**Repository:** `D:\WEBUI`  
**Target Branch:** `system/phase5.3.2-dual-invitation-delivery`  
**Reported HEAD:** `30fbc22`  
**Frontend Commit:** `1039ee5` (branch `frontend/phase5.2-portal-contract-binding`)  
**Execution Mode:** CONTROLLED LIVE STAGING TESTING (READ-ONLY)  
**Date of Audit:** 2026-11-19

---

## 1. AUDIT VERDICT

### **ACCEPTED WITH CONDITIONS — NOT AUTHORIZED FOR GO-LIVE**

The ArcheOn Design Studio web platform demonstrates outstanding architectural design, strict multi-tenant data isolation, robust maker-checker financial controls, cryptographic invitation hashing, and full statutory GST invoicing with automated SAC 998321 PDF rendering. 

However, **seven concrete integration and contract discrepancies** prevent full operational readiness in live staging. Production deployment authorization is withheld until the mandatory pre-flight conditions specified in Section 6 are resolved and verified.

---

## 2. PRE-FLIGHT ENVIRONMENT & LINEAGE RECONCILIATION

| Dimension | Specification | Live Verified State |
| :--- | :--- | :--- |
| **Root Git Branch** | `system/phase5.3.2-dual-invitation-delivery` | Verified (`30fbc22`) |
| **Frontend Pointer** | `frontend` gitlink mode `160000` | Matched commit `1039ee5` |
| **Working Tree** | Clean working directory | Verified (Read-only execution preserved) |
| **Frontend Runtime** | Next.js 16.4.6 / React 19 on port 3000 | **ONLINE** (HTTP 200 across all 30 routes) |
| **Backend Runtime** | Spring Boot 3.4.0 / Java 21 on port 8080 | **ONLINE** (Daemon active, all APIs listening) |
| **Database Migrations** | Flyway V1 through V10 | **FULLY APPLIED** (All schemas, tables, indexes active) |

---

## 3. SUMMARY OF PORTAL ACCEPTANCE AUDITS

### 3.1 Admin Portal (11 Routes Audited)
*Detailed Report:* [SPRINT_5_4_2_ADMIN_PORTAL_AUDIT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_2_ADMIN_PORTAL_AUDIT.md)
- **What Works:** Audit Logs (`/admin/audit-logs`), Cash Settlements (`/admin/cash-settlements`), Client & Vendor listings (`/admin/clients`, `/admin/vendors`), Statutory GST Invoicing with line items & PDF download (`/admin/invoices`), Financial Aging & CSV export (`/admin/finance-reports`), Lead pipeline management (`/admin/leads`), Operational Projects execution (`/admin/projects`), and System Settings (`/admin/settings`).
- **Critical Gaps:**
  1. `/admin/approvals`: Requests `GET /api/approvals`, which does not exist in the backend (valid endpoint is `/api/approvals/all`), triggering an error dispatch that terminates the admin session.
  2. `/admin`: Requests `GET /api/projects/operational` instead of `/api/operational-projects`, causing the projects widget to display empty.
  3. Client & Vendor Directories: Direct "Invite" action buttons invoke obsolete `/api/invitations/{client|vendor}/${id}` and `/api/invitations/send` endpoints instead of `POST /api/clients/{id}/invite` and `POST /api/vendors/{id}/invite`.

### 3.2 Client Portal (7 Routes Audited)
*Detailed Report:* [SPRINT_5_4_3_CLIENT_PORTAL_AUDIT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_3_CLIENT_PORTAL_AUDIT.md)
- **What Works:** Client Dashboard overview (`/client`), Architectural Document Vault DMS (`/client/documents`), In-App Notification Center (`/client/notifications`), Client Profile self-service (`/client/profile` for invited clients), and Assigned Project Tracking (`/client/projects`).
- **Critical Gaps:**
  1. `/client/invoices`: Client cannot view invoices. `InvoiceService.resolveClientIdForAuth` incorrectly executes `clientRepository.findByEmail(auth.getName())` using the login username instead of querying the user entity for `user.getClientId()`. This throws `AccessDeniedException`, resulting in an HTTP 401 error that logs the client out.

### 3.3 Vendor Portal (7 Routes Audited)
*Detailed Report:* [SPRINT_5_4_4_VENDOR_PORTAL_AUDIT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_4_VENDOR_PORTAL_AUDIT.md)
- **What Works:** Vendor Dashboard overview (`/vendor`), In-App Notifications (`/vendor/notifications`), Vendor Business Profile (`/vendor/profile` for invited vendors), and Assigned Execution Projects (`/vendor/projects`).
- **Critical Gaps:**
  1. `/vendor/cash-settlements`: Spring Security restricts `GET /api/finance/cash/**` strictly to internal staff and admin roles. Contractors are blocked from viewing settlements to acknowledge.
  2. `/vendor/invoices`: Vendors are prohibited by `SecurityConfig` from calling `GET /api/approvals/**` and `POST /api/approvals/initiate`, blocking contractor bill submission.

---

## 4. CROSS-ROLE SECURITY & ISOLATION EVALUATION
*Detailed Report:* [SPRINT_5_4_5_CROSS_ROLE_SECURITY_AUDIT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_5_CROSS_ROLE_SECURITY_AUDIT.md)

1. **Privilege Boundary Invariants:** Fully respected. Under no circumstances could a Client or Vendor access administrative dashboards, user management tables, audit logs, or financial approval functions.
2. **Tenant Isolation & IDOR Protection:** Verified. Client A cannot access or download Client B's invoices or DMS drawings.
3. **Cryptographic Integrity:** Dual invitation tokens are securely hashed with SHA-256 (`token_hash`); raw tokens cannot be recovered from the database. Replay attacks are rejected with HTTP 400.
4. **Session Wipe Vulnerability:** When any request triggers an access denied or unmapped route error, Spring Boot's internal error dispatch to `/error` is intercepted as unauthenticated (returning 401). Frontend `apiFetch` catches 401 and immediately clears `localStorage`, abruptly logging the user out.

---

## 5. END-TO-END WORKFLOW VERIFICATION
*Detailed Report:* [SPRINT_5_4_6_END_TO_END_WORKFLOW_AUDIT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_6_END_TO_END_WORKFLOW_AUDIT.md)

The four foundational business workflows were proven operational:
1. **Dual Invitation Delivery:** Admin creates client/vendor -> issues invitation -> token validated via public endpoint -> recipient accepts token and registers credentials -> account activated -> single-use token invalidated.
2. **Maker-Checker Bill Approvals:** Dual-tier threshold policy (₹1,00,000) verified with segregation of duties, initiator exclusion, distinct approver rules, and optimistic locking concurrency protection.
3. **Statutory GST Invoicing:** SAC 998321 applied, intra-state/inter-state tax split calculated automatically, PDF bytes streamed, and payment reconciliation recorded.
4. **Two-Party Cash Register:** Voucher initiation, counterparty response, and finance verification executed with audit trail logging.

---

## 6. MANDATORY REMEDIATION CONDITIONS (GO-LIVE CHECKLIST)

Production authorization requires remediating the following seven conditions:

```
[ ] CONDITION 1 (Admin Approvals Route):
    Align the approvals list endpoint between frontend and backend. Either update
    frontend/src/app/admin/approvals/page.tsx to call '/api/approvals/all', or add a
    root @GetMapping alias in BillApprovalController.java.

[ ] CONDITION 2 (Admin Projects Route):
    Update frontend/src/app/admin/page.tsx to call '/api/operational-projects'
    instead of '/api/projects/operational'.

[ ] CONDITION 3 (Admin Client & Vendor Invitation Buttons):
    Update frontend/src/app/admin/clients/page.tsx and admin/vendors/page.tsx to call
    'POST /api/clients/{id}/invite' and 'POST /api/vendors/{id}/invite' respectively.

[ ] CONDITION 4 (Client Invoice Resolution):
    Refactor InvoiceService.resolveClientIdForAuth to resolve the ClientEntity via
    user.getClientId() from userRepository.findByUsername(auth.getName()), ensuring
    clients with custom usernames can view their tax invoices without 401 errors.

[ ] CONDITION 5 (Vendor Cash Settlements & Bill Submission RBAC):
    Update SecurityConfig.java and FinancialOperationsController to provide a
    vendor-scoped cash settlements endpoint, and permit trade contractors to submit
    and track their own trade bills.

[ ] CONDITION 6 (Spring Security Error Dispatch & Frontend Session Wipe):
    Permit '/error' in SecurityConfig.java and configure AccessDeniedHandler to write
    direct JSON 403 responses. Update apiFetch in frontend/src/lib/api.ts to only wipe
    auth tokens on true authentication expiry, not on 403 or server errors.

[ ] CONDITION 7 (Consultation Modal Environment Base URL):
    In frontend/src/components/ui/ConsultationModal.tsx, replace the hardcoded
    'http://localhost:8080/api/leads' with resolveApiBaseUrl().
```

---

## 7. AUDIT ARTIFACTS & DELIVERABLE REPOSITORY

All comprehensive audit evidence documents have been compiled and published under `D:\WEBUI\audit\portal\`:

1. [SPRINT_5_4_1_ENVIRONMENT_AND_ACCOUNT_VERIFICATION.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_1_ENVIRONMENT_AND_ACCOUNT_VERIFICATION.md)
2. [SPRINT_5_4_2_ADMIN_PORTAL_AUDIT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_2_ADMIN_PORTAL_AUDIT.md)
3. [SPRINT_5_4_3_CLIENT_PORTAL_AUDIT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_3_CLIENT_PORTAL_AUDIT.md)
4. [SPRINT_5_4_4_VENDOR_PORTAL_AUDIT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_4_VENDOR_PORTAL_AUDIT.md)
5. [SPRINT_5_4_5_CROSS_ROLE_SECURITY_AUDIT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_5_CROSS_ROLE_SECURITY_AUDIT.md)
6. [SPRINT_5_4_6_END_TO_END_WORKFLOW_AUDIT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_6_END_TO_END_WORKFLOW_AUDIT.md)
7. [SPRINT_5_4_7_UI_UX_AND_FUNCTIONAL_GAP_ANALYSIS.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_7_UI_UX_AND_FUNCTIONAL_GAP_ANALYSIS.md)
8. [SPRINT_5_4_FINAL_ACCEPTANCE_REPORT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_FINAL_ACCEPTANCE_REPORT.md)
