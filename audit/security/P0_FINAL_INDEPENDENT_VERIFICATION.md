# ArcheOn Security Audit: Final Independent Verification Post-Remediation

**Document Reference:** `D:\WEBUI\audit\security\P0_FINAL_INDEPENDENT_VERIFICATION.md`  
**Target Repository:** `D:\WEBUI`  
**Audited Branch:** `security/p0-auth-hardening` (Commit: `b1645a3`)  
**Audit Date:** November 18, 2026  
**Auditor:** Independent Principal Security Architect & Code Auditor  
**Audit Mode:** STRICT READ-ONLY AUDIT (Zero modifications to code, tests, migrations, Git history, or configuration)

---

## 1. Executive Summary & Final Verdict

### Final Verdict: **REJECTED**

### Verdict Rationale
A rigorous, read-only forensic inspection of branch `security/p0-auth-hardening` reveals that **the repository is in a broken, non-compiling, and critically vulnerable state**:

1. **Production Code Regression / Uncommitted Patch:**
   In commit `b1645a3`, only test files (`SecurityAndRbacIntegrationTest.java`), audit markdown files, and compiled artifacts in `target/` were committed. **Not a single production Java file in `backend/src/main/java/` was committed.** 
   The production codebase on disk is 100% identical to the initial vulnerable commit `64b2013` (`git diff 64b2013 backend/src/main/java` returns zero differences).
2. **P0 Vulnerabilities Remain Completely Active:**
   - All financial approval routes (`/api/approvals/**`) and financial operations routes (`/api/finance/**`) remain globally accessible via `permitAll()` in `SecurityConfig.java`.
   - `JwtAuthenticationFilter.java` assigns blanket `ROLE_ADMIN` to every authenticated token regardless of claims.
   - Controllers still contain hardcoded fallback identities (`finance_maker`, `finance_checker_1`, `client_user`, `site_supervisor_arun`), allowing completely unauthenticated users to execute administrative mutations.
   - No Broken Object-Level Authorization (BOLA) protection exists.
3. **Broken Build / Test Suite Failure:**
   The test suite **fails to compile**. `SecurityAndRbacIntegrationTest.java` was committed with calls to methods (such as the 6-parameter `initiateBillApproval`) that do not exist in the uncommitted production classes. Running `mvn -f backend/pom.xml test` produces **3 compilation errors** and executes **0 tests**.

---

## 2. Priority 1 — Bill Ownership & Broken Object-Level Authorization (BOLA)

### 2.1 Inspection of `validateBillAccess` and Callers
- **Finding:** The method `validateBillAccess` **does not exist** in `backend/src/main/java/com/webui/backend/service/FinancialOperationsService.java`.
- **Caller State:** None of the controller endpoints (`/dispute`, `/payment-proof`, `/transactions/{billId}`) call any ownership verification logic. Any user—or any unauthenticated caller—can submit payment proofs, trigger disputes, or inspect transactions for any bill across the platform.

### 2.2 Authenticated Principal Mapping to `clientId` and `vendorId`
- **Entity Definition:** `BillApprovalEntity.java` **does not contain a `clientId` field**. Only `vendorId`, `initiatorId`, `billId`, and financial figures are stored.
- **Untrusted Controller Input:** In `FinancialOperationsController.java`:
  - Line 81: `submitProof` accepts `req.getPayerId()` and `req.getPayeeId()` directly from the untrusted JSON payload. If `auth` is null, it falls back to `"client_user"`. The authenticated principal (`auth.getName()`) is never checked against the bill or the transaction.
  - Line 110: `disputeBill` accepts `req.getBillId()` and assigns `actor = auth != null ? auth.getName() : "client_disputer"`, with zero check on whether `actor` is related to the bill.
  - Line 193: `getTransactionsForBill` accepts `@PathVariable String billId` and returns all payment transactions for that bill without checking the requester's identity.

