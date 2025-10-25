-- Audit et sécurisation de la table parametres_systeme
-- Table et index unique (tenant_id, cle_parametre) existent déjà
-- RLS activé avec policies correctes
-- Ajout du support is_system_admin() pour cohérence avec autres modules

-- Mettre à jour les policies INSERT/UPDATE pour inclure is_system_admin()
-- comme utilisé dans d'autres modules de l'application

DROP POLICY IF EXISTS "Admins can insert system parameters in their tenant" ON public.parametres_systeme;
CREATE POLICY "Admins can insert system parameters in their tenant" 
ON public.parametres_systeme 
FOR INSERT 
WITH CHECK (
  (tenant_id = get_current_user_tenant_id()) AND 
  (
    is_system_admin() OR 
    EXISTS (
      SELECT 1 FROM personnel 
      WHERE auth_user_id = auth.uid() 
      AND role = ANY(ARRAY['Admin', 'Pharmacien'])
    )
  )
);

DROP POLICY IF EXISTS "Admins can update modifiable system parameters from their tenan" ON public.parametres_systeme;
CREATE POLICY "Admins can update modifiable system parameters from their tenant" 
ON public.parametres_systeme 
FOR UPDATE 
USING (
  (tenant_id = get_current_user_tenant_id()) AND 
  (is_modifiable = true) AND 
  (
    is_system_admin() OR 
    EXISTS (
      SELECT 1 FROM personnel 
      WHERE auth_user_id = auth.uid() 
      AND role = ANY(ARRAY['Admin', 'Pharmacien'])
    )
  )
);

-- Vérification : la table parametres_systeme est maintenant sécurisée avec :
-- ✓ Index unique (tenant_id, cle_parametre) pour upserts stables
-- ✓ RLS activé 
-- ✓ SELECT : tenant_id = get_current_user_tenant_id()
-- ✓ INSERT/UPDATE : tenant_id = get_current_user_tenant_id() ET (rôle Admin/Pharmacien OU is_system_admin())
-- ✓ Multi-tenant isolation complète