/*
# Phase 2 — Configuration: project-scoped audit schema

## Summary
Restructures the existing flat schema into a project-oriented model. Renames
`analysis_records` → `audit_results` and `sources` → `result_sources` (pure
rename, no compatibility views). Adds `projects`, `competitors`,
`project_surfaces` tables. Extends `prompts` → `project_prompts` with
project linkage and activation flag. Adds `organization_id` (nullable) on
`projects`, `audit_runs`, `audit_results`, and `project_prompts` for future
multi-team separation. Seeds default PlayVOD project, 4 demo competitors,
5 AI surfaces, and 6 French audit prompts.

## Renamed Tables
1. `analysis_records` → `audit_results` — same columns, FK references updated.
2. `sources` → `result_sources` — same columns, FK updated to `audit_results`.
3. `prompts` → `project_prompts` — new columns added: `project_id`, `is_active`,
   `sort_order`, `organization_id`.

## New Tables
1. `projects` — audit project configuration (brand name, domain, country, language).
2. `competitors` — competitor entries per project (unique name per project).
3. `project_surfaces` — AI surfaces tracked per project (unique surface per project).

## Modified Tables
1. `audit_runs` — added `project_id` (FK → projects, CASCADE) and `organization_id` (nullable).
2. `audit_results` — added `project_id` (FK → projects, CASCADE) and `organization_id` (nullable).
3. `brand_analyses` — FK updated from `analysis_records` to `audit_results`.
4. `competitor_mentions` — no structural change (FK to `brand_analyses` unchanged).

## Security
- RLS enabled on all new tables (`projects`, `competitors`, `project_surfaces`).
- Policies use `TO anon, authenticated` with full CRUD — single-tenant demo, no sign-in.
- Existing tables already have RLS; their policies remain unchanged.

## Important Notes
1. `ALTER TABLE ... RENAME TO` preserves all data, indexes, and constraints.
2. Foreign key constraints referencing renamed tables are automatically updated by PostgreSQL.
3. `brand_analyses.analysis_record_id` is renamed to `audit_result_id` for clarity.
4. Default project seeded with PlayVOD values (FR, fr).
5. `organization_id` columns are nullable and unused in phase 2 — prepared for future multi-team.
*/

-- ============================================================
-- 1. Rename analysis_records → audit_results
-- ============================================================
ALTER TABLE IF EXISTS analysis_records RENAME TO audit_results;

-- Rename the FK column in brand_analyses for clarity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brand_analyses' AND column_name = 'analysis_record_id'
  ) THEN
    ALTER TABLE brand_analyses RENAME COLUMN analysis_record_id TO audit_result_id;
  END IF;
END $$;

-- Update the unique constraint name on brand_analyses
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'brand_analyses_analysis_record_unique'
  ) THEN
    ALTER TABLE brand_analyses RENAME CONSTRAINT brand_analyses_analysis_record_unique TO brand_analyses_audit_result_unique;
  END IF;
END $$;

-- Update index name on brand_analyses
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_brand_analyses_analysis_record_id'
  ) THEN
    ALTER INDEX IF EXISTS idx_brand_analyses_analysis_record_id RENAME TO idx_brand_analyses_audit_result_id;
  END IF;
END $$;

-- ============================================================
-- 2. Rename sources → result_sources
-- ============================================================
ALTER TABLE IF EXISTS sources RENAME TO result_sources;

-- Rename FK column in result_sources for clarity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'result_sources' AND column_name = 'analysis_record_id'
  ) THEN
    ALTER TABLE result_sources RENAME COLUMN analysis_record_id TO audit_result_id;
  END IF;
END $$;

-- Update index name on result_sources
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_sources_analysis_record_id'
  ) THEN
    ALTER INDEX IF EXISTS idx_sources_analysis_record_id RENAME TO idx_result_sources_audit_result_id;
  END IF;
END $$;

-- ============================================================
-- 3. Create projects table
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  name text NOT NULL,
  domain text NOT NULL,
  country text NOT NULL DEFAULT 'FR',
  country_custom text,
  language text NOT NULL DEFAULT 'fr',
  language_custom text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 4. Create competitors table
-- ============================================================
CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_competitors" ON competitors;
CREATE POLICY "anon_select_competitors" ON competitors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_competitors" ON competitors;
CREATE POLICY "anon_insert_competitors" ON competitors FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_competitors" ON competitors;
CREATE POLICY "anon_update_competitors" ON competitors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_competitors" ON competitors;
CREATE POLICY "anon_delete_competitors" ON competitors FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. Create project_surfaces table
-- ============================================================
CREATE TABLE IF NOT EXISTS project_surfaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  surface text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(project_id, surface)
);

