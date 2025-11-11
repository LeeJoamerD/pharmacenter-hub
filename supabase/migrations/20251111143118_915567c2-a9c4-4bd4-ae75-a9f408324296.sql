-- ============================================================================
-- CORRECTION COMPLÈTE DE TOUTES LES FONCTIONS RPC DU DASHBOARD STOCK
-- ============================================================================
-- Problèmes corrigés :
-- 1. get_active_stock_alerts : Type mismatch INTEGER vs NUMERIC
-- 2. get_stock_status_distribution : Manque calcul stock_actuel + cascade
-- 3. get_top_critical_products : N'utilise pas get_stock_threshold_cascade
-- 4. get_fast_moving_products : Vérification types BIGINT vs NUMERIC
-- ============================================================================

-- ============================================================================
-- 1. CORRECTION get_active_stock_alerts
-- ============================================================================
-- Problème: stock_actuel retourne INTEGER au lieu de NUMERIC déclaré
-- Solution: Cast explicite vers NUMERIC dans les CTEs

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
  WITH stock_data AS (
    SELECT 
      p.id,
      p.libelle_produit,
      COALESCE(SUM(l.quantite_restante), 0)::NUMERIC as current_stock,
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.stock_critique, p.stock_faible, p.stock_limite
  ),
  all_alerts AS (
    -- Alertes critiques (stock > 0 ET stock <= seuil_critique)
    SELECT 
      gen_random_uuid() as alert_id,
      'stock_critique'::TEXT as alert_type,
      'error'::TEXT as alert_level,
      s.id as produit_id,
      s.libelle_produit as produit_nom,
      format('Stock critique: %s unités restantes', s.current_stock) as message,
      s.current_stock as stock_actuel,
      NOW() as created_at,
      1 as priority
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
      NOW() as created_at,
      2 as priority
    FROM stock_data s
    WHERE s.current_stock > s.seuil_critique
      AND s.current_stock <= s.seuil_faible
  )
  SELECT 
    a.alert_id,
    a.alert_type,
    a.alert_level,
    a.produit_id,
    a.produit_nom,
    a.message,
    a.stock_actuel,
    a.created_at
  FROM all_alerts a
  ORDER BY a.priority ASC, a.stock_actuel ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_stock_alerts(UUID, INT) TO authenticated;

COMMENT ON FUNCTION public.get_active_stock_alerts IS 
'Retourne les alertes actives (stock critique et faible uniquement).
Utilise la cascade à 3 niveaux via get_stock_threshold_cascade.
Cast explicite vers NUMERIC pour cohérence de type avec RETURNS TABLE.';

-- ============================================================================
-- 2. CORRECTION get_stock_status_distribution
-- ============================================================================
-- Problème: N'utilise pas stock_actuel calculé + pas de cascade
-- Solution: CTE avec calcul stock + cascade complète

