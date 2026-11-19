# Independent Security Acceptance Audit Report — Backend Phase 3

**Target Project:** ArcheOn Design Studio Backend (`D:\WEBUI\backend`)  
**Target Branch:** `backend/phase3-auth-lifecycle`  
**Target Commit:** `e6db435` (`feat(backend): implement secure jwt lifecycle and session management`)  
**Base Commit:** `ca71cc8` (`feat(backend): harden financial concurrency and migrations`)  
**Audit Scope:** JWT Lifecycle, Refresh Token Rotation (RTR), Fail-Closed Revocation, Session Management, and Database Integrity  
**Audit Mode:** STRICT READ-ONLY AUDIT  
**Audit Date:** 2026-11-18  

---

## Executive Summary & Verdict

### Acceptance Verdict: **ACCEPTED WITH CONDITIONS**

Backend Phase 3 introduces significant security hardening to the ArcheOn Design Studio platform, replacing legacy static tokens with a robust, multi-layered session architecture. The implementation delivers 15-minute access token lifetimes, real-time account status and role demotion verification, SHA-256 hashed refresh token storage, refresh token rotation (RTR), token family reuse detection, fail-closed Redis token revocation, and authenticated session management APIs.

All **60 automated backend tests pass successfully** (47 retained baseline tests + 13 dedicated Phase 3 security tests).

However, rigorous independent analysis of concurrent execution paths, transaction boundaries, and database schema guarantees identified **one High-Severity concurrency race condition** and several Medium/Low severity findings that must be remediated prior to final production release.

---

## Summary of Findings

| ID | Severity | Category | Description | Status |
|---|---|---|---|---|
| **FINDING-P3-01** | **HIGH** | Concurrency / Data Integrity | Concurrent refresh requests using the same token can both succeed due to absence of `@Version` or atomic conditional locking on `RefreshTokenEntity`. | **Open — Condition for Release** |
| **FINDING-P3-02** | **MEDIUM** | Session Management | `logout()` only revokes a single refresh token record without family invalidation, creating a window for sister/child token survival. | **Open — Condition for Release** |
| **FINDING-P3-03** | **MEDIUM** | Authentication | Ghost authentication for deleted users: nonexistent database users fall through to token claims instead of receiving HTTP 401. | **Open — Condition for Release** |
| **FINDING-P3-04** | **MEDIUM** | JWT Validation | Conditional issuer/audience presence validation allows forged tokens omitting `iss`/`aud` claims to pass signature checks. | **Open — Recommended Fix** |
| **FINDING-P3-05** | **LOW** | Database Integrity | Migration `V4` omits a foreign key constraint referencing `users(username)`, permitting orphaned refresh tokens. | **Open — Recommended Fix** |
| **FINDING-P3-06** | **INFORMATIONAL** | Architecture / Clustering | In-memory revocation strategy is node-local; production environments must enforce clustered Redis configuration. | **Operational Requirement** |
| **FINDING-P3-07** | **INFORMATIONAL** | Session Revocation | Revoking a session family via `/api/auth/sessions/{familyId}/revoke` prevents future refreshes but does not immediately blacklist in-flight access tokens. | **Documented Architectural Trade-off** |

---

## Detailed Audit by Phase

### Phase 1 — JWT Validation Engine & Invariant Enforcement

#### 1.1 Signature Validation & Algorithm Restriction
- **Implementation:** `JwtTokenProvider.getSigningKey()` derives an HMAC secret key from `app.jwt.secret` (base64 decoded). Verification via JJWT 0.12.x (`Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(authToken)`).
- **Algorithm Enforcement:** JJWT 0.12.x strictly binds verification to HMAC keys when `verifyWith(SecretKey)` is supplied. Tokens specifying `alg: none` or attempting asymmetric key confusion are automatically rejected by the parser.
- **Verification:** Unit test `P3-02` confirms that tokens forged with alternate HMAC keys fail verification with HTTP 401.

#### 1.2 Expiration & Lifespan
- **Configuration:** Default access token expiry is configured to `900000` ms (15 minutes) in `application.yml` (`app.jwt.expiration-ms`).
- **Enforcement:** Expiry is validated both automatically by JJWT parser during claim verification and in custom validation logic.
- **Verification:** Unit test `P3-01` confirms that expired access tokens are rejected with HTTP 401.

