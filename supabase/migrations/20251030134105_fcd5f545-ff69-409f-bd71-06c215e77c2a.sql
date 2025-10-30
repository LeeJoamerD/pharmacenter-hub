-- ============================================
-- CORRECTION DE SÉCURITÉ: POLITIQUES RLS
-- Restreindre l'accès aux utilisateurs authentifiés uniquement
-- ============================================

-- 1. CATEGORIES_TARIFICATION
DROP POLICY IF EXISTS "Users can view categories from their tenant" ON public.categories_tarification;
DROP POLICY IF EXISTS "Users can insert categories in their tenant" ON public.categories_tarification;
DROP POLICY IF EXISTS "Users can update categories from their tenant" ON public.categories_tarification;
DROP POLICY IF EXISTS "Users can delete categories from their tenant" ON public.categories_tarification;

CREATE POLICY "Authenticated users can view categories from their tenant"
ON public.categories_tarification FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can insert categories in their tenant"
ON public.categories_tarification FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can update categories from their tenant"
ON public.categories_tarification FOR UPDATE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can delete categories from their tenant"
ON public.categories_tarification FOR DELETE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- 2. COMPLIANCE_REQUIREMENTS
DROP POLICY IF EXISTS "Users can view compliance requirements from their tenant" ON public.compliance_requirements;
DROP POLICY IF EXISTS "Users can insert compliance requirements in their tenant" ON public.compliance_requirements;
DROP POLICY IF EXISTS "Users can update compliance requirements from their tenant" ON public.compliance_requirements;
DROP POLICY IF EXISTS "Users can delete compliance requirements from their tenant" ON public.compliance_requirements;

CREATE POLICY "Authenticated users can view compliance requirements from their tenant"
ON public.compliance_requirements FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can insert compliance requirements in their tenant"
ON public.compliance_requirements FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can update compliance requirements from their tenant"
ON public.compliance_requirements FOR UPDATE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can delete compliance requirements from their tenant"
ON public.compliance_requirements FOR DELETE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- 3. COMPLIANCE_CONTROLS
DROP POLICY IF EXISTS "Users can view compliance controls from their tenant" ON public.compliance_controls;
DROP POLICY IF EXISTS "Users can insert compliance controls in their tenant" ON public.compliance_controls;
DROP POLICY IF EXISTS "Users can update compliance controls from their tenant" ON public.compliance_controls;
DROP POLICY IF EXISTS "Users can delete compliance controls from their tenant" ON public.compliance_controls;

CREATE POLICY "Authenticated users can view compliance controls from their tenant"
ON public.compliance_controls FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can insert compliance controls in their tenant"
ON public.compliance_controls FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can update compliance controls from their tenant"
ON public.compliance_controls FOR UPDATE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can delete compliance controls from their tenant"
ON public.compliance_controls FOR DELETE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- 4. COMPLIANCE_ACTIONS
DROP POLICY IF EXISTS "Users can view compliance actions from their tenant" ON public.compliance_actions;
DROP POLICY IF EXISTS "Users can insert compliance actions in their tenant" ON public.compliance_actions;
DROP POLICY IF EXISTS "Users can update compliance actions from their tenant" ON public.compliance_actions;
DROP POLICY IF EXISTS "Users can delete compliance actions from their tenant" ON public.compliance_actions;

CREATE POLICY "Authenticated users can view compliance actions from their tenant"
ON public.compliance_actions FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can insert compliance actions in their tenant"
ON public.compliance_actions FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can update compliance actions from their tenant"
ON public.compliance_actions FOR UPDATE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can delete compliance actions from their tenant"
ON public.compliance_actions FOR DELETE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- 5. COMPLIANCE_PRODUCT_REQUIREMENTS
DROP POLICY IF EXISTS "Users can view compliance product requirements from their tenan" ON public.compliance_product_requirements;
DROP POLICY IF EXISTS "Users can insert compliance product requirements in their tenan" ON public.compliance_product_requirements;
DROP POLICY IF EXISTS "Users can update compliance product requirements from their ten" ON public.compliance_product_requirements;
DROP POLICY IF EXISTS "Users can delete compliance product requirements from their ten" ON public.compliance_product_requirements;

CREATE POLICY "Authenticated users can view compliance product requirements from their tenant"
ON public.compliance_product_requirements FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can insert compliance product requirements in their tenant"
ON public.compliance_product_requirements FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can update compliance product requirements from their tenant"
ON public.compliance_product_requirements FOR UPDATE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can delete compliance product requirements from their tenant"
ON public.compliance_product_requirements FOR DELETE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- 6. COMPLIANCE_METRICS_HISTORY
DROP POLICY IF EXISTS "Users can view compliance metrics from their tenant" ON public.compliance_metrics_history;
DROP POLICY IF EXISTS "Users can insert compliance metrics in their tenant" ON public.compliance_metrics_history;

CREATE POLICY "Authenticated users can view compliance metrics from their tenant"
ON public.compliance_metrics_history FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can insert compliance metrics in their tenant"
ON public.compliance_metrics_history FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- VÉRIFICATION FINALE
-- Toutes les policies doivent maintenant utiliser le rôle 'authenticated'
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename IN (
    'categories_tarification',
    'compliance_requirements',
    'compliance_controls',
    'compliance_actions',
    'compliance_product_requirements',
    'compliance_metrics_history'
  )
  AND roles::text = '{authenticated}';
  
  RAISE NOTICE 'Nombre de policies sécurisées avec authenticated: %', policy_count;
  RAISE NOTICE 'Correction de sécurité RLS terminée avec succès';
END $$;