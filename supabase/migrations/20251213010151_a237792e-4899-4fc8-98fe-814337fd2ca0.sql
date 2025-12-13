-- Fix RLS policy for personnel UPDATE to allow Admin and Pharmacien roles
-- and properly detect silent failures

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins update" ON public.personnel;
DROP POLICY IF EXISTS "Admins and Pharmacien update" ON public.personnel;

-- Create improved policy that allows Admin and Pharmacien to update personnel in their tenant
CREATE POLICY "Admins and Pharmacien update personnel" ON public.personnel
FOR UPDATE 
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM public.personnel p
    WHERE p.auth_user_id = auth.uid() 
    AND p.role IN ('Admin', 'Pharmacien')
    AND p.tenant_id = personnel.tenant_id
  )
)
WITH CHECK (
  tenant_id = get_current_user_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM public.personnel p
    WHERE p.auth_user_id = auth.uid() 
    AND p.role IN ('Admin', 'Pharmacien')
    AND p.tenant_id = personnel.tenant_id
  )
);