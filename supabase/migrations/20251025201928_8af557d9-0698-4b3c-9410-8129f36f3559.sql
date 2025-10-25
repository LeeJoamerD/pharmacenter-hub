-- Part 2: Update existing RLS policies for pharmacy registration

-- =====================================================
-- Add INSERT policy for pharmacies  
-- =====================================================

-- Only create if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'pharmacies' 
        AND policyname = 'Allow initial pharmacy creation'
    ) THEN
        CREATE POLICY "Allow initial pharmacy creation"
        ON public.pharmacies
        FOR INSERT
        TO authenticated
        WITH CHECK (
          NOT EXISTS (
            SELECT 1 
            FROM public.personnel 
            WHERE auth_user_id = auth.uid()
          )
          AND email IN (
            SELECT email 
            FROM auth.users 
            WHERE id = auth.uid()
          )
        );

        COMMENT ON POLICY "Allow initial pharmacy creation" ON public.pharmacies IS 
          'Permet aux utilisateurs authentifiés de créer leur première pharmacie lors de l''inscription. Vérifie que l''utilisateur n''a pas déjà de pharmacie et que l''email correspond.';
    END IF;
END $$;

-- =====================================================
-- Update personnel INSERT policy if needed
-- =====================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow personnel creation" ON public.personnel;

-- Recreate with correct rules
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

COMMENT ON POLICY "Allow personnel creation" ON public.personnel IS 
  'Permet: 1) Aux admins de créer du personnel dans leur tenant, 2) La création du premier admin lors de l''inscription d''une pharmacie.';