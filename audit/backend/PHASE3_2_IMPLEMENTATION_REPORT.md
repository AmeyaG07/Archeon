# Backend Phase 3.2 Production Bootstrap Hardening Report

**Target Project:** ArcheOn Design Studio Backend (`D:\WEBUI\backend`)  
**Target Branch:** `backend/phase3.2-production-hardening`  
**Base Commit:** `de507b9851328ade63e31ca2f3a5c3a6840c60d4` (`feat(backend): implement phase 3.1 auth lifecycle security remediation`)  
**Audit Reference:** `D:\WEBUI\audit\security\PHASE3_1_INDEPENDENT_ACCEPTANCE.md`  
**Date:** 2026-11-18  

---

## 1. Executive Summary & Verification Outcome

All conditions for production release identified during the Phase 3.1 Independent Security Acceptance Audit have been resolved in branch `backend/phase3.2-production-hardening`:

1. **Data Initializer Security (Task A):**
   `DataInitializer.java` is now protected by an explicit profile allowlist (`@Profile({"dev", "development", "test", "local", "default"})`) and programmatic guard checks (`isSeedingPermitted()`). When running in `prod`, `production`, `staging`, or `live`, the bean is neither instantiated by Spring nor allowed to execute. Demo accounts, mock projects, and mock financial records are completely barred from production.
2. **JWT Secret Production Validation (Task B):**
   `SecurityConfigValidator.java` enforces that production fails fast at container startup if `app.jwt.secret` is missing, blank, matches known development/dummy secrets (`404E6352...`, `secret`, `changeme`), is not valid Base64, or provides less than 256 bits (32 bytes) of cryptographic key material. Secret strings are never logged or exposed in exception messages. Local development defaults are preserved via environment variable `${APP_JWT_SECRET:...}` in `application.yml`.
3. **Database Migration V5 Pre-Flight (Task C):**
   Authored `backend/src/main/resources/db/preflight/V5_preflight_check.sql` providing a non-destructive, read-only SQL diagnostic script for DBAs to identify orphaned `refresh_tokens` rows prior to applying foreign key constraint `fk_refresh_tokens_user`. Documented remediation procedures preserving electronic forensic audit trails.
4. **Regression Verification (Task D):**
   All 76 backend tests passed with 0 failures and 0 errors across 6 test suites (64 baseline tests + 12 new dedicated bootstrap hardening tests).

---

## 2. Changed-File Inventory

| File Path | Nature of Change | Purpose |
|---|---|---|
| `backend/src/main/resources/application.yml` | Modified | Added `${APP_JWT_SECRET:...}` environment property mapping preserving existing `app.jwt.secret` configuration contract. |
| `backend/src/main/java/com/webui/backend/config/DataInitializer.java` | Modified | Added explicit profile allowlist (`@Profile`) and programmatic production guard (`isSeedingPermitted()`). |
| `backend/src/main/java/com/webui/backend/config/SecurityConfigValidator.java` | Modified | Added production secret validation (missing, blank, default dev secret rejection, minimum 256-bit key length, valid Base64) and modular `validateEnvironment()` helper. |
| `backend/src/main/resources/db/preflight/V5_preflight_check.sql` | Created | Standalone read-only DBA preflight SQL script to detect orphaned refresh token rows before applying Flyway V5. |
| `backend/src/test/java/com/webui/backend/config/ProductionBootstrapHardeningTest.java` | Created | Unit & integration tests for secret validation permutations, short key rejection, dev vs. prod behavior, and DataInitializer execution guards. (11 tests) |
| `backend/src/test/java/com/webui/backend/config/ProductionProfileContextTest.java` | Created | Full `@SpringBootTest` asserting that `DataInitializer` bean is not instantiated in Spring context under `prod` profile. (1 test) |
| `audit/backend/PHASE3_2_IMPLEMENTATION_REPORT.md` | Created | Complete implementation, verification, and operational documentation. |

---

## 3. Deep-Dive Implementation Analysis

### 3.1 Task A: Data Initializer Isolation

