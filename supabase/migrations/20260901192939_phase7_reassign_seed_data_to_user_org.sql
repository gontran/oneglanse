/*
# Phase 7 — Reassign seed data to user organization

## Summary
All seed audit data (1 project, 4 audit runs, 120 audit results, 6 prompts,
4 competitors, 5 surfaces) belongs to the seed organization
(00000000-0000-0000-0000-000000000010). The authenticated user is a member
of organization 9729e0cf-ea24-4d93-8120-feab960bb375. Because RLS policies
check is_org_member(organization_id), the user cannot see any seed data —
the result-detail page shows "acces refuse" and the dashboard shows no
results.

This migration reassigns all seed-organization data to the user's
organization so it becomes visible and usable.

## Modified Tables
1. projects — UPDATE organization_id from seed org to user org
2. audit_runs — UPDATE organization_id from seed org to user org
3. audit_results — UPDATE organization_id from seed org to user org

Child tables (competitors, project_surfaces, project_prompts,
result_sources, brand_analyses, competitor_mentions) reference data via
project_id / audit_run_id / audit_result_id FKs, so they inherit the
ownership change transitively through the RLS policies that join to
projects / audit_runs.

## Security
No RLS policies, table structures, or column types are changed.
Only data values (organization_id) are updated.

## Important Notes
1. The seed organization (00000000...010) will have no data left after
   this migration — it becomes an empty shell, which is harmless.
2. The user's organization gains the seed project and all its audit data.
3. The user already has their own project (164eb246...) in the same org,
   so both projects will coexist. The frontend's getProject() uses
   .limit(1) which may return either project — both are in the same org
   so RLS will allow access either way.
*/

UPDATE projects
SET organization_id = '9729e0cf-ea24-4d93-8120-feab960bb375'
WHERE organization_id = '00000000-0000-0000-0000-000000000010';

UPDATE audit_runs
SET organization_id = '9729e0cf-ea24-4d93-8120-feab960bb375'
WHERE organization_id = '00000000-0000-0000-0000-000000000010';

UPDATE audit_results
SET organization_id = '9729e0cf-ea24-4d93-8120-feab960bb375'
WHERE organization_id = '00000000-0000-0000-0000-000000000010';
