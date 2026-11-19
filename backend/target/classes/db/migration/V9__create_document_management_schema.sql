-- ArcheOn Design Studio — Migration V9
-- Phase 4.3: Document Management System (DMS) & Secure Object Storage Subsystem

-- 1. Create Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY,
    document_reference VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL,
    security_classification VARCHAR(32) NOT NULL DEFAULT 'INTERNAL_STAFF',
    client_id UUID,
    project_id UUID,
    current_version_id UUID,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    archived_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_doc_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_doc_project FOREIGN KEY (project_id) REFERENCES operational_projects(id) ON DELETE RESTRICT
);

-- 2. Create Document Versions Table
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    storage_provider VARCHAR(32) NOT NULL DEFAULT 'LOCAL_PRIVATE',
    uploaded_by VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quarantine_status VARCHAR(32) NOT NULL DEFAULT 'CLEARED',
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_docver_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE RESTRICT,
    CONSTRAINT uq_docver_doc_version UNIQUE (document_id, version_number)
);

-- 3. Create Document Permissions Table
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    grantee_type VARCHAR(32) NOT NULL,
    grantee_id UUID NOT NULL,
    permission_level VARCHAR(32) NOT NULL DEFAULT 'READ',
    granted_by VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_docperm_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT uq_docperm_grant UNIQUE (document_id, grantee_type, grantee_id)
);

-- 4. Create Indexes for High-Velocity Filter Queries and Referential Lookups
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_security_class ON documents(security_classification);
CREATE INDEX IF NOT EXISTS idx_documents_reference ON documents(document_reference);
CREATE INDEX IF NOT EXISTS idx_docversions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_docversions_checksum ON document_versions(sha256_checksum);
CREATE INDEX IF NOT EXISTS idx_docpermissions_doc_grantee ON document_permissions(document_id, grantee_type, grantee_id);
CREATE INDEX IF NOT EXISTS idx_docpermissions_grantee ON document_permissions(grantee_type, grantee_id);
