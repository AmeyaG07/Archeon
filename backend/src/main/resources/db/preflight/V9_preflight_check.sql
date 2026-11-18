-- =============================================================================
-- ArcheOn Design Studio — Database Migration V9 Pre-Flight Integrity Check
-- Target: PostgreSQL / H2
-- Purpose: Read-only pre-flight inspection to verify existing schema integrity
--          prior to applying Flyway migration V9 (Document Management System).
-- Mode: STRICTLY READ-ONLY (No DDL modifications, no row deletions)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Verify Table Existence of Clients, Operational Projects & Users
-- -----------------------------------------------------------------------------
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name IN ('clients', 'operational_projects', 'vendors', 'users');

-- -----------------------------------------------------------------------------
-- Step 2: Verify Existing Operational Projects Table is Active and Accessible
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_operational_projects,
    SUM(CASE WHEN status != 'ARCHIVED' THEN 1 ELSE 0 END) AS active_projects
FROM operational_projects;

-- -----------------------------------------------------------------------------
-- Step 3: Check Active Clients Available for Document Linkage
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_clients,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_clients
FROM clients;

-- -----------------------------------------------------------------------------
-- Step 4: Verify No Pre-Existing Name Clashes with V9 Tables
-- -----------------------------------------------------------------------------
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_name IN (
    'documents', 
    'document_versions', 
    'document_permissions'
);

-- =============================================================================
-- EXPECTED RESULT:
-- 1. 'clients', 'operational_projects', 'vendors', 'users' exist.
-- 2. 'documents', 'document_versions', 'document_permissions' do NOT exist prior to V9.
-- =============================================================================
