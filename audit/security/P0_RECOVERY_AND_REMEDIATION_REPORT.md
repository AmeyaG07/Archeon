# ArcheOn Security Report: P0 Recovery, TOFU Hardening & Final Verification

**Document Reference:** `D:\WEBUI\audit\security\P0_RECOVERY_AND_REMEDIATION_REPORT.md`  
**Workspace:** `D:\WEBUI`  
**Branch:** `security/p0-auth-hardening`  
**Execution Date:** November 18, 2026  
**Status:** **RECOVERY COMPLETED, HARDENED & VERIFIED — ALL 38 TESTS PASSING**

---

## 1. Executive Summary & Outcome

Following the controlled recovery directive, the 8 missing production Java files were successfully extracted from the Antigravity execution transcript archive, restored to the working tree, and hardened against architectural vulnerabilities.

### Summary of Actions Taken:
1. **Source Recovery:** All 8 production Java files restored from preserved execution diff (step 1546), verified with `git apply --check` (exit code 0).
2. **TOFU Vulnerability Eliminated:** Completely removed Trust-On-First-Use (`bill.setClientId(actorId)`) from `FinancialOperationsService.java`. Unassigned legacy bills now remain unassigned and are strictly restricted to authorized internal staff.
3. **Database Migration Script Created:** Added `backend/src/main/resources/db/migration/V1__add_client_id_to_bill_approvals.sql` with explicit column and index creation, eliminating dependency on Hibernate `ddl-auto: update` for production PostgreSQL deployments.
4. **CSV Export Authorization Hardened:** Restricted `/api/finance/reports/export-bills-csv` both at the Spring Security filter chain (`hasAnyRole("ADMIN", "FINANCE_MANAGER", "FINANCE_AUDIT", "STAFF")`) and via controller authentication validation.
5. **Comprehensive Test Suite Passing:** Clean execution of `mvn -f backend/pom.xml clean test` passed **38 tests with 0 failures and 0 errors** (`BUILD SUCCESS`).

---

## 2. Inventory of Restored Production Files

| Restored File Path | Key Changes Restored & Verified |
| :--- | :--- |
| `backend/src/main/java/com/webui/backend/config/SecurityConfig.java` | Matcher specificity enforced; anonymous access removed from `/api/approvals/**`, `/api/finance/**`, `/api/leads`; `GET /api/finance/cash/**` restricted to internal staff; reports restricted; `/api/finance/bills/**` routed to controller for BOLA checks. |
| `backend/src/main/java/com/webui/backend/security/JwtAuthenticationFilter.java` | Blanket `ROLE_ADMIN` assignment removed; role claim extracted dynamically via `tokenProvider.getRoleFromJwt(jwt)` and mapped to `ROLE_<ROLE>`. Empty authorities assigned if role missing. |
| `backend/src/main/java/com/webui/backend/security/JwtTokenProvider.java` | Added `getRoleFromJwt(String token)` to extract `"role"` claim from signed HMAC-SHA256 tokens. |
| `backend/src/main/java/com/webui/backend/model/BillApprovalEntity.java` | Added `private String clientId` with `@Column(name = "client_id")` for explicit client ownership. |
| `backend/src/main/java/com/webui/backend/service/MakerCheckerApprovalService.java` | Overloaded `initiateBillApproval` to accept and persist `clientId` during bill creation. |
| `backend/src/main/java/com/webui/backend/controller/BillApprovalController.java` | Removed hardcoded fallback identities (`finance_maker`, `finance_checker_1`, etc.); bound `clientId` from `InitiateRequest`; returns 401 if unauthenticated. |
| `backend/src/main/java/com/webui/backend/service/FinancialOperationsService.java` | Implemented `validateBillAccess` without TOFU; terminal finality enforced on `SETTLED_VERIFIED` and `REJECTED` cash vouchers; duplicate cash response rejection enforced. |
| `backend/src/main/java/com/webui/backend/controller/FinancialOperationsController.java` | Removed 7 hardcoded fallback identities; returns 401 on unauthenticated mutations; maps `AccessDeniedException` to HTTP 403 Forbidden on `/dispute`, `/payment-proof`, and `/bills/{billId}/transactions`. |

---

## 3. TOFU (Trust-On-First-Use) Removal & Bill Ownership Hardening

