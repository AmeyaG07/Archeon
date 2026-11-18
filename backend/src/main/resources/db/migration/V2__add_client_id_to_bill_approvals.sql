-- ArcheOn Database Schema Migration
-- V2: Add client_id column to bill_approvals for explicit client ownership

ALTER TABLE bill_approvals ADD COLUMN IF NOT EXISTS client_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_bill_approvals_client_id ON bill_approvals(client_id);
