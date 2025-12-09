-- Phase 1: Ajouter les colonnes de suivi aux tables ventes et receptions_fournisseurs

-- 1.1 Modification de la table ventes
ALTER TABLE public.ventes 
ADD COLUMN IF NOT EXISTS facture_generee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS facture_id UUID REFERENCES public.factures(id) ON DELETE SET NULL;

-- Index pour optimiser les recherches de ventes non facturées par client
CREATE INDEX IF NOT EXISTS idx_ventes_facture_client 
ON public.ventes(tenant_id, client_id, facture_generee) 
WHERE facture_generee = false OR facture_generee IS NULL;

-- 1.2 Modification de la table receptions_fournisseurs
ALTER TABLE public.receptions_fournisseurs 
ADD COLUMN IF NOT EXISTS facture_generee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS facture_id UUID REFERENCES public.factures(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS montant_ht NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_tva NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_centime_additionnel NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_ttc NUMERIC(15,2) DEFAULT 0;

-- Index pour optimiser les recherches de réceptions non facturées par fournisseur
CREATE INDEX IF NOT EXISTS idx_receptions_facture_fournisseur 
ON public.receptions_fournisseurs(tenant_id, fournisseur_id, facture_generee)
WHERE facture_generee = false OR facture_generee IS NULL;

-- Phase 2: RPC pour calculer les totaux des réceptions (avec pagination)
CREATE OR REPLACE FUNCTION public.calculate_reception_totals(p_reception_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_ht NUMERIC := 0;
  v_total_tva NUMERIC := 0;
  v_total_ca NUMERIC := 0;
  v_total_ttc NUMERIC := 0;
  v_offset INT := 0;
  v_limit INT := 1000;
  v_batch_count INT;
  rec RECORD;
BEGIN
  -- Boucle de pagination pour traiter TOUTES les lignes (>1000)
  LOOP
    v_batch_count := 0;
    
    FOR rec IN 
      SELECT 
        COALESCE(l.quantite_recue, 0) as quantite_recue,
        COALESCE(l.prix_achat_unitaire_reel, l.prix_achat_unitaire, 0) as prix_unitaire,
        COALESCE(p.tva, 0) as taux_tva,
        COALESCE(p.centime_additionnel, 0) as taux_ca
      FROM public.lignes_reception_fournisseur l
      LEFT JOIN public.produits p ON p.id = l.produit_id
      WHERE l.reception_id = p_reception_id
      ORDER BY l.id
      OFFSET v_offset LIMIT v_limit
    LOOP
      v_batch_count := v_batch_count + 1;
      v_total_ht := v_total_ht + (rec.quantite_recue * rec.prix_unitaire);
      v_total_tva := v_total_tva + (rec.quantite_recue * rec.prix_unitaire * rec.taux_tva / 100);
      v_total_ca := v_total_ca + (rec.quantite_recue * rec.prix_unitaire * rec.taux_ca / 100);
    END LOOP;
    
    EXIT WHEN v_batch_count < v_limit;
    v_offset := v_offset + v_limit;
  END LOOP;
  
  v_total_ttc := v_total_ht + v_total_tva + v_total_ca;
  
  -- Mise à jour de la réception avec les totaux calculés
  UPDATE public.receptions_fournisseurs 
  SET 
    montant_ht = v_total_ht,
    montant_tva = v_total_tva,
    montant_centime_additionnel = v_total_ca,
    montant_ttc = v_total_ttc,
    updated_at = NOW()
  WHERE id = p_reception_id;
  
  RETURN jsonb_build_object(
    'montant_ht', v_total_ht,
    'montant_tva', v_total_tva,
    'montant_centime_additionnel', v_total_ca,
    'montant_ttc', v_total_ttc
  );
END;
$$;

-- Phase 3: RPC pour les ventes non facturées d'un client
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
    COALESCE(v.montant_total_ttc, 0) as montant_total_ttc
  FROM public.ventes v
  WHERE v.tenant_id = p_tenant_id
    AND v.client_id = p_client_id
    AND v.statut = 'Validée'
    AND (v.facture_generee = false OR v.facture_generee IS NULL)
  ORDER BY v.date_vente DESC;
END;
$$;

-- Phase 3: RPC pour les réceptions non facturées d'un fournisseur
CREATE OR REPLACE FUNCTION public.get_unbilled_receptions_by_supplier(
  p_tenant_id UUID,
  p_fournisseur_id UUID
)
RETURNS TABLE (
  id UUID,
  numero_reception TEXT,
  reference_facture TEXT,
  date_reception TIMESTAMPTZ,
  montant_ht NUMERIC,
  montant_tva NUMERIC,
  montant_centime_additionnel NUMERIC,
  montant_ttc NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, 
    r.numero_reception, 
    r.reference_facture, 
    r.date_reception,
    COALESCE(r.montant_ht, 0) as montant_ht,
    COALESCE(r.montant_tva, 0) as montant_tva,
    COALESCE(r.montant_centime_additionnel, 0) as montant_centime_additionnel,
    COALESCE(r.montant_ttc, 0) as montant_ttc
  FROM public.receptions_fournisseurs r
  WHERE r.tenant_id = p_tenant_id
    AND r.fournisseur_id = p_fournisseur_id
    AND (r.statut = 'Terminée' OR r.statut = 'terminee' OR r.statut = 'Validée')
    AND (r.facture_generee = false OR r.facture_generee IS NULL)
  ORDER BY r.date_reception DESC;
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.calculate_reception_totals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unbilled_sales_by_client(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unbilled_receptions_by_supplier(UUID, UUID) TO authenticated;