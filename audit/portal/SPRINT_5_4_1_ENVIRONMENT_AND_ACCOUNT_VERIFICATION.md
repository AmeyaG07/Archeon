# ARCHÉON — SPRINT 5.4.1
## Environment, Infrastructure & Test Account Verification Report

**Project:** ArcheOn Design Studio  
**Audit Target:** Full Live Portal Acceptance & Role-Based E2E Verification  
**Repository:** `D:\WEBUI`  
**Current Branch:** `system/phase5.3.2-dual-invitation-delivery`  
**Auditor:** Independent Principal QA Architect & Security Tester  
**Date:** 2026-11-19  
**Execution Mode:** Controlled Live Staging Testing (Read-Only)

---

### 1. Executive Summary

This report establishes the baseline infrastructure, application runtime health, database migrations, Git lineage, and test account credentials verified for the Sprint 5.4 live end-to-end portal audit. Both the Next.js frontend and Spring Boot backend staging environments were independently verified as active, bound to expected ports, and operational.

---

### 2. Environment & Runtime Verification

| Component | Target Runtime | Configured Endpoint | Live Status | Process ID / Port |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web Portal** | Next.js 16.4.6 (React 19) | `http://localhost:3000` | **ONLINE** (HTTP 200) | Port 3000 (PID 25448) |
| **Backend REST API** | Spring Boot 3.4.0 (Java 21) | `http://localhost:8080` | **ONLINE** (HTTP 200) | Port 8080 (PID 19960) |
| **Relational Database** | H2 (PostgreSQL Mode) | `jdbc:h2:mem:archeon_db` | **APPLIED V1–V10** | In-Memory Staging Mode |
| **Reverse Proxy / CORS** | Spring Security CORS Filter | `http://localhost:3000` | **PERMITTED** | Allowed Origins Configured |

#### 2.1 Git Repository Lineage & Submodule State
- **Root Repository Branch:** `system/phase5.3.2-dual-invitation-delivery`
- **Root HEAD Commit:** `30fbc22` (`system: complete dual invitation delivery remediation with single-source activation and robust token hashing`)
- **Frontend Working Tree:** `frontend/` gitlink pointer mode `160000` points to commit `1039ee5c591cf56d43dc26b54752f4c58a45a46a` on branch `frontend/phase5.2-portal-contract-binding`.
- **Submodule Pointer Status:** Matched. The working tree has no uncommitted changes in tracked files.

#### 2.2 Database Migrations (Flyway V1–V10)
All Flyway migrations executed cleanly on application initialization:
1. `V1__init_schema.sql` (Base tables, users, roles)
2. `V2__maker_checker_bills.sql` (Maker-checker bill approvals, audit events)
3. `V3__two_party_cash_settlement.sql` (Cash settlements, acknowledgements)
4. `V4__user_sessions.sql` (Token families, refresh token tracking)
5. `V5__operational_projects.sql` (Phases, milestones, tasks, vendor assignments)
6. `V6__document_management_system.sql` (DMS files, versions, quarantine, permissions)
7. `V7__gst_invoicing_sac998321.sql` (GST client invoices, SAC 998321, payments)
8. `V8__in_app_notifications.sql` (Notification inbox, delivery status)
9. `V9__immutable_audit_center.sql` (Platform-wide audit logging)
10. `V10__dual_invitation_delivery.sql` (SHA-256 invitation hashes, dual delivery methods)

---

### 3. Authentication & Test Account Matrix

The following accounts were audited via live HTTP calls to `POST /api/auth/login`:

| Username | Role | Primary Function | Password Tested | Login Result | Token Issued |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `admin` | `ROLE_ADMIN` | Global Studio Administrator | `Password123!` | **HTTP 200 OK** | Yes (Valid Bearer JWT) |
| `client_user` | `ROLE_CLIENT` | Seeded Client Account | `Password123!` | **HTTP 200 OK** | Yes (Valid Bearer JWT) |
| `vendor_user` | `ROLE_VENDOR` | Seeded Vendor Account | `Password123!` | **HTTP 200 OK** | Yes (Valid Bearer JWT) |
| `alice_client` | `ROLE_CLIENT` | Dynamically Invited & Activated Client | `Password123!` | **HTTP 200 OK** | Yes (Valid Bearer JWT) |
| `bob_vendor` | `ROLE_VENDOR` | Dynamically Invited & Activated Vendor | `Password123!` | **HTTP 200 OK** | Yes (Valid Bearer JWT) |
| `admin` | `ROLE_ADMIN` | Invalid Password Challenge | `WrongPass` | **HTTP 401 UNAUTHORIZED** | None (Rejected) |

