-- Phase 2: Création des RPC functions pour le dashboard unifié

-- RPC 1: Distribution complète des statuts de stock (optimisée)
CREATE OR REPLACE FUNCTION public.get_stock_status_distribution(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH product_status AS (
    SELECT 
      CASE 
        WHEN total_stock = 0 THEN 'rupture'
        WHEN total_stock <= critical_threshold THEN 'critique'
        WHEN total_stock <= low_threshold THEN 'faible'
        WHEN total_stock > max_threshold THEN 'surstock'
        ELSE 'normal'
      END as status
    FROM (
      SELECT 
        p.id,
        COALESCE(SUM(l.quantite_restante), 0) as total_stock,
        public.get_stock_threshold('critical', p.stock_limite) as critical_threshold,
        public.get_stock_threshold('low', p.stock_limite) as low_threshold,
        public.get_stock_threshold('maximum', p.stock_limite) as max_threshold
      FROM public.produits p
      LEFT JOIN public.lots l ON l.produit_id = p.id AND l.quantite_restante > 0
      WHERE p.tenant_id = p_tenant_id AND p.is_active = true
      GROUP BY p.id, p.stock_limite
    ) t
  )
  SELECT jsonb_build_object(
    'rupture', COUNT(*) FILTER (WHERE status = 'rupture'),
    'critique', COUNT(*) FILTER (WHERE status = 'critique'),
    'faible', COUNT(*) FILTER (WHERE status = 'faible'),
    'normal', COUNT(*) FILTER (WHERE status = 'normal'),
    'surstock', COUNT(*) FILTER (WHERE status = 'surstock'),
    'total', COUNT(*)
  ) INTO result FROM product_status;

  RETURN result;
END;
$$;

-- RPC 2: Top produits critiques avec détails
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
      WHEN COALESCE(SUM(l.quantite_restante), 0) = 0 THEN 'rupture'
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
  HAVING COALESCE(SUM(l.quantite_restante), 0) <= public.get_stock_threshold('critical', p.stock_limite)
  ORDER BY stock_actuel ASC, valeur_stock DESC
  LIMIT p_limit;
END;
$$;

-- RPC 3: Top produits à rotation rapide
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
    COALESCE(SUM(lv.quantite * lv.prix_unitaire), 0) as valeur_vendue
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

-- RPC 4: Alertes stock actives
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
  -- Alertes rupture
  SELECT 
    gen_random_uuid() as alert_id,
    'rupture'::TEXT as alert_type,
    'error'::TEXT as alert_level,
    s.id as produit_id,
    s.libelle_produit as produit_nom,
    format('Stock épuisé pour %s', s.libelle_produit) as message,
    s.current_stock::BIGINT as stock_actuel,
    NOW() as created_at
  FROM stock_data s
  WHERE s.current_stock = 0
  UNION ALL
  -- Alertes critique
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
  -- Alertes stock faible
  SELECT 
    gen_random_uuid(),
    'stock_faible'::TEXT,
    'warning'::TEXT,
    s.id,
    s.libelle_produit,
    format('Stock faible: %s unités restantes', s.current_stock),
    s.current_stock::BIGINT,
    NOW()
  FROM stock_data s
  WHERE s.current_stock > public.get_stock_threshold('critical', s.stock_limite)
    AND s.current_stock <= public.get_stock_threshold('low', s.stock_limite)
  ORDER BY alert_level DESC, stock_actuel ASC
  LIMIT p_limit;
END;
$$;

-- RPC 5: Créer les index de performance
CREATE INDEX IF NOT EXISTS idx_produits_tenant_active_stock 
  ON public.produits(tenant_id, is_active, stock_limite) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_lots_tenant_produit_stock_remaining 
  ON public.lots(tenant_id, produit_id, quantite_restante) 
  WHERE quantite_restante > 0;

CREATE INDEX IF NOT EXISTS idx_stock_mouvements_tenant_date 
  ON public.stock_mouvements(tenant_id, date_mouvement DESC);

CREATE INDEX IF NOT EXISTS idx_lignes_ventes_produit 
  ON public.lignes_ventes(produit_id, vente_id);

CREATE INDEX IF NOT EXISTS idx_ventes_tenant_date 
  ON public.ventes(tenant_id, date_vente DESC);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_stock_status_distribution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_critical_products(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fast_moving_products(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_stock_alerts(UUID, INT) TO authenticated;