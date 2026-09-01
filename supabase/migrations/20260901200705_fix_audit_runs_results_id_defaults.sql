/*
# Fix audit_runs and audit_results ID auto-generation

## Problem
The `audit_runs.id` and `audit_results.id` columns are `text NOT NULL` with no
default value. The edge function inserts without providing an `id`, so PostgreSQL
rejects the insert with error 23502 ("violates not-null constraint"). This is the
same issue that was fixed for `project_prompts` in Phase 6.

## Fix
Add `DEFAULT gen_random_uuid()::text` to both columns.

## Security
- No tables, columns, or policies are changed.
- RLS policies remain unchanged.
*/

ALTER TABLE public.audit_runs
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.audit_results
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
