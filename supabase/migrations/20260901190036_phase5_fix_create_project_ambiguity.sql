/*
# Phase 5 — Fix project creation return query

## Summary
Fixes the `create_project` database function so project creation no longer
fails with PostgreSQL error 42702 (`column reference "id" is ambiguous`).
The function previously returned columns named `id`, `name`, and related
fields without qualifying them against the `projects` table, while its
RETURNS TABLE declaration exposed output variables with the same names.

## Modified Function
- `create_project`
  - Keeps the same authenticated organization lookup.
  - Keeps the same project insertion behavior.
  - Keeps the same default AI surface seeding.
  - Qualifies every returned column with the `projects` table alias.

## Security
- No tables, columns, or policies are changed.
- The function remains SECURITY DEFINER with `search_path = public`.
- Organization ownership continues to come from the authenticated user's membership.

## Important Notes
1. This is a non-destructive function replacement.
2. Existing projects and project surfaces are not modified.
3. The frontend contract and RPC argument names remain unchanged.
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
  SELECT om.organization_id INTO v_org_id
  FROM public.organization_members AS om
  WHERE om.user_id = auth.uid()
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation trouvee pour cet utilisateur.';
  END IF;

  INSERT INTO public.projects (
    organization_id,
    name,
    domain,
    country,
    country_custom,
    language,
    language_custom
  )
  VALUES (
    v_org_id,
    p_name,
    p_domain,
    p_country,
    p_country_custom,
    p_language,
    p_language_custom
  )
  RETURNING public.projects.id INTO v_project_id;

  INSERT INTO public.project_surfaces (project_id, surface, is_active)
  VALUES
    (v_project_id, 'ChatGPT', true),
    (v_project_id, 'Gemini', true),
    (v_project_id, 'Perplexity', true),
    (v_project_id, 'Claude', true),
    (v_project_id, 'Google AI Overview', true)
  ON CONFLICT (project_id, surface) DO NOTHING;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.domain,
    p.country,
    p.country_custom,
    p.language,
    p.language_custom
  FROM public.projects AS p
  WHERE p.id = v_project_id;
END;
$$;
