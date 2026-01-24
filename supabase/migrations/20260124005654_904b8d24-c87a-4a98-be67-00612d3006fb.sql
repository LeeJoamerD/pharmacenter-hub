-- Corriger la politique RLS de la table lots : remplacer le rôle 'public' par 'authenticated'
-- Cette correction empêche l'accès anonyme aux données de prix sensibles

-- Supprimer l'ancienne politique avec rôle 'public'
DROP POLICY IF EXISTS "tenant_access_lots" ON public.lots;

-- Recréer avec le rôle 'authenticated' uniquement
CREATE POLICY "tenant_access_lots"
ON public.lots
FOR ALL
TO authenticated
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Ajouter un commentaire explicatif
COMMENT ON POLICY "tenant_access_lots" ON public.lots IS 
  'Restreint l''accès aux lots aux utilisateurs authentifiés du même tenant uniquement';