### 2.3 Vulnerability of "First-Access Ownership Establishment" (TOFU)
- **Conceptual Flaw:** In the previously proposed design, unassigned/legacy bills were to be bound to the caller via `bill.setClientId(actorId)` upon first interaction.
- **Security Assessment:** Establishing ownership upon first access represents a critical **Trust-On-First-Use (TOFU) / First-Come-First-Claimed Race Condition**:
  - Any rogue client or automated bot scanning bill IDs can claim unassigned bills by initiating a dispute or querying transactions.
  - Once claimed, the legitimate bill owner is permanently locked out (HTTP 403).
  - Client ownership must **never** be dynamically established on read or mutation. It must be explicitly established at bill ingestion/initiation or mapped from contract/project metadata.

### 2.4 Legacy Bill Inaccessibility
- In the active repository, legacy bills without an assigned owner are accessible to **everyone**, including anonymous users, because `/api/finance/**` is `permitAll()`.
- Unassigned bills must be accessible strictly to internal studio personnel (`ROLE_ADMIN`, `ROLE_FINANCE_MANAGER`, `ROLE_STAFF`) until explicitly associated with a verified client ID by an authorized maker/admin.

### 2.5 Database Schema Migration Status for `clientId`
- **Inspection Result:** **No database migration script exists** in `backend/src/main/resources/` (neither Flyway, Liquibase, nor raw SQL scripts).
- **Configuration Risk:** In `application.yml`, Spring Data JPA relies on `hibernate.ddl-auto: update` against an in-memory H2 database (`jdbc:h2:mem:archeon_db`). In an enterprise PostgreSQL production environment, `ddl-auto: update` is prohibited or disabled. Deploying an entity change without a corresponding `ALTER TABLE bill_approvals ADD COLUMN client_id VARCHAR(255);` migration will result in runtime SQL exceptions (`PSQLException: column "client_id" of relation "bill_approvals" does not exist`).

### 2.6 Race Conditions in Ownership Assignment
- Because no database row-level locking (`SELECT FOR UPDATE`) or transaction isolation beyond default `READ_COMMITTED` exists, if two callers simultaneously interact with an unowned bill, both transactions read `clientId == null`, and the last commit overwrites the first without synchronization.

---

## 3. Priority 2 — Cash Settlement Workflow Audit

### 3.1 Permitted State Transitions
In `FinancialOperationsService.java` (lines 193–223):
```java
@Transactional
public CashSettlementEntity respondToCashSettlement(
        String settlementRef, String counterpartyId, boolean acknowledge, String notes) {
    CashSettlementEntity csh = cashSettlementRepository.findBySettlementRef(settlementRef)
            .orElseThrow(() -> new IllegalArgumentException("Cash settlement not found: " + settlementRef));

    if (!csh.getCounterpartyId().equals(counterpartyId)) {
        throw new IllegalStateException("Only assigned counterparty can respond to cash settlement");
    }

    if (acknowledge) {
        csh.setCounterpartyStatus("ACKNOWLEDGED");
    } else {
        csh.setCounterpartyStatus("REJECTED_CONTESTED");
    }
    csh.setCounterpartyRespondedAt(LocalDateTime.now());
    csh.setCounterpartyNotes(notes);
    return cashSettlementRepository.save(csh);
}
```

### 3.2 Immutability of `SETTLED_VERIFIED` and `REJECTED` Vouchers
- **Audit Finding:** **FAILED.**
- `respondToCashSettlement` **does not inspect `csh.getFinanceApprovalStatus()`**.
- Even after a cash settlement voucher has been formally approved and finalized by finance (`SETTLED_VERIFIED`) or rejected, the counterparty can invoke `/api/finance/cash/{ref}/respond` at any time to flip the status between `ACKNOWLEDGED` and `REJECTED_CONTESTED`.
- This violates forensic finality invariants and enables retrospective tampering with audited cash receipts.

### 3.3 Duplicate Acknowledgements & Cross-Party Validation
- **Duplicate Protection:** **Missing.** The service does not check whether `csh.getCounterpartyStatus()` is already `ACKNOWLEDGED`. Submitting duplicate responses generates redundant audit log entries and updates `counterpartyRespondedAt`.
- **Cross-Party Protection:** While `csh.getCounterpartyId().equals(counterpartyId)` is checked in the service, `FinancialOperationsController.java` (line 139) assigns:
  ```java
  String counterparty = auth != null ? auth.getName() : "VND-082";
  ```
  If called anonymously, the controller impersonates `"VND-082"`.

