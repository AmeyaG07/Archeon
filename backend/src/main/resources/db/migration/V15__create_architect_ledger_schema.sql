CREATE TABLE IF NOT EXISTS architect_ledger_entries (
    id UUID PRIMARY KEY,
    entry_type VARCHAR(16) NOT NULL,
    source_type VARCHAR(16) NOT NULL,
    source_id VARCHAR(128),
    source_name VARCHAR(255),
    amount NUMERIC(15, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    payment_mode VARCHAR(32),
    category VARCHAR(100),
    reference_number VARCHAR(128),
    notes TEXT,
    recorded_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_arch_ledger_date ON architect_ledger_entries (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_arch_ledger_type ON architect_ledger_entries (entry_type);

CREATE TABLE IF NOT EXISTS architect_audit_reports (
    id UUID PRIMARY KEY,
    report_code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    period_filter VARCHAR(32) NOT NULL,
    report_year INTEGER NOT NULL,
    total_revenue NUMERIC(15, 2) NOT NULL,
    total_expenses NUMERIC(15, 2) NOT NULL,
    net_income NUMERIC(15, 2) NOT NULL,
    entry_count INTEGER NOT NULL,
    workbook_content TEXT NOT NULL,
    generated_by VARCHAR(100),
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_arch_audit_gen ON architect_audit_reports (generated_at DESC);
