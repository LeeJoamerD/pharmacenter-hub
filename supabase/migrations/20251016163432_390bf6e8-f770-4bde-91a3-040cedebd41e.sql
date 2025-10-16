-- ===================================================================
-- FONCTIONS RPC POUR OPTIMISER LES REQUÊTES DE STOCK
-- Corrige la limitation de 1000 résultats de Supabase
-- ===================================================================

-- 1. Fonction pour calculer les métriques de stock faible
CREATE OR REPLACE FUNCTION calculate_low_stock_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_items INTEGER := 0;
  critical_items INTEGER := 0;
  low_items INTEGER := 0;
  attention_items INTEGER := 0;
  total_value NUMERIC := 0;
  result JSONB;
BEGIN
  -- Calculer les métriques de stock faible
  WITH product_stocks AS (
    SELECT 
      p.id,
      p.stock_limite,
      p.stock_alerte,
      p.prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock
    FROM produits p
    LEFT JOIN lots l ON p.id = l.produit_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_limite, p.stock_alerte, p.prix_achat
  )
  SELECT 
    COUNT(*) FILTER (WHERE stock_actuel <= COALESCE(stock_limite, 10)) as total,
    COUNT(*) FILTER (WHERE stock_actuel = 0 OR stock_actuel <= COALESCE(stock_limite, 10) * 0.3) as critique,
    COUNT(*) FILTER (WHERE stock_actuel > COALESCE(stock_limite, 10) * 0.3 AND stock_actuel <= COALESCE(stock_limite, 10)) as faible,
    COUNT(*) FILTER (WHERE stock_actuel > COALESCE(stock_limite, 10) AND stock_actuel <= COALESCE(stock_limite, 10) * 1.5) as attention,
    COALESCE(SUM(valeur_stock) FILTER (WHERE stock_actuel <= COALESCE(stock_limite, 10)), 0) as valeur_totale
  INTO total_items, critical_items, low_items, attention_items, total_value
  FROM product_stocks;
  
  result := jsonb_build_object(
    'totalItems', total_items,
    'criticalItems', critical_items,
    'lowItems', low_items,
    'attentionItems', attention_items,
    'totalValue', total_value,
    'urgentActions', critical_items
  );
  
  RETURN result;
END;
$$;

-- 2. Fonction pour calculer les métriques de rupture de stock
CREATE OR REPLACE FUNCTION calculate_out_of_stock_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_items INTEGER := 0;
  critical_items INTEGER := 0;
  rapid_rotation_items INTEGER := 0;
  recent_out_items INTEGER := 0;
  total_potential_loss NUMERIC := 0;
  result JSONB;
