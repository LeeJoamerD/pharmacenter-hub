-- =====================================================
-- COMPLETION 2: TABLES MANQUANTES
-- =====================================================

-- Table encaissements
CREATE TABLE IF NOT EXISTS public.encaissements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vente_id UUID NOT NULL REFERENCES public.ventes(id),
  session_caisse_id UUID REFERENCES public.sessions_caisse(id),
  numero_encaissement TEXT NOT NULL,
  caissier_id UUID NOT NULL REFERENCES public.personnel(id),
  montant_a_encaisser NUMERIC NOT NULL,
  montant_recu NUMERIC NOT NULL DEFAULT 0.00,
  montant_rendu NUMERIC NOT NULL DEFAULT 0.00,
  mode_paiement TEXT NOT NULL,
  reference_paiement TEXT,
  statut TEXT NOT NULL DEFAULT 'En cours',
  date_encaissement TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_numero_encaissement UNIQUE(tenant_id, numero_encaissement),
  CONSTRAINT check_mode_paiement CHECK (
    mode_paiement IN ('Espèces', 'Carte', 'Mobile Money', 'Chèque', 'Crédit', 'Mixte')
  ),
  CONSTRAINT check_statut_encaissement CHECK (statut IN ('En cours', 'Validé', 'Annulé')),
  CONSTRAINT check_montants CHECK (
    montant_a_encaisser >= 0 AND montant_recu >= 0 AND montant_rendu >= 0
  )
);

ALTER TABLE public.encaissements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.encaissements
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_insert" ON public.encaissements
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_update" ON public.encaissements
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_delete" ON public.encaissements
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

CREATE TRIGGER trigger_update_encaissements_timestamp
  BEFORE UPDATE ON public.encaissements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table suggestions_vente
CREATE TABLE IF NOT EXISTS public.suggestions_vente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lot_id UUID NOT NULL REFERENCES public.lots_produit(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  priorite TEXT NOT NULL CHECK (priorite IN ('haute', 'moyenne', 'faible')) DEFAULT 'moyenne',
  prix_vente_suggere NUMERIC(15,2) NOT NULL,
  remise_suggere NUMERIC(5,2) DEFAULT 0.00,
  motif_suggestion TEXT NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('active', 'ignoree', 'vendue', 'promue')) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_suggestion_per_lot UNIQUE(tenant_id, lot_id, statut)
);

ALTER TABLE public.suggestions_vente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.suggestions_vente
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_insert" ON public.suggestions_vente
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_update" ON public.suggestions_vente
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_delete" ON public.suggestions_vente
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

CREATE TRIGGER trigger_update_suggestions_vente_timestamp
  BEFORE UPDATE ON public.suggestions_vente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour suggestions_vente
CREATE INDEX idx_suggestions_vente_tenant_statut ON public.suggestions_vente(tenant_id, statut);
CREATE INDEX idx_suggestions_vente_priorite ON public.suggestions_vente(priorite);
CREATE INDEX idx_suggestions_vente_lot ON public.suggestions_vente(lot_id);
CREATE INDEX idx_suggestions_vente_produit ON public.suggestions_vente(produit_id);
CREATE INDEX idx_suggestions_vente_created_at ON public.suggestions_vente(created_at);

-- Index pour encaissements
CREATE INDEX idx_encaissements_tenant_date ON public.encaissements(tenant_id, date_encaissement DESC);
CREATE INDEX idx_encaissements_vente ON public.encaissements(vente_id);
CREATE INDEX idx_encaissements_session ON public.encaissements(session_caisse_id);
CREATE INDEX idx_encaissements_caissier ON public.encaissements(caissier_id);
CREATE INDEX idx_encaissements_statut ON public.encaissements(statut);