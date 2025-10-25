-- Fix pharmacy registration RLS policies
-- This migration fixes the pharmacy creation flow by:
-- 1. Cleaning up duplicate functions
-- 2. Adding missing INSERT policy for pharmacies
-- 3. Allowing initial admin creation in personnel table
-- 4. Ensuring audit_logs can be inserted

-- =====================================================
-- STEP 1: Clean up duplicate functions
-- =====================================================

-- Drop the function with the wrong signature (5 parameters)
DROP FUNCTION IF EXISTS public.register_pharmacy_with_admin(
  p_pharmacy_name text, 
  p_pharmacy_data jsonb, 
  p_admin_noms text, 
  p_admin_prenoms text, 
  p_admin_email text
);

-- The correct function with signature (pharmacy_data, admin_data, admin_email, admin_password)
-- already exists and will be kept

-- =====================================================
-- STEP 2: Add INSERT policy for pharmacies
-- =====================================================

-- Drop existing policy if any
DROP POLICY IF EXISTS "Allow initial pharmacy creation" ON public.pharmacies;

-- Allow authenticated users to create their first pharmacy
CREATE POLICY "Allow initial pharmacy creation"
ON public.pharmacies
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verify user doesn't already have a pharmacy (no personnel record)
  NOT EXISTS (
    SELECT 1 
    FROM public.personnel 
    WHERE auth_user_id = auth.uid()
  )
  -- AND pharmacy email matches authenticated user's email
  AND email IN (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- STEP 3: Fix INSERT policy for personnel
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Admins insert" ON public.personnel;

-- Create new policy allowing:
-- 1. Existing admins to create personnel in their tenant
-- 2. Initial admin creation during pharmacy registration
CREATE POLICY "Allow personnel creation"
ON public.personnel
FOR INSERT
TO authenticated
WITH CHECK (
  -- Case 1: Existing admins can create personnel in their tenant
  (
    tenant_id = get_current_user_tenant_id() 
    AND EXISTS (
      SELECT 1 
      FROM public.personnel p
      WHERE p.auth_user_id = auth.uid() 
        AND p.role IN ('Admin', 'Pharmacien')
        AND p.tenant_id = personnel.tenant_id
    )
  )
  OR
  -- Case 2: Initial admin creation (no existing personnel for this user)
  (
    auth_user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 
      FROM public.personnel p 
      WHERE p.auth_user_id = auth.uid()
    )
  )
);

-- =====================================================
-- STEP 4: Ensure audit_logs INSERT policy exists
-- =====================================================

-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "System insert audit" ON public.audit_logs;

CREATE POLICY "System insert audit"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- STEP 5: Add documentation comments
-- =====================================================

COMMENT ON POLICY "Allow initial pharmacy creation" ON public.pharmacies IS 
  'Permet aux utilisateurs authentifiés de créer leur première pharmacie lors de l''inscription. Vérifie que l''utilisateur n''a pas déjà de pharmacie et que l''email correspond.';

COMMENT ON POLICY "Allow personnel creation" ON public.personnel IS 
  'Permet: 1) Aux admins de créer du personnel dans leur tenant, 2) La création du premier admin lors de l''inscription d''une pharmacie.';

COMMENT ON POLICY "System insert audit" ON public.audit_logs IS 
  'Permet à tous les utilisateurs authentifiés de créer des logs d''audit pour tracer leurs actions.';