### 3.4 Concurrency Bypass of State Validation
- There is no `@Version` column on `CashSettlementEntity`. Concurrent requests to `respondToCashSettlement` and `financeApproveCashSettlement` can execute in parallel, leading to race conditions where finance settles an expense while the counterparty is simultaneously contesting it.

---

## 4. Priority 3 — Authorization & RBAC Audit

### 4.1 SecurityConfig Matcher Ordering & Exposure
Inspecting `backend/src/main/java/com/webui/backend/config/SecurityConfig.java` (lines 65–82):
```java
.authorizeHttpRequests(auth -> auth
        // Public Read endpoints
        .requestMatchers(HttpMethod.GET, "/api/projects/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/manifesto/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/approvals/config").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/approvals/**").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/approvals/**").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/leads").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/leads").permitAll()
        .requestMatchers(HttpMethod.PATCH, "/api/leads/**").permitAll()
        .requestMatchers("/api/finance/**").permitAll()
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
        // Admin Mutation endpoints
        .requestMatchers(HttpMethod.POST, "/api/**").hasRole("ADMIN")
        .requestMatchers(HttpMethod.PUT, "/api/**").hasRole("ADMIN")
        .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")
        .anyRequest().authenticated()
);
```

### 4.2 Endpoint Vulnerability Matrix

| Endpoint | HTTP Method | Permitted Roles in Config | Actual Controller Auth Check | Vulnerability Rating |
| :--- | :--- | :--- | :--- | :--- |
| `/api/finance/cash/**` | `GET` | `permitAll()` | None | **CRITICAL** (Full global cash ledger exposed) |
| `/api/finance/cash/initiate` | `POST` | `permitAll()` | Falls back to `site_supervisor_arun` | **CRITICAL** (Anonymous cash disbursement) |
| `/api/finance/cash/{ref}/respond` | `POST` | `permitAll()` | Falls back to `VND-082` | **HIGH** (Anonymous voucher tampering) |
| `/api/finance/cash/{ref}/approve` | `POST` | `permitAll()` | Falls back to `finance_manager` | **CRITICAL** (Anonymous financial settlement) |
| `/api/approvals/initiate` | `POST` | `permitAll()` | Falls back to `finance_maker` | **CRITICAL** (Anonymous bill creation) |
| `/api/approvals/{id}/approve-primary` | `POST` | `permitAll()` | Falls back to `finance_checker_1` | **CRITICAL** (Anonymous maker-checker bypass) |
| `/api/approvals/{id}/approve-secondary`| `POST` | `permitAll()` | Falls back to `finance_checker_2` | **CRITICAL** (Anonymous secondary approval) |
| `/api/approvals/{id}/reject` | `POST` | `permitAll()` | Falls back to `finance_checker_1` | **HIGH** (Anonymous bill rejection) |
| `/api/leads` | `GET` | `permitAll()` | None | **HIGH** (Customer PII leakage) |
| `/api/leads/{id}/status` | `PATCH` | `permitAll()` | None | **HIGH** (Anonymous lead status mutation) |
| `/api/finance/reports/export-bills-csv` | `GET` | `permitAll()` | Falls back to `audit_user` | **CRITICAL** (Global financial data dump) |

### 4.3 Data Leakage in CSV Export
- `GET /api/finance/reports/export-bills-csv` in `FinancialOperationsController.java` (lines 214–245):
  - Completely unprotected (`permitAll()`).
  - Serializes and streams every bill in the database: bill IDs, invoice numbers, vendor IDs, project IDs, bill amounts, paid amounts, outstanding balances, and dispute details.
  - Zero tenant, client, or vendor scoping.

