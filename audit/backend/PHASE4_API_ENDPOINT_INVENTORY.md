# ArcheOn Design Studio — Phase 4 API Endpoint Inventory

**Document Reference:** `audit/backend/PHASE4_API_ENDPOINT_INVENTORY.md`  
**Target Commit:** `de8702e2e2623dc5d9652b286d89adcfaec7eb8f`  
**Target Branch:** `backend/phase3.2-production-hardening`  
**Generated On:** 2026-11-18  
**Audit Mode:** Read-Only Codebase Inspection  

---

## 1. Executive Summary & Inventory Statistics

A complete, line-by-line inspection of all Spring Boot REST controllers in `com.webui.backend.controller` was performed.

| Metric | Count | Details |
| :--- | :--- | :--- |
| **Total Registered Endpoints** | **34** | Across 6 Controller classes |
| **Public Endpoints (`permitAll`)** | **9** | Auth login/refresh, Projects read, Manifesto read, Leads submit, Approvals config, OpenAPI |
| **Authenticated Endpoints** | **25** | Enforcing Spring Security JWT authentication and role extraction |
| **Role-Restricted Endpoints** | **22** | Enforcing specific authorities (`ROLE_ADMIN`, `ROLE_FINANCE_*`, `ROLE_CLIENT`, `ROLE_VENDOR`, `ROLE_STAFF`) |
| **Optimistic Locking Guarded** | **7** | Mutation endpoints catching `OptimisticLockException` / `ObjectOptimisticLockingFailureException` (HTTP 409) |
| **BOLA / IDOR Protected** | **4** | Endpoints verifying explicit object-level party ownership via `FinancialOperationsService.validateBillAccess` |
| **Audit Event Generating** | **9** | Endpoints recording forensic records into `audit_events` table |
| **Test Coverage Status** | **19 of 34 tested** | Auth and financial state machines heavily tested (76 automated tests); CMS/Leads routes untested |

---

## 2. Controller-by-Controller Endpoint Inventory

### 2.1. Authentication Controller (`AuthController`)
**Base Path:** `/api/auth`  
**Primary Responsibilities:** JWT token lifecycle, cryptographically secure Refresh Token Rotation (RTR), session family tracking, token reuse detection, JTI/family revocation.

#### 1. User Login
- **HTTP Method & Path:** `POST /api/auth/login`
- **Handler Method:** `AuthController.login(LoginRequest, HttpServletRequest)`
- **Authentication / RBAC:** `permitAll()`
- **Request Payload (DTO):**
  ```json
  {
    "username": "string (mandatory)",
    "password": "string (mandatory)"
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `AuthResponse` (`token`, `refreshToken`, `username`, `role`, `expiresIn`)
  - `401 UNAUTHORIZED`: Missing credentials, invalid password, or account disabled
- **Service & Repository Interactions:** `UserRepository.findByUsername()`, `PasswordEncoder.matches()`, `RefreshTokenRepository.save()`
- **Concurrency & Locking:** Standard transactional insertion of fresh session family
- **Audit Event:** System logging; family session tracking
- **Test Coverage:** Verified (`Phase3AuthLifecycleTest`, `SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Ready for login portal; returns RFC-compliant JWT.

