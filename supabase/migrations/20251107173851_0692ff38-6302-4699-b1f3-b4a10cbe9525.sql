-- Fix: Corriger get_fast_moving_products pour utiliser prix_unitaire_ttc au lieu de prix_unitaire
CREATE OR REPLACE FUNCTION public.get_fast_moving_products(
  p_tenant_id UUID,
  p_days INT DEFAULT 30,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  produit_id UUID,
  libelle_produit TEXT,
  code_cip TEXT,
  quantite_vendue BIGINT,
  stock_actuel BIGINT,
  rotation_jours NUMERIC,
  valeur_vendue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.libelle_produit,
    p.code_cip,
    COALESCE(SUM(lv.quantite), 0)::BIGINT as quantite_vendue,
    COALESCE(SUM(l.quantite_restante), 0)::BIGINT as stock_actuel,
    CASE 
      WHEN COALESCE(SUM(l.quantite_restante), 0) = 0 THEN 0
      ELSE ROUND((COALESCE(SUM(lv.quantite), 0)::NUMERIC / p_days) / NULLIF(COALESCE(SUM(l.quantite_restante), 0), 0), 2)
    END as rotation_jours,
    COALESCE(SUM(lv.quantite * lv.prix_unitaire_ttc), 0) as valeur_vendue
  FROM public.produits p
  LEFT JOIN public.lots l ON l.produit_id = p.id AND l.quantite_restante > 0
  LEFT JOIN public.lignes_ventes lv ON lv.produit_id = p.id
  LEFT JOIN public.ventes v ON v.id = lv.vente_id 
    AND v.date_vente >= CURRENT_DATE - p_days
    AND v.tenant_id = p_tenant_id
  WHERE p.tenant_id = p_tenant_id AND p.is_active = true
  GROUP BY p.id, p.libelle_produit, p.code_cip
  HAVING COALESCE(SUM(lv.quantite), 0) > 0
  ORDER BY quantite_vendue DESC, rotation_jours DESC
  LIMIT p_limit;
END;
$$;