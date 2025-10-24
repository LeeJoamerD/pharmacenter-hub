-- ===================================
-- Migration 06: Clients & Partenaires
-- ===================================

CREATE TYPE public.type_client AS ENUM ('Particulier', 'Assureur', 'Société', 'Conventionné');
CREATE TYPE public.statut_client AS ENUM ('Actif', 'Inactif', 'Suspendu');

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  type_client type_client DEFAULT 'Particulier' NOT NULL,
  statut statut_client DEFAULT 'Actif',
  nom_complet TEXT NOT NULL, telephone TEXT, telephone_whatsapp TEXT, email TEXT, adresse TEXT,
  date_naissance DATE, numero_cni TEXT,
  raison_sociale TEXT, niu TEXT, numero_registre_commerce TEXT, secteur_activite TEXT,
  numero_police TEXT, date_adhesion DATE, date_expiration_police DATE,
  plafond_mensuel NUMERIC(15,2), plafond_annuel NUMERIC(15,2), taux_couverture NUMERIC(5,2) DEFAULT 100,
  taux_remise_automatique NUMERIC(5,2) DEFAULT 0, limite_credit NUMERIC(15,2) DEFAULT 0, credit_actuel NUMERIC(15,2) DEFAULT 0,
  contact_nom TEXT, contact_fonction TEXT, contact_telephone TEXT, contact_email TEXT,
  metadata JSONB DEFAULT '{}', notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX idx_clients_type_client ON public.clients(type_client);
CREATE INDEX idx_clients_telephone ON public.clients(telephone);
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();
CREATE TRIGGER detect_cross_tenant_clients BEFORE INSERT OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_access_clients" ON public.clients FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());