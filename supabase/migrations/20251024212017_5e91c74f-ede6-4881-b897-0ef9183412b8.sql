-- ===================================
-- Migration 09: Ventes & Caisse
-- ===================================

CREATE TYPE public.type_vente AS ENUM ('Comptant', 'Crédit', 'Assurance');
CREATE TYPE public.statut_vente AS ENUM ('En cours', 'Validée', 'Annulée', 'Remboursée');
CREATE TYPE public.mode_paiement AS ENUM ('Espèces', 'Mobile Money', 'Carte Bancaire', 'Chèque', 'Virement');

CREATE TABLE public.ventes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  numero_vente TEXT UNIQUE NOT NULL, date_vente TIMESTAMPTZ DEFAULT now(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, type_vente type_vente DEFAULT 'Comptant',
  montant_total_ht NUMERIC(15,2) DEFAULT 0 NOT NULL, montant_tva NUMERIC(15,2) DEFAULT 0,
  montant_total_ttc NUMERIC(15,2) DEFAULT 0 NOT NULL, remise_globale NUMERIC(15,2) DEFAULT 0,
  montant_net NUMERIC(15,2) DEFAULT 0 NOT NULL, montant_paye NUMERIC(15,2) DEFAULT 0,
  montant_rendu NUMERIC(15,2) DEFAULT 0, mode_paiement mode_paiement DEFAULT 'Espèces',
  taux_couverture_assurance NUMERIC(5,2) DEFAULT 0, montant_part_assurance NUMERIC(15,2) DEFAULT 0,
  montant_part_patient NUMERIC(15,2) DEFAULT 0, agent_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  statut statut_vente DEFAULT 'En cours', metadata JSONB DEFAULT '{}', notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_ventes_tenant_id ON public.ventes(tenant_id);
CREATE INDEX idx_ventes_date_vente ON public.ventes(date_vente);
CREATE TRIGGER update_ventes_updated_at BEFORE UPDATE ON public.ventes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_ventes AFTER INSERT OR UPDATE OR DELETE ON public.ventes FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.lignes_ventes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  vente_id UUID NOT NULL REFERENCES public.ventes(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  quantite INTEGER NOT NULL, prix_unitaire_ht NUMERIC(15,2) NOT NULL, prix_unitaire_ttc NUMERIC(15,2) NOT NULL,
  taux_tva NUMERIC(5,2) DEFAULT 0, remise_ligne NUMERIC(15,2) DEFAULT 0, montant_total_ligne NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_lignes_ventes_vente_id ON public.lignes_ventes(vente_id);
CREATE TRIGGER update_lignes_ventes_updated_at BEFORE UPDATE ON public.lignes_ventes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_lignes_ventes AFTER INSERT OR UPDATE OR DELETE ON public.lignes_ventes FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.sessions_caisse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE RESTRICT,
  date_ouverture TIMESTAMPTZ DEFAULT now(), date_fermeture TIMESTAMPTZ,
  fond_caisse_ouverture NUMERIC(15,2) DEFAULT 0, fond_caisse_fermeture NUMERIC(15,2),
  montant_total_ventes NUMERIC(15,2) DEFAULT 0, montant_total_encaissements NUMERIC(15,2) DEFAULT 0,
  ecart NUMERIC(15,2), statut TEXT DEFAULT 'Ouverte' CHECK (statut IN ('Ouverte', 'Fermée')), notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_sessions_caisse_tenant_id ON public.sessions_caisse(tenant_id);
CREATE TRIGGER update_sessions_caisse_updated_at BEFORE UPDATE ON public.sessions_caisse FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_sessions_caisse AFTER INSERT OR UPDATE OR DELETE ON public.sessions_caisse FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.encaissements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  vente_id UUID NOT NULL REFERENCES public.ventes(id) ON DELETE CASCADE,
  session_caisse_id UUID REFERENCES public.sessions_caisse(id) ON DELETE SET NULL,
  montant NUMERIC(15,2) NOT NULL, mode_paiement mode_paiement NOT NULL, date_encaissement TIMESTAMPTZ DEFAULT now(),
  reference_transaction TEXT, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_encaissements_vente_id ON public.encaissements(vente_id);
CREATE TRIGGER update_encaissements_updated_at BEFORE UPDATE ON public.encaissements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_encaissements AFTER INSERT OR UPDATE OR DELETE ON public.encaissements FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.mouvements_caisse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  session_caisse_id UUID NOT NULL REFERENCES public.sessions_caisse(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  type_mouvement TEXT CHECK (type_mouvement IN ('Entrée', 'Sortie', 'Ajustement')) NOT NULL,
  montant NUMERIC(15,2) NOT NULL, motif TEXT NOT NULL, date_mouvement TIMESTAMPTZ DEFAULT now(),
  reference TEXT, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_mouvements_caisse_session_id ON public.mouvements_caisse(session_caisse_id);
CREATE TRIGGER update_mouvements_caisse_updated_at BEFORE UPDATE ON public.mouvements_caisse FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_mouvements_caisse AFTER INSERT OR UPDATE OR DELETE ON public.mouvements_caisse FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_ventes" ON public.ventes FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.lignes_ventes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_lignes_ventes" ON public.lignes_ventes FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.sessions_caisse ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_sessions_caisse" ON public.sessions_caisse FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.encaissements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_encaissements" ON public.encaissements FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.mouvements_caisse ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_mouvements_caisse" ON public.mouvements_caisse FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());