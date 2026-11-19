# ARCHÉON — SPRINT 5.5.1
## Finding Validation & Technical Root-Cause Analysis Report

**Project:** ArcheOn Design Studio  
**Sprint:** 5.5 (Live Portal Integration Remediation)  
**Target Branch:** `system/phase5.5-portal-integration-remediation`  
**Reference Report:** `audit/portal/SPRINT_5_4_FINAL_ACCEPTANCE_REPORT.md`  
**Date:** 2026-11-19  
**Auditor:** Principal Full-Stack Engineer, Security Architect & Senior QA Lead

---

### 1. Executive Summary

This report establishes the technical validation, empirical reproduction, root-cause diagnosis, and architectural safety criteria for the seven integration findings identified during the Sprint 5.4 Live Portal Acceptance Audit. Every finding was independently verified against source code, live endpoints, and test traces prior to implementing any code changes.

---

### 2. Validation & Root-Cause Matrix

| Finding ID | Title | Confirmed? | Source Location | Root Cause | Target Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FINDING-1** | Admin Approvals Route | **CONFIRMED** | [frontend/src/app/admin/approvals/page.tsx#L29](file:///D:/WEBUI/frontend/src/app/admin/approvals/page.tsx#L29) & [BillApprovalController.java#L128](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/BillApprovalController.java#L128) | Frontend calls `GET /api/approvals`. Backend controller only mapped `@GetMapping("/all")`. Unmapped route forwards to `/error`, returning 401. | Map `@GetMapping({"", "/", "/all"})` in `BillApprovalController.java` to support both canonical REST collection path and legacy `/all`. |
| **FINDING-2** | Admin Projects Route | **CONFIRMED** | [frontend/src/app/admin/page.tsx#L35](file:///D:/WEBUI/frontend/src/app/admin/page.tsx#L35) | Frontend calls `/api/projects/operational`. Backend controller is `@RequestMapping("/api/operational-projects")`. | Align `admin/page.tsx` line 35 to call `apiFetch("/api/operational-projects")`. |
| **FINDING-3** | Client & Vendor Invitation Buttons | **CONFIRMED** | [admin/clients/page.tsx#L70](file:///D:/WEBUI/frontend/src/app/admin/clients/page.tsx#L70) & [admin/vendors/page.tsx#L73](file:///D:/WEBUI/frontend/src/app/admin/vendors/page.tsx#L73) | Frontend calls obsolete `/api/invitations/client/${id}` and `/api/invitations/send`. Backend endpoints are `POST /api/clients/{id}/invite` and `POST /api/vendors/{id}/invite`. | Connect action handlers to `POST /api/clients/{id}/invite` and `POST /api/vendors/{id}/invite`. Provide clear UI loading/success state. |
| **FINDING-4** | Client Invoice Resolution | **CONFIRMED** | [InvoiceService.java#L254-L260](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/InvoiceService.java#L254-L260) | `resolveClientIdForAuth` passes `auth.getName()` (username like `"alice_client"`) to `clientRepository.findByEmail(...)`. Throws `AccessDeniedException` -> converts to 401. | Inject `UserRepository` into `InvoiceService`. Resolve `user.getClientId()` from `userRepository.findByUsername(auth.getName())`. |
| **FINDING-5** | Vendor Cash Settlements & Bill Submission RBAC | **CONFIRMED** | [SecurityConfig.java#L166-L174](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L166-L174) & [FinancialOperationsController.java#L100](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/FinancialOperationsController.java#L100) | `ROLE_VENDOR` is excluded from `GET /api/finance/cash/**` and `POST /api/approvals/initiate`. Vendors receive 401/403 when viewing cash vouchers or submitting trade invoices. | Implement resource-level isolation: permit `ROLE_VENDOR` in `SecurityConfig`, filter `getAllCashSettlements` by authenticated vendor identifier, and allow vendors to initiate bills for their own vendor ID. |
| **FINDING-6** | Spring Security 401/403 Dispatch & Session Wiping | **CONFIRMED** | [SecurityConfig.java#L65-L70](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L65-L70) & [frontend/src/lib/api.ts#L181-L184](file:///D:/WEBUI/frontend/src/lib/api.ts#L181-L184) | `response.sendError(SC_FORBIDDEN)` forwards to `/error`. Because `/error` is not permitted, `authenticationEntryPoint` returns 401 instead of 403. `api.ts` wipes `localStorage` on any 401. | Configure `accessDeniedHandler` to emit direct JSON HTTP 403 without container forward. Permit `/error`. In `api.ts`, ensure 403 never clears auth tokens. |
| **FINDING-7** | Consultation Modal API URL | **CONFIRMED** | [ConsultationModal.tsx#L39](file:///D:/WEBUI/frontend/src/components/ui/ConsultationModal.tsx#L39) | Direct call to `http://localhost:8080/api/leads` breaks in staging/production. | Refactor `ConsultationModal.tsx` to use `apiFetch("/api/leads")` via `resolveApiBaseUrl()`. |

---

### 3. Detailed Root-Cause Analyses

#### 3.1 Finding 1: Canonical Approvals Endpoint Alignment
- **Frontend Expectation:** [frontend/src/app/admin/approvals/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/approvals/page.tsx#L29) requests `GET /api/approvals`.
- **Backend Implementation:** [BillApprovalController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/BillApprovalController.java#L128) maps only `@GetMapping("/all")`.
- **Architectural Solution:** Update `BillApprovalController.java` to map `@GetMapping({"", "/", "/all"})`. This aligns with REST standards (`GET /api/approvals` for collection) while maintaining backwards compatibility for existing tests targeting `/all`.

#### 3.2 Finding 2: Operational Projects Path Mismatch
- **Frontend Call:** [frontend/src/app/admin/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/page.tsx#L35) invokes `apiFetch("/api/projects/operational")`.
- **Backend Definition:** [OperationalProjectController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/OperationalProjectController.java#L28) is mapped to `@RequestMapping("/api/operational-projects")`.
- **Architectural Solution:** Change the path in `admin/page.tsx` to `/api/operational-projects`, matching the rest of the application.

#### 3.3 Finding 3: Directory Invitation Actions
- **Issue:** Admin directory pages for Clients and Vendors invoke dead endpoints (`/api/invitations/client/${id}`, `/api/invitations/vendor/${id}`, and `/api/invitations/send`).
- **Backend Capability:** [ClientController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/ClientController.java#L97) and [VendorController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/VendorController.java#L98) already expose `@PostMapping("/{id}/invite")`, which invokes `userInvitationService.createInvitation` with `deliveryMethod: "BOTH"`.
- **Architectural Solution:** Update `handleInviteClient` and `handleInviteVendor` to call `POST /api/clients/${id}/invite` and `POST /api/vendors/${id}/invite`. Render feedback notifications and copyable invitation links when returned.

#### 3.4 Finding 4: Client Invoice Identity Resolution
- **Issue:** [InvoiceService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/InvoiceService.java#L254):
  ```java
  private UUID resolveClientIdForAuth(Authentication auth) {
      String username = auth.getName();
      return clientRepository.findByEmail(username)
              .map(ClientEntity::getId)
              .orElseThrow(() -> new AccessDeniedException("Client profile not found for principal: " + username));
  }
  ```
- **Flaw:** `auth.getName()` is the user's login username (`alice_client`), not an email. Because the client was registered with `email: alice.smith@studioarcheon.com` and `username: alice_client`, `findByEmail("alice_client")` returns `Optional.empty()` and denies access.
- **Architectural Solution:** Inject `UserRepository`. Query `userRepository.findByUsername(username)`. Retrieve `user.getClientId()`, verify existence in `clientRepository`, and return the verified `UUID`.

#### 3.5 Finding 5: Vendor Resource-Level Financial Authorization
- **Issue:** `SecurityConfig.java` strictly excludes `ROLE_VENDOR` from `GET /api/finance/cash/**` and `POST /api/approvals/initiate`.
- **Safety Invariant:** A vendor must not simply be given global read access to firms' financial records.
- **Architectural Solution:**
  1. In `SecurityConfig.java`, permit `ROLE_VENDOR` on `GET /api/finance/cash/**` and `POST /api/approvals/initiate`.
  2. In `FinancialOperationsController.getAllCashSettlements`, evaluate `auth`. If the caller has `ROLE_VENDOR`, resolve their authenticated vendor reference/ID, and filter results strictly to records where `counterpartyId` matches the caller.
  3. In `BillApprovalController.initiate`, if the caller is `ROLE_VENDOR`, enforce that `request.vendorId` is set to the caller's authorized vendor reference, preventing contractors from submitting bills on behalf of third parties.
  4. In `BillApprovalController.getAllApprovals`, if caller is `ROLE_VENDOR`, filter the approval queue to return only bills where `vendorId` matches the authenticated contractor.

#### 3.6 Finding 6: Spring Security 401/403 Error Dispatch & Session Preservation
- **Issue:** `accessDeniedHandler` delegates to `sendError(SC_FORBIDDEN)`, triggering an internal forward to `/error`. Spring Security intercepts this forward as unauthenticated and emits 401. `api.ts` clears `localStorage` on any 401.
- **Architectural Solution:**
  1. Configure `accessDeniedHandler` to write a direct JSON response (`HttpServletResponse.SC_FORBIDDEN`) directly to `response.getWriter()` with `{ "error": "Forbidden", "status": 403 }`.
  2. Configure `authenticationEntryPoint` similarly to write direct JSON 401 with `{ "error": "Unauthorized", "status": 401 }`.
  3. Explicitly allow `/error` in `SecurityConfig.java`.
  4. In `frontend/src/lib/api.ts`, ensure that 403 responses throw `ForbiddenError` without clearing user tokens or session storage.

#### 3.7 Finding 7: Consultation Modal URL Configuration
- **Issue:** Hardcoded `http://localhost:8080/api/leads` in `ConsultationModal.tsx`.
- **Architectural Solution:** Replace with `apiFetch("/api/leads", { method: "POST", body: ... })` which adheres to `resolveApiBaseUrl()`.

---

### 4. Implementation Safety Constraints

1. **Zero Degradation:** Pre-existing automated tests (180+ backend tests, Next.js build) must continue passing.
2. **Strict Multi-Tenancy:** Resource-level filtering must be enforced at the service/controller layer; never rely on frontend filtering.
3. **No Secret Exposure:** Raw tokens or credentials must never be written to application logs.
