-- Fix: Corriger ORDER BY dans get_active_stock_alerts
-- L'erreur 400 venait d'un ORDER BY invalide dans un contexte UNION ALL
-- Solution: envelopper le UNION dans une sous-requête et appliquer ORDER BY à l'extérieur

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
  SELECT * FROM (
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
      gen_random_uuid() as alert_id,
      'stock_critique'::TEXT as alert_type,
      'error'::TEXT as alert_level,
      s.id as produit_id,
      s.libelle_produit as produit_nom,
      format('Stock critique: %s unités restantes', s.current_stock) as message,
      s.current_stock::BIGINT as stock_actuel,
      NOW() as created_at
    FROM stock_data s
    WHERE s.current_stock > 0 
      AND s.current_stock <= public.get_stock_threshold('critical', s.stock_limite)
    
    UNION ALL
    
    -- Alertes stock faible (EXCLURE stock = 0)
    SELECT 
      gen_random_uuid() as alert_id,
      'stock_faible'::TEXT as alert_type,
      'warning'::TEXT as alert_level,
      s.id as produit_id,
      s.libelle_produit as produit_nom,
      format('Stock faible: %s unités', s.current_stock) as message,
      s.current_stock::BIGINT as stock_actuel,
      NOW() as created_at
    FROM stock_data s
    WHERE s.current_stock > public.get_stock_threshold('critical', s.stock_limite)
      AND s.current_stock <= public.get_stock_threshold('low', s.stock_limite)
  ) alerts
  ORDER BY 
    CASE alerts.alert_level 
      WHEN 'error' THEN 1 
      WHEN 'warning' THEN 2 
      ELSE 3 
    END,
    alerts.stock_actuel ASC
  LIMIT p_limit;
END;
$$;