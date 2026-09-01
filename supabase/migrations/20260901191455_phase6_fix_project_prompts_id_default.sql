/*
# Phase 6 — Fix project_prompts ID auto-generation

## Summary
The `project_prompts.id` column is `text NOT NULL` with no default value.
Seed prompts used hardcoded string IDs (e.g. `prompt-1`), but when the
frontend creates a new prompt it does not send an `id` — it expects the
database to generate one automatically (like `competitors`, `projects`,
and `project_surfaces` do via `gen_random_uuid()`). Without a default,
PostgreSQL rejects the insert with error 23502 ("violates not-null
constraint").

## Modified Tables
- `project_prompts`
  - `id` column: added `DEFAULT gen_random_uuid()::text`
  - Column type stays `text` — no type change
  - Existing rows keep their current IDs untouched

## Security
- No tables, columns, or policies are changed.
- RLS policies on `project_prompts` remain unchanged.

## Important Notes
1. This is a non-destructive column default addition.
2. Existing seed prompts with IDs like `prompt-1` are not modified.
3. The foreign key from `audit_results.prompt_id` (also `text`) remains valid.
4. New prompts inserted by the frontend will now receive an auto-generated UUID string as their `id`.
*/

ALTER TABLE public.project_prompts
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
