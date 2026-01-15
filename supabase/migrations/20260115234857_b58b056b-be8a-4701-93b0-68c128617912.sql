-- Corriger les politiques RLS pour network_customization_themes
-- Problème: Les politiques utilisent 'public' au lieu de 'authenticated'

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view global and tenant themes" ON public.network_customization_themes;
DROP POLICY IF EXISTS "Users can insert tenant themes" ON public.network_customization_themes;
DROP POLICY IF EXISTS "Users can update own tenant themes" ON public.network_customization_themes;
DROP POLICY IF EXISTS "Users can delete own tenant themes" ON public.network_customization_themes;

-- Nouvelles politiques sécurisées (authenticated uniquement)
CREATE POLICY "Authenticated users can view own tenant themes"
ON public.network_customization_themes
FOR SELECT TO authenticated
USING (
  tenant_id IS NULL
  OR tenant_id = get_current_user_tenant_id()
  OR is_network_shared = true
);

CREATE POLICY "Authenticated users can insert tenant themes"
ON public.network_customization_themes
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can update own tenant themes"
ON public.network_customization_themes
FOR UPDATE TO authenticated
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can delete own tenant themes"
ON public.network_customization_themes
FOR DELETE TO authenticated
USING (tenant_id = get_current_user_tenant_id());