### 3.1 Vulnerability Elimination in `FinancialOperationsService.java`
The previously proposed fallback that dynamically bound unassigned legacy bills to the first interacting client (`bill.setClientId(actorId)`) has been **completely removed**.

```java
// Hardened validateBillAccess Implementation:
// 4. Designated Client (Explicit verified ownership only; NO first-access binding)
if (bill.getClientId() != null && bill.getClientId().equalsIgnoreCase(actorId)) {
    return;
}

// 5. Client who has an existing verified payment transaction recorded on this bill
boolean hasExistingTransaction = paymentTransactionRepository.findByBillIdOrderByCreatedAtDesc(bill.getBillId())
        .stream().anyMatch(tx -> tx.getPayerId() != null && tx.getPayerId().equalsIgnoreCase(actorId));
if (hasExistingTransaction) {
    return;
}

// Unassigned legacy bills (clientId == null) and unauthorized third parties are strictly denied access
throw new org.springframework.security.access.AccessDeniedException(
        "Access denied: Principal '" + actorId + "' is not authorized to access or mutate bill " + bill.getBillId());
```

### 3.2 Invariant Verification:
- **New Bills:** Receive verified client ownership during initiation via `initiateBillApproval(..., clientId, ...)`.
- **Legacy Unassigned Bills (`clientId == null`):** Remain unassigned in the database.
- **Client/Vendor Access:** Any external client or vendor attempting to dispute, query transactions, or upload proof for an unassigned bill is rejected with **HTTP 403 Forbidden**.
- **Internal Staff Access:** Internal studio roles (`ROLE_ADMIN`, `ROLE_FINANCE_MANAGER`, `ROLE_STAFF`) retain administrative access to unassigned legacy bills.

---

## 4. Database Schema Migration

Created production Flyway/Liquibase compatible migration script:
**File:** `backend/src/main/resources/db/migration/V1__add_client_id_to_bill_approvals.sql`

```sql
-- ArcheOn Database Schema Migration
-- V1: Add client_id column to bill_approvals for explicit client ownership

ALTER TABLE bill_approvals ADD COLUMN IF NOT EXISTS client_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_bill_approvals_client_id ON bill_approvals(client_id);
```

This guarantees schema compatibility for PostgreSQL production environments without reliance on Hibernate `ddl-auto: update`.

---

## 5. Verification of Security Invariants

| Invariant | Implementation Mechanism | Verified Status |
| :--- | :--- | :---: |
| **Anonymous Rejection (401)** | `SecurityConfig` filter chain + controller `auth == null` checks | **PASS** (SEC-01, SEC-02, SEC-03, CSV-01) |
| **Role Claim Extraction** | `JwtAuthenticationFilter` reads `role` claim from JWT payload | **PASS** (SEC-09, SEC-10) |
| **No Blanket ROLE_ADMIN** | Users with `ROLE_CLIENT` only receive `ROLE_CLIENT` | **PASS** (SEC-09) |
| **Zero Fallback Identities** | All controller endpoints derive identity strictly from `auth.getName()` | **PASS** (SEC-12, SEC-13, CSV-01) |
| **Cash Register RBAC** | `GET /api/finance/cash/**` restricted to internal staff | **PASS** (FINDING-02 tests) |
| **CSV Export Restriction** | Anonymous (401), Client/Vendor (403), Admin/Finance (200) | **PASS** (CSV-01) |
| **Settled Voucher Finality** | Mutating `SETTLED_VERIFIED` or `REJECTED` voucher throws HTTP 400 | **PASS** (FINDING-04) |
| **Duplicate Ack Blocked** | Acknowledging an acknowledged voucher throws HTTP 400 | **PASS** (FINDING-04) |
| **Maker != Checker** | Initiator cannot approve own bill | **PASS** (SEC-12) |
| **Two Checkers for High-Value**| Primary approver cannot act as secondary approver | **PASS** (SEC-13) |
| **Zero TOFU Ownership** | First access never claims bill; legacy bills stay unassigned | **PASS** (FINDING-03-HARDEN) |

---

## 6. Test Execution & Build Verification

### 6.1 Clean Build Command
```bash
mvn -f backend/pom.xml clean test
```

