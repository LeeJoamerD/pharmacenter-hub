-- =====================================================
-- PHASE 1: CATALOGUE GLOBAL ET PLATFORM ADMIN
-- =====================================================

-- 1. Table des administrateurs de plateforme (sans tenant_id)
CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  prenoms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table du catalogue global des produits (sans tenant_id)
CREATE TABLE public.catalogue_global_produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_cip TEXT UNIQUE NOT NULL,
  ancien_code_cip TEXT,
  libelle_produit TEXT NOT NULL,
  code_forme TEXT,
  libelle_forme TEXT,
  code_famille TEXT,
  libelle_famille TEXT,
  code_rayon TEXT,
  libelle_rayon TEXT,
  code_dci TEXT,
  libelle_dci TEXT,
  code_classe_therapeutique TEXT,
  libelle_classe_therapeutique TEXT,
  code_laboratoire TEXT,
  libelle_laboratoire TEXT,
  code_categorie_tarification TEXT,
  libelle_categorie_tarification TEXT,
  prix_achat_reference NUMERIC DEFAULT 0,
  prix_vente_reference NUMERIC DEFAULT 0,
  taux_tva NUMERIC DEFAULT 0,
  code_statut TEXT,
  libelle_statut TEXT,
  prescription_requise BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.platform_admins(id),
  updated_by UUID REFERENCES public.platform_admins(id)
);

-- 3. Index pour recherche rapide
CREATE INDEX idx_catalogue_global_code_cip ON public.catalogue_global_produits(code_cip);
CREATE INDEX idx_catalogue_global_ancien_cip ON public.catalogue_global_produits(ancien_code_cip);
CREATE INDEX idx_catalogue_global_libelle ON public.catalogue_global_produits USING gin(to_tsvector('french', libelle_produit));
CREATE INDEX idx_catalogue_global_active ON public.catalogue_global_produits(is_active);

-- 4. Fonction pour vérifier si l'utilisateur est un platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE auth_user_id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Activer RLS sur platform_admins
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Seuls les platform admins peuvent voir leur propre enregistrement
CREATE POLICY "Platform admins can view their own record"
ON public.platform_admins FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Seuls les platform admins existants peuvent insérer de nouveaux admins
CREATE POLICY "Platform admins can insert new admins"
ON public.platform_admins FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin() OR NOT EXISTS (SELECT 1 FROM public.platform_admins));

-- Seuls les platform admins peuvent modifier
CREATE POLICY "Platform admins can update"
ON public.platform_admins FOR UPDATE
TO authenticated
USING (public.is_platform_admin());

-- 6. Activer RLS sur catalogue_global_produits
ALTER TABLE public.catalogue_global_produits ENABLE ROW LEVEL SECURITY;

-- Tous les utilisateurs authentifiés peuvent LIRE le catalogue global
CREATE POLICY "All authenticated users can read global catalog"
ON public.catalogue_global_produits FOR SELECT
TO authenticated
USING (true);

-- Seuls les platform admins peuvent INSÉRER
CREATE POLICY "Only platform admins can insert global products"
ON public.catalogue_global_produits FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin());

-- Seuls les platform admins peuvent MODIFIER
CREATE POLICY "Only platform admins can update global products"
ON public.catalogue_global_produits FOR UPDATE
TO authenticated
USING (public.is_platform_admin());

-- Seuls les platform admins peuvent SUPPRIMER
CREATE POLICY "Only platform admins can delete global products"
ON public.catalogue_global_produits FOR DELETE
TO authenticated
USING (public.is_platform_admin());

-- 7. Trigger pour updated_at
CREATE TRIGGER update_platform_admins_updated_at
BEFORE UPDATE ON public.platform_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catalogue_global_produits_updated_at
BEFORE UPDATE ON public.catalogue_global_produits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();