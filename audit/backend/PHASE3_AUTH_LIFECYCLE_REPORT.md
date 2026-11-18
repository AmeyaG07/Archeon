# ArcheOn Design Studio — Backend Phase 3: JWT Lifecycle & Session Security Verification Report

**Project:** ArcheOn Design Studio Backend  
**Branch:** `backend/phase3-auth-lifecycle`  
**Base Commit:** `ca71cc8` (`feat(backend): harden financial concurrency and migrations`)  
**Scope:** Backend Only (`backend/`)  
**Status:** **APPROVED & FULLY VERIFIED**  
**Audit Date:** 2026-11-18  

---

## 1. Executive Summary

Phase 3 implements production-grade JWT lifecycle management, refresh token rotation (RTR), session tracking with reuse detection, and fail-closed token revocation for ArcheOn Design Studio.

### Key Achievements:
- **Access Token Hardening:** Enforced 15-minute access token lifespan, strict HMAC-SHA256 signature verification, issuer (`archeon-api`) and audience (`archeon-web`) validation, JTI tracking, and token versioning (`ver`).
- **Real-Time Account Invariants:** Authenticated requests now continuously check user active status (`enabled == true`), database role consistency (preventing privilege persistence after role demotions), and token version validity in `JwtAuthenticationFilter`.
- **Refresh Token Rotation (RTR) & Family Tracking:** Implemented cryptographically secure (256-bit entropy) refresh tokens with server-side SHA-256 hashed storage. Raw tokens are never stored. Token reuse triggers immediate automatic revocation of the entire session family (`family_id`).
- **Fail-Closed Revocation Architecture:** Delivered `TokenRevocationService` with JTI blacklisting, user-level invalidation timestamps, and strict fail-closed behavior during Redis outages (HTTP 401 Unauthorized, never bypassing security).
- **Session Management Endpoints:** Implemented and secured `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/logout-all`, `/api/auth/sessions`, and `/api/auth/sessions/{familyId}/revoke` with BOLA protection.
- **Flyway Migration V4:** Introduced `V4__create_refresh_tokens_and_user_security.sql` with zero data loss or schema regressions.
- **100% Test Suite Verification:** **60 out of 60 tests passing** (47 retained baseline tests + 13 dedicated Phase 3 security tests).

---

## 2. Baseline & Branch Verification

- **Base Commit:** `ca71cc87efbfbe4e176b6f95934e622b28c309ee` on `backend/phase2-hardening`
- **Working Branch:** `backend/phase3-auth-lifecycle`
- **Frontend Isolation:** The `frontend/` directory was preserved without modification.

---

## 3. Access Token Lifecycle & Validation Engine

### 3.1 Token Expiration & Claims
- **Lifespan:** 15 minutes (`900,000 ms`), configured via `app.jwt.expiration-ms`.
- **Claims Injected:**
  - `sub`: Username.
  - `role`: Normalized Spring Security authority (e.g. `ROLE_ADMIN`, `ROLE_FINANCE_MANAGER`).
  - `jti`: Unique UUID v4 token identifier.
  - `ver`: Monotonically increasing user token version (`0, 1, 2...`).
  - `iss`: Enforced issuer (`archeon-api`).
  - `aud`: Enforced audience (`archeon-web`).
  - `iat`: Timestamp of token issuance.
  - `exp`: Exact expiration timestamp.