#### The Vulnerability
In Phase 3.1, `DataInitializer.java` was an unconstrained `@Component`. If started in production against an unpopulated database, it automatically created 28 user accounts (including administrative and finance manager accounts) with the hardcoded password `"Password123!"` and seeded sample case studies and mock bills.

#### The Remediation
1. **Container-Level Profile Allowlist:**
   ```java
   @Component
   @Profile({"dev", "development", "test", "local", "default"})
   public class DataInitializer implements CommandLineRunner {
   ```
   When `spring.profiles.active=prod` or `production`, Spring's container scanner completely skips `DataInitializer`. The bean is never created in the Spring `ApplicationContext`.
2. **Behavior When No Profile Is Explicitly Active:**
   When no profile is specified on the command line or environment (standard local development `mvn spring-boot:run`), Spring activates the `"default"` profile. Because `"default"` is explicitly in the allowlist, local developer convenience is preserved.
3. **Execution-Level Defense-in-Depth Guard:**
   Even if invoked directly or in tests, `run()` executes:
   ```java
   if (!isSeedingPermitted()) {
       return;
   }
   ```
   Where `isSeedingPermitted()` evaluates active profiles against a blacklist (`prod`, `production`, `staging`, `live`) and verifies membership in the development allowlist.
4. **Automated Test Evidence:**
   - `test_dataInitializerAbortsUnderProductionProfile`: Mocks all repositories and proves zero repository interactions under `production` profile.
   - `test_dataInitializerExecutesUnderDefaultProfile`: Confirms legitimate test fixtures continue to be seeded under `default` profile.
   - `test_dataInitializerNotInstantiatedInProductionContext`: Loads `@SpringBootTest` with `@ActiveProfiles("prod")` and asserts `assertFalse(applicationContext.containsBean("dataInitializer"))`.

---

### 3.2 Task B: JWT Secret Validation

#### The Requirements
- Production must fail startup if `app.jwt.secret` is missing or blank.
- Reject known development/default secrets (`404E6352...`, dummy strings).
- Enforce cryptographically appropriate secret strength for HMAC signing (minimum 256 bits / 32 bytes).
- Do not log the secret or include it in exceptions.
- Support environment-based secret injection without changing property contracts.
- Preserve local development configuration.

#### The Remediation
1. **Configuration Contract in `application.yml`:**
   ```yaml
   app:
     jwt:
       secret: ${APP_JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}
   ```
2. **Validator Logic in `SecurityConfigValidator.java`:**
   - In non-production profiles, the validator exits safely, allowing the default dev secret.
   - In production profiles (`prod`, `production`, `staging`, `live`):
     1. Checks `!StringUtils.hasText(secret)` -> throws `IllegalStateException`.
     2. Checks against `KNOWN_INSECURE_SECRETS` (case-insensitive check against `"404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"`, `"secret"`, `"changeme"`, `"default"`, `"password"`, etc.) -> throws `IllegalStateException`.
     3. Validates Base64 decoding via `Decoders.BASE64.decode(trimmedSecret)`.
     4. Enforces decoded key byte length $\ge 32$ (256 bits).
   - Secret strings and substrings are **never** logged, printed, or included in exception messages.
3. **Automated Test Evidence:**
   - `test_productionFailsWhenSecretMissing`: Verified.
   - `test_productionFailsWhenSecretBlank`: Verified.
   - `test_productionFailsWhenDefaultDevSecretUsed`: Verified.
   - `test_productionFailsWhenKnownDummySecretUsed`: Verified.
   - `test_productionFailsWhenSecretNotBase64`: Verified.
   - `test_productionFailsWhenSecretTooShort`: Verified (16-byte key rejected).
   - `test_productionFailsWhenInMemoryRevocationConfigured`: Verified.
   - `test_productionSucceedsWithValidSecretAndRedis`: Verified (valid 384-bit key + Redis succeeds).
   - `test_developmentSucceedsWithDefaultSecret`: Verified.

---