### 6.2 Test Suite Execution Output
```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 38, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total time:  47.205 s
[INFO] Finished at: 2026-11-18T13:22:59+05:30
[INFO] ------------------------------------------------------------------------
```

### 6.3 Test Catalog

#### `SecurityAndRbacIntegrationTest` (26 Tests — ALL PASS)
1. `SEC-01`: Anonymous financial approval requests rejected with HTTP 401
2. `SEC-02`: Anonymous financial operations mutations rejected with HTTP 401
3. `SEC-03`: Anonymous CRM lead mutations (PATCH) rejected with HTTP 401
4. `SEC-04`: Public consultation enquiry (POST /api/leads) permitted with HTTP 200
5. `SEC-05`: Public project catalogue (GET /api/projects/**) permitted with HTTP 200
6. `SEC-06`: Public manifesto content (GET /api/manifesto/**) permitted with HTTP 200
7. `SEC-07`: Client role blocked from GET /api/leads with HTTP 403
8. `SEC-08`: Studio staff permitted to access GET /api/leads with HTTP 200
9. `SEC-09`: Valid CLIENT token extracts ROLE_CLIENT and is blocked from ADMIN endpoints
10. `SEC-10`: Valid ADMIN token extracts ROLE_ADMIN and accesses admin endpoints
11. `SEC-11`: Invalid or malformed JWT token is rejected with HTTP 401 Unauthorized
12. `SEC-12`: Maker cannot approve own bill (Maker != Checker HTTP 400 enforcement)
13. `SEC-13`: High-Value bill requires two distinct checkers (Primary != Secondary)
14. `SEC-14`: Authorized staff can access approvals, cash entries, and aging reports
15. `FINDING-02`: Client role is strictly blocked (HTTP 403) from global cash registers
16. `FINDING-02`: Vendor role is strictly blocked (HTTP 403) from global cash registers
17. `FINDING-02`: FINANCE_MANAGER role successfully accesses cash registers
18. `FINDING-02`: SITE_SUPERVISOR role successfully accesses cash registers
19. `FINDING-03`: Unauthorized cross-client cannot dispute bill (HTTP 403), authorized owner can (HTTP 200)
20. `FINDING-03`: Unauthorized vendor cannot view bill transactions (HTTP 403), assigned vendor can (HTTP 200)
21. `FINDING-03`: Unauthorized client cannot submit payment proof for another client's bill (HTTP 403)
22. `FINDING-04`: Cannot mutate settled cash voucher or submit duplicate acknowledgement (HTTP 400)
23. `FINDING-03-HARDEN`: Unassigned legacy bill is inaccessible to clients/vendors, accessible to internal staff
24. `FINDING-03-HARDEN`: Client cannot claim unassigned bill via first access (Zero TOFU)
25. `CSV-01`: Anonymous and client/vendor roles blocked from financial CSV export; staff/admin allowed
26. `CONCUR-01`: Conflicting or duplicate primary approval is rejected with HTTP 400

#### `MakerCheckerAndSafetyInvariantsTest` (12 Tests — ALL PASS)
1. `SEC-01`: Maker-Checker Separation of Duties (Maker cannot approve)
2. `SEC-02`: Two distinct checkers required for High-Value bills (>₹1,00,000)
3. `SEC-03`: Low-Value bill (<=₹1,00,000) requires single checker
4. `SEC-04`: Cumulative Anti-Split detection triggers High-Value threshold
5. `SEC-05`: Duplicate primary approval blocked
6. `SEC-06`: Premature secondary approval blocked
7. `SEC-07`: Cash settlement two-party mutual acknowledgement
8. `SEC-08`: High-value cash settlement requires Senior Finance Approval
9. `SEC-09`: WhatsApp automation kill-switch verified
10. `SEC-10`: Inbound WhatsApp webhook accepts proof to staging without mutating status
11. `FIN-11`: Payment Proof Submission -> Reconciled Partial Payment -> Full Settlement
12. `FIN-12`: Two-Party Cash Settlement Protocol requires mutual counterparty ack before finance approval

---

## 7. Status & Handoff

- **Branch:** `security/p0-auth-hardening`
- **Main Branch:** Untouched (no merge performed).
- **Frontend Workspace:** Untouched.
- **Ready For:** Final Independent Security Review.
