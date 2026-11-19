# ARCHÉON — SPRINT 5.5.4
## Security Regression & RBAC Invariant Verification Report

**Project:** ArcheOn Design Studio  
**Sprint:** 5.5  
**Target Branch:** `system/phase5.5-portal-integration-remediation`  
**Date:** 2026-11-19  
**Auditor:** Independent Principal Security Architect & Lead Penetration Tester

---

### 1. Executive Summary

This report documents the security regression audit executed to ensure that the Sprint 5.5 integration remediations did not weaken any security invariants, bypass authorization gates, or introduce privilege escalation vulnerabilities.

All core security guarantees—multi-tenant data partitioning, segregation of duties (SoD) in maker-checker approvals, cryptographic invitation hashing, and IDOR protection—remain intact and verified.

---

### 2. Security Invariant Verification

#### 2.1 Maker-Checker Approval Invariants
1. **Segregation of Duties (SoD):** The initiator of a bill approval cannot approve or secondary-approve their own bill.
2. **Two Distinct Approvers for High-Value Bills (>= ₹1,00,000):** Primary approver cannot act as secondary approver.
3. **Vendor Exclusion from Bill Decisions:** `ROLE_VENDOR` is permitted to initiate bills, but remains strictly excluded from `approve-primary`, `approve-secondary`, and `reject` endpoints.
4. **Optimistic Locking:** Entity version increments on every transition; concurrent mutations trigger HTTP 409 Conflict.

#### 2.2 Multi-Tenant Data Isolation & IDOR Protection
1. **Client Invoice Access:** Enforced in `InvoiceService.validateClientAccess`. Clients can only access invoices belonging to their authenticated `clientId`. Direct queries for foreign invoice UUIDs return HTTP 403 Forbidden.
2. **Vendor Cash Settlements:** Enforced in `FinancialOperationsController.getMyCashSettlements`. Vendors only receive vouchers matching their authenticated vendor reference or account email.
3. **Global Cash Register Protection:** `GET /api/finance/cash/all` remains restricted to `ADMIN`, `FINANCE_MANAGER`, `STAFF`, and `SITE_SUPERVISOR`. Requests by `ROLE_VENDOR` or `ROLE_CLIENT` continue to return HTTP 403 Forbidden.

#### 2.3 Exception Handling & HTTP Status Code Precision
1. **Direct JSON Responses:** `authenticationEntryPoint` and `accessDeniedHandler` write HTTP 401 and HTTP 403 JSON responses directly without container-level error dispatches to `/error`.
2. **Sanitized Output:** No internal stack traces, class names, or database error strings are exposed to the client.
3. **Session Preservation:** Frontend `apiFetch` does not clear authentication tokens when receiving HTTP 403, preventing unexpected session termination when an unauthorized action is attempted.

#### 2.4 Cryptographic Token & Dual Invitation Invariants
1. **SHA-256 Hashing:** Raw tokens are never stored in plaintext in the database.
2. **Single-Use Enforcement:** Tokens transition to `ACCEPTED` upon activation; re-submission is rejected with HTTP 400 Bad Request.
3. **Expiration:** Expired tokens are marked `EXPIRED` and rejected.
