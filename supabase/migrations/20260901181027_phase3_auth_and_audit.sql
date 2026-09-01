/*
# Phase 3 — Authentication, organizations, and audit traceability

## Summary
Adds multi-user authentication with organization-scoped access control.
All existing public (anon) policies are replaced with authenticated-only
policies that check organization membership. Adds user_profiles, organizations,
organization_members tables, a transactional create_user_account function,
audit_run status tracking, audit_results columns for API collection, and
result_sources columns for domain/snippet/position.

## New Tables
1. organizations (id, name, created_at)
2. organization_members (id, organization_id, user_id, role, created_at, UNIQUE org+user)
3. user_profiles (id = auth.uid(), display_name, created_at)

## New Functions
1. is_org_member(target_org_id) — SECURITY DEFINER boolean helper
2. create_user_account(display_name) — SECURITY DEFINER transactional signup

## Modified Tables
1. projects — organization_id NOT NULL with default + FK
2. audit_runs — added status (text, default 'pending')
3. audit_results — added collection_method, error_message, usage_data, cost_data, brand_mentioned, brand_position
4. result_sources — added domain, snippet, position

## Security
ALL anon policies dropped, replaced with authenticated-only org-scoped policies.

## Notes
- Seed org 00000000-0000-0000-0000-000000000010 created for existing data
- Existing projects/audit_runs/audit_results updated to reference seed org
*/

-- ============================================================
-- 1. Create organizations table
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Create organization_members table
-- ============================================================
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Create user_profiles table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. is_org_member helper (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION is_org_member(target_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = target_org_id
    AND user_id = auth.uid()
  );
END;
$$;

-- ============================================================
-- 5. create_user_account transactional function
-- ============================================================
CREATE OR REPLACE FUNCTION create_user_account(display_name text)
RETURNS TABLE(organization_id uuid, organization_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
  org_name text;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO user_profiles (id, display_name)
  VALUES (uid, display_name)
  ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;
  IF display_name IS NULL OR btrim(display_name) = '' THEN
    org_name := 'Mon organisation';
  ELSE
    org_name := 'Espace de ' || btrim(display_name);
  END IF;
  INSERT INTO organizations (name) VALUES (org_name) RETURNING id INTO org_id;
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (org_id, uid, 'owner');
  RETURN QUERY SELECT org_id, org_name;
END;
$$;

-- ============================================================
-- 6. Seed default organization
-- ============================================================
INSERT INTO organizations (id, name)
SELECT '00000000-0000-0000-0000-000000000010', 'Organisation PlayVOD'
WHERE NOT EXISTS (
  SELECT 1 FROM organizations WHERE id = '00000000-0000-0000-0000-000000000010'
);

-- ============================================================
-- 7. projects.organization_id NOT NULL + FK
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'organization_id'
  ) THEN
    UPDATE projects SET organization_id = '00000000-0000-0000-0000-000000000010'
    WHERE organization_id IS NULL;
    ALTER TABLE projects ALTER COLUMN organization_id SET DEFAULT '00000000-0000-0000-0000-000000000010';
    ALTER TABLE projects ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_organization_id_fkey'
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT projects_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 8. audit_runs.status
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_runs' AND column_name = 'status'
  ) THEN
    ALTER TABLE audit_runs ADD COLUMN status text NOT NULL DEFAULT 'pending';
  END IF;
END $$;

UPDATE audit_runs SET organization_id = '00000000-0000-0000-0000-000000000010'
WHERE organization_id IS NULL;

-- ============================================================
-- 9. audit_results new columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_results' AND column_name = 'collection_method') THEN
    ALTER TABLE audit_results ADD COLUMN collection_method text NOT NULL DEFAULT 'browser';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_results' AND column_name = 'error_message') THEN
    ALTER TABLE audit_results ADD COLUMN error_message text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_results' AND column_name = 'usage_data') THEN
    ALTER TABLE audit_results ADD COLUMN usage_data jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_results' AND column_name = 'cost_data') THEN
    ALTER TABLE audit_results ADD COLUMN cost_data jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_results' AND column_name = 'brand_mentioned') THEN
    ALTER TABLE audit_results ADD COLUMN brand_mentioned boolean;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_results' AND column_name = 'brand_position') THEN
    ALTER TABLE audit_results ADD COLUMN brand_position integer;
  END IF;
END $$;

UPDATE audit_results SET organization_id = '00000000-0000-0000-0000-000000000010'
WHERE organization_id IS NULL;

