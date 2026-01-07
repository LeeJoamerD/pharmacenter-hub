-- Fix RLS policies for laboratoires table
-- Replace the single ALL policy with separate policies per operation

-- Drop the existing ALL policy
DROP POLICY IF EXISTS "tenant_access_laboratoires" ON laboratoires;

-- Create separate policies for each operation
CREATE POLICY "Users can view laboratoires from their tenant"
  ON laboratoires FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert laboratoires in their tenant"
  ON laboratoires FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update laboratoires from their tenant"
  ON laboratoires FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete laboratoires from their tenant"
  ON laboratoires FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());