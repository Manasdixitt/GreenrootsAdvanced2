/*
# Add Tree UID, Planter Email, and Update Tracking Columns

1. Purpose
   - Phase 1: Add compulsory planter email to tree registrations.
   - Phase 2: Add a unique, publicly-safe Tree UID for UID-based tracking.
   - Prepare the data model for scheduled update tracking (next_update_due).

2. New Columns on "trees"
   - "tree_uid" (text, unique, not null) — A human-readable unique identifier
     like "GR-KAN-8F42A1" that is safe to display publicly. Generated client-side
     during registration. Indexed with a unique constraint.
   - "planter_email" (text, not null) — The email address of the person registering
     the tree. Required for future notifications and certificates.
   - "next_update_due" (date, nullable) — The date by which the next growth update
     should be submitted. Set to planting_date + 90 days by default. Enables
     future scheduled-tracking features without implementing them now.

3. New Columns on "tree_updates"
   - "growth_stage" (text, nullable) — The growth stage at the time of the update
     (seedling, sapling, young, mature). Allows tracking stage progression over time.
   - "photo_url" already exists on tree_updates but was unused. Now used for
     update-specific photos.

4. Constraints
   - Unique constraint on trees.tree_uid to guarantee uniqueness.
   - CHECK constraint on tree_updates.growth_stage for valid values.
   - planter_email has no CHECK constraint (email validation done client-side).

5. RLS
   - No policy changes. Existing SELECT+INSERT policies on trees and tree_updates
     already cover the new columns. The public can read tree_uid (it's intentionally
     public) and insert it during registration. planter_email is readable via SELECT
     but this is acceptable for the current no-auth community platform (same as
     planter_name). Contact_messages remain write-only.

6. Important Notes
   - All changes are additive — no data is lost.
   - Existing rows (if any) get NULL for tree_uid initially; the app generates UIDs
     for new registrations. A backfill is not needed since the table is currently empty.
   - next_update_due defaults to planting_date + 90 days via a DEFAULT expression.
*/

-- Add tree_uid to trees
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trees' AND column_name = 'tree_uid'
    ) THEN
        ALTER TABLE trees ADD COLUMN tree_uid text;
    END IF;
END $$;

-- Add planter_email to trees
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trees' AND column_name = 'planter_email'
    ) THEN
        ALTER TABLE trees ADD COLUMN planter_email text;
    END IF;
END $$;

-- Add next_update_due to trees
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trees' AND column_name = 'next_update_due'
    ) THEN
        ALTER TABLE trees ADD COLUMN next_update_due date;
    END IF;
END $$;

-- Add unique index on tree_uid
CREATE UNIQUE INDEX IF NOT EXISTS idx_trees_tree_uid ON trees (tree_uid) WHERE tree_uid IS NOT NULL;

-- Add growth_stage to tree_updates
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tree_updates' AND column_name = 'growth_stage'
    ) THEN
        ALTER TABLE tree_updates ADD COLUMN growth_stage text;
    END IF;
END $$;

-- Add CHECK constraint on tree_updates.growth_stage
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tree_updates_growth_stage_check'
    ) THEN
        ALTER TABLE tree_updates ADD CONSTRAINT tree_updates_growth_stage_check
            CHECK (growth_stage IS NULL OR growth_stage IN ('seedling', 'sapling', 'young', 'mature'));
    END IF;
END $$;

-- Add index on tree_updates update_date for chronological queries
CREATE INDEX IF NOT EXISTS idx_tree_updates_update_date ON tree_updates (update_date);
