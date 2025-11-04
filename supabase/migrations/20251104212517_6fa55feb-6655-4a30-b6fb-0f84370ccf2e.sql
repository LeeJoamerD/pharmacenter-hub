-- PHASE 1: Multi-localisation Plan Comptable - Templates 6 pays
-- Système: OHADA (CG, CM, SN, CI), PCG (FR), PCMN (BE)

-- 1. Création table parametres_plan_comptable_regionaux
CREATE TABLE IF NOT EXISTS public.parametres_plan_comptable_regionaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  code_pays VARCHAR(2) NOT NULL,
  pays VARCHAR(100) NOT NULL,
  
  -- Système comptable
  systeme_comptable VARCHAR(20) NOT NULL,
  version_systeme VARCHAR(50),
  
  -- Structure des classes comptables
  classes_definition JSONB NOT NULL,
  
  -- Règles de codification
  format_code_compte VARCHAR(50) DEFAULT '^\d{2,6}$',
  longueur_code_min INTEGER DEFAULT 2,
  longueur_code_max INTEGER DEFAULT 6,
  separateur_hierarchique VARCHAR(1) DEFAULT '',
  
  -- Nomenclature et terminologie
  terminologie_comptes JSONB,
  
  -- Formats d'affichage
  devise_principale VARCHAR(10) NOT NULL,
  symbole_devise VARCHAR(10) NOT NULL,
  separateur_milliers VARCHAR(1) DEFAULT ' ',
  separateur_decimal VARCHAR(1) DEFAULT ',',
  position_symbole_devise VARCHAR(10) DEFAULT 'after',
  
  -- Règles métier
  validation_code_strict BOOLEAN DEFAULT true,
  autoriser_comptes_negatifs BOOLEAN DEFAULT false,
  gestion_analytique_obligatoire BOOLEAN DEFAULT false,
  
  -- Conformité et mentions légales
  organisme_normalisation VARCHAR(200),
  reference_reglementaire TEXT,
  mentions_legales_plan TEXT,
  
  -- Initialisation et templates
  template_predefini BOOLEAN DEFAULT false,
  template_json JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tenant_country_coa UNIQUE(tenant_id, code_pays)
);

COMMENT ON TABLE public.parametres_plan_comptable_regionaux IS 
'Paramètres régionaux pour adapter le plan comptable selon le pays et le système comptable (OHADA, PCG, PCMN)';

-- 2. Fonction RPC init_coa_params_for_tenant avec templates complets
CREATE OR REPLACE FUNCTION public.init_coa_params_for_tenant(
  p_tenant_id UUID,
  p_country_code VARCHAR(2) DEFAULT 'CG'
)
RETURNS VOID AS $$
DECLARE
  v_code_pays VARCHAR(2);
  v_pays VARCHAR(100);
  v_systeme VARCHAR(20);
  v_version VARCHAR(50);
  v_classes JSONB;
  v_devise VARCHAR(10);
  v_symbole VARCHAR(10);
  v_sep_milliers VARCHAR(1);
  v_sep_decimal VARCHAR(1);
  v_position_devise VARCHAR(10);
  v_format_code VARCHAR(50);
  v_code_min INTEGER;
  v_code_max INTEGER;
  v_organisme VARCHAR(200);
  v_reference TEXT;
  v_mentions TEXT;