-- ============================================================
-- 10. result_sources new columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'result_sources' AND column_name = 'domain') THEN
    ALTER TABLE result_sources ADD COLUMN domain text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'result_sources' AND column_name = 'snippet') THEN
    ALTER TABLE result_sources ADD COLUMN snippet text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'result_sources' AND column_name = 'position') THEN
    ALTER TABLE result_sources ADD COLUMN position integer;
  END IF;
END $$;

-- ============================================================
-- 11. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_runs_status ON audit_runs(status);
CREATE INDEX IF NOT EXISTS idx_audit_results_collection_method ON audit_results(collection_method);
CREATE INDEX IF NOT EXISTS idx_audit_results_brand_mentioned ON audit_results(brand_mentioned);

-- ============================================================
-- 12. DROP ALL OLD anon POLICIES
-- ============================================================
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
DROP POLICY IF EXISTS "anon_select_competitors" ON competitors;
DROP POLICY IF EXISTS "anon_insert_competitors" ON competitors;
DROP POLICY IF EXISTS "anon_update_competitors" ON competitors;
DROP POLICY IF EXISTS "anon_delete_competitors" ON competitors;
DROP POLICY IF EXISTS "anon_select_project_surfaces" ON project_surfaces;
DROP POLICY IF EXISTS "anon_insert_project_surfaces" ON project_surfaces;
DROP POLICY IF EXISTS "anon_update_project_surfaces" ON project_surfaces;
DROP POLICY IF EXISTS "anon_delete_project_surfaces" ON project_surfaces;
DROP POLICY IF EXISTS "anon_select_prompts" ON project_prompts;
DROP POLICY IF EXISTS "anon_insert_prompts" ON project_prompts;
DROP POLICY IF EXISTS "anon_update_prompts" ON project_prompts;
DROP POLICY IF EXISTS "anon_delete_prompts" ON project_prompts;
DROP POLICY IF EXISTS "anon_select_audit_runs" ON audit_runs;
DROP POLICY IF EXISTS "anon_insert_audit_runs" ON audit_runs;
DROP POLICY IF EXISTS "anon_update_audit_runs" ON audit_runs;
DROP POLICY IF EXISTS "anon_delete_audit_runs" ON audit_runs;
DROP POLICY IF EXISTS "anon_select_analysis_records" ON audit_results;
DROP POLICY IF EXISTS "anon_insert_analysis_records" ON audit_results;
DROP POLICY IF EXISTS "anon_update_analysis_records" ON audit_results;
DROP POLICY IF EXISTS "anon_delete_analysis_records" ON audit_results;
DROP POLICY IF EXISTS "anon_select_sources" ON result_sources;
DROP POLICY IF EXISTS "anon_insert_sources" ON result_sources;
DROP POLICY IF EXISTS "anon_update_sources" ON result_sources;
DROP POLICY IF EXISTS "anon_delete_sources" ON result_sources;
DROP POLICY IF EXISTS "anon_select_brand_analyses" ON brand_analyses;
DROP POLICY IF EXISTS "anon_insert_brand_analyses" ON brand_analyses;
DROP POLICY IF EXISTS "anon_update_brand_analyses" ON brand_analyses;
DROP POLICY IF EXISTS "anon_delete_brand_analyses" ON brand_analyses;
DROP POLICY IF EXISTS "anon_select_competitor_mentions" ON competitor_mentions;
DROP POLICY IF EXISTS "anon_insert_competitor_mentions" ON competitor_mentions;
DROP POLICY IF EXISTS "anon_update_competitor_mentions" ON competitor_mentions;
DROP POLICY IF EXISTS "anon_delete_competitor_mentions" ON competitor_mentions;

-- ============================================================
-- 13. NEW authenticated-only POLICIES
-- ============================================================

-- organizations
DROP POLICY IF EXISTS "select_orgs_member" ON organizations;
CREATE POLICY "select_orgs_member" ON organizations FOR SELECT
  TO authenticated USING (is_org_member(id));

DROP POLICY IF EXISTS "update_orgs_owner" ON organizations;
CREATE POLICY "update_orgs_owner" ON organizations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid() AND role = 'owner')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid() AND role = 'owner')
  );

-- organization_members
DROP POLICY IF EXISTS "select_org_members" ON organization_members;
CREATE POLICY "select_org_members" ON organization_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid())
  );

