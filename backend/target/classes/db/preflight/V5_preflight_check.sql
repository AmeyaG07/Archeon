-- =============================================================================
-- ArcheOn Design Studio — Database Migration V5 Pre-Flight Integrity Check
-- Target: PostgreSQL / H2
-- Purpose: Read-only pre-flight inspection to verify referential integrity
--          prior to applying Flyway migration V5 (fk_refresh_tokens_user).
-- Mode: STRICTLY READ-ONLY (No DDL modifications, no row deletions)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Verify Table Existence
-- -----------------------------------------------------------------------------
-- Ensure both 'users' and 'refresh_tokens' exist prior to running foreign key checks.
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name IN ('users', 'refresh_tokens');

-- -----------------------------------------------------------------------------
-- Step 2: Read-Only Detection of Orphaned Refresh Tokens
-- -----------------------------------------------------------------------------
-- Identifies any refresh_tokens rows whose 'username' value does NOT exist
-- in the 'users' primary table. Any matching rows will cause Flyway V5 to fail.
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

-- -----------------------------------------------------------------------------
-- Step 3: Orphaned Record Count Summary
-- -----------------------------------------------------------------------------
SELECT COUNT(*) AS total_orphaned_refresh_tokens
FROM refresh_tokens rt
LEFT JOIN users u ON rt.username = u.username
WHERE u.username IS NULL;

-- =============================================================================
-- EXPECTED RESULT & DBA REMEDIATION PROCEDURE:
--
-- 1. EXPECTED RESULT:
--    - 'total_orphaned_refresh_tokens' MUST BE 0.
--    - If 0, proceed immediately with Flyway V5 migration.
--
-- 2. REMEDIATION PROCEDURE (If total_orphaned_refresh_tokens > 0):
--    - DO NOT blindly delete orphaned records if electronic audit trail
--      or forensic retention requirements apply.
--
--    Option A (Recommended for audit trails / electronic record retention):
--      Create a disabled tombstone user record in 'users' for each missing
--      username so foreign key referential integrity is satisfied without
--      destroying forensic electronic evidence:
--
--      INSERT INTO users (username, password, role, enabled, token_version)
--      SELECT DISTINCT rt.username, '{DISABLED_ORPHANED_SESSION}', 'ROLE_DISABLED', false, 0
--      FROM refresh_tokens rt
--      LEFT JOIN users u ON rt.username = u.username
--      WHERE u.username IS NULL;
--
--    Option B (If orphaned records are confirmed abandoned test artifacts):
--      Only after documented DBA and security audit sign-off:
--      DELETE FROM refresh_tokens WHERE username NOT IN (SELECT username FROM users);
--
-- 3. POST-MIGRATION VERIFICATION QUERY:
--    After applying V5, verify that constraint 'fk_refresh_tokens_user' is active:
--    SELECT 
--        constraint_name, 
--        table_name 
--    FROM information_schema.table_constraints 
--    WHERE table_name = 'refresh_tokens' AND constraint_type = 'FOREIGN KEY';
-- =============================================================================
