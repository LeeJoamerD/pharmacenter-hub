-- Phase 1: Création table parametres_factures_regionaux avec templates 6 pays

CREATE TABLE parametres_factures_regionaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  code_pays VARCHAR(2) NOT NULL,
  pays VARCHAR(100),
  devise_principale VARCHAR(10),
  symbole_devise VARCHAR(10),
  
  -- En-tête société
  nom_societe VARCHAR(255),
  adresse_societe TEXT,
  registre_commerce VARCHAR(100),
  numero_tva VARCHAR(50),
  telephone_societe VARCHAR(50),
  email_societe VARCHAR(100),
  site_web VARCHAR(100),
  
  -- Configuration numérotation
  prefixe_facture_client VARCHAR(10),
  prefixe_facture_fournisseur VARCHAR(10),
  prefixe_avoir VARCHAR(10),
  format_numero VARCHAR(50),
  longueur_numero INTEGER DEFAULT 4,
  
  -- TVA et taxes
  taux_tva_standard NUMERIC(5,2),
  taux_tva_reduit NUMERIC(5,2),
  libelle_tva VARCHAR(50),
  numero_tva_obligatoire BOOLEAN DEFAULT false,
  
  -- Mentions légales
  mentions_legales_facture TEXT,
  conditions_paiement_defaut TEXT,
  delai_paiement_defaut INTEGER DEFAULT 30,
  penalite_retard_pourcentage NUMERIC(5,2),
  
  -- Formats
  format_date VARCHAR(20),
  separateur_milliers VARCHAR(1),
  separateur_decimal VARCHAR(1),
  position_symbole_devise VARCHAR(10),
  
  -- Réglementations
  montant_max_sans_facture NUMERIC(12,2),
  archivage_obligatoire_annees INTEGER,
  signature_electronique_requise BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tenant_country UNIQUE(tenant_id, code_pays)
);

-- RLS
ALTER TABLE parametres_factures_regionaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice params from their tenant"
ON parametres_factures_regionaux FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Admins can manage invoice params in their tenant"
ON parametres_factures_regionaux FOR ALL
USING (tenant_id IN (
  SELECT p.tenant_id FROM personnel p 
  WHERE p.auth_user_id = auth.uid() AND p.role IN ('Gérant', 'Administrateur')
));

-- Indexes
CREATE INDEX idx_invoice_params_tenant ON parametres_factures_regionaux(tenant_id);
CREATE INDEX idx_invoice_params_country ON parametres_factures_regionaux(code_pays);

