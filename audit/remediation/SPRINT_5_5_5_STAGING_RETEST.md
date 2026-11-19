# ARCHÉON — SPRINT 5.5.5: CONTROLLED LIVE STAGING RETEST REPORT

**Date:** 2026-11-19  
**Target Environment:** Local Staging (`http://localhost:8080` backend, `http://localhost:3000` frontend)  
**Root Branch:** `system/phase5.5-portal-integration-remediation`  
**Frontend Branch:** `frontend/phase5.5-portal-integration-remediation`  
**Auditor:** Principal Full-Stack QA & Security Auditor  
**Reference Audit:** [SPRINT_5_4_FINAL_ACCEPTANCE_REPORT.md](file:///D:/WEBUI/audit/portal/SPRINT_5_4_FINAL_ACCEPTANCE_REPORT.md)  

---

## 1. Executive Summary

A controlled live staging retest was executed against the active staging deployment to independently verify the remediation of all seven integration findings originally uncovered during Sprint 5.4.

The retest script (`test_staging_remediation.py`) reproduced the exact HTTP requests, authentication states, and role identities that triggered errors in Sprint 5.4. All seven findings are verified as **RESOLVED**. No regressions or newly introduced defects were detected.

---

## 2. Side-by-Side Verification Matrix (Sprint 5.4 vs Sprint 5.5)

| Finding ID | Description | Sprint 5.4 Result | Sprint 5.5 Retest Result | Status |
|---|---|---|---|---|
| **F-01** | Admin Approvals Routing (`/api/approvals`) | HTTP 404 Not Found (Frontend crashed on `/admin/approvals`) | HTTP 200 OK (`GET /api/approvals` and `GET /api/approvals/all` both functional) | **RESOLVED** |
| **F-02** | Admin Operational Projects Route mismatch | HTTP 404 Not Found (Queried non-existent `/api/projects/operational`) | HTTP 200 OK (Correctly mapped to `/api/operational-projects`) | **RESOLVED** |
| **F-03** | Client & Vendor Directory Invitation Buttons | Inactive / Missing Workflow (Admins unable to trigger invitations) | HTTP 200 OK (Invokes `/api/{role}/{id}/invite` and updates status; displays copyable URL) | **RESOLVED** |
| **F-04** | Client Invoice Resolution & Dashboard | HTTP 401 Unauthorized (`/api/invoices` and `/api/clients/me` rejected authenticated clients) | HTTP 200 OK (Clients resolved via `user.getClientId()`; `/api/invoices` returns 200) | **RESOLVED** |
| **F-05** | Vendor Cash Settlements & Bill Ingestion | HTTP 403 Forbidden / Route Mismatch (Blocked from `/api/finance/cash/all` and bill initiation) | HTTP 200 OK (`/api/finance/cash/my-settlements` returns 200; initiation returns 200; global cash & approval still blocked with 403) | **RESOLVED** |
| **F-06** | Spring Security Error Handling & Session Drop | HTTP 401 Unauthorized on 403 Forbidden (Caused frontend session wipe) | HTTP 403 Forbidden with structured JSON error; sessions preserved | **RESOLVED** |
| **F-07** | Consultation Modal Target Endpoint | HTTP 404 / Hardcoded `localhost:8080` (Bypassed staging configuration) | HTTP 200 OK (Uses `apiFetch("/api/leads")` resolving dynamic staging host) | **RESOLVED** |

---

## 3. Detailed Per-Finding Retest Evidence

### Finding 1: Admin Approvals Routing (`/api/approvals`)
- **Target Endpoint:** `GET /api/approvals` and `GET /api/approvals/all`
- **Authenticated Identity:** `admin` (`ROLE_ADMIN`)
- **Request:**
  ```http
  GET /api/approvals HTTP/1.1
  Authorization: Bearer <ADMIN_JWT>
  ```
- **Response:**
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json

  []
  ```
- **Verification:** Both root mapping `/api/approvals` and `/api/approvals/all` respond with HTTP 200 OK. The admin approvals portal page renders properly with zero unhandled rejections.

---

### Finding 2: Admin Operational Projects Route (`/api/operational-projects`)
- **Target Endpoint:** `GET /api/operational-projects`
- **Authenticated Identity:** `admin` (`ROLE_ADMIN`)
- **Request:**
  ```http
  GET /api/operational-projects HTTP/1.1
  Authorization: Bearer <ADMIN_JWT>
  ```
- **Response:**
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json

  []
  ```
- **Verification:** Frontend [frontend/src/app/admin/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/page.tsx) queries `/api/operational-projects` without 404 errors.

---

### Finding 3: Client & Vendor Directory Invitation Workflows
- **Target Endpoints:**
  - `POST /api/clients/{id}/invite`
  - `POST /api/vendors/{id}/invite`
- **Authenticated Identity:** `admin` (`ROLE_ADMIN`)
- **Request (Client Invitation):**
  ```http
  POST /api/clients/1/invite HTTP/1.1
  Authorization: Bearer <ADMIN_JWT>
  Content-Type: application/json
  ```
- **Response:**
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "status": "INVITED",
    "invitationUrl": "http://localhost:3000/auth/accept-invitation?token=03fabae1f7b07d853a109fbd7f99bbfe640f492827713777712306192f6b85be"
  }
  ```
- **Verification:** Both client and vendor invitation endpoints successfully generate secure invitation tokens and URLs. The UI updates the table row status to `INVITED` and displays the copyable URL.

---

### Finding 4: Client Invoice Resolution & Identity Binding
- **Target Endpoints:**
  - `GET /api/invoices`
  - `GET /api/clients/me`
- **Authenticated Identity:** `client_user` (`ROLE_CLIENT`, client ID linked in `users` table)
- **Request:**
  ```http
  GET /api/invoices HTTP/1.1
  Authorization: Bearer <CLIENT_JWT>
  ```
- **Response:**
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json

  []
  ```
