-- =====================================================
-- AJOUT DES POLITIQUES RLS MANQUANTES POUR COMPTABILITÉ ANALYTIQUE
-- =====================================================

-- 1. Table repartitions_charges - Politique ALL (INSERT/UPDATE/DELETE)
CREATE POLICY "Authorized users can manage repartitions_charges in their tenant"
ON public.repartitions_charges
FOR ALL
TO authenticated
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- 2. Table lignes_repartition - Politique ALL (INSERT/UPDATE/DELETE)
CREATE POLICY "Authorized users can manage lignes_repartition in their tenant"
ON public.lignes_repartition
FOR ALL
TO authenticated
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- 3. Table coefficients_repartition - Politique ALL (INSERT/UPDATE/DELETE)
CREATE POLICY "Authorized users can manage coefficients_repartition in their tenant"
ON public.coefficients_repartition
FOR ALL
TO authenticated
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());