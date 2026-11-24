-- V12: Create Support Tickets and Communication System
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY,
    ticket_reference VARCHAR(64) NOT NULL UNIQUE,
    username VARCHAR(64) NOT NULL,
    user_role VARCHAR(32) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    related_reference VARCHAR(128),
    assigned_team VARCHAR(128),
    description TEXT NOT NULL,
    messages_json TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_username ON support_tickets(username);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
