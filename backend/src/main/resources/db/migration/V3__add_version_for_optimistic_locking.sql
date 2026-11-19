-- ArcheOn Database Schema Migration
-- V3: Add version column to financial transaction and approval entities for optimistic concurrency control

ALTER TABLE bill_approvals ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE cash_settlement_requests ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