#### 2. Refresh Token Rotation
- **HTTP Method & Path:** `POST /api/auth/refresh`
- **Handler Method:** `AuthController.refresh(RefreshRequest, HttpServletRequest)`
- **Authentication / RBAC:** `permitAll()` (Validated via cryptographically secure refresh token hash)
- **Request Payload (DTO):**
  ```json
  {
    "refreshToken": "string (64-char hex, mandatory)"
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `AuthResponse` (`token`, `refreshToken`, `username`, `role`, `expiresIn`)
  - `400 BAD_REQUEST`: Empty or null refresh token
  - `401 UNAUTHORIZED`: Token invalid, expired, revoked, reuse detected, or user disabled
  - `409 CONFLICT`: Concurrency collision (P3-01 atomic single-use check, parallel request handling)
- **Service & Repository Interactions:** `RefreshTokenRepository.findByTokenHash()`, `consumeTokenIfUnused()`, `revokeFamily()`, `TokenRevocationService.revokeFamily()`
- **Concurrency & Locking:** Atomic DB update conditional on `used = false`, 3-second grace window distinguishing race collision from malicious replay
- **Audit Event:** Automatic family revocation on replay
- **Test Coverage:** Verified (`Phase3AuthLifecycleTest` — 17 tests, `ProductionBootstrapHardeningTest`)
- **Frontend Integration Status:** Ready for silent session refresh interceptors.

#### 3. User Logout (Single Session)
- **HTTP Method & Path:** `POST /api/auth/logout`
- **Handler Method:** `AuthController.logout(LogoutRequest, HttpServletRequest, Authentication)`
- **Authentication / RBAC:** `authenticated()`
- **Request Payload (DTO):**
  ```json
  {
    "refreshToken": "string (optional)"
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `{"message": "Logged out successfully"}`
  - `401 UNAUTHORIZED`: Unauthenticated request
  - `403 FORBIDDEN`: Attempting to revoke a refresh token belonging to another user (P3-02 cross-user protection)
- **Service & Repository Interactions:** `TokenRevocationService.revokeToken(jti)`, `revokeFamily(fid)`, `RefreshTokenRepository.revokeFamily()`
- **Concurrency & Locking:** Transactional
- **Audit Event:** Immediate revocation in Redis/In-memory blocklist
- **Test Coverage:** Verified (`Phase3AuthLifecycleTest`)
- **Frontend Integration Status:** Ready.

#### 4. Logout All Sessions
- **HTTP Method & Path:** `POST /api/auth/logout-all`
- **Handler Method:** `AuthController.logoutAll(Authentication)`
- **Authentication / RBAC:** `authenticated()`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `{"message": "All sessions terminated successfully"}`
  - `401 UNAUTHORIZED`: Unauthenticated
- **Service & Repository Interactions:** `UserEntity.tokenVersion++`, `UserRepository.save()`, `RefreshTokenRepository.revokeAllForUser()`, `TokenRevocationService.revokeAllForUser()`
- **Concurrency & Locking:** Optimistic version increment
- **Audit Event:** Global user invalidation
- **Test Coverage:** Verified (`Phase3AuthLifecycleTest`)
- **Frontend Integration Status:** Ready.

#### 5. List Active Sessions
- **HTTP Method & Path:** `GET /api/auth/sessions`
- **Handler Method:** `AuthController.listSessions(Authentication)`
- **Authentication / RBAC:** `authenticated()`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `List<SessionResponse>` (`familyId`, `deviceInfo`, `ipAddress`, `createdAt`, `expiresAt`, `active`)
  - `401 UNAUTHORIZED`: Unauthenticated
- **Service & Repository Interactions:** `RefreshTokenRepository.findByUsername()`
- **Concurrency & Locking:** Read-only aggregation
- **Audit Event:** None
- **Test Coverage:** Verified (`Phase3AuthLifecycleTest`)
- **Frontend Integration Status:** Ready for user profile / session management UI (`AdminSessionManagementCenter`).

#### 6. Revoke Specific Session Family
- **HTTP Method & Path:** `POST /api/auth/sessions/{familyId}/revoke`
- **Handler Method:** `AuthController.revokeSession(String, Authentication)`
- **Authentication / RBAC:** `authenticated()`
- **Request Payload:** None (path variable `familyId`)
- **Response Payload & Status:**
  - `200 OK`: `{"message": "Session revoked successfully"}`
  - `401 UNAUTHORIZED`: Unauthenticated
  - `403 FORBIDDEN`: Session family does not belong to the calling user
  - `404 NOT_FOUND`: Family ID not found
- **Service & Repository Interactions:** `RefreshTokenRepository.findByFamilyId()`, `revokeFamily()`, `TokenRevocationService.revokeFamily()`
- **Concurrency & Locking:** Transactional
- **Audit Event:** Immediate blocklist entry
- **Test Coverage:** Verified (`Phase3AuthLifecycleTest`)
- **Frontend Integration Status:** Ready.

---

### 2.2. Bill Approval Controller (`BillApprovalController`)
**Base Path:** `/api/approvals`  
**Primary Responsibilities:** Maker-checker multi-tier approval state machine, high-value transaction threshold escalation, anti-split rolling window enforcement.

#### 7. Approval Policy Configuration
- **HTTP Method & Path:** `GET /api/approvals/config`
- **Handler Method:** `BillApprovalController.getApprovalPolicyConfig()`
- **Authentication / RBAC:** `permitAll()`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `{"brandName", "legalEntityName", "gstin", "highValueThreshold": 100000.00, "currency": "INR", "policyStatus", "makerCheckerRule"}`
- **Service & Repository Interactions:** Property resolution from Spring Environment
- **Concurrency & Locking:** N/A (read-only configuration)
- **Audit Event:** None
- **Test Coverage:** Verified (`SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Used by frontend to display governance badges and approval limits.

#### 8. Initiate Bill Approval (Maker Action)
- **HTTP Method & Path:** `POST /api/approvals/initiate`
- **Handler Method:** `BillApprovalController.initiate(InitiateRequest, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_MAKER', 'STAFF')`
- **Request Payload (DTO):**
  ```json
  {
    "billId": "string (unique, mandatory)",
    "amount": 54200.00,
    "vendorId": "string (mandatory)",
    "clientId": "string (optional)",
    "projectId": "string (mandatory)"
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `BillApprovalEntity` (initial status `PENDING_PRIMARY`, `isHighValue` calculated)
  - `401 UNAUTHORIZED`: Anonymous or invalid token
  - `403 FORBIDDEN`: Insufficient role (e.g. `ROLE_CLIENT`, `ROLE_VENDOR`, `ROLE_FINANCE_CHECKER`)
- **Service & Repository Interactions:** `MakerCheckerApprovalService.initiateBillApproval()`, `BillApprovalRepository.sumRecentBillsForVendorAndProject()`, `BillApprovalRepository.save()`, `AuditEventRepository.save()`
- **Concurrency & Locking:** Transactional
- **Audit Event:** `BILL_INITIATED` with cumulative window sum
- **Test Coverage:** Verified (`MakerCheckerAndSafetyInvariantsTest`, `SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Backend ready. Frontend expects matching schema in `AdminInvoiceApprovalWorkspace`.

#### 9. Primary Approval (Checker 1 Action)
- **HTTP Method & Path:** `POST /api/approvals/{billId}/approve-primary`
- **Handler Method:** `BillApprovalController.approvePrimary(String, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_CHECKER', 'FINANCE_CHECKER_1')`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `BillApprovalEntity` (Transitions to `APPROVED` if low-value, or `PENDING_SECONDARY` if high-value)
  - `400 BAD_REQUEST`: Maker attempting to approve own bill (`Maker != Checker` invariant), or invalid status transition
  - `401 UNAUTHORIZED`: Unauthenticated
  - `403 FORBIDDEN`: Role mismatch
  - `409 CONFLICT`: Concurrent modification detected (`@Version` failure)
- **Service & Repository Interactions:** `MakerCheckerApprovalService.approvePrimary()`, `BillApprovalRepository.save()`, `AuditEventRepository.save()`
- **Concurrency & Locking:** `@Version` optimistic locking on `BillApprovalEntity`
- **Audit Event:** `PRIMARY_APPROVAL_GRANTED` / `FINAL_APPROVAL_GRANTED`
- **Test Coverage:** Verified (`FinancialConcurrencyAndOptimisticLockingTest`, `MakerCheckerAndSafetyInvariantsTest`)
- **Frontend Integration Status:** Ready.

#### 10. Secondary Approval (Checker 2 / Manager Action)
- **HTTP Method & Path:** `POST /api/approvals/{billId}/approve-secondary`
- **Handler Method:** `BillApprovalController.approveSecondary(String, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_CHECKER_2', 'FINANCE_MANAGER')`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `BillApprovalEntity` (Transitions from `PENDING_SECONDARY` to `APPROVED`)
  - `400 BAD_REQUEST`: Bill not high-value, not awaiting secondary approval, or secondary approver matches initiator or primary approver (`Approver2 != Approver1 != Maker`)
  - `409 CONFLICT`: Concurrent modification detected (`@Version` failure)
- **Service & Repository Interactions:** `MakerCheckerApprovalService.approveSecondary()`, `BillApprovalRepository.save()`, `AuditEventRepository.save()`
- **Concurrency & Locking:** `@Version` optimistic locking
- **Audit Event:** `SECONDARY_APPROVAL_GRANTED`
- **Test Coverage:** Verified (`FinancialConcurrencyAndOptimisticLockingTest`, `MakerCheckerAndSafetyInvariantsTest`)
- **Frontend Integration Status:** Ready.

#### 11. Reject Bill
- **HTTP Method & Path:** `POST /api/approvals/{billId}/reject`
- **Handler Method:** `BillApprovalController.reject(String, RejectRequest, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_CHECKER', 'FINANCE_MANAGER')`
- **Request Payload (DTO):**
  ```json
  {
    "reason": "string (mandatory rejection reason)"
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `BillApprovalEntity` (Status set to `REJECTED`)
  - `409 CONFLICT`: Concurrent modification detected (`@Version` failure)
- **Service & Repository Interactions:** `MakerCheckerApprovalService.rejectBill()`, `BillApprovalRepository.save()`, `AuditEventRepository.save()`
- **Concurrency & Locking:** `@Version` optimistic locking
- **Audit Event:** `BILL_REJECTED`
- **Test Coverage:** Verified (`FinancialConcurrencyAndOptimisticLockingTest`)
- **Frontend Integration Status:** Ready.

#### 12. List All Approvals
- **HTTP Method & Path:** `GET /api/approvals/all`
- **Handler Method:** `BillApprovalController.getAllApprovals()`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_MAKER', 'FINANCE_CHECKER', 'FINANCE_MANAGER', 'STAFF')`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `List<BillApprovalEntity>`
- **Service & Repository Interactions:** `BillApprovalRepository.findAll()`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Tested via security integration tests
- **Frontend Integration Status:** Currently returns all bills without pagination or filter query parameters.

#### 13. Get Single Bill Approval Details
- **HTTP Method & Path:** `GET /api/approvals/{billId}`
- **Handler Method:** `BillApprovalController.getApprovalStatus(String)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_MAKER', 'FINANCE_CHECKER', 'FINANCE_MANAGER', 'STAFF')`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `BillApprovalEntity`
  - `404 NOT_FOUND`: Bill not found
- **Service & Repository Interactions:** `BillApprovalRepository.findByBillId()`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Verified
- **Frontend Integration Status:** Ready.

#### 14. Get Bill Audit Trail
- **HTTP Method & Path:** `GET /api/approvals/{billId}/audit`
- **Handler Method:** `BillApprovalController.getAuditTrail(String)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_MAKER', 'FINANCE_CHECKER', 'FINANCE_MANAGER', 'STAFF')`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `List<AuditEventEntity>` ordered by timestamp descending
- **Service & Repository Interactions:** `AuditEventRepository.findByEntityNameAndEntityIdOrderByTimestampDesc("BillApproval", billId)`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Verified
- **Frontend Integration Status:** Ready for audit drawer in approval workspace.

---

### 2.3. Financial Operations Controller (`FinancialOperationsController`)
**Base Path:** `/api/finance`  
**Primary Responsibilities:** Payment proof ingestion, bank reconciliation, dispute management, site cash settlement protocol, aging reports, financial CSV exports.

#### 15. Submit Payment Proof (Client / Vendor)
- **HTTP Method & Path:** `POST /api/finance/payment-proof`
- **Handler Method:** `FinancialOperationsController.submitProof(ProofSubmissionRequest, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'CLIENT', 'VENDOR', 'STAFF')`
- **Object-Level Authorization (BOLA):** Enforced via `validateBillAccess`. Actor must be assigned client, vendor, maker, or have an existing recorded payment. Unassigned legacy bills reject third-party proofs.
- **Request Payload (DTO):**
  ```json
  {
    "billId": "string (mandatory)",
    "payeeId": "string (optional, defaults to vendor)",
    "amount": 25000.00,
    "paymentMode": "UPI | NEFT | RTGS | BANK_TRANSFER",
    "utrNumber": "string (mandatory transaction ref)",
    "proofUrl": "string (evidence URL)"
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `PaymentTransactionEntity` (Status `SUBMITTED_FOR_VERIFICATION`)
  - `401 UNAUTHORIZED`: Unauthenticated
  - `403 FORBIDDEN`: BOLA failure (actor not party to bill)
  - `404 NOT_FOUND`: Bill ID not found
  - `409 CONFLICT`: Concurrent modification (`@Version` failure)
- **Safety Invariant (Section 9.3):** Submitting proof **NEVER** marks a bill as `PAID`. Bill transitions to `PAYMENT_PROOF_SUBMITTED`.
- **Service & Repository Interactions:** `FinancialOperationsService.submitPaymentProof()`, `PaymentTransactionRepository.save()`, `BillApprovalRepository.save()`, `AuditEventRepository.save()`
- **Concurrency & Locking:** `@Version` optimistic locking on `BillApprovalEntity`
- **Audit Event:** `PAYMENT_PROOF_SUBMITTED`
- **Test Coverage:** Verified (`FinancialConcurrencyAndOptimisticLockingTest`, `SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Ready for `ClientPaymentProofForm`.

#### 16. Verify Payment & Reconcile Balance (Finance Action)
- **HTTP Method & Path:** `POST /api/finance/verify-payment/{transactionId}`
- **Handler Method:** `FinancialOperationsController.verifyPayment(UUID, VerificationRequest, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_LEAD', 'FINANCE_MANAGER')`
- **Request Payload (DTO):**
  ```json
  {
    "notes": "string (optional reconciliation notes, e.g. HDFC statement match)"
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `PaymentTransactionEntity` (Status `VERIFIED_PAID`)
  - `401 UNAUTHORIZED`: Unauthenticated
  - `403 FORBIDDEN`: Unauthorized role
  - `404 NOT_FOUND`: Transaction ID not found
  - `409 CONFLICT`: Concurrent modification (`@Version` failure)
- **Balance Recalculation:** Re-queries DB for sum of all verified payments. If balance <= 0, marks bill `PAID`; if balance > 0, marks bill `PARTIALLY_PAID`.
- **Service & Repository Interactions:** `FinancialOperationsService.verifyPayment()`, `PaymentTransactionRepository.sumVerifiedPaymentsForBill()`, `BillApprovalRepository.save()`, `AuditEventRepository.save()`
- **Concurrency & Locking:** `@Version` on both transaction and bill
- **Audit Event:** `PAYMENT_VERIFIED`
- **Test Coverage:** Verified (`FinancialConcurrencyAndOptimisticLockingTest`, `SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Ready for admin finance reconciliation drawer.

#### 17. Open Bill Dispute
- **HTTP Method & Path:** `POST /api/finance/dispute`
- **Handler Method:** `FinancialOperationsController.disputeBill(DisputeRequest, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'CLIENT', 'VENDOR')`
- **Object-Level Authorization (BOLA):** Verified via `validateBillAccess`.
- **Request Payload (DTO):**
  ```json
  {
    "billId": "string (mandatory)",
    "reason": "string (mandatory dispute explanation)"
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `BillApprovalEntity` (`disputed = true`, status `DISPUTED`)
  - `403 FORBIDDEN`: BOLA failure
  - `404 NOT_FOUND`: Bill not found
  - `409 CONFLICT`: Concurrent modification (`@Version` failure)
- **Invariants:** Disputing immediately pauses automated WhatsApp payment reminder schedules.
- **Service & Repository Interactions:** `FinancialOperationsService.openDispute()`, `BillApprovalRepository.save()`, `AuditEventRepository.save()`
- **Concurrency & Locking:** `@Version` optimistic locking
- **Audit Event:** `BILL_DISPUTED`
- **Test Coverage:** Verified (`FinancialConcurrencyAndOptimisticLockingTest`, `SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Ready for `ClientInvoiceDisputeForm` and `VendorDisputeTracking`.

#### 18. Initiate Site Cash Settlement
- **HTTP Method & Path:** `POST /api/finance/cash/initiate`
- **Handler Method:** `FinancialOperationsController.initiateCash(CashInitiateRequest, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'SITE_SUPERVISOR', 'STAFF')`
- **Request Payload (DTO):**
  ```json
  {
    "settlementRef": "string (unique reference)",
    "billId": "string (associated bill)",
    "projectId": "string",
    "counterpartyId": "string (vendor or client username)",
    "amount": 12500.00,
    "sitePurpose": "string (e.g. site masonry day labour)",
    "receiptRef": "string (physical voucher reference)"
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `CashSettlementEntity` (Status `PENDING_COUNTERPARTY_ACK`, `PENDING_FINANCE_REVIEW`)
  - `409 CONFLICT`: Concurrent modification failure
- **Service & Repository Interactions:** `FinancialOperationsService.initiateCashSettlement()`, `CashSettlementRepository.save()`, `AuditEventRepository.save()`
- **Concurrency & Locking:** Transactional
- **Audit Event:** `CASH_SETTLEMENT_INITIATED`
- **Test Coverage:** Verified (`FinancialConcurrencyAndOptimisticLockingTest`, `SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Ready for site supervisor portal.

#### 19. Respond to Cash Settlement (Counterparty Action)
- **HTTP Method & Path:** `POST /api/finance/cash/{ref}/respond`
- **Handler Method:** `FinancialOperationsController.respondCash(String, CashResponseRequest, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'VENDOR', 'CLIENT')`
- **Identity Invariant:** Calling principal must exactly match `counterpartyId`.
- **Terminal State Protection:** Terminal states `SETTLED_VERIFIED` and `REJECTED` cannot be altered. Duplicate state transitions rejected.
- **Request Payload (DTO):**
  ```json
  {
    "acknowledge": true,
    "notes": "string (acknowledgement remarks)"
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `CashSettlementEntity` (Status set to `ACKNOWLEDGED` or `REJECTED_CONTESTED`)
  - `400 BAD_REQUEST`: Identity mismatch, terminal-state modification attempt, or duplicate state transition
  - `409 CONFLICT`: Concurrent modification (`@Version` failure)
- **Service & Repository Interactions:** `FinancialOperationsService.respondToCashSettlement()`, `CashSettlementRepository.save()`, `AuditEventRepository.save()`
- **Concurrency & Locking:** `@Version` optimistic locking on `CashSettlementEntity`
- **Audit Event:** `CASH_ACKNOWLEDGED` / `CASH_CONTESTED`
- **Test Coverage:** Verified (`FinancialConcurrencyAndOptimisticLockingTest`, `SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Ready for `VendorCashSettlement`.

#### 20. Finance Approve & Settle Cash Voucher
- **HTTP Method & Path:** `POST /api/finance/cash/{ref}/approve`
- **Handler Method:** `FinancialOperationsController.approveCash(String, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_MANAGER')`
- **Pre-condition:** Counterparty status must be `ACKNOWLEDGED`.
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `CashSettlementEntity` (Status `SETTLED_VERIFIED`)
  - `400 BAD_REQUEST`: Attempt to settle without counterparty acknowledgement
  - `409 CONFLICT`: Concurrent modification (`@Version` failure)
- **Side Effect:** Automatically writes verified `PaymentTransactionEntity` with mode `CASH` and triggers bill balance recalculation.
- **Service & Repository Interactions:** `FinancialOperationsService.financeApproveCashSettlement()`, `PaymentTransactionRepository.save()`, `BillApprovalRepository.save()`, `AuditEventRepository.save()`
- **Concurrency & Locking:** `@Version` optimistic locking across settlement and bill
- **Audit Event:** `CASH_FINANCE_SETTLED`
- **Test Coverage:** Verified (`FinancialConcurrencyAndOptimisticLockingTest`, `SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Ready for `AdminCashSettlementManagement`.

#### 21. List All Cash Settlements
- **HTTP Method & Path:** `GET /api/finance/cash/all`
- **Handler Method:** `FinancialOperationsController.getAllCashSettlements()`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'STAFF', 'SITE_SUPERVISOR')`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `List<CashSettlementEntity>` ordered by creation date descending
- **Service & Repository Interactions:** `CashSettlementRepository.findAllByOrderByCreatedAtDesc()`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Verified via security integration tests
- **Frontend Integration Status:** Ready for internal cash register views.

#### 22. Get Payment Transactions for Bill
- **HTTP Method & Path:** `GET /api/finance/transactions/{billId}` and `GET /api/finance/bills/{billId}/transactions`
- **Handler Method:** `FinancialOperationsController.getTransactionsForBill(String, Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'STAFF', 'CLIENT', 'VENDOR')`
- **Object-Level Authorization (BOLA):** Explicitly verified via `validateBillAccess`.
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `List<PaymentTransactionEntity>`
  - `403 FORBIDDEN`: Principal is not an authorized party for this bill
  - `404 NOT_FOUND`: Bill does not exist
- **Service & Repository Interactions:** `FinancialOperationsService.getTransactionsForBill()`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Verified (`SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Ready for invoice detail and payment history tables.

#### 23. Aging Receivables Report
- **HTTP Method & Path:** `GET /api/finance/reports/aging-receivables`
- **Handler Method:** `FinancialOperationsController.getAgingReceivables()`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'FINANCE_AUDIT', 'STAFF')`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`:
    ```json
    {
      "currency": "INR",
      "totalOutstanding": 145000.00,
      "currentUnder30Days": 95000.00,
      "aging30To60Days": 30000.00,
      "overdueOver60Days": 20000.00,
      "totalBillsAudited": 12
    }
    ```
- **Service & Repository Interactions:** In-memory bucketing over `BillApprovalRepository.findAll()`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Security verified
- **Frontend Integration Status:** Matches ageing metrics cards in `AdminFinanceOverview`.

#### 24. Export Bills CSV
- **HTTP Method & Path:** `GET /api/finance/reports/export-bills-csv`
- **Handler Method:** `FinancialOperationsController.exportBillsCsv(Authentication)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'FINANCE_AUDIT', 'STAFF')`
- **Forensic Attribution:** Header includes `Export Timestamp: <iso>` and `Exported By: <username>`.
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `text/csv` attachment with quoted RFC-4180 CSV records
  - `401 UNAUTHORIZED`: Unauthenticated
  - `403 FORBIDDEN`: Unauthorized role
- **Service & Repository Interactions:** `BillApprovalRepository.findAll()`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Verified (`SecurityAndRbacIntegrationTest`)
- **Frontend Integration Status:** Ready for CSV download button in `AdminReportExportCenter`.

---

### 2.4. Lead Controller (`LeadController`)
**Base Path:** `/api/leads`  
**Primary Responsibilities:** Public consultation enquiry intake, studio lead management, lead lifecycle status updates.

#### 25. Submit Consultation Lead
- **HTTP Method & Path:** `POST /api/leads`
- **Handler Method:** `LeadController.submitLead(LeadSubmissionRequest)`
- **Authentication / RBAC:** `permitAll()`
- **Request Payload (DTO):**
  ```json
  {
    "clientName": "string (mandatory)",
    "phone": "string (mandatory)",
    "email": "string (optional)",
    "serviceDiscipline": "ARCHITECTURE | INTERIOR | LANDSCAPE | VIZ | TURNKEY",
    "location": "string",
    "budgetBand": "string",
    "estimatedTimeline": "string",
    "projectBrief": "string (up to 2000 chars)",
    "whatsappOptIn": true
  }
  ```
- **Response Payload & Status:**
  - `200 OK`: `{"success": true, "leadId": "<uuid>", "message": "...", "whatsappOptInRecorded": true}`
  - `400 BAD_REQUEST`: Missing client name or phone
- **Service & Repository Interactions:** `LeadRepository.save()`
- **Concurrency & Locking:** Standard DB insert
- **Audit Event:** None
- **Test Coverage:** Not covered in automated unit/integration tests
- **Frontend Integration Status:** Directly invoked by `ConsultationModal.tsx`.

#### 26. List All Leads
- **HTTP Method & Path:** `GET /api/leads`
- **Handler Method:** `LeadController.getAllLeads()`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'STAFF')`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `List<LeadEntity>` ordered by creation date descending
- **Service & Repository Interactions:** `LeadRepository.findAllByOrderByCreatedAtDesc()`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Tested via security filter checks
- **Frontend Integration Status:** Ready for `AdminLeadManagement`.

#### 27. Update Lead Status
- **HTTP Method & Path:** `PATCH /api/leads/{id}/status`
- **Handler Method:** `LeadController.updateStatus(UUID, Map<String, String>)`
- **Authentication / RBAC:** `hasAnyRole('ADMIN', 'STAFF')`
- **Request Payload (DTO):** `{"status": "CONTACTED | ESTIMATE_SENT | CONVERTED | ARCHIVED"}`
- **Response Payload & Status:**
  - `200 OK`: `{"success": true, "status": "<newStatus>"}`
  - `400 BAD_REQUEST`: Missing status field
  - `404 NOT_FOUND`: Lead UUID not found
- **Service & Repository Interactions:** `LeadRepository.findById()`, `LeadRepository.save()`
- **Concurrency & Locking:** Standard JPA save
- **Audit Event:** None
- **Test Coverage:** Not covered in unit tests
- **Frontend Integration Status:** Ready for `AdminLeadManagement`.

---

### 2.5. Manifesto Controller (`ManifestoController`)
**Base Path:** `/api/manifesto`  
**Primary Responsibilities:** Studio public manifesto CMS text management.

#### 28. Get Studio Manifesto
- **HTTP Method & Path:** `GET /api/manifesto`
- **Handler Method:** `ManifestoController.getManifesto()`
- **Authentication / RBAC:** `permitAll()`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `ManifestoEntity` (`title`, `headline`, `paragraphsJson`)
  - `404 NOT_FOUND`: Manifesto record not initialized
- **Service & Repository Interactions:** `ManifestoRepository.findAll().stream().findFirst()`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Untested
- **Frontend Integration Status:** Consumed by studio homepage journal section.

#### 29. Update Studio Manifesto
- **HTTP Method & Path:** `PUT /api/manifesto`
- **Handler Method:** `ManifestoController.updateManifesto(ManifestoEntity)`
- **Authentication / RBAC:** `hasRole('ADMIN')` (Enforced via `.requestMatchers(HttpMethod.PUT, "/api/**").hasRole("ADMIN")`)
- **Request Payload (DTO):** `ManifestoEntity`
- **Response Payload & Status:**
  - `200 OK`: Updated `ManifestoEntity`
- **Service & Repository Interactions:** `ManifestoRepository.save()`
- **Concurrency & Locking:** Standard JPA save
- **Audit Event:** None
- **Test Coverage:** Untested
- **Frontend Integration Status:** Used by admin CMS editor.

---

### 2.6. Project Controller (`ProjectController`)
**Base Path:** `/api/projects`  
**Primary Responsibilities:** Architectural project portfolio CMS showcase (code, title, release date, tags, links).

#### 30. List Showcase Projects
- **HTTP Method & Path:** `GET /api/projects`
- **Handler Method:** `ProjectController.getAllProjects()`
- **Authentication / RBAC:** `permitAll()`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `List<ProjectEntity>`
- **Service & Repository Interactions:** `ProjectRepository.findAll()`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Untested
- **Frontend Integration Status:** Consumed by portfolio grid on public homepage.

#### 31. Get Showcase Project by ID
- **HTTP Method & Path:** `GET /api/projects/{id}`
- **Handler Method:** `ProjectController.getProjectById(String)`
- **Authentication / RBAC:** `permitAll()`
- **Request Payload:** None
- **Response Payload & Status:**
  - `200 OK`: `ProjectEntity`
  - `404 NOT_FOUND`: Project not found
- **Service & Repository Interactions:** `ProjectRepository.findById()`
- **Concurrency & Locking:** Read-only
- **Audit Event:** None
- **Test Coverage:** Untested
- **Frontend Integration Status:** Consumed by portfolio project modal/detail page.

#### 32. Create Showcase Project
- **HTTP Method & Path:** `POST /api/projects`
- **Handler Method:** `ProjectController.createProject(ProjectEntity)`
- **Authentication / RBAC:** `hasRole('ADMIN')`
- **Request Payload (DTO):** `ProjectEntity`
- **Response Payload & Status:**
  - `200 OK`: `ProjectEntity`
- **Service & Repository Interactions:** `ProjectRepository.save()`
- **Concurrency & Locking:** Standard insert
- **Audit Event:** None
- **Test Coverage:** Untested
- **Frontend Integration Status:** Admin CMS showcase editor only.

#### 33. Update Showcase Project
- **HTTP Method & Path:** `PUT /api/projects/{id}`
- **Handler Method:** `ProjectController.updateProject(String, ProjectEntity)`
- **Authentication / RBAC:** `hasRole('ADMIN')`
- **Request Payload (DTO):** `ProjectEntity`
- **Response Payload & Status:**
  - `200 OK`: Updated `ProjectEntity`
  - `404 NOT_FOUND`: ID not found
- **Service & Repository Interactions:** `ProjectRepository.findById()`, `ProjectRepository.save()`
- **Concurrency & Locking:** Standard update
- **Audit Event:** None
- **Test Coverage:** Untested
- **Frontend Integration Status:** Admin CMS showcase editor only.

#### 34. Delete Showcase Project
- **HTTP Method & Path:** `DELETE /api/projects/{id}`
- **Handler Method:** `ProjectController.deleteProject(String)`
- **Authentication / RBAC:** `hasRole('ADMIN')`
- **Request Payload:** None
- **Response Payload & Status:**
  - `204 NO_CONTENT`: Successfully deleted
  - `404 NOT_FOUND`: ID not found
- **Service & Repository Interactions:** `ProjectRepository.deleteById()`
- **Concurrency & Locking:** Standard delete
- **Audit Event:** None
- **Test Coverage:** Untested
- **Frontend Integration Status:** Admin CMS showcase editor only.

---

## 3. Summary of API Gaps Identified

1. **Client Domain:** 0 endpoints exist for `/api/clients`.
2. **Vendor Domain:** 0 endpoints exist for `/api/vendors`.
3. **Project Lifecycle & Milestones:** Existing `/api/projects` is a portfolio CMS model, lacking milestone, phase, team, and budget endpoints.
4. **Document Management:** 0 endpoints exist for `/api/documents`.
5. **In-App Notifications:** 0 endpoints exist for `/api/notifications`.
6. **Studio-wide Audit Queries:** Only `/api/approvals/{billId}/audit` exists; no `/api/audit` or `/api/admin/audit` endpoint.
7. **Dashboard Aggregates:** 0 endpoints exist for `/api/admin/dashboard`, `/api/client/dashboard`, or `/api/vendor/dashboard`.
8. **User Administration:** 0 endpoints exist for `/api/users` (CRUD, invites, role assignments).
