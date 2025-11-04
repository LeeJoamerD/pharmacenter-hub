-- Create parametres_regionaux_bancaires table for multi-country banking configuration
CREATE TABLE public.parametres_regionaux_bancaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  pays TEXT NOT NULL DEFAULT 'Congo-Brazzaville',
  code_pays TEXT NOT NULL DEFAULT 'CG',
  devise_principale TEXT NOT NULL DEFAULT 'XAF',
  format_rib TEXT NOT NULL DEFAULT '23_digits',
  longueur_rib INTEGER NOT NULL DEFAULT 23,
  format_iban TEXT,
  banque_centrale TEXT NOT NULL DEFAULT 'BEAC',
  format_import_defaut TEXT NOT NULL DEFAULT 'CSV_BEAC',
  liste_banques JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_regex_rib TEXT,
  validation_regex_iban TEXT,
  mention_legale_footer TEXT NOT NULL DEFAULT 'Conforme aux normes BEAC - République du Congo',
  seuil_alerte_bas NUMERIC(15,2) NOT NULL DEFAULT 500000,
  seuil_alerte_critique NUMERIC(15,2) NOT NULL DEFAULT 100000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parametres_regionaux_bancaires ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view banking params from their tenant"
ON public.parametres_regionaux_bancaires
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert banking params in their tenant"
ON public.parametres_regionaux_bancaires
FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update banking params from their tenant"
ON public.parametres_regionaux_bancaires
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete banking params from their tenant"
ON public.parametres_regionaux_bancaires
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create updated_at trigger
CREATE TRIGGER update_parametres_regionaux_bancaires_updated_at
  BEFORE UPDATE ON public.parametres_regionaux_bancaires
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index
CREATE INDEX idx_parametres_regionaux_bancaires_tenant ON public.parametres_regionaux_bancaires(tenant_id);

