# ArcheOn Design Studio — Admin Portal Security & Business Logic Audit
**Audit Date:** November 18, 2026  
**Auditor:** Senior Frontend Architect & Independent Code Auditor  
**Audit Scope:** Authentication, Authorization, Financial Governance, WhatsApp Automation, and Regulatory Compliance  
**Execution Mode:** STRICT READ-ONLY AUDIT  

---

## 1. Executive Summary & Critical Security Alerts

This audit evaluates the architectural safeguards, business logic enforcement, and security controls spanning both `D:\WEBUI\frontend` and `D:\WEBUI\backend`. While the system design documents specify rigorous forensic and financial controls (such as Maker-Checker separation and WhatsApp fail-closed execution), the current codebase contains **severe security misconfigurations** that allow completely unauthenticated users to execute primary and secondary financial approvals, mutate CRM data, and download audit logs.

```
+---------------------------------------------------------------------------------------------------------+
|                                    CRITICAL SECURITY FINDINGS SUMMARY                                   |
+---------------------------------------------------------------------------------------------------------+
| SEC-01 | CRITICAL | SecurityConfig permits unauthenticated mutation of Approvals, Finance & Leads       |
| SEC-02 | CRITICAL | Backend controllers silently substitute hardcoded identities when auth is null      |
| SEC-03 | CRITICAL | Frontend Admin Page (/admin) lacks route protection, session check & JWT attachment |
| FIN-01 | CRITICAL | Maker-Checker separation of duties is completely bypassed due to unauthenticated IDs|
| FIN-02 | HIGH     | WhatsApp proof attachments must remain unverified until bank reconciliation        |
| NOT-01 | MEDIUM   | WhatsApp Cloud API correctly defaults to fail-closed (app.whatsapp.enabled=false)   |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Authentication & Authorization Breakdown

### SEC-01: Publicly Permitted Financial & Approval Mutations
- **File:** `D:\WEBUIackend\src\main\java\com\webuiackend\config\SecurityConfig.java`
- **Lines:** Lines 64–73
- **Observed Configuration:**
  ```java
  .authorizeHttpRequests(auth -> auth
      // Public Read endpoints
      .requestMatchers(HttpMethod.GET, "/api/projects/**").permitAll()
      .requestMatchers(HttpMethod.GET, "/api/manifesto/**").permitAll()
      .requestMatchers(HttpMethod.GET, "/api/approvals/config").permitAll()
      .requestMatchers(HttpMethod.GET, "/api/approvals/**").permitAll()
      .requestMatchers(HttpMethod.POST, "/api/approvals/**").permitAll()  // <--- CRITICAL: Public approval!
      .requestMatchers(HttpMethod.POST, "/api/leads").permitAll()
      .requestMatchers(HttpMethod.GET, "/api/leads").permitAll()
      .requestMatchers(HttpMethod.PATCH, "/api/leads/**").permitAll()     // <--- CRITICAL: Public lead update!
      .requestMatchers("/api/finance/**").permitAll()                     // <--- CRITICAL: All finance endpoints!
      .requestMatchers("/api/auth/**").permitAll()
      ...
  );
  ```
- **Security Impact:** Any anonymous user on the public internet can dispatch HTTP POST requests to `/api/approvals/{billId}/approve-primary`, `/api/approvals/{billId}/approve-secondary`, `/api/finance/cash/{ref}/approve`, or `/api/finance/verify-payment/{id}` without presenting any credentials or tokens.

---

### SEC-02: Silent Hardcoded Identity Fallback in Controllers
- **Files:**
  - `BillApprovalController.java` (Lines 77, 86, 97, 107)
  - `FinancialOperationsController.java` (Lines 80, 93, 107, 117, 129, 140, 194)
- **Code Evidence:**
  ```java
  // BillApprovalController.java
  String approver = auth != null ? auth.getName() : "finance_checker_1";
  String approver = auth != null ? auth.getName() : "finance_checker_2";
  String rejecter = auth != null ? auth.getName() : "finance_reviewer";
  String actor = auth != null ? auth.getName() : "finance_maker";

  // FinancialOperationsController.java
  String initiator = auth != null ? auth.getName() : "site_supervisor_arun";
  String counterparty = auth != null ? auth.getName() : "VND-082";
  String approver = auth != null ? auth.getName() : "finance_manager";
  String actor = auth != null ? auth.getName() : "audit_user";
  ```
- **Security Impact:** When requests arrive unauthenticated (as they do from the frontend), the controllers do not return HTTP 401 Unauthorized. Instead, they fabricate internal system identities (`"finance_checker_1"`, `"finance_manager"`). This completely defeats the audit trail, non-repudiation, and access control.

---

### SEC-03: Complete Absence of Frontend Route Guards
- **File:** `D:\WEBUIrontend\srcppdmin\page.tsx`
- **Observed Behavior:** The page does not check for a JWT token in `localStorage`, cookies, or context. Anyone who enters `http://localhost:3000/admin` in their browser is immediately shown the full financial ledger, receivables aging, cash register, and lead CRM without being prompted to log in.

