/*
# Create provider_api_keys table for per-organization audit API keys

## Purpose
Allows each organization to store its own API keys for audit providers
(Perplexity, OpenAI, Gemini, etc.) directly from the dashboard interface,
without needing to manually configure server environment variables.

## New Tables
- `provider_api_keys`
  - `id` (uuid, primary key)
  - `organization_id` (uuid, FK to organizations, cascade delete)
  - `provider_id` (text, identifies the audit provider, e.g. "perplexity")
  - `encrypted_api_key` (text, the API key stored server-side)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Unique constraint on (organization_id, provider_id) to prevent duplicates

## Security
- RLS enabled: organization members can manage their own org's keys.
- A SECURITY DEFINER function `get_provider_api_key` allows the edge function
  (which uses the service role key) to read keys for a given org + provider.
- A SECURITY DEFINER function `upsert_provider_api_key` allows authenticated
  org members to save/update a key.
- A SECURITY DEFINER function `delete_provider_api_key` allows authenticated
  org members to remove a key.
- A SECURITY DEFINER function `list_provider_api_keys` returns which providers
  have keys configured (without exposing the key values themselves) for a given org.

## Notes
1. The edge function reads keys from this table at audit time, falling back
   to environment variables if no DB key is found.
2. The list function only returns provider_id + timestamps, never the key value.
3. All mutations verify org membership via organization_members.
*/

CREATE TABLE IF NOT EXISTS provider_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_id text NOT NULL,
  encrypted_api_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider_id)
);

ALTER TABLE provider_api_keys ENABLE ROW LEVEL SECURITY;

-- No direct RLS policies: all access goes through SECURITY DEFINER functions below.

-- Returns the API key for a given org + provider. Called with service role key.
CREATE OR REPLACE FUNCTION get_provider_api_key(
  p_org_id uuid,
  p_provider_id text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
BEGIN
  SELECT encrypted_api_key INTO v_key
  FROM provider_api_keys
  WHERE organization_id = p_org_id AND provider_id = p_provider_id;
  RETURN v_key;
END;
$$;

-- Upserts a provider API key. Verifies org membership.
CREATE OR REPLACE FUNCTION upsert_provider_api_key(
  p_provider_id text,
  p_api_key text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = auth.uid();

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation trouvee pour cet utilisateur';
  END IF;

  INSERT INTO provider_api_keys (organization_id, provider_id, encrypted_api_key)
  VALUES (v_org_id, p_provider_id, p_api_key)
  ON CONFLICT (organization_id, provider_id)
  DO UPDATE SET encrypted_api_key = EXCLUDED.encrypted_api_key, updated_at = now();
END;
$$;

-- Deletes a provider API key. Verifies org membership.
CREATE OR REPLACE FUNCTION delete_provider_api_key(
  p_provider_id text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = auth.uid();

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation trouvee pour cet utilisateur';
  END IF;

  DELETE FROM provider_api_keys
  WHERE organization_id = v_org_id AND provider_id = p_provider_id;
END;
$$;

-- Lists which providers have keys configured (without exposing key values).
CREATE OR REPLACE FUNCTION list_provider_api_keys()
RETURNS TABLE (
  provider_id text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = auth.uid();

  IF v_org_id IS NULL THEN
    RETURN QUERY SELECT NULL::text, NULL::timestamptz, NULL::timestamptz WHERE FALSE;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT pak.provider_id, pak.created_at, pak.updated_at
  FROM provider_api_keys pak
  WHERE pak.organization_id = v_org_id;
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION get_provider_api_key(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_provider_api_key(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_provider_api_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION list_provider_api_keys() TO authenticated;
