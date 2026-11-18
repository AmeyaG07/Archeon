# ArcheOn Design Studio — P0 Backend Security Remediation Assessment & Plan
**Audit Date:** November 18, 2026  
**Auditor Role:** Senior Security Architect & Backend Engineering Specialist  
**Target Repository:** `D:\WEBUI\backend` (Spring Boot 3.4.3 / Java 21 / PostgreSQL / Spring Security 6)  
**Execution Mode:** **STRICT READ-ONLY AUDIT** (No source files or configurations have been altered)  

---

## 1. Executive Summary & Critical Vulnerability Matrix

A focused, code-level security investigation was performed across the backend authentication, authorization, and financial processing architecture. The local backend exhibits a critical architectural discrepancy: while the **service layer** (`MakerCheckerApprovalService.java` and `FinancialOperationsService.java`) implements robust forensic checks and state machines, the **HTTP transport and controller layer** (`SecurityConfig.java`, `BillApprovalController.java`, and `FinancialOperationsController.java`) was configured with permissive bypasses that completely undermine the security boundary.

```
+-----------------------------------------------------------------------------------------------------------------------+
|                                             CRITICAL VULNERABILITY MATRIX                                             |
+--------+----------+--------------------------------------------------------------+---------------+--------------------+
| REF    | SEVERITY | VULNERABILITY TITLE                                          | EXPLOITABLE?  | PRIMARY IMPACT     |
+--------+----------+--------------------------------------------------------------+---------------+--------------------+
| VULN-1 | P0 CRIT  | Anonymous Access to Financial Approvals (/api/approvals/**)  | YES (Over HTTP| Unauthorized Bills |
| VULN-2 | P0 CRIT  | Anonymous Access to Financial Operations (/api/finance/**)   | YES (Over HTTP| Unauthorized Cash  |
| VULN-3 | P0 CRIT  | Anonymous Data Leakage & Status Tampering on CRM Leads       | YES (Over HTTP| DPDP Act Violation |
| VULN-4 | P0 CRIT  | Silent Hardcoded Identity Fallback in Controllers            | YES (Over HTTP| Audit Falsification|
| VULN-5 | P0 CRIT  | Maker-Checker Separation of Duties Defeated via Mock Users   | YES (Over HTTP| Self-Approval      |
| VULN-6 | P0 CRIT  | Blanket ROLE_ADMIN Privilege Elevation in JwtAuthFilter      | YES (Post-Auth| Horizontal/Vertical|
| VULN-7 | P1 HIGH  | Absence of Granular Financial Roles in Seed Data / IAM       | ARCHITECTURAL | Role Misalignment  |
+--------+----------+--------------------------------------------------------------+---------------+--------------------+
```

---

## 2. Detailed Technical Findings & Code-Level Evidence

### VULN-1: Anonymous Mutation Access to `/api/approvals/**`
- **Source File:** `D:\WEBUIackend\src\main\java\com\webuiackend\config\SecurityConfig.java`
- **Exact Lines:** Lines 68–70
- **Verified Code:**
  ```java
  .requestMatchers(HttpMethod.GET, "/api/approvals/config").permitAll()
  .requestMatchers(HttpMethod.GET, "/api/approvals/**").permitAll()
  .requestMatchers(HttpMethod.POST, "/api/approvals/**").permitAll()
  ```
- **Exploitability:** **YES (Confirmed Over HTTP)**. Any network client on the local network or internet can dispatch unauthenticated HTTP POST requests to:
  - `POST /api/approvals/initiate`
  - `POST /api/approvals/{billId}/approve-primary`
  - `POST /api/approvals/{billId}/approve-secondary`
  - `POST /api/approvals/{billId}/reject`
