-- ===================================
-- Migration 05: Référentiels Base
-- ===================================

CREATE TABLE public.categorie_tarification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  libelle_categorie TEXT NOT NULL,
  taux_tva NUMERIC(5,2) DEFAULT 0, taux_centime_additionnel NUMERIC(5,2) DEFAULT 0,
  coefficient_prix_vente NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_categorie_tarification_tenant_id ON public.categorie_tarification(tenant_id);
CREATE TRIGGER update_categorie_tarification_updated_at BEFORE UPDATE ON public.categorie_tarification FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_categorie_tarification AFTER INSERT OR UPDATE OR DELETE ON public.categorie_tarification FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.famille_produit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  libelle_famille TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_famille_produit_tenant_id ON public.famille_produit(tenant_id);
CREATE TRIGGER update_famille_produit_updated_at BEFORE UPDATE ON public.famille_produit FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_famille_produit AFTER INSERT OR UPDATE OR DELETE ON public.famille_produit FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.rayon_produit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  libelle_rayon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_rayon_produit_tenant_id ON public.rayon_produit(tenant_id);
CREATE TRIGGER update_rayon_produit_updated_at BEFORE UPDATE ON public.rayon_produit FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_rayon_produit AFTER INSERT OR UPDATE OR DELETE ON public.rayon_produit FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.laboratoires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL, pays_siege TEXT, email_siege TEXT, email_delegation_local TEXT,
  telephone_appel_delegation_local TEXT, telephone_whatsapp_delegation_local TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_laboratoires_tenant_id ON public.laboratoires(tenant_id);
CREATE TRIGGER update_laboratoires_updated_at BEFORE UPDATE ON public.laboratoires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_laboratoires AFTER INSERT OR UPDATE OR DELETE ON public.laboratoires FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.fournisseurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  nom TEXT NOT NULL, adresse TEXT, telephone_appel TEXT, telephone_whatsapp TEXT, email TEXT, niu TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_fournisseurs_tenant_id ON public.fournisseurs(tenant_id);
CREATE TRIGGER update_fournisseurs_updated_at BEFORE UPDATE ON public.fournisseurs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_fournisseurs AFTER INSERT OR UPDATE OR DELETE ON public.fournisseurs FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.compte_depenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  libelle_compte TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_compte_depenses_tenant_id ON public.compte_depenses(tenant_id);
CREATE TRIGGER update_compte_depenses_updated_at BEFORE UPDATE ON public.compte_depenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_compte_depenses AFTER INSERT OR UPDATE OR DELETE ON public.compte_depenses FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TABLE public.sous_compte_depenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  compte_depenses_id UUID NOT NULL REFERENCES public.compte_depenses(id) ON DELETE CASCADE,
  libelle_sous_compte TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_sous_compte_depenses_tenant_id ON public.sous_compte_depenses(tenant_id);
CREATE TRIGGER update_sous_compte_depenses_updated_at BEFORE UPDATE ON public.sous_compte_depenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_sous_compte_depenses AFTER INSERT OR UPDATE OR DELETE ON public.sous_compte_depenses FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

ALTER TABLE public.categorie_tarification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_categorie" ON public.categorie_tarification FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.famille_produit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_famille" ON public.famille_produit FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.rayon_produit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_rayon" ON public.rayon_produit FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.laboratoires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_laboratoires" ON public.laboratoires FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_fournisseurs" ON public.fournisseurs FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.compte_depenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_compte" ON public.compte_depenses FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.sous_compte_depenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_sous_compte" ON public.sous_compte_depenses FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());