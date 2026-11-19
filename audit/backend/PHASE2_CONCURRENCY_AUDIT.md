# Phase 2 Concurrency & Transaction Integrity Audit
**Project:** ArcheOn Design Studio — Administrative & Financial Backend  
**Workspace:** `D:\WEBUI`  
**Branch:** `backend/phase2-hardening`  
**Base Commit:** `30fbc22`  
**Date:** 2026-11-18  
**Author:** Senior Backend Engineer & Database Architect  
**Status:** Audit Completed — Implementation Plan Formulated

---

## 1. Executive Summary

This audit assesses multi-threaded race conditions, state machine consistency, and transaction boundary integrity across ArcheOn's financial operations and maker-checker approval systems.

While Phase 1 (commit `30fbc22`) successfully enforced strict role-based access control, cryptographic JWT identity validation, and object-level authorization (BOLA/IDOR), database entities currently lack optimistic locking mechanisms (`@Version`). State checks are performed in-memory after reading entity rows from the database. Under concurrent execution, interleaved database transactions can violate financial invariants, overwrite approved states with rejected states (or vice-versa), duplicate payment transaction records, and double-credit account ledgers.

To guarantee financial consistency without deadlocks or unscalable row-locking bottlenecks, optimistic concurrency control via JPA `@Version` is required for stateful financial workflow entities:
- `BillApprovalEntity` (Maker-checker state machine)
- `CashSettlementEntity` (Two-party cash settlement protocol)
- `PaymentTransactionEntity` (Payment verification state machine)

Concurrent modification collisions must be intercepted and translated into HTTP `409 Conflict`, requiring callers to refresh their state rather than silently overwriting another user's financial action.

---

## 2. In-Depth Concurrency Analysis of Race Condition Scenarios

### Scenario 1: Primary Bill Approval Races
- **Affected Components:** `MakerCheckerApprovalService.approvePrimary()`, `BillApprovalController.approvePrimary()`, `BillApprovalEntity`.
- **Mechanism:**
  - `approvePrimary` executes:
    ```java
    BillApprovalEntity approval = billApprovalRepository.findByBillId(billId)...;
    if (!"PENDING_PRIMARY".equals(approval.getStatus())) { throw ... }
    approval.setPrimaryApproverId(approverId);
    approval.setStatus(approval.isHighValue() ? "PENDING_SECONDARY" : "APPROVED");
    billApprovalRepository.save(approval);
    ```
  - If Checker 1 (`approver_a`) and Checker 2 (`approver_b`) submit primary approval simultaneously (e.g. distributed requests or browser double-click), both transactions execute `findByBillId` within the default `READ_COMMITTED` transaction isolation.
  - Both threads observe `status = "PENDING_PRIMARY"`.
  - Both threads proceed to execute `save()`.
  - For high-value bills, one transaction commits first, updating `primaryApproverId = approver_a`. The second transaction commits moments later, overwriting `primaryApproverId = approver_b` and generating duplicate primary approval audit events.
  - For low-value bills, the second transaction overwrites the primary approver identity and timestamp of an already approved bill without validation.

### Scenario 2: Secondary Bill Approval Races
- **Affected Components:** `MakerCheckerApprovalService.approveSecondary()`, `BillApprovalEntity`.
- **Mechanism:**
  - When a high-value bill is in `PENDING_SECONDARY`, two secondary approvers (`approver_c` and `approver_d`) submit approval requests simultaneously.
  - Both read the bill while `status = "PENDING_SECONDARY"`.
  - Both validate that their approver ID differs from `initiatorId` and `primaryApproverId`.
  - Both execute `save()` setting `status = "APPROVED"`.
  - The second writer overwrites `secondaryApproverId` and timestamp of the first writer. The audit log reflects conflicting approvals from different officers for the exact same secondary slot.

### Scenario 3: Concurrent Approval and Rejection
- **Affected Components:** `MakerCheckerApprovalService.approvePrimary()` / `approveSecondary()` vs. `rejectBill()`.
- **Mechanism:**
  - Checker 1 submits `approvePrimary` while a Finance Manager concurrently submits `rejectBill` with a mandatory rejection reason.
  - Thread 1 (Approval) reads `status = "PENDING_PRIMARY"`.
  - Thread 2 (Rejection) reads `status = "PENDING_PRIMARY"`.
  - Thread 2 saves `status = "REJECTED"`, sets `rejectionReason = "Suspicious invoice format"`, and commits.
  - Thread 1 (which read the record before Thread 2 committed) saves `status = "APPROVED"` or `"PENDING_SECONDARY"`, effectively resurrecting a rejected bill and wiping out the rejection reason.
  - This is a critical business integrity violation: a rejected vendor invoice becomes approved due to a lost update.