-- Create initialization function for banking regional parameters
CREATE OR REPLACE FUNCTION public.init_banking_params_for_tenant(
  p_tenant_id UUID,
  p_country_code TEXT DEFAULT 'CG'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_params_id UUID;
  v_pays TEXT;
  v_code_pays TEXT;
  v_devise TEXT;
  v_format_rib TEXT;
  v_longueur_rib INTEGER;
  v_format_iban TEXT;
  v_banque_centrale TEXT;
  v_format_import TEXT;
  v_liste_banques JSONB;
  v_regex_rib TEXT;
  v_regex_iban TEXT;
  v_mention_legale TEXT;
BEGIN
  -- Define country templates
  CASE p_country_code
    WHEN 'CG' THEN -- Congo-Brazzaville
      v_pays := 'Congo-Brazzaville';
      v_code_pays := 'CG';
      v_devise := 'XAF';
      v_format_rib := '23_digits';
      v_longueur_rib := 23;
      v_format_iban := 'CG + 25 digits';
      v_banque_centrale := 'BEAC';
      v_format_import := 'CSV_BEAC';
      v_liste_banques := '[
        {"code": "10001", "name": "UBA CONGO"},
        {"code": "10002", "name": "BGFI BANK CONGO"},
        {"code": "10003", "name": "ECOBANK CONGO"},
        {"code": "10004", "name": "LA POSTE FINANCIERE"},
        {"code": "10005", "name": "MUCODEC"},
        {"code": "10006", "name": "CRÉDIT DU CONGO"}
      ]'::jsonb;
      v_regex_rib := '^\d{23}$';
      v_regex_iban := '^CG\d{25}$';
      v_mention_legale := 'Conforme aux normes BEAC - République du Congo';
    
    WHEN 'CM' THEN -- Cameroon
      v_pays := 'Cameroun';
      v_code_pays := 'CM';
      v_devise := 'XAF';
      v_format_rib := '23_digits';
      v_longueur_rib := 23;
      v_format_iban := 'CM + 27 digits';
      v_banque_centrale := 'BEAC';
      v_format_import := 'CSV_BEAC';
      v_liste_banques := '[
        {"code": "10010", "name": "AFRILAND FIRST BANK"},
        {"code": "10011", "name": "SGBC"},
        {"code": "10012", "name": "BICEC"},
        {"code": "10013", "name": "UBA CAMEROUN"},
        {"code": "10014", "name": "ECOBANK CAMEROUN"}
      ]'::jsonb;
      v_regex_rib := '^\d{23}$';
      v_regex_iban := '^CM\d{27}$';
      v_mention_legale := 'Conforme aux normes BEAC - République du Cameroun';
    
    WHEN 'SN' THEN -- Senegal
      v_pays := 'Sénégal';
      v_code_pays := 'SN';
      v_devise := 'XOF';
      v_format_rib := '24_digits';
      v_longueur_rib := 24;
      v_format_iban := 'SN + 28 digits';
      v_banque_centrale := 'BCEAO';
      v_format_import := 'CSV_BCEAO';
      v_liste_banques := '[
        {"code": "01001", "name": "BHS"},
        {"code": "01002", "name": "CBAO"},
        {"code": "01003", "name": "SGBS"},
        {"code": "01004", "name": "BICIS"},
        {"code": "01005", "name": "UBA SÉNÉGAL"}
      ]'::jsonb;
      v_regex_rib := '^\d{24}$';
      v_regex_iban := '^SN\d{28}$';
      v_mention_legale := 'Conforme aux normes BCEAO - République du Sénégal';
    
    WHEN 'CI' THEN -- Ivory Coast
      v_pays := 'Côte d''Ivoire';
      v_code_pays := 'CI';
      v_devise := 'XOF';
      v_format_rib := '24_digits';
      v_longueur_rib := 24;
      v_format_iban := 'CI + 28 digits';
      v_banque_centrale := 'BCEAO';
      v_format_import := 'CSV_BCEAO';
      v_liste_banques := '[
        {"code": "01101", "name": "SGBCI"},
        {"code": "01102", "name": "BICICI"},
        {"code": "01103", "name": "SIB"},
        {"code": "01104", "name": "UBA CÔTE D''IVOIRE"},
        {"code": "01105", "name": "ECOBANK CI"}
      ]'::jsonb;
      v_regex_rib := '^\d{24}$';
      v_regex_iban := '^CI\d{28}$';
      v_mention_legale := 'Conforme aux normes BCEAO - République de Côte d''Ivoire';
    
    WHEN 'FR' THEN -- France
      v_pays := 'France';
      v_code_pays := 'FR';
      v_devise := 'EUR';
      v_format_rib := 'IBAN';
      v_longueur_rib := NULL;
      v_format_iban := 'FR + 27 characters';
      v_banque_centrale := 'BCE';
      v_format_import := 'SEPA_XML';
      v_liste_banques := '[
        {"code": "30003", "name": "Crédit Agricole"},
        {"code": "30004", "name": "BNP Paribas"},
        {"code": "30066", "name": "Société Générale"},
        {"code": "10278", "name": "La Banque Postale"},
        {"code": "16598", "name": "Crédit Mutuel"}
      ]'::jsonb;
      v_regex_rib := NULL;
      v_regex_iban := '^FR\d{2}[0-9A-Z]{23}$';
      v_mention_legale := 'Conforme aux normes SEPA - République Française';
    
    WHEN 'BE' THEN -- Belgium
      v_pays := 'Belgique';
      v_code_pays := 'BE';
      v_devise := 'EUR';
      v_format_rib := 'IBAN';
      v_longueur_rib := NULL;
      v_format_iban := 'BE + 16 digits';
      v_banque_centrale := 'BCE';
      v_format_import := 'CODA';
      v_liste_banques := '[
        {"code": "001", "name": "BNP Paribas Fortis"},
        {"code": "002", "name": "KBC Bank"},
        {"code": "003", "name": "ING Belgium"},
        {"code": "004", "name": "Belfius"},
        {"code": "005", "name": "Argenta"}
      ]'::jsonb;
      v_regex_rib := NULL;
      v_regex_iban := '^BE\d{14}$';
      v_mention_legale := 'Conforme aux normes SEPA - Royaume de Belgique';
    
    ELSE -- Default to Congo-Brazzaville
      v_pays := 'Congo-Brazzaville';
      v_code_pays := 'CG';
      v_devise := 'XAF';
      v_format_rib := '23_digits';
      v_longueur_rib := 23;
      v_format_iban := 'CG + 25 digits';
      v_banque_centrale := 'BEAC';
      v_format_import := 'CSV_BEAC';
      v_liste_banques := '[
        {"code": "10001", "name": "UBA CONGO"},
        {"code": "10002", "name": "BGFI BANK CONGO"},
        {"code": "10003", "name": "ECOBANK CONGO"},
        {"code": "10004", "name": "LA POSTE FINANCIERE"},
        {"code": "10005", "name": "MUCODEC"},
        {"code": "10006", "name": "CRÉDIT DU CONGO"}
      ]'::jsonb;
      v_regex_rib := '^\d{23}$';
      v_regex_iban := '^CG\d{25}$';
      v_mention_legale := 'Conforme aux normes BEAC - République du Congo';
  END CASE;

  -- Insert or update regional params
  INSERT INTO public.parametres_regionaux_bancaires (
    tenant_id,
    pays,
    code_pays,
    devise_principale,
    format_rib,
    longueur_rib,
    format_iban,
    banque_centrale,
    format_import_defaut,
    liste_banques,
    validation_regex_rib,
    validation_regex_iban,
    mention_legale_footer
  ) VALUES (
    p_tenant_id,
    v_pays,
    v_code_pays,
    v_devise,
    v_format_rib,
    v_longueur_rib,
    v_format_iban,
    v_banque_centrale,
    v_format_import,
    v_liste_banques,
    v_regex_rib,
    v_regex_iban,
    v_mention_legale
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    pays = EXCLUDED.pays,
    code_pays = EXCLUDED.code_pays,
    devise_principale = EXCLUDED.devise_principale,
    format_rib = EXCLUDED.format_rib,
    longueur_rib = EXCLUDED.longueur_rib,
    format_iban = EXCLUDED.format_iban,
    banque_centrale = EXCLUDED.banque_centrale,
    format_import_defaut = EXCLUDED.format_import_defaut,
    liste_banques = EXCLUDED.liste_banques,
    validation_regex_rib = EXCLUDED.validation_regex_rib,
    validation_regex_iban = EXCLUDED.validation_regex_iban,
    mention_legale_footer = EXCLUDED.mention_legale_footer,
    updated_at = now()
  RETURNING id INTO v_params_id;

  RETURN v_params_id;
END;
$$;

-- Initialize banking params for existing tenants with Congo-Brazzaville default
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM public.pharmacies WHERE status = 'active'
  LOOP
    PERFORM public.init_banking_params_for_tenant(tenant_record.id, 'CG');
  END LOOP;
END $$;