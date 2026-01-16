-- Sécuriser la table clients - données médicales et financières sensibles
-- Problème: La politique utilise le rôle 'public' au lieu de 'authenticated'

-- Supprimer l'ancienne politique permissive
DROP POLICY IF EXISTS "tenant_access_clients" ON public.clients;

-- Créer de nouvelles politiques restrictives pour utilisateurs authentifiés uniquement
-- Politique SELECT: Les utilisateurs authentifiés peuvent voir les clients de leur tenant
CREATE POLICY "Authenticated users can view clients from their tenant"
ON public.clients
FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- Politique INSERT: Les utilisateurs authentifiés peuvent créer des clients dans leur tenant
CREATE POLICY "Authenticated users can insert clients in their tenant"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Politique UPDATE: Les utilisateurs authentifiés peuvent modifier les clients de leur tenant
CREATE POLICY "Authenticated users can update clients in their tenant"
ON public.clients
FOR UPDATE
TO authenticated
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Politique DELETE: Les utilisateurs authentifiés peuvent supprimer les clients de leur tenant
CREATE POLICY "Authenticated users can delete clients in their tenant"
ON public.clients
FOR DELETE
TO authenticated
USING (tenant_id = get_current_user_tenant_id());