#### 1.3 Issuer, Audience, and JTI Uniqueness
- **Token Generation:** `generateToken()` stamps `iss: archeon-api`, `aud: archeon-web`, and a unique UUID v4 `jti` claim on every token.
- **Validation:** `validateToken()` checks `claims.getIssuer()` against `archeon-api` and `claims.getAudience()` against `archeon-web`.
- **Finding (FINDING-P3-04):** Notice that `validateToken()` performs conditional checks:
  ```java
  if (claims.getIssuer() != null && !expectedIssuer.equals(claims.getIssuer())) return false;
  if (claims.getAudience() != null && !claims.getAudience().isEmpty() && !claims.getAudience().contains(expectedAudience)) return false;
  ```
  If a token completely omits the `iss` or `aud` claims, the check succeeds. While implemented for backward compatibility with tests generating plain tokens, strict production policy should mandate presence of both claims.

#### 1.4 Active Account & Role Demotion Protection
- **Implementation in `JwtAuthenticationFilter`:**
  1. `user.isEnabled()` check: If a user is disabled in the database, subsequent requests immediately return HTTP 401 (`P3-04`).
  2. `user.getTokenVersion()` check: If a user's token version in the DB exceeds the token's `ver` claim, the request is rejected with HTTP 401 (`P3-11`).
  3. Role Demotion Synchronization: The filter compares `token.role` with `user.getRole()`. If a user was demoted from `ROLE_ADMIN` to `ROLE_STAFF`, existing tokens presenting `ROLE_ADMIN` are rejected with HTTP 401 (`P3-05`).
- **Finding (FINDING-P3-03):** If a user is deleted from the `users` table, `userOpt.isPresent()` evaluates to `false`. The filter currently skips the database verification block and populates `SecurityContextHolder` using the token's claims. A deleted user's JWT remains valid until expiration.

---

### Phase 2 — Refresh Token Rotation (RTR) & Concurrency Analysis

#### 2.1 Cryptographic Generation & Storage Security
- **Entropy:** Generated using `SecureRandom` generating 32 random bytes, formatted as 64 hex characters (256 bits of cryptographic entropy).
- **Database Storage:** Raw refresh tokens are never written to disk or database tables. `TokenHashUtil.hashToken(rawToken)` generates a standard SHA-256 digest stored in `refresh_tokens.token_hash`.
- **Index:** `token_hash` column is indexed with a `UNIQUE` constraint, preventing duplicate hashes.

#### 2.2 Token Family & Reuse Detection
- **State Machine:**
  - On `POST /api/auth/login`: A new `family_id` (UUID) is initialized.
  - On `POST /api/auth/refresh`:
    1. Looks up token by hash.
    2. If `revoked == true`: Calls `refreshTokenRepository.revokeFamily(familyId)` and returns HTTP 401.
    3. If `used == true`: **Replay Attack Detected!** Calls `refreshTokenRepository.revokeFamily(familyId)` and returns HTTP 401.
    4. If expired: Marks token revoked and returns HTTP 401.
    5. If valid: Marks presented token `used = true`, inserts a new child token in the same `family_id`, and returns new token pair.
- **Verification:** Unit tests `P3-07` and `P3-08` prove that single-thread rotation works correctly and that replaying an already-used token invalidates the entire family.

#### 2.3 Concurrent Refresh Analysis: FINDING-P3-01 (High Severity)
**Can two concurrent requests using the same refresh token both succeed?**

**YES.** Tracing the execution path across threads:
1. `AuthController.refresh()` is annotated with `@Transactional`. Under default database isolation (`READ_COMMITTED`):
   - Thread A receives `refreshToken` and issues:
     ```sql
     SELECT * FROM refresh_tokens WHERE token_hash = ?;
     ```
     Thread A reads `used = false, revoked = false`.
   - Thread B receives the exact same `refreshToken` concurrently and issues:
     ```sql
     SELECT * FROM refresh_tokens WHERE token_hash = ?;
     ```
     Before Thread A commits, Thread B reads the same uncommitted row state: `used = false, revoked = false`.