### 3.2 Real-time Security Invariants in `JwtAuthenticationFilter`
Whenever a request presents a Bearer JWT:
1. **Signature & Expiration Check:** Validated against HMAC-SHA256 secret key. Expired, corrupted, or forged signatures immediately return HTTP 401.
2. **Issuer & Audience Validation:** Tokens claiming external issuers or invalid audiences are rejected.
3. **JTI Revocation Check:** Verified against `tokenRevocationService.isTokenRevoked(jti)`. If revoked, immediately returns HTTP 401.
4. **Account-Level Invalidation Timestamp:** Verified against `tokenRevocationService.isUserRevoked(username, issuedAt)`. If the token was issued before the user's logout-all/revocation event, it returns HTTP 401.
5. **Database User Active-Status:** If the user exists in `users`, `user.isEnabled()` is evaluated. Disabled accounts immediately return HTTP 401.
6. **Token Version Supersession:** If `user.getTokenVersion() > token.ver`, the token is rejected with HTTP 401.
7. **Role Demotion Protection:** If the database user role has changed (e.g. demoted from `ROLE_ADMIN` to `ROLE_STAFF`), existing tokens presenting the elevated role are immediately rejected with HTTP 401.
8. **Fail-Closed Revocation Exception Handling:** Catches `TokenRevocationUnavailableException` and rejects with HTTP 401 Unauthorized.

---

## 4. Refresh Token Security & Rotation (RTR)

### 4.1 Storage & Cryptographic Hashing
- **Generation:** 32 cryptographically secure random bytes (`SecureRandom`), formatted as 64 lowercase hexadecimal characters.
- **Storage Invariant:** Plaintext refresh tokens are **never stored** in the database.
- **Hashed Representation:** `TokenHashUtil` computes `SHA-256(rawRefreshToken)` and stores the 64-character hash in `refresh_tokens.token_hash` with a unique index constraint.
- **Lifespan:** 7 days (`604,800,000 ms`), configured via `app.jwt.refresh-expiration-ms`.

### 4.2 Refresh Token Rotation (RTR) State Machine
```
[POST /api/auth/login]
        │
        ▼
[Issue Access Token (15m) + Refresh Token 1 (7d, Family A)]
        │
        ▼
[POST /api/auth/refresh (Token 1)]
        ├── Token 1 Valid & Unused:
        │       ├── Mark Token 1: used = true
        │       └── Issue Refresh Token 2 (7d, Family A) + New Access Token (15m)
        │
        ├── Token 1 Already Used (Replay Attack):
        │       ├── REUSE DETECTED!
        │       ├── Automatically revoke entire Family A (Token 1, Token 2, ...)
        │       └── Return HTTP 401 Unauthorized
        │
        ├── Token 1 Revoked:
        │       ├── Automatically revoke entire Family A
        │       └── Return HTTP 401 Unauthorized
        │
        └── Token 1 Expired or User Disabled:
                ├── Mark revoked = true
                └── Return HTTP 401 Unauthorized
```

---

## 5. Revocation Architecture & Fail-Closed Behavior

### 5.1 Service Design
The `TokenRevocationService` contract provides:
- `revokeToken(String jti, long ttlMs)`
- `isTokenRevoked(String jti)`
- `revokeAllForUser(String username)`
- `isUserRevoked(String username, Date tokenIssuedAt)`

### 5.2 Implementations
1. **`RedisTokenRevocationService`:**
   - Active when `app.security.revocation-strategy: redis`.
   - Keys: `archeon:revoked_token:{jti}` with TTL matching the remaining token lifespan.
   - User Key: `archeon:user_revoked_at:{username}` storing epoch millisecond timestamp for 7 days.
   - **Fail-Closed Invariant:** If Redis encounters connection timeouts, network partitions, or unavailability, it raises `TokenRevocationUnavailableException`. `JwtAuthenticationFilter` traps this exception and issues HTTP 401 Unauthorized. Under no circumstances is the check bypassed.
2. **`InMemoryTokenRevocationService`:**
   - Active when `app.security.revocation-strategy: in-memory` (default for standalone/offline runs).
   - Backed by thread-safe `ConcurrentHashMap` with TTL expiry checks.

---

