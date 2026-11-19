# ARCHÉON — SPRINT 5.4.3
## Client Portal Acceptance & Multi-Tenancy Audit Report

**Project:** ArcheOn Design Studio  
**Audit Target:** Client Portal (7 Routes & Client Service Workflows)  
**Target Role:** `ROLE_CLIENT` (`client_user`, `alice_client`)  
**Repository:** `D:\WEBUI`  
**Date:** 2026-11-19  
**Execution Mode:** Controlled Live Staging Testing (Read-Only)

---

### 1. Executive Summary

The Client Portal was evaluated across all 7 routes to verify tenant data isolation, financial visibility, document access, and profile management. While the portal dashboard (`/client`), document vault (`/client/documents`), in-app notification center (`/client/notifications`), and assigned projects (`/client/projects`) operate securely, **a critical bug in invoice resolution (`/client/invoices`) blocks clients from accessing their statutory GST invoices and triggers unintended session logouts.**

---

### 2. Page-by-Page Audit Findings

#### 2.1 `/client` — Client Workspace Dashboard
- **Route:** [frontend/src/app/client/page.tsx](file:///D:/WEBUI/frontend/src/app/client/page.tsx)
- **Component:** [ClientPortalDashboard.tsx](file:///D:/WEBUI/frontend/src/components/portal/client/ClientPortalDashboard.tsx)
- **Live Test Results:**
  - `GET /api/dashboards/client` -> **HTTP 200 OK**.
    - Dynamically resolves client metrics: active project count, pending bills count, outstanding balances, and recent milestone activities.
    - Graceful fallback verified when client entity is not yet linked (`clientReference: "CLI-N/A"`).
  - Tolerant fallback in [page.tsx](file:///D:/WEBUI/frontend/src/app/client/page.tsx#L48-L50) prevents the dashboard from crashing if the invoice sub-query encounters an error.
- **Status:** **FULLY OPERATIONAL**

---

#### 2.2 `/client/invoices` — Client Tax Invoices & Payments
- **Route:** [frontend/src/app/client/invoices/page.tsx](file:///D:/WEBUI/frontend/src/app/client/invoices/page.tsx)
- **Component:** [ClientInvoicingView.tsx](file:///D:/WEBUI/frontend/src/components/portal/client/ClientInvoicingView.tsx)
- **Live Test Results:**
  - `GET /api/invoices` & `GET /api/invoices?size=50` -> **HTTP 401 UNAUTHORIZED (ERROR CASCADE)**.
  - **Root Cause Analysis:**
    - In [InvoiceService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/InvoiceService.java#L167-L170):
      ```java
      if (isClientRole(auth)) {
          UUID callerClientId = resolveClientIdForAuth(auth);
          return invoiceRepository.findByClientId(callerClientId, pageable).map(this::toResponse);
      }
      ```
    - Lines 254–260 define `resolveClientIdForAuth`:
      ```java
      private UUID resolveClientIdForAuth(Authentication auth) {
          String username = auth.getName();
          return clientRepository.findByEmail(username)
                  .map(ClientEntity::getId)
                  .orElseThrow(() -> new AccessDeniedException("Client profile not found for principal: " + username));
      }
      ```
    - `auth.getName()` returns the user's login `username` (e.g. `"alice_client"` or `"client_user"`), which is **not** an email.
    - `clientRepository.findByEmail("alice_client")` returns empty and throws `AccessDeniedException`.
    - Because `/error` is not explicitly permitted in [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java), Spring Security catches the internal error dispatch and returns **HTTP 401**.
    - In [frontend/src/lib/api.ts](file:///D:/WEBUI/frontend/src/lib/api.ts#L181-L184), HTTP 401 triggers `clearAuthSession()`, which removes `archeon_auth_token` from `localStorage` and redirects the client back to `/login`.
- **Status:** **CRITICAL DEFECT (BLOCKING INVOICE ACCESS & CAUSING UNAUTHORIZED LOGOUT)**

---

#### 2.3 `/client/documents` — Architectural Document Vault (DMS)
- **Route:** [frontend/src/app/client/documents/page.tsx](file:///D:/WEBUI/frontend/src/app/client/documents/page.tsx)
- **Component:** [ClientDocumentVault.tsx](file:///D:/WEBUI/frontend/src/components/portal/client/ClientDocumentVault.tsx)
- **Live Test Results:**
  - `GET /api/documents` -> **HTTP 200 OK**.
  - Document permissions restrict clients strictly to drawings, contracts, and specs marked with `ROLE_CLIENT` permission.
  - Download endpoint `GET /api/documents/{id}/download` verifies tenant and role entitlements before streaming.
- **Status:** **FULLY OPERATIONAL**

---

#### 2.4 `/client/notifications` — Notification Inbox
- **Route:** [frontend/src/app/client/notifications/page.tsx](file:///D:/WEBUI/frontend/src/app/client/notifications/page.tsx)
- **Component:** [ClientNotificationCenter.tsx](file:///D:/WEBUI/frontend/src/components/portal/client/ClientNotificationCenter.tsx)
- **Live Test Results:**
  - `GET /api/notifications` -> **HTTP 200 OK** (11 alerts loaded).
  - `GET /api/notifications/unread-count` -> **HTTP 200 OK** (Returns accurate count).
  - `PATCH /api/notifications/{id}/read` -> **HTTP 200 OK**.
  - `POST /api/notifications/mark-all-read` -> **HTTP 200 OK**.
- **Status:** **FULLY OPERATIONAL**

---

#### 2.5 `/client/profile` — Client Identity & Organization
- **Route:** [frontend/src/app/client/profile/page.tsx](file:///D:/WEBUI/frontend/src/app/client/profile/page.tsx)
- **Component:** [ClientProfileWorkspace.tsx](file:///D:/WEBUI/frontend/src/components/portal/client/ClientProfileWorkspace.tsx)
- **Live Test Results:**
  - **Dynamically Activated Client (`alice_client`):**
    - `GET /api/clients/me` -> **HTTP 200 OK**.
    - Correctly displays `Alice Smith`, `Smith Holdings`, `CLI-CORP-01`, and contact details.
    - `PUT /api/clients/me` -> **HTTP 200 OK** (Self-service updates allowed).
  - **Seeded Client (`client_user`):**
    - `GET /api/clients/me` -> **HTTP 403 FORBIDDEN** (`{"error":"Principal is not mapped to an active client organization"}`).
    - *Explanation:* [DataInitializer.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/DataInitializer.java) seeded `client_user` without creating a corresponding `ClientEntity` in `client_organizations` or assigning `clientId`.
- **Status:** **OPERATIONAL FOR INVITED CLIENTS (Seeded Account Missing Association)**

---

#### 2.6 `/client/projects` — Active Architectural Projects
- **Route:** [frontend/src/app/client/projects/page.tsx](file:///D:/WEBUI/frontend/src/app/client/projects/page.tsx)
- **Component:** [ClientProjectList.tsx](file:///D:/WEBUI/frontend/src/components/portal/client/ClientProjectList.tsx)
- **Live Test Results:**
  - `GET /api/operational-projects` -> **HTTP 200 OK**.
  - Returns projects where `clientId` matches the authenticated client's organization.
- **Status:** **FULLY OPERATIONAL**

---

#### 2.7 `/client/unavailable` — Graceful Degradation View
- **Route:** [frontend/src/app/client/unavailable/page.tsx](file:///D:/WEBUI/frontend/src/app/client/unavailable/page.tsx)
- **Live Test Results:**
  - Static fallback page providing support contact details and reassuring status messaging.
- **Status:** **FULLY OPERATIONAL**

---

### 3. Summary of Client Findings & Remediation Requirements

| Finding ID | Severity | Affected Component | Description | Recommended Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **CLI-01** | Critical | `InvoiceService.resolveClientIdForAuth` | Looks up client organization by `auth.getName()` via `findByEmail`, which fails because the login principal is a username, not an email. Converts to 401 and logs the user out. | Resolve `UserEntity` first via `userRepository.findByUsername(username)`, then obtain `user.getClientId()`. |
| **CLI-02** | Low | `DataInitializer.seedUserIfMissing` | Seeded `client_user` has `clientId = null`, preventing `/api/clients/me` access. | Seed an initial demo `ClientEntity` and link `client_user.setClientId(...)`. |
