-- Fix RLS policies for ai_automation_templates table
-- Replace 'public' role with 'authenticated' role

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage templates" ON public.ai_automation_templates;
DROP POLICY IF EXISTS "Users can view templates in their tenant" ON public.ai_automation_templates;

-- Create new policies with 'authenticated' role
CREATE POLICY "Admins can manage templates"
ON public.ai_automation_templates
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT personnel.tenant_id
    FROM personnel
    WHERE personnel.auth_user_id = auth.uid()
      AND personnel.role IN ('Admin', 'Pharmacien')
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT personnel.tenant_id
    FROM personnel
    WHERE personnel.auth_user_id = auth.uid()
      AND personnel.role IN ('Admin', 'Pharmacien')
  )
);

CREATE POLICY "Users can view templates in their tenant"
ON public.ai_automation_templates
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT personnel.tenant_id
    FROM personnel
    WHERE personnel.auth_user_id = auth.uid()
  )
  OR is_system = true
);