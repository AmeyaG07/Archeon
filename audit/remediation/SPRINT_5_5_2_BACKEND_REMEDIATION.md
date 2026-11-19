# ARCHÉON — SPRINT 5.5.2
## Backend Integration & Contract Remediation Report

**Project:** ArcheOn Design Studio  
**Sprint:** 5.5  
**Target Branch:** `system/phase5.5-portal-integration-remediation`  
**Date:** 2026-11-19  
**Auditor:** Principal Backend & Application Security Architect

---

### 1. Executive Summary

This report documents the architectural corrections implemented across the Spring Boot backend to resolve the four backend-related findings identified in the Sprint 5.4 audit:
- Finding 1: Canonical Approvals Endpoint Alignment
- Finding 4: Client Invoice Identity Resolution
- Finding 5: Vendor Resource-Level Financial Authorization
- Finding 6: HTTP 401/403 Error Dispatch & Security Configuration

All modifications preserve existing security invariants, prevent cross-tenant data leakage, and ensure zero regression across the existing test suite.

---

### 2. Detailed File Modifications

#### 2.1 [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java)
1. **Direct JSON Exception Handlers:**
   Configured `authenticationEntryPoint` and `accessDeniedHandler` to write structured JSON directly to the servlet response stream (`Content-Type: application/json; charset=UTF-8`), avoiding container-level forwards to `/error`:
   - Unauthenticated: Returns HTTP 401 with `{"error":"Unauthorized","status":401}`.
   - Forbidden: Returns HTTP 403 with `{"error":"Forbidden","status":403}`.
2. **Error Dispatch Routing:**
   Added `.requestMatchers("/error").permitAll()` to prevent internal error dispatches from triggering spurious 401 challenges.
3. **Vendor Financial Scope:**
   - Permitted `ROLE_VENDOR` on `POST /api/approvals/initiate` for bill submissions.
   - Permitted `ROLE_VENDOR` on `GET /api/approvals/**` for scoped bill queue queries.
   - Added `.requestMatchers(HttpMethod.GET, "/api/finance/cash/my-settlements").hasAnyRole("ADMIN", "VENDOR", "CLIENT", "STAFF")` before the general `/api/finance/cash/**` filter, maintaining strict staff-only protection for the global cash register (`/api/finance/cash/all`).

#### 2.2 [BillApprovalController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/BillApprovalController.java)
1. **Endpoint Unification:**
   Updated `@GetMapping("/all")` to `@GetMapping({"", "/", "/all"})`, supporting canonical REST collection queries (`GET /api/approvals`) while maintaining compatibility with legacy automated tests.
2. **Resource-Level Vendor Filtering:**
   Injected `UserRepository` and `VendorRepository`. When the caller holds `ROLE_VENDOR`, `getAllApprovals` strictly filters records to those where `vendorId` matches the authenticated contractor's identifier.
3. **Identity Binding on Initiation:**
   In `initiate()`, if the caller holds `ROLE_VENDOR`, `request.vendorId` is validated against the caller's authorized vendor identifiers, preventing vendors from submitting bills under foreign vendor accounts.
4. **Access-Controlled Single Bill Status:**
   In `getApprovalStatus()`, foreign bill inspection by vendors is rejected with HTTP 403 Forbidden.

#### 2.3 [FinancialOperationsController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/FinancialOperationsController.java)
1. **Vendor Scoped Settlements:**
   Added `@GetMapping("/cash/my-settlements")`. Resolves counterparty identifiers for the authenticated user and returns strictly assigned vouchers.
2. **Flexible Counterparty Identity in Acknowledgements:**
   In `respondCash()`, counterparty verification accepts both `auth.getName()` and the caller's organizational reference.

#### 2.4 [InvoiceService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/InvoiceService.java)
1. **User Entity Client Resolution:**
   Injected `UserRepository`. Updated `resolveClientIdForAuth(auth)`:
   - Queries `userRepository.findByUsername(username)`.
   - Extracts `user.getClientId()` and validates the active entity in `ClientRepository`.
   - Gracefully falls back to email or client reference lookup if `clientId` is unassigned.
   - Throws `AccessDeniedException` if no valid association exists.

#### 2.5 [DashboardService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/DashboardService.java)
1. **Dashboard Identity Alignment:**
   Injected `UserRepository`. Updated `getClientDashboard` and `getVendorDashboard` to resolve `clientId` and `vendorId` through the persisted user record before querying metrics.

#### 2.6 [DataInitializer.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/DataInitializer.java)
1. **Demo Organizational Seeding:**
   Seeded demo `ClientEntity` and `VendorEntity` records and mapped `client_user.clientId` and `vendor_user.vendorId` for local dev/staging environments.
