-- Fix Dashboard Stock: Exclure les produits en rupture des alertes et produits critiques
-- Les ruptures (stock = 0) ont leur propre section dédiée

-- 1. Corriger get_active_stock_alerts: Exclure les ruptures des alertes
CREATE OR REPLACE FUNCTION public.get_active_stock_alerts(
  p_tenant_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  alert_id UUID,
  alert_type TEXT,
  alert_level TEXT,
  produit_id UUID,
  produit_nom TEXT,
  message TEXT,
  stock_actuel BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stock_data AS (
    SELECT 
      p.id,
      p.libelle_produit,
      COALESCE(SUM(l.quantite_restante), 0) as current_stock,
      p.stock_limite,
      p.stock_alerte
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.stock_limite, p.stock_alerte
  )
  -- Alertes critique (EXCLURE stock = 0)
  SELECT 
    gen_random_uuid(),
    'stock_critique'::TEXT,
    'error'::TEXT,
    s.id,
    s.libelle_produit,
    format('Stock critique: %s unités restantes', s.current_stock),
    s.current_stock::BIGINT,
    NOW()
  FROM stock_data s
  WHERE s.current_stock > 0 
    AND s.current_stock <= public.get_stock_threshold('critical', s.stock_limite)
  UNION ALL
  -- Alertes stock faible (EXCLURE stock = 0)
  SELECT 
    gen_random_uuid(),
    'stock_faible'::TEXT,
    'warning'::TEXT,
    s.id,
    s.libelle_produit,
    format('Stock faible: %s unités', s.current_stock),
    s.current_stock::BIGINT,
    NOW()
  FROM stock_data s
  WHERE s.current_stock > public.get_stock_threshold('critical', s.stock_limite)
    AND s.current_stock <= public.get_stock_threshold('low', s.stock_limite)
  ORDER BY alert_level DESC, stock_actuel ASC
  LIMIT p_limit;
END;
$$;

-- 2. Corriger get_top_critical_products: Exclure les ruptures
CREATE OR REPLACE FUNCTION public.get_top_critical_products(
  p_tenant_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  produit_id UUID,
  libelle_produit TEXT,
  code_cip TEXT,
  stock_actuel BIGINT,
  stock_limite INT,
  statut_stock TEXT,
  famille_libelle TEXT,
  valeur_stock NUMERIC
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
    COALESCE(SUM(l.quantite_restante), 0)::BIGINT as stock_actuel,
    p.stock_limite,
    CASE 
      WHEN COALESCE(SUM(l.quantite_restante), 0) <= public.get_stock_threshold('critical', p.stock_limite) THEN 'critique'
      ELSE 'faible'
    END as statut_stock,
    COALESCE(f.libelle_famille, 'Non classé') as famille_libelle,
    COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock
  FROM public.produits p
  LEFT JOIN public.lots l ON l.produit_id = p.id AND l.quantite_restante > 0
  LEFT JOIN public.famille_produit f ON f.id = p.famille_id
  WHERE p.tenant_id = p_tenant_id AND p.is_active = true
  GROUP BY p.id, p.libelle_produit, p.code_cip, p.stock_limite, f.libelle_famille
  HAVING COALESCE(SUM(l.quantite_restante), 0) > 0
    AND COALESCE(SUM(l.quantite_restante), 0) <= public.get_stock_threshold('critical', p.stock_limite)
  ORDER BY stock_actuel ASC, valeur_stock DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_active_stock_alerts IS 'Retourne les alertes actives (stock critique et faible uniquement, SANS les ruptures qui ont leur propre section)';
COMMENT ON FUNCTION public.get_top_critical_products IS 'Retourne les produits en stock critique uniquement (SANS les ruptures stock=0)';
