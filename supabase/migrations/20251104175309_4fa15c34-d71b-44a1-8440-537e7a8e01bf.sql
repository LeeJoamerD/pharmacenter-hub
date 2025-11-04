-- Table for regional analytical accounting parameters
CREATE TABLE IF NOT EXISTS public.parametres_comptabilite_analytique_regionale (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  code_pays TEXT NOT NULL CHECK (code_pays IN ('CG', 'CM', 'SN', 'CI', 'FR', 'BE')),
  nom_pays TEXT NOT NULL,
  devise_principale TEXT NOT NULL,
  systeme_comptable TEXT NOT NULL,
  
  -- Analytical accounting specific parameters
  centres_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  cles_repartition_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  terminologie JSONB NOT NULL DEFAULT '{}'::jsonb,
  seuils_alertes JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_analytical_params_per_tenant UNIQUE (tenant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parametres_analytique_tenant_id 
ON public.parametres_comptabilite_analytique_regionale (tenant_id);

CREATE INDEX IF NOT EXISTS idx_parametres_analytique_code_pays 
ON public.parametres_comptabilite_analytique_regionale (code_pays);

-- Enable RLS
ALTER TABLE public.parametres_comptabilite_analytique_regionale ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view analytical params from their tenant" 
ON public.parametres_comptabilite_analytique_regionale 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert analytical params in their tenant" 
ON public.parametres_comptabilite_analytique_regionale 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update analytical params from their tenant" 
ON public.parametres_comptabilite_analytique_regionale 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete analytical params from their tenant" 
ON public.parametres_comptabilite_analytique_regionale 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Trigger for updated_at
CREATE TRIGGER update_parametres_analytique_updated_at
BEFORE UPDATE ON public.parametres_comptabilite_analytique_regionale
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize analytical parameters for a tenant
CREATE OR REPLACE FUNCTION public.init_analytical_params_for_tenant(
  p_tenant_id UUID,
  p_country_code TEXT DEFAULT 'CG'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config JSONB;
  v_centres_types JSONB;
  v_cles_repartition JSONB;
  v_terminologie JSONB;
  v_seuils JSONB;
BEGIN
  -- Check if params already exist
  IF EXISTS (SELECT 1 FROM public.parametres_comptabilite_analytique_regionale WHERE tenant_id = p_tenant_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Paramètres analytiques déjà configurés pour ce tenant');
  END IF;

  -- Templates by country
  CASE p_country_code
    WHEN 'CG' THEN -- Congo-Brazzaville
      v_config := jsonb_build_object(
        'nom_pays', 'Congo-Brazzaville',
        'devise_principale', 'XAF',
        'systeme_comptable', 'OHADA'
      );
      v_centres_types := '[
        {"code": "PROD", "libelle": "Production", "type": "principal"},
        {"code": "DIST", "libelle": "Distribution", "type": "principal"},
        {"code": "ADM", "libelle": "Administration", "type": "auxiliaire"},
        {"code": "COMM", "libelle": "Commercial", "type": "principal"}
      ]'::jsonb;
      v_cles_repartition := '[
        {"code": "CA", "libelle": "Chiffre d''affaires", "base": "chiffre_affaires"},
        {"code": "UO", "libelle": "Unités œuvre", "base": "quantite"},
        {"code": "SURF", "libelle": "Surface", "base": "surface_m2"}
      ]'::jsonb;
      v_terminologie := '{
        "centre_cout": "Centre de coût",
        "centre_profit": "Centre de profit",
        "cle_repartition": "Clé de répartition",
        "budget": "Budget prévisionnel"
      }'::jsonb;
      v_seuils := '{
        "ecart_budget_warning": 10,
        "ecart_budget_critical": 20,
        "taux_rentabilite_min": 5
      }'::jsonb;

    WHEN 'CM' THEN -- Cameroun
      v_config := jsonb_build_object(
        'nom_pays', 'Cameroun',
        'devise_principale', 'XAF',
        'systeme_comptable', 'OHADA'
      );
      v_centres_types := '[
        {"code": "PROD", "libelle": "Production", "type": "principal"},
        {"code": "DIST", "libelle": "Distribution", "type": "principal"},
        {"code": "ADM", "libelle": "Administration", "type": "auxiliaire"},
        {"code": "QUAL", "libelle": "Qualité", "type": "auxiliaire"}
      ]'::jsonb;
      v_cles_repartition := '[
        {"code": "CA", "libelle": "Chiffre d''affaires", "base": "chiffre_affaires"},
        {"code": "UO", "libelle": "Unités œuvre", "base": "quantite"},
        {"code": "EFF", "libelle": "Effectifs", "base": "nombre_employes"}
      ]'::jsonb;
      v_terminologie := '{
        "centre_cout": "Centre de coût",
        "centre_profit": "Centre de profit",
        "cle_repartition": "Clé de répartition",
        "budget": "Budget"
      }'::jsonb;
      v_seuils := '{
        "ecart_budget_warning": 12,
        "ecart_budget_critical": 25,
        "taux_rentabilite_min": 6
      }'::jsonb;

    WHEN 'SN' THEN -- Sénégal
      v_config := jsonb_build_object(
        'nom_pays', 'Sénégal',
        'devise_principale', 'XOF',
        'systeme_comptable', 'OHADA'
      );
      v_centres_types := '[
        {"code": "PROD", "libelle": "Production", "type": "principal"},
        {"code": "DIST", "libelle": "Distribution", "type": "principal"},
        {"code": "ADM", "libelle": "Administration", "type": "structure"},
        {"code": "LOG", "libelle": "Logistique", "type": "auxiliaire"}
      ]'::jsonb;
      v_cles_repartition := '[
        {"code": "CA", "libelle": "Chiffre d''affaires", "base": "chiffre_affaires"},
        {"code": "QTE", "libelle": "Quantités", "base": "quantite"},
        {"code": "SURF", "libelle": "Surface", "base": "surface_m2"}
      ]'::jsonb;
      v_terminologie := '{
        "centre_cout": "Centre de coût",
        "centre_profit": "Centre de profit",
        "cle_repartition": "Clé de répartition",
        "budget": "Budget annuel"
      }'::jsonb;
      v_seuils := '{
        "ecart_budget_warning": 10,
        "ecart_budget_critical": 20,
        "taux_rentabilite_min": 5
      }'::jsonb;

    WHEN 'CI' THEN -- Côte d'Ivoire
      v_config := jsonb_build_object(
        'nom_pays', 'Côte d''Ivoire',
        'devise_principale', 'XOF',
        'systeme_comptable', 'OHADA'
      );
      v_centres_types := '[
        {"code": "PROD", "libelle": "Production", "type": "principal"},
        {"code": "DIST", "libelle": "Distribution", "type": "principal"},
        {"code": "ADM", "libelle": "Administration", "type": "structure"},
        {"code": "COMM", "libelle": "Commercial", "type": "principal"}
      ]'::jsonb;
      v_cles_repartition := '[
        {"code": "CA", "libelle": "Chiffre d''affaires", "base": "chiffre_affaires"},
        {"code": "UO", "libelle": "Unités œuvre", "base": "quantite"},
        {"code": "MASSE", "libelle": "Masse salariale", "base": "salaires"}
      ]'::jsonb;
      v_terminologie := '{
        "centre_cout": "Centre de coût",
        "centre_profit": "Centre de profit",
        "cle_repartition": "Clé de répartition",
        "budget": "Budget"
      }'::jsonb;
      v_seuils := '{
        "ecart_budget_warning": 10,
        "ecart_budget_critical": 22,
        "taux_rentabilite_min": 5
      }'::jsonb;

    WHEN 'FR' THEN -- France
      v_config := jsonb_build_object(
        'nom_pays', 'France',
        'devise_principale', 'EUR',
        'systeme_comptable', 'PCG'
      );
      v_centres_types := '[
        {"code": "PROD", "libelle": "Centre de production", "type": "principal"},
        {"code": "DIST", "libelle": "Centre de distribution", "type": "principal"},
        {"code": "ADM", "libelle": "Centre administratif", "type": "structure"},
        {"code": "SUPPORT", "libelle": "Centre de support", "type": "auxiliaire"}
      ]'::jsonb;
      v_cles_repartition := '[
        {"code": "CA", "libelle": "Chiffre d''affaires", "base": "chiffre_affaires"},
        {"code": "UO", "libelle": "Unités d''œuvre", "base": "quantite"},
        {"code": "TEMPS", "libelle": "Temps passé", "base": "heures"}
      ]'::jsonb;
      v_terminologie := '{
        "centre_cout": "Centre de coût",
        "centre_profit": "Centre de profit",
        "cle_repartition": "Clé de répartition",
        "budget": "Budget prévisionnel"
      }'::jsonb;
      v_seuils := '{
        "ecart_budget_warning": 8,
        "ecart_budget_critical": 15,
        "taux_rentabilite_min": 7
      }'::jsonb;

    WHEN 'BE' THEN -- Belgique
      v_config := jsonb_build_object(
        'nom_pays', 'Belgique',
        'devise_principale', 'EUR',
        'systeme_comptable', 'PCN Belge'
      );
      v_centres_types := '[
        {"code": "PROD", "libelle": "Centre de production", "type": "principal"},
        {"code": "DIST", "libelle": "Centre de distribution", "type": "principal"},
        {"code": "ADM", "libelle": "Centre administratif", "type": "structure"},
        {"code": "FIN", "libelle": "Centre financier", "type": "auxiliaire"}
      ]'::jsonb;
      v_cles_repartition := '[
        {"code": "CA", "libelle": "Chiffre d''affaires", "base": "chiffre_affaires"},
        {"code": "UO", "libelle": "Unités d''œuvre", "base": "quantite"},
        {"code": "SURF", "libelle": "Surface", "base": "surface_m2"}
      ]'::jsonb;
      v_terminologie := '{
        "centre_cout": "Centre de coût",
        "centre_profit": "Centre de profit",
        "cle_repartition": "Clé de répartition",
        "budget": "Budget"
      }'::jsonb;
      v_seuils := '{
        "ecart_budget_warning": 8,
        "ecart_budget_critical": 15,
        "taux_rentabilite_min": 6
      }'::jsonb;

    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Code pays non supporté');
  END CASE;

  -- Insert parameters
  INSERT INTO public.parametres_comptabilite_analytique_regionale (
    tenant_id,
    code_pays,
    nom_pays,
    devise_principale,
    systeme_comptable,
    centres_types,
    cles_repartition_types,
    terminologie,
    seuils_alertes
  ) VALUES (
    p_tenant_id,
    p_country_code,
    v_config->>'nom_pays',
    v_config->>'devise_principale',
    v_config->>'systeme_comptable',
    v_centres_types,
    v_cles_repartition,
    v_terminologie,
    v_seuils
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Paramètres analytiques initialisés pour %s', v_config->>'nom_pays'),
    'config', jsonb_build_object(
      'pays', v_config->>'nom_pays',
      'devise', v_config->>'devise_principale',
      'systeme', v_config->>'systeme_comptable'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;