
-- Tables proformas et lignes_proforma + RPC + RLS

CREATE TABLE public.proformas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  numero_proforma TEXT NOT NULL,
  date_proforma TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id UUID REFERENCES public.clients(id),
  client_nom TEXT,
  montant_total_ht NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_tva NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_total_ttc NUMERIC(15,2) NOT NULL DEFAULT 0,
  remise_globale NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_net NUMERIC(15,2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'En attente' CHECK (statut IN ('En attente', 'Convertie', 'Annulée', 'Expirée')),
  validite_jours INTEGER NOT NULL DEFAULT 30,
  date_expiration TIMESTAMPTZ,
  vente_id UUID REFERENCES public.ventes(id),
  agent_id TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lignes_proforma (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  proforma_id UUID NOT NULL REFERENCES public.proformas(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id),
  libelle_produit TEXT NOT NULL,
  code_cip TEXT,
  quantite NUMERIC(10,2) NOT NULL DEFAULT 1,
  prix_unitaire_ht NUMERIC(15,2) NOT NULL DEFAULT 0,
  prix_unitaire_ttc NUMERIC(15,2) NOT NULL DEFAULT 0,
  taux_tva NUMERIC(5,2) NOT NULL DEFAULT 0,
  remise_ligne NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_ligne_ttc NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proformas_tenant_id ON public.proformas(tenant_id);
CREATE INDEX idx_proformas_statut ON public.proformas(tenant_id, statut);
CREATE INDEX idx_proformas_date ON public.proformas(tenant_id, date_proforma DESC);
CREATE INDEX idx_proformas_client ON public.proformas(tenant_id, client_id);
CREATE INDEX idx_lignes_proforma_proforma ON public.lignes_proforma(proforma_id);

CREATE TRIGGER update_proformas_updated_at
  BEFORE UPDATE ON public.proformas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_proforma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proformas_select" ON public.proformas
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "proformas_insert" ON public.proformas
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
CREATE POLICY "proformas_update" ON public.proformas
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "lignes_proforma_select" ON public.lignes_proforma
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "lignes_proforma_insert" ON public.lignes_proforma
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE OR REPLACE FUNCTION public.generate_proforma_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date_prefix TEXT;
  v_sequence INTEGER;
  v_numero TEXT;
  v_lock_key BIGINT;
  v_start_of_day TIMESTAMPTZ;
  v_end_of_day TIMESTAMPTZ;
BEGIN
  v_date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  v_start_of_day := DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
  v_end_of_day := v_start_of_day + INTERVAL '1 day' - INTERVAL '1 microsecond';
  v_lock_key := hashtext(p_tenant_id::TEXT || 'PRO' || v_date_prefix);
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(numero_proforma FROM 'PRO-\d{8}-(\d{4})') AS INTEGER)),
    0
  ) + 1
  INTO v_sequence
  FROM public.proformas
  WHERE tenant_id = p_tenant_id
    AND date_proforma >= v_start_of_day
    AND date_proforma <= v_end_of_day
    AND numero_proforma LIKE 'PRO-' || v_date_prefix || '-%';
  
  v_numero := 'PRO-' || v_date_prefix || '-' || LPAD(v_sequence::TEXT, 4, '0');
  RETURN v_numero;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_proforma_number(UUID) TO authenticated;