- **Observed Impact:** An anonymous attacker can initiate arbitrary vendor bills, approve tier-1 invoices, approve tier-2 high-value invoices (over ₹1,00,000), or reject legitimate studio bills without providing a JWT token or user credentials.
- **Root Cause:** Permissive `permitAll()` wildcard applied to `POST` requests in the Spring Security filter chain during rapid development.
- **Safest Correction:**
  1. Restrict `GET /api/approvals/config` to `permitAll()` (or authenticated studio users).
  2. Enforce `.hasAnyRole("ADMIN", "FINANCE_CHECKER", "FINANCE_MANAGER")` on all approval mutation endpoints.
  3. Disallow unauthenticated access across the entire `/api/approvals/**` namespace.
- **Required Regression Tests:**
  - MockMvc test verifying that `POST /api/approvals/{billId}/approve-primary` without an `Authorization` header returns `HTTP 401 Unauthorized`.
  - MockMvc test verifying that a user with `ROLE_CLIENT` returns `HTTP 403 Forbidden`.

---

### VULN-2: Anonymous Access to Financial Operations (`/api/finance/**`)
- **Source File:** `D:\WEBUIackend\src\main\java\com\webuiackend\config\SecurityConfig.java`
- **Exact Line:** Line 74
- **Verified Code:**
  ```java
  .requestMatchers("/api/finance/**").permitAll()
  ```
- **Exploitability:** **YES (Confirmed Over HTTP)**. This single rule completely removes all authentication checks from all HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) across the entire financial operations suite:
  - `POST /api/finance/payment-proof`
  - `POST /api/finance/verify-payment/{transactionId}`
  - `POST /api/finance/dispute`
  - `POST /api/finance/cash/initiate`
  - `POST /api/finance/cash/{ref}/respond`
  - `POST /api/finance/cash/{ref}/approve`
  - `GET /api/finance/cash/all`
  - `GET /api/finance/transactions/{billId}`
  - `GET /api/finance/reports/aging-receivables`
  - `GET /api/finance/reports/export-bills-csv`
- **Observed Impact:**
  1. An anonymous user can approve physical cash register disbursements (`/api/finance/cash/{ref}/approve`).
  2. An anonymous user can mark payment transactions as verified (`/api/finance/verify-payment/{id}`).
  3. An anonymous user can download full CSV export ledgers containing vendor IDs, bill totals, and timestamps (`/api/finance/reports/export-bills-csv`).
- **Safest Correction:**
  1. Partition `/api/finance/**` by role:
     - Cash initiation: `hasAnyRole("ADMIN", "SITE_SUPERVISOR")`
     - Cash counterparty ack: `hasAnyRole("ADMIN", "VENDOR")`
     - Cash finance approval: `hasAnyRole("ADMIN", "FINANCE_MANAGER")`
     - Payment proof submission: `hasAnyRole("ADMIN", "CLIENT", "VENDOR")`
     - Payment reconciliation: `hasAnyRole("ADMIN", "FINANCE_LEAD")`
     - Financial reports & CSV export: `hasAnyRole("ADMIN", "FINANCE_AUDIT")`
- **Required Regression Tests:**
  - MockMvc test verifying `GET /api/finance/reports/export-bills-csv` without authentication returns `HTTP 401`.
  - MockMvc test verifying `POST /api/finance/cash/{ref}/approve` without `ROLE_FINANCE_MANAGER` or `ROLE_ADMIN` returns `HTTP 403`.

---

### VULN-3: Anonymous Data Leakage & Status Tampering on CRM Leads (`/api/leads/**`)
- **Source File:** `D:\WEBUIackend\src\main\java\com\webuiackend\config\SecurityConfig.java`
- **Exact Lines:** Lines 71–73
- **Verified Code:**
  ```java
  .requestMatchers(HttpMethod.POST, "/api/leads").permitAll()
  .requestMatchers(HttpMethod.GET, "/api/leads").permitAll()
  .requestMatchers(HttpMethod.PATCH, "/api/leads/**").permitAll()
  ```
