/*
# Fix infinite recursion in organization_members RLS policy

## Problem
The `select_org_members` policy on `organization_members` queried `organization_members`
itself to determine access, causing infinite recursion (PostgreSQL error 42P17).
This made every query to the table fail with a 500 error, breaking both the frontend
org loading and the edge function's membership check.

## Fix
Replace the self-referential policy with a simple ownership check: a user can read
their own membership row (`user_id = auth.uid()`). No subquery needed, no recursion.

## Security
- SELECT: users can only read their own membership row
- INSERT/UPDATE/DELETE: still restricted by RLS (no policies = no access for authenticated)
- The `is_org_member()` SECURITY DEFINER function still handles org membership checks
  for other tables (it bypasses RLS by design)
*/

DROP POLICY IF EXISTS "select_org_members" ON organization_members;

CREATE POLICY "select_own_membership"
ON organization_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());
