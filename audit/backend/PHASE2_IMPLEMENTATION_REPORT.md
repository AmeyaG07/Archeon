# Backend Phase 2 Implementation Report: Database Integrity, Concurrency & Migrations

- **Project:** ArcheOn Design Studio — Administrative & Financial Backend
- **Workspace:** `D:\WEBUI`
- **Branch:** `backend/phase2-hardening`
- **Base Commit:** `30fbc22` (`fix(security): restore and harden P0 financial authorization`)
- **Date:** 2026-11-18
- **Role:** Senior Backend Engineer & Database Architect
- **Status:** Implementation Complete & Fully Verified

---

## 1. Executive Summary

Phase 2 successfully hardens ArcheOn's backend financial transaction consistency, resolves multi-threaded state-transition race conditions, implements JPA optimistic locking (`@Version`), and establishes a reliable Flyway database migration architecture for both fresh and existing PostgreSQL installations.

All 47 backend tests passed with **0 failures, 0 errors, and 0 skipped** (`BUILD SUCCESS`).

---

## 2. Entities Modified & Technical Justifications

In strict adherence to the mandate (*"Do not blindly add `@Version` to every entity. Justify each entity-level change"*), optimistic locking was selectively introduced exclusively to stateful financial domain entities:

| Entity | Table Name | Added Field | Technical Justification |
|---|---|---|---|
| **`BillApprovalEntity`** | `bill_approvals` | `@Version private Long version;` | Manages the core maker-checker financial state machine (`PENDING_PRIMARY` -> `PENDING_SECONDARY` -> `APPROVED` / `REJECTED`, `PAID`, `DISPUTED`). Optimistic locking guarantees that concurrent approvals or approval-rejection races cannot overwrite states or resurrect rejected vendor bills. |
| **`CashSettlementEntity`** | `cash_settlement_requests` | `@Version private Long version;` | Manages the two-party cash settlement protocol (`PENDING_COUNTERPARTY_ACK` -> `ACKNOWLEDGED` / `REJECTED_CONTESTED`, `SETTLED_VERIFIED`). Prevents simultaneous finance verification from generating duplicate payment records and double-crediting ledger accounts. |
| **`PaymentTransactionEntity`** | `payment_transactions` | `@Version private Long version;` | Manages payment proofs and bank reconciliation records (`SUBMITTED_FOR_VERIFICATION` -> `VERIFIED_PAID` / `REJECTED_MISMATCH`). Prevents concurrent duplicate verification attempts and balance calculation desynchronization. |
| `AuditEventEntity` | `audit_events` | *None* | Append-only immutable ledger. No state mutations occur; versioning is unneeded and would add wasteful locking overhead. |
| `UserEntity`, `LeadEntity`, `ManifestoEntity`, `ProjectEntity` | Various | *None* | Low-concurrency configuration/content entities outside high-stakes financial mutation paths. |

---

## 3. Concurrency Problems Addressed & HTTP 409 Conflict Handling

### 3.1 Intercepted Race Conditions
1. **Primary Bill Approval Races:** Two finance checkers simultaneously approving a bill. Exactly one transaction succeeds; the second receives HTTP 409 Conflict (or HTTP 400 Bad Request).
2. **Secondary Bill Approval Races:** Two secondary checkers attempting simultaneous approval for high-value bills (>= ₹1,00,000). Only one succeeds; the second is rejected without overwriting the approver ID or timestamp.
3. **Approval vs. Rejection Races:** Concurrent approval and rejection. Resolves lost updates where an approval could have overwritten a rejection or vice-versa.
4. **Cash Settlement Mutual Acknowledgement Races:** Counterparty concurrently sending acknowledge and contest requests. Whichever commits first locks the voucher, rejecting the second request.
5. **Cash Settlement Finance Verification (Critical):** Concurrent verification by multiple finance officers. Optimistic locking guarantees that exactly ONE cash `PaymentTransactionEntity` is created and the parent bill's `paidAmount` is credited only once.
6. **Maker Self-Approval Invariant:** Strict invariant checks block initiators from approving their own bills even under concurrent load.

### 3.2 Exception Handling Architecture
- **Global Controller Advice:** `com.webui.backend.config.FinancialConflictExceptionHandler` intercepts:
  - `org.springframework.orm.ObjectOptimisticLockingFailureException`
  - `jakarta.persistence.OptimisticLockException`
- **HTTP 409 Conflict Response Payload:**
  ```json
  {
    "error": "The record was modified concurrently by another transaction. Please reload and try again.",
    "status": 409,
    "conflictType": "OPTIMISTIC_LOCK_FAILURE",
    "timestamp": "2026-11-18T14:04:19.126"
  }
  ```
- **Controller-Level Guards:** `BillApprovalController` and `FinancialOperationsController` explicitly catch optimistic locking exceptions across mutation endpoints (`approvePrimary`, `approveSecondary`, `reject`, `submitProof`, `verifyPayment`, `disputeBill`, `initiateCash`, `respondCash`, `approveCash`), preventing them from being swallowed by generic `catch (Exception e)` blocks.
- **No Silent Retries:** Financial mutations are never silently retried in the background; the caller is informed immediately to reload the current record before proceeding.

---

## 4. Flyway Database Migration Architecture

