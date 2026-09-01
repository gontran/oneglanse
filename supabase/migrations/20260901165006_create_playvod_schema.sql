/*
# Create PlayVOD AI Visibility Audit Schema

## Summary
Creates the full database schema for the PlayVOD AI visibility audit dashboard.
This is a single-tenant demo application with no authentication — all data is
intentionally public/shared and accessible via the anon key.

## New Tables

1. `audit_runs` — Represents a single audit execution (a batch of prompts sent to all AI surfaces).
   - `id` (text, primary key) — e.g. "run-today", "run-j6"
   - `run_at` (timestamptz) — when the audit was executed
   - `prompt_count` (int) — number of prompts in the run
   - `surface_count` (int) — number of AI surfaces queried

2. `prompts` — The user prompts that are sent to AI surfaces during audits.
   - `id` (text, primary key) — e.g. "prompt-1"
   - `text` (text, not null) — the prompt question
   - `category` (text) — e.g. "comparison", "pricing", "brand-specific"
   - `intent` (text) — e.g. "informational", "transactional"
   - `persona` (text, nullable) — persona name if applicable

3. `analysis_records` — One row per prompt × surface × audit run. Contains the AI response and analysis.
   - `id` (text, primary key)
   - `audit_run_id` (text, FK → audit_runs.id)
   - `prompt_id` (text, FK → prompts.id)
   - `prompt` (text) — denormalized prompt text at time of run
   - `surface` (text) — e.g. "ChatGPT", "Gemini", "Perplexity", "Claude", "Google AI Overview"
   - `provider` (text) — e.g. "OpenAI", "Google"
   - `model` (text) — e.g. "GPT-4o", "Gemini 2.0 Flash"
   - `country` (text) — e.g. "FR"
   - `language` (text) — e.g. "fr"
   - `device` (text, nullable) — "desktop" or "mobile"
   - `response` (text) — the AI's response text (markdown)
   - `prompt_run_at` (timestamptz) — when this specific prompt was run
   - `is_analysed` (boolean) — whether brand analysis has been completed

4. `sources` — Source citations extracted from AI responses. Linked to analysis_records.
   - `id` (uuid, primary key)
   - `analysis_record_id` (text, FK → analysis_records.id, ON DELETE CASCADE)
   - `title` (text) — source page title
   - `url` (text) — source URL
   - `cited_text` (text, nullable) — excerpt cited from the source
   - `is_owned_domain` (boolean) — whether this is PlayVOD's own domain
   - `is_fictional` (boolean) — whether this is a fictional/demo source

5. `brand_analyses` — Brand analysis results for each analysis record. One-to-one with analysis_records.
   - `id` (uuid, primary key)
   - `analysis_record_id` (text, FK → analysis_records.id, ON DELETE CASCADE, unique)
   - `brand_mentioned` (boolean) — whether PlayVOD was mentioned
   - `position` (int, nullable) — position of PlayVOD in the response (1-based)
   - `sentiment` (int) — sentiment score 0-100
   - `recommendation_type` (text) — "top_pick", "recommended", "mentioned", "not_mentioned"
   - `recommendation_score` (int) — recommendation score 0-100
   - `visibility_score` (int) — visibility score 0-100
   - `best_known_for` (text, nullable) — what the brand is best known for
   - `pricing_perception` (text) — "premium", "mid_range", "budget", "free", "not_mentioned"
   - `core_claims` (text[]) — array of core claims about the brand
   - `differentiators` (text[]) — array of differentiators
   - `risks` (text[]) — array of identified risks

6. `competitor_mentions` — Competitor data extracted from brand analyses. Linked to brand_analyses.
   - `id` (uuid, primary key)
   - `brand_analysis_id` (uuid, FK → brand_analyses.id, ON DELETE CASCADE)
   - `name` (text) — competitor name
   - `domain` (text, nullable) — competitor domain
   - `mention_count` (int) — number of mentions
   - `sentiment` (int) — sentiment score 0-100
   - `visibility` (int) — visibility score 0-100

## Security
- RLS enabled on ALL tables.
- All policies use `TO anon, authenticated` since this is a single-tenant demo with no sign-in.
- All CRUD operations allowed for anon + authenticated (data is intentionally public).

## Important Notes
1. This is a demo/single-tenant schema — no user_id columns, no auth.users references.
2. Foreign keys use ON DELETE CASCADE for child tables to maintain referential integrity.
3. The `brand_analyses.analysis_record_id` has a UNIQUE constraint to enforce 1:1 relationship.
4. Indexes added on frequently queried columns (audit_run_id, prompt_id, surface, analysis_record_id).
*/

-- ============================================================
-- audit_runs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_runs (
  id text PRIMARY KEY,
  run_at timestamptz NOT NULL DEFAULT now(),
  prompt_count integer NOT NULL DEFAULT 0,
  surface_count integer NOT NULL DEFAULT 0
);

