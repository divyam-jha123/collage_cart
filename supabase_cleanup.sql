-- ============================================
-- Cleanup Script - Use with Caution!
-- This will drop all tables, policies, and functions
-- ============================================

-- Drop policies first
DROP POLICY IF EXISTS "Authenticated users can insert items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Users can delete their own items" ON items;
DROP POLICY IF EXISTS "Authenticated users can read active items" ON items;

DROP POLICY IF EXISTS "Authenticated users can insert collaborations" ON collaborations;
DROP POLICY IF EXISTS "Users can update their own collaborations" ON collaborations;
DROP POLICY IF EXISTS "Users can delete their own collaborations" ON collaborations;
DROP POLICY IF EXISTS "Authenticated users can read all collaborations" ON collaborations;

-- Drop functions
DROP FUNCTION IF EXISTS get_my_items();
DROP FUNCTION IF EXISTS get_my_collaborations();

-- Drop tables (this will also drop all indexes and constraints)
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS collaborations CASCADE;

-- Note: This will delete all data in these tables!
-- Use this script only if you want to completely start over.

