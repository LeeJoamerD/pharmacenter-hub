-- ============================================
-- CORRECTION COMPLETE DES FONCTIONS RPC
-- Étape 1: Suppression des fonctions existantes
-- Étape 2: Recréation avec la logique de cascade correcte
-- ============================================

-- Supprimer les fonctions existantes pour éviter les conflits de signature
DROP FUNCTION IF EXISTS public.get_stock_status_distribution(UUID);
DROP FUNCTION IF EXISTS public.get_top_critical_products(UUID, INT);
DROP FUNCTION IF EXISTS public.get_active_stock_alerts(UUID, INT);
DROP FUNCTION IF EXISTS public.get_dashboard_stock_metrics(UUID);

-- ÉTAPE 1: Créer la fonction de cascade pour les seuils
CREATE OR REPLACE FUNCTION public.get_stock_threshold_cascade(
  p_threshold_type TEXT,
  p_product_critical INTEGER,
  p_product_low INTEGER,
  p_product_max INTEGER,
  p_tenant_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_settings_critical INTEGER;
  v_settings_low INTEGER;
  v_settings_max INTEGER;
BEGIN
  -- Récupérer les seuils du tenant depuis alert_settings
  SELECT 
    critical_stock_threshold,
    low_stock_threshold,
    maximum_stock_threshold
  INTO 
    v_settings_critical,
    v_settings_low,
    v_settings_max
  FROM public.alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;
  
  -- Appliquer la CASCADE selon le type demandé
  -- COALESCE(valeur_produit, valeur_settings, valeur_defaut)
  RETURN CASE p_threshold_type
    WHEN 'critical' THEN COALESCE(p_product_critical, v_settings_critical, 2)
    WHEN 'low' THEN COALESCE(p_product_low, v_settings_low, 5)
    WHEN 'maximum' THEN COALESCE(p_product_max, v_settings_max, 10)
    ELSE 10
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_stock_threshold_cascade(TEXT, INTEGER, INTEGER, INTEGER, UUID) TO authenticated;

-- ÉTAPE 2: Corriger get_stock_status_distribution
CREATE OR REPLACE FUNCTION public.get_stock_status_distribution(p_tenant_id UUID)
RETURNS JSONB AS $$
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
        -- CASCADE complète avec les bonnes colonnes
        public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as critical_threshold,
        public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as low_threshold,
        public.get_stock_threshold_cascade('maximum', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as max_threshold
      FROM public.produits p
      LEFT JOIN public.lots l ON l.produit_id = p.id 
        AND l.tenant_id = p_tenant_id 
        AND l.quantite_restante > 0
      WHERE p.tenant_id = p_tenant_id AND p.is_active = true
      GROUP BY p.id, p.stock_critique, p.stock_faible, p.stock_limite
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_stock_status_distribution(UUID) TO authenticated;

-- ÉTAPE 3: Corriger get_top_critical_products
CREATE OR REPLACE FUNCTION public.get_top_critical_products(
  p_tenant_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  produit_id UUID,
  libelle_produit TEXT,
  code_cip TEXT,
  stock_actuel NUMERIC,
  stock_limite INTEGER,
  statut_stock TEXT,
  famille_libelle TEXT,
  valeur_stock NUMERIC,
  rotation NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stock_data AS (
    SELECT 
      p.id,
      p.libelle_produit,
      p.code_cip,
      p.stock_critique,
      p.stock_faible,
      p.stock_limite,
      COALESCE(f.libelle_famille, 'Non classé') as famille,
      COALESCE(SUM(l.quantite_restante), 0)::NUMERIC as stock_total,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur,
      -- CASCADE pour seuils
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      0::NUMERIC as rotation_calc
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    LEFT JOIN public.famille_produit f ON f.id = p.famille_id
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.code_cip, p.stock_critique, p.stock_faible, p.stock_limite, f.libelle_famille
  )
  SELECT 
    sd.id,
    sd.libelle_produit,
    sd.code_cip,
    sd.stock_total,
    sd.stock_limite,
    CASE 
      WHEN sd.stock_total = 0 THEN 'rupture'
      WHEN sd.stock_total <= sd.seuil_critique THEN 'critique'
      ELSE 'faible'
    END as statut,
    sd.famille,
    sd.valeur,
    sd.rotation_calc
  FROM stock_data sd
  WHERE sd.stock_total > 0 
    AND sd.stock_total <= sd.seuil_critique
  ORDER BY sd.stock_total ASC, sd.valeur DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_critical_products(UUID, INT) TO authenticated;

-- ÉTAPE 4: Corriger get_active_stock_alerts
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
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stock_data AS (
    SELECT 
      p.id,
      p.libelle_produit,
      COALESCE(SUM(l.quantite_restante), 0) as current_stock,
      -- CASCADE avec bonnes colonnes
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.stock_critique, p.stock_faible, p.stock_limite
  )
  -- Alertes critiques
  SELECT 
    gen_random_uuid(),
    'stock_critique'::TEXT,
    'error'::TEXT,
    s.id,
    s.libelle_produit,
    format('Stock critique: %s unités restantes', s.current_stock),
    s.current_stock::NUMERIC,
    NOW()
  FROM stock_data s
  WHERE s.current_stock > 0 
    AND s.current_stock <= s.seuil_critique
  UNION ALL
  -- Alertes faibles
  SELECT 
    gen_random_uuid(),
    'stock_faible'::TEXT,
    'warning'::TEXT,
    s.id,
    s.libelle_produit,
    format('Stock faible: %s unités', s.current_stock),
    s.current_stock::NUMERIC,
    NOW()
  FROM stock_data s
  WHERE s.current_stock > s.seuil_critique
    AND s.current_stock <= s.seuil_faible
  ORDER BY alert_level DESC, stock_actuel ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_stock_alerts(UUID, INT) TO authenticated;

-- ÉTAPE 5: Corriger get_dashboard_stock_metrics
CREATE OR REPLACE FUNCTION public.get_dashboard_stock_metrics(tenant_filter UUID)
RETURNS JSON AS $$
DECLARE
  v_critical_threshold INTEGER;
  v_low_threshold INTEGER;
  v_maximum_threshold INTEGER;
  total_value NUMERIC := 0;
  available_count INTEGER := 0;
  low_stock_count INTEGER := 0;
  out_of_stock_count INTEGER := 0;
BEGIN
  -- Récupérer les seuils du tenant depuis alert_settings
  SELECT 
    COALESCE(critical_stock_threshold, 2),
    COALESCE(low_stock_threshold, 5),
    COALESCE(maximum_stock_threshold, 10)
  INTO 
    v_critical_threshold,
    v_low_threshold,
    v_maximum_threshold
  FROM public.alert_settings
  WHERE tenant_id = tenant_filter
  LIMIT 1;
  
  -- Valeurs par défaut si pas de settings
  v_critical_threshold := COALESCE(v_critical_threshold, 2);
  v_low_threshold := COALESCE(v_low_threshold, 5);
  v_maximum_threshold := COALESCE(v_maximum_threshold, 10);
  
  -- Calculs avec CASCADE à 3 niveaux
  WITH stock_calculs AS (
    SELECT 
      p.id,
      p.prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) AS stock_reel,
      COALESCE(p.stock_critique, v_critical_threshold) AS seuil_critique,
      COALESCE(p.stock_faible, v_low_threshold) AS seuil_faible
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = tenant_filter 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = tenant_filter AND p.is_active = true
    GROUP BY p.id, p.stock_critique, p.stock_faible, p.prix_achat
  )
  SELECT 
    COALESCE(SUM(stock_reel * COALESCE(prix_achat, 0)), 0),
    COUNT(*) FILTER (WHERE stock_reel > seuil_faible),
    COUNT(*) FILTER (WHERE stock_reel > 0 AND stock_reel <= seuil_faible),
    COUNT(*) FILTER (WHERE stock_reel = 0)
  INTO total_value, available_count, low_stock_count, out_of_stock_count
  FROM stock_calculs;
  
  RETURN json_build_object(
    'totalValue', COALESCE(total_value, 0),
    'availableProducts', COALESCE(available_count, 0),
    'lowStockProducts', COALESCE(low_stock_count, 0),
    'outOfStockProducts', COALESCE(out_of_stock_count, 0),
    'totalProducts', COALESCE(available_count + low_stock_count + out_of_stock_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stock_metrics(UUID) TO authenticated;

-- Commentaires de documentation
COMMENT ON FUNCTION public.get_stock_threshold_cascade IS 
'Implémente la logique de cascade à 3 niveaux pour les seuils de stock: 
1. Valeur spécifique au produit (stock_critique, stock_faible, stock_limite)
2. Valeur du tenant (alert_settings)
3. Valeur par défaut (2, 5, 10)';

COMMENT ON FUNCTION public.get_stock_status_distribution IS 
'Retourne la distribution des statuts de stock avec calcul dynamique depuis les lots et logique de cascade';

COMMENT ON FUNCTION public.get_top_critical_products IS 
'Retourne les produits en stock critique avec calcul dynamique et cascade des seuils';

COMMENT ON FUNCTION public.get_active_stock_alerts IS 
'Retourne les alertes de stock actives avec cascade des seuils et calcul dynamique';

COMMENT ON FUNCTION public.get_dashboard_stock_metrics IS 
'Calcule les métriques de stock du dashboard avec cascade des seuils et calcul dynamique depuis les lots';