## 6. Session Management APIs & Authorization

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public (`permitAll`) | Authenticates credentials, creates session family, saves hashed refresh token, returns access + refresh tokens. |
| `POST` | `/api/auth/refresh` | Public (`permitAll`) | Rotates refresh token, validates hash, detects reuse, issues new pair in same family. |
| `POST` | `/api/auth/logout` | Authenticated | Revokes access token JTI in revocation store and revokes associated refresh token. |
| `POST` | `/api/auth/logout-all` | Authenticated | Increments user `tokenVersion`, invalidates all user refresh tokens in DB, records account revocation timestamp. |
| `GET` | `/api/auth/sessions` | Authenticated | Returns active session families for authenticated user (`familyId`, device info, IP, timestamps). |
| `POST` | `/api/auth/sessions/{familyId}/revoke` | Authenticated | Revokes specific session family. Enforces user ownership (prevents BOLA; cross-user attempts return HTTP 403). |

---

## 7. Database Migration: Flyway V4

**File:** `backend/src/main/resources/db/migration/V4__create_refresh_tokens_and_user_security.sql`

```sql
-- 1. Add user active-status and token versioning for invalidation/demotion
ALTER TABLE users ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version BIGINT NOT NULL DEFAULT 0;

-- 2. Create Refresh Tokens table for Rotation (RTR), Family Tracking & Reuse Detection
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL,
    family_id VARCHAR(64) NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    revoked BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(255)
);

-- 3. Indexes for fast token lookup, family tracking, and username query
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_username ON refresh_tokens (username);
```

---

## 8. Test Suite Verification & Traceability Matrix

### 8.1 Summary of Test Results
```
-------------------------------------------------------
 T E S T S
-------------------------------------------------------
Running com.webui.backend.concurrency.FinancialConcurrencyAndOptimisticLockingTest
Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 19.69 s

Running com.webui.backend.security.Phase3AuthLifecycleTest
Tests run: 13, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 7.35 s

Running com.webui.backend.service.MakerCheckerAndSafetyInvariantsTest
Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.34 s

Running com.webui.backend.security.SecurityAndRbacIntegrationTest
Tests run: 26, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.12 s

Results:
Tests run: 60, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### 8.2 Phase 3 Traceability Matrix

| ID | Test Case | Target Security Invariant | Status |
|---|---|---|---|
| **P3-01** | `test_expiredAccessToken_rejectedWith401` | 15-minute access token expiration enforcement | **PASS** |
| **P3-02** | `test_invalidSignature_rejectedWith401` | HMAC-SHA256 signature verification & forgery rejection | **PASS** |
| **P3-03** | `test_missingOrUnknownRole_rejectedWith403` | Missing/unauthorized/unknown role rejected with HTTP 403 | **PASS** |
| **P3-04** | `test_disabledAccount_rejectedWith401` | Immediate token invalidation upon account disablement | **PASS** |
| **P3-05** | `test_demotedAccount_rejectedWith401` | Immediate token invalidation upon role demotion | **PASS** |
| **P3-06** | `test_expiredRefreshToken_rejectedWith401` | 7-day refresh token expiration enforcement | **PASS** |
| **P3-07** | `test_validRefreshRotation_issuesNewTokensInSameFamily` | RTR: marks old token used, creates new token in same family | **PASS** |
| **P3-08** | `test_reuseDetection_revokesEntireFamily` | Replay attack triggers full token family revocation | **PASS** |
| **P3-09** | `test_revokedAccessToken_rejectedWith401` | JTI-level revocation blacklists active token | **PASS** |
| **P3-10** | `test_logout_revokesAccessTokenAndRefreshToken` | Logout API revokes current access token and refresh token | **PASS** |
| **P3-11** | `test_logoutAll_invalidatesAllUserSessions` | Logout-All increments token version, revoking all user sessions | **PASS** |
| **P3-12** | `test_redisUnavailable_failClosedReturns401` | Fail-closed: Redis outage triggers HTTP 401, never bypasses | **PASS** |
| **P3-13** | `test_sessionManagementAndCrossUserRevocationProtection` | Session listing & BOLA protection on session revocation | **PASS** |

---

## 9. Verification Conclusion

Backend Phase 3 (JWT Lifecycle and Session Security) satisfies all security, architectural, and operational requirements. All 60 integration and unit tests pass with zero errors, zero warnings, and zero regressions.
