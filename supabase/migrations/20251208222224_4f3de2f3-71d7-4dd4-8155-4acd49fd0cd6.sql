-- =====================================================
-- PHASE 1: CRÉER LES TABLES COMPTABLES DE BASE
-- =====================================================

-- 1. Table des comptes comptables (Plan comptable OHADA)
CREATE TABLE IF NOT EXISTS public.comptes_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  numero_compte TEXT NOT NULL,
  libelle_compte TEXT NOT NULL,
  type_compte TEXT NOT NULL DEFAULT 'actif', -- 'actif', 'passif', 'charge', 'produit'
  classe TEXT NOT NULL, -- '1' à '8'
  compte_parent_id UUID REFERENCES public.comptes_comptables(id),
  is_active BOOLEAN DEFAULT true,
  is_imputable BOOLEAN DEFAULT true, -- peut recevoir des écritures
  solde_debit NUMERIC(15,2) DEFAULT 0,
  solde_credit NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, numero_compte)
);

ALTER TABLE public.comptes_comptables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant accounts"
  ON public.comptes_comptables FOR SELECT
  USING (tenant_id IN (SELECT id FROM pharmacies WHERE id = tenant_id));

CREATE POLICY "Users can manage their tenant accounts"
  ON public.comptes_comptables FOR ALL
  USING (tenant_id IN (SELECT id FROM pharmacies WHERE id = tenant_id));

CREATE INDEX IF NOT EXISTS idx_comptes_comptables_tenant ON public.comptes_comptables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comptes_comptables_numero ON public.comptes_comptables(numero_compte);
CREATE INDEX IF NOT EXISTS idx_comptes_comptables_classe ON public.comptes_comptables(classe);

-- 2. Table des écritures comptables
CREATE TABLE IF NOT EXISTS public.ecritures_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  journal_id UUID REFERENCES public.accounting_journals(id),
  date_ecriture DATE NOT NULL,
  numero_piece TEXT,
  libelle TEXT NOT NULL,
  reference TEXT,
  reference_type TEXT, -- 'vente', 'achat', 'encaissement', 'decaissement', 'od'
  reference_id UUID,
  statut TEXT DEFAULT 'Brouillon', -- 'Brouillon', 'Validée', 'Annulée'
  montant_total NUMERIC(15,2) DEFAULT 0,
  is_auto_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.personnel(id),
  validated_by UUID REFERENCES public.personnel(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ecritures_comptables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant entries"
  ON public.ecritures_comptables FOR SELECT
  USING (tenant_id IN (SELECT id FROM pharmacies WHERE id = tenant_id));

CREATE POLICY "Users can manage their tenant entries"
  ON public.ecritures_comptables FOR ALL
  USING (tenant_id IN (SELECT id FROM pharmacies WHERE id = tenant_id));

CREATE INDEX IF NOT EXISTS idx_ecritures_tenant ON public.ecritures_comptables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ecritures_date ON public.ecritures_comptables(date_ecriture);
CREATE INDEX IF NOT EXISTS idx_ecritures_journal ON public.ecritures_comptables(journal_id);
CREATE INDEX IF NOT EXISTS idx_ecritures_statut ON public.ecritures_comptables(statut);

-- 3. Table des lignes d'écriture
CREATE TABLE IF NOT EXISTS public.lignes_ecriture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecriture_id UUID NOT NULL REFERENCES public.ecritures_comptables(id) ON DELETE CASCADE,
  compte_id UUID NOT NULL REFERENCES public.comptes_comptables(id),
  libelle TEXT,
  debit NUMERIC(15,2) DEFAULT 0,
  credit NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lignes_ecriture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entry lines via ecriture"
  ON public.lignes_ecriture FOR SELECT
  USING (ecriture_id IN (SELECT id FROM ecritures_comptables));

CREATE POLICY "Users can manage entry lines via ecriture"
  ON public.lignes_ecriture FOR ALL
  USING (ecriture_id IN (SELECT id FROM ecritures_comptables));

CREATE INDEX IF NOT EXISTS idx_lignes_ecriture ON public.lignes_ecriture(ecriture_id);
CREATE INDEX IF NOT EXISTS idx_lignes_compte ON public.lignes_ecriture(compte_id);

-- 4. Insérer le plan comptable OHADA de base pour chaque tenant
INSERT INTO public.comptes_comptables (tenant_id, numero_compte, libelle_compte, type_compte, classe, is_imputable)
SELECT p.id, '101', 'Capital social', 'passif', '1', true FROM public.pharmacies p
ON CONFLICT (tenant_id, numero_compte) DO NOTHING;

INSERT INTO public.comptes_comptables (tenant_id, numero_compte, libelle_compte, type_compte, classe, is_imputable)
SELECT p.id, '401', 'Fournisseurs', 'passif', '4', true FROM public.pharmacies p
ON CONFLICT (tenant_id, numero_compte) DO NOTHING;

INSERT INTO public.comptes_comptables (tenant_id, numero_compte, libelle_compte, type_compte, classe, is_imputable)
SELECT p.id, '411', 'Clients', 'actif', '4', true FROM public.pharmacies p
ON CONFLICT (tenant_id, numero_compte) DO NOTHING;

INSERT INTO public.comptes_comptables (tenant_id, numero_compte, libelle_compte, type_compte, classe, is_imputable)
SELECT p.id, '4431', 'TVA collectée sur ventes', 'passif', '4', true FROM public.pharmacies p
ON CONFLICT (tenant_id, numero_compte) DO NOTHING;

INSERT INTO public.comptes_comptables (tenant_id, numero_compte, libelle_compte, type_compte, classe, is_imputable)
SELECT p.id, '4451', 'TVA déductible sur achats', 'actif', '4', true FROM public.pharmacies p
ON CONFLICT (tenant_id, numero_compte) DO NOTHING;

INSERT INTO public.comptes_comptables (tenant_id, numero_compte, libelle_compte, type_compte, classe, is_imputable)
SELECT p.id, '521', 'Banque', 'actif', '5', true FROM public.pharmacies p
ON CONFLICT (tenant_id, numero_compte) DO NOTHING;

INSERT INTO public.comptes_comptables (tenant_id, numero_compte, libelle_compte, type_compte, classe, is_imputable)
SELECT p.id, '571', 'Caisse', 'actif', '5', true FROM public.pharmacies p
ON CONFLICT (tenant_id, numero_compte) DO NOTHING;

INSERT INTO public.comptes_comptables (tenant_id, numero_compte, libelle_compte, type_compte, classe, is_imputable)
SELECT p.id, '601', 'Achats de marchandises', 'charge', '6', true FROM public.pharmacies p
ON CONFLICT (tenant_id, numero_compte) DO NOTHING;

INSERT INTO public.comptes_comptables (tenant_id, numero_compte, libelle_compte, type_compte, classe, is_imputable)
SELECT p.id, '701', 'Ventes de marchandises', 'produit', '7', true FROM public.pharmacies p
ON CONFLICT (tenant_id, numero_compte) DO NOTHING;