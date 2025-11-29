-- ============================================
-- Campus Marketplace App - Supabase Schema
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1️⃣ ITEMS TABLE
-- ============================================

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for items table
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_seller_id ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_is_active ON items(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category) WHERE category IS NOT NULL;

-- Enable Row Level Security on items table
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for items table
-- Drop existing policies if they exist (allows script to be rerun safely)

DROP POLICY IF EXISTS "Authenticated users can insert items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Users can delete their own items" ON items;
DROP POLICY IF EXISTS "Authenticated users can read active items" ON items;

-- Policy: Authenticated users can insert items
CREATE POLICY "Authenticated users can insert items"
    ON items
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = seller_id);

-- Policy: Row owner can update their own items
CREATE POLICY "Users can update their own items"
    ON items
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

-- Policy: Row owner can delete their own items
CREATE POLICY "Users can delete their own items"
    ON items
    FOR DELETE
    TO authenticated
    USING (auth.uid() = seller_id);

-- Policy: Anybody logged in can read active items
CREATE POLICY "Authenticated users can read active items"
    ON items
    FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- ============================================
-- 2️⃣ COLLABORATIONS TABLE
-- ============================================

-- Create collaborations table
CREATE TABLE IF NOT EXISTS collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    contact_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for collaborations table
CREATE INDEX IF NOT EXISTS idx_collaborations_created_at ON collaborations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collaborations_creator_id ON collaborations(creator_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_category ON collaborations(category);

-- Enable Row Level Security on collaborations table
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaborations table
-- Drop existing policies if they exist (allows script to be rerun safely)

DROP POLICY IF EXISTS "Authenticated users can insert collaborations" ON collaborations;
DROP POLICY IF EXISTS "Users can update their own collaborations" ON collaborations;
DROP POLICY IF EXISTS "Users can delete their own collaborations" ON collaborations;
DROP POLICY IF EXISTS "Authenticated users can read all collaborations" ON collaborations;

-- Policy: Authenticated users can insert collaborations
CREATE POLICY "Authenticated users can insert collaborations"
    ON collaborations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id);

-- Policy: Row owner can update their own collaborations
CREATE POLICY "Users can update their own collaborations"
    ON collaborations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- Policy: Row owner can delete their own collaborations
CREATE POLICY "Users can delete their own collaborations"
    ON collaborations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = creator_id);

-- Policy: Anybody logged in can read all collaborations
CREATE POLICY "Authenticated users can read all collaborations"
    ON collaborations
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- HELPER FUNCTIONS (Optional but useful)
-- ============================================

-- Function to get current user's items
CREATE OR REPLACE FUNCTION get_my_items()
RETURNS SETOF items AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM items
    WHERE seller_id = auth.uid()
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's collaborations
CREATE OR REPLACE FUNCTION get_my_collaborations()
RETURNS SETOF collaborations AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM collaborations
    WHERE creator_id = auth.uid()
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE SEED DATA
-- ============================================
-- Note: These seed rows require actual user IDs from auth.users
-- Replace the UUIDs below with actual user IDs after creating test users

-- Sample items (replace seller_id with actual user UUIDs)
-- You can get user IDs from: SELECT id FROM auth.users;

/*
-- Example seed data for items (uncomment and replace UUIDs after creating users)
INSERT INTO items (seller_id, title, description, price, category, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Physics Notes (Sem1)', 'Handwritten neat notes. 40 pages.', 50.00, 'Study Materials', TRUE),
    ('00000000-0000-0000-0000-000000000002', 'Charger Type-C', 'Genuine cable, lightly used.', 200.00, 'Electronics', TRUE),
    ('00000000-0000-0000-0000-000000000003', 'Pocket Calculator', 'Casio-style calculator.', 150.00, 'Electronics', TRUE);

-- Example seed data for collaborations (uncomment and replace UUIDs after creating users)
INSERT INTO collaborations (creator_id, title, category, description, contact_info) VALUES
    ('00000000-0000-0000-0000-000000000002', 'Need 2 for Hackathon', 'Hackathon', 'Forming a team for InnovEdam. Need 1 dev and 1 designer.', '9876543213'),
    ('00000000-0000-0000-0000-000000000001', 'Sunday Cricket Match', 'Cricket', 'Casual 7-a-side. Need 3 players, Sunday 4pm.', 'sports@vedam.edu'),
    ('00000000-0000-0000-0000-000000000003', 'Dance Team for Cultural Fest', 'Dance', 'Looking for 4 dancers and 1 choreographer.', '9876543214');
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('items', 'collaborations');

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('items', 'collaborations');

-- Check policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename IN ('items', 'collaborations');

-- ============================================
-- NOTES
-- ============================================
-- 1. Make sure to enable the UUID extension in your Supabase project
-- 2. Replace placeholder UUIDs in seed data with actual user IDs from auth.users
-- 3. Test the policies by creating test users and trying CRUD operations
-- 4. Adjust policies as needed based on your specific requirements
-- 5. Consider adding updated_at timestamps if you need to track modifications

