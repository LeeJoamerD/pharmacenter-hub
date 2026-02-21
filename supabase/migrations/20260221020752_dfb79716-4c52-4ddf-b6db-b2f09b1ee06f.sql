
-- Phase 1.1: Ajouter assureur_id à la table ventes
ALTER TABLE public.ventes ADD COLUMN IF NOT EXISTS assureur_id UUID REFERENCES public.assureurs(id);
CREATE INDEX IF NOT EXISTS idx_ventes_assureur_id ON public.ventes(assureur_id);

-- Phase 1.1b: Ajouter assureur_id à la table factures
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS assureur_id UUID REFERENCES public.assureurs(id);

-- Phase 1.2: Créer la table details_vente_bon
CREATE TABLE IF NOT EXISTS public.details_vente_bon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id),
  vente_id UUID NOT NULL REFERENCES public.ventes(id) ON DELETE CASCADE,
  nom_beneficiaire TEXT NOT NULL,
  lien TEXT,
  matricule_agent TEXT,
  matricule_patient TEXT,
  numero_police TEXT,
  numero_bon TEXT,
  type_piece TEXT,
  reference_piece TEXT,
  telephone_agent TEXT,
  adresse_agent TEXT,
  medecin_traitant TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_details_vente_bon_vente_id ON public.details_vente_bon(vente_id);
CREATE INDEX IF NOT EXISTS idx_details_vente_bon_tenant_id ON public.details_vente_bon(tenant_id);

-- RLS pour details_vente_bon
ALTER TABLE public.details_vente_bon ENABLE ROW LEVEL SECURITY;

CREATE POLICY "details_vente_bon_select" ON public.details_vente_bon
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "details_vente_bon_insert" ON public.details_vente_bon
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "details_vente_bon_update" ON public.details_vente_bon
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "details_vente_bon_delete" ON public.details_vente_bon
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id());

-- Phase 1.3: RPC get_unbilled_sales_by_insurer
CREATE OR REPLACE FUNCTION public.get_unbilled_sales_by_insurer(
  p_tenant_id UUID,
  p_assureur_id UUID
)
RETURNS TABLE (
  id UUID,
  numero_vente TEXT,
  date_vente TIMESTAMPTZ,
  client_nom TEXT,
  montant_total_ht NUMERIC,
  montant_tva NUMERIC,
  montant_total_ttc NUMERIC,
  montant_part_assurance NUMERIC,
  montant_part_patient NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id, 
    v.numero_vente, 
    v.date_vente,
    c.nom_complet as client_nom,
    COALESCE(v.montant_total_ht, 0) as montant_total_ht,
    COALESCE(v.montant_tva, 0) as montant_tva,
    COALESCE(v.montant_total_ttc, 0) as montant_total_ttc,
    COALESCE(v.montant_part_assurance, 0) as montant_part_assurance,
    COALESCE(v.montant_part_patient, 0) as montant_part_patient
  FROM public.ventes v
  LEFT JOIN public.clients c ON c.id = v.client_id
  WHERE v.tenant_id = p_tenant_id
    AND v.assureur_id = p_assureur_id
    AND COALESCE(v.montant_part_assurance, 0) > 0
    AND v.statut = 'Validée'
    AND (v.facture_generee = false OR v.facture_generee IS NULL)
  ORDER BY v.date_vente DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unbilled_sales_by_insurer(UUID, UUID) TO authenticated;

-- Phase 1.4: Update get_unbilled_sales_by_client to return montant_part_patient for insured clients
CREATE OR REPLACE FUNCTION public.get_unbilled_sales_by_client(
  p_tenant_id UUID,
  p_client_id UUID
)
RETURNS TABLE (
  id UUID,
  numero_vente TEXT,
  date_vente TIMESTAMPTZ,
  montant_total_ht NUMERIC,
  montant_tva NUMERIC,
  montant_total_ttc NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id, 
    v.numero_vente, 
    v.date_vente, 
    COALESCE(v.montant_total_ht, 0) as montant_total_ht,
    COALESCE(v.montant_tva, 0) as montant_tva,
    -- Si le client est couvert par assurance, afficher la part patient au lieu du TTC complet
    CASE 
      WHEN COALESCE(v.montant_part_assurance, 0) > 0 
      THEN COALESCE(v.montant_part_patient, v.montant_net)
      ELSE COALESCE(v.montant_total_ttc, 0)
    END as montant_total_ttc
  FROM public.ventes v
  WHERE v.tenant_id = p_tenant_id
    AND v.client_id = p_client_id
    AND v.statut = 'Validée'
    AND (v.facture_generee = false OR v.facture_generee IS NULL)
    -- Exclure les ventes dont la totalité est à la charge de l'assureur (part patient = 0)
    AND (COALESCE(v.montant_part_patient, v.montant_net) > 0 OR COALESCE(v.montant_part_assurance, 0) = 0)
  ORDER BY v.date_vente DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unbilled_sales_by_client(UUID, UUID) TO authenticated;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_details_vente_bon_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_details_vente_bon_updated_at
  BEFORE UPDATE ON public.details_vente_bon
  FOR EACH ROW
  EXECUTE FUNCTION public.update_details_vente_bon_updated_at();

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
