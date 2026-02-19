-- Fix personnel table: restrict SELECT policy to authenticated users only
-- and revoke anon access

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view personnel from their tenant" ON public.personnel;

-- Recreate with explicit role restriction
CREATE POLICY "Authenticated users can view personnel from their tenant"
ON public.personnel
FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- Revoke anon access to personnel table
REVOKE ALL ON public.personnel FROM anon;

-- Ensure authenticated still has access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personnel TO authenticated;
