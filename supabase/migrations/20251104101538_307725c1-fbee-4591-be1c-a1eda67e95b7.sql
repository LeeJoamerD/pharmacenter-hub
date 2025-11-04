-- Table: regles_categorisation_bancaire (Format Congo-Brazzaville)
CREATE TABLE IF NOT EXISTS public.regles_categorisation_bancaire (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom_regle TEXT NOT NULL,
  priorite INTEGER NOT NULL DEFAULT 50 CHECK (priorite >= 1 AND priorite <= 100),
  pattern_recherche TEXT NOT NULL,
  type_pattern TEXT NOT NULL DEFAULT 'contient' CHECK (type_pattern IN ('contient', 'commence_par', 'termine_par', 'regex', 'exact')),
  categorie_cible TEXT NOT NULL,
  type_transaction TEXT NOT NULL DEFAULT 'tous' CHECK (type_transaction IN ('credit', 'debit', 'tous')),
  banque_specifique TEXT,
  montant_min NUMERIC(15,2),
  montant_max NUMERIC(15,2),
  est_actif BOOLEAN NOT NULL DEFAULT true,
  appliquee_automatiquement BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: previsions_tresorerie (Montants en XAF)
CREATE TABLE IF NOT EXISTS public.previsions_tresorerie (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  exercice_id UUID,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  type_scenario TEXT NOT NULL DEFAULT 'Réaliste' CHECK (type_scenario IN ('Optimiste', 'Réaliste', 'Pessimiste')),
  coefficient_ajustement NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  solde_initial_xaf NUMERIC(15,2) NOT NULL DEFAULT 0,
  entrees_prevues_xaf NUMERIC(15,2) NOT NULL DEFAULT 0,
  sorties_prevues_xaf NUMERIC(15,2) NOT NULL DEFAULT 0,
  solde_final_previsionnel_xaf NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: engagements_tresorerie (Échéances futures)
CREATE TABLE IF NOT EXISTS public.engagements_tresorerie (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  type_engagement TEXT NOT NULL CHECK (type_engagement IN ('Salaires', 'Fournisseurs', 'Charges sociales', 'Impôts BEAC', 'Loyers', 'Autres')),
  libelle TEXT NOT NULL,
  date_echeance DATE NOT NULL,
  montant_xaf NUMERIC(15,2) NOT NULL,
  statut TEXT NOT NULL DEFAULT 'Prévu' CHECK (statut IN ('Prévu', 'Confirmé', 'Payé', 'Annulé')),
  compte_bancaire_id UUID REFERENCES public.comptes_bancaires(id) ON DELETE SET NULL,
  reference_document TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: alertes_tresorerie (Système d'alertes)
CREATE TABLE IF NOT EXISTS public.alertes_tresorerie (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  type_alerte TEXT NOT NULL CHECK (type_alerte IN ('Seuil bas', 'Seuil critique', 'Découvert', 'Échéance proche', 'Anomalie')),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  severite TEXT NOT NULL DEFAULT 'warning' CHECK (severite IN ('info', 'warning', 'error', 'critical')),
  seuil_montant_xaf NUMERIC(15,2),
  compte_bancaire_id UUID REFERENCES public.comptes_bancaires(id) ON DELETE CASCADE,
  date_alerte TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  statut TEXT NOT NULL DEFAULT 'Active' CHECK (statut IN ('Active', 'Résolue', 'Ignorée')),
  resolu_le TIMESTAMP WITH TIME ZONE,
  resolu_par_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: parametres_bancaires (Configuration globale)
CREATE TABLE IF NOT EXISTS public.parametres_bancaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE,
  synchronisation_auto BOOLEAN NOT NULL DEFAULT true,
  frequence_sync TEXT NOT NULL DEFAULT 'Quotidien' CHECK (frequence_sync IN ('Temps réel', 'Horaire', 'Quotidien', 'Hebdomadaire')),
  rapprochement_auto BOOLEAN NOT NULL DEFAULT false,
  tolerance_rapprochement_jours INTEGER NOT NULL DEFAULT 3,
  tolerance_rapprochement_montant_xaf NUMERIC(10,2) NOT NULL DEFAULT 100,
  alertes_actives BOOLEAN NOT NULL DEFAULT true,
  seuil_alerte_bas_xaf NUMERIC(15,2) NOT NULL DEFAULT 500000,
  seuil_alerte_critique_xaf NUMERIC(15,2) NOT NULL DEFAULT 100000,
  emails_alertes TEXT[],
  format_import_defaut TEXT NOT NULL DEFAULT 'CSV_BEAC' CHECK (format_import_defaut IN ('CSV_BEAC', 'Excel_Standard', 'OFX', 'MT940')),
  devise_principale TEXT NOT NULL DEFAULT 'XAF',
  code_pays TEXT NOT NULL DEFAULT 'CG',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regles_categorisation_bancaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.previsions_tresorerie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements_tresorerie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes_tresorerie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_bancaires ENABLE ROW LEVEL SECURITY;

-- RLS Policies: regles_categorisation_bancaire
CREATE POLICY "Users can view categorization rules from their tenant"
  ON public.regles_categorisation_bancaire FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert categorization rules in their tenant"
  ON public.regles_categorisation_bancaire FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update categorization rules from their tenant"
  ON public.regles_categorisation_bancaire FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete categorization rules from their tenant"
  ON public.regles_categorisation_bancaire FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies: previsions_tresorerie
CREATE POLICY "Users can view treasury forecasts from their tenant"
  ON public.previsions_tresorerie FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert treasury forecasts in their tenant"
  ON public.previsions_tresorerie FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update treasury forecasts from their tenant"
  ON public.previsions_tresorerie FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete treasury forecasts from their tenant"
  ON public.previsions_tresorerie FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies: engagements_tresorerie
CREATE POLICY "Users can view treasury commitments from their tenant"
  ON public.engagements_tresorerie FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert treasury commitments in their tenant"
  ON public.engagements_tresorerie FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update treasury commitments from their tenant"
  ON public.engagements_tresorerie FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete treasury commitments from their tenant"
  ON public.engagements_tresorerie FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies: alertes_tresorerie
CREATE POLICY "Users can view treasury alerts from their tenant"
  ON public.alertes_tresorerie FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert treasury alerts in their tenant"
  ON public.alertes_tresorerie FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update treasury alerts from their tenant"
  ON public.alertes_tresorerie FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete treasury alerts from their tenant"
  ON public.alertes_tresorerie FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies: parametres_bancaires
CREATE POLICY "Users can view banking parameters from their tenant"
  ON public.parametres_bancaires FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert banking parameters in their tenant"
  ON public.parametres_bancaires FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update banking parameters from their tenant"
  ON public.parametres_bancaires FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_regles_categorisation_tenant ON public.regles_categorisation_bancaire(tenant_id);
CREATE INDEX IF NOT EXISTS idx_regles_categorisation_priorite ON public.regles_categorisation_bancaire(priorite DESC);
CREATE INDEX IF NOT EXISTS idx_previsions_tresorerie_tenant ON public.previsions_tresorerie(tenant_id);
CREATE INDEX IF NOT EXISTS idx_previsions_tresorerie_periode ON public.previsions_tresorerie(periode_debut, periode_fin);
CREATE INDEX IF NOT EXISTS idx_engagements_tresorerie_tenant ON public.engagements_tresorerie(tenant_id);
CREATE INDEX IF NOT EXISTS idx_engagements_tresorerie_echeance ON public.engagements_tresorerie(date_echeance);
CREATE INDEX IF NOT EXISTS idx_alertes_tresorerie_tenant ON public.alertes_tresorerie(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alertes_tresorerie_statut ON public.alertes_tresorerie(statut);

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_regles_categorisation
  BEFORE UPDATE ON public.regles_categorisation_bancaire
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_previsions_tresorerie
  BEFORE UPDATE ON public.previsions_tresorerie
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_engagements_tresorerie
  BEFORE UPDATE ON public.engagements_tresorerie
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_alertes_tresorerie
  BEFORE UPDATE ON public.alertes_tresorerie
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_parametres_bancaires
  BEFORE UPDATE ON public.parametres_bancaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();