ALTER TABLE audit_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audit_runs" ON audit_runs;
CREATE POLICY "anon_select_audit_runs" ON audit_runs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audit_runs" ON audit_runs;
CREATE POLICY "anon_insert_audit_runs" ON audit_runs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_audit_runs" ON audit_runs;
CREATE POLICY "anon_update_audit_runs" ON audit_runs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_audit_runs" ON audit_runs;
CREATE POLICY "anon_delete_audit_runs" ON audit_runs FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- prompts
-- ============================================================
CREATE TABLE IF NOT EXISTS prompts (
  id text PRIMARY KEY,
  text text NOT NULL,
  category text NOT NULL DEFAULT '',
  intent text NOT NULL DEFAULT '',
  persona text
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_prompts" ON prompts;
CREATE POLICY "anon_select_prompts" ON prompts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_prompts" ON prompts;
CREATE POLICY "anon_insert_prompts" ON prompts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_prompts" ON prompts;
CREATE POLICY "anon_update_prompts" ON prompts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_prompts" ON prompts;
CREATE POLICY "anon_delete_prompts" ON prompts FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- analysis_records
-- ============================================================
CREATE TABLE IF NOT EXISTS analysis_records (
  id text PRIMARY KEY,
  audit_run_id text NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  prompt_id text NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  surface text NOT NULL,
  provider text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'FR',
  language text NOT NULL DEFAULT 'fr',
  device text,
  response text NOT NULL DEFAULT '',
  prompt_run_at timestamptz NOT NULL DEFAULT now(),
  is_analysed boolean NOT NULL DEFAULT false
);

ALTER TABLE analysis_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_analysis_records" ON analysis_records;
CREATE POLICY "anon_select_analysis_records" ON analysis_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_analysis_records" ON analysis_records;
CREATE POLICY "anon_insert_analysis_records" ON analysis_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_analysis_records" ON analysis_records;
CREATE POLICY "anon_update_analysis_records" ON analysis_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_analysis_records" ON analysis_records;
CREATE POLICY "anon_delete_analysis_records" ON analysis_records FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_analysis_records_audit_run_id ON analysis_records(audit_run_id);
CREATE INDEX IF NOT EXISTS idx_analysis_records_prompt_id ON analysis_records(prompt_id);
CREATE INDEX IF NOT EXISTS idx_analysis_records_surface ON analysis_records(surface);

-- ============================================================
-- sources
-- ============================================================
CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_record_id text NOT NULL REFERENCES analysis_records(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  url text NOT NULL,
  cited_text text,
  is_owned_domain boolean NOT NULL DEFAULT false,
  is_fictional boolean NOT NULL DEFAULT false
);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sources" ON sources;
CREATE POLICY "anon_select_sources" ON sources FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sources" ON sources;
CREATE POLICY "anon_insert_sources" ON sources FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sources" ON sources;
CREATE POLICY "anon_update_sources" ON sources FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sources" ON sources;
CREATE POLICY "anon_delete_sources" ON sources FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sources_analysis_record_id ON sources(analysis_record_id);

-- ============================================================
-- brand_analyses
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_record_id text NOT NULL REFERENCES analysis_records(id) ON DELETE CASCADE,
  brand_mentioned boolean NOT NULL DEFAULT false,
  position integer,
  sentiment integer NOT NULL DEFAULT 0,
  recommendation_type text NOT NULL DEFAULT 'not_mentioned',
  recommendation_score integer NOT NULL DEFAULT 0,
  visibility_score integer NOT NULL DEFAULT 0,
  best_known_for text,
  pricing_perception text NOT NULL DEFAULT 'not_mentioned',
  core_claims text[] NOT NULL DEFAULT '{}',
  differentiators text[] NOT NULL DEFAULT '{}',
  risks text[] NOT NULL DEFAULT '{}',
  CONSTRAINT brand_analyses_analysis_record_unique UNIQUE (analysis_record_id)
);

ALTER TABLE brand_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_brand_analyses" ON brand_analyses;
CREATE POLICY "anon_select_brand_analyses" ON brand_analyses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_brand_analyses" ON brand_analyses;
CREATE POLICY "anon_insert_brand_analyses" ON brand_analyses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_brand_analyses" ON brand_analyses;
CREATE POLICY "anon_update_brand_analyses" ON brand_analyses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_brand_analyses" ON brand_analyses;
CREATE POLICY "anon_delete_brand_analyses" ON brand_analyses FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_brand_analyses_analysis_record_id ON brand_analyses(analysis_record_id);

-- ============================================================
-- competitor_mentions
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_analysis_id uuid NOT NULL REFERENCES brand_analyses(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text,
  mention_count integer NOT NULL DEFAULT 0,
  sentiment integer NOT NULL DEFAULT 0,
  visibility integer NOT NULL DEFAULT 0
);

ALTER TABLE competitor_mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_competitor_mentions" ON competitor_mentions;
CREATE POLICY "anon_select_competitor_mentions" ON competitor_mentions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_competitor_mentions" ON competitor_mentions;
CREATE POLICY "anon_insert_competitor_mentions" ON competitor_mentions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_competitor_mentions" ON competitor_mentions;
CREATE POLICY "anon_update_competitor_mentions" ON competitor_mentions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_competitor_mentions" ON competitor_mentions;
CREATE POLICY "anon_delete_competitor_mentions" ON competitor_mentions FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_competitor_mentions_brand_analysis_id ON competitor_mentions(brand_analysis_id);