-- Trigger updated_at
CREATE TRIGGER trg_update_invoice_params_updated_at
BEFORE UPDATE ON parametres_factures_regionaux
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction RPC init_invoice_params_for_tenant avec templates 6 pays
CREATE OR REPLACE FUNCTION init_invoice_params_for_tenant(
  p_tenant_id UUID,
  p_country_code VARCHAR(2) DEFAULT 'CG'
)
RETURNS VOID AS $$
BEGIN
  -- Template Congo-Brazzaville (défaut)
  IF p_country_code = 'CG' THEN
    INSERT INTO parametres_factures_regionaux (
      tenant_id, code_pays, pays, devise_principale, symbole_devise,
      prefixe_facture_client, prefixe_facture_fournisseur, prefixe_avoir,
      format_numero, longueur_numero,
      taux_tva_standard, libelle_tva, numero_tva_obligatoire,
      mentions_legales_facture, conditions_paiement_defaut, delai_paiement_defaut, penalite_retard_pourcentage,
      format_date, separateur_milliers, separateur_decimal, position_symbole_devise,
      montant_max_sans_facture, archivage_obligatoire_annees, signature_electronique_requise
    ) VALUES (
      p_tenant_id, 'CG', 'Congo-Brazzaville', 'XAF', 'FCFA',
      'FC', 'FF', 'AV',
      '{PREFIX}-{YEAR}-{NUMBER:04d}', 4,
      18.00, 'TVA', false,
      E'Facture soumise aux conditions générales de vente.\nTVA en vigueur au Congo-Brazzaville.\nEn cas de retard de paiement, pénalités de 10% du montant dû.\nRegistre du Commerce de Brazzaville.',
      'Paiement à 30 jours par virement, chèque ou Mobile Money (Airtel Money, MTN Mobile Money).',
      30, 10.00,
      'DD/MM/YYYY', ' ', ',', 'after',
      50000, 10, false
    )
    ON CONFLICT (tenant_id, code_pays) DO UPDATE SET
      pays = EXCLUDED.pays,
      devise_principale = EXCLUDED.devise_principale,
      symbole_devise = EXCLUDED.symbole_devise,
      prefixe_facture_client = EXCLUDED.prefixe_facture_client,
      taux_tva_standard = EXCLUDED.taux_tva_standard,
      updated_at = NOW();
      
  -- Template Cameroun
  ELSIF p_country_code = 'CM' THEN
    INSERT INTO parametres_factures_regionaux (
      tenant_id, code_pays, pays, devise_principale, symbole_devise,
      prefixe_facture_client, prefixe_facture_fournisseur, prefixe_avoir,
      format_numero, longueur_numero,
      taux_tva_standard, libelle_tva, numero_tva_obligatoire,
      mentions_legales_facture, conditions_paiement_defaut, delai_paiement_defaut, penalite_retard_pourcentage,
      format_date, separateur_milliers, separateur_decimal, position_symbole_devise,
      montant_max_sans_facture, archivage_obligatoire_annees
    ) VALUES (
      p_tenant_id, 'CM', 'Cameroun', 'XAF', 'FCFA',
      'FC', 'FF', 'AV',
      '{PREFIX}-{YEAR}-{NUMBER:04d}', 4,
      19.25, 'TVA', true,
      E'Facture régie par le Code CEMAC.\nNIF/TVA requis pour facturation.\nConservation 10 ans.\nRegistre du Commerce de Yaoundé/Douala.',
      'Paiement à 30 jours par virement, Mobile Money (Orange Money, MTN, Express Union).',
      30, 10.00,
      'DD/MM/YYYY', ' ', ',', 'after',
      50000, 10
    )
    ON CONFLICT (tenant_id, code_pays) DO UPDATE SET updated_at = NOW();
    
  -- Template Sénégal
  ELSIF p_country_code = 'SN' THEN
    INSERT INTO parametres_factures_regionaux (
      tenant_id, code_pays, pays, devise_principale, symbole_devise,
      prefixe_facture_client, prefixe_facture_fournisseur, prefixe_avoir,
      format_numero, longueur_numero,
      taux_tva_standard, libelle_tva, numero_tva_obligatoire,
      mentions_legales_facture, conditions_paiement_defaut, delai_paiement_defaut, penalite_retard_pourcentage,
      format_date, separateur_milliers, separateur_decimal, position_symbole_devise,
      montant_max_sans_facture, archivage_obligatoire_annees
    ) VALUES (
      p_tenant_id, 'SN', 'Sénégal', 'XOF', 'FCFA',
      'FC', 'FF', 'AV',
      '{PREFIX}-{YEAR}-{NUMBER:04d}', 4,
      18.00, 'TVA', true,
      E'Facture régie par le Code UEMOA.\nNINEA requis.\nConservation 10 ans.\nRegistre du Commerce de Dakar.',
      'Paiement à 30 jours par virement, Mobile Money (Wave, Orange Money, Free Money).',
      30, 10.00,
      'DD/MM/YYYY', ' ', ',', 'after',
      50000, 10
    )
    ON CONFLICT (tenant_id, code_pays) DO UPDATE SET updated_at = NOW();
    
  -- Template Côte d'Ivoire
  ELSIF p_country_code = 'CI' THEN
    INSERT INTO parametres_factures_regionaux (
      tenant_id, code_pays, pays, devise_principale, symbole_devise,
      prefixe_facture_client, prefixe_facture_fournisseur, prefixe_avoir,
      format_numero, longueur_numero,
      taux_tva_standard, libelle_tva, numero_tva_obligatoire,
      mentions_legales_facture, conditions_paiement_defaut, delai_paiement_defaut, penalite_retard_pourcentage,
      format_date, separateur_milliers, separateur_decimal, position_symbole_devise,
      montant_max_sans_facture, archivage_obligatoire_annees, signature_electronique_requise
    ) VALUES (
      p_tenant_id, 'CI', 'Côte d''Ivoire', 'XOF', 'FCFA',
      'FC', 'FF', 'AV',
      '{PREFIX}-{YEAR}-{NUMBER:04d}', 4,
      18.00, 'TVA', true,
      E'Facture électronique e-Facture obligatoire (DGI).\nCC/Impôt requis.\nConservation 10 ans.\nRegistre du Commerce d''Abidjan.',
      'Paiement à 30 jours par virement, Mobile Money (MTN, Orange, Moov).',
      30, 10.00,
      'DD/MM/YYYY', ' ', ',', 'after',
      50000, 10, true
    )
    ON CONFLICT (tenant_id, code_pays) DO UPDATE SET updated_at = NOW();
    
  -- Template France
  ELSIF p_country_code = 'FR' THEN
    INSERT INTO parametres_factures_regionaux (
      tenant_id, code_pays, pays, devise_principale, symbole_devise,
      prefixe_facture_client, prefixe_facture_fournisseur, prefixe_avoir,
      format_numero, longueur_numero,
      taux_tva_standard, taux_tva_reduit, libelle_tva, numero_tva_obligatoire,
      mentions_legales_facture, conditions_paiement_defaut, delai_paiement_defaut, penalite_retard_pourcentage,
      format_date, separateur_milliers, separateur_decimal, position_symbole_devise,
      montant_max_sans_facture, archivage_obligatoire_annees
    ) VALUES (
      p_tenant_id, 'FR', 'France', 'EUR', '€',
      'INV', 'BILL', 'CN',
      '{PREFIX}-{YEAR}-{NUMBER:05d}', 5,
      20.00, 5.50, 'TVA', true,
      E'TVA non applicable, art. 293 B du CGI.\nPénalités de retard : 3 fois le taux d''intérêt légal.\nIndemnité forfaitaire pour frais de recouvrement : 40€.\nRCS Nanterre B 123 456 789.\nCapital social : 10 000 €.',
      E'Paiement à 30 jours fin de mois par virement SEPA, chèque ou carte bancaire.\nIBAN : FR76 XXXX XXXX XXXX XXXX XXXX XXX\nBIC : XXXXFRPPXXX',
      30, 3.00,
      'DD/MM/YYYY', ' ', ',', 'after',
      0, 10
    )
    ON CONFLICT (tenant_id, code_pays) DO UPDATE SET updated_at = NOW();
    
  -- Template Belgique
  ELSIF p_country_code = 'BE' THEN
    INSERT INTO parametres_factures_regionaux (
      tenant_id, code_pays, pays, devise_principale, symbole_devise,
      prefixe_facture_client, prefixe_facture_fournisseur, prefixe_avoir,
      format_numero, longueur_numero,
      taux_tva_standard, taux_tva_reduit, libelle_tva, numero_tva_obligatoire,
      mentions_legales_facture, conditions_paiement_defaut, delai_paiement_defaut, penalite_retard_pourcentage,
      format_date, separateur_milliers, separateur_decimal, position_symbole_devise,
      archivage_obligatoire_annees
    ) VALUES (
      p_tenant_id, 'BE', 'Belgique', 'EUR', '€',
      'INV', 'BILL', 'CN',
      '{PREFIX}-{YEAR}-{NUMBER:05d}', 5,
      21.00, 6.00, 'BTW/TVA', true,
      E'Facture soumise au Code de droit économique belge.\nN° TVA BE 0XXX.XXX.XXX.\nBanque Nationale de Belgique : IBAN BE XX XXXX XXXX XXXX\nBIC : XXXXXXXX\nConservation 7 ans.',
      'Paiement à 30 jours par virement SEPA, Bancontact ou carte.',
      30, 5.00,
      'DD/MM/YYYY', '.', ',', 'after',
      7
    )
    ON CONFLICT (tenant_id, code_pays) DO UPDATE SET updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Init toutes les pharmacies existantes avec template Congo par défaut
DO $$
DECLARE
  pharmacy_rec RECORD;
BEGIN
  FOR pharmacy_rec IN SELECT id FROM pharmacies LOOP
    PERFORM init_invoice_params_for_tenant(pharmacy_rec.id, 'CG');
  END LOOP;
END $$;