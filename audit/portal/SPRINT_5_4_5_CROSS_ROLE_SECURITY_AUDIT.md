# ARCHÉON — SPRINT 5.4.5
## Cross-Role Security, RBAC & Isolation Audit Report

**Project:** ArcheOn Design Studio  
**Audit Target:** Role Boundaries, RBAC Enforcement, IDOR Resistance & Token Lifecycles  
**Roles Tested:** `ROLE_ADMIN`, `ROLE_CLIENT`, `ROLE_VENDOR`, `ANONYMOUS`  
**Repository:** `D:\WEBUI`  
**Date:** 2026-11-19  
**Execution Mode:** Controlled Live Staging Testing (Read-Only)

---

### 1. Executive Summary

A comprehensive security audit was executed across all user roles to verify strict boundary enforcement, multi-tenant isolation, privilege escalation resistance, Insecure Direct Object Reference (IDOR) protection, and token lifecycles. 

The security foundation is **exceptionally robust** at the service and data layer: no privilege escalation was possible, client and vendor tenants cannot inspect each other's financial or operational records, and cryptographic tokens cannot be forged or tampered with. However, an **architectural error dispatch anomaly** in Spring Security's configuration transforms HTTP 403 Forbidden responses into HTTP 401 Unauthorized, creating a cascading session logout defect in the frontend.

---

### 2. Empirical RBAC Testing Matrix

The following tests were executed live against `http://localhost:8080`:

| Test ID | Origin Actor | Target Endpoint & Method | Intended Access | Expected Code | Live HTTP Code | Isolation Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | `ROLE_CLIENT` | `GET /api/dashboards/admin` | Studio Overview | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-02** | `ROLE_CLIENT` | `GET /api/admin/audit` | Audit Log Center | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-03** | `ROLE_CLIENT` | `GET /api/users` | All Platform Users | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-04** | `ROLE_CLIENT` | `GET /api/clients` | All Studio Clients | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-05** | `ROLE_CLIENT` | `GET /api/vendors` | All Trade Vendors | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-06** | `ROLE_CLIENT` | `GET /api/finance/cash/all` | Cash Register | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-07** | `ROLE_CLIENT` | `POST /api/invoices` | Create Tax Invoice | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-08** | `ROLE_CLIENT` | `GET /api/dashboards/vendor` | Vendor Dashboard | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-09** | `ROLE_CLIENT` | `GET /api/vendors/me` | Vendor Profile | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-10** | `ROLE_VENDOR` | `GET /api/dashboards/admin` | Studio Overview | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-11** | `ROLE_VENDOR` | `GET /api/admin/audit` | Audit Log Center | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-12** | `ROLE_VENDOR` | `GET /api/users` | All Platform Users | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-13** | `ROLE_VENDOR` | `GET /api/clients` | All Studio Clients | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-14** | `ROLE_VENDOR` | `GET /api/clients/me` | Client Profile | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-15** | `ROLE_VENDOR` | `GET /api/invoices` | Client Tax Invoices | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-16** | `ROLE_VENDOR` | `GET /api/dashboards/client` | Client Dashboard | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-17** | `ROLE_VENDOR` | `POST /api/clients` | Create Client Org | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-18** | `ROLE_VENDOR` | `POST /api/vendors` | Create Vendor Org | 403 Forbidden | **401 Unauthorized\*** | **ACCESS BLOCKED** |
| **SEC-19** | `ANONYMOUS` | `GET /api/dashboards/admin` | Admin Dashboard | 401 Unauthorized | **401 Unauthorized** | **ACCESS BLOCKED** |
| **SEC-20** | `ANONYMOUS` | `GET /api/dashboards/client` | Client Dashboard | 401 Unauthorized | **401 Unauthorized** | **ACCESS BLOCKED** |
| **SEC-21** | `ANONYMOUS` | `GET /api/dashboards/vendor` | Vendor Dashboard | 401 Unauthorized | **401 Unauthorized** | **ACCESS BLOCKED** |
| **SEC-22** | `ANONYMOUS` | `GET /api/users/me` | Current User Info | 401 Unauthorized | **401 Unauthorized** | **ACCESS BLOCKED** |
| **SEC-23** | `ANONYMOUS` | `GET /api/notifications` | Notifications | 401 Unauthorized | **401 Unauthorized** | **ACCESS BLOCKED** |
| **SEC-24** | `TAMPERED_JWT` | `GET /api/dashboards/admin` | Admin Dashboard | 401 Unauthorized | **401 Unauthorized** | **ACCESS BLOCKED** |

