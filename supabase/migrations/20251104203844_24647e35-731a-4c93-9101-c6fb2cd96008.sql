-- Migration: Système Multi-Localisation Journalisation
-- Phase 1: Création table + Templates 6 pays (Congo par défaut) + RLS

-- 1. Création table parametres_journalisation_regionaux
CREATE TABLE public.parametres_journalisation_regionaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  code_pays VARCHAR(2) NOT NULL CHECK (code_pays IN ('CG', 'CM', 'SN', 'CI', 'FR', 'BE')),
  pays VARCHAR(100) NOT NULL,
  devise_principale VARCHAR(10) NOT NULL,
  symbole_devise VARCHAR(10) NOT NULL,
  
  -- Formats de numérotation par type de journal
  format_numero_vente VARCHAR(50) NOT NULL,
  format_numero_achat VARCHAR(50) NOT NULL,
  format_numero_caisse VARCHAR(50) NOT NULL,
  format_numero_banque VARCHAR(50) NOT NULL,
  format_numero_od VARCHAR(50) NOT NULL,
  longueur_numero INTEGER DEFAULT 4 CHECK (longueur_numero BETWEEN 3 AND 6),
  
  -- Formats d'affichage
  format_date VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  separateur_milliers VARCHAR(1) DEFAULT ' ',
  separateur_decimal VARCHAR(1) DEFAULT ',',
  position_symbole_devise VARCHAR(10) DEFAULT 'after' CHECK (position_symbole_devise IN ('before', 'after')),
  
  -- Règles métier
  equilibre_obligatoire BOOLEAN DEFAULT true,
  validation_automatique BOOLEAN DEFAULT false,
  verrouillage_auto_fin_mois BOOLEAN DEFAULT false,
  conservation_brouillons_jours INTEGER DEFAULT 90,
  
  -- Mentions légales
  mentions_legales_ecritures TEXT,
  reference_obligatoire BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT parametres_journal_unique_tenant_country UNIQUE(tenant_id, code_pays)
);

-- 2. Commentaire table
COMMENT ON TABLE public.parametres_journalisation_regionaux IS 'Paramètres régionaux pour la journalisation comptable par pays';

-- 3. Enable Row Level Security
ALTER TABLE public.parametres_journalisation_regionaux ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view journal params from their tenant"
ON public.parametres_journalisation_regionaux FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.personnel 
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert journal params in their tenant"
ON public.parametres_journalisation_regionaux FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT p.tenant_id FROM public.personnel p
    WHERE p.auth_user_id = auth.uid() 
    AND p.role IN ('Admin', 'Pharmacien')
  )
);

CREATE POLICY "Admins can update journal params in their tenant"
ON public.parametres_journalisation_regionaux FOR UPDATE
USING (
  tenant_id IN (
    SELECT p.tenant_id FROM public.personnel p
    WHERE p.auth_user_id = auth.uid() 
    AND p.role IN ('Admin', 'Pharmacien')
  )
);

CREATE POLICY "Admins can delete journal params in their tenant"
ON public.parametres_journalisation_regionaux FOR DELETE
USING (
  tenant_id IN (
    SELECT p.tenant_id FROM public.personnel p
    WHERE p.auth_user_id = auth.uid() 
    AND p.role IN ('Admin', 'Pharmacien')
  )
);

-- 5. Indexes pour performance
CREATE INDEX idx_journal_params_tenant ON public.parametres_journalisation_regionaux(tenant_id);
CREATE INDEX idx_journal_params_country ON public.parametres_journalisation_regionaux(code_pays);

-- 6. Trigger updated_at
CREATE TRIGGER trg_update_journal_params_updated_at
BEFORE UPDATE ON public.parametres_journalisation_regionaux
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Fonction RPC pour initialiser les paramètres d'un tenant
CREATE OR REPLACE FUNCTION public.init_journal_params_for_tenant(
  p_tenant_id UUID,
  p_country_code VARCHAR(2) DEFAULT 'CG'
)
RETURNS VOID AS $$
DECLARE
  v_code_pays VARCHAR(2);
  v_pays VARCHAR(100);
  v_devise VARCHAR(10);
  v_symbole VARCHAR(10);
  v_fmt_vente VARCHAR(50);
  v_fmt_achat VARCHAR(50);
  v_fmt_caisse VARCHAR(50);
  v_fmt_banque VARCHAR(50);
  v_fmt_od VARCHAR(50);
  v_longueur INTEGER;
  v_format_date VARCHAR(20);
  v_sep_milliers VARCHAR(1);
  v_sep_decimal VARCHAR(1);
  v_pos_devise VARCHAR(10);
  v_equilibre BOOLEAN;
  v_validation_auto BOOLEAN;
  v_verrouillage BOOLEAN;
  v_conservation INTEGER;
  v_mentions TEXT;
  v_ref_obligatoire BOOLEAN;
