-- Sécuriser la table encryption_keys - clés cryptographiques sensibles
-- Problème: Les politiques utilisent le rôle 'public' au lieu de 'authenticated'

-- Supprimer les anciennes politiques permissives
DROP POLICY IF EXISTS "encryption_keys_select_admin" ON public.encryption_keys;
DROP POLICY IF EXISTS "encryption_keys_insert_admin" ON public.encryption_keys;
DROP POLICY IF EXISTS "encryption_keys_update_admin" ON public.encryption_keys;
DROP POLICY IF EXISTS "encryption_keys_delete_admin" ON public.encryption_keys;

-- Recréer les politiques avec le rôle 'authenticated' uniquement
CREATE POLICY "Only admins can view encryption keys"
ON public.encryption_keys
FOR SELECT
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id() 
  AND is_system_admin()
);

CREATE POLICY "Only admins can insert encryption keys"
ON public.encryption_keys
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_current_user_tenant_id() 
  AND is_system_admin()
);

CREATE POLICY "Only admins can update encryption keys"
ON public.encryption_keys
FOR UPDATE
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id() 
  AND is_system_admin()
)
WITH CHECK (
  tenant_id = get_current_user_tenant_id() 
  AND is_system_admin()
);

CREATE POLICY "Only admins can delete encryption keys"
ON public.encryption_keys
FOR DELETE
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id() 
  AND is_system_admin()
);