ALTER TABLE project_surfaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_project_surfaces" ON project_surfaces;
CREATE POLICY "anon_select_project_surfaces" ON project_surfaces FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_project_surfaces" ON project_surfaces;
CREATE POLICY "anon_insert_project_surfaces" ON project_surfaces FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_project_surfaces" ON project_surfaces;
CREATE POLICY "anon_update_project_surfaces" ON project_surfaces FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_project_surfaces" ON project_surfaces;
CREATE POLICY "anon_delete_project_surfaces" ON project_surfaces FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 6. Rename prompts → project_prompts and add columns
-- ============================================================
ALTER TABLE IF EXISTS prompts RENAME TO project_prompts;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_prompts' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE project_prompts ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_prompts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE project_prompts ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_prompts' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE project_prompts ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_prompts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE project_prompts ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- Enable RLS on project_prompts (was already enabled on prompts, rename preserves it)
ALTER TABLE project_prompts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. Add project_id and organization_id to audit_runs
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_runs' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE audit_runs ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_runs' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE audit_runs ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- ============================================================
-- 8. Add project_id and organization_id to audit_results
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_results' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE audit_results ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_results' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE audit_results ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- ============================================================
-- 9. Update FK on audit_results: prompt_id now references project_prompts
-- ============================================================
DO $$
BEGIN
  -- Drop the old FK constraint that referenced prompts(id)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'audit_results_prompt_id_fkey'
  ) THEN
    ALTER TABLE audit_results DROP CONSTRAINT audit_results_prompt_id_fkey;
  END IF;
  -- Recreate with reference to project_prompts(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'audit_results_prompt_id_fkey'
  ) THEN
    ALTER TABLE audit_results
      ADD CONSTRAINT audit_results_prompt_id_fkey
      FOREIGN KEY (prompt_id) REFERENCES project_prompts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 10. Seed default project, competitors, surfaces, and prompts
-- ============================================================

-- Default project (only if none exists)
INSERT INTO projects (id, name, domain, country, language)
SELECT '00000000-0000-0000-0000-000000000001', 'PlayVOD', 'playvod.com', 'FR', 'fr'
WHERE NOT EXISTS (SELECT 1 FROM projects LIMIT 1);

-- Demo competitors
INSERT INTO competitors (project_id, name, domain)
SELECT '00000000-0000-0000-0000-000000000001', 'Netflix', 'netflix.com'
WHERE NOT EXISTS (SELECT 1 FROM competitors WHERE project_id = '00000000-0000-0000-0000-000000000001' AND name = 'Netflix');

INSERT INTO competitors (project_id, name, domain)
SELECT '00000000-0000-0000-0000-000000000001', 'Amazon Prime Video', 'primevideo.com'
WHERE NOT EXISTS (SELECT 1 FROM competitors WHERE project_id = '00000000-0000-0000-0000-000000000001' AND name = 'Amazon Prime Video');

INSERT INTO competitors (project_id, name, domain)
SELECT '00000000-0000-0000-0000-000000000001', 'Disney+', 'disneyplus.com'
WHERE NOT EXISTS (SELECT 1 FROM competitors WHERE project_id = '00000000-0000-0000-0000-000000000001' AND name = 'Disney+');

INSERT INTO competitors (project_id, name, domain)
SELECT '00000000-0000-0000-0000-000000000001', 'Apple TV+', 'apple.com/apple-tv-plus'
WHERE NOT EXISTS (SELECT 1 FROM competitors WHERE project_id = '00000000-0000-0000-0000-000000000001' AND name = 'Apple TV+');

-- AI surfaces
INSERT INTO project_surfaces (project_id, surface, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'ChatGPT', true
WHERE NOT EXISTS (SELECT 1 FROM project_surfaces WHERE project_id = '00000000-0000-0000-0000-000000000001' AND surface = 'ChatGPT');

INSERT INTO project_surfaces (project_id, surface, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'Gemini', true
WHERE NOT EXISTS (SELECT 1 FROM project_surfaces WHERE project_id = '00000000-0000-0000-0000-000000000001' AND surface = 'Gemini');

INSERT INTO project_surfaces (project_id, surface, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'Perplexity', true
WHERE NOT EXISTS (SELECT 1 FROM project_surfaces WHERE project_id = '00000000-0000-0000-0000-000000000001' AND surface = 'Perplexity');

INSERT INTO project_surfaces (project_id, surface, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'Claude', true
WHERE NOT EXISTS (SELECT 1 FROM project_surfaces WHERE project_id = '00000000-0000-0000-0000-000000000001' AND surface = 'Claude');

INSERT INTO project_surfaces (project_id, surface, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'Google AI Overview', true
WHERE NOT EXISTS (SELECT 1 FROM project_surfaces WHERE project_id = '00000000-0000-0000-0000-000000000001' AND surface = 'Google AI Overview');

-- Link existing prompts to the default project and set is_active + sort_order
UPDATE project_prompts
SET project_id = '00000000-0000-0000-0000-000000000001',
    is_active = true,
    sort_order = (
      CASE id
        WHEN 'prompt-1' THEN 0
        WHEN 'prompt-2' THEN 1
        WHEN 'prompt-3' THEN 2
        WHEN 'prompt-4' THEN 3
        WHEN 'prompt-5' THEN 4
        WHEN 'prompt-6' THEN 5
        ELSE 99
      END
    )
WHERE project_id IS NULL;

-- ============================================================
-- 11. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_competitors_project_id ON competitors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_surfaces_project_id ON project_surfaces(project_id);
CREATE INDEX IF NOT EXISTS idx_project_prompts_project_id ON project_prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_runs_project_id ON audit_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_project_id ON audit_results(project_id);