DROP FUNCTION IF EXISTS public.get_stock_status_distribution(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.get_stock_status_distribution(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH stock_calculs AS (
    SELECT 
      p.id,
      COALESCE(SUM(l.quantite_restante), 0)::NUMERIC as stock_actuel,
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible,
      public.get_stock_threshold_cascade('maximum', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_maximum
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_critique, p.stock_faible, p.stock_limite
  )
  SELECT jsonb_build_object(
    'available', COUNT(*) FILTER (WHERE stock_actuel > seuil_faible),
    'low', COUNT(*) FILTER (WHERE stock_actuel > seuil_critique AND stock_actuel <= seuil_faible),
    'critical', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= seuil_critique),
    'outOfStock', COUNT(*) FILTER (WHERE stock_actuel = 0),
    'overstock', COUNT(*) FILTER (WHERE seuil_maximum IS NOT NULL AND stock_actuel > seuil_maximum)
  ) INTO v_result
  FROM stock_calculs;

  RETURN COALESCE(v_result, '{"available":0,"low":0,"critical":0,"outOfStock":0,"overstock":0}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_stock_status_distribution(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_stock_status_distribution IS 
'Retourne la distribution des statuts de stock avec CASCADE COMPLÈTE à 3 niveaux.
Calcule stock_actuel depuis lots + utilise get_stock_threshold_cascade pour tous les seuils.';

-- ============================================================================
-- 3. CORRECTION get_top_critical_products
-- ============================================================================
-- Problème: N'utilise pas get_stock_threshold_cascade
-- Solution: Remplacer COALESCE simple par cascade complète

DROP FUNCTION IF EXISTS public.get_top_critical_products(UUID, INT) CASCADE;

CREATE OR REPLACE FUNCTION public.get_top_critical_products(
  p_tenant_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  produit_id UUID,
  libelle_produit TEXT,
  stock_actuel NUMERIC,
  stock_critique NUMERIC,
  stock_faible NUMERIC,
  pourcentage_critique NUMERIC,
  jours_rupture_estimee INTEGER
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
      COALESCE(SUM(l.quantite_restante), 0)::NUMERIC as stock_total,
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible,
      COALESCE(
        (SELECT AVG(lv.quantite) 
         FROM lignes_ventes lv 
         JOIN ventes v ON v.id = lv.vente_id 
         WHERE lv.produit_id = p.id 
           AND v.tenant_id = p_tenant_id
           AND v.date_vente >= CURRENT_DATE - INTERVAL '30 days'
        ), 0
      ) as ventes_moyennes_jour
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.stock_critique, p.stock_faible, p.stock_limite
  )
  SELECT 
    sd.id AS produit_id,
    sd.libelle_produit,
    sd.stock_total as stock_actuel,
    sd.seuil_critique as stock_critique,
    sd.seuil_faible as stock_faible,
    ROUND((sd.stock_total / NULLIF(sd.seuil_critique, 0) * 100)::NUMERIC, 2) as pourcentage_critique,
    CASE 
      WHEN sd.ventes_moyennes_jour > 0 
      THEN FLOOR(sd.stock_total / sd.ventes_moyennes_jour)::INTEGER
      ELSE NULL
    END as jours_rupture_estimee
  FROM stock_data sd
  WHERE sd.stock_total > 0 
    AND sd.stock_total <= sd.seuil_critique
  ORDER BY 
    (sd.stock_total / NULLIF(sd.seuil_critique, 0)) ASC,
    sd.stock_total ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_critical_products(UUID, INT) TO authenticated;

COMMENT ON FUNCTION public.get_top_critical_products IS 
'Retourne les produits en stock critique avec CASCADE COMPLÈTE à 3 niveaux.
Utilise get_stock_threshold_cascade pour cohérence totale.';

-- ============================================================================
-- 4. VÉRIFICATION get_fast_moving_products (types déjà corrects)
-- ============================================================================
-- Cette fonction utilise déjà BIGINT de façon cohérente pour les quantités
-- et NUMERIC pour les calculs, donc pas de correction nécessaire.
-- Les types sont :
-- - quantite_vendue : BIGINT (correct pour SUM de quantités INTEGER)
-- - stock_actuel : BIGINT (correct pour SUM de quantité_restante INTEGER)
-- - rotation_jours : NUMERIC (correct pour calcul de division)
-- - valeur_vendue : NUMERIC (correct pour calcul monétaire)

-- ============================================================================
-- 5. VÉRIFICATION calculate_valuation_by_family (types déjà corrects)
-- ============================================================================
-- Cette fonction retourne JSONB et utilise NUMERIC pour les calculs
-- monétaires, ce qui est correct. Pas de correction nécessaire.

-- ============================================================================
-- RÉSUMÉ DES CORRECTIONS
-- ============================================================================
-- ✅ get_active_stock_alerts : Cast NUMERIC + cascade complète
-- ✅ get_stock_status_distribution : Calcul stock_actuel + cascade complète
-- ✅ get_top_critical_products : Cascade complète via get_stock_threshold_cascade
-- ✅ get_fast_moving_products : Vérification OK - types cohérents
-- ✅ calculate_valuation_by_family : Vérification OK - types cohérents
-- ============================================================================