### 4.4 Untrusted Identity Injection via Controllers
All controllers bypass Spring Security principal enforcement by providing hardcoded strings when `auth == null`:
- `BillApprovalController.java`: `finance_maker`, `finance_checker_1`, `finance_checker_2`.
- `FinancialOperationsController.java`: `client_user`, `finance_lead`, `client_disputer`, `site_supervisor_arun`, `VND-082`, `finance_manager`, `audit_user`.
This design completely defeats authentication and enables trivial identity spoofing.

---

## 5. Priority 4 — Concurrency & Database Locking

### 5.1 Maker-Checker Approval Service Race Conditions
In `MakerCheckerApprovalService.java`:
- The service relies solely on `@Transactional` (default `ISOLATION_DEFAULT` / `READ_COMMITTED`).
- **No row-level locking** (`LockModeType.PESSIMISTIC_WRITE`) or `@Version` columns are utilized.
- **Race Condition Vulnerabilities:**
  1. **Dual Primary Approval:** If two requests arrive simultaneously for `approvePrimary`, both read `status = PENDING_PRIMARY`, both pass the validation check, and both write approval timestamps. The second overwrite replaces the primary approver, generating duplicate audit log entries.
  2. **Conflicting Approval vs. Rejection:** If checker A approves while checker B rejects concurrently, non-repeatable reads permit both transactions to commit, resulting in inconsistent state where a bill is marked `APPROVED` but has an audit event for `BILL_REJECTED`.

### 5.2 Assessment of the Proposed `@Version` Migration
- **Architectural Suitability:** Optimistic locking via `@Version` is the correct industry standard for human approval workflows spanning minutes or hours.
- **Actual Database Schema State:**
  - `BillApprovalEntity.java` has no `@Version` field.
  - `CashSettlementEntity.java` has no `@Version` field.
  - `PaymentTransactionEntity.java` has no `@Version` field.
- **Migration Prerequisite:** In production PostgreSQL, adding optimistic locking requires:
  1. A formal Flyway/Liquibase migration script (`ALTER TABLE bill_approvals ADD COLUMN version BIGINT NOT NULL DEFAULT 0;`).
  2. Adding `@Version private Long version;` to the JPA entities.
  3. A global Spring `@ExceptionHandler` catching `ObjectOptimisticLockingFailureException` and returning HTTP 409 Conflict.
- *(Per audit constraints, this migration has not been implemented).*

---

## 6. Priority 5 — JWT Authentication & Token Lifecycle

### 6.1 Token Expiration & Role Validation Inspection
1. **Token Lifespan:** In `application.yml` (line 56), `jwt.expiration-ms` is set to `86400000` (**24 hours**).
2. **Blanket Role Assignment:** In `JwtAuthenticationFilter.java` (lines 34–38):
   ```java
   String username = tokenProvider.getUsernameFromJwt(jwt);

   UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
           username, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")));
   ```
   **Every single authenticated user**—regardless of whether they are a client, vendor, or intern—is granted `ROLE_ADMIN`. The claims inside the JWT are ignored.

### 6.2 Consequences of Demoted or Terminated Accounts
Because access tokens have a 24-hour lifetime and the authentication filter performs no database lookup or token status check:
- An employee terminated or demoted in `UserRepository` retains full administrative access (`ROLE_ADMIN`) for up to 24 hours.
- A compromised JWT token cannot be revoked.
- There is zero binding between the active user account state in PostgreSQL and the token validator.

### 6.3 Verification of Token Revocation Architecture
- In `P0_FINDINGS_REMEDIATION_REPORT.md`, an architectural proposal for Phase 2 involving Redis-backed JTI blacklisting was documented.
- **Audit Confirmation:** This revocation mechanism is **purely conceptual and not implemented in code**. There is no Redis dependency, no JTI claim generation, no token revocation repository, and no revocation check inside `JwtAuthenticationFilter`.

---

## 7. Testing & Build Verification

### 7.1 Automated Test Execution Command
```bash
mvn -f backend/pom.xml test
```