- **Exploitability:** **YES (Confirmed Over HTTP)**.
- **Observed Impact:**
  1. **Data Leakage (DPDP Act 2023 Violation):** `GET /api/leads` allows unauthenticated crawlers or competitors to harvest prospective client names, mobile numbers, email addresses, geographic locations, and architectural budgets.
  2. **Tampering:** `PATCH /api/leads/{id}/status` allows anonymous parties to corrupt client lead statuses (e.g., mark active leads as `Lost`).
- **Safest Correction:**
  - Keep `POST /api/leads` as `permitAll()` (public prospective inquiry form).
  - Restrict `GET /api/leads` and `PATCH /api/leads/**` strictly to authenticated users with `ROLE_ADMIN` or `ROLE_STUDIO_STAFF`.
- **Required Regression Tests:**
  - Public test: `POST /api/leads` returns `HTTP 200` without credentials.
  - Protected test: `GET /api/leads` returns `HTTP 401` without credentials.
  - Protected test: `PATCH /api/leads/{id}/status` returns `HTTP 401` without credentials.

---

### VULN-4: Silent Hardcoded Identity Fallback in Controllers
- **Source Files & Exact Lines:**
  - `D:\WEBUIackend\src\main\java\com\webuiackend\controller\BillApprovalController.java`:
    - Line 77: `String actor = auth != null ? auth.getName() : "finance_maker";`
    - Line 86: `String approver = auth != null ? auth.getName() : "finance_checker_1";`
    - Line 97: `String approver = auth != null ? auth.getName() : "finance_checker_2";`
    - Line 107: `String rejecter = auth != null ? auth.getName() : "finance_reviewer";`
  - `D:\WEBUIackend\src\main\java\com\webuiackend\controller\FinancialOperationsController.java`:
    - Line 80: `String actor = auth != null ? auth.getName() : (req.getPayerId() != null ? req.getPayerId() : "client_user");`
    - Line 93: `String verifier = auth != null ? auth.getName() : "finance_lead";`
    - Line 107: `String actor = auth != null ? auth.getName() : "client_disputer";`
    - Line 117: `String initiator = auth != null ? auth.getName() : "site_supervisor_arun";`
    - Line 129: `String counterparty = auth != null ? auth.getName() : "VND-082";`
    - Line 140: `String approver = auth != null ? auth.getName() : "finance_manager";`
    - Line 194: `String actor = auth != null ? auth.getName() : "audit_user";`
- **Exploitability:** **YES (Confirmed Over HTTP)**.
- **Observed Impact:**
  When `Authentication auth` is `null` (because Spring Security allowed anonymous ingress), the controllers do not abort with `HTTP 401 Unauthorized`. Instead, they synthesize artificial identities.
  1. **Audit Contamination:** All events written to `AuditEventEntity` log these fake identities (`"actorId": "finance_checker_1"`), completely destroying legal and forensic non-repudiation.
  2. **Audit Header Falsification:** In `exportBillsCsv`, the CSV header outputs: `Exported By: audit_user`, concealing the true caller identity.
- **Safest Correction:**
  - Never allow controllers to fabricate identities.
  - Inject `Principal` or `@AuthenticationPrincipal` into controller methods.
  - If `auth == null || !auth.isAuthenticated()`, throw an `AccessDeniedException` or return `ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()`.
- **Required Regression Tests:**
  - Controller test asserting that calling `approvePrimary` with null authentication immediately results in `401 Unauthorized` without calling the service layer.

---

### VULN-5: Maker-Checker Separation of Duties Bypass via Fallback Identities
- **Source Files & Exact Lines:**
  - `BillApprovalController.java` (Lines 77, 86, 97)
  - `MakerCheckerApprovalService.java` (Lines 80–83, 129–134)