2. Both Thread A and Thread B pass the `if (tokenEntity.isUsed())` check!
3. Thread A executes:
   ```java
   tokenEntity.setUsed(true);
   refreshTokenRepository.save(tokenEntity);
   ```
   Because `RefreshTokenEntity` **does not have a `@Version` field**, Hibernate issues an unversioned update:
   ```sql
   UPDATE refresh_tokens SET used = true WHERE id = ?;
   ```
4. Thread A generates `newRefreshToken_A` and inserts `nextTokenEntity_A` into `refresh_tokens`. Thread A commits and returns HTTP 200.
5. Thread B now executes:
   ```sql
   UPDATE refresh_tokens SET used = true WHERE id = ?;
   ```
   This update succeeds without conflict because the row exists and no optimistic lock exception is raised.
6. Thread B generates `newRefreshToken_B` (with a distinct new random hash) and inserts `nextTokenEntity_B` into `refresh_tokens`. Thread B commits and returns HTTP 200!
7. **Result:** Both concurrent requests succeed. Two parallel valid refresh tokens now exist in the same family (`family_id`), creating a split-brain session tree and defeating the single-use rotation guarantee.

**Remediation:**
Add `@Version private Long version;` to `RefreshTokenEntity` (backed by a `version BIGINT DEFAULT 0` column in the database) or use an atomic conditional database update:
```java
int updated = refreshTokenRepository.markUsedIfUnused(tokenHash);
if (updated == 0) {
    // Already used or revoked by concurrent transaction -> trigger reuse revocation
    refreshTokenRepository.revokeFamily(tokenEntity.getFamilyId());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(...);
}
```

#### 2.4 Race Condition Between Refresh and Logout: FINDING-P3-02 (Medium Severity)
In `AuthController.logout()`:
```java
if (request != null && StringUtils.hasText(request.getRefreshToken())) {
    String hash = TokenHashUtil.hashToken(request.getRefreshToken());
    refreshTokenRepository.findByTokenHash(hash).ifPresent(rt -> {
        rt.setRevoked(true);
        refreshTokenRepository.save(rt);
    });
}
```
1. `logout()` only marks the individual token record `revoked = true`; it does **not** call `revokeFamily(rt.getFamilyId())`.
2. If a client initiates a refresh concurrently with a logout, the refresh thread may have already created a successor token in the same family before the logout thread revokes the older token. The newly issued successor token remains valid and unrevoked.
3. Furthermore, `logout()` does not verify whether `rt.getUsername()` matches `authentication.getName()`.

---

### Phase 3 — Revocation Infrastructure & Fail-Closed Guard

#### 3.1 Redis Revocation (`RedisTokenRevocationService`)
- **Key Schema & Expiration:**
  - JTI Keys: `archeon:revoked_token:{jti}` with TTL matching the remaining token lifespan (`Duration.ofMillis(effectiveTtl)`).
  - User Keys: `archeon:user_revoked_at:{username}` storing epoch millisecond timestamp with a 7-day TTL (`Duration.ofDays(7)`).
- **Outage & Exception Handling:**
  Any exception thrown by Lettuce / Spring Data Redis (`RedisConnectionFailureException`, `QueryTimeoutException`, etc.) is caught and translated to `TokenRevocationUnavailableException`.
- **Fail-Closed Verification:**
  In `JwtAuthenticationFilter`:
  ```java
  } catch (TokenRevocationUnavailableException ex) {
      // FAIL CLOSED: Revocation service / Redis failure must strictly reject authentication
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Revocation service unavailable");
      return;
  }
  ```
  Test `P3-12` mocks Redis connection failure and explicitly asserts that the filter issues HTTP 401 Unauthorized, never failing open.

#### 3.2 In-Memory Revocation (`InMemoryTokenRevocationService`)
- Provides zero-dependency standalone fallback for local development and non-clustered test runs.
- Backed by thread-safe `ConcurrentHashMap` with TTL pruning.
- Finding (FINDING-P3-06): Multi-instance production deployments must use `app.security.revocation-strategy: redis` to prevent cluster-inconsistent revocation states.

---

### Phase 4 — Session Management Endpoints & Authorization

