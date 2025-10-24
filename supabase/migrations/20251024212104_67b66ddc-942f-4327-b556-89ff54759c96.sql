-- ===================================
-- Migration 10: Comptabilité
-- ===================================

CREATE TABLE public.plan_comptable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  numero_compte TEXT NOT NULL, libelle_compte TEXT NOT NULL,
  type_compte TEXT CHECK (type_compte IN ('Actif', 'Passif', 'Charge', 'Produit', 'Capital')) NOT NULL,
  classe INTEGER CHECK (classe BETWEEN 1 AND 9) NOT NULL,
  compte_parent_id UUID REFERENCES public.plan_comptable(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, numero_compte)
);

CREATE INDEX idx_plan_comptable_tenant_id ON public.plan_comptable(tenant_id);
CREATE TRIGGER update_plan_comptable_updated_at BEFORE UPDATE ON public.plan_comptable FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_plan_comptable AFTER INSERT OR UPDATE OR DELETE ON public.plan_comptable FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.exercices_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL, date_debut DATE NOT NULL, date_fin DATE NOT NULL,
  statut TEXT DEFAULT 'Ouvert' CHECK (statut IN ('Ouvert', 'Clôturé')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_exercices_comptables_tenant_id ON public.exercices_comptables(tenant_id);
CREATE TRIGGER update_exercices_comptables_updated_at BEFORE UPDATE ON public.exercices_comptables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_exercices_comptables AFTER INSERT OR UPDATE OR DELETE ON public.exercices_comptables FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.journaux_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  code_journal TEXT NOT NULL, libelle_journal TEXT NOT NULL,
  type_journal TEXT CHECK (type_journal IN ('Ventes', 'Achats', 'Banque', 'Caisse', 'Operations_Diverses')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, code_journal)
);

CREATE INDEX idx_journaux_comptables_tenant_id ON public.journaux_comptables(tenant_id);
CREATE TRIGGER update_journaux_comptables_updated_at BEFORE UPDATE ON public.journaux_comptables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_journaux_comptables AFTER INSERT OR UPDATE OR DELETE ON public.journaux_comptables FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.ecritures_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  exercice_id UUID NOT NULL REFERENCES public.exercices_comptables(id) ON DELETE RESTRICT,
  journal_id UUID NOT NULL REFERENCES public.journaux_comptables(id) ON DELETE RESTRICT,
  numero_piece TEXT NOT NULL, date_ecriture DATE NOT NULL, libelle TEXT NOT NULL,
  reference_type TEXT, reference_id UUID,
  statut TEXT DEFAULT 'Brouillon' CHECK (statut IN ('Brouillon', 'Validée', 'Lettrée')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_ecritures_comptables_tenant_id ON public.ecritures_comptables(tenant_id);
CREATE TRIGGER update_ecritures_comptables_updated_at BEFORE UPDATE ON public.ecritures_comptables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_ecritures_comptables AFTER INSERT OR UPDATE OR DELETE ON public.ecritures_comptables FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.lignes_ecriture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  ecriture_id UUID NOT NULL REFERENCES public.ecritures_comptables(id) ON DELETE CASCADE,
  compte_id UUID NOT NULL REFERENCES public.plan_comptable(id) ON DELETE RESTRICT,
  libelle TEXT, debit NUMERIC(15,2) DEFAULT 0, credit NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_lignes_ecriture_ecriture_id ON public.lignes_ecriture(ecriture_id);
CREATE TRIGGER update_lignes_ecriture_updated_at BEFORE UPDATE ON public.lignes_ecriture FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_lignes_ecriture AFTER INSERT OR UPDATE OR DELETE ON public.lignes_ecriture FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  exercice_id UUID NOT NULL REFERENCES public.exercices_comptables(id) ON DELETE CASCADE,
  compte_id UUID NOT NULL REFERENCES public.plan_comptable(id) ON DELETE CASCADE,
  periode DATE NOT NULL, solde_debit NUMERIC(15,2) DEFAULT 0, solde_credit NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, exercice_id, compte_id, periode)
);

CREATE INDEX idx_balances_tenant_id ON public.balances(tenant_id);
CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON public.balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tva_declaration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  exercice_id UUID NOT NULL REFERENCES public.exercices_comptables(id) ON DELETE CASCADE,
  periode DATE NOT NULL, tva_collectee NUMERIC(15,2) DEFAULT 0, tva_deductible NUMERIC(15,2) DEFAULT 0,
  tva_a_payer NUMERIC(15,2) DEFAULT 0, statut TEXT DEFAULT 'Brouillon' CHECK (statut IN ('Brouillon', 'Déposée', 'Payée')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_tva_declaration_tenant_id ON public.tva_declaration(tenant_id);
CREATE TRIGGER update_tva_declaration_updated_at BEFORE UPDATE ON public.tva_declaration FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_tva_declaration AFTER INSERT OR UPDATE OR DELETE ON public.tva_declaration FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.immobilisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  compte_id UUID REFERENCES public.plan_comptable(id) ON DELETE SET NULL,
  libelle TEXT NOT NULL, date_acquisition DATE NOT NULL, valeur_acquisition NUMERIC(15,2) NOT NULL,
  taux_amortissement NUMERIC(5,2), duree_amortissement INTEGER, valeur_residuelle NUMERIC(15,2) DEFAULT 0,
  statut TEXT DEFAULT 'En service' CHECK (statut IN ('En service', 'Cédée', 'Mise au rebut')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_immobilisations_tenant_id ON public.immobilisations(tenant_id);
CREATE TRIGGER update_immobilisations_updated_at BEFORE UPDATE ON public.immobilisations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_immobilisations AFTER INSERT OR UPDATE OR DELETE ON public.immobilisations FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.rapports_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  exercice_id UUID REFERENCES public.exercices_comptables(id) ON DELETE CASCADE,
  type_rapport TEXT CHECK (type_rapport IN ('Bilan', 'Compte_de_resultat', 'Grand_livre', 'Balance')) NOT NULL,
  date_debut DATE NOT NULL, date_fin DATE NOT NULL, contenu JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_rapports_comptables_tenant_id ON public.rapports_comptables(tenant_id);

ALTER TABLE public.plan_comptable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_plan_comptable" ON public.plan_comptable FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.exercices_comptables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_exercices" ON public.exercices_comptables FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.journaux_comptables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_journaux" ON public.journaux_comptables FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.ecritures_comptables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_ecritures" ON public.ecritures_comptables FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.lignes_ecriture ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_lignes_ecriture" ON public.lignes_ecriture FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_balances" ON public.balances FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.tva_declaration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_tva" ON public.tva_declaration FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.immobilisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_immobilisations" ON public.immobilisations FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.rapports_comptables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_rapports" ON public.rapports_comptables FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());