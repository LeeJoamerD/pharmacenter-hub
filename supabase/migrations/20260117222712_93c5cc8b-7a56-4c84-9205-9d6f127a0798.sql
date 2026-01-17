-- =====================================================
-- PLAN COMPTABLE GLOBAL - SYSTÈME MULTI-LOCAL
-- Support pour SYSCOHADA, PCG France, UEMOA, IFRS, etc.
-- =====================================================

-- 1. Table des plans comptables disponibles (ex: SYSCOHADA, PCG France)
CREATE TABLE IF NOT EXISTS public.plans_comptables_globaux (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL,
    description TEXT,
    version TEXT,
    zone_geographique TEXT,
    organisme_normalisation TEXT,
    reference_reglementaire TEXT,
    devise_principale TEXT DEFAULT 'XAF',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.platform_admins(id)
);

-- 2. Table des classes comptables par plan (1-9)
CREATE TABLE IF NOT EXISTS public.classes_comptables_globales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_comptable_id UUID NOT NULL REFERENCES public.plans_comptables_globaux(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 9),
    nom TEXT NOT NULL,
    description TEXT,
    type_bilan TEXT CHECK (type_bilan IN ('PASSIF', 'ACTIF', 'CHARGE', 'PRODUIT', 'RESULTAT', 'HORS_BILAN')),
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(plan_comptable_id, numero)
);

