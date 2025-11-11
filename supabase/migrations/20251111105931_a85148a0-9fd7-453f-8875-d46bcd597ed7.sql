-- Correction de get_active_stock_alerts
-- 1. Correction structure UNION/ORDER BY (envelopper dans sous-requête)
-- 2. Suppression références à stock_alerte
-- 3. Utilisation de get_stock_threshold_cascade pour cascade à 3 niveaux

DROP FUNCTION IF EXISTS public.get_active_stock_alerts(UUID, INT) CASCADE;

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
  stock_actuel NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- ✅ Envelopper le UNION dans une sous-requête
  SELECT * FROM (
    WITH stock_data AS (
      SELECT 
        p.id,
        p.libelle_produit,
        COALESCE(SUM(l.quantite_restante), 0) as current_stock,
        -- ✅ UTILISER LA CASCADE pour les seuils dynamiques
        public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
        public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible
      FROM public.produits p
      LEFT JOIN public.lots l ON l.produit_id = p.id 
        AND l.tenant_id = p_tenant_id 
        AND l.quantite_restante > 0
      WHERE p.tenant_id = p_tenant_id AND p.is_active = true
      GROUP BY p.id, p.libelle_produit, p.stock_critique, p.stock_faible, p.stock_limite
    )
    -- Alertes critiques (stock > 0 ET stock <= seuil_critique)
    SELECT 
      gen_random_uuid() as alert_id,
      'stock_critique'::TEXT as alert_type,
      'error'::TEXT as alert_level,
      s.id as produit_id,
      s.libelle_produit as produit_nom,
      format('Stock critique: %s unités restantes', s.current_stock) as message,
      s.current_stock as stock_actuel,
      NOW() as created_at
    FROM stock_data s
    WHERE s.current_stock > 0 
      AND s.current_stock <= s.seuil_critique
    
    UNION ALL
    
    -- Alertes faibles (stock > seuil_critique ET stock <= seuil_faible)
    SELECT 
      gen_random_uuid() as alert_id,
      'stock_faible'::TEXT as alert_type,
      'warning'::TEXT as alert_level,
      s.id as produit_id,
      s.libelle_produit as produit_nom,
      format('Stock faible: %s unités', s.current_stock) as message,
      s.current_stock as stock_actuel,
      NOW() as created_at
    FROM stock_data s
    WHERE s.current_stock > s.seuil_critique
      AND s.current_stock <= s.seuil_faible
  ) alerts
  -- ✅ ORDER BY à l'extérieur de la sous-requête
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

GRANT EXECUTE ON FUNCTION public.get_active_stock_alerts(UUID, INT) TO authenticated;

COMMENT ON FUNCTION public.get_active_stock_alerts IS 
'Retourne les alertes actives (stock critique et faible uniquement, SANS les ruptures).
Utilise la cascade à 3 niveaux (produit → settings → défaut) via get_stock_threshold_cascade.
Structure UNION correcte avec ORDER BY en dehors de la sous-requête.';