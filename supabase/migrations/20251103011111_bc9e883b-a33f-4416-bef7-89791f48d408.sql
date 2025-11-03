-- Phase 1: Création du schéma de base de données pour les paiements (sans la vue)

-- Table comptes_bancaires (Gestion des comptes)
CREATE TABLE IF NOT EXISTS public.comptes_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identification
  nom_compte TEXT NOT NULL,
  numero_compte TEXT NOT NULL,
  banque TEXT NOT NULL,
  type_compte TEXT NOT NULL CHECK (type_compte IN ('courant', 'epargne', 'mobile_money', 'caisse')),
  devise TEXT NOT NULL DEFAULT 'FCFA',
  
  -- Soldes
  solde_initial NUMERIC(15,2) NOT NULL DEFAULT 0,
  solde_actuel NUMERIC(15,2) NOT NULL DEFAULT 0,
  solde_rapproche NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Statut et paramètres
  est_actif BOOLEAN NOT NULL DEFAULT true,
  autoriser_decouvert BOOLEAN NOT NULL DEFAULT false,
  limite_decouvert NUMERIC(15,2) DEFAULT 0,
  
  -- Informations bancaires
  iban TEXT,
  swift_bic TEXT,
  code_banque TEXT,
  code_guichet TEXT,
  cle_rib TEXT,
  
  -- Contacts
  contact_banque TEXT,
  telephone_banque TEXT,
  email_banque TEXT,
  
  -- Configuration
  releve_auto BOOLEAN NOT NULL DEFAULT false,
  frequence_releve TEXT CHECK (frequence_releve IN ('quotidien', 'hebdomadaire', 'mensuel')),
  dernier_releve DATE,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_numero_compte_tenant UNIQUE (numero_compte, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_tenant ON public.comptes_bancaires(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_type ON public.comptes_bancaires(type_compte);
CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_actif ON public.comptes_bancaires(est_actif);

-- Table transactions_bancaires (Relevés bancaires)
CREATE TABLE IF NOT EXISTS public.transactions_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  compte_bancaire_id UUID NOT NULL REFERENCES public.comptes_bancaires(id),
  
  -- Identification transaction
  reference TEXT NOT NULL,
  reference_externe TEXT,
  
  -- Dates
  date_transaction DATE NOT NULL,
  date_valeur DATE,
  date_import TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Montants
  montant NUMERIC(15,2) NOT NULL,
  type_transaction TEXT NOT NULL CHECK (type_transaction IN ('debit', 'credit')),
  
  -- Description
  libelle TEXT NOT NULL,
  description TEXT,
  categorie TEXT,
  
  -- Rapprochement
  statut_rapprochement TEXT NOT NULL DEFAULT 'non_rapproche' 
    CHECK (statut_rapprochement IN ('non_rapproche', 'rapproche', 'rapproche_partiel', 'suspect', 'ignore')),
  date_rapprochement TIMESTAMP WITH TIME ZONE,
  rapproche_par_id UUID REFERENCES public.personnel(id),
  
  -- Liens avec paiements
  paiement_facture_id UUID REFERENCES public.paiements_factures(id),
  encaissement_id UUID REFERENCES public.encaissements(id),
  mouvement_caisse_id UUID,
  
  -- Notes et pièces jointes
  notes TEXT,
  pieces_jointes JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  source_import TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_montant_non_zero CHECK (montant != 0),
  CONSTRAINT unique_reference_compte UNIQUE (reference, compte_bancaire_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_tenant ON public.transactions_bancaires(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_compte ON public.transactions_bancaires(compte_bancaire_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_date ON public.transactions_bancaires(date_transaction);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_statut ON public.transactions_bancaires(statut_rapprochement);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_type ON public.transactions_bancaires(type_transaction);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_paiement_facture ON public.transactions_bancaires(paiement_facture_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_encaissement ON public.transactions_bancaires(encaissement_id);

-- Table rapprochements_bancaires (Historique des rapprochements)
CREATE TABLE IF NOT EXISTS public.rapprochements_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  compte_bancaire_id UUID NOT NULL REFERENCES public.comptes_bancaires(id),
  
  -- Identification
  numero_rapprochement TEXT NOT NULL,
  
  -- Période
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  
  -- Soldes
  solde_releve_debut NUMERIC(15,2) NOT NULL,
  solde_releve_fin NUMERIC(15,2) NOT NULL,
  solde_comptable_debut NUMERIC(15,2) NOT NULL,
  solde_comptable_fin NUMERIC(15,2) NOT NULL,
  
  -- Écarts
  ecart NUMERIC(15,2) NOT NULL DEFAULT 0,
  ecart_justifie NUMERIC(15,2) NOT NULL DEFAULT 0,
  ecart_non_justifie NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Statistiques
  nb_transactions_rapprochees INTEGER NOT NULL DEFAULT 0,
  nb_transactions_non_rapprochees INTEGER NOT NULL DEFAULT 0,
  nb_transactions_suspectes INTEGER NOT NULL DEFAULT 0,
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'en_cours' 
    CHECK (statut IN ('en_cours', 'valide', 'cloture', 'annule')),
  
  -- Validation
  valide_par_id UUID REFERENCES public.personnel(id),
  date_validation TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  commentaires TEXT,
  
  -- Audit
  created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_numero_rapprochement_tenant UNIQUE (numero_rapprochement, tenant_id),
  CONSTRAINT check_dates_rapprochement CHECK (date_fin >= date_debut)
);

CREATE INDEX IF NOT EXISTS idx_rapprochements_bancaires_tenant ON public.rapprochements_bancaires(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rapprochements_bancaires_compte ON public.rapprochements_bancaires(compte_bancaire_id);
CREATE INDEX IF NOT EXISTS idx_rapprochements_bancaires_statut ON public.rapprochements_bancaires(statut);
CREATE INDEX IF NOT EXISTS idx_rapprochements_bancaires_periode ON public.rapprochements_bancaires(date_debut, date_fin);

-- Table echeanciers_paiements (Planification des paiements)
CREATE TABLE IF NOT EXISTS public.echeanciers_paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Type et référence
  type_echeancier TEXT NOT NULL CHECK (type_echeancier IN ('client', 'fournisseur', 'autre')),
  facture_id UUID REFERENCES public.factures(id),
  
  -- Tiers
  client_id UUID REFERENCES public.clients(id),
  fournisseur_id UUID REFERENCES public.fournisseurs(id),
  tiers_nom TEXT,
  
  -- Description
  libelle TEXT NOT NULL,
  description TEXT,
  
  -- Montant
  montant_total NUMERIC(15,2) NOT NULL,
  montant_paye NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_restant NUMERIC(15,2) NOT NULL,
  
  -- Échéances
  date_emission DATE NOT NULL,
  date_premiere_echeance DATE NOT NULL,
  date_derniere_echeance DATE,
  nombre_echeances INTEGER NOT NULL DEFAULT 1,
  periodicite TEXT CHECK (periodicite IN ('unique', 'mensuel', 'trimestriel', 'semestriel', 'annuel')),
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'actif' 
    CHECK (statut IN ('actif', 'termine', 'suspendu', 'annule')),
  
  -- Alertes
  alerte_avant_echeance INTEGER DEFAULT 7,
  derniere_alerte DATE,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_montant_restant_echeancier CHECK (montant_restant = montant_total - montant_paye),
  CONSTRAINT check_tiers_echeancier CHECK (
    (type_echeancier = 'client' AND client_id IS NOT NULL) OR
    (type_echeancier = 'fournisseur' AND fournisseur_id IS NOT NULL) OR
    (type_echeancier = 'autre' AND tiers_nom IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_echeanciers_paiements_tenant ON public.echeanciers_paiements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_echeanciers_paiements_type ON public.echeanciers_paiements(type_echeancier);
CREATE INDEX IF NOT EXISTS idx_echeanciers_paiements_facture ON public.echeanciers_paiements(facture_id);
CREATE INDEX IF NOT EXISTS idx_echeanciers_paiements_statut ON public.echeanciers_paiements(statut);
CREATE INDEX IF NOT EXISTS idx_echeanciers_paiements_date ON public.echeanciers_paiements(date_premiere_echeance);

-- Table lignes_echeancier (Détail des échéances)
CREATE TABLE IF NOT EXISTS public.lignes_echeancier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  echeancier_id UUID NOT NULL REFERENCES public.echeanciers_paiements(id) ON DELETE CASCADE,
  
  -- Identification
  numero_echeance INTEGER NOT NULL,
  
  -- Montant
  montant_echeance NUMERIC(15,2) NOT NULL,
  montant_paye NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_restant NUMERIC(15,2) NOT NULL,
  
  -- Dates
  date_echeance DATE NOT NULL,
  date_paiement DATE,
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'a_payer' 
    CHECK (statut IN ('a_payer', 'paye_partiel', 'paye', 'en_retard', 'annule')),
  
  -- Paiements liés
  paiement_facture_id UUID REFERENCES public.paiements_factures(id),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_montant_restant_ligne CHECK (montant_restant = montant_echeance - montant_paye),
  CONSTRAINT unique_numero_echeance_echeancier UNIQUE (echeancier_id, numero_echeance)
);

CREATE INDEX IF NOT EXISTS idx_lignes_echeancier_tenant ON public.lignes_echeancier(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lignes_echeancier_echeancier ON public.lignes_echeancier(echeancier_id);
CREATE INDEX IF NOT EXISTS idx_lignes_echeancier_date ON public.lignes_echeancier(date_echeance);
CREATE INDEX IF NOT EXISTS idx_lignes_echeancier_statut ON public.lignes_echeancier(statut);

-- Table modes_paiement_config (Configuration des modes de paiement)
CREATE TABLE IF NOT EXISTS public.modes_paiement_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identification
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  
  -- Configuration
  est_actif BOOLEAN NOT NULL DEFAULT true,
  ordre_affichage INTEGER NOT NULL DEFAULT 0,
  
  -- Compte associé
  compte_bancaire_id UUID REFERENCES public.comptes_bancaires(id),
  compte_comptable_id UUID REFERENCES public.plan_comptable(id),
  
  -- Paramètres
  exige_reference BOOLEAN NOT NULL DEFAULT false,
  exige_validation BOOLEAN NOT NULL DEFAULT false,
  delai_encaissement INTEGER DEFAULT 0,
  
  -- Frais
  frais_pourcentage NUMERIC(5,2) DEFAULT 0,
  frais_fixes NUMERIC(15,2) DEFAULT 0,
  
  -- Limites
  montant_minimum NUMERIC(15,2),
  montant_maximum NUMERIC(15,2),
  
  -- Icône et couleur
  icone TEXT,
  couleur TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_code_mode_paiement_tenant UNIQUE (code, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_modes_paiement_config_tenant ON public.modes_paiement_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_modes_paiement_config_actif ON public.modes_paiement_config(est_actif);
CREATE INDEX IF NOT EXISTS idx_modes_paiement_config_ordre ON public.modes_paiement_config(ordre_affichage);

-- Trigger pour mettre à jour le solde des comptes bancaires
CREATE OR REPLACE FUNCTION update_compte_bancaire_solde()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comptes_bancaires
    SET solde_actuel = solde_actuel + 
      CASE 
        WHEN NEW.type_transaction = 'credit' THEN NEW.montant
        WHEN NEW.type_transaction = 'debit' THEN -NEW.montant
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = NEW.compte_bancaire_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.comptes_bancaires
    SET solde_actuel = solde_actuel - 
      CASE 
        WHEN OLD.type_transaction = 'credit' THEN OLD.montant
        WHEN OLD.type_transaction = 'debit' THEN -OLD.montant
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = OLD.compte_bancaire_id;
    
    UPDATE public.comptes_bancaires
    SET solde_actuel = solde_actuel + 
      CASE 
        WHEN NEW.type_transaction = 'credit' THEN NEW.montant
        WHEN NEW.type_transaction = 'debit' THEN -NEW.montant
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = NEW.compte_bancaire_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comptes_bancaires
    SET solde_actuel = solde_actuel - 
      CASE 
        WHEN OLD.type_transaction = 'credit' THEN OLD.montant
        WHEN OLD.type_transaction = 'debit' THEN -OLD.montant
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = OLD.compte_bancaire_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_compte_bancaire_solde_insert ON public.transactions_bancaires;
CREATE TRIGGER trg_update_compte_bancaire_solde_insert
AFTER INSERT ON public.transactions_bancaires
FOR EACH ROW
EXECUTE FUNCTION update_compte_bancaire_solde();

DROP TRIGGER IF EXISTS trg_update_compte_bancaire_solde_update ON public.transactions_bancaires;
CREATE TRIGGER trg_update_compte_bancaire_solde_update
AFTER UPDATE ON public.transactions_bancaires
FOR EACH ROW
EXECUTE FUNCTION update_compte_bancaire_solde();

DROP TRIGGER IF EXISTS trg_update_compte_bancaire_solde_delete ON public.transactions_bancaires;
CREATE TRIGGER trg_update_compte_bancaire_solde_delete
AFTER DELETE ON public.transactions_bancaires
FOR EACH ROW
EXECUTE FUNCTION update_compte_bancaire_solde();

-- Trigger pour mettre à jour le montant restant des échéanciers
CREATE OR REPLACE FUNCTION update_echeancier_montant_restant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.montant_restant := NEW.montant_echeance - NEW.montant_paye;
  
  IF NEW.montant_paye = 0 THEN
    IF NEW.date_echeance < CURRENT_DATE THEN
      NEW.statut := 'en_retard';
    ELSE
      NEW.statut := 'a_payer';
    END IF;
  ELSIF NEW.montant_paye >= NEW.montant_echeance THEN
    NEW.statut := 'paye';
  ELSE
    NEW.statut := 'paye_partiel';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_ligne_echeancier_montant_restant ON public.lignes_echeancier;
CREATE TRIGGER trg_update_ligne_echeancier_montant_restant
BEFORE INSERT OR UPDATE ON public.lignes_echeancier
FOR EACH ROW
EXECUTE FUNCTION update_echeancier_montant_restant();

-- Trigger pour mettre à jour les totaux de l'échéancier
CREATE OR REPLACE FUNCTION update_echeancier_totaux()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_montant_paye NUMERIC(15,2);
BEGIN
  SELECT COALESCE(SUM(montant_paye), 0)
  INTO v_montant_paye
  FROM public.lignes_echeancier
  WHERE echeancier_id = COALESCE(NEW.echeancier_id, OLD.echeancier_id);
  
  UPDATE public.echeanciers_paiements
  SET 
    montant_paye = v_montant_paye,
    montant_restant = montant_total - v_montant_paye,
    statut = CASE 
      WHEN v_montant_paye >= montant_total THEN 'termine'
      WHEN v_montant_paye > 0 THEN 'actif'
      ELSE statut
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.echeancier_id, OLD.echeancier_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_echeancier_totaux_insert ON public.lignes_echeancier;
CREATE TRIGGER trg_update_echeancier_totaux_insert
AFTER INSERT ON public.lignes_echeancier
FOR EACH ROW
EXECUTE FUNCTION update_echeancier_totaux();

DROP TRIGGER IF EXISTS trg_update_echeancier_totaux_update ON public.lignes_echeancier;
CREATE TRIGGER trg_update_echeancier_totaux_update
AFTER UPDATE ON public.lignes_echeancier
FOR EACH ROW
EXECUTE FUNCTION update_echeancier_totaux();

DROP TRIGGER IF EXISTS trg_update_echeancier_totaux_delete ON public.lignes_echeancier;
CREATE TRIGGER trg_update_echeancier_totaux_delete
AFTER DELETE ON public.lignes_echeancier
FOR EACH ROW
EXECUTE FUNCTION update_echeancier_totaux();

-- RLS Policies
ALTER TABLE public.comptes_bancaires ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comptes_bancaires' AND policyname = 'Users can view comptes_bancaires from their tenant'
  ) THEN
    CREATE POLICY "Users can view comptes_bancaires from their tenant"
    ON public.comptes_bancaires FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comptes_bancaires' AND policyname = 'Authorized users can manage comptes_bancaires in their tenant'
  ) THEN
    CREATE POLICY "Authorized users can manage comptes_bancaires in their tenant"
    ON public.comptes_bancaires FOR ALL
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

ALTER TABLE public.transactions_bancaires ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions_bancaires' AND policyname = 'Users can view transactions_bancaires from their tenant'
  ) THEN
    CREATE POLICY "Users can view transactions_bancaires from their tenant"
    ON public.transactions_bancaires FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions_bancaires' AND policyname = 'Authorized users can manage transactions_bancaires in their tenant'
  ) THEN
    CREATE POLICY "Authorized users can manage transactions_bancaires in their tenant"
    ON public.transactions_bancaires FOR ALL
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

ALTER TABLE public.rapprochements_bancaires ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rapprochements_bancaires' AND policyname = 'Users can view rapprochements from their tenant'
  ) THEN
    CREATE POLICY "Users can view rapprochements from their tenant"
    ON public.rapprochements_bancaires FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rapprochements_bancaires' AND policyname = 'Authorized users can manage rapprochements in their tenant'
  ) THEN
    CREATE POLICY "Authorized users can manage rapprochements in their tenant"
    ON public.rapprochements_bancaires FOR ALL
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

ALTER TABLE public.echeanciers_paiements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'echeanciers_paiements' AND policyname = 'Users can view echeanciers from their tenant'
  ) THEN
    CREATE POLICY "Users can view echeanciers from their tenant"
    ON public.echeanciers_paiements FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'echeanciers_paiements' AND policyname = 'Authorized users can manage echeanciers in their tenant'
  ) THEN
    CREATE POLICY "Authorized users can manage echeanciers in their tenant"
    ON public.echeanciers_paiements FOR ALL
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

ALTER TABLE public.lignes_echeancier ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lignes_echeancier' AND policyname = 'Users can view lignes_echeancier from their tenant'
  ) THEN
    CREATE POLICY "Users can view lignes_echeancier from their tenant"
    ON public.lignes_echeancier FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lignes_echeancier' AND policyname = 'Authorized users can manage lignes_echeancier in their tenant'
  ) THEN
    CREATE POLICY "Authorized users can manage lignes_echeancier in their tenant"
    ON public.lignes_echeancier FOR ALL
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

ALTER TABLE public.modes_paiement_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'modes_paiement_config' AND policyname = 'Users can view modes_paiement_config from their tenant'
  ) THEN
    CREATE POLICY "Users can view modes_paiement_config from their tenant"
    ON public.modes_paiement_config FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'modes_paiement_config' AND policyname = 'Authorized users can manage modes_paiement_config in their tenant'
  ) THEN
    CREATE POLICY "Authorized users can manage modes_paiement_config in their tenant"
    ON public.modes_paiement_config FOR ALL
    TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;