BEGIN
  -- Templates par pays
  CASE p_country_code
    WHEN 'CG' THEN
      v_code_pays := 'CG';
      v_pays := 'Congo-Brazzaville';
      v_devise := 'XAF';
      v_symbole := 'FCFA';
      v_fmt_vente := 'VTE-{YEAR}-{NUMBER:04d}';
      v_fmt_achat := 'ACH-{YEAR}-{NUMBER:04d}';
      v_fmt_caisse := 'CAI-{YEAR}-{NUMBER:04d}';
      v_fmt_banque := 'BQ-{YEAR}-{NUMBER:04d}';
      v_fmt_od := 'OD-{YEAR}-{NUMBER:04d}';
      v_longueur := 4;
      v_format_date := 'DD/MM/YYYY';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_pos_devise := 'after';
      v_equilibre := true;
      v_validation_auto := false;
      v_verrouillage := false;
      v_conservation := 90;
      v_mentions := 'Écritures comptables conformes au plan OHADA.
Conservation obligatoire 10 ans.
Modification interdite après verrouillage.';
      v_ref_obligatoire := false;
      
    WHEN 'CM' THEN
      v_code_pays := 'CM';
      v_pays := 'Cameroun';
      v_devise := 'XAF';
      v_symbole := 'FCFA';
      v_fmt_vente := 'JV-{NUMBER:03d}/{YEAR}';
      v_fmt_achat := 'JA-{NUMBER:03d}/{YEAR}';
      v_fmt_caisse := 'JC-{NUMBER:03d}/{YEAR}';
      v_fmt_banque := 'JB-{NUMBER:03d}/{YEAR}';
      v_fmt_od := 'OD-{NUMBER:03d}/{YEAR}';
      v_longueur := 3;
      v_format_date := 'DD/MM/YYYY';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_pos_devise := 'after';
      v_equilibre := true;
      v_validation_auto := false;
      v_verrouillage := false;
      v_conservation := 90;
      v_mentions := 'Écritures selon normes CEMAC.
Archivage 10 ans obligatoire.';
      v_ref_obligatoire := false;
      
    WHEN 'SN' THEN
      v_code_pays := 'SN';
      v_pays := 'Sénégal';
      v_devise := 'XOF';
      v_symbole := 'FCFA';
      v_fmt_vente := 'VT{YEAR}{MONTH}-{NUMBER:04d}';
      v_fmt_achat := 'AC{YEAR}{MONTH}-{NUMBER:04d}';
      v_fmt_caisse := 'CS{YEAR}{MONTH}-{NUMBER:04d}';
      v_fmt_banque := 'BQ{YEAR}{MONTH}-{NUMBER:04d}';
      v_fmt_od := 'OD{YEAR}{MONTH}-{NUMBER:04d}';
      v_longueur := 4;
      v_format_date := 'DD/MM/YYYY';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_pos_devise := 'after';
      v_equilibre := true;
      v_validation_auto := false;
      v_verrouillage := false;
      v_conservation := 90;
      v_mentions := 'Écritures conformes SYSCOHADA révisé.
NINEA requis.';
      v_ref_obligatoire := true;
      
    WHEN 'CI' THEN
      v_code_pays := 'CI';
      v_pays := 'Côte d''Ivoire';
      v_devise := 'XOF';
      v_symbole := 'FCFA';
      v_fmt_vente := 'VTE-{YEAR}-{NUMBER:05d}';
      v_fmt_achat := 'ACH-{YEAR}-{NUMBER:05d}';
      v_fmt_caisse := 'CAI-{YEAR}-{NUMBER:05d}';
      v_fmt_banque := 'BQ-{YEAR}-{NUMBER:05d}';
      v_fmt_od := 'OD-{YEAR}-{NUMBER:05d}';
      v_longueur := 5;
      v_format_date := 'DD/MM/YYYY';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_pos_devise := 'after';
      v_equilibre := true;
      v_validation_auto := false;
      v_verrouillage := true;
      v_conservation := 90;
      v_mentions := 'Écritures traçables DGI e-Compta.
Validation mensuelle obligatoire.';
      v_ref_obligatoire := false;
      
    WHEN 'FR' THEN
      v_code_pays := 'FR';
      v_pays := 'France';
      v_devise := 'EUR';
      v_symbole := '€';
      v_fmt_vente := 'V-{YEAR}{MONTH}-{NUMBER:05d}';
      v_fmt_achat := 'A-{YEAR}{MONTH}-{NUMBER:05d}';
      v_fmt_caisse := 'C-{YEAR}{MONTH}-{NUMBER:05d}';
      v_fmt_banque := 'B-{YEAR}{MONTH}-{NUMBER:05d}';
      v_fmt_od := 'OD-{YEAR}{MONTH}-{NUMBER:05d}';
      v_longueur := 5;
      v_format_date := 'DD/MM/YYYY';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_pos_devise := 'after';
      v_equilibre := true;
      v_validation_auto := false;
      v_verrouillage := true;
      v_conservation := 30;
      v_mentions := 'Écritures conformes PCG.
