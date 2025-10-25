-- Fix security vulnerability: Replace 'public' role with 'authenticated' in RLS policies
-- This prevents unauthenticated access to sensitive personal data

-- Fix CLIENTS table policies
DROP POLICY IF EXISTS "Users can delete clients from their tenant" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients in their tenant" ON public.clients;  
DROP POLICY IF EXISTS "Users can update clients from their tenant" ON public.clients;

CREATE POLICY "Authenticated users can delete clients from their tenant" 
ON public.clients FOR DELETE 
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can insert clients in their tenant" 
ON public.clients FOR INSERT 
TO authenticated
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can update clients from their tenant" 
ON public.clients FOR UPDATE 
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- Fix FOURNISSEURS table policies  
DROP POLICY IF EXISTS "Users can delete suppliers from their tenant" ON public.fournisseurs;
DROP POLICY IF EXISTS "Users can insert suppliers in their tenant" ON public.fournisseurs;
DROP POLICY IF EXISTS "Users can update suppliers from their tenant" ON public.fournisseurs;
DROP POLICY IF EXISTS "Users can view suppliers from their tenant" ON public.fournisseurs;

CREATE POLICY "Authenticated users can delete suppliers from their tenant" 
ON public.fournisseurs FOR DELETE 
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can insert suppliers in their tenant" 
ON public.fournisseurs FOR INSERT 
TO authenticated
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can update suppliers from their tenant" 
ON public.fournisseurs FOR UPDATE 
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can view suppliers from their tenant" 
ON public.fournisseurs FOR SELECT 
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- Fix PERSONNEL table policies
DROP POLICY IF EXISTS "Admins can insert personnel in their tenant" ON public.personnel;
DROP POLICY IF EXISTS "Only admins can update pharmacies" ON public.pharmacies;

CREATE POLICY "Authenticated admins can insert personnel in their tenant" 
ON public.personnel FOR INSERT 
TO authenticated
WITH CHECK (
  (tenant_id = get_current_user_tenant_id()) AND 
  (EXISTS (
    SELECT 1 FROM personnel personnel_1
    WHERE personnel_1.auth_user_id = auth.uid() 
    AND personnel_1.role = ANY(ARRAY['Admin'::text, 'Pharmacien'::text])
  ))
);

CREATE POLICY "Authenticated admins can update pharmacies" 
ON public.pharmacies FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM personnel
    WHERE personnel.auth_user_id = auth.uid() 
    AND personnel.tenant_id = pharmacies.id 
    AND personnel.role = 'Admin'::text
  )
);

-- Fix PHARMACIES table policies - keep registration open but secure other operations
DROP POLICY IF EXISTS "Users can view their own pharmacy" ON public.pharmacies;

CREATE POLICY "Authenticated users can view their own pharmacy" 
ON public.pharmacies FOR SELECT 
TO authenticated
USING (
  (id = get_current_user_tenant_id()) OR 
  (EXISTS (
    SELECT 1 FROM personnel
    WHERE personnel.auth_user_id = auth.uid() 
    AND personnel.role = 'Admin'::text
  ))
);