-- Add contact_info column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS contact_info TEXT;
