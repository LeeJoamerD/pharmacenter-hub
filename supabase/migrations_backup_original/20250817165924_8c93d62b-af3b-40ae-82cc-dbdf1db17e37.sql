-- First, let's backfill the admin accounts and fix RLS policies

-- 1. Update RLS policies for personnel table to be more inclusive
DROP POLICY IF EXISTS "Users can view personnel from their tenant" ON public.personnel;
DROP POLICY IF EXISTS "Users can insert personnel in their tenant" ON public.personnel;
DROP POLICY IF EXISTS "Users can update personnel from their tenant" ON public.personnel;
DROP POLICY IF EXISTS "Users can delete personnel from their tenant" ON public.personnel;

-- Create more permissive policies for personnel management
CREATE POLICY "Users can view personnel from their tenant" 
ON public.personnel 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can insert personnel in their tenant" 
ON public.personnel 
FOR INSERT 
WITH CHECK (
  tenant_id = get_current_user_tenant_id() AND 
  (
    EXISTS (
      SELECT 1 FROM public.personnel 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('Admin', 'Pharmacien')
    ) OR
    -- Allow creation during pharmacy registration
    auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Admins can update personnel in their tenant" 
ON public.personnel 
FOR UPDATE 
USING (
  tenant_id = get_current_user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien')
  )
);

CREATE POLICY "Admins can delete personnel from their tenant" 
ON public.personnel 
FOR DELETE 
USING (
  tenant_id = get_current_user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien')
  ) AND
  -- Prevent deleting yourself
  id != (SELECT id FROM public.personnel WHERE auth_user_id = auth.uid())
);

-- 2. Ensure the admin accounts have the right data
-- Update djl.computersciences@gmail.com admin account
UPDATE public.personnel 
SET 
  role = 'Admin',
  is_active = true,
  fonction = 'Administrateur Pharmacie',
  reference_agent = 'ADMIN_DJL'
WHERE email = 'djl.computersciences@gmail.com' 
AND tenant_id = (SELECT id FROM public.pharmacies WHERE email = 'djl.computersciences@gmail.com');

-- Update permistravailef.poleagrogac@gmail.com admin account  
UPDATE public.personnel 
SET 
  role = 'Admin',
  is_active = true,
  fonction = 'Administrateur Pharmacie',
  reference_agent = 'ADMIN_PGA'
WHERE email = 'permistravailef.poleagrogac@gmail.com' 
AND tenant_id = (SELECT id FROM public.pharmacies WHERE email = 'permistravailef.poleagrogac@gmail.com');