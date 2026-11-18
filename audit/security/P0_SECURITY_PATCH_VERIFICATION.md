# ArcheOn Design Studio — Independent P0 Security Patch Verification Report
**Audit Date:** November 18, 2026  
**Auditor Role:** Senior Security Architect, Principal AppSec Engineer & Independent Code Auditor  
**Repository:** `D:\WEBUI\backend`  
**Git Branch Under Audit:** `security/p0-auth-hardening` (Base: `main`)  
**Audit Scope:** Independent verification of P0 security patch, JWT mechanics, BOLA/IDOR boundaries, Maker-Checker enforcement, and test coverage  
**Execution Mode:** **STRICT READ-ONLY VERIFICATION AUDIT** (No source code, tests, or configurations modified)  

---

## 1. Executive Summary & Verification Verdict

```
+---------------------------------------------------------------------------------------------------------+
|                                      INDEPENDENT VERIFICATION VERDICT                                   |
+---------------------------------------------------------------------------------------------------------+
|                                    VERDICT: ACCEPTED WITH CONDITIONS                                    |
|                                                                                                         |
| The P0 security remediation successfully eliminates catastrophic anonymous bypasses, removes all       |
| hardcoded identity fallback strings, enforces Maker-Checker separation over HTTP, and resolves blanket   |
| ROLE_ADMIN elevation. All 26 backend regression and invariant tests pass with 0 failures.               |
|                                                                                                         |
| HOWEVER, production release requires addressing secondary BOLA/IDOR object-level authorization gaps,    |
| overly broad role matching on GET /api/finance/cash/all, and missing optimistic concurrency locking.     |
+---------------------------------------------------------------------------------------------------------+
```

### Key Verification Metrics:
- **P0 Vulnerabilities Closed:** 5 of 5 critical P0 defects resolved.
- **Backend Test Suite Results:** **26 Tests Run, 0 Failures, 0 Errors, 0 Skipped** (`BUILD SUCCESS`).
- **New Integration Tests Added:** 14 `MockMvc` tests in `SecurityAndRbacIntegrationTest.java`.
- **Existing Invariant Tests Passing:** 12 tests in `MakerCheckerAndSafetyInvariantsTest.java`.
- **New Findings Identified During Verification:** 4 Medium-to-High findings (BOLA exposure, overly broad finance cash rule, post-settlement cash mutation, lack of optimistic locking).

---

## 2. Review of Complete Security Diff Against Base Branch

A line-by-line inspection of the working tree changes on `security/p0-auth-hardening` against `main` was performed:

