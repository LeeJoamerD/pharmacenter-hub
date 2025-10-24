-- ===================================
-- Migration 08: Gestion Stock
-- ===================================

CREATE TABLE public.commandes_fournisseurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  fournisseur_id UUID NOT NULL REFERENCES public.fournisseurs(id) ON DELETE RESTRICT,
  agent_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  date_commande TIMESTAMPTZ DEFAULT now(),
  statut TEXT DEFAULT 'En cours' CHECK (statut IN ('En cours', 'Validée', 'Reçue', 'Annulée')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_commandes_fournisseurs_tenant_id ON public.commandes_fournisseurs(tenant_id);
CREATE TRIGGER update_commandes_fournisseurs_updated_at BEFORE UPDATE ON public.commandes_fournisseurs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_commandes_fournisseurs AFTER INSERT OR UPDATE OR DELETE ON public.commandes_fournisseurs FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.lignes_commande_fournisseur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  commande_id UUID NOT NULL REFERENCES public.commandes_fournisseurs(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE RESTRICT,
  quantite_commandee INTEGER NOT NULL, prix_achat_unitaire_attendu NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_lignes_commande_fournisseur_commande_id ON public.lignes_commande_fournisseur(commande_id);
CREATE TRIGGER update_lignes_commande_fournisseur_updated_at BEFORE UPDATE ON public.lignes_commande_fournisseur FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_lignes_commande_fournisseur AFTER INSERT OR UPDATE OR DELETE ON public.lignes_commande_fournisseur FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.receptions_fournisseurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  fournisseur_id UUID NOT NULL REFERENCES public.fournisseurs(id) ON DELETE RESTRICT,
  commande_id UUID REFERENCES public.commandes_fournisseurs(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  date_reception TIMESTAMPTZ DEFAULT now(), reference_facture TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_receptions_fournisseurs_tenant_id ON public.receptions_fournisseurs(tenant_id);
CREATE TRIGGER update_receptions_fournisseurs_updated_at BEFORE UPDATE ON public.receptions_fournisseurs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_receptions_fournisseurs AFTER INSERT OR UPDATE OR DELETE ON public.receptions_fournisseurs FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.lignes_reception_fournisseur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  reception_id UUID NOT NULL REFERENCES public.receptions_fournisseurs(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  quantite_recue INTEGER NOT NULL, prix_achat_unitaire_reel NUMERIC(15,2) NOT NULL, date_peremption DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_lignes_reception_fournisseur_reception_id ON public.lignes_reception_fournisseur(reception_id);
CREATE TRIGGER update_lignes_reception_fournisseur_updated_at BEFORE UPDATE ON public.lignes_reception_fournisseur FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_lignes_reception_fournisseur AFTER INSERT OR UPDATE OR DELETE ON public.lignes_reception_fournisseur FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.stock_mouvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  type_mouvement TEXT CHECK (type_mouvement IN ('Entrée', 'Sortie', 'Ajustement', 'Inventaire', 'Péremption', 'Perte')) NOT NULL,
  quantite INTEGER NOT NULL, reference_type TEXT, reference_id UUID, date_mouvement TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_stock_mouvements_tenant_id ON public.stock_mouvements(tenant_id);
CREATE INDEX idx_stock_mouvements_produit_id ON public.stock_mouvements(produit_id);
CREATE TRIGGER update_stock_mouvements_updated_at BEFORE UPDATE ON public.stock_mouvements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_stock_mouvements AFTER INSERT OR UPDATE OR DELETE ON public.stock_mouvements FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.inventaire_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE RESTRICT,
  date_debut TIMESTAMPTZ DEFAULT now(), date_fin TIMESTAMPTZ,
  statut TEXT DEFAULT 'En cours' CHECK (statut IN ('En cours', 'Terminé', 'Annulé')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_inventaire_sessions_tenant_id ON public.inventaire_sessions(tenant_id);
CREATE TRIGGER update_inventaire_sessions_updated_at BEFORE UPDATE ON public.inventaire_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_inventaire_sessions AFTER INSERT OR UPDATE OR DELETE ON public.inventaire_sessions FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.suggestions_vente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  priorite TEXT DEFAULT 'moyenne' CHECK (priorite IN ('faible', 'moyenne', 'haute')) NOT NULL,
  prix_vente_suggere NUMERIC(15,2) NOT NULL, remise_suggere NUMERIC(5,2) DEFAULT 0,
  motif_suggestion TEXT NOT NULL,
  statut TEXT DEFAULT 'active' CHECK (statut IN ('active', 'acceptée', 'rejetée', 'expirée')) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, lot_id, statut)
);

CREATE INDEX idx_suggestions_vente_tenant_id ON public.suggestions_vente(tenant_id);
CREATE TRIGGER update_suggestions_vente_updated_at BEFORE UPDATE ON public.suggestions_vente FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_sales_suggestions(p_tenant_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE suggestion_count INTEGER := 0; lot_record RECORD; suggested_price NUMERIC(15,2); suggested_discount NUMERIC(5,2); priority_level TEXT; suggestion_reason TEXT;
BEGIN
  DELETE FROM public.suggestions_vente WHERE tenant_id = p_tenant_id AND statut = 'active';
  FOR lot_record IN
    SELECT l.id as lot_id, l.produit_id, l.quantite_restante, p.prix_vente_ttc,
      CASE WHEN l.date_peremption IS NULL THEN NULL ELSE (l.date_peremption - CURRENT_DATE) END as days_to_expiry
    FROM public.lots l INNER JOIN public.produits p ON l.produit_id = p.id
    WHERE l.tenant_id = p_tenant_id AND l.quantite_restante > 0 AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
    ORDER BY l.date_peremption ASC NULLS LAST
  LOOP
    IF lot_record.days_to_expiry IS NULL THEN priority_level := 'faible'; suggested_discount := 0; suggestion_reason := 'Vente normale';
    ELSIF lot_record.days_to_expiry <= 30 THEN priority_level := 'haute'; suggested_discount := 15; suggestion_reason := 'Expire dans ' || lot_record.days_to_expiry || ' jours - URGENT';
    ELSIF lot_record.days_to_expiry <= 90 THEN priority_level := 'moyenne'; suggested_discount := 10; suggestion_reason := 'Expire dans ' || lot_record.days_to_expiry || ' jours';
    ELSE priority_level := 'faible'; suggested_discount := 5; suggestion_reason := 'Expire dans ' || lot_record.days_to_expiry || ' jours';
    END IF;
    suggested_price := lot_record.prix_vente_ttc * (1 - suggested_discount / 100);
    INSERT INTO public.suggestions_vente (tenant_id, lot_id, produit_id, priorite, prix_vente_suggere, remise_suggere, motif_suggestion, statut)
    VALUES (p_tenant_id, lot_record.lot_id, lot_record.produit_id, priority_level, suggested_price, suggested_discount, suggestion_reason, 'active');
    suggestion_count := suggestion_count + 1;
  END LOOP;
  RETURN suggestion_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_sales_suggestions(UUID) TO authenticated;

ALTER TABLE public.commandes_fournisseurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_commandes" ON public.commandes_fournisseurs FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.lignes_commande_fournisseur ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_lignes_commande" ON public.lignes_commande_fournisseur FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.receptions_fournisseurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_receptions" ON public.receptions_fournisseurs FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.lignes_reception_fournisseur ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_lignes_reception" ON public.lignes_reception_fournisseur FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.stock_mouvements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_mouvements" ON public.stock_mouvements FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.inventaire_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_inventaire" ON public.inventaire_sessions FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.suggestions_vente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_suggestions" ON public.suggestions_vente FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());