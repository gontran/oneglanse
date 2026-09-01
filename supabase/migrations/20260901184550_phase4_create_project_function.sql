/*
# Phase 4 — Create project function

## Summary
Adds a `create_project` SECURITY DEFINER function that lets an authenticated
user create a new project linked to their organization. The function also
seeds the 5 default AI surfaces for the new project so it is immediately
usable. This solves the issue where a signed-in user has no project in
their organization and sees "aucun projet configure".

## New Functions
1. `create_project(name, domain, country, country_custom, language, language_custom)`
   - SECURITY DEFINER, runs as the database owner
   - Looks up the caller's organization via `organization_members`
   - Inserts a new row in `projects` with `organization_id` set automatically
   - Seeds 5 default AI surfaces (ChatGPT, Gemini, Perplexity, Claude, Google AI Overview)
   - Returns the new project row (id, name, domain, country, country_custom, language, language_custom)

## Security
- Function is SECURITY DEFINER with search_path = public
- Only authenticated users with an organization membership can call it
- The organization_id is derived from the caller's membership, never from client input
- Existing RLS policies on `projects` and `project_surfaces` remain unchanged

## Important Notes
1. The function raises an exception if the user has no organization membership
2. Default surfaces are seeded with is_active = true
3. The function is idempotent in the sense that it can be called multiple times
   by the same user to create multiple projects (though the UI currently expects
   a single project per organization)
*/

CREATE OR REPLACE FUNCTION create_project(
  p_name text,
  p_domain text,
  p_country text DEFAULT 'FR',
  p_country_custom text DEFAULT NULL,
  p_language text DEFAULT 'fr',
  p_language_custom text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  domain text,
  country text,
  country_custom text,
  language text,
  language_custom text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_project_id uuid;
BEGIN
  -- Find the caller's organization
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation trouvee pour cet utilisateur.';
  END IF;

  -- Create the project
  INSERT INTO projects (organization_id, name, domain, country, country_custom, language, language_custom)
  VALUES (v_org_id, p_name, p_domain, p_country, p_country_custom, p_language, p_language_custom)
  RETURNING id INTO v_project_id;

  -- Seed default AI surfaces
  INSERT INTO project_surfaces (project_id, surface, is_active)
  VALUES
    (v_project_id, 'ChatGPT', true),
    (v_project_id, 'Gemini', true),
    (v_project_id, 'Perplexity', true),
    (v_project_id, 'Claude', true),
    (v_project_id, 'Google AI Overview', true)
  ON CONFLICT (project_id, surface) DO NOTHING;

  -- Return the new project row
  RETURN QUERY
  SELECT id, name, domain, country, country_custom, language, language_custom
  FROM projects
  WHERE id = v_project_id;
END;
$$;
