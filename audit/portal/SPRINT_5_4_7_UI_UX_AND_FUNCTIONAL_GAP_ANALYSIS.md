# ARCHÉON — SPRINT 5.4.7
## UI/UX, Contract Mismatches & Functional Gap Analysis

**Project:** ArcheOn Design Studio  
**Audit Target:** Frontend-Backend Integration, User Experience & Contract Boundaries  
**Repository:** `D:\WEBUI`  
**Date:** 2026-11-19  
**Execution Mode:** Controlled Live Staging Testing (Read-Only)

---

### 1. Executive Summary

This report synthesizes all architectural gaps, API contract discrepancies, session management vulnerabilities, and UX edge cases identified during the live staging audit of the ArcheOn web platform.

While the visual design system, typography, color palette, and component structure exhibit world-class architectural studio aesthetic standards, **several concrete integration disconnects prevent the live portals from operating smoothly.**

---

### 2. Comprehensive Discrepancy & Gap Inventory

| Discrepancy ID | Category | Location | Defect Description | User / System Impact |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | Routing / API | [app/admin/approvals/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/approvals/page.tsx#L29) | Frontend requests `GET /api/approvals`. Controller only defines `GET /api/approvals/all`. | Triggers 401 error dispatch, terminates admin session, and kicks admin to `/login`. |
| **GAP-02** | Routing / API | [app/admin/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/page.tsx#L35) | Frontend requests `GET /api/projects/operational`. Controller is `@RequestMapping("/api/operational-projects")`. | Returns 404; active projects widget displays empty. |
| **GAP-03** | Service Logic | [InvoiceService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/InvoiceService.java#L254) | `resolveClientIdForAuth` calls `findByEmail(auth.getName())` using the username rather than looking up `user.getClientId()`. | Clients cannot view their own invoices at `/client/invoices`; triggers 401 and logs out client. |
| **GAP-04** | Security / RBAC | [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L174) | `GET /api/finance/cash/**` excludes `ROLE_VENDOR`. | Vendors navigating to `/vendor/cash-settlements` receive 401/403 and are logged out. |
| **GAP-05** | Security / RBAC | [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L166-L170) | `ROLE_VENDOR` is excluded from `GET /api/approvals/**` and `POST /api/approvals/initiate`. | Trade vendors cannot view or submit bills at `/vendor/invoices`. |
| **GAP-06** | Frontend Auth | [frontend/src/lib/api.ts](file:///D:/WEBUI/frontend/src/lib/api.ts#L181-L184) | Automatically executes `clearAuthSession()` on any HTTP 401 without distinguishing true session expiration from error dispatch failures. | Causes sudden, unexpected logout whenever any unmapped route or Spring error occurs. |
| **GAP-07** | Hardcoded URL | [ConsultationModal.tsx](file:///D:/WEBUI/frontend/src/components/ui/ConsultationModal.tsx#L39) | Direct call to `http://localhost:8080/api/leads` instead of using dynamic `resolveApiBaseUrl()`. | Breaks consultation form submission in deployed staging or production environments. |
| **GAP-08** | Routing / API | [app/admin/clients/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/clients/page.tsx#L70-L77) | "Invite Client" button calls `/api/invitations/client/${id}` instead of `POST /api/clients/{id}/invite`. | Clicking "Invite Client" in the admin directory fails silently with 404. |
| **GAP-09** | Routing / API | [app/admin/vendors/page.tsx](file:///D:/WEBUI/frontend/src/app/admin/vendors/page.tsx#L73-L80) | "Invite Vendor" button calls `/api/invitations/vendor/${id}` instead of `POST /api/vendors/{id}/invite`. | Clicking "Invite Vendor" in the admin directory fails silently with 404. |
| **GAP-10** | Database Seeding | [DataInitializer.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/DataInitializer.java#L55-L65) | Seeded demo users `client_user` and `vendor_user` have `clientId = null` and `vendorId = null`. | Seeded demo accounts cannot view `/client/profile` or `/vendor/profile` (403 Forbidden). |

---

### 3. Detailed Root-Cause Analyses

#### 3.1 The Error Dispatch Session Wipe Loop (GAP-01 & GAP-06)
1. Next.js page requests an unmapped or restricted API endpoint (e.g. `GET /api/approvals`).
2. Spring Boot cannot locate a handler method and dispatches an internal error to `/error`.
3. In [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java), `/error` is not in `.permitAll()`.
4. Spring Security's `authenticationEntryPoint` triggers and writes `HttpServletResponse.SC_UNAUTHORIZED` (401).
5. The frontend `apiFetch` in `api.ts` catches 401, invokes `clearAuthSession()`, and throws `AuthError`.
6. The user is redirected to `/login`, losing their current workspace context.

#### 3.2 Client Invoice Resolution Flaw (GAP-03)
When a client logs in, Spring Security's `Authentication` object stores their chosen username (e.g. `alice_client`). In `InvoiceService.java`, line 254:
```java
private UUID resolveClientIdForAuth(Authentication auth) {
    String username = auth.getName();
    return clientRepository.findByEmail(username)
            .map(ClientEntity::getId)
            .orElseThrow(() -> new AccessDeniedException("Client profile not found for principal: " + username));
}
```
Because `username` is `"alice_client"` (not `"alice.smith@studioarcheon.com"`), `clientRepository.findByEmail("alice_client")` fails. 

**Correct Resolution Logic:**
```java
private UUID resolveClientIdForAuth(Authentication auth) {
    String username = auth.getName();
    UserEntity user = userRepository.findByUsername(username)
            .orElseThrow(() -> new AccessDeniedException("User not found: " + username));
    if (user.getClientId() != null) {
        return user.getClientId();
    }
    return clientRepository.findByEmail(user.getEmail())
            .map(ClientEntity::getId)
            .orElseThrow(() -> new AccessDeniedException("Client profile not found for user: " + username));
}
```

---

### 4. UI/UX Quality & Visual Polish Assessment

- **Typography & Proportions:** Excellent. Serif headings paired with sans-serif body and monospace code/amounts create an authoritative architectural studio brand.
- **Color Discipline:** Strict adherence to `#111111` (primary obsidian), `#25221D` (warm charcoal), `#F8F6F0` (creamy plaster), and bronze accents. No arbitrary saturated colors.
- **Micro-Interactions:** Smooth transitions on tabs, badges, modals, and collapsible sidebars.
- **Error Feedback:** Modals and forms display clear inline error alerts when payload validation fails.
- **Tolerant Fallbacks:** Most dashboard overview widgets contain resilient try-catch wrappers, ensuring that a single failing sub-metric does not crash the entire portal page.
