-- Create regional payment parameters table
CREATE TABLE IF NOT EXISTS public.parametres_paiements_regionaux (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  pays TEXT NOT NULL,
  code_pays TEXT NOT NULL,
  devise_principale TEXT NOT NULL,
  symbole_devise TEXT NOT NULL,
  
  -- Regional payment methods configuration
  modes_paiement_defaut JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Regional banking parameters
  format_iban TEXT,
  validation_iban_active BOOLEAN DEFAULT false,
  swift_obligatoire BOOLEAN DEFAULT false,
  
  -- Regional fees
  frais_bancaires_standard NUMERIC(10,2) DEFAULT 0,
  frais_mobile_money_pourcentage NUMERIC(5,2) DEFAULT 0,
  frais_carte_pourcentage NUMERIC(5,2) DEFAULT 0,
  
  -- Regional delays
  delai_encaissement_cheque INTEGER DEFAULT 7,
  delai_compensation_virement INTEGER DEFAULT 3,
  
  -- Regulations
  montant_max_especes NUMERIC(12,2),
  plafond_mobile_money NUMERIC(12,2),
  require_kyc_au_dessus NUMERIC(12,2),
  
  -- Reconciliation configuration
  tolerance_rapprochement NUMERIC(10,2) DEFAULT 100,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_payment_params_per_tenant UNIQUE (tenant_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parametres_paiements_tenant_id 
ON public.parametres_paiements_regionaux (tenant_id);

CREATE INDEX IF NOT EXISTS idx_parametres_paiements_code_pays 
ON public.parametres_paiements_regionaux (tenant_id, code_pays);

-- Enable Row Level Security
ALTER TABLE public.parametres_paiements_regionaux ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view payment params from their tenant" 
ON public.parametres_paiements_regionaux 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert payment params in their tenant" 
ON public.parametres_paiements_regionaux 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update payment params from their tenant" 
ON public.parametres_paiements_regionaux 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete payment params from their tenant" 
ON public.parametres_paiements_regionaux 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Create trigger for updated_at
CREATE TRIGGER update_parametres_paiements_regionaux_updated_at
BEFORE UPDATE ON public.parametres_paiements_regionaux
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize payment parameters for tenant
CREATE OR REPLACE FUNCTION public.init_payment_params_for_tenant(
  p_tenant_id UUID,
  p_country_code TEXT DEFAULT 'CG'
)
RETURNS UUID AS $$
DECLARE
  v_params_id UUID;
  v_pays TEXT;
  v_code_pays TEXT;
  v_devise TEXT;
  v_symbole_devise TEXT;
  v_modes_paiement JSONB;
  v_format_iban TEXT;
  v_validation_iban BOOLEAN;
  v_swift_oblig BOOLEAN;
  v_frais_bancaires NUMERIC(10,2);
  v_frais_mobile NUMERIC(5,2);
  v_frais_carte NUMERIC(5,2);
  v_delai_cheque INTEGER;
  v_delai_virement INTEGER;
  v_max_especes NUMERIC(12,2);
  v_plafond_mobile NUMERIC(12,2);
  v_kyc_seuil NUMERIC(12,2);
  v_tolerance NUMERIC(10,2);
BEGIN
  -- Define country templates
  CASE p_country_code
    WHEN 'CG' THEN -- Congo-Brazzaville (DEFAULT)
      v_pays := 'Congo-Brazzaville';
      v_code_pays := 'CG';
      v_devise := 'XAF';
      v_symbole_devise := 'FCFA';
      v_modes_paiement := '[
        {
          "code": "especes",
          "libelle": "Espèces",
          "icone": "banknote",
          "couleur": "#22c55e",
          "est_actif": true,
          "ordre": 1,
          "frais_pourcentage": 0,
          "frais_fixes": 0,
          "montant_max": 500000,
          "exige_reference": false,
          "exige_validation": false
        },
        {
          "code": "airtel_money",
          "libelle": "Airtel Money",
          "icone": "smartphone",
          "couleur": "#ef4444",
          "est_actif": true,
          "ordre": 2,
          "frais_pourcentage": 1.5,
          "frais_fixes": 0,
          "montant_max": 2000000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "mtn_mobile_money",
          "libelle": "MTN Mobile Money",
          "icone": "smartphone",
          "couleur": "#eab308",
          "est_actif": true,
          "ordre": 3,
          "frais_pourcentage": 1.5,
          "frais_fixes": 0,
          "montant_max": 2000000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "carte_bancaire",
          "libelle": "Carte Bancaire",
          "icone": "credit-card",
          "couleur": "#3b82f6",
          "est_actif": true,
          "ordre": 4,
          "frais_pourcentage": 2.5,
          "frais_fixes": 0,
          "exige_reference": false,
          "exige_validation": true
        },
        {
          "code": "virement",
          "libelle": "Virement Bancaire",
          "icone": "refresh-cw",
          "couleur": "#a855f7",
          "est_actif": true,
          "ordre": 5,
          "frais_pourcentage": 0,
          "frais_fixes": 1000,
          "delai_encaissement": 3,
          "exige_reference": true,
          "exige_validation": false
        },
        {
          "code": "cheque",
          "libelle": "Chèque",
          "icone": "file-text",
          "couleur": "#6b7280",
          "est_actif": false,
          "ordre": 6,
          "frais_pourcentage": 0,
          "frais_fixes": 0,
          "delai_encaissement": 7,
          "exige_reference": true,
          "exige_validation": false
        }
      ]'::jsonb;
      v_format_iban := NULL;
      v_validation_iban := false;
      v_swift_oblig := false;
      v_frais_bancaires := 1000;
      v_frais_mobile := 1.5;
      v_frais_carte := 2.5;
      v_delai_cheque := 7;
      v_delai_virement := 3;
      v_max_especes := 500000;
      v_plafond_mobile := 2000000;
      v_kyc_seuil := 1000000;
      v_tolerance := 100;
    
    WHEN 'CM' THEN -- Cameroun
      v_pays := 'Cameroun';
      v_code_pays := 'CM';
      v_devise := 'XAF';
      v_symbole_devise := 'FCFA';
      v_modes_paiement := '[
        {
          "code": "especes",
          "libelle": "Espèces",
          "icone": "banknote",
          "couleur": "#22c55e",
          "est_actif": true,
          "ordre": 1,
          "frais_pourcentage": 0,
          "frais_fixes": 0,
          "montant_max": 500000,
          "exige_reference": false,
          "exige_validation": false
        },
        {
          "code": "orange_money",
          "libelle": "Orange Money",
          "icone": "smartphone",
          "couleur": "#f97316",
          "est_actif": true,
          "ordre": 2,
          "frais_pourcentage": 1.5,
          "frais_fixes": 0,
          "montant_max": 2000000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "mtn_mobile_money",
          "libelle": "MTN Mobile Money",
          "icone": "smartphone",
          "couleur": "#eab308",
          "est_actif": true,
          "ordre": 3,
          "frais_pourcentage": 1.5,
          "frais_fixes": 0,
          "montant_max": 2000000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "carte_bancaire",
          "libelle": "Carte Bancaire",
          "icone": "credit-card",
          "couleur": "#3b82f6",
          "est_actif": true,
          "ordre": 4,
          "frais_pourcentage": 2.5,
          "frais_fixes": 0,
          "exige_validation": true
        },
        {
          "code": "virement",
          "libelle": "Virement Bancaire",
          "icone": "refresh-cw",
          "couleur": "#a855f7",
          "est_actif": true,
          "ordre": 5,
          "frais_fixes": 1000,
          "delai_encaissement": 3,
          "exige_reference": true
        }
      ]'::jsonb;
      v_format_iban := 'CM\\d{27}';
      v_validation_iban := false;
      v_swift_oblig := false;
      v_frais_bancaires := 1000;
      v_frais_mobile := 1.5;
      v_frais_carte := 2.5;
      v_delai_cheque := 7;
      v_delai_virement := 3;
      v_max_especes := 500000;
      v_plafond_mobile := 2000000;
      v_kyc_seuil := 1000000;
      v_tolerance := 100;
    
    WHEN 'SN' THEN -- Sénégal
      v_pays := 'Sénégal';
      v_code_pays := 'SN';
      v_devise := 'XOF';
      v_symbole_devise := 'FCFA';
      v_modes_paiement := '[
        {
          "code": "especes",
          "libelle": "Espèces",
          "icone": "banknote",
          "couleur": "#22c55e",
          "est_actif": true,
          "ordre": 1,
          "montant_max": 500000
        },
        {
          "code": "wave",
          "libelle": "Wave",
          "icone": "smartphone",
          "couleur": "#06b6d4",
          "est_actif": true,
          "ordre": 2,
          "frais_pourcentage": 1.0,
          "montant_max": 2000000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "orange_money",
          "libelle": "Orange Money",
          "icone": "smartphone",
          "couleur": "#f97316",
          "est_actif": true,
          "ordre": 3,
          "frais_pourcentage": 1.5,
          "montant_max": 2000000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "free_money",
          "libelle": "Free Money",
          "icone": "smartphone",
          "couleur": "#dc2626",
          "est_actif": true,
          "ordre": 4,
          "frais_pourcentage": 1.5,
          "montant_max": 1500000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "carte_bancaire",
          "libelle": "Carte Bancaire",
          "icone": "credit-card",
          "couleur": "#3b82f6",
          "est_actif": true,
          "ordre": 5,
          "frais_pourcentage": 2.5,
          "exige_validation": true
        },
        {
          "code": "virement",
          "libelle": "Virement Bancaire",
          "icone": "refresh-cw",
          "couleur": "#a855f7",
          "est_actif": true,
          "ordre": 6,
          "frais_fixes": 1000,
          "delai_encaissement": 2,
          "exige_reference": true
        }
      ]'::jsonb;
      v_format_iban := 'SN\\d{28}';
      v_validation_iban := false;
      v_swift_oblig := false;
      v_frais_bancaires := 1000;
      v_frais_mobile := 1.5;
      v_frais_carte := 2.5;
      v_delai_cheque := 5;
      v_delai_virement := 2;
      v_max_especes := 500000;
      v_plafond_mobile := 2000000;
      v_kyc_seuil := 1000000;
      v_tolerance := 100;
    
    WHEN 'CI' THEN -- Côte d'Ivoire
      v_pays := 'Côte d''Ivoire';
      v_code_pays := 'CI';
      v_devise := 'XOF';
      v_symbole_devise := 'FCFA';
      v_modes_paiement := '[
        {
          "code": "especes",
          "libelle": "Espèces",
          "icone": "banknote",
          "couleur": "#22c55e",
          "est_actif": true,
          "ordre": 1,
          "montant_max": 500000
        },
        {
          "code": "mtn_mobile_money",
          "libelle": "MTN Mobile Money",
          "icone": "smartphone",
          "couleur": "#eab308",
          "est_actif": true,
          "ordre": 2,
          "frais_pourcentage": 1.5,
          "montant_max": 2000000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "orange_money",
          "libelle": "Orange Money",
          "icone": "smartphone",
          "couleur": "#f97316",
          "est_actif": true,
          "ordre": 3,
          "frais_pourcentage": 1.5,
          "montant_max": 2000000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "moov_money",
          "libelle": "Moov Money",
          "icone": "smartphone",
          "couleur": "#0ea5e9",
          "est_actif": true,
          "ordre": 4,
          "frais_pourcentage": 1.5,
          "montant_max": 1500000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "carte_bancaire",
          "libelle": "Carte Bancaire",
          "icone": "credit-card",
          "couleur": "#3b82f6",
          "est_actif": true,
          "ordre": 5,
          "frais_pourcentage": 2.5,
          "exige_validation": true
        },
        {
          "code": "virement",
          "libelle": "Virement Bancaire",
          "icone": "refresh-cw",
          "couleur": "#a855f7",
          "est_actif": true,
          "ordre": 6,
          "frais_fixes": 1000,
          "delai_encaissement": 3,
          "exige_reference": true
        }
      ]'::jsonb;
      v_format_iban := 'CI\\d{28}';
      v_validation_iban := false;
      v_swift_oblig := false;
      v_frais_bancaires := 1000;
      v_frais_mobile := 1.5;
      v_frais_carte := 2.5;
      v_delai_cheque := 7;
      v_delai_virement := 3;
      v_max_especes := 500000;
      v_plafond_mobile := 2000000;
      v_kyc_seuil := 1000000;
      v_tolerance := 100;
    
    WHEN 'FR' THEN -- France
      v_pays := 'France';
      v_code_pays := 'FR';
      v_devise := 'EUR';
      v_symbole_devise := '€';
      v_modes_paiement := '[
        {
          "code": "especes",
          "libelle": "Espèces",
          "icone": "banknote",
          "couleur": "#22c55e",
          "est_actif": true,
          "ordre": 1,
          "frais_pourcentage": 0,
          "frais_fixes": 0,
          "montant_max": 1000,
          "exige_reference": false,
          "exige_validation": false
        },
        {
          "code": "carte_bancaire",
          "libelle": "Carte Bancaire",
          "icone": "credit-card",
          "couleur": "#3b82f6",
          "est_actif": true,
          "ordre": 2,
          "frais_pourcentage": 0.5,
          "frais_fixes": 0,
          "exige_reference": false,
          "exige_validation": true
        },
        {
          "code": "virement_sepa",
          "libelle": "Virement SEPA",
          "icone": "refresh-cw",
          "couleur": "#a855f7",
          "est_actif": true,
          "ordre": 3,
          "frais_pourcentage": 0,
          "frais_fixes": 0,
          "delai_encaissement": 1,
          "exige_reference": true,
          "exige_validation": false
        },
        {
          "code": "cheque",
          "libelle": "Chèque",
          "icone": "file-text",
          "couleur": "#6b7280",
          "est_actif": true,
          "ordre": 4,
          "frais_pourcentage": 0,
          "frais_fixes": 0,
          "delai_encaissement": 2,
          "exige_reference": true,
          "exige_validation": false
        },
        {
          "code": "prelevement",
          "libelle": "Prélèvement automatique",
          "icone": "repeat",
          "couleur": "#8b5cf6",
          "est_actif": true,
          "ordre": 5,
          "frais_pourcentage": 0,
          "frais_fixes": 0,
          "exige_reference": true,
          "exige_validation": false
        }
      ]'::jsonb;
      v_format_iban := 'FR\\d{2}[0-9A-Z]{23}';
      v_validation_iban := true;
      v_swift_oblig := true;
      v_frais_bancaires := 0;
      v_frais_mobile := 0;
      v_frais_carte := 0.5;
      v_delai_cheque := 2;
      v_delai_virement := 1;
      v_max_especes := 1000;
      v_plafond_mobile := NULL;
      v_kyc_seuil := 10000;
      v_tolerance := 0.01;
    
    WHEN 'BE' THEN -- Belgique
      v_pays := 'Belgique';
      v_code_pays := 'BE';
      v_devise := 'EUR';
      v_symbole_devise := '€';
      v_modes_paiement := '[
        {
          "code": "especes",
          "libelle": "Espèces",
          "icone": "banknote",
          "couleur": "#22c55e",
          "est_actif": true,
          "ordre": 1,
          "montant_max": 3000
        },
        {
          "code": "bancontact",
          "libelle": "Bancontact",
          "icone": "credit-card",
          "couleur": "#0ea5e9",
          "est_actif": true,
          "ordre": 2,
          "frais_pourcentage": 0.3,
          "exige_validation": true
        },
        {
          "code": "carte_bancaire",
          "libelle": "Carte Bancaire",
          "icone": "credit-card",
          "couleur": "#3b82f6",
          "est_actif": true,
          "ordre": 3,
          "frais_pourcentage": 0.5,
          "exige_validation": true
        },
        {
          "code": "virement_sepa",
          "libelle": "Virement SEPA",
          "icone": "refresh-cw",
          "couleur": "#a855f7",
          "est_actif": true,
          "ordre": 4,
          "frais_fixes": 0,
          "delai_encaissement": 1,
          "exige_reference": true
        },
        {
          "code": "domiciliation",
          "libelle": "Domiciliation bancaire",
          "icone": "repeat",
          "couleur": "#8b5cf6",
          "est_actif": true,
          "ordre": 5,
          "exige_reference": true
        }
      ]'::jsonb;
      v_format_iban := 'BE\\d{14}';
      v_validation_iban := true;
      v_swift_oblig := true;
      v_frais_bancaires := 0;
      v_frais_mobile := 0;
      v_frais_carte := 0.5;
      v_delai_cheque := 2;
      v_delai_virement := 1;
      v_max_especes := 3000;
      v_plafond_mobile := NULL;
      v_kyc_seuil := 10000;
      v_tolerance := 0.01;
    
    ELSE -- Default to Congo-Brazzaville
      v_pays := 'Congo-Brazzaville';
      v_code_pays := 'CG';
      v_devise := 'XAF';
      v_symbole_devise := 'FCFA';
      v_modes_paiement := '[
        {
          "code": "especes",
          "libelle": "Espèces",
          "icone": "banknote",
          "couleur": "#22c55e",
          "est_actif": true,
          "ordre": 1,
          "montant_max": 500000
        },
        {
          "code": "airtel_money",
          "libelle": "Airtel Money",
          "icone": "smartphone",
          "couleur": "#ef4444",
          "est_actif": true,
          "ordre": 2,
          "frais_pourcentage": 1.5,
          "montant_max": 2000000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "mtn_mobile_money",
          "libelle": "MTN Mobile Money",
          "icone": "smartphone",
          "couleur": "#eab308",
          "est_actif": true,
          "ordre": 3,
          "frais_pourcentage": 1.5,
          "montant_max": 2000000,
          "exige_reference": true,
          "exige_validation": true
        },
        {
          "code": "carte_bancaire",
          "libelle": "Carte Bancaire",
          "icone": "credit-card",
          "couleur": "#3b82f6",
          "est_actif": true,
          "ordre": 4,
          "frais_pourcentage": 2.5,
          "exige_validation": true
        },
        {
          "code": "virement",
          "libelle": "Virement Bancaire",
          "icone": "refresh-cw",
          "couleur": "#a855f7",
          "est_actif": true,
          "ordre": 5,
          "frais_fixes": 1000,
          "delai_encaissement": 3,
          "exige_reference": true
        }
      ]'::jsonb;
      v_format_iban := NULL;
      v_validation_iban := false;
      v_swift_oblig := false;
      v_frais_bancaires := 1000;
      v_frais_mobile := 1.5;
      v_frais_carte := 2.5;
      v_delai_cheque := 7;
      v_delai_virement := 3;
      v_max_especes := 500000;
      v_plafond_mobile := 2000000;
      v_kyc_seuil := 1000000;
      v_tolerance := 100;
  END CASE;

  -- Insert or update payment parameters
  INSERT INTO public.parametres_paiements_regionaux (
    tenant_id,
    pays,
    code_pays,
    devise_principale,
    symbole_devise,
    modes_paiement_defaut,
    format_iban,
    validation_iban_active,
    swift_obligatoire,
    frais_bancaires_standard,
    frais_mobile_money_pourcentage,
    frais_carte_pourcentage,
    delai_encaissement_cheque,
    delai_compensation_virement,
    montant_max_especes,
    plafond_mobile_money,
    require_kyc_au_dessus,
    tolerance_rapprochement
  ) VALUES (
    p_tenant_id,
    v_pays,
    v_code_pays,
    v_devise,
    v_symbole_devise,
    v_modes_paiement,
    v_format_iban,
    v_validation_iban,
    v_swift_oblig,
    v_frais_bancaires,
    v_frais_mobile,
    v_frais_carte,
    v_delai_cheque,
    v_delai_virement,
    v_max_especes,
    v_plafond_mobile,
    v_kyc_seuil,
    v_tolerance
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    pays = EXCLUDED.pays,
    code_pays = EXCLUDED.code_pays,
    devise_principale = EXCLUDED.devise_principale,
    symbole_devise = EXCLUDED.symbole_devise,
    modes_paiement_defaut = EXCLUDED.modes_paiement_defaut,
    format_iban = EXCLUDED.format_iban,
    validation_iban_active = EXCLUDED.validation_iban_active,
    swift_obligatoire = EXCLUDED.swift_obligatoire,
    frais_bancaires_standard = EXCLUDED.frais_bancaires_standard,
    frais_mobile_money_pourcentage = EXCLUDED.frais_mobile_money_pourcentage,
    frais_carte_pourcentage = EXCLUDED.frais_carte_pourcentage,
    delai_encaissement_cheque = EXCLUDED.delai_encaissement_cheque,
    delai_compensation_virement = EXCLUDED.delai_compensation_virement,
    montant_max_especes = EXCLUDED.montant_max_especes,
    plafond_mobile_money = EXCLUDED.plafond_mobile_money,
    require_kyc_au_dessus = EXCLUDED.require_kyc_au_dessus,
    tolerance_rapprochement = EXCLUDED.tolerance_rapprochement,
    updated_at = now()
  RETURNING id INTO v_params_id;

  RETURN v_params_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Initialize payment parameters for existing tenants (Congo-Brazzaville by default)
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT DISTINCT id FROM public.pharmacies WHERE status = 'active'
  LOOP
    PERFORM public.init_payment_params_for_tenant(tenant_record.id, 'CG');
  END LOOP;
END $$;