-- user_profiles
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- projects
DROP POLICY IF EXISTS "select_projects_member" ON projects;
CREATE POLICY "select_projects_member" ON projects FOR SELECT
  TO authenticated USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "insert_projects_member" ON projects;
CREATE POLICY "insert_projects_member" ON projects FOR INSERT
  TO authenticated WITH CHECK (is_org_member(organization_id));
DROP POLICY IF EXISTS "update_projects_member" ON projects;
CREATE POLICY "update_projects_member" ON projects FOR UPDATE
  TO authenticated USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
DROP POLICY IF EXISTS "delete_projects_member" ON projects;
CREATE POLICY "delete_projects_member" ON projects FOR DELETE
  TO authenticated USING (is_org_member(organization_id));

-- competitors
DROP POLICY IF EXISTS "select_competitors_member" ON competitors;
CREATE POLICY "select_competitors_member" ON competitors FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = competitors.project_id AND is_org_member(projects.organization_id)));
DROP POLICY IF EXISTS "insert_competitors_member" ON competitors;
CREATE POLICY "insert_competitors_member" ON competitors FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = competitors.project_id AND is_org_member(projects.organization_id)));
DROP POLICY IF EXISTS "update_competitors_member" ON competitors;
CREATE POLICY "update_competitors_member" ON competitors FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = competitors.project_id AND is_org_member(projects.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = competitors.project_id AND is_org_member(projects.organization_id)));
DROP POLICY IF EXISTS "delete_competitors_member" ON competitors;
CREATE POLICY "delete_competitors_member" ON competitors FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = competitors.project_id AND is_org_member(projects.organization_id)));

-- project_surfaces
DROP POLICY IF EXISTS "select_surfaces_member" ON project_surfaces;
CREATE POLICY "select_surfaces_member" ON project_surfaces FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_surfaces.project_id AND is_org_member(projects.organization_id)));
DROP POLICY IF EXISTS "insert_surfaces_member" ON project_surfaces;
CREATE POLICY "insert_surfaces_member" ON project_surfaces FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_surfaces.project_id AND is_org_member(projects.organization_id)));
DROP POLICY IF EXISTS "update_surfaces_member" ON project_surfaces;
CREATE POLICY "update_surfaces_member" ON project_surfaces FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_surfaces.project_id AND is_org_member(projects.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_surfaces.project_id AND is_org_member(projects.organization_id)));
DROP POLICY IF EXISTS "delete_surfaces_member" ON project_surfaces;
CREATE POLICY "delete_surfaces_member" ON project_surfaces FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_surfaces.project_id AND is_org_member(projects.organization_id)));

-- project_prompts
DROP POLICY IF EXISTS "select_prompts_member" ON project_prompts;
CREATE POLICY "select_prompts_member" ON project_prompts FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_prompts.project_id AND is_org_member(projects.organization_id)));
DROP POLICY IF EXISTS "insert_prompts_member" ON project_prompts;
CREATE POLICY "insert_prompts_member" ON project_prompts FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_prompts.project_id AND is_org_member(projects.organization_id)));
DROP POLICY IF EXISTS "update_prompts_member" ON project_prompts;
CREATE POLICY "update_prompts_member" ON project_prompts FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_prompts.project_id AND is_org_member(projects.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_prompts.project_id AND is_org_member(projects.organization_id)));
DROP POLICY IF EXISTS "delete_prompts_member" ON project_prompts;
CREATE POLICY "delete_prompts_member" ON project_prompts FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_prompts.project_id AND is_org_member(projects.organization_id)));

-- audit_runs
DROP POLICY IF EXISTS "select_audit_runs_member" ON audit_runs;
CREATE POLICY "select_audit_runs_member" ON audit_runs FOR SELECT
  TO authenticated USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "insert_audit_runs_member" ON audit_runs;
CREATE POLICY "insert_audit_runs_member" ON audit_runs FOR INSERT
  TO authenticated WITH CHECK (is_org_member(organization_id));
DROP POLICY IF EXISTS "update_audit_runs_member" ON audit_runs;
CREATE POLICY "update_audit_runs_member" ON audit_runs FOR UPDATE
  TO authenticated USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
DROP POLICY IF EXISTS "delete_audit_runs_member" ON audit_runs;
CREATE POLICY "delete_audit_runs_member" ON audit_runs FOR DELETE
  TO authenticated USING (is_org_member(organization_id));