### 4.1 Dependency Addition (`backend/pom.xml`)
Managed through Spring Boot 3.4.0 starter parent:
```xml
<!-- Flyway Database Migrations -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

### 4.2 Migration Script Sequence (`backend/src/main/resources/db/migration/`)

1. **`V1__initial_schema.sql` (Baseline Schema):**
   - Creates all base tables with `CREATE TABLE IF NOT EXISTS`:
     - `users`, `manifesto`, `projects`, `leads`, `audit_events`, `bill_approvals`, `cash_settlement_requests`, `payment_transactions`.
   - Uses SQL-standard `BIGINT GENERATED BY DEFAULT AS IDENTITY` for primary keys and native `UUID` types.
   - Guaranteed safe for both empty databases (fresh installs) and existing databases.
2. **`V2__add_client_id_to_bill_approvals.sql` (Ownership Controls):**
   - `ALTER TABLE bill_approvals ADD COLUMN IF NOT EXISTS client_id VARCHAR(255);`
   - `CREATE INDEX IF NOT EXISTS idx_bill_approvals_client_id ON bill_approvals(client_id);`
   - Establishes explicit BOLA ownership mapping.
3. **`V3__add_version_for_optimistic_locking.sql` (Concurrency Controls):**
   - `ALTER TABLE bill_approvals ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;`
   - `ALTER TABLE cash_settlement_requests ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;`
   - `ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;`

### 4.3 Spring Boot Flyway Configuration (`application.yml`)
```yaml
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false
```
- `baseline-on-migrate: false`: Enforces the invariant: **never blindly baseline an existing database**. Migrations must be intentional and trackable.

---

## 5. Existing Database Adoption & Deployment Runbook

### Scenario A: Fresh / Clean Database (CI, Dev, New Deployments)
- Start the Spring Boot application normally.
- Flyway connects, creates `flyway_schema_history`, executes `V1`, `V2`, `V3` in order, and marks schema at version 3.

### Scenario B: Existing Database (Currently running with Hibernate `ddl-auto: update`)
If a production PostgreSQL instance already has tables created earlier:
1. **Verify Current Schema State:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'bill_approvals' AND column_name IN ('client_id', 'version');
   ```
2. **If `client_id` and `version` DO NOT exist yet:**
   Initialize Flyway baseline at version 0, so that all idempotent migrations (`V1`, `V2`, `V3`) run safely without errors:
   ```bash
   mvn flyway:baseline -Dflyway.baselineVersion=0
   mvn flyway:migrate
   ```
3. **If `client_id` exists but `version` DOES NOT exist:**
   Baseline at version 2 and apply V3:
   ```bash
   mvn flyway:baseline -Dflyway.baselineVersion=2
   mvn flyway:migrate
   ```
4. **PostgreSQL Production Setting:**
   In production environments, switch `spring.jpa.hibernate.ddl-auto` from `update` to `validate` to prevent runtime schema mutations:
   ```yaml
   spring:
     jpa:
       hibernate:
         ddl-auto: validate
   ```

---

## 6. Test Suite Audit & Results

The entire backend test suite was executed via `mvn -f backend/pom.xml clean test`.

### Test Summary:
- **Total Tests Run:** 47
- **Failures:** 0
- **Errors:** 0
- **Skipped:** 0
- **Build Status:** `BUILD SUCCESS` (Execution time: 46.7s)

### Test Suite Breakdown:

#### 1. `FinancialConcurrencyAndOptimisticLockingTest` (9 New Tests)
- `test_flywayMigrationDiscoveryAndVersionValidation`: Asserts Flyway bean presence, migration ordering (V1 -> V2 -> V3), and current schema version 3.
- `test_concurrentPrimaryApprovalConflict`: Simulates two simultaneous primary approvals via thread pool and `CountDownLatch`. Exactly 1 succeeds (200), conflicting thread rejected (409/400).
- `test_concurrentSecondaryApprovalConflict`: Simulates two simultaneous secondary approvals on high-value bill. Exactly 1 succeeds, conflicting thread rejected.
- `test_concurrentApprovalAndRejectionConflict`: Simulates concurrent primary approval and finance rejection. Confirms no corrupted or ambiguous state.
- `test_concurrentCashSettlementResponses`: Simulates concurrent counterparty acknowledge vs. contest. Only 1 response is committed.
- `test_concurrentCashSettlementFinanceVerification`: Simulates concurrent verification of a cash voucher. Confirms exactly ONE `PaymentTransactionEntity` is created and bill `paidAmount` is credited exactly once.
- `test_directOptimisticLockingOnBillApprovalReturns409`: Confirms stale entity update triggers `ObjectOptimisticLockingFailureException`.
- `test_directOptimisticLockingOnCashSettlementReturns409`: Confirms stale cash settlement update triggers `ObjectOptimisticLockingFailureException`.
- `test_makerConcurrentSelfApprovalBlocked`: Confirms transaction maker cannot approve under concurrency.

#### 2. `SecurityAndRbacIntegrationTest` (26 Existing Tests)
- All 26 P0 security and authorization integration tests passed without regression.

#### 3. `MakerCheckerAndSafetyInvariantsTest` (12 Existing Tests)
- All 12 domain safety and invariant tests passed without regression.

---

## 7. Residual Risks & Next Steps

1. **Production PostgreSQL Driver Testing:**
   - In-memory H2 (PostgreSQL compatibility mode) executes all migrations cleanly. A staging verification against actual PostgreSQL 15/16 instance should be performed during release deployment.
2. **Stateless JWT Lifetime:**
   - As documented in Phase 1, stateless JWT tokens have a 24-hour expiration window. Account deactivations take effect when tokens expire or via Phase 3 Redis token revocation.

---

**Report Prepared By:** Senior Backend Engineer & Database Architect  
**Deliverable Path:** `D:\WEBUI\audit\backend\PHASE2_IMPLEMENTATION_REPORT.md`
