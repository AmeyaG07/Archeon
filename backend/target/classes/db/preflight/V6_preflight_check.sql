-- =============================================================================
-- ArcheOn Design Studio — Database Migration V6 Pre-Flight Integrity Check
-- Target: PostgreSQL / H2
-- Purpose: Read-only pre-flight inspection to verify existing schema integrity
--          prior to applying Flyway migration V6 (Business Identity Domain).
-- Mode: STRICTLY READ-ONLY (No DDL modifications, no row deletions)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Verify Table Existence of Users & Financial Records
-- -----------------------------------------------------------------------------
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name IN ('users', 'bill_approvals', 'cash_settlement_requests', 'payment_transactions');

-- -----------------------------------------------------------------------------
-- Step 2: Check Existing Users Count and Status Integrity
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_users,
    SUM(CASE WHEN enabled = true THEN 1 ELSE 0 END) AS enabled_users,
    SUM(CASE WHEN enabled = false THEN 1 ELSE 0 END) AS disabled_users
FROM users;

-- -----------------------------------------------------------------------------
-- Step 3: Check Existing Bill Approvals with Client and Vendor References
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_bills,
    COUNT(DISTINCT vendor_id) AS distinct_legacy_vendors,
    COUNT(DISTINCT client_id) AS distinct_legacy_clients
FROM bill_approvals;

-- -----------------------------------------------------------------------------
-- Step 4: Verify No Pre-Existing Name Clashes with V6 Tables
-- -----------------------------------------------------------------------------
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_name IN ('clients', 'vendors', 'user_invitations');

-- =============================================================================
-- EXPECTED RESULT:
-- 1. 'users', 'bill_approvals', etc. exist and have valid records.
-- 2. 'clients', 'vendors', 'user_invitations' do NOT exist prior to V6.
-- =============================================================================
