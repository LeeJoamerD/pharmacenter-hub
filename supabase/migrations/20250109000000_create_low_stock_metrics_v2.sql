-- Migration: Création de la RPC sécurisée pour les métriques de stock faible
-- Date: 2025-01-09
-- Objectif: Calculer les métriques de stock faible en excluant les ruptures et en utilisant les seuils configurés

-- Fonction pour récupérer le tenant de l'utilisateur authentifié (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- Récupérer le tenant depuis la table personnel
    SELECT p.tenant_id INTO current_tenant_id
    FROM personnel p
    WHERE p.auth_user_id = auth.uid()
    LIMIT 1;
    
    RETURN current_tenant_id;
END;
$$;

-- Fonction sécurisée pour calculer les métriques de stock faible
CREATE OR REPLACE FUNCTION calculate_low_stock_metrics_v2(
  p_critical_threshold INTEGER DEFAULT 5,
  p_low_threshold INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tenant_id UUID;
  critical_items INTEGER := 0;
  low_items INTEGER := 0;
  total_items INTEGER := 0;
  total_value NUMERIC := 0;
  result JSONB;
BEGIN
  -- Récupérer le tenant de l'utilisateur authentifié
  SELECT get_current_user_tenant_id() INTO current_tenant_id;
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié ou tenant non trouvé';
  END IF;

  -- Calculer les métriques avec exclusion des ruptures (stock = 0)
  WITH product_stocks AS (
    SELECT 
      p.id,
      p.stock_limite,
      p.prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock
    FROM produits p
    LEFT JOIN lots l ON p.id = l.produit_id AND l.quantite_restante > 0
    WHERE p.tenant_id = current_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_limite, p.prix_achat
    HAVING COALESCE(SUM(l.quantite_restante), 0) > 0  -- ✅ EXCLURE les ruptures (stock = 0)
  ),
  stock_status AS (
    SELECT 
      id,
      stock_actuel,
      valeur_stock,
      CASE 
        WHEN stock_actuel <= p_critical_threshold THEN 'critique'
        WHEN stock_actuel > p_critical_threshold AND stock_actuel <= p_low_threshold THEN 'faible'
        ELSE 'normal'
      END as statut_stock
    FROM product_stocks
  )
  SELECT 
    COUNT(*) FILTER (WHERE statut_stock = 'critique') as critique,
    COUNT(*) FILTER (WHERE statut_stock = 'faible') as faible,
    COUNT(*) FILTER (WHERE statut_stock IN ('critique', 'faible')) as total,
    COALESCE(SUM(valeur_stock) FILTER (WHERE statut_stock IN ('critique', 'faible')), 0) as valeur_totale
  INTO critical_items, low_items, total_items, total_value
  FROM stock_status;

  -- Construire le résultat JSON
  result := jsonb_build_object(
    'totalItems', total_items,
    'criticalItems', critical_items,
    'lowItems', low_items,
    'totalValue', total_value,
    'urgentActions', critical_items
  );

  RETURN result;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION calculate_low_stock_metrics_v2(INTEGER, INTEGER) TO authenticated;

-- Commentaire sur la fonction
COMMENT ON FUNCTION calculate_low_stock_metrics_v2(INTEGER, INTEGER) IS 
'Calcule les métriques de stock faible en excluant les ruptures (stock = 0) et en utilisant les seuils configurés. Version sécurisée qui récupère automatiquement le tenant de l''utilisateur authentifié.';