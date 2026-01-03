-- Fix RLS policies for ai_models table
-- Replace 'public' role with 'authenticated' role

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their tenant models or system models" ON public.ai_models;
DROP POLICY IF EXISTS "Users can create models in their tenant" ON public.ai_models;
DROP POLICY IF EXISTS "Users can update models in their tenant" ON public.ai_models;
DROP POLICY IF EXISTS "Users can delete models in their tenant" ON public.ai_models;

-- Create new policies with 'authenticated' role
CREATE POLICY "Users can view their tenant models or system models"
ON public.ai_models
FOR SELECT
TO authenticated
USING (
  (tenant_id = get_current_user_tenant_id()) OR (is_system = true)
);

CREATE POLICY "Admins can create models in their tenant"
ON public.ai_models
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT personnel.tenant_id
    FROM personnel
    WHERE personnel.auth_user_id = auth.uid()
      AND personnel.role IN ('Admin', 'Pharmacien')
  )
);

CREATE POLICY "Admins can update models in their tenant"
ON public.ai_models
FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT personnel.tenant_id
    FROM personnel
    WHERE personnel.auth_user_id = auth.uid()
      AND personnel.role IN ('Admin', 'Pharmacien')
  )
  AND (is_system = false)
);

CREATE POLICY "Admins can delete models in their tenant"
ON public.ai_models
FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT personnel.tenant_id
    FROM personnel
    WHERE personnel.auth_user_id = auth.uid()
      AND personnel.role IN ('Admin', 'Pharmacien')
  )
  AND (is_system = false)
);