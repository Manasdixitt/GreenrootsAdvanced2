/*
# Tighten RLS policies and add data constraints

1. Security Changes
   - `trees`: Remove public UPDATE and DELETE policies. The public website only needs
     to SELECT (display trees) and INSERT (register trees). UPDATE/DELETE should not be
     available to the anon-key frontend.
   - `tree_updates`: Remove public UPDATE and DELETE policies. Same rationale — the
     public website only needs SELECT (display growth history) and INSERT (add updates).
   - `contact_messages`: Remove public SELECT policy. Contact messages are private —
     the public can INSERT (submit a message) but must not be able to read back
     submitted messages. This protects user-submitted email addresses and message content.

2. Data Constraints
   - Add CHECK constraints on `trees.growth_stage` to restrict to valid values
     (seedling, sapling, young, mature).
   - Add CHECK constraint on `trees.status` to restrict to valid values
     (planted, growing, mature, deceased).
   - Add CHECK constraint on `tree_updates.health_status` to restrict to valid values
     (healthy, needs_attention, diseased, deceased).
   - Add CHECK constraints to ensure latitude/longitude are within valid ranges.
   - Add CHECK constraint to ensure height_cm is non-negative when provided.

3. Important Notes
   - All changes are additive/constraint-based — no data is lost.
   - The app is a no-auth (single-tenant) public website, so SELECT + INSERT remain
     open to `anon, authenticated` on trees and tree_updates (intentionally public data).
   - Contact messages are write-only from the public perspective.
*/

-- === TREES: tighten RLS ===
-- Keep SELECT and INSERT, remove UPDATE and DELETE from public access
DROP POLICY IF EXISTS "anon_update_trees" ON trees;
DROP POLICY IF EXISTS "anon_delete_trees" ON trees;

-- Re-confirm SELECT and INSERT policies are in place
DROP POLICY IF EXISTS "anon_select_trees" ON trees;
CREATE POLICY "anon_select_trees" ON trees FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trees" ON trees;
CREATE POLICY "anon_insert_trees" ON trees FOR INSERT
    TO anon, authenticated WITH CHECK (true);

-- Add CHECK constraints on trees
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trees_growth_stage_check'
    ) THEN
        ALTER TABLE trees ADD CONSTRAINT trees_growth_stage_check
            CHECK (growth_stage IN ('seedling', 'sapling', 'young', 'mature'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trees_status_check'
    ) THEN
        ALTER TABLE trees ADD CONSTRAINT trees_status_check
            CHECK (status IN ('planted', 'growing', 'mature', 'deceased'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trees_latitude_check'
    ) THEN
        ALTER TABLE trees ADD CONSTRAINT trees_latitude_check
            CHECK (latitude >= -90 AND latitude <= 90);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trees_longitude_check'
    ) THEN
        ALTER TABLE trees ADD CONSTRAINT trees_longitude_check
            CHECK (longitude >= -180 AND longitude <= 180);
    END IF;
END $$;

-- === TREE_UPDATES: tighten RLS ===
-- Keep SELECT and INSERT, remove UPDATE and DELETE from public access
DROP POLICY IF EXISTS "anon_update_tree_updates" ON tree_updates;
DROP POLICY IF EXISTS "anon_delete_tree_updates" ON tree_updates;

-- Re-confirm SELECT and INSERT policies are in place
DROP POLICY IF EXISTS "anon_select_tree_updates" ON tree_updates;
CREATE POLICY "anon_select_tree_updates" ON tree_updates FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tree_updates" ON tree_updates;
CREATE POLICY "anon_insert_tree_updates" ON tree_updates FOR INSERT
    TO anon, authenticated WITH CHECK (true);

-- Add CHECK constraint on tree_updates.health_status
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tree_updates_health_status_check'
    ) THEN
        ALTER TABLE tree_updates ADD CONSTRAINT tree_updates_health_status_check
            CHECK (health_status IN ('healthy', 'needs_attention', 'diseased', 'deceased'));
    END IF;
END $$;

-- Add CHECK constraint on tree_updates.height_cm (non-negative)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tree_updates_height_cm_check'
    ) THEN
        ALTER TABLE tree_updates ADD CONSTRAINT tree_updates_height_cm_check
            CHECK (height_cm IS NULL OR height_cm >= 0);
    END IF;
END $$;

-- Add index on tree_updates tree_id for efficient joins (already exists, ensure it's there)
CREATE INDEX IF NOT EXISTS idx_tree_updates_tree_id ON tree_updates (tree_id);

-- === CONTACT_MESSAGES: tighten RLS ===
-- Remove public SELECT — contact messages are private (write-only from public)
DROP POLICY IF EXISTS "anon_select_contact_messages" ON contact_messages;

-- Re-confirm INSERT-only policy
DROP POLICY IF EXISTS "anon_insert_contact_messages" ON contact_messages;
CREATE POLICY "anon_insert_contact_messages" ON contact_messages FOR INSERT
    TO anon, authenticated WITH CHECK (true);