BEGIN
  -- Template selon pays
  CASE p_country_code
    WHEN 'CG' THEN
      -- 🇨🇬 CONGO-BRAZZAVILLE (OHADA) - DÉFAUT
      v_code_pays := 'CG';
      v_pays := 'Congo-Brazzaville';
      v_systeme := 'OHADA';
      v_version := 'OHADA 2017';
      v_devise := 'XAF';
      v_symbole := 'FCFA';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_position_devise := 'after';
      v_format_code := '^\d{2,6}$';
      v_code_min := 2;
      v_code_max := 6;
      v_organisme := 'OHADA - Organisation pour l''Harmonisation en Afrique du Droit des Affaires';
      v_reference := 'Acte uniforme relatif au droit comptable et à l''information financière (révisé 2017)';
      v_mentions := 'Plan comptable conforme au référentiel OHADA.' || E'\n' || 
                    'Conservation obligatoire 10 ans.' || E'\n' || 
                    'Modification interdite des comptes de base.';
      v_classes := '[
        {
          "classe": 1,
          "nom": "Comptes de ressources durables",
          "description": "Capitaux propres et dettes à plus d''un an",
          "icon": "Building",
          "color": "text-blue-600"
        },
        {
          "classe": 2,
          "nom": "Comptes d''actif immobilisé",
          "description": "Immobilisations corporelles et incorporelles",
          "icon": "BookOpen",
          "color": "text-green-600"
        },
        {
          "classe": 3,
          "nom": "Comptes de stocks",
          "description": "Stocks de marchandises et produits",
          "icon": "Package",
          "color": "text-orange-600"
        },
        {
          "classe": 4,
          "nom": "Comptes de tiers",
          "description": "Créances et dettes d''exploitation",
          "icon": "Briefcase",
          "color": "text-purple-600"
        },
        {
          "classe": 5,
          "nom": "Comptes de trésorerie",
          "description": "Comptes financiers et valeurs mobilières",
          "icon": "CreditCard",
          "color": "text-cyan-600"
        },
        {
          "classe": 6,
          "nom": "Comptes de charges",
          "description": "Charges des activités ordinaires",
          "icon": "TrendingUp",
          "color": "text-red-600"
        },
        {
          "classe": 7,
          "nom": "Comptes de produits",
          "description": "Produits des activités ordinaires",
          "icon": "DollarSign",
          "color": "text-emerald-600"
        }
      ]'::jsonb;

    WHEN 'CM' THEN
      -- 🇨🇲 CAMEROUN (SYSCOHADA)
      v_code_pays := 'CM';
      v_pays := 'Cameroun';
      v_systeme := 'SYSCOHADA';
      v_version := 'SYSCOHADA Révisé 2017';
      v_devise := 'XAF';
      v_symbole := 'FCFA';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_position_devise := 'after';
      v_format_code := '^\d{2,6}$';
      v_code_min := 2;
      v_code_max := 6;
      v_organisme := 'OHADA - CEMAC (Communauté Économique et Monétaire de l''Afrique Centrale)';
      v_reference := 'Règlement CEMAC n°01/18-UEAC-190-CM-33 portant règles comptables applicables';
      v_mentions := 'Plan comptable conforme SYSCOHADA CEMAC.' || E'\n' || 
                    'Archivage 10 ans minimum.' || E'\n' ||
                    'Déclarations fiscales BEAC obligatoires.';
      v_classes := '[
        {"classe": 1, "nom": "Comptes de ressources durables", "description": "Capitaux propres et dettes à plus d''un an", "icon": "Building", "color": "text-blue-600"},
        {"classe": 2, "nom": "Comptes d''actif immobilisé", "description": "Immobilisations corporelles et incorporelles", "icon": "BookOpen", "color": "text-green-600"},
        {"classe": 3, "nom": "Comptes de stocks", "description": "Stocks de marchandises et produits", "icon": "Package", "color": "text-orange-600"},
        {"classe": 4, "nom": "Comptes de tiers", "description": "Créances et dettes d''exploitation", "icon": "Briefcase", "color": "text-purple-600"},
        {"classe": 5, "nom": "Comptes de trésorerie", "description": "Comptes financiers et valeurs mobilières", "icon": "CreditCard", "color": "text-cyan-600"},
        {"classe": 6, "nom": "Comptes de charges", "description": "Charges des activités ordinaires", "icon": "TrendingUp", "color": "text-red-600"},
        {"classe": 7, "nom": "Comptes de produits", "description": "Produits des activités ordinaires", "icon": "DollarSign", "color": "text-emerald-600"}
      ]'::jsonb;

    WHEN 'SN' THEN
      -- 🇸🇳 SÉNÉGAL (SYSCOHADA UEMOA)
      v_code_pays := 'SN';
      v_pays := 'Sénégal';
      v_systeme := 'SYSCOHADA';
      v_version := 'SYSCOHADA Révisé 2017';
      v_devise := 'XOF';
      v_symbole := 'FCFA';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_position_devise := 'after';
      v_format_code := '^\d{2,6}$';
      v_code_min := 2;
      v_code_max := 6;
      v_organisme := 'OHADA - UEMOA (Union Économique et Monétaire Ouest Africaine)';
      v_reference := 'Règlement UEMOA n°15/2017/CM portant normalisation comptable';
      v_mentions := 'Plan comptable conforme SYSCOHADA UEMOA.' || E'\n' || 
                    'Conservation documents 10 ans.' || E'\n' ||
                    'Télédéclarations BCEAO obligatoires.';
      v_classes := '[
        {"classe": 1, "nom": "Comptes de ressources durables", "description": "Capitaux propres et dettes à plus d''un an", "icon": "Building", "color": "text-blue-600"},
        {"classe": 2, "nom": "Comptes d''actif immobilisé", "description": "Immobilisations corporelles et incorporelles", "icon": "BookOpen", "color": "text-green-600"},
        {"classe": 3, "nom": "Comptes de stocks", "description": "Stocks de marchandises et produits", "icon": "Package", "color": "text-orange-600"},
        {"classe": 4, "nom": "Comptes de tiers", "description": "Créances et dettes d''exploitation", "icon": "Briefcase", "color": "text-purple-600"},
        {"classe": 5, "nom": "Comptes de trésorerie", "description": "Comptes financiers et valeurs mobilières", "icon": "CreditCard", "color": "text-cyan-600"},
        {"classe": 6, "nom": "Comptes de charges", "description": "Charges des activités ordinaires", "icon": "TrendingUp", "color": "text-red-600"},
        {"classe": 7, "nom": "Comptes de produits", "description": "Produits des activités ordinaires", "icon": "DollarSign", "color": "text-emerald-600"}
      ]'::jsonb;

    WHEN 'CI' THEN
      -- 🇨🇮 CÔTE D'IVOIRE (SYSCOHADA UEMOA)
      v_code_pays := 'CI';
      v_pays := 'Côte d''Ivoire';
      v_systeme := 'SYSCOHADA';
      v_version := 'SYSCOHADA Révisé 2017';
      v_devise := 'XOF';
      v_symbole := 'FCFA';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_position_devise := 'after';
      v_format_code := '^\d{2,6}$';
      v_code_min := 2;
      v_code_max := 6;
      v_organisme := 'OHADA - UEMOA (Union Économique et Monétaire Ouest Africaine)';
      v_reference := 'Règlement UEMOA n°15/2017/CM - Directive BCEAO';
      v_mentions := 'Plan comptable conforme SYSCOHADA UEMOA.' || E'\n' || 
                    'Archivage obligatoire 10 ans.' || E'\n' ||
                    'Déclarations DGI et BCEAO requises.';
      v_classes := '[
        {"classe": 1, "nom": "Comptes de ressources durables", "description": "Capitaux propres et dettes à plus d''un an", "icon": "Building", "color": "text-blue-600"},
        {"classe": 2, "nom": "Comptes d''actif immobilisé", "description": "Immobilisations corporelles et incorporelles", "icon": "BookOpen", "color": "text-green-600"},
        {"classe": 3, "nom": "Comptes de stocks", "description": "Stocks de marchandises et produits", "icon": "Package", "color": "text-orange-600"},
        {"classe": 4, "nom": "Comptes de tiers", "description": "Créances et dettes d''exploitation", "icon": "Briefcase", "color": "text-purple-600"},
        {"classe": 5, "nom": "Comptes de trésorerie", "description": "Comptes financiers et valeurs mobilières", "icon": "CreditCard", "color": "text-cyan-600"},
        {"classe": 6, "nom": "Comptes de charges", "description": "Charges des activités ordinaires", "icon": "TrendingUp", "color": "text-red-600"},
        {"classe": 7, "nom": "Comptes de produits", "description": "Produits des activités ordinaires", "icon": "DollarSign", "color": "text-emerald-600"}
      ]'::jsonb;

    WHEN 'FR' THEN
      -- 🇫🇷 FRANCE (PCG)
      v_code_pays := 'FR';
      v_pays := 'France';
      v_systeme := 'PCG';
      v_version := 'PCG 2014 (ANC)';
      v_devise := 'EUR';
      v_symbole := '€';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_position_devise := 'after';
      v_format_code := '^\d{3,8}$';
      v_code_min := 3;
      v_code_max := 8;
      v_organisme := 'ANC - Autorité des Normes Comptables';
      v_reference := 'Règlement ANC n°2014-03 relatif au plan comptable général';
      v_mentions := 'Plan comptable conforme au PCG.' || E'\n' || 
                    'FEC (Fichier des Écritures Comptables) obligatoire.' || E'\n' ||
                    'Archivage 10 ans minimum.';
      v_classes := '[
        {"classe": 1, "nom": "Comptes de capitaux", "description": "Capital, réserves, résultat", "icon": "Building", "color": "text-blue-600"},
        {"classe": 2, "nom": "Comptes d''immobilisations", "description": "Immobilisations incorporelles, corporelles et financières", "icon": "BookOpen", "color": "text-green-600"},
        {"classe": 3, "nom": "Comptes de stocks et en-cours", "description": "Matières premières, produits finis, marchandises", "icon": "Package", "color": "text-orange-600"},
        {"classe": 4, "nom": "Comptes de tiers", "description": "Fournisseurs, clients, personnel, organismes sociaux", "icon": "Briefcase", "color": "text-purple-600"},
        {"classe": 5, "nom": "Comptes financiers", "description": "Banques, caisses, valeurs mobilières de placement", "icon": "CreditCard", "color": "text-cyan-600"},
        {"classe": 6, "nom": "Comptes de charges", "description": "Charges d''exploitation, financières et exceptionnelles", "icon": "TrendingUp", "color": "text-red-600"},
        {"classe": 7, "nom": "Comptes de produits", "description": "Produits d''exploitation, financiers et exceptionnels", "icon": "DollarSign", "color": "text-emerald-600"},
        {"classe": 8, "nom": "Comptes spéciaux", "description": "Engagements hors bilan, résultats en instance", "icon": "FileText", "color": "text-slate-600"}
      ]'::jsonb;

    WHEN 'BE' THEN
      -- 🇧🇪 BELGIQUE (PCMN)
      v_code_pays := 'BE';
      v_pays := 'Belgique';
      v_systeme := 'PCMN';
      v_version := 'PCMN 2019';
      v_devise := 'EUR';
      v_symbole := '€';
      v_sep_milliers := '.';
      v_sep_decimal := ',';
      v_position_devise := 'after';
      v_format_code := '^\d{3,7}$';
      v_code_min := 3;
      v_code_max := 7;
      v_organisme := 'CNC - Commission des Normes Comptables';
      v_reference := 'Code des sociétés et des associations (CSA)';
      v_mentions := 'Plan conforme PCMN.' || E'\n' || 
                    'Dépôt Centrale des Bilans BNB obligatoire.' || E'\n' ||
                    'Conservation 7 ans minimum.';
      v_classes := '[
        {"classe": 0, "nom": "Droits et engagements hors bilan", "description": "Garanties, engagements de location", "icon": "Shield", "color": "text-gray-600"},
        {"classe": 1, "nom": "Fonds propres, provisions et dettes LT", "description": "Capital, réserves, emprunts long terme", "icon": "Building", "color": "text-blue-600"},
        {"classe": 2, "nom": "Frais d''établissement et actifs immobilisés", "description": "Immobilisations et créances LT", "icon": "BookOpen", "color": "text-green-600"},
        {"classe": 3, "nom": "Stocks et commandes en cours", "description": "Matières, marchandises, produits finis", "icon": "Package", "color": "text-orange-600"},
        {"classe": 4, "nom": "Créances et dettes CT", "description": "Clients, fournisseurs, TVA, personnel", "icon": "Briefcase", "color": "text-purple-600"},
        {"classe": 5, "nom": "Placements de trésorerie", "description": "Banques, caisses, titres", "icon": "CreditCard", "color": "text-cyan-600"},
        {"classe": 6, "nom": "Charges", "description": "Charges d''exploitation, financières, exceptionnelles", "icon": "TrendingUp", "color": "text-red-600"},
        {"classe": 7, "nom": "Produits", "description": "Produits d''exploitation, financiers, exceptionnels", "icon": "DollarSign", "color": "text-emerald-600"}
      ]'::jsonb;

    ELSE
      -- Par défaut: Congo-Brazzaville (OHADA)
      v_code_pays := 'CG';
      v_pays := 'Congo-Brazzaville';
      v_systeme := 'OHADA';
      v_version := 'OHADA 2017';
      v_devise := 'XAF';
      v_symbole := 'FCFA';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_position_devise := 'after';
      v_format_code := '^\d{2,6}$';
      v_code_min := 2;
      v_code_max := 6;
      v_organisme := 'OHADA - Organisation pour l''Harmonisation en Afrique du Droit des Affaires';
      v_reference := 'Acte uniforme relatif au droit comptable et à l''information financière (révisé 2017)';
      v_mentions := 'Plan comptable conforme au référentiel OHADA.' || E'\n' || 
                    'Conservation obligatoire 10 ans.' || E'\n' || 
                    'Modification interdite des comptes de base.';
      v_classes := '[
        {"classe": 1, "nom": "Comptes de ressources durables", "description": "Capitaux propres et dettes à plus d''un an", "icon": "Building", "color": "text-blue-600"},
        {"classe": 2, "nom": "Comptes d''actif immobilisé", "description": "Immobilisations corporelles et incorporelles", "icon": "BookOpen", "color": "text-green-600"},
        {"classe": 3, "nom": "Comptes de stocks", "description": "Stocks de marchandises et produits", "icon": "Package", "color": "text-orange-600"},
        {"classe": 4, "nom": "Comptes de tiers", "description": "Créances et dettes d''exploitation", "icon": "Briefcase", "color": "text-purple-600"},
        {"classe": 5, "nom": "Comptes de trésorerie", "description": "Comptes financiers et valeurs mobilières", "icon": "CreditCard", "color": "text-cyan-600"},
        {"classe": 6, "nom": "Comptes de charges", "description": "Charges des activités ordinaires", "icon": "TrendingUp", "color": "text-red-600"},
        {"classe": 7, "nom": "Comptes de produits", "description": "Produits des activités ordinaires", "icon": "DollarSign", "color": "text-emerald-600"}
      ]'::jsonb;
  END CASE;

  -- Upsert paramètres
  INSERT INTO public.parametres_plan_comptable_regionaux (
    tenant_id, code_pays, pays, systeme_comptable, version_systeme,
    classes_definition, format_code_compte, longueur_code_min, longueur_code_max,
    devise_principale, symbole_devise, separateur_milliers, separateur_decimal,
    position_symbole_devise, organisme_normalisation, reference_reglementaire,
    mentions_legales_plan, template_predefini
  )
  VALUES (
    p_tenant_id, v_code_pays, v_pays, v_systeme, v_version,
    v_classes, v_format_code, v_code_min, v_code_max,
    v_devise, v_symbole, v_sep_milliers, v_sep_decimal,
    v_position_devise, v_organisme, v_reference, v_mentions, true
  )
  ON CONFLICT (tenant_id, code_pays) 
  DO UPDATE SET
    pays = EXCLUDED.pays,
    systeme_comptable = EXCLUDED.systeme_comptable,
    version_systeme = EXCLUDED.version_systeme,
    classes_definition = EXCLUDED.classes_definition,
    format_code_compte = EXCLUDED.format_code_compte,
    longueur_code_min = EXCLUDED.longueur_code_min,
    longueur_code_max = EXCLUDED.longueur_code_max,
    devise_principale = EXCLUDED.devise_principale,
    symbole_devise = EXCLUDED.symbole_devise,
    separateur_milliers = EXCLUDED.separateur_milliers,
    separateur_decimal = EXCLUDED.separateur_decimal,
    position_symbole_devise = EXCLUDED.position_symbole_devise,
    organisme_normalisation = EXCLUDED.organisme_normalisation,
    reference_reglementaire = EXCLUDED.reference_reglementaire,
    mentions_legales_plan = EXCLUDED.mentions_legales_plan,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.init_coa_params_for_tenant IS 
