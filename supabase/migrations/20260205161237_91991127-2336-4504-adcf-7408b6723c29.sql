-- Drop existing function first to allow return type change
DROP FUNCTION IF EXISTS public.calculate_data_quality_metrics(UUID);

-- Recreate with corrected column references (is_active instead of statut)
CREATE OR REPLACE FUNCTION public.calculate_data_quality_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_completeness NUMERIC;
  v_consistency NUMERIC;
  v_freshness NUMERIC;
  v_accuracy NUMERIC;
  v_total_products INTEGER;
  v_products_with_price INTEGER;
  v_products_with_stock INTEGER;
  v_products_with_category INTEGER;
  v_recent_movements INTEGER;
  v_total_movements INTEGER;
  v_accurate_predictions INTEGER;
  v_total_predictions INTEGER;
BEGIN
  -- Calculate completeness: products with all required fields
  SELECT COUNT(*) INTO v_total_products
  FROM produits
  WHERE tenant_id = p_tenant_id AND is_active = true;

  SELECT COUNT(*) INTO v_products_with_price
  FROM produits
  WHERE tenant_id = p_tenant_id AND is_active = true AND prix_vente IS NOT NULL AND prix_vente > 0;

  SELECT COUNT(*) INTO v_products_with_stock
  FROM produits p
  WHERE p.tenant_id = p_tenant_id AND p.is_active = true
  AND EXISTS (SELECT 1 FROM lots l WHERE l.produit_id = p.id AND l.quantite_restante >= 0);

  SELECT COUNT(*) INTO v_products_with_category
  FROM produits
  WHERE tenant_id = p_tenant_id AND is_active = true AND categorie_id IS NOT NULL;

  IF v_total_products > 0 THEN
    v_completeness := ROUND(((v_products_with_price + v_products_with_stock + v_products_with_category)::NUMERIC / (v_total_products * 3)) * 100, 1);
  ELSE
    v_completeness := 0;
  END IF;

  -- Calculate consistency: data coherence
  v_consistency := CASE 
    WHEN v_total_products > 0 THEN ROUND((v_products_with_price::NUMERIC / v_total_products) * 100, 1)
    ELSE 0
  END;

  -- Calculate freshness: recent activity
  SELECT COUNT(*) INTO v_recent_movements
  FROM mouvements_lots
  WHERE tenant_id = p_tenant_id AND date_mouvement >= NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_total_movements
  FROM mouvements_lots
  WHERE tenant_id = p_tenant_id;

  IF v_total_movements > 0 THEN
    v_freshness := LEAST(ROUND((v_recent_movements::NUMERIC / GREATEST(v_total_movements, 1)) * 100 * 2, 1), 100);
  ELSE
    v_freshness := 50;
  END IF;

  -- Calculate accuracy: prediction accuracy
  SELECT COUNT(*) INTO v_accurate_predictions
  FROM ai_stock_predictions
  WHERE tenant_id = p_tenant_id AND confidence >= 0.7 AND status = 'validated';

  SELECT COUNT(*) INTO v_total_predictions
  FROM ai_stock_predictions
  WHERE tenant_id = p_tenant_id AND status IS NOT NULL;

  IF v_total_predictions > 0 THEN
    v_accuracy := ROUND((v_accurate_predictions::NUMERIC / v_total_predictions) * 100, 1);
  ELSE
    v_accuracy := 85;
  END IF;

  -- Build result JSON
  v_result := json_build_object(
    'completeness', json_build_object(
      'score', v_completeness,
      'details', json_build_object(
        'total_products', v_total_products,
        'with_price', v_products_with_price,
        'with_stock', v_products_with_stock,
        'with_category', v_products_with_category
      )
    ),
    'consistency', json_build_object(
      'score', v_consistency,
      'details', json_build_object('checked_fields', 'prix_vente')
    ),
    'freshness', json_build_object(
      'score', v_freshness,
      'details', json_build_object(
        'recent_movements', v_recent_movements,
        'total_movements', v_total_movements
      )
    ),
    'accuracy', json_build_object(
      'score', v_accuracy,
      'details', json_build_object(
        'accurate_predictions', v_accurate_predictions,
        'total_predictions', v_total_predictions
      )
    ),
    'calculated_at', NOW()
  );

  RETURN v_result;
END;
$$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';