### 3.3 Task C: V5 Migration Pre-Flight Script

**File:** `backend/src/main/resources/db/preflight/V5_preflight_check.sql`

```sql
-- Read-Only Detection of Orphaned Refresh Tokens
SELECT 
    rt.id AS orphaned_token_id,
    rt.username AS missing_username,
    rt.family_id,
    rt.created_at,
    rt.expires_at,
    rt.revoked,
    rt.used
FROM refresh_tokens rt
LEFT JOIN users u ON rt.username = u.username
WHERE u.username IS NULL;

-- Orphaned Record Count Summary
SELECT COUNT(*) AS total_orphaned_refresh_tokens
FROM refresh_tokens rt
LEFT JOIN users u ON rt.username = u.username
WHERE u.username IS NULL;
```

#### Expected Outcome & Remediation Rules
1. **Expected Result:** `total_orphaned_refresh_tokens == 0`.
2. **Remediation Procedure if Records Exist:**
   - **Do NOT** execute blind destructive deletes if electronic records retention applies.
   - **Tombstone Approach (Recommended):** Insert a placeholder disabled user in `users` (`enabled = false`) for each orphaned username, satisfying the foreign key constraint while preserving forensic evidence.
   - **Purge Approach (If Approved):** Delete abandoned test rows only after formal DBA audit sign-off.

---

## 4. Test Suite Execution & Regression Results

Ran the complete test suite:
```bash
mvn -f backend/pom.xml test
```

### Execution Results
```
[INFO] Results:
[INFO] 
[INFO] Tests run: 76, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total time: 46.798 s
[INFO] ------------------------------------------------------------------------
```

### Breakdown by Test Suite

| Test Suite | Class Name | Tests Run | Result | Key Verified Behaviors |
|---|---|---|---|---|
| **Optimistic Locking & Financial Concurrency** | `FinancialConcurrencyAndOptimisticLockingTest` | 9 | **PASS** | Concurrent approvals, double spend prevention, voucher state machine, payment transaction versioning. |
| **Production Bootstrap Hardening** | `ProductionBootstrapHardeningTest` | 11 | **PASS** | Missing/blank/default/short JWT secret rejection, in-memory rejection in prod, Redis + strong secret acceptance, dev fallback, DataInitializer execution guard. |
| **Production Profile Context** | `ProductionProfileContextTest` | 1 | **PASS** | Proves Spring ApplicationContext under `@ActiveProfiles("prod")` completely omits `DataInitializer` bean. |
| **JWT Lifecycle & RTR Security** | `Phase3AuthLifecycleTest` | 17 | **PASS** | Atomic refresh consumption (409 on race), replay family invalidation (401), logout ownership (403), deleted account 401, mandatory `iss`/`aud`, immediate `fid` access token invalidation. |
| **Maker-Checker & Safety Invariants** | `MakerCheckerAndSafetyInvariantsTest` | 12 | **PASS** | Two-person financial rule, threshold escalation, settlement terminal state protection. |
| **Security & RBAC Integration** | `SecurityAndRbacIntegrationTest` | 26 | **PASS** | Cash register boundary, client/vendor BOLA/IDOR protection, export restrictions. |
| **Total** | **All Suites** | **76** | **100% PASS** | Zero regressions across all historical phases. |

---

## 5. Remaining Operational Requirements for Production Deployment

1. **Environment Variables Required in Production:**
   - `SPRING_PROFILES_ACTIVE=prod` (or `production`)
   - `APP_SECURITY_REVOCATION_STRATEGY=redis`
   - `APP_JWT_SECRET=<Base64-encoded random key of at least 256 bits>`
   - `SPRING_DATA_REDIS_HOST=<redis-cluster-host>`
   - `SPRING_DATASOURCE_URL=<production-postgresql-jdbc-url>`
2. **Pre-Deployment Migration Step:**
   Execute `db/preflight/V5_preflight_check.sql` against the target production database to verify that `total_orphaned_refresh_tokens == 0` prior to running Flyway migration `V5`.
