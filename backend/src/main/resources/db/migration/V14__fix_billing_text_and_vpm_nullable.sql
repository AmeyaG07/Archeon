-- Fix VARCHAR(255) truncation on uploaded data:image URLs & allow UPI/QR-only vendor payment methods

ALTER TABLE bill_approvals ALTER COLUMN bill_photo_url TYPE TEXT;
ALTER TABLE bill_approvals ALTER COLUMN payment_proof_url TYPE TEXT;
ALTER TABLE bill_approvals ALTER COLUMN dispute_reason TYPE TEXT;
ALTER TABLE bill_approvals ALTER COLUMN rejection_reason TYPE TEXT;

ALTER TABLE payment_transactions ALTER COLUMN proof_attachment_url TYPE TEXT;
ALTER TABLE payment_transactions ALTER COLUMN verification_notes TYPE TEXT;

ALTER TABLE vendor_payment_methods ALTER COLUMN account_holder_name DROP NOT NULL;
ALTER TABLE vendor_payment_methods ALTER COLUMN bank_name DROP NOT NULL;
ALTER TABLE vendor_payment_methods ALTER COLUMN account_number DROP NOT NULL;
ALTER TABLE vendor_payment_methods ALTER COLUMN ifsc_code DROP NOT NULL;
