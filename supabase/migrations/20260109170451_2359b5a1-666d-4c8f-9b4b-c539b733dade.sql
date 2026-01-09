-- Modifier la fonction get_product_lots pour inclure les colonnes de prix des lots
DROP FUNCTION IF EXISTS public.get_product_lots(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_product_lots(
  p_tenant_id UUID,
  p_product_id UUID
)
RETURNS TABLE (
  id UUID,
  numero_lot TEXT,
  quantite_restante INT,
  date_peremption DATE,
  prix_achat_unitaire NUMERIC,
  prix_vente_ht NUMERIC,
  prix_vente_ttc NUMERIC,
  taux_tva NUMERIC,
  montant_tva NUMERIC,
  taux_centime_additionnel NUMERIC,
  montant_centime_additionnel NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id, 
    l.numero_lot, 
    l.quantite_restante::INT, 
    l.date_peremption, 
    l.prix_achat_unitaire,
    COALESCE(l.prix_vente_ht, 0::NUMERIC) AS prix_vente_ht,
    COALESCE(l.prix_vente_ttc, 0::NUMERIC) AS prix_vente_ttc,
    COALESCE(l.taux_tva, 0::NUMERIC) AS taux_tva,
    COALESCE(l.montant_tva, 0::NUMERIC) AS montant_tva,
    COALESCE(l.taux_centime_additionnel, 0::NUMERIC) AS taux_centime_additionnel,
    COALESCE(l.montant_centime_additionnel, 0::NUMERIC) AS montant_centime_additionnel
  FROM lots l
  WHERE l.tenant_id = p_tenant_id
    AND l.produit_id = p_product_id
    AND l.quantite_restante > 0
  ORDER BY l.date_reception ASC, l.date_peremption ASC NULLS LAST;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_product_lots(UUID, UUID) TO authenticated;