-- ArcheOn Design Studio — Migration V11
-- Billing & Project Expense Management Feature Baseline
-- Covers: SiteUpdates, VendorPaymentMethods, Projects last_visit_date, and Bills lifecycle extensions

-- 1. Extend Operational Projects with Last Site Visit Date
ALTER TABLE operational_projects ADD COLUMN IF NOT EXISTS last_visit_date DATE;

-- 2. Create Site Updates Table (Photos and notes uploaded by Architect or Vendor)
CREATE TABLE IF NOT EXISTS site_updates (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    author_role VARCHAR(32) NOT NULL, -- 'ARCHITECT', 'VENDOR'
    author_name VARCHAR(100) NOT NULL,
    photo_url TEXT,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_site_updates_project FOREIGN KEY (project_id) REFERENCES operational_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_site_updates_project ON site_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_site_updates_created_at ON site_updates(created_at DESC);

-- 3. Create Vendor Payment Methods Table (Bank details and QR code managed by Vendor)
CREATE TABLE IF NOT EXISTS vendor_payment_methods (
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL UNIQUE,
    account_holder_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    ifsc_code VARCHAR(50) NOT NULL,
    upi_id VARCHAR(100),
    qr_code_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vpm_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vpm_vendor ON vendor_payment_methods(vendor_id);

-- 4. Extend Bill Approvals (Bills) Table for Full Lifecycle & Reminders
ALTER TABLE bill_approvals ADD COLUMN IF NOT EXISTS bill_photo_url TEXT;
ALTER TABLE bill_approvals ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP;
ALTER TABLE bill_approvals ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE bill_approvals ADD COLUMN IF NOT EXISTS trade_category VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_bill_approvals_status ON bill_approvals(status);
CREATE INDEX IF NOT EXISTS idx_bill_approvals_vendor ON bill_approvals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bill_approvals_client ON bill_approvals(client_id);
CREATE INDEX IF NOT EXISTS idx_bill_approvals_project ON bill_approvals(project_id);
