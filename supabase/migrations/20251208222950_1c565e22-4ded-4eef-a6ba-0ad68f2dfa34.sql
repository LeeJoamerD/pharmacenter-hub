-- =====================================================
-- TABLE PAIEMENTS_FOURNISSEURS + RLS
-- =====================================================

-- 1. Créer la table paiements_fournisseurs
CREATE TABLE IF NOT EXISTS public.paiements_fournisseurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  fournisseur_id UUID REFERENCES public.fournisseurs(id),
  reception_id UUID REFERENCES public.receptions_fournisseurs(id),
  montant NUMERIC(12,2) NOT NULL,
  mode_paiement TEXT NOT NULL DEFAULT 'Espèces',
  reference_paiement TEXT,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Activer RLS
ALTER TABLE public.paiements_fournisseurs ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS
CREATE POLICY "paiements_fournisseurs_select" ON public.paiements_fournisseurs
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "paiements_fournisseurs_insert" ON public.paiements_fournisseurs
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "paiements_fournisseurs_update" ON public.paiements_fournisseurs
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "paiements_fournisseurs_delete" ON public.paiements_fournisseurs
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- 4. Index pour performances
CREATE INDEX IF NOT EXISTS idx_paiements_fournisseurs_tenant ON public.paiements_fournisseurs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_paiements_fournisseurs_fournisseur ON public.paiements_fournisseurs(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_paiements_fournisseurs_reception ON public.paiements_fournisseurs(reception_id);
CREATE INDEX IF NOT EXISTS idx_paiements_fournisseurs_date ON public.paiements_fournisseurs(date_paiement DESC);