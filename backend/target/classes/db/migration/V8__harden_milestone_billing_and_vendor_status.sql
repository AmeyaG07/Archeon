-- ArcheOn Design Studio — Migration V8
-- Phase 4.2.1: Operational Project Security Remediation
-- 1. Enforce billed_percentage range [0, 100] on project_milestones
-- 2. Add composite index on project_vendor_assignments (vendor_id, status) for high-performance active assignment lookups

ALTER TABLE project_milestones
    ADD CONSTRAINT chk_milestone_billed_percentage CHECK (billed_percentage >= 0 AND billed_percentage <= 100);

CREATE INDEX IF NOT EXISTS idx_pva_vendor_status ON project_vendor_assignments (vendor_id, status);
