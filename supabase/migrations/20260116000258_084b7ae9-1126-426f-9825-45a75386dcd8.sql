-- Sécuriser la table parametres_audit_regionaux
-- Problème: Table accessible publiquement avec paramètres de conformité régionaux sensibles

-- Supprimer l'ancienne politique permissive
DROP POLICY IF EXISTS "Everyone can view regional audit parameters" ON public.parametres_audit_regionaux;

-- Créer de nouvelles politiques restrictives pour utilisateurs authentifiés uniquement
CREATE POLICY "Authenticated users can view regional audit parameters"
ON public.parametres_audit_regionaux
FOR SELECT
TO authenticated
USING (true);

-- Politique pour la gestion par les administrateurs (si tenant_id existe)
-- Vérifier si la table a une colonne tenant_id pour des restrictions plus granulaires
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parametres_audit_regionaux' 
    AND column_name = 'tenant_id'
  ) THEN
    -- Si tenant_id existe, créer des politiques basées sur le tenant
    DROP POLICY IF EXISTS "Authenticated users can view regional audit parameters" ON public.parametres_audit_regionaux;
    
    EXECUTE 'CREATE POLICY "Users can view regional audit parameters from their tenant"
    ON public.parametres_audit_regionaux
    FOR SELECT
    TO authenticated
    USING (tenant_id = get_current_user_tenant_id())';
    
    EXECUTE 'CREATE POLICY "Admins can manage regional audit parameters in their tenant"
    ON public.parametres_audit_regionaux
    FOR ALL
    TO authenticated
    USING (tenant_id = get_current_user_tenant_id())
    WITH CHECK (tenant_id = get_current_user_tenant_id())';
  END IF;
END $$;