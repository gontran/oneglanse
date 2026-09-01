/*
# Delete fictional seed audit data

## Purpose
Remove all fictional/demo seed audit data that was inserted during initial
database setup. These records contain fake sources like "demo-vod-comparator.fr"
and fabricated brand analyses. Only real audit data (from actual Perplexity API
calls) should remain.

## What gets deleted
1. All audit_results whose ID starts with "run-today-", "run-j29-", "run-j6-", "run-j13-"
   (these are seed IDs from generate-seed.mts)
2. All audit_runs with IDs "run-today", "run-j29", "run-j6", "run-j13"
3. Cascading deletes will automatically remove:
   - result_sources linked to deleted audit_results
   - brand_analyses linked to deleted audit_results (via audit_result_id FK)
   - competitor_mentions linked to deleted brand_analyses

## What is preserved
- The real audit run (UUID-generated ID from the actual Perplexity API call)
- All configuration tables (projects, competitors, prompts, surfaces)
- User/org data

## Security
- No schema changes, no policy changes
- This is a data-only cleanup migration
*/

-- Delete fictional audit_results (cascades to result_sources, brand_analyses, competitor_mentions)
DELETE FROM audit_results
WHERE id LIKE 'run-today-%'
   OR id LIKE 'run-j29-%'
   OR id LIKE 'run-j6-%'
   OR id LIKE 'run-j13-%';

-- Delete fictional audit_runs
DELETE FROM audit_runs
WHERE id IN ('run-today', 'run-j29', 'run-j6', 'run-j13');