---

## 3. Financial Governance & Maker-Checker Compliance

### FIN-01: Maker-Checker Rule Implementation & Invariant Analysis
- **Policy Invariant:**
  - Transactions `< ₹1,00,000`: Require 1 finance approval (`PENDING_PRIMARY` -> `APPROVED`).
  - Transactions `>= ₹1,00,000`: Require 2 distinct finance approvals (`PENDING_PRIMARY` -> `PENDING_SECONDARY` -> `APPROVED`).
  - **Separation of Duties:** The initiator (`maker`) cannot approve their own bill (`initiator != approver`). Checker 1 and Checker 2 must be distinct individuals (`primaryApprover != secondaryApprover`).
- **Backend Service Verification (`MakerCheckerApprovalService.java`):**
  The service method `approvePrimary` properly validates:
  ```java
  if (approval.getInitiator().equalsIgnoreCase(approverId)) {
      throw new IllegalStateException("Maker-Checker violation: Initiator cannot act as primary approver.");
  }
  ```
  And `approveSecondary` validates:
  ```java
  if (approval.getPrimaryApprover().equalsIgnoreCase(approverId)) {
      throw new IllegalStateException("Maker-Checker violation: Secondary approver must be distinct from primary approver.");
  }
  ```
- **Defect in Practice:** Because `BillApprovalController` defaults `approver` to `"finance_checker_1"` and `"finance_checker_2"`, any anonymous client calling the endpoints sequentially bypasses all separation of duties safeguards.

---

### FIN-02: Payment Proof Verification vs Proof Admissibility
- **Domain Invariant:** Submitting a screenshot, transaction ID (UTR), or receipt reference via WhatsApp or the portal is an **unverified claim**. It must **NEVER** automatically mark a bill as `PAID`.
- **Backend Service Verification (`FinancialOperationsService.java`):**
  - Submitting payment proof creates a `PaymentTransactionEntity` with `status = "SUBMITTED"`. The bill status remains unchanged.
  - Only when a finance officer explicitly calls `POST /api/finance/verify-payment/{id}` (recording reconciliation notes against bank statements) does the transaction transition to `"VERIFIED"` and the bill's `paidAmount` update.
  - This design complies with forensic financial integrity standards.

---

### FIN-03: Two-Party Cash Register Governance
- **Domain Invariant:** Physical site cash disbursements require counterparty acknowledgment before final studio finance approval.
- **Backend Service Verification:**
  - `initiateCashSettlement`: Site supervisor creates voucher (`INITIATED`, `PENDING_VENDOR_ACK`).
  - `respondToCashSettlement`: Vendor acknowledges or disputes voucher (`ACKNOWLEDGED` or `DISPUTED`).
  - `financeApproveCashSettlement`: Finance manager verifies physical signature/receipt and marks `APPROVED`.
  - The state machine correctly prevents finance approval if the voucher is in `DISPUTED` status.

---

## 4. WhatsApp Automation & Notification Governance

### NOT-01: Fail-Closed Protection & Credential Verification
- **File:** `D:\WEBUIackend\src\main\java\com\webuiackend\service\WhatsAppCloudApiAdapter.java`
- **Invariant:** WhatsApp automation must remain completely disabled until official Meta credentials are confirmed and authorized.
- **Verification:**
  - `app.whatsapp.enabled` defaults to `false`.
  - When disabled, reminders are suppressed and logged to the audit repository with action `WHATSAPP_SUPPRESSED_DISABLED`.

### NOT-02: Quiet Hours & Consumer Protection
- **Rules Enforced in Adapter:**
  - **Quiet Hours:** Messages between 21:00 (9 PM) and 09:00 (9 AM) IST are strictly suppressed (`SUPPRESSED_QUIET_HOURS`).
  - **Opt-In Consent:** Rejection if `isOptedIn == false` (`SUPPRESSED_OPT_OUT`), adhering to India's DPDP Act 2023.
  - **Max Reminder Cap:** Capped at 5 reminders (`SUPPRESSED_MAX_CAP_REACHED`) before manual escalation.
  - **Immediate Dispute/Settlement Suppression:** If bill status is `PAID`, `DISPUTED`, or `CANCELLED`, all automated messaging is aborted immediately.

---

## 5. Regulatory & DPDP Act 2023 Compliance

1. **Digital Personal Data Protection (DPDP) Act 2023:**
   - Lead records in `LeadEntity` capture client personal data: Name, Phone, Email, Location, and WhatsApp opt-in flag.
   - Current flaw: `GET /api/leads` is exposed with `permitAll()`, allowing unauthorized third parties to scrape prospective client contact details.
   - Required fix: Restrict `GET /api/leads` strictly to authenticated users with `ROLE_ADMIN` or `ROLE_STUDIO_STAFF`.
2. **Audit Event Immutability:**
   - All critical actions are persisted to `AuditEventEntity` (`actorId`, `actorRole`, `action`, `entityName`, `entityId`, `detailsJson`, `timestamp`).
   - Audit trail is read-only via JPA (`AuditEventRepository` has no delete/update endpoints).