Fichier des Écritures Comptables (FEC) requis.
Immutabilité après validation (art. L123-22).
Archivage 10 ans.';
      v_ref_obligatoire := true;
      
    WHEN 'BE' THEN
      v_code_pays := 'BE';
      v_pays := 'Belgique';
      v_devise := 'EUR';
      v_symbole := '€';
      v_fmt_vente := 'VTE/{YEAR}/{NUMBER:04d}';
      v_fmt_achat := 'ACH/{YEAR}/{NUMBER:04d}';
      v_fmt_caisse := 'CAI/{YEAR}/{NUMBER:04d}';
      v_fmt_banque := 'BQ/{YEAR}/{NUMBER:04d}';
      v_fmt_od := 'OD/{YEAR}/{NUMBER:04d}';
      v_longueur := 4;
      v_format_date := 'DD/MM/YYYY';
      v_sep_milliers := '.';
      v_sep_decimal := ',';
      v_pos_devise := 'after';
      v_equilibre := true;
      v_validation_auto := false;
      v_verrouillage := true;
      v_conservation := 60;
      v_mentions := 'Écritures selon Code des Sociétés belge.
Centrale des Bilans BNB.
Conservation 7 ans.';
      v_ref_obligatoire := true;
      
    ELSE
      -- Défaut: Congo-Brazzaville
      v_code_pays := 'CG';
      v_pays := 'Congo-Brazzaville';
      v_devise := 'XAF';
      v_symbole := 'FCFA';
      v_fmt_vente := 'VTE-{YEAR}-{NUMBER:04d}';
      v_fmt_achat := 'ACH-{YEAR}-{NUMBER:04d}';
      v_fmt_caisse := 'CAI-{YEAR}-{NUMBER:04d}';
      v_fmt_banque := 'BQ-{YEAR}-{NUMBER:04d}';
      v_fmt_od := 'OD-{YEAR}-{NUMBER:04d}';
      v_longueur := 4;
      v_format_date := 'DD/MM/YYYY';
      v_sep_milliers := ' ';
      v_sep_decimal := ',';
      v_pos_devise := 'after';
      v_equilibre := true;
      v_validation_auto := false;
      v_verrouillage := false;
      v_conservation := 90;
      v_mentions := 'Écritures comptables conformes au plan OHADA.
Conservation obligatoire 10 ans.
Modification interdite après verrouillage.';
      v_ref_obligatoire := false;
  END CASE;
  
  -- Insertion avec gestion des conflits
  INSERT INTO public.parametres_journalisation_regionaux (
    tenant_id, code_pays, pays, devise_principale, symbole_devise,
    format_numero_vente, format_numero_achat, format_numero_caisse,
    format_numero_banque, format_numero_od, longueur_numero,
    format_date, separateur_milliers, separateur_decimal,
    position_symbole_devise, equilibre_obligatoire,
    validation_automatique, verrouillage_auto_fin_mois,
    conservation_brouillons_jours, mentions_legales_ecritures,
    reference_obligatoire
  )
  VALUES (
    p_tenant_id, v_code_pays, v_pays, v_devise, v_symbole,
    v_fmt_vente, v_fmt_achat, v_fmt_caisse, v_fmt_banque, v_fmt_od, v_longueur,
    v_format_date, v_sep_milliers, v_sep_decimal, v_pos_devise,
    v_equilibre, v_validation_auto, v_verrouillage, v_conservation,
    v_mentions, v_ref_obligatoire
  )
  ON CONFLICT (tenant_id, code_pays) DO UPDATE SET
    pays = EXCLUDED.pays,
    devise_principale = EXCLUDED.devise_principale,
    symbole_devise = EXCLUDED.symbole_devise,
    format_numero_vente = EXCLUDED.format_numero_vente,
    format_numero_achat = EXCLUDED.format_numero_achat,
    format_numero_caisse = EXCLUDED.format_numero_caisse,
    format_numero_banque = EXCLUDED.format_numero_banque,
    format_numero_od = EXCLUDED.format_numero_od,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Initialiser tous les tenants existants avec template Congo par défaut
DO $$
DECLARE
  tenant_rec RECORD;
BEGIN
  FOR tenant_rec IN SELECT id FROM public.pharmacies LOOP
    PERFORM public.init_journal_params_for_tenant(tenant_rec.id, 'CG');
  END LOOP;
END $$;