- **Verified Code in Service:**
  ```java
  // approvePrimary invariant
  if (approverId.equals(approval.getInitiatorId())) {
      throw new IllegalStateException("Security Invariant Violation: Transaction initiator cannot approve their own bill (Maker != Checker).");
  }

  // approveSecondary invariant
  if (approverId.equals(approval.getInitiatorId())) {
      throw new IllegalStateException("Security Invariant Violation: Initiator cannot act as secondary approver.");
  }
  if (approverId.equals(approval.getPrimaryApproverId())) {
      throw new IllegalStateException("Security Invariant Violation: Secondary approver must be distinct from primary approver.");
  }
  ```
- **Exploitability:** **YES (Confirmed Over HTTP)**.
- **Observed Impact:**
  The service layer logic is sound: it ensures `initiatorId != primaryApproverId` and `primaryApproverId != secondaryApproverId`.
  However, because `BillApprovalController` supplies:
  - Step 1 (Initiate): `"finance_maker"`
  - Step 2 (Primary): `"finance_checker_1"`
  - Step 3 (Secondary): `"finance_checker_2"`
  An anonymous caller can execute all 3 HTTP calls in sequence for a ₹5,00,000 bill. Since the strings `"finance_maker"`, `"finance_checker_1"`, and `"finance_checker_2"` are distinct from each other, the service checks pass completely! A single untrusted user can self-initiate and self-approve high-value bills without any human intervention.
- **Safest Correction:**
  - Bind `initiatorId`, `primaryApproverId`, and `secondaryApproverId` directly to the verified username from the validated JWT token (`auth.getName()`).
  - Require separate authenticated sessions for each stage.
- **Required Regression Tests:**
  - End-to-end integration test proving that a user logged in as `maker_user` who attempts to call `/api/approvals/{id}/approve-primary` is rejected with `HTTP 400 Bad Request` / `IllegalStateException`.

---

### VULN-6: Blanket `ROLE_ADMIN` Privilege Elevation in `JwtAuthenticationFilter`
- **Source File:** `D:\WEBUIackend\src\main\java\com\webuiackend\security\JwtAuthenticationFilter.java`
- **Exact Line:** Line 35
- **Verified Code:**
  ```java
  if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
      String username = tokenProvider.getUsernameFromJwt(jwt);

      UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
              username, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")));
      authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

      SecurityContextHolder.getContext().setAuthentication(authentication);
  }
  ```
- **Exploitability:** **YES (Post-Authentication)**.
- **Observed Impact:**
  `JwtTokenProvider.java` embeds a `role` claim in the JWT during login (`.claim("role", role)`).
  However, `JwtAuthenticationFilter` completely ignores this claim and hardcodes `new SimpleGrantedAuthority("ROLE_ADMIN")` for **every** authenticated user.
  - A client logging in as `client:client123` is granted `ROLE_ADMIN`.
  - A vendor logging in as `vendor:vendor123` is granted `ROLE_ADMIN`.
  - Any valid credential on the platform immediately gains full administrative privileges.
- **Safest Correction:**
  Extract the role claim from the JWT token and map it directly to the user's granted authorities:
  ```java
  String role = tokenProvider.getRoleFromJwt(jwt);
  List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));
  ```
- **Required Regression Tests:**
  - Unit test verifying `JwtAuthenticationFilter` grants `ROLE_CLIENT` when the JWT contains `role = "ROLE_CLIENT"`.
  - MockMvc test verifying that a client token cannot access admin mutation endpoints.

---

### VULN-7: Absence of Granular Financial Roles in Database / IAM
- **Source File:** `D:\WEBUIackend\src\main\java\com\webuiackend\config\DataInitializer.java`
- **Exact Lines:** Lines 42–61
- **Verified Code:**
  Only 3 users are seeded: `admin` (`ROLE_ADMIN`), `client` (`ROLE_CLIENT`), and `vendor` (`ROLE_VENDOR`).
- **Architectural Gap:**
  The Maker-Checker rule requires distinct operational roles:
  - `ROLE_FINANCE_MAKER` (can initiate bills)
  - `ROLE_FINANCE_CHECKER` (can perform tier-1 approvals)
  - `ROLE_FINANCE_MANAGER` (can perform tier-2 approvals and cash settlements)
  - `ROLE_SITE_SUPERVISOR` (can initiate cash register entries)
