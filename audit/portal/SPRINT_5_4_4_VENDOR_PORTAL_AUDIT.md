# ARCHÉON — SPRINT 5.4.4
## Vendor Portal Acceptance & Contractor Security Audit Report

**Project:** ArcheOn Design Studio  
**Audit Target:** Vendor Portal (7 Routes & Trade Partner Workflows)  
**Target Role:** `ROLE_VENDOR` (`vendor_user`, `bob_vendor`)  
**Repository:** `D:\WEBUI`  
**Date:** 2026-11-19  
**Execution Mode:** Controlled Live Staging Testing (Read-Only)

---

### 1. Executive Summary

The Vendor Portal was evaluated across all 7 routes to audit contractor onboarding, bill submission, cash settlement acknowledgements, and assigned operational projects. While contractor profile self-service (`/vendor/profile`), notifications (`/vendor/notifications`), and project tracking (`/vendor/projects`) function correctly, **two major architectural RBAC gaps prevent vendors from viewing cash settlements (`/vendor/cash-settlements`) and submitting or viewing invoices (`/vendor/invoices`), resulting in immediate 401/403 errors and session invalidation.**

---

### 2. Page-by-Page Audit Findings

#### 2.1 `/vendor` — Contractor Portal Dashboard
- **Route:** [frontend/src/app/vendor/page.tsx](file:///D:/WEBUI/frontend/src/app/vendor/page.tsx)
- **Component:** [VendorPortalDashboard.tsx](file:///D:/WEBUI/frontend/src/components/portal/vendor/VendorPortalDashboard.tsx)
- **Live Test Results:**
  - `GET /api/dashboards/vendor` -> **HTTP 200 OK**.
    - Returns contractor metrics: business name, trade category, active project count, pending bills review count, and pending cash vouchers.
  - Page also calls `GET /api/approvals`, which fails with HTTP 401/403, caught by tolerant try-catch fallback.
- **Status:** **OPERATIONAL (Dashboard metrics display successfully)**

---

#### 2.2 `/vendor/cash-settlements` — Two-Party Cash Vouchers
- **Route:** [frontend/src/app/vendor/cash-settlements/page.tsx](file:///D:/WEBUI/frontend/src/app/vendor/cash-settlements/page.tsx)
- **Component:** [VendorCashSettlement.tsx](file:///D:/WEBUI/frontend/src/components/portal/vendor/VendorCashSettlement.tsx)
- **Live Test Results:**
  - `GET /api/finance/cash/all` -> **HTTP 401 / 403 UNAUTHORIZED (ERROR CASCADE)**.
  - **Root Cause Analysis:**
    - [frontend/src/app/vendor/cash-settlements/page.tsx](file:///D:/WEBUI/frontend/src/app/vendor/cash-settlements/page.tsx#L27) calls `apiFetch("/api/finance/cash/all")`.
    - In [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L174):
      ```java
      .requestMatchers(HttpMethod.GET, "/api/finance/cash/**")
          .hasAnyRole("ADMIN", "FINANCE_MANAGER", "STAFF", "SITE_SUPERVISOR")
      ```
    - `ROLE_VENDOR` is **strictly excluded** from `GET /api/finance/cash/**`.
    - While `POST /api/finance/cash/*/respond` correctly permits `VENDOR`, vendors cannot load the list of pending settlements to which they need to respond.
    - The resulting 401 triggers `clearAuthSession()` in `api.ts`, terminating the vendor's login session.
- **Status:** **BLOCKED BY RBAC POLICY MISMATCH**

---

#### 2.3 `/vendor/invoices` — Contractor Bill Submission & Status
- **Route:** [frontend/src/app/vendor/invoices/page.tsx](file:///D:/WEBUI/frontend/src/app/vendor/invoices/page.tsx)
- **Component:** [VendorInvoiceHistory.tsx](file:///D:/WEBUI/frontend/src/components/portal/vendor/VendorInvoiceHistory.tsx) & [VendorInvoiceSubmissionForm.tsx](file:///D:/WEBUI/frontend/src/components/portal/vendor/VendorInvoiceSubmissionForm.tsx)
- **Live Test Results:**
  - **Loading Invoices:** `GET /api/approvals` -> **HTTP 401 UNAUTHORIZED**.
    - No `/api/approvals` GET endpoint exists (only `/api/approvals/all`).
    - Furthermore, [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L170) permits only `ADMIN`, `FINANCE_MAKER`, `FINANCE_CHECKER`, `FINANCE_MANAGER`, and `STAFF` on `/api/approvals/**`. `ROLE_VENDOR` is unauthorized.
  - **Submitting Invoices:** Form invokes `POST /api/approvals/initiate` -> **HTTP 403 FORBIDDEN**.
    - [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L166) specifies:
      ```java
      .requestMatchers(HttpMethod.POST, "/api/approvals/initiate")
          .hasAnyRole("ADMIN", "FINANCE_MAKER", "STAFF")
      ```
    - Trade contractors are blocked from submitting their bills directly through this endpoint.
- **Status:** **BLOCKED BY RBAC ARCHITECTURAL MISALIGNMENT**

---

#### 2.4 `/vendor/notifications` — Trade Partner Notifications
- **Route:** [frontend/src/app/vendor/notifications/page.tsx](file:///D:/WEBUI/frontend/src/app/vendor/notifications/page.tsx)
- **Component:** [VendorNotificationCenter.tsx](file:///D:/WEBUI/frontend/src/components/portal/vendor/VendorNotificationCenter.tsx)
- **Live Test Results:**
  - `GET /api/notifications` -> **HTTP 200 OK**.
  - `GET /api/notifications/unread-count` -> **HTTP 200 OK**.
  - Notifications scoped to the vendor user's email/identifier are correctly delivered and state transitions work.
- **Status:** **FULLY OPERATIONAL**

---

#### 2.5 `/vendor/profile` — Vendor Business & Statutory Information
- **Route:** [frontend/src/app/vendor/profile/page.tsx](file:///D:/WEBUI/frontend/src/app/vendor/profile/page.tsx)
- **Component:** [VendorProfileWorkspace.tsx](file:///D:/WEBUI/frontend/src/components/portal/vendor/VendorProfileWorkspace.tsx)
- **Live Test Results:**
  - **Dynamically Activated Vendor (`bob_vendor`):**
    - `GET /api/vendors/me` -> **HTTP 200 OK**.
    - Displays business name (`Stellar Joinery Works`), reference (`VEN-WD-01`), trade category (`CARPENTRY`), GSTIN, PAN, and address.
    - `PUT /api/vendors/me` -> **HTTP 200 OK** (Allows updating contact details and statutory data).
  - **Seeded Vendor (`vendor_user`):**
    - `GET /api/vendors/me` -> **HTTP 403 FORBIDDEN** (`{"error":"Principal is not mapped to an active vendor organization"}`).
    - Seeded user lacks `vendorId` reference.
- **Status:** **OPERATIONAL FOR INVITED VENDORS**

---

#### 2.6 `/vendor/projects` — Assigned Execution Projects
- **Route:** [frontend/src/app/vendor/projects/page.tsx](file:///D:/WEBUI/frontend/src/app/vendor/projects/page.tsx)
- **Component:** [VendorProjectList.tsx](file:///D:/WEBUI/frontend/src/components/portal/vendor/VendorProjectList.tsx)
- **Live Test Results:**
  - `GET /api/operational-projects` -> **HTTP 200 OK**.
  - [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L130) allows `ROLE_VENDOR` on `GET /api/operational-projects/**`.
  - Vendor can view project assignments and update execution task status (`PATCH /api/operational-projects/*/tasks/*/status`).
- **Status:** **FULLY OPERATIONAL**

---

#### 2.7 `/vendor/unavailable` — Graceful Degradation View
- **Route:** [frontend/src/app/vendor/unavailable/page.tsx](file:///D:/WEBUI/frontend/src/app/vendor/unavailable/page.tsx)
- **Live Test Results:**
  - Static fallback page providing support contact details and status messaging.
- **Status:** **FULLY OPERATIONAL**

---

### 3. Summary of Vendor Findings & Remediation Requirements

| Finding ID | Severity | Affected Component | Description | Recommended Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **VND-01** | High | `/vendor/cash-settlements` & `SecurityConfig` | Vendor role is prohibited from `GET /api/finance/cash/**`, preventing vendors from viewing settlements to acknowledge. | Add vendor-scoped endpoint `GET /api/finance/cash/my-settlements` or permit `VENDOR` to query settlements where `counterpartyType = VENDOR` and counterparty matches authenticated user. |
| **VND-02** | High | `/vendor/invoices` & `SecurityConfig` | Vendor role is prohibited from `POST /api/approvals/initiate` and `GET /api/approvals/**`. | Permit `ROLE_VENDOR` to submit trade invoices to the approval queue, or route vendor submissions through a dedicated `/api/vendors/bills` endpoint. |
| **VND-03** | Low | `DataInitializer.seedUserIfMissing` | Seeded `vendor_user` has `vendorId = null`, preventing `/api/vendors/me` access. | Seed an initial demo `VendorEntity` and link `vendor_user.setVendorId(...)`. |