'Initialise ou met à jour les paramètres régionaux du plan comptable pour un tenant selon le pays (CG, CM, SN, CI, FR, BE)';

-- 3. RLS Policies
ALTER TABLE public.parametres_plan_comptable_regionaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view COA params from their tenant"
ON public.parametres_plan_comptable_regionaux FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id()
);

CREATE POLICY "Admins manage COA params in their tenant"
ON public.parametres_plan_comptable_regionaux FOR ALL
USING (
  tenant_id = get_current_user_tenant_id() AND
  (
    is_system_admin() OR
    EXISTS (
      SELECT 1 FROM public.personnel 
      WHERE auth_user_id = auth.uid() 
      AND tenant_id = get_current_user_tenant_id()
      AND role IN ('Admin', 'Pharmacien')
    )
  )
);

-- 4. Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_coa_params_tenant 
ON public.parametres_plan_comptable_regionaux(tenant_id);

CREATE INDEX IF NOT EXISTS idx_coa_params_country 
ON public.parametres_plan_comptable_regionaux(code_pays);

CREATE INDEX IF NOT EXISTS idx_coa_params_system 
ON public.parametres_plan_comptable_regionaux(systeme_comptable);

-- 5. Trigger updated_at
CREATE TRIGGER trg_update_coa_params_updated_at
BEFORE UPDATE ON public.parametres_plan_comptable_regionaux
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Initialisation tenants existants avec Congo-Brazzaville (OHADA) par défaut
DO $$
DECLARE
  tenant_rec RECORD;
BEGIN
  FOR tenant_rec IN SELECT id FROM public.pharmacies LOOP
    PERFORM public.init_coa_params_for_tenant(tenant_rec.id, 'CG');
  END LOOP;
END $$;