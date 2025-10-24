-- ===================================
-- Migration 07: Produits & Lots
-- ===================================

CREATE TABLE public.produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  libelle_produit TEXT NOT NULL, code_cip TEXT,
  famille_produit_id UUID REFERENCES public.famille_produit(id) ON DELETE SET NULL,
  rayon_produit_id UUID REFERENCES public.rayon_produit(id) ON DELETE SET NULL,
  categorie_tarification_id UUID REFERENCES public.categorie_tarification(id) ON DELETE SET NULL,
  prix_achat NUMERIC(15,2) DEFAULT 0, prix_vente_ht NUMERIC(15,2) DEFAULT 0, prix_vente_ttc NUMERIC(15,2) DEFAULT 0,
  tva NUMERIC(5,2) DEFAULT 0, centime_additionnel NUMERIC(5,2) DEFAULT 0,
  stock_limite INTEGER DEFAULT 0, stock_alerte INTEGER DEFAULT 0,
  niveau_detail INTEGER DEFAULT 1, id_produit_source UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  quantite_unites_details_source INTEGER,
  reference_agent_enregistrement_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  reference_agent_modification_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_produits_tenant_id ON public.produits(tenant_id);
CREATE INDEX idx_produits_libelle ON public.produits(libelle_produit);
CREATE INDEX idx_produits_famille_id ON public.produits(famille_produit_id);
CREATE TRIGGER update_produits_updated_at BEFORE UPDATE ON public.produits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_produits AFTER INSERT OR UPDATE OR DELETE ON public.produits FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();
CREATE TRIGGER detect_cross_tenant_produits BEFORE INSERT OR UPDATE ON public.produits FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TABLE public.lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  numero_lot TEXT NOT NULL, date_peremption DATE,
  quantite_initiale INTEGER NOT NULL, quantite_restante INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CHECK (quantite_restante >= 0),
  UNIQUE(tenant_id, numero_lot, produit_id)
);

CREATE INDEX idx_lots_tenant_id ON public.lots(tenant_id);
CREATE INDEX idx_lots_produit_id ON public.lots(produit_id);
CREATE INDEX idx_lots_date_peremption ON public.lots(date_peremption);
CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON public.lots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_lots AFTER INSERT OR UPDATE OR DELETE ON public.lots FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();
CREATE TRIGGER detect_cross_tenant_lots BEFORE INSERT OR UPDATE ON public.lots FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_produits" ON public.produits FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_lots" ON public.lots FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());