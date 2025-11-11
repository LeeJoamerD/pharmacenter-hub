-- Corriger les fonctions RPC pour utiliser la logique de cascade à 3 niveaux
-- et supprimer les références à stock_alerte

-- 1) Corriger calculate_stock_metrics
DROP FUNCTION IF EXISTS calculate_stock_metrics(UUID);

CREATE OR REPLACE FUNCTION calculate_stock_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH stock_data AS (
    SELECT 
      p.id,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock,
      -- CASCADE à 3 niveaux via la fonction dédiée
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible,
      public.get_stock_threshold_cascade('maximum', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_maximum
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_critique, p.stock_faible, p.stock_limite
  )
  SELECT json_build_object(
    'totalProducts', COUNT(*)::int,
    'availableProducts', COUNT(*) FILTER (WHERE stock_actuel > seuil_faible)::int,
    'lowStockProducts', COUNT(*) FILTER (WHERE stock_actuel > seuil_critique AND stock_actuel <= seuil_faible)::int,
    'outOfStockProducts', COUNT(*) FILTER (WHERE stock_actuel = 0)::int,
    'criticalStockProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= seuil_critique)::int,
    'overstockProducts', COUNT(*) FILTER (WHERE stock_actuel > seuil_maximum)::int,
    'normalStockProducts', COUNT(*) FILTER (WHERE stock_actuel > seuil_faible AND stock_actuel <= seuil_maximum)::int,
    'fastMovingProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= seuil_faible)::int,
    'totalValue', COALESCE(SUM(valeur_stock), 0)::numeric
  ) INTO v_result
  FROM stock_data;
  
  RETURN v_result;
END;
$$;

-- 2) Corriger calculate_low_stock_metrics
DROP FUNCTION IF EXISTS calculate_low_stock_metrics(UUID);

CREATE OR REPLACE FUNCTION calculate_low_stock_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH product_stocks AS (
    SELECT 
      p.id,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock,
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible
    FROM produits p
    LEFT JOIN lots l ON p.id = l.produit_id 
      AND l.tenant_id = p_tenant_id
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_critique, p.stock_faible, p.stock_limite
  )
  SELECT jsonb_build_object(
    'totalItems', COUNT(*) FILTER (WHERE stock_actuel <= seuil_faible),
    'criticalItems', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= seuil_critique),
    'lowItems', COUNT(*) FILTER (WHERE stock_actuel > seuil_critique AND stock_actuel <= seuil_faible),
    'attentionItems', COUNT(*) FILTER (WHERE stock_actuel > seuil_faible * 1.1 AND stock_actuel <= seuil_faible * 1.5),
    'totalValue', COALESCE(SUM(valeur_stock) FILTER (WHERE stock_actuel <= seuil_faible), 0),
    'urgentActions', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= seuil_critique)
  ) INTO result
  FROM product_stocks;
  
  RETURN result;
END;
$$;

-- 3) Corriger calculate_valuation_metrics
DROP FUNCTION IF EXISTS calculate_valuation_metrics(UUID);

CREATE OR REPLACE FUNCTION calculate_valuation_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH product_valuations AS (
    SELECT 
      p.id,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock,
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible,
      CASE 
        WHEN COALESCE(SUM(l.quantite_restante), 0) = 0 THEN 'rupture'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) THEN 'critique'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) THEN 'faible'
        ELSE 'disponible'
      END as statut
    FROM produits p
    LEFT JOIN lots l ON p.id = l.produit_id 
      AND l.tenant_id = p_tenant_id
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_critique, p.stock_faible, p.stock_limite
  )
  SELECT jsonb_build_object(
    'totalStockValue', COALESCE(SUM(valeur_stock), 0),
    'availableStockValue', COALESCE(SUM(valeur_stock) FILTER (WHERE statut = 'disponible'), 0),
    'lowStockValue', COALESCE(SUM(valeur_stock) FILTER (WHERE statut IN ('faible', 'critique')), 0),
    'averageValuePerProduct', CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(valeur_stock), 0) / COUNT(*) ELSE 0 END,
    'totalProducts', COUNT(*),
    'availableProducts', COUNT(*) FILTER (WHERE statut = 'disponible'),
    'lowStockProducts', COUNT(*) FILTER (WHERE statut = 'faible'),
    'criticalStockProducts', COUNT(*) FILTER (WHERE statut = 'critique'),
    'outOfStockProducts', COUNT(*) FILTER (WHERE statut = 'rupture')
  ) INTO result
  FROM product_valuations;
  
  RETURN result;
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION calculate_stock_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_low_stock_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_valuation_metrics(UUID) TO authenticated;