### Scenario 4: Duplicate Approval Requests (Network Double-Click)
- **Affected Components:** All approval endpoints in `BillApprovalController`.
- **Mechanism:**
  - A finance user with intermittent network connectivity clicks "Approve" twice in rapid succession.
  - Two parallel HTTP requests reach two application worker threads.
  - Thread 1 and Thread 2 execute concurrently against the same un-versioned entity.
  - Both succeed, causing duplicate audit entries and redundant database writes.

### Scenario 5: Cash Settlement Mutual Acknowledgement Races
- **Affected Components:** `FinancialOperationsService.respondToCashSettlement()`, `CashSettlementEntity`.
- **Mechanism:**
  - In the two-party cash settlement protocol, a counterparty can acknowledge (`acknowledge = true`) or contest (`acknowledge = false`).
  - If a counterparty rapidly clicks both or submits from multiple devices, two threads read `counterpartyStatus = "PENDING_COUNTERPARTY_ACK"`.
  - Thread 1 sets `ACKNOWLEDGED`. Thread 2 sets `REJECTED_CONTESTED`.
  - Without versioning, whichever thread commits last silently wins. If `REJECTED_CONTESTED` was intentional due to non-receipt of cash, but `ACKNOWLEDGED` commits last, the cash voucher will appear verified and ready for finance disbursement.

### Scenario 6: Cash Settlement Verification & Duplicate Payment Creation (CRITICAL)
- **Affected Components:** `FinancialOperationsService.financeApproveCashSettlement()`, `CashSettlementEntity`, `PaymentTransactionRepository`, `BillApprovalRepository`.
- **Mechanism:**
  - In `financeApproveCashSettlement`:
    ```java
    CashSettlementEntity csh = cashSettlementRepository.findBySettlementRef(settlementRef)...;
    csh.setFinanceApprovalStatus("SETTLED_VERIFIED");
    cashSettlementRepository.save(csh);

    PaymentTransactionEntity tx = PaymentTransactionEntity.builder()
            .billId(csh.getBillId())
            .paymentMode("CASH")
            .settlementStatus("VERIFIED_PAID")
            .amount(csh.getAmount())
            ...build();
    paymentTransactionRepository.save(tx);

    billApprovalRepository.findByBillId(csh.getBillId()).ifPresent(bill -> {
        BigDecimal totalVerified = paymentTransactionRepository.sumVerifiedPaymentsForBill(bill.getBillId());
        bill.setPaidAmount(totalVerified);
        ...
        billApprovalRepository.save(bill);
    });
    ```
  - If two finance officers simultaneously click "Verify Cash Settlement" for the same voucher:
    - Both read `financeApprovalStatus = "PENDING_FINANCE_REVIEW"`.
    - Both write `csh.setFinanceApprovalStatus("SETTLED_VERIFIED")`.
    - Both execute `paymentTransactionRepository.save(tx)` with newly generated UUIDs!
    - **Outcome:** Two distinct cash payment transactions are inserted into `payment_transactions` for a single cash disbursement. The bill's `paidAmount` is double-credited (e.g. ₹50,000 cash counted twice as ₹1,00,000). The ledger is severely corrupted.

### Scenario 7: Concurrent Payment Verification and Bill Balance Reconciliation
- **Affected Components:** `FinancialOperationsService.verifyPayment()`, `PaymentTransactionEntity`, `BillApprovalEntity`.
- **Mechanism:**
  - Multiple bank reconciliation transfers (e.g. partial UPI payment 1 of ₹20,000 and partial NEFT payment 2 of ₹30,000) are being verified by two finance operators at the same time for the same bill.
  - Verifier A updates transaction 1 to `VERIFIED_PAID` and queries `sumVerifiedPaymentsForBill`.
  - Verifier B updates transaction 2 to `VERIFIED_PAID` and queries `sumVerifiedPaymentsForBill`.
  - Both load the parent `BillApprovalEntity` concurrently.
  - Thread A computes total verified (e.g. ₹20,000) and saves the bill.
  - Thread B computes total verified (e.g. ₹30,000 if Thread A has not committed yet) and saves the bill, overwriting Thread A's balance calculation.
  - The resulting `paidAmount` on `BillApprovalEntity` becomes out of sync with the actual verified transactions in `payment_transactions`.

