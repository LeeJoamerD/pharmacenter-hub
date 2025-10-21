-- ===================================================================
-- CORRECTION DE LA RPC calculate_low_stock_metrics
-- Problème: inclut les ruptures (stock = 0) dans les métriques critiques
-- Solution: exclure les ruptures et utiliser des seuils plus appropriés
-- ===================================================================

-- Remplacer la fonction existante pour corriger le problème des ruptures
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
  -- Calculer les métriques de stock faible (SANS les ruptures)
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
    -- ✅ EXCLURE les ruptures (stock = 0) du composant Stock Faible
    HAVING COALESCE(SUM(l.quantite_restante), 0) > 0
  ),
  stock_classification AS (
    SELECT 
      id,
      stock_actuel,
      valeur_stock,
      stock_limite,
      CASE 
        -- Critique: stock <= 5 (seuil critique par défaut)
        WHEN stock_actuel <= 5 THEN 'critique'
        -- Faible: stock > 5 ET stock <= 10 (seuil faible par défaut)
        WHEN stock_actuel <= COALESCE(stock_limite, 10) THEN 'faible'
        -- Attention: stock > seuil_faible ET stock <= seuil_faible * 1.5
        WHEN stock_actuel <= COALESCE(stock_limite, 10) * 1.5 THEN 'attention'
        ELSE 'normal'
      END as statut_stock
    FROM product_stocks
  )
  SELECT 
    -- Total = critique + faible (PAS attention ni normal)
    COUNT(*) FILTER (WHERE statut_stock IN ('critique', 'faible')) as total,
    COUNT(*) FILTER (WHERE statut_stock = 'critique') as critique,
    COUNT(*) FILTER (WHERE statut_stock = 'faible') as faible,
    COUNT(*) FILTER (WHERE statut_stock = 'attention') as attention,
    COALESCE(SUM(valeur_stock) FILTER (WHERE statut_stock IN ('critique', 'faible')), 0) as valeur_totale
  INTO total_items, critical_items, low_items, attention_items, total_value
  FROM stock_classification;
  
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

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION calculate_low_stock_metrics(UUID) TO authenticated;

-- Ajouter un commentaire explicatif
COMMENT ON FUNCTION calculate_low_stock_metrics(UUID) IS 
'Calcule les métriques de stock faible en EXCLUANT les ruptures (stock = 0). 
Critique: stock <= 5, Faible: stock > 5 ET stock <= stock_limite (défaut 10).
Total = critique + faible uniquement.';