- **Safest Correction:**
  Update `DataInitializer.java` to seed designated role accounts (or dynamic users) for testing Maker-Checker workflows without relying on a monolithic `admin` account.

---

## 3. Forensic Review of Payment Reconciliation & Safety Safeguards

### Analysis of `FinancialOperationsService.java`:
The service layer was audited to determine whether any vulnerability exists that could prematurely mark bills as paid.

1. **Section 9.3 Invariant (Payment Proof Attachments):**
   - Lines 40–82: When a client or vendor uploads payment proof (`submitPaymentProof`), the transaction is created with status `SUBMITTED_FOR_VERIFICATION`.
   - The bill transitions to `PAYMENT_PROOF_SUBMITTED`. It is **NEVER** marked as `PAID`.
   - This invariant is **FULLY PRESERVED AND VERIFIED**.
2. **Bank Reconciliation Safeguard:**
   - Lines 88–120: Only when a finance officer executes `verifyPayment` does the transaction mark `VERIFIED_PAID`.
   - The bill's `paidAmount` is updated with `amount.setScale(2, RoundingMode.HALF_UP)`.
   - If `paidAmount >= totalAmount`, the status transitions to `PAID`. If `paidAmount < totalAmount`, it transitions to `PARTIALLY_PAID`.
   - This invariant is **FULLY PRESERVED AND VERIFIED**.
3. **Section 11 Invariant (Two-Party Physical Cash Settlements):**
   - Lines 160–220: Physical cash settlements require two distinct steps before studio approval:
     1. Initiation by site supervisor (`INITIATED`, `PENDING_VENDOR_ACK`).
     2. Acknowledgment by vendor counterparty (`ACKNOWLEDGED` or `DISPUTED`).
   - Line 205: `if (!"ACKNOWLEDGED".equals(settlement.getCounterpartyStatus())) throw new IllegalStateException(...)`
   - Finance cannot approve cash unless the counterparty has explicitly acknowledged receipt.
   - This invariant is **FULLY PRESERVED AND VERIFIED**.
4. **WhatsApp Automation Invariant (`WhatsAppCloudApiAdapter.java`):**
   - Inbound webhook evidence (`processInboundEvidenceWebhook`) stages media with status `PENDING_FINANCE_VERIFICATION` and creates an audit record. It never triggers automated bill settlement.
   - This invariant is **FULLY PRESERVED AND VERIFIED**.

> [!NOTE]
> **Summary on Reconciliation Logic:** The core business and financial service logic is secure, defensively designed, and adheres strictly to Indian accounting and forensic standards. The vulnerability resides entirely in the HTTP exposure and unauthenticated controller bindings.

---

## 4. Prioritized Remediation Roadmap

```
                                    REMEDIATION TIMELINE & ROADMAP
                                    
  [ PHASE 1: IMMEDIATE / P0 ] ───────► [ PHASE 2: SHORT-TERM / P1 ] ───────► [ PHASE 3: VERIFICATION / P2 ]
  • Remove .permitAll() from Approvals  • Extract JWT Role Claim in Filter   • 145 Domain Regression Tests
  • Remove .permitAll() from Finance    • Introduce Granular Finance Roles   • MockMvc HTTP 401/403 Tests
  • Lock Down GET/PATCH /api/leads      • Bind Frontend Admin JWT Bearer     • Forensic Audit Trail Check
  • Eliminate Hardcoded Fallback IDs    • Remove ignoreBuildErrors: true     • Final Production Gate Sign-off
```

### Phase 1: Immediate P0 Remediation (Backend Security Hardening)
1. **Remediate `SecurityConfig.java`:**
   - Remove `permitAll()` on `POST /api/approvals/**`, `/api/finance/**`, `GET /api/leads`, and `PATCH /api/leads/**`.
   - Enforce `.authenticated()` or specific roles (`ROLE_ADMIN`, `ROLE_FINANCE`) on all state-mutating endpoints.
