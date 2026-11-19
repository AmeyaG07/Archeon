-- ArcheOn Design Studio — Migration V5
-- Phase 3.1: Concurrency Tracking, Versioning, and Referential Integrity

-- 1. Add consumed_at timestamp for distinguishing concurrent rotation from token replay
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMP;

-- 2. Add version column for optimistic locking
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 3. Add Foreign Key with ON DELETE RESTRICT to preserve forensic electronic evidence
ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (username) REFERENCES users(username) ON DELETE RESTRICT;