---

## 3. Entity-Level Locking Strategy Assessment

To address these vulnerabilities, we evaluate which entities require JPA optimistic locking:

| Entity | Mutable State Machine? | Concurrent Write Frequency | Financial Impact of Lost Update | Optimistic Locking Recommendation |
|---|---|---|---|---|
| **`BillApprovalEntity`** | **YES** (`PENDING_PRIMARY` -> `PENDING_SECONDARY` -> `APPROVED` / `REJECTED`, `PAID`, `DISPUTED`) | Moderate to High | **CRITICAL** (Approvals overwritten, rejections bypassed, balance corrupted) | **MANDATORY (`@Version`)** |
| **`CashSettlementEntity`** | **YES** (`PENDING_COUNTERPARTY_ACK` -> `ACKNOWLEDGED` / `REJECTED_CONTESTED`, `SETTLED_VERIFIED`) | Moderate | **CRITICAL** (Duplicate cash disbursements, double-credit ledgers) | **MANDATORY (`@Version`)** |
| **`PaymentTransactionEntity`** | **YES** (`SUBMITTED_FOR_VERIFICATION` -> `VERIFIED_PAID` / `REJECTED_MISMATCH`) | Moderate | **HIGH** (Verification status races, double verifications) | **MANDATORY (`@Version`)** |
| `AuditEventEntity` | **NO** (Append-only write once) | High (Append) | **NONE** (Immutable audit log) | **DO NOT ADD `@Version`** (Unnecessary overhead) |
| `UserEntity` | Low (Profile updates) | Low | Low | Optional (Decline for Phase 2 to avoid scope creep) |
| `ProjectEntity` | Low | Low | Low | Optional (Decline for Phase 2) |
| `LeadEntity` | Low | Low | Low | Optional (Decline for Phase 2) |
| `ManifestoEntity` | Low | Low | Low | Optional (Decline for Phase 2) |

---

## 4. HTTP Conflict Handling Architecture (`409 Conflict`)

When an optimistic locking conflict occurs, Spring Data JPA / Hibernate throws `org.springframework.orm.ObjectOptimisticLockingFailureException` (or `jakarta.persistence.OptimisticLockException`).

### Design Principles:
1. **Never Silently Retry Financial Mutations:**
   - In financial workflows, automatic retry can execute a business action against an outdated or unintended state (e.g. approving a bill that the other user just rejected, or disbursing cash that was just contested).
   - The caller must be informed that the entity was modified by another user.
2. **Controller Advice / Exception Translation:**
   - Implement a global or controller-level `@ExceptionHandler(ObjectOptimisticLockingFailureException.class)` that returns:
     - HTTP Status: `409 CONFLICT`
     - Response Body:
       ```json
       {
         "error": "The record was modified by another transaction. Please reload and review the latest data before attempting this operation.",
         "status": 409,
         "conflictType": "OPTIMISTIC_LOCK_FAILURE"
       }
       ```
3. **Preserve Maker-Checker Invariants:**
   - State transition validations (`"PENDING_PRIMARY".equals(approval.getStatus())`) must remain in place as domain invariants. Optimistic locking provides the atomic guarantee that the entity has not changed between reading and committing.

---

## 5. Next Steps for Implementation

1. **Entities:**
   - Add `@Version private Long version;` to `BillApprovalEntity`, `CashSettlementEntity`, and `PaymentTransactionEntity`.
2. **Database Migration:**
   - Create `V2__add_version_to_financial_entities.sql` adding `version BIGINT NOT NULL DEFAULT 0` to `bill_approvals`, `cash_settlement_requests`, and `payment_transactions`.
3. **Exception Handling:**
   - Add global exception handling to translate `ObjectOptimisticLockingFailureException` and `OptimisticLockException` into HTTP 409 Conflict across `BillApprovalController` and `FinancialOperationsController`.
4. **Flyway Migration Strategy:**
   - Add `flyway-core` and PostgreSQL/H2 flyway database support to `pom.xml`.
   - Configure migration discovery and safe baseline behavior.
5. **Deterministic Concurrency Tests:**
   - Write integration tests using `ExecutorService` and `CountDownLatch` / `CyclicBarrier` to execute simultaneous conflicting transactions and assert HTTP 409 / optimistic lock failures.
