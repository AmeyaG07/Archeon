-- ArcheOn Design Studio — Migration V6
-- Phase 4.1: Business Identity Domain (Clients, Vendors, User Invitations, and User Profiles)

-- 1. Create Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY,
    client_reference VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(64) NOT NULL,
    organization VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    portal_access VARCHAR(32) NOT NULL DEFAULT 'NOT_INVITED',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- 2. Create Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY,
    vendor_reference VARCHAR(64) NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(64) NOT NULL,
    category VARCHAR(64) NOT NULL,
    location VARCHAR(255),
    gstin VARCHAR(32),
    pan VARCHAR(32),
    bank_details_json TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    portal_access VARCHAR(32) NOT NULL DEFAULT 'NOT_INVITED',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- 3. Create User Invitations Table (Invitation-Only Onboarding)
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    target_role VARCHAR(64) NOT NULL,
    client_id UUID,
    vendor_id UUID,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    invited_by VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_invitations_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT fk_invitations_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- 4. Alter Users Table with Identity and Audit Fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vendor_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 5. Foreign Key Constraints on Users Table
ALTER TABLE users ADD CONSTRAINT fk_users_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- 6. Indexes for High-Velocity Identity Lookups
CREATE INDEX IF NOT EXISTS idx_clients_reference ON clients (client_reference);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients (email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status);

CREATE INDEX IF NOT EXISTS idx_vendors_reference ON vendors (vendor_reference);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors (email);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors (category);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors (status);

CREATE INDEX IF NOT EXISTS idx_user_invitations_token_hash ON user_invitations (token_hash);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations (email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations (status);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users (client_id);
CREATE INDEX IF NOT EXISTS idx_users_vendor_id ON users (vendor_id);
