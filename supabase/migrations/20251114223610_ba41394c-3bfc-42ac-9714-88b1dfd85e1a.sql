-- Fix: Corriger get_fast_moving_products pour éviter la duplication du stock
-- Le problème: LEFT JOIN avec lignes_ventes multiplie les lignes de lots
-- Solution: Utiliser la vue produits_with_stock qui calcule déjà le stock correctement

-- Drop toutes les surcharges existantes
DROP FUNCTION IF EXISTS public.get_fast_moving_products(UUID, INT, INT);
DROP FUNCTION IF EXISTS public.get_fast_moving_products(INT);
DROP FUNCTION IF EXISTS public.get_fast_moving_products();

-- Recréer la fonction correcte
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
    p.stock_actuel::BIGINT as stock_actuel,  -- ✅ Utiliser stock_actuel de la vue (déjà calculé correctement)
    CASE 
      WHEN p.stock_actuel = 0 THEN 0
      ELSE ROUND((COALESCE(SUM(lv.quantite), 0)::NUMERIC / p_days) / NULLIF(p.stock_actuel, 0), 2)
    END as rotation_jours,
    COALESCE(SUM(lv.quantite * lv.prix_unitaire_ttc), 0) as valeur_vendue
  FROM public.produits_with_stock p  -- ✅ Utiliser la vue au lieu de la table
  LEFT JOIN public.lignes_ventes lv ON lv.produit_id = p.id
  LEFT JOIN public.ventes v ON v.id = lv.vente_id 
    AND v.date_vente >= CURRENT_DATE - p_days
    AND v.tenant_id = p_tenant_id
  WHERE p.tenant_id = p_tenant_id AND p.is_active = true
  GROUP BY p.id, p.libelle_produit, p.code_cip, p.stock_actuel  -- ✅ Ajouter stock_actuel au GROUP BY
  HAVING COALESCE(SUM(lv.quantite), 0) > 0
  ORDER BY quantite_vendue DESC, rotation_jours DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_fast_moving_products IS 
'Retourne les produits à rotation rapide basés sur les ventes récentes. 
Utilise produits_with_stock pour éviter la duplication du stock lors des jointures avec lignes_ventes.';