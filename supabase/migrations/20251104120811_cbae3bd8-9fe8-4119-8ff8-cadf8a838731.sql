-- Créer la table parametres_regionaux_fiscaux pour la multi-localisation
CREATE TABLE IF NOT EXISTS public.parametres_regionaux_fiscaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  
  -- Localisation
  pays TEXT NOT NULL DEFAULT 'Congo-Brazzaville',
  code_pays TEXT NOT NULL DEFAULT 'CG',
  devise_principale TEXT NOT NULL DEFAULT 'XAF',
  systeme_comptable TEXT NOT NULL DEFAULT 'OHADA',
  
  -- Régime fiscal
  regime_fiscal TEXT NOT NULL DEFAULT 'Normal',
  frequence_declaration_defaut TEXT NOT NULL DEFAULT 'Mensuelle',
  
  -- Taux TVA par défaut
  taux_tva_standard NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  taux_tva_reduits JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Obligations fiscales templates
  obligations_templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Seuils et règles
  seuil_franchise_tva NUMERIC(15,2),
  seuil_regime_simplifie NUMERIC(15,2),
  exoneration_medicaments_essentiels BOOLEAN NOT NULL DEFAULT true,
  
  -- Formats et mentions légales
  format_numero_tva TEXT NOT NULL DEFAULT 'CG-XXXX-XXXXX',
  mention_legale_footer TEXT NOT NULL DEFAULT 'Conforme à la réglementation fiscale de la République du Congo',
  autorite_fiscale TEXT NOT NULL DEFAULT 'Direction Générale des Impôts et des Domaines (DGID)',
  
  -- Délais de déclaration
  jour_echeance_mensuelle INTEGER NOT NULL DEFAULT 15,
  jour_echeance_trimestrielle INTEGER NOT NULL DEFAULT 20,
  mois_cloture_fiscale INTEGER NOT NULL DEFAULT 12,
  
  -- Archivage légal
  duree_conservation_annees INTEGER NOT NULL DEFAULT 10,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_fiscal_params_tenant ON public.parametres_regionaux_fiscaux(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_params_pays ON public.parametres_regionaux_fiscaux(code_pays);

-- Activer RLS
ALTER TABLE public.parametres_regionaux_fiscaux ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view fiscal params from their tenant"
ON public.parametres_regionaux_fiscaux FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can update fiscal params"
ON public.parametres_regionaux_fiscaux FOR UPDATE
USING (
  tenant_id = get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien', 'Comptable')
  )
);

CREATE POLICY "System can insert fiscal params"
ON public.parametres_regionaux_fiscaux FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Trigger pour updated_at
CREATE TRIGGER update_fiscal_params_updated_at
BEFORE UPDATE ON public.parametres_regionaux_fiscaux
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction d'initialisation des paramètres fiscaux par pays
CREATE OR REPLACE FUNCTION public.init_fiscal_params_for_tenant(p_tenant_id UUID, p_country_code TEXT DEFAULT 'CG')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_params_id UUID;
  v_pays TEXT;
  v_code_pays TEXT;
  v_devise TEXT;
  v_systeme TEXT;
  v_regime TEXT;
  v_frequence TEXT;
  v_tva_standard NUMERIC(5,2);
  v_tva_reduits JSONB;
  v_obligations JSONB;
  v_seuil_franchise NUMERIC(15,2);
  v_seuil_simplifie NUMERIC(15,2);
  v_format_numero TEXT;
  v_mention_legale TEXT;
  v_autorite TEXT;
  v_jour_mensuel INTEGER;
  v_jour_trimestriel INTEGER;
  v_conservation INTEGER;