-- 3. Table des comptes avec hiérarchie à 4 niveaux
CREATE TABLE IF NOT EXISTS public.comptes_globaux (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_comptable_id UUID NOT NULL REFERENCES public.plans_comptables_globaux(id) ON DELETE CASCADE,
    numero_compte TEXT NOT NULL,
    libelle_compte TEXT NOT NULL,
    classe INTEGER NOT NULL CHECK (classe BETWEEN 1 AND 9),
    niveau INTEGER NOT NULL DEFAULT 1 CHECK (niveau BETWEEN 1 AND 5),
    compte_parent_numero TEXT,
    type_compte TEXT CHECK (type_compte IN ('Actif', 'Passif', 'Charge', 'Produit', 'Capital', 'Resultat', 'HorsBilan')),
    est_nouveau_syscohada BOOLEAN DEFAULT false,
    est_modifie_syscohada BOOLEAN DEFAULT false,
    est_compte_flux_tresorerie BOOLEAN DEFAULT false,
    description TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(plan_comptable_id, numero_compte)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_comptes_globaux_plan ON public.comptes_globaux(plan_comptable_id);
CREATE INDEX IF NOT EXISTS idx_comptes_globaux_classe ON public.comptes_globaux(classe);
CREATE INDEX IF NOT EXISTS idx_comptes_globaux_parent ON public.comptes_globaux(compte_parent_numero);
CREATE INDEX IF NOT EXISTS idx_comptes_globaux_niveau ON public.comptes_globaux(niveau);
CREATE INDEX IF NOT EXISTS idx_classes_comptables_plan ON public.classes_comptables_globales(plan_comptable_id);

-- =====================================================
-- POLITIQUES RLS (Row Level Security)
-- Lecture: tous les authentifiés
-- Écriture: platform_admins uniquement
-- =====================================================

-- Activer RLS
ALTER TABLE public.plans_comptables_globaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes_comptables_globales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptes_globaux ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture (tous les utilisateurs authentifiés)
CREATE POLICY "Authenticated users can read global accounting plans"
ON public.plans_comptables_globaux FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read global account classes"
ON public.classes_comptables_globales FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read global accounts"
ON public.comptes_globaux FOR SELECT TO authenticated
USING (true);

-- Politiques d'écriture (platform_admins uniquement)
CREATE POLICY "Platform admins can insert global accounting plans"
ON public.plans_comptables_globaux FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can update global accounting plans"
ON public.plans_comptables_globaux FOR UPDATE TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can delete global accounting plans"
ON public.plans_comptables_globaux FOR DELETE TO authenticated
USING (public.is_platform_admin());

CREATE POLICY "Platform admins can insert global account classes"
ON public.classes_comptables_globales FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can update global account classes"
ON public.classes_comptables_globales FOR UPDATE TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can delete global account classes"
ON public.classes_comptables_globales FOR DELETE TO authenticated
USING (public.is_platform_admin());

CREATE POLICY "Platform admins can insert global accounts"
ON public.comptes_globaux FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can update global accounts"
ON public.comptes_globaux FOR UPDATE TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can delete global accounts"
ON public.comptes_globaux FOR DELETE TO authenticated
USING (public.is_platform_admin());

-- =====================================================
-- TRIGGERS pour mise à jour automatique de updated_at
-- =====================================================

CREATE TRIGGER set_timestamp_plans_comptables_globaux
BEFORE UPDATE ON public.plans_comptables_globaux
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_timestamp_classes_comptables_globales
BEFORE UPDATE ON public.classes_comptables_globales
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_timestamp_comptes_globaux
BEFORE UPDATE ON public.comptes_globaux
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- DONNÉES INITIALES : Plan SYSCOHADA Révisé 2025
-- =====================================================

-- Insérer le plan comptable SYSCOHADA
INSERT INTO public.plans_comptables_globaux (
    code, nom, description, version, zone_geographique, 
    organisme_normalisation, reference_reglementaire, devise_principale
) VALUES (
    'SYSCOHADA_REVISE',
    'SYSCOHADA Révisé',
    'Système Comptable OHADA révisé applicable dans les 17 États membres de l''espace OHADA. Intègre les normes internationales IAS/IFRS adaptées au contexte africain.',
    '2025',
    'Afrique (Zone OHADA)',
    'OHADA - Organisation pour l''Harmonisation en Afrique du Droit des Affaires',
    'Acte Uniforme relatif au Droit Comptable et à l''Information Financière (2017)',
    'XAF'
) ON CONFLICT (code) DO NOTHING;

-- Insérer les 9 classes comptables SYSCOHADA
INSERT INTO public.classes_comptables_globales (plan_comptable_id, numero, nom, description, type_bilan, icon, color)
SELECT 
    (SELECT id FROM public.plans_comptables_globaux WHERE code = 'SYSCOHADA_REVISE'),
    numero, nom, description, type_bilan, icon, color
FROM (VALUES 
    (1, 'COMPTES DE RESSOURCES DURABLES', 'Capitaux propres, emprunts et dettes à long terme, provisions réglementées', 'PASSIF', 'landmark', 'blue'),
    (2, 'COMPTES D''ACTIF IMMOBILISÉ', 'Immobilisations incorporelles, corporelles et financières', 'ACTIF', 'building', 'green'),
    (3, 'COMPTES DE STOCKS', 'Marchandises, matières premières, produits finis et en-cours', 'ACTIF', 'package', 'amber'),
    (4, 'COMPTES DE TIERS', 'Fournisseurs, clients, personnel, État, organismes sociaux', 'ACTIF', 'users', 'purple'),
    (5, 'COMPTES DE TRÉSORERIE', 'Banques, caisse, titres de placement, instruments de monnaie électronique', 'ACTIF', 'wallet', 'cyan'),
    (6, 'COMPTES DE CHARGES DES ACTIVITÉS ORDINAIRES', 'Achats, services, charges de personnel, dotations aux amortissements', 'CHARGE', 'trending-down', 'red'),
    (7, 'COMPTES DE PRODUITS DES ACTIVITÉS ORDINAIRES', 'Ventes, production, subventions d''exploitation, revenus financiers', 'PRODUIT', 'trending-up', 'emerald'),
    (8, 'COMPTES DES AUTRES CHARGES ET DES AUTRES PRODUITS', 'V.C.E.I., P.C.E.I., charges et produits HAO, impôt sur le résultat', 'RESULTAT', 'calculator', 'orange'),
    (9, 'COMPTES DES ENGAGEMENTS HORS BILAN ET CAGE', 'Engagements donnés/reçus, comptabilité analytique de gestion', 'HORS_BILAN', 'file-text', 'slate')
) AS t(numero, nom, description, type_bilan, icon, color)
ON CONFLICT (plan_comptable_id, numero) DO NOTHING;

-- =====================================================
-- FONCTION pour import des comptes tenant depuis le global
-- =====================================================

CREATE OR REPLACE FUNCTION public.import_plan_comptable_global(
    p_tenant_id UUID,
    p_plan_comptable_code TEXT DEFAULT 'SYSCOHADA_REVISE'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
    v_plan_id UUID;
    v_plan_nom TEXT;
BEGIN
    -- Vérifier que le tenant existe
    IF NOT EXISTS (SELECT 1 FROM pharmacies WHERE id = p_tenant_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tenant non trouvé');
    END IF;

    -- Récupérer l'ID du plan global
    SELECT id, nom INTO v_plan_id, v_plan_nom 
    FROM plans_comptables_globaux 
    WHERE code = p_plan_comptable_code AND is_active = true;
    
    IF v_plan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plan comptable non trouvé: ' || p_plan_comptable_code);
    END IF;

    -- Insérer les comptes dans le plan local du tenant (si la table existe)
    -- Note: Cette fonction sera adaptée selon la structure de la table plan_comptable du tenant
    -- Pour l'instant, elle retourne les infos du plan disponible
    
    SELECT COUNT(*) INTO v_count FROM comptes_globaux WHERE plan_comptable_id = v_plan_id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'plan_id', v_plan_id,
        'plan_nom', v_plan_nom,
        'comptes_disponibles', v_count,
        'message', 'Plan comptable ' || v_plan_nom || ' disponible avec ' || v_count || ' comptes'
    );
END;
$$;