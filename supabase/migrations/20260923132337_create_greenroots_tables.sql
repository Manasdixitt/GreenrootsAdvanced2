/*
# Create GreenRoots core tables

1. New Tables
- `trees`: Stores registered trees with planter name, type, planting date, location (lat/lng + name), photo URL, status, and growth stage.
- `tree_updates`: Growth tracking updates linked to a tree (height, health status, notes, photo URL, update date).
- `contact_messages`: Stores messages submitted via the contact form (name, email, message, created_at).

2. Security
- Enable RLS on all tables.
- This is a no-auth (single-tenant) app — no sign-in screen. All policies use `TO anon, authenticated` so the anon-key frontend can read and write.
- `USING (true)` / `WITH CHECK (true)` is acceptable because all data is intentionally public/shared.

3. Important Notes
- `trees.id` is referenced by `tree_updates.tree_id` with a foreign key and ON DELETE CASCADE.
- `trees.status` defaults to 'planted' and can be: planted, growing, mature.
- `trees.growth_stage` defaults to 'seedling' and can be: seedling, sapling, young, mature.
- Indexes added on frequently queried columns.
*/

CREATE TABLE IF NOT EXISTS trees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    planter_name text NOT NULL,
    tree_type text NOT NULL,
    planting_date date NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    location_name text NOT NULL DEFAULT '',
    photo_url text,
    status text NOT NULL DEFAULT 'planted',
    growth_stage text NOT NULL DEFAULT 'seedling',
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_trees" ON trees;
CREATE POLICY "anon_select_trees" ON trees FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trees" ON trees;
CREATE POLICY "anon_insert_trees" ON trees FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trees" ON trees;
CREATE POLICY "anon_update_trees" ON trees FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trees" ON trees;
CREATE POLICY "anon_delete_trees" ON trees FOR DELETE
    TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_trees_created_at ON trees (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trees_tree_type ON trees (tree_type);

CREATE TABLE IF NOT EXISTS tree_updates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id uuid NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    update_date date NOT NULL DEFAULT CURRENT_DATE,
    height_cm integer,
    health_status text NOT NULL DEFAULT 'healthy',
    notes text,
    photo_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tree_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tree_updates" ON tree_updates;
CREATE POLICY "anon_select_tree_updates" ON tree_updates FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tree_updates" ON tree_updates;
CREATE POLICY "anon_insert_tree_updates" ON tree_updates FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tree_updates" ON tree_updates;
CREATE POLICY "anon_update_tree_updates" ON tree_updates FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tree_updates" ON tree_updates;
CREATE POLICY "anon_delete_tree_updates" ON tree_updates FOR DELETE
    TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_tree_updates_tree_id ON tree_updates (tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_updates_update_date ON tree_updates (update_date DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact_messages" ON contact_messages;
CREATE POLICY "anon_insert_contact_messages" ON contact_messages FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_contact_messages" ON contact_messages;
CREATE POLICY "anon_select_contact_messages" ON contact_messages FOR SELECT
    TO anon, authenticated USING (true);
