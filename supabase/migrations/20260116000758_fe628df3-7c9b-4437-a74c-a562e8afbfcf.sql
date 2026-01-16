-- Sécuriser la table personnel - données sensibles des employés
-- Problème: Les politiques SELECT et DELETE utilisent le rôle 'public' au lieu de 'authenticated'

-- Supprimer les anciennes politiques permissives
DROP POLICY IF EXISTS "View tenant members" ON public.personnel;
DROP POLICY IF EXISTS "Admins delete" ON public.personnel;

-- Recréer la politique SELECT avec le rôle 'authenticated'
CREATE POLICY "Authenticated users can view personnel from their tenant"
ON public.personnel
FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- Recréer la politique DELETE avec le rôle 'authenticated'
CREATE POLICY "Admins can delete personnel from their tenant"
ON public.personnel
FOR DELETE
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id() 
  AND tenant_id IN (
    SELECT p.tenant_id
    FROM personnel p
    WHERE p.auth_user_id = auth.uid() 
    AND p.role = 'Admin'
  )
);