| Endpoint | Method | Permitted Roles | BOLA / IDOR Protection | Findings |
|---|---|---|---|---|
| `/api/auth/login` | `POST` | Public (`permitAll`) | N/A (validates credentials) | None |
| `/api/auth/refresh` | `POST` | Public (`permitAll`) | Enforces hash + family validation | FINDING-P3-01 (concurrency race) |
| `/api/auth/logout` | `POST` | Authenticated | Revokes access JTI + refresh token | FINDING-P3-02 (single token vs family) |
| `/api/auth/logout-all` | `POST` | Authenticated | Increments user `tokenVersion` & DB/Redis | None (comprehensive revocation) |
| `/api/auth/sessions` | `GET` | Authenticated | Filtered by `authentication.getName()` | None |
| `/api/auth/sessions/{familyId}/revoke` | `POST` | Authenticated | Verified: `tokens.get(0).getUsername().equals(username)` (403 on mismatch) | FINDING-P3-07 (in-flight JWT) |

- **BOLA Protection:** Test `P3-13` verifies that User B cannot revoke User A's session family, properly returning HTTP 403 Forbidden.

---

### Phase 5 — Database Migration (V4)

**File:** `V4__create_refresh_tokens_and_user_security.sql`

#### 5.1 Verification Checklist
- [x] **Compatibility with Existing Data:** `users.enabled` defaults to `true`; `users.token_version` defaults to `0`. Existing user records seamlessly acquire these defaults without data migration errors.
- [x] **PostgreSQL & H2 Compatibility:** Uses standard `GENERATED BY DEFAULT AS IDENTITY`, `VARCHAR`, `BOOLEAN`, `TIMESTAMP`, and `IF NOT EXISTS`.
- [x] **Index Coverage:** Indexes created for `token_hash`, `family_id`, and `username`.
- [x] **Unique Constraints:** `token_hash VARCHAR(64) NOT NULL UNIQUE` prevents collision.
- [!] **Foreign Key Invariant (FINDING-P3-05):** `refresh_tokens.username` is not constrained by a `FOREIGN KEY REFERENCES users(username)`.

---

### Phase 6 — Test Suite Verification & Coverage Gap Analysis

#### 6.1 Execution Verification
Ran all test suites via Maven (`mvn test`). All **60 tests passed**:
- `com.webui.backend.concurrency.FinancialConcurrencyAndOptimisticLockingTest`: 9 passed
- `com.webui.backend.security.Phase3AuthLifecycleTest`: 13 passed
- `com.webui.backend.service.MakerCheckerAndSafetyInvariantsTest`: 12 passed
- `com.webui.backend.security.SecurityAndRbacIntegrationTest`: 26 passed

#### 6.2 Missing Test Scenarios Identified
1. **Concurrent Refresh Race Test:** No existing test executes simultaneous refresh requests with the same token across multiple threads to detect dual-rotation anomalies.
2. **Refresh vs. Logout Race Test:** No test asserts session state when `/logout` and `/refresh` are dispatched in parallel.
3. **Database Concurrency on Tokens:** No test verifies optimistic or pessimistic locking behavior on `RefreshTokenEntity`.

---

## Acceptance Conditions & Recommendations

Prior to merging `backend/phase3-auth-lifecycle` to main or deploying to production, the following conditions must be satisfied:

1. **Remediate FINDING-P3-01 (High):**
   Implement concurrency protection on refresh token consumption:
   - Add `@Version private Long version;` to `RefreshTokenEntity` and update DB schema, OR
   - Implement an atomic update query in `RefreshTokenRepository` (`markUsedIfUnused`) that checks rows affected.
2. **Remediate FINDING-P3-02 (Medium):**
   Update `AuthController.logout()` to:
   - Verify that the submitted refresh token belongs to `authentication.getName()`.
   - Call `refreshTokenRepository.revokeFamily(rt.getFamilyId())` instead of only revoking the single row.
3. **Remediate FINDING-P3-03 (Medium):**
   Update `JwtAuthenticationFilter`: When not in a dedicated test profile, require that the username exists in `users`, returning HTTP 401 if nonexistent.
4. **Remediate FINDING-P3-04 (Medium):**
   Enforce mandatory presence of `iss` and `aud` claims in `validateToken()`.
5. **Add Concurrency Tests:**
   Author a multi-threaded concurrency test verifying that simultaneous refresh requests result in exactly one successful rotation and one rejection.