-- audit_results
DROP POLICY IF EXISTS "select_audit_results_member" ON audit_results;
CREATE POLICY "select_audit_results_member" ON audit_results FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM audit_runs WHERE audit_runs.id = audit_results.audit_run_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "insert_audit_results_member" ON audit_results;
CREATE POLICY "insert_audit_results_member" ON audit_results FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM audit_runs WHERE audit_runs.id = audit_results.audit_run_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "update_audit_results_member" ON audit_results;
CREATE POLICY "update_audit_results_member" ON audit_results FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM audit_runs WHERE audit_runs.id = audit_results.audit_run_id AND is_org_member(audit_runs.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM audit_runs WHERE audit_runs.id = audit_results.audit_run_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "delete_audit_results_member" ON audit_results;
CREATE POLICY "delete_audit_results_member" ON audit_results FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM audit_runs WHERE audit_runs.id = audit_results.audit_run_id AND is_org_member(audit_runs.organization_id)));

-- result_sources
DROP POLICY IF EXISTS "select_result_sources_member" ON result_sources;
CREATE POLICY "select_result_sources_member" ON result_sources FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM audit_results JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE audit_results.id = result_sources.audit_result_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "insert_result_sources_member" ON result_sources;
CREATE POLICY "insert_result_sources_member" ON result_sources FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM audit_results JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE audit_results.id = result_sources.audit_result_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "update_result_sources_member" ON result_sources;
CREATE POLICY "update_result_sources_member" ON result_sources FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM audit_results JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE audit_results.id = result_sources.audit_result_id AND is_org_member(audit_runs.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM audit_results JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE audit_results.id = result_sources.audit_result_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "delete_result_sources_member" ON result_sources;
CREATE POLICY "delete_result_sources_member" ON result_sources FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM audit_results JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE audit_results.id = result_sources.audit_result_id AND is_org_member(audit_runs.organization_id)));

-- brand_analyses
DROP POLICY IF EXISTS "select_brand_analyses_member" ON brand_analyses;
CREATE POLICY "select_brand_analyses_member" ON brand_analyses FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM audit_results JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE audit_results.id = brand_analyses.audit_result_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "insert_brand_analyses_member" ON brand_analyses;
CREATE POLICY "insert_brand_analyses_member" ON brand_analyses FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM audit_results JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE audit_results.id = brand_analyses.audit_result_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "update_brand_analyses_member" ON brand_analyses;
CREATE POLICY "update_brand_analyses_member" ON brand_analyses FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM audit_results JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE audit_results.id = brand_analyses.audit_result_id AND is_org_member(audit_runs.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM audit_results JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE audit_results.id = brand_analyses.audit_result_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "delete_brand_analyses_member" ON brand_analyses;
CREATE POLICY "delete_brand_analyses_member" ON brand_analyses FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM audit_results JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE audit_results.id = brand_analyses.audit_result_id AND is_org_member(audit_runs.organization_id)));

-- competitor_mentions
DROP POLICY IF EXISTS "select_competitor_mentions_member" ON competitor_mentions;
CREATE POLICY "select_competitor_mentions_member" ON competitor_mentions FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM brand_analyses JOIN audit_results ON audit_results.id = brand_analyses.audit_result_id JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE brand_analyses.id = competitor_mentions.brand_analysis_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "insert_competitor_mentions_member" ON competitor_mentions;
CREATE POLICY "insert_competitor_mentions_member" ON competitor_mentions FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM brand_analyses JOIN audit_results ON audit_results.id = brand_analyses.audit_result_id JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE brand_analyses.id = competitor_mentions.brand_analysis_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "update_competitor_mentions_member" ON competitor_mentions;
CREATE POLICY "update_competitor_mentions_member" ON competitor_mentions FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM brand_analyses JOIN audit_results ON audit_results.id = brand_analyses.audit_result_id JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE brand_analyses.id = competitor_mentions.brand_analysis_id AND is_org_member(audit_runs.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM brand_analyses JOIN audit_results ON audit_results.id = brand_analyses.audit_result_id JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE brand_analyses.id = competitor_mentions.brand_analysis_id AND is_org_member(audit_runs.organization_id)));
DROP POLICY IF EXISTS "delete_competitor_mentions_member" ON competitor_mentions;
CREATE POLICY "delete_competitor_mentions_member" ON competitor_mentions FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM brand_analyses JOIN audit_results ON audit_results.id = brand_analyses.audit_result_id JOIN audit_runs ON audit_runs.id = audit_results.audit_run_id WHERE brand_analyses.id = competitor_mentions.brand_analysis_id AND is_org_member(audit_runs.organization_id)));
