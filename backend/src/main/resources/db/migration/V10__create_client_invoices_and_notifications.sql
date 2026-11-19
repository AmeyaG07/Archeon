-- V10__create_client_invoices_and_notifications.sql
-- ArcheOn Design Studio: Client GST Invoicing, In-App Notifications, and Reporting Foundations

-- 1. Client GST Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    project_id VARCHAR(64),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL,
    cgst_rate NUMERIC(5,2) NOT NULL DEFAULT 9.00,
    cgst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    sgst_rate NUMERIC(5,2) NOT NULL DEFAULT 9.00,
    sgst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    igst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'ISSUED',
    sac_code VARCHAR(16) NOT NULL DEFAULT '998321',
    studio_gstin VARCHAR(15) NOT NULL DEFAULT '27AABCU9603R1ZM',
    client_gstin VARCHAR(15),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- 2. Client GST Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    sac_code VARCHAR(16) NOT NULL DEFAULT '998321',
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit_rate NUMERIC(15,2) NOT NULL,
    taxable_amount NUMERIC(15,2) NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- 3. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    recipient_username VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    read_status BOOLEAN NOT NULL DEFAULT false,
    action_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_username, read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_username, created_at DESC);