BEGIN
  -- Calculer les métriques de rupture
  WITH product_stocks AS (
    SELECT 
      p.id,
      p.stock_limite,
      p.prix_vente_ttc,
      p.updated_at,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      CASE 
        WHEN COALESCE(SUM(l.quantite_restante), 0) < COALESCE(p.stock_limite, 100) * 0.5 THEN 'rapide'
        WHEN COALESCE(SUM(l.quantite_restante), 0) < COALESCE(p.stock_limite, 100) THEN 'normale'
        ELSE 'lente'
      END as rotation
    FROM produits p
    LEFT JOIN lots l ON p.id = l.produit_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_limite, p.prix_vente_ttc, p.updated_at
    HAVING COALESCE(SUM(l.quantite_restante), 0) = 0
  )
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE rotation = 'rapide') as critique,
    COUNT(*) FILTER (WHERE rotation = 'rapide') as rapide,
    COUNT(*) FILTER (WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days') as recent,
    COALESCE(SUM(prix_vente_ttc * stock_limite), 0) as perte_potentielle
  INTO total_items, critical_items, rapid_rotation_items, recent_out_items, total_potential_loss
  FROM product_stocks;
  
  result := jsonb_build_object(
    'totalItems', total_items,
    'criticalItems', critical_items,
    'rapidRotationItems', rapid_rotation_items,
    'recentOutOfStockItems', recent_out_items,
    'totalPotentialLoss', total_potential_loss
  );
  
  RETURN result;
END;
$$;

-- 3. Fonction pour calculer les métriques de valorisation globale
CREATE OR REPLACE FUNCTION calculate_valuation_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_stock_value NUMERIC := 0;
  available_stock_value NUMERIC := 0;
  low_stock_value NUMERIC := 0;
  avg_value_per_product NUMERIC := 0;
  total_products INTEGER := 0;
  available_products INTEGER := 0;
  low_stock_products INTEGER := 0;
  out_of_stock_products INTEGER := 0;
  result JSONB;
BEGIN
  -- Calculer les métriques de valorisation
  WITH product_valuations AS (
    SELECT 
      p.id,
      p.stock_limite,
      p.stock_alerte,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock,
      CASE 
        WHEN COALESCE(SUM(l.quantite_restante), 0) = 0 THEN 'rupture'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_alerte, 10) THEN 'faible'
        ELSE 'disponible'
      END as statut
    FROM produits p
    LEFT JOIN lots l ON p.id = l.produit_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_limite, p.stock_alerte
  )
  SELECT 
    COALESCE(SUM(valeur_stock), 0) as total_val,
    COALESCE(SUM(valeur_stock) FILTER (WHERE statut = 'disponible'), 0) as available_val,
    COALESCE(SUM(valeur_stock) FILTER (WHERE statut = 'faible'), 0) as low_val,
    COUNT(*) as total_prod,
    COUNT(*) FILTER (WHERE statut = 'disponible') as available_prod,
    COUNT(*) FILTER (WHERE statut = 'faible') as low_prod,
    COUNT(*) FILTER (WHERE statut = 'rupture') as out_prod
  INTO total_stock_value, available_stock_value, low_stock_value, 
       total_products, available_products, low_stock_products, out_of_stock_products
  FROM product_valuations;
  
  -- Calculer la moyenne par produit
  IF total_products > 0 THEN
    avg_value_per_product := total_stock_value / total_products;
  END IF;
  
  result := jsonb_build_object(
    'totalStockValue', total_stock_value,
    'availableStockValue', available_stock_value,
    'lowStockValue', low_stock_value,
    'averageValuePerProduct', avg_value_per_product,
    'totalProducts', total_products,
    'availableProducts', available_products,
    'lowStockProducts', low_stock_products,
    'outOfStockProducts', out_of_stock_products
  );
  
  RETURN result;
END;
$$;

-- 4. Fonction pour calculer la valorisation par famille
CREATE OR REPLACE FUNCTION calculate_valuation_by_family(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_value NUMERIC;
BEGIN
  -- Calculer d'abord la valeur totale
  SELECT COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0)
  INTO total_value
  FROM produits p
  LEFT JOIN lots l ON p.id = l.produit_id AND l.quantite_restante > 0
  WHERE p.tenant_id = p_tenant_id AND p.is_active = true;
  
  -- Calculer par famille
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', f.id,
      'name', f.libelle_famille,
      'value', COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0),
      'quantity', COALESCE(SUM(l.quantite_restante), 0),
      'percentage', CASE WHEN total_value > 0 
        THEN (COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) / total_value * 100)
        ELSE 0 END,
      'productCount', COUNT(DISTINCT p.id)
    )
    ORDER BY COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) DESC
  )
  INTO result
  FROM famille_produit f
  LEFT JOIN produits p ON f.id = p.famille_id AND p.tenant_id = p_tenant_id AND p.is_active = true
  LEFT JOIN lots l ON p.id = l.produit_id AND l.quantite_restante > 0
  WHERE f.tenant_id = p_tenant_id
  GROUP BY f.id, f.libelle_famille
  HAVING COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) > 0;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 5. Fonction pour calculer la valorisation par rayon
CREATE OR REPLACE FUNCTION calculate_valuation_by_rayon(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_value NUMERIC;
BEGIN
  -- Calculer d'abord la valeur totale
  SELECT COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0)
  INTO total_value
  FROM produits p
  LEFT JOIN lots l ON p.id = l.produit_id AND l.quantite_restante > 0
  WHERE p.tenant_id = p_tenant_id AND p.is_active = true;
  
  -- Calculer par rayon
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'name', r.libelle_rayon,
      'value', COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0),
      'quantity', COALESCE(SUM(l.quantite_restante), 0),
      'percentage', CASE WHEN total_value > 0 
        THEN (COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) / total_value * 100)
        ELSE 0 END,
      'productCount', COUNT(DISTINCT p.id)
    )
    ORDER BY COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) DESC
  )
  INTO result
  FROM rayons_produits r
  LEFT JOIN produits p ON r.id = p.rayon_id AND p.tenant_id = p_tenant_id AND p.is_active = true
  LEFT JOIN lots l ON p.id = l.produit_id AND l.quantite_restante > 0
  WHERE r.tenant_id = p_tenant_id
  GROUP BY r.id, r.libelle_rayon
  HAVING COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) > 0;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;