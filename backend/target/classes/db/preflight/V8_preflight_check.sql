-- =============================================================================
-- ArcheOn Design Studio — Database Migration V8 Pre-Flight Integrity Check
-- Target: PostgreSQL / H2
-- Purpose: Read-only pre-flight inspection prior to applying Flyway migration V8
--          (Enforce milestone billing percentage boundaries & index vendor assignments)
-- Mode: STRICTLY READ-ONLY (No DDL modifications, no row deletions)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Verify Table Existence
-- -----------------------------------------------------------------------------
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name IN ('project_milestones', 'project_vendor_assignments');

-- -----------------------------------------------------------------------------
-- Step 2: Verify No Out-of-Range Milestone Billed Percentages Exist
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS violating_milestones_count
FROM project_milestones
WHERE billed_percentage < 0 OR billed_percentage > 100;

-- -----------------------------------------------------------------------------
-- Step 3: Check Project Vendor Assignment Status Distribution
-- -----------------------------------------------------------------------------
SELECT 
    status,
    COUNT(*) AS assignment_count
FROM project_vendor_assignments
GROUP BY status;