### 7.2 Exact Maven Execution Output
```text
[INFO] -------------------------------------------------------------
[ERROR] COMPILATION ERROR : 
[INFO] -------------------------------------------------------------
[ERROR] /D:/WEBUI/backend/src/test/java/com/webui/backend/security/SecurityAndRbacIntegrationTest.java:[358,24] method initiateBillApproval in class com.webui.backend.service.MakerCheckerApprovalService cannot be applied to given types;
  required: java.lang.String,java.math.BigDecimal,java.lang.String,java.lang.String,java.lang.String
  found:    java.lang.String,java.math.BigDecimal,java.lang.String,java.lang.String,java.lang.String,java.lang.String
  reason: actual and formal argument lists differ in length
[ERROR] /D:/WEBUI/backend/src/test/java/com/webui/backend/security/SecurityAndRbacIntegrationTest.java:[384,24] method initiateBillApproval in class com.webui.backend.service.MakerCheckerApprovalService cannot be applied to given types;
  required: java.lang.String,java.math.BigDecimal,java.lang.String,java.lang.String,java.lang.String
  found:    java.lang.String,java.math.BigDecimal,java.lang.String,java.lang.String,java.lang.String,java.lang.String
  reason: actual and formal argument lists differ in length
[ERROR] /D:/WEBUI/backend/src/test/java/com/webui/backend/security/SecurityAndRbacIntegrationTest.java:[404,24] method initiateBillApproval in class com.webui.backend.service.MakerCheckerApprovalService cannot be applied to given types;
  required: java.lang.String,java.math.BigDecimal,java.lang.String,java.lang.String,java.lang.String
  found:    java.lang.String,java.math.BigDecimal,java.lang.String,java.lang.String,java.lang.String,java.lang.String
  reason: actual and formal argument lists differ in length
[INFO] 3 errors 
[INFO] -------------------------------------------------------------
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 10.243 s
```

### 7.3 Test Execution Summary
- **Tests Executed:** 0 (Build aborted at compile phase).
- **Compilation Failures:** 3.
- **Failures / Errors:** 3 compilation errors in test sources.

### 7.4 Missing Regression Tests
Once the production code is properly restored and committed, the following regression tests must be present:
1. `test_anonymousUserBlockedFromExportBillsCsv_returns401`
2. `test_clientCannotAccessCsvBillExport_returns403`
3. `test_vendorCannotAccessCsvBillExport_returns403`
4. `test_unauthenticatedRequestNeverAssignedFallbackIdentity`
5. `test_concurrentPrimaryApprovalConflict_detectsRaceCondition`
6. `test_tokenWithoutRoleClaim_rejectedOrAssignedMinimalRole`

---

## 8. Remediation Requirements Prior to Re-Audit

To achieve an **ACCEPTED** verdict, the following actions must be executed in order:

1. **Commit All Production Backend Changes:**
   Ensure all modified production files (`SecurityConfig.java`, `JwtAuthenticationFilter.java`, `JwtTokenProvider.java`, `BillApprovalEntity.java`, `MakerCheckerApprovalService.java`, `FinancialOperationsService.java`, `FinancialOperationsController.java`, `BillApprovalController.java`) are staged and committed to the branch.
2. **Eliminate All Hardcoded Identity Fallbacks:**
   Remove all `auth != null ? auth.getName() : "fallback"` logic from all controllers. If `auth == null || !auth.isAuthenticated()`, immediately return HTTP 401 Unauthorized.
3. **Correct Bill Ownership Architecture:**
   - Establish `clientId` during bill creation or via project relation.
   - Prohibit dynamic first-access ownership claiming (TOFU).
   - Ensure unowned legacy bills are accessible only to internal studio staff (`ROLE_ADMIN`, `ROLE_FINANCE_MANAGER`).
4. **Enforce Cash Settlement Finality:**
   In `respondToCashSettlement`, reject mutations if `financeApprovalStatus` is `SETTLED_VERIFIED` or `REJECTED`, and block duplicate state transitions.
5. **Secure All Reports and CSV Exports:**
   Restrict `/api/finance/reports/**` strictly to `ROLE_ADMIN` and `ROLE_FINANCE_MANAGER`.
6. **Verify Compilation and Clean Test Execution:**
   Execute `mvn clean test` and verify that all test classes compile and 100% of integration and domain safety tests pass.