2. **Remediate `BillApprovalController.java` & `FinancialOperationsController.java`:**
   - Eliminate all fallback assignments (`String approver = auth != null ? auth.getName() : "finance_checker_1"`).
   - If `auth == null || !auth.isAuthenticated()`, return `ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()`.
3. **Remediate `JwtAuthenticationFilter.java`:**
   - Read the actual `role` claim from the validated JWT token rather than hardcoding `ROLE_ADMIN`.

### Phase 2: Frontend Client Integration & Configuration Hardening
1. **Update `src/app/admin/page.tsx`:**
   - Store and retrieve the JWT authentication token from secure storage.
   - Attach `headers: { "Authorization": `Bearer ${token}` }` to all 10 API calls.
   - Parameterize backend URL using `process.env.NEXT_PUBLIC_API_URL`.
2. **Repair TypeScript Errors & Enforce Build Checks:**
   - Fix `runAction` duplicate function in `AdminClientManagement.tsx`.
   - Fix missing `ShieldCheck` import in `AdminDashboardOverview.tsx`.
   - Remove `typescript: { ignoreBuildErrors: true }` from `next.config.ts`.

### Phase 3: Comprehensive Regression Testing
1. Execute full backend test suite (`mvn test`) covering all existing service tests and new `MockMvc` security tests.
2. Verify that existing invariants in `MakerCheckerAndSafetyInvariantsTest.java` remain 100% passing.

---

## 5. Required Regression Test Specifications

The following test suite must be added to `src/test/java/com/webui/backend/security/SecurityAndRbacIntegrationTest.java`:

```java
@SpringBootTest
@AutoConfigureMockMvc
public class SecurityAndRbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // SEC-TEST-01: Anonymous approval must return 401
    @Test
    void unauthenticatedApprovalRequest_Returns401() throws Exception {
        mockMvc.perform(post("/api/approvals/BILL-001/approve-primary"))
                .andExpect(status().isUnauthorized());
    }

    // SEC-TEST-02: Anonymous finance cash approval must return 401
    @Test
    void unauthenticatedCashApproval_Returns401() throws Exception {
        mockMvc.perform(post("/api/finance/cash/CSH-001/approve"))
                .andExpect(status().isUnauthorized());
    }

    // SEC-TEST-03: Anonymous lead harvest must return 401
    @Test
    void unauthenticatedLeadQuery_Returns401() throws Exception {
        mockMvc.perform(get("/api/leads"))
                .andExpect(status().isUnauthorized());
    }

    // SEC-TEST-04: Client role cannot execute finance approval (403)
    @Test
    @WithMockUser(username = "client_user", roles = {"CLIENT"})
    void clientRoleAttemptingFinanceApproval_Returns403() throws Exception {
        mockMvc.perform(post("/api/approvals/BILL-001/approve-primary"))
                .andExpect(status().isForbidden());
    }

    // SEC-TEST-05: Authenticated admin can approve
    @Test
    @WithMockUser(username = "finance_lead", roles = {"ADMIN"})
    void adminUserApproval_Succeeds() throws Exception {
        // Assert successful primary approval
    }
}
```

---

## 6. Architectural Sign-Off & Implementation Gate

> [!IMPORTANT]
> **READ-ONLY AUDIT COMPLETION CONFIRMATION:**  
> In compliance with strict audit instructions, **ZERO** source code modifications, database changes, or mock authentication bypasses have been introduced during this assessment.  
>  
> The vulnerability assessment and remediation architecture detailed above are documented in:  
> `D:\WEBUIudit\security\P0_SECURITY_REMEDIATION_PLAN.md`  
>  
> **Next Action:** Awaiting explicit stakeholder approval before applying the Phase 1 backend remediation patches.