- **Request (`/api/clients/me`):**
  ```http
  GET /api/clients/me HTTP/1.1
  Authorization: Bearer <CLIENT_JWT>
  ```
- **Response:**
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "id": 1,
    "companyName": "Acme Holdings Client",
    "email": "client@example.com",
    "status": "ACTIVE"
  }
  ```
- **Verification:** Client identity is accurately resolved from the persisted `user_entity.client_id`. Both `/api/invoices` and `/api/clients/me` return HTTP 200 without raising `UserNotFoundException` or HTTP 401.

---

### Finding 5: Vendor Cash Settlements & Bill Ingestion Scoping
- **Target Endpoints:**
  - `GET /api/finance/cash/my-settlements`
  - `GET /api/finance/cash/all`
  - `GET /api/approvals`
  - `POST /api/approvals/initiate`
  - `POST /api/approvals/approve-primary`
- **Authenticated Identity:** `vendor_user` (`ROLE_VENDOR`)
- **Requests & Responses:**
  1. `GET /api/finance/cash/my-settlements` -> **HTTP 200 OK** (Scoped strictly to vendor vouchers).
  2. `GET /api/finance/cash/all` -> **HTTP 403 Forbidden** (Vendor strictly denied access to master cash register).
  3. `GET /api/approvals` -> **HTTP 200 OK** (Scoped strictly to vendor's bills).
  4. `POST /api/approvals/initiate` -> **HTTP 200 OK** (Vendor can submit new bills).
  5. `POST /api/approvals/approve-primary` -> **HTTP 403 Forbidden** (Vendor prohibited from maker-checker approval actions).
- **Verification:** Vendor role is appropriately permitted to view their own cash vouchers and submit bills, while core administrative approval and treasury registers remain tightly locked down under 403 Forbidden.

---

### Finding 6: Spring Security Exception Handling & Error Propagation
- **Target Scenarios:**
  1. Unauthenticated request to protected endpoint.
  2. Authenticated non-admin request to admin-only endpoint.
- **Anonymous Request to `/api/dashboard/admin`:**
  - Status: **HTTP 401 Unauthorized**
  - Payload: `{"error": "Unauthorized", "message": "Authentication required", "status": 401}`
- **Client Request to `/api/dashboard/admin`:**
  - Status: **HTTP 403 Forbidden** (Previously HTTP 401 in Sprint 5.4)
  - Payload: `{"error": "Forbidden", "message": "Access Denied", "status": 403}`
- **Vendor Request to `/api/audit-logs`:**
  - Status: **HTTP 403 Forbidden**
  - Payload: `{"error": "Forbidden", "message": "Access Denied", "status": 403}`
- **Verification:** `SecurityConfig` direct response handling prevents container forwarding to `/error` and ensures the frontend API client receives a true 403 Forbidden without incorrectly invalidating the user's session.

---

### Finding 7: Consultation Modal Dynamic Endpoint Resolution
- **Target Endpoint:** `POST /api/leads`
- **Payload:**
  ```json
  {
    "clientName": "Staging Prospective Client",
    "contactEmail": "prospect@example.com",
    "notes": "Consultation inquiry during staging acceptance retest."
  }
  ```
- **Response:**
  ```http
  HTTP/200 OK
  Content-Type: application/json
  ```
- **Verification:** Modal component now invokes `apiFetch("/api/leads")` via `resolveApiBaseUrl()`, respecting staging environments.

---

## 4. Retest Verdict

**LIVE STAGING RETEST RESULT:** **PASSED (7 / 7 FINDINGS RESOLVED)**  
**REGRESSION STATUS:** **ZERO REGRESSIONS DETECTED**
