-- Fix get_fast_moving_products function: use prix_unitaire_ttc instead of prix_unitaire
CREATE OR REPLACE FUNCTION public.get_fast_moving_products(
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  produit_id uuid,
  libelle_produit text,
  code_cip text,
  quantite_vendue bigint,
  valeur_vendue numeric,
  derniere_vente timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_tenant_id uuid;
BEGIN
  v_tenant_id := public.get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: tenant_id not found';
  END IF;

  RETURN QUERY
  SELECT 
    p.id as produit_id,
    p.libelle_produit,
    p.code_cip,
    COALESCE(SUM(lv.quantite), 0)::bigint as quantite_vendue,
    COALESCE(SUM(lv.quantite * lv.prix_unitaire_ttc), 0) as valeur_vendue,
    MAX(v.created_at) as derniere_vente
  FROM public.produits p
  LEFT JOIN public.lignes_ventes lv ON lv.produit_id = p.id AND lv.tenant_id = v_tenant_id
  LEFT JOIN public.ventes v ON v.id = lv.vente_id AND v.tenant_id = v_tenant_id
  WHERE 
    p.tenant_id = v_tenant_id
    AND p.is_active = true
    AND v.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY p.id, p.libelle_produit, p.code_cip
  HAVING COALESCE(SUM(lv.quantite), 0) > 0
  ORDER BY quantite_vendue DESC, valeur_vendue DESC
  LIMIT p_limit;
END;
$function$;