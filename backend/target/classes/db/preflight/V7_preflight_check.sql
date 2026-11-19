-- =============================================================================
-- ArcheOn Design Studio — Database Migration V7 Pre-Flight Integrity Check
-- Target: PostgreSQL / H2
-- Purpose: Read-only pre-flight inspection to verify existing schema integrity
--          prior to applying Flyway migration V7 (Operational Projects Domain).
-- Mode: STRICTLY READ-ONLY (No DDL modifications, no row deletions)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Verify Table Existence of Clients & Vendors (Foreign Key Prerequisites)
-- -----------------------------------------------------------------------------
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name IN ('clients', 'vendors', 'users');

-- -----------------------------------------------------------------------------
-- Step 2: Verify Existing Portfolio Projects Table Remains Untouched
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_portfolio_projects 
FROM projects;

-- -----------------------------------------------------------------------------
-- Step 3: Check Active Clients and Vendors Available for Operational Linkage
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_clients,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_clients
FROM clients;

SELECT 
    COUNT(*) AS total_vendors,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_vendors
FROM vendors;

-- -----------------------------------------------------------------------------
-- Step 4: Verify No Pre-Existing Name Clashes with V7 Tables
-- -----------------------------------------------------------------------------
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_name IN (
    'operational_projects', 
    'project_vendor_assignments', 
    'project_phases', 
    'project_milestones', 
    'project_tasks'
);

-- =============================================================================
-- EXPECTED RESULT:
-- 1. 'clients', 'vendors', 'users', 'projects' exist.
-- 2. 'operational_projects', 'project_vendor_assignments', 'project_phases',
--    'project_milestones', 'project_tasks' do NOT exist prior to V7.
-- =============================================================================