#### 3.1 Token Lifecycle Verification
1. **JWT Generation:** Tokens are HS256-signed with standard subject (`sub`), role authority (`roles`), token version (`tokenVersion`), and expiration timestamp.
2. **Refresh Token Flow:** `POST /api/auth/refresh` was tested with a valid refresh token and responded **HTTP 200 OK** with a newly rotated access token.
3. **Invalid Signature / Tampered Token:** A tampered JWT (`admin_token + "invalid_signature"`) passed to `/api/dashboards/admin` was rejected immediately with **HTTP 401 UNAUTHORIZED**.
4. **Session Invalidation:** Revoking a session family via `POST /api/auth/sessions/{familyId}/revoke` invalidates subsequent refresh attempts.

---

### 4. Frontend Route Inventory & Reachability

All 30 discovered frontend routes were verified via HTTP GET on `http://localhost:3000`:

| Category | Route | Live HTTP Status | Guard / Layout Shell |
| :--- | :--- | :--- | :--- |
| **Public** | `/` | HTTP 200 OK | Public Landing Page |
| **Public** | `/login` | HTTP 200 OK | Public Auth Form |
| **Public** | `/auth/accept-invitation` | HTTP 200 OK | Dual Invitation Activation Portal |
| **Public** | `/accept-invitation` | HTTP 200 OK | Alias re-export to `/auth/accept-invitation` |
| **Public** | `/design-system` | HTTP 200 OK | Component Catalog & Palette |
| **Admin** | `/admin` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Admin** | `/admin/approvals` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Admin** | `/admin/audit-logs` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Admin** | `/admin/cash-settlements` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Admin** | `/admin/clients` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Admin** | `/admin/finance-reports` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Admin** | `/admin/invoices` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Admin** | `/admin/leads` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Admin** | `/admin/projects` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Admin** | `/admin/settings` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Admin** | `/admin/vendors` | HTTP 200 OK | `AdminPortalShell` (`useAuth`) |
| **Client** | `/client` | HTTP 200 OK | `ClientPortalShell` (`useAuth`) |
| **Client** | `/client/documents` | HTTP 200 OK | `ClientPortalShell` (`useAuth`) |
| **Client** | `/client/invoices` | HTTP 200 OK | `ClientPortalShell` (`useAuth`) |
| **Client** | `/client/notifications` | HTTP 200 OK | `ClientPortalShell` (`useAuth`) |
| **Client** | `/client/profile` | HTTP 200 OK | `ClientPortalShell` (`useAuth`) |
| **Client** | `/client/projects` | HTTP 200 OK | `ClientPortalShell` (`useAuth`) |
| **Client** | `/client/unavailable` | HTTP 200 OK | Fallback Degraded View |
| **Vendor** | `/vendor` | HTTP 200 OK | `VendorPortalShell` (`useAuth`) |
| **Vendor** | `/vendor/cash-settlements` | HTTP 200 OK | `VendorPortalShell` (`useAuth`) |
| **Vendor** | `/vendor/invoices` | HTTP 200 OK | `VendorPortalShell` (`useAuth`) |
| **Vendor** | `/vendor/notifications` | HTTP 200 OK | `VendorPortalShell` (`useAuth`) |
| **Vendor** | `/vendor/profile` | HTTP 200 OK | `VendorPortalShell` (`useAuth`) |
| **Vendor** | `/vendor/projects` | HTTP 200 OK | `VendorPortalShell` (`useAuth`) |
| **Vendor** | `/vendor/unavailable` | HTTP 200 OK | Fallback Degraded View |

---

### 5. Key Infrastructure Observations & Pre-Flight Notes

1. **Active Services:** Both development servers (`localhost:3000` and `localhost:8080`) are properly responding.
2. **Test Account Discrepancy:** The seeded accounts `client_user` and `vendor_user` in [DataInitializer.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/DataInitializer.java) have valid authentication credentials, but lack associated entity records in `client_organizations` and `vendor_organizations`. Conversely, dynamically invited test accounts (`alice_client` and `bob_vendor`) possess valid organizational entity links.
3. **Environment Parity:** The live environment is fully instrumented for empirical testing of all business workflows and role boundaries.
