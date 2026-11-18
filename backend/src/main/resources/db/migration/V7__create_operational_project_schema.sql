-- ArcheOn Design Studio — Migration V7
-- Phase 4.2: Operational Project Management (Projects, Vendor Assignments, Phases, Milestones, and Tasks)

-- 1. Create Operational Projects Table
CREATE TABLE IF NOT EXISTS operational_projects (
    id UUID PRIMARY KEY,
    project_reference VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(64) NOT NULL,
    client_id UUID NOT NULL,
    project_manager_username VARCHAR(50),
    site_address VARCHAR(255),
    contract_value NUMERIC(15,2),
    budget_allocated NUMERIC(15,2),
    status VARCHAR(32) NOT NULL DEFAULT 'PLANNING',
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_operational_project_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);

-- 2. Create Project Vendor Assignments Table
CREATE TABLE IF NOT EXISTS project_vendor_assignments (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    scope_of_work VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    contract_amount NUMERIC(15,2),
    assigned_by VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_pva_project FOREIGN KEY (project_id) REFERENCES operational_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pva_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
    CONSTRAINT uq_project_vendor UNIQUE (project_id, vendor_id)
);

-- 3. Create Project Phases Table
CREATE TABLE IF NOT EXISTS project_phases (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sequence_order INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_phase_project FOREIGN KEY (project_id) REFERENCES operational_projects(id) ON DELETE CASCADE,
    CONSTRAINT uq_project_phase_order UNIQUE (project_id, sequence_order)
);

-- 4. Create Project Milestones Table
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    phase_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    responsible_owner VARCHAR(100),
    billed_percentage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_milestone_project FOREIGN KEY (project_id) REFERENCES operational_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_milestone_phase FOREIGN KEY (phase_id) REFERENCES project_phases(id) ON DELETE SET NULL
);

-- 5. Create Project Tasks Table
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    phase_id UUID,
    milestone_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'TODO',
    assigned_to VARCHAR(100),
    assigned_vendor_id UUID,
    due_date DATE,
    completed_at TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES operational_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_phase FOREIGN KEY (phase_id) REFERENCES project_phases(id) ON DELETE SET NULL,
    CONSTRAINT fk_task_milestone FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL,
    CONSTRAINT fk_task_vendor FOREIGN KEY (assigned_vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- 6. Indexes for Operational Project Queries
CREATE INDEX IF NOT EXISTS idx_op_proj_ref ON operational_projects (project_reference);
CREATE INDEX IF NOT EXISTS idx_op_proj_client ON operational_projects (client_id);
CREATE INDEX IF NOT EXISTS idx_op_proj_status ON operational_projects (status);
CREATE INDEX IF NOT EXISTS idx_op_proj_pm ON operational_projects (project_manager_username);

CREATE INDEX IF NOT EXISTS idx_pva_project ON project_vendor_assignments (project_id);
CREATE INDEX IF NOT EXISTS idx_pva_vendor ON project_vendor_assignments (vendor_id);
CREATE INDEX IF NOT EXISTS idx_pva_status ON project_vendor_assignments (status);

CREATE INDEX IF NOT EXISTS idx_pp_project ON project_phases (project_id);
CREATE INDEX IF NOT EXISTS idx_pp_status ON project_phases (status);
CREATE INDEX IF NOT EXISTS idx_pp_order ON project_phases (project_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_pm_project ON project_milestones (project_id);
CREATE INDEX IF NOT EXISTS idx_pm_phase ON project_milestones (phase_id);
CREATE INDEX IF NOT EXISTS idx_pm_status ON project_milestones (status);
CREATE INDEX IF NOT EXISTS idx_pm_due ON project_milestones (due_date);

CREATE INDEX IF NOT EXISTS idx_pt_project ON project_tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_pt_phase ON project_tasks (phase_id);
CREATE INDEX IF NOT EXISTS idx_pt_milestone ON project_tasks (milestone_id);
CREATE INDEX IF NOT EXISTS idx_pt_vendor ON project_tasks (assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_pt_assigned ON project_tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_pt_status ON project_tasks (status);