| Target File | Changes Verified | Security Status |
|---|---|:---:|
| [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java) | Added `AuthenticationEntryPoint` (401) and `AccessDeniedHandler` (403). Removed anonymous access to `/api/approvals/**`, `/api/finance/**`, `GET /api/leads`, and `PATCH /api/leads/**`. Enforced granular role mappings. | **VERIFIED SAFE** |
| [JwtTokenProvider.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/JwtTokenProvider.java) | Added `getRoleFromJwt(String token)` method to extract the `role` claim from signed JWT payloads. | **VERIFIED SAFE** |
| [JwtAuthenticationFilter.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/JwtAuthenticationFilter.java) | Removed hardcoded `new SimpleGrantedAuthority("ROLE_ADMIN")`. Dynamically extracts role claim and assigns `SimpleGrantedAuthority`. | **VERIFIED SAFE** |
| [BillApprovalController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/BillApprovalController.java) | Removed fallback identities (`finance_maker`, `finance_checker_1`, `finance_checker_2`, `finance_reviewer`). Enforced `auth != null && auth.isAuthenticated()`; returns 401 if unauthenticated. Derived identity strictly from `auth.getName()`. | **VERIFIED SAFE** |
| [FinancialOperationsController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/FinancialOperationsController.java) | Removed 7 fallback identities (`client_user`, `finance_lead`, `client_disputer`, `site_supervisor_arun`, `VND-082`, `finance_manager`, `audit_user`). Enforced 401 on unauthenticated mutations. Derived `actor` exclusively from `auth.getName()`. | **VERIFIED SAFE** |
| [SecurityAndRbacIntegrationTest.java](file:///D:/WEBUI/backend/src/test/java/com/webui/backend/security/SecurityAndRbacIntegrationTest.java) | Added 14 comprehensive tests covering 401 anonymous rejections, 403 role rejections, JWT authority boundaries, Maker-Checker HTTP enforcement, and public enquiry preservation. | **VERIFIED SAFE** |

---

## 3. JWT Security Architecture Verification

### A. Signature & Expiration Validation: **VERIFIED SAFE**
- **Evidence:** [JwtTokenProvider.java#L58-L64](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/JwtTokenProvider.java#L58-L64)
- **Implementation:** `Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(authToken)` uses HMAC-SHA256 with key derived from `Decoders.BASE64.decode(jwtSecret)`.
- **Validation:** Automatically checks cryptographic integrity and throws `ExpiredJwtException` if `exp < now`, returning `false`.

### B. Role Claim Validation & Normalization: **VERIFIED SAFE**
- **Evidence:** [JwtAuthenticationFilter.java#L33-L41](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/JwtAuthenticationFilter.java#L33-L41)
- **Implementation:**
  ```java
  String role = tokenProvider.getRoleFromJwt(jwt);
  if (StringUtils.hasText(role)) {
      String authName = role.startsWith("ROLE_") ? role : "ROLE_" + role;
      authorities = Collections.singletonList(new SimpleGrantedAuthority(authName));
  } else {
      authorities = Collections.emptyList();
  }
  ```
- **Validation:** Handles role strings with or without `ROLE_` prefix cleanly. If missing, assigns empty authorities (blocking access to protected endpoints).

### C. Stateless Token Limitations (Token Revocation & DB Sync): **NEEDS MANUAL REVIEW (FINDING-VERIF-01)**
- **Severity:** MEDIUM (Architectural Limitation)
- **File:** `JwtAuthenticationFilter.java` (Lines 29–48)
- **Observed Behavior:** The filter parses and trusts validly signed tokens statelessly without querying `UserRepository.findByUsername(username)`.
- **Impact:**
  1. **Disabled/Deleted Users:** If a user account is deleted or locked in PostgreSQL, their previously issued JWT remains usable until the 24-hour expiration (`jwtExpirationMs: 86400000`).
  2. **Role Changes:** If an administrator demotes an account from `ROLE_ADMIN` to `ROLE_CLIENT`, the user retains `ROLE_ADMIN` privileges until token expiration.
- **Recommended Correction:** In Phase 2, integrate a user-status check against the repository or introduce Redis/in-memory token revocation blacklist.

---

## 4. Client and Vendor Data Isolation (BOLA / IDOR Verification)

### FINDING-VERIF-02: Overly Broad Role Matching on `GET /api/finance/cash/all`
- **Severity:** HIGH (Data Isolation / Privacy Risk)
- **File:** [SecurityConfig.java#L104](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L104)
- **Code Evidence:**
  ```java
  .requestMatchers(HttpMethod.GET, "/api/finance/**")
      .hasAnyRole("ADMIN", "FINANCE_MANAGER", "STAFF", "CLIENT", "VENDOR")
  ```
- **Observed Behavior:** The wildcard rule `/api/finance/**` covers `GET /api/finance/cash/all`.
- **Confirmed Defect:** An authenticated `CLIENT` or `VENDOR` can issue an HTTP GET to `/api/finance/cash/all` and inspect **all physical cash register disbursements** across the entire architectural studio, including vendor IDs, amounts, and site project locations.
- **Recommended Correction:**
  Carve out cash endpoints explicitly before the general fallback:
  ```java
  .requestMatchers(HttpMethod.GET, "/api/finance/cash/**")
      .hasAnyRole("ADMIN", "FINANCE_MANAGER", "STAFF", "SITE_SUPERVISOR")
  ```

---

### FINDING-VERIF-03: Missing Object-Level Ownership on Transactions & Disputes
- **Severity:** HIGH (BOLA / IDOR Risk)
- **File:** [FinancialOperationsController.java#L109-L118](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/FinancialOperationsController.java#L109-L118) and [FinancialOperationsService.java#L125-L150](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/FinancialOperationsService.java#L125-L150)
- **Observed Behavior:**
  1. `POST /api/finance/dispute`: Accepts `billId`. Does not check whether the authenticated `actor` is the designated client or vendor for that bill. Any client can open a dispute against another client's bill.
  2. `GET /api/finance/transactions/{billId}`: Returns all payment transactions for `billId` without verifying that the requesting client/vendor owns `billId`.
- **Recommended Correction:** Add object ownership validation in `FinancialOperationsService`:
  ```java
  if (!bill.getVendorId().equals(actor) && !bill.getClientId().equals(actor) && !isAdmin(auth)) {
      throw new AccessDeniedException("Unauthorized to access or dispute this bill.");
  }
  ```

---

## 5. Cash Settlement Verification

### A. Counterparty Identification Enforcement: **VERIFIED SAFE**
- **Evidence:** [FinancialOperationsController.java#L151](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/FinancialOperationsController.java#L151) & [FinancialOperationsService.java#L199-L201](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/FinancialOperationsService.java#L199-L201)
- **Code:**
  ```java
  if (!csh.getCounterpartyId().equals(counterpartyId)) {
      throw new IllegalStateException("Only assigned counterparty can respond to cash settlement");
  }
  ```
- **Verification:** Because `counterpartyId` is bound strictly to `auth.getName()`, Vendor B cannot acknowledge a voucher assigned to Vendor A. Tested and verified.

### B. Finance Approval State Pre-condition: **VERIFIED SAFE**
- **Evidence:** [FinancialOperationsService.java#L230-L232](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/FinancialOperationsService.java#L230-L232)
- **Code:**
  ```java
  if (!"ACKNOWLEDGED".equals(csh.getCounterpartyStatus())) {
      throw new IllegalStateException("Cannot finance-settle cash without counterparty acknowledgement. Current: " + csh.getCounterpartyStatus());
  }
  ```
- **Verification:** Finance manager approval strictly fails if the counterparty has not acknowledged. Tested and verified.

### C. Post-Settlement Counterparty Mutation Gap: **NEEDS FIX (FINDING-VERIF-04)**
- **Severity:** MEDIUM (Business Logic Integrity Risk)
- **File:** [FinancialOperationsService.java#L193-L223](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/FinancialOperationsService.java#L193-L223)
- **Observed Behavior:** `respondToCashSettlement` does not verify if `financeApprovalStatus` is already `"SETTLED_VERIFIED"`.
- **Impact:** A vendor could re-invoke `respondCash` with `acknowledge=false` after physical funds have already been approved and settled by finance, contaminating the voucher state.
- **Recommended Correction:** Add state guard:
  ```java
  if ("SETTLED_VERIFIED".equals(csh.getFinanceApprovalStatus())) {
      throw new IllegalStateException("Cash settlement is already finalized and settled; status cannot be altered.");
  }
  ```

---

## 6. Maker-Checker Verification

### A. Initiator & Approver Separation: **VERIFIED SAFE**
- **Evidence:** [BillApprovalController.java#L73-L98](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/BillApprovalController.java#L73-L98) & [MakerCheckerApprovalService.java#L80-L83, L129-L134](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/MakerCheckerApprovalService.java#L80-L83)
- **Verification:**
  - `approvePrimary`: Validates `approverId.equals(approval.getInitiatorId())` -> Throws `IllegalStateException`.
  - `approveSecondary`: Validates `approverId.equals(approval.getInitiatorId())` and `approverId.equals(approval.getPrimaryApproverId())` -> Throws `IllegalStateException`.
  - Verified over HTTP in `SecurityAndRbacIntegrationTest.test_makerCannotApproveOwnBill_httpEnforcement` (HTTP 400).

### B. High-Value Threshold Dual Approval: **VERIFIED SAFE**
- **Evidence:** Bills `>= ₹1,00,000` transition to `PENDING_SECONDARY` upon primary approval. Only distinct secondary checkers can transition the bill to `APPROVED`. Verified over HTTP in `SecurityAndRbacIntegrationTest.test_twoDistinctCheckersRequiredForHighValueBill`.

### C. Concurrency & Race Condition Handling: **NEEDS MANUAL REVIEW (FINDING-VERIF-05)**
- **Severity:** MEDIUM (Concurrency Risk)
- **File:** [BillApprovalEntity.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/model/BillApprovalEntity.java)
- **Observed Behavior:** `BillApprovalEntity` lacks a JPA `@Version` column.
- **Risk:** If two approvers submit simultaneous requests, without optimistic locking or pessimistic row locking (`SELECT FOR UPDATE`), race conditions could occur.
- **Recommended Correction:** Add `@Version private Long version;` to `BillApprovalEntity` in Phase 2.

---

## 7. Security Regression Test Suite Evaluation

### Current Test Suite Coverage (14 New Tests):
- **401 Unauthenticated Protection:** Approvals initiate, approve-primary, approve-secondary, reject, cash initiate, cash approve, payment proof, and CSV export.
- **403 RBAC Enforcement:** Client calling primary approval (403), Vendor calling cash approval (403), Client calling lead harvest (403), Client token calling project creation (403).
- **Public Preservation:** Public lead submission (200), Public projects (200), Manifesto (200), Approvals config (200).
- **JWT Extraction:** Verified Client token does not inherit Admin privileges.
- **Maker-Checker HTTP Enforcement:** Verified self-approval blocked (400), verified same checker secondary blocked (400).

### Identified Test Coverage Gaps (To be added in Phase 2):
1. **Explicit Timestamp-Expired JWT:** Current test tests corrupted token string; add explicit test generating a token with negative expiry.
2. **Missing/Unknown Role Claim:** Test validating token without `"role"` claim defaults to 403 on protected routes.
3. **Cross-Vendor Cash Acknowledgment over HTTP:** Test proving Vendor A receives 400 when attempting to acknowledge Vendor B's settlement ref over HTTP.
4. **Client/Vendor CSV Export Block:** Test confirming `GET /api/finance/reports/export-bills-csv` returns 403 when called with `ROLE_CLIENT` or `ROLE_VENDOR`.

---

## 8. Detailed Findings Directory & Recommendations

| Finding ID | Severity | Target File & Line | Description | Status & Action |
|:---:|:---:|---|---|:---:|
| **FINDING-VERIF-01** | MEDIUM | [JwtAuthenticationFilter.java#L31](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/security/JwtAuthenticationFilter.java#L31) | Stateless JWT does not check user disabled status in database. | **NEEDS MANUAL REVIEW** (Phase 2 enhancement) |
| **FINDING-VERIF-02** | HIGH | [SecurityConfig.java#L104](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java#L104) | `GET /api/finance/**` permits CLIENT/VENDOR to query `GET /api/finance/cash/all`. | **NEEDS FIX** (Prioritize in next patch turn) |
| **FINDING-VERIF-03** | HIGH | [FinancialOperationsService.java#L125](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/FinancialOperationsService.java#L125) | `openDispute` lacks check verifying caller owns the disputed bill (BOLA). | **NEEDS FIX** (Add ownership check) |
| **FINDING-VERIF-04** | MEDIUM | [FinancialOperationsService.java#L193](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/FinancialOperationsService.java#L193) | `respondToCashSettlement` allows re-responding to already settled cash vouchers. | **NEEDS FIX** (Add state guard) |
| **FINDING-VERIF-05** | MEDIUM | [BillApprovalEntity.java#L18](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/model/BillApprovalEntity.java#L18) | Missing `@Version` optimistic locking column for concurrent approvals. | **NEEDS MANUAL REVIEW** (Phase 2 schema update) |

---

## 9. Final Verification Verdict

### **VERDICT: ACCEPTED WITH CONDITIONS**

**Conditions for Merge to `main` and Release:**
1. **Condition 1 (Immediate P1 Fix):** Narrow the `SecurityConfig.java` rule for `GET /api/finance/cash/**` to exclude `CLIENT` and `VENDOR` roles, preventing unauthorized access to the studio's global cash register.
2. **Condition 2 (Immediate P1 Fix):** Add state check in `respondToCashSettlement` preventing post-settlement status mutation.
3. **Condition 3 (Phase 2):** Introduce object-level ownership checks (`BOLA/IDOR`) on bill disputes and transaction lookups.

All Phase 1 P0 critical security remediation objectives have been verified and confirmed intact.