*\*Note on Live HTTP Code 401 instead of 403: Explained in Section 3.*

---

### 3. The Error Dispatch & Session Wipe Cascade

#### 3.1 Architecture Analysis
In [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L65-L70):
```java
.exceptionHandling(exceptions -> exceptions
    .authenticationEntryPoint((request, response, authException) ->
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: " + authException.getMessage()))
    .accessDeniedHandler((request, response, accessDeniedException) ->
        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden: " + accessDeniedException.getMessage()))
)
```
When an authenticated user without required permissions invokes a protected URL:
1. Spring Security's `accessDeniedHandler` correctly issues `response.sendError(SC_FORBIDDEN)`.
2. In Java Servlet specification, `sendError` initiates an internal error dispatch to `/error`.
3. In [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L198), the fallback rule is `.anyRequest().authenticated()`, and `/error` is **not** included in the `.permitAll()` list.
4. Because the error dispatch does not re-evaluate the original bearer token during container dispatch, Spring Security triggers `authenticationEntryPoint`, overriding the 403 and emitting **HTTP 401**.

#### 3.2 Frontend Impact
In [frontend/src/lib/api.ts](file:///D:/WEBUI/frontend/src/lib/api.ts#L181-L184):
```ts
if (response.status === 401) {
  clearAuthSession();
  throw new AuthError("Session expired or unauthorized. Please log in again.", await response.json().catch(() => ({})));
}
```
Whenever an authenticated Client or Vendor inadvertently hits a route or API that returns a permission error, the frontend treats the resulting 401 as a token expiration and **wipes the user's active session**, redirecting them to `/login`.

#### 3.3 Required Remediation
In `SecurityConfig.java`, permit `/error` explicitly:
```java
.requestMatchers("/error").permitAll()
```
And customize `accessDeniedHandler` to write a direct JSON response (`HttpServletResponse.SC_FORBIDDEN`) to the output stream rather than delegating via `sendError`.

---

### 4. IDOR (Insecure Direct Object Reference) Verification

1. **Client Invoice Access:** Tested in [InvoiceService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/InvoiceService.java#L251-L260):
   ```java
   private void validateClientAccess(InvoiceEntity invoice, Authentication auth) {
       if (isAdminOrFinance(auth)) return;
       if (isClientRole(auth)) {
           UUID callerClientId = resolveClientIdForAuth(auth);
           if (invoice.getClient() == null || !invoice.getClient().getId().equals(callerClientId)) {
               throw new AccessDeniedException("Access denied: Invoice does not belong to authenticated client");
           }
       }
   }
   ```
   A client attempting to request another client's invoice by ID (`GET /api/invoices/{foreignId}`) or download its PDF is strictly rejected.
2. **DMS Document Isolation:** Verified in [DocumentController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/DocumentController.java). Documents marked for Client A are inaccessible to Client B or unauthorized trade vendors.

---

### 5. Cryptographic & Token Security Invariants

1. **Algorithm & Signature:** Tokens use standard HMAC-SHA256 (`HS256`). Forged headers or mutated payload bytes fail verification immediately.
2. **Token Versioning:** The `users.token_version` column increments on global session revocation (`POST /api/auth/logout-all`), invalidating all issued access tokens instantly.
3. **Invitation Sealing:** Invitation tokens are never stored in plaintext in the database. Tokens are hashed with SHA-256 (`token_hash`) upon generation; the raw token is only returned to the creating admin once upon issuance.