BEGIN
  -- Configuration selon le pays
  CASE p_country_code
    WHEN 'CG' THEN -- Congo-Brazzaville
      v_pays := 'Congo-Brazzaville';
      v_code_pays := 'CG';
      v_devise := 'XAF';
      v_systeme := 'OHADA';
      v_regime := 'Normal';
      v_frequence := 'Mensuelle';
      v_tva_standard := 18.00;
      v_tva_reduits := '[{"nom": "Médicaments essentiels", "taux": 5.0}, {"nom": "Produits de première nécessité", "taux": 0.0}]'::jsonb;
      v_obligations := '[{"type": "Déclaration TVA", "frequence": "Mensuelle", "delai_jours": 15}, {"type": "IS", "frequence": "Annuelle", "delai_jours": 120}]'::jsonb;
      v_seuil_franchise := 50000000;
      v_seuil_simplifie := 150000000;
      v_format_numero := 'CG-XXXX-XXXXX';
      v_mention_legale := 'Conforme à la réglementation fiscale de la République du Congo';
      v_autorite := 'Direction Générale des Impôts et des Domaines (DGID)';
      v_jour_mensuel := 15;
      v_jour_trimestriel := 20;
      v_conservation := 10;
    
    WHEN 'CM' THEN -- Cameroun
      v_pays := 'Cameroun';
      v_code_pays := 'CM';
      v_devise := 'XAF';
      v_systeme := 'OHADA';
      v_regime := 'Normal';
      v_frequence := 'Mensuelle';
      v_tva_standard := 19.25;
      v_tva_reduits := '[{"nom": "Médicaments et équipements médicaux", "taux": 5.5}]'::jsonb;
      v_obligations := '[{"type": "Déclaration TVA", "frequence": "Mensuelle", "delai_jours": 15}, {"type": "IS", "frequence": "Annuelle", "delai_jours": 90}]'::jsonb;
      v_seuil_franchise := 50000000;
      v_seuil_simplifie := 100000000;
      v_format_numero := 'CM-XXXX-XXXXX';
      v_mention_legale := 'Conforme à la réglementation fiscale du Cameroun';
      v_autorite := 'Direction Générale des Impôts (DGI)';
      v_jour_mensuel := 15;
      v_jour_trimestriel := 15;
      v_conservation := 10;
    
    WHEN 'SN' THEN -- Sénégal
      v_pays := 'Sénégal';
      v_code_pays := 'SN';
      v_devise := 'XOF';
      v_systeme := 'OHADA';
      v_regime := 'Normal';
      v_frequence := 'Mensuelle';
      v_tva_standard := 18.00;
      v_tva_reduits := '[{"nom": "Médicaments génériques", "taux": 10.0}]'::jsonb;
      v_obligations := '[{"type": "Déclaration TVA", "frequence": "Mensuelle", "delai_jours": 15}, {"type": "IS", "frequence": "Annuelle", "delai_jours": 60}]'::jsonb;
      v_seuil_franchise := 50000000;
      v_seuil_simplifie := 100000000;
      v_format_numero := 'SN-XXXX-XXXXX';
      v_mention_legale := 'Conforme à la réglementation fiscale de la République du Sénégal';
      v_autorite := 'Direction Générale des Impôts et des Domaines (DGID)';
      v_jour_mensuel := 15;
      v_jour_trimestriel := 20;
      v_conservation := 10;
    
    WHEN 'CI' THEN -- Côte d'Ivoire
      v_pays := 'Côte d''Ivoire';
      v_code_pays := 'CI';
      v_devise := 'XOF';
      v_systeme := 'OHADA';
      v_regime := 'Normal';
      v_frequence := 'Mensuelle';
      v_tva_standard := 18.00;
      v_tva_reduits := '[{"nom": "Produits pharmaceutiques", "taux": 9.0}]'::jsonb;
      v_obligations := '[{"type": "Déclaration TVA", "frequence": "Mensuelle", "delai_jours": 20}, {"type": "BIC", "frequence": "Annuelle", "delai_jours": 90}]'::jsonb;
      v_seuil_franchise := 50000000;
      v_seuil_simplifie := 150000000;
      v_format_numero := 'CI-XXXX-XXXXX';
      v_mention_legale := 'Conforme à la réglementation fiscale de la République de Côte d''Ivoire';
      v_autorite := 'Direction Générale des Impôts (DGI)';
      v_jour_mensuel := 20;
      v_jour_trimestriel := 20;
      v_conservation := 10;
    
    WHEN 'FR' THEN -- France
      v_pays := 'France';
      v_code_pays := 'FR';
      v_devise := 'EUR';
      v_systeme := 'PCG';
      v_regime := 'Normal';
      v_frequence := 'Trimestrielle';
      v_tva_standard := 20.00;
      v_tva_reduits := '[{"nom": "Médicaments remboursés", "taux": 2.1}, {"nom": "Dispositifs médicaux", "taux": 5.5}, {"nom": "Médicaments non remboursés", "taux": 10.0}]'::jsonb;
      v_obligations := '[{"type": "CA3 (TVA)", "frequence": "Trimestrielle", "delai_jours": 19}, {"type": "IS", "frequence": "Annuelle", "delai_jours": 120}]'::jsonb;
      v_seuil_franchise := 85800;
      v_seuil_simplifie := 840000;
      v_format_numero := 'FR XX XXX XXX XXX';
      v_mention_legale := 'Conforme à la législation fiscale française';
      v_autorite := 'Direction Générale des Finances Publiques (DGFiP)';
      v_jour_mensuel := 19;
      v_jour_trimestriel := 19;
      v_conservation := 6;
    
    WHEN 'BE' THEN -- Belgique
      v_pays := 'Belgique';
      v_code_pays := 'BE';
      v_devise := 'EUR';
      v_systeme := 'PCB';
      v_regime := 'Normal';
      v_frequence := 'Trimestrielle';
      v_tva_standard := 21.00;
      v_tva_reduits := '[{"nom": "Médicaments remboursés", "taux": 6.0}, {"nom": "Dispositifs médicaux", "taux": 12.0}]'::jsonb;
      v_obligations := '[{"type": "Déclaration TVA", "frequence": "Trimestrielle", "delai_jours": 20}, {"type": "Impôt des sociétés", "frequence": "Annuelle", "delai_jours": 180}]'::jsonb;
      v_seuil_franchise := 25000;
      v_seuil_simplifie := 1500000;
      v_format_numero := 'BE XXXX XXX XXX';
      v_mention_legale := 'Conforme à la législation fiscale belge';
      v_autorite := 'Service Public Fédéral Finances (SPF)';
      v_jour_mensuel := 20;
      v_jour_trimestriel := 20;
      v_conservation := 7;
    
    ELSE -- Par défaut: Congo-Brazzaville
      v_pays := 'Congo-Brazzaville';
      v_code_pays := 'CG';
      v_devise := 'XAF';
      v_systeme := 'OHADA';
      v_regime := 'Normal';
      v_frequence := 'Mensuelle';
      v_tva_standard := 18.00;
      v_tva_reduits := '[{"nom": "Médicaments essentiels", "taux": 5.0}]'::jsonb;
      v_obligations := '[{"type": "Déclaration TVA", "frequence": "Mensuelle", "delai_jours": 15}]'::jsonb;
      v_seuil_franchise := 50000000;
      v_seuil_simplifie := 150000000;
      v_format_numero := 'CG-XXXX-XXXXX';
      v_mention_legale := 'Conforme à la réglementation fiscale de la République du Congo';
      v_autorite := 'Direction Générale des Impôts et des Domaines (DGID)';
      v_jour_mensuel := 15;
      v_jour_trimestriel := 20;
      v_conservation := 10;
  END CASE;

  -- Insérer ou mettre à jour
  INSERT INTO public.parametres_regionaux_fiscaux (
    tenant_id, pays, code_pays, devise_principale, systeme_comptable,
    regime_fiscal, frequence_declaration_defaut, taux_tva_standard,
    taux_tva_reduits, obligations_templates, seuil_franchise_tva,
    seuil_regime_simplifie, format_numero_tva, mention_legale_footer,
    autorite_fiscale, jour_echeance_mensuelle, jour_echeance_trimestrielle,
    duree_conservation_annees
  ) VALUES (
    p_tenant_id, v_pays, v_code_pays, v_devise, v_systeme,
    v_regime, v_frequence, v_tva_standard, v_tva_reduits,
    v_obligations, v_seuil_franchise, v_seuil_simplifie,
    v_format_numero, v_mention_legale, v_autorite,
    v_jour_mensuel, v_jour_trimestriel, v_conservation
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    pays = EXCLUDED.pays,
    code_pays = EXCLUDED.code_pays,
    devise_principale = EXCLUDED.devise_principale,
    systeme_comptable = EXCLUDED.systeme_comptable,
    regime_fiscal = EXCLUDED.regime_fiscal,
    frequence_declaration_defaut = EXCLUDED.frequence_declaration_defaut,
    taux_tva_standard = EXCLUDED.taux_tva_standard,
    taux_tva_reduits = EXCLUDED.taux_tva_reduits,
    obligations_templates = EXCLUDED.obligations_templates,
    seuil_franchise_tva = EXCLUDED.seuil_franchise_tva,
    seuil_regime_simplifie = EXCLUDED.seuil_regime_simplifie,
    format_numero_tva = EXCLUDED.format_numero_tva,
    mention_legale_footer = EXCLUDED.mention_legale_footer,
    autorite_fiscale = EXCLUDED.autorite_fiscale,
    jour_echeance_mensuelle = EXCLUDED.jour_echeance_mensuelle,
    jour_echeance_trimestrielle = EXCLUDED.jour_echeance_trimestrielle,
    duree_conservation_annees = EXCLUDED.duree_conservation_annees,
    updated_at = now()
  RETURNING id INTO v_params_id;

  RETURN v_params_id;
END;
$$;

-- Initialiser les paramètres pour les tenants existants (utilisation de status='active' au lieu de est_actif=true)
DO $$
DECLARE
  tenant_rec RECORD;
BEGIN
  FOR tenant_rec IN SELECT id FROM public.pharmacies WHERE status = 'active'
  LOOP
    PERFORM public.init_fiscal_params_for_tenant(tenant_rec.id, 'CG');
  END LOOP;
END $$;