-- Drop existing function to recreate with correct column names
DROP FUNCTION IF EXISTS public.calculate_data_quality_metrics(UUID);

-- Recreate the function with correct column references (prix_vente_ht instead of prix_vente)
CREATE OR REPLACE FUNCTION public.calculate_data_quality_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_products INTEGER := 0;
  v_products_with_price INTEGER := 0;
  v_products_with_stock INTEGER := 0;
  v_products_with_family INTEGER := 0;
  v_coherent_products INTEGER := 0;
  v_recent_products INTEGER := 0;
  v_completeness_score NUMERIC := 0;
  v_coherence_score NUMERIC := 0;
  v_freshness_score NUMERIC := 0;
  v_precision_score NUMERIC := 0;
  v_result JSON;
BEGIN
  -- Get total active products
  SELECT COUNT(*) INTO v_total_products
  FROM produits
  WHERE tenant_id = p_tenant_id AND is_active = true;

  IF v_total_products = 0 THEN
    RETURN json_build_object(
      'completeness', 0,
      'coherence', 0,
      'freshness', 0,
      'precision', 0,
      'overall', 0,
      'total_products', 0,
      'details', json_build_object()
    );
  END IF;

  -- Completeness: products with price (prix_vente_ht), stock info, and family
  SELECT COUNT(*) INTO v_products_with_price
  FROM produits
  WHERE tenant_id = p_tenant_id 
    AND is_active = true 
    AND prix_vente_ht IS NOT NULL 
    AND prix_vente_ht > 0;

  SELECT COUNT(*) INTO v_products_with_stock
  FROM produits
  WHERE tenant_id = p_tenant_id 
    AND is_active = true 
    AND (stock_limite IS NOT NULL OR stock_alerte IS NOT NULL);

  SELECT COUNT(*) INTO v_products_with_family
  FROM produits
  WHERE tenant_id = p_tenant_id 
    AND is_active = true 
    AND famille_id IS NOT NULL;

  -- Coherence: products where prix_vente_ht >= prix_achat (logical pricing)
  SELECT COUNT(*) INTO v_coherent_products
  FROM produits
  WHERE tenant_id = p_tenant_id 
    AND is_active = true 
    AND prix_vente_ht IS NOT NULL 
    AND prix_achat IS NOT NULL 
    AND prix_vente_ht >= prix_achat;

  -- Freshness: products updated in last 90 days
  SELECT COUNT(*) INTO v_recent_products
  FROM produits
  WHERE tenant_id = p_tenant_id 
    AND is_active = true 
    AND updated_at >= NOW() - INTERVAL '90 days';

  -- Calculate scores
  v_completeness_score := ROUND(
    ((v_products_with_price::NUMERIC / v_total_products) * 0.4 +
     (v_products_with_stock::NUMERIC / v_total_products) * 0.3 +
     (v_products_with_family::NUMERIC / v_total_products) * 0.3) * 100,
    1
  );

  -- Coherence score based on logical pricing
  IF v_products_with_price > 0 THEN
    v_coherence_score := ROUND((v_coherent_products::NUMERIC / v_products_with_price) * 100, 1);
  ELSE
    v_coherence_score := 0;
  END IF;

  -- Freshness score
  v_freshness_score := ROUND((v_recent_products::NUMERIC / v_total_products) * 100, 1);

  -- Precision score (simplified - based on having complete required fields)
  v_precision_score := ROUND(
    ((v_products_with_price::NUMERIC / v_total_products) * 0.5 +
     (v_coherent_products::NUMERIC / GREATEST(v_products_with_price, 1)) * 0.5) * 100,
    1
  );

  -- Build result JSON
  v_result := json_build_object(
    'completeness', LEAST(v_completeness_score, 100),
    'coherence', LEAST(v_coherence_score, 100),
    'freshness', LEAST(v_freshness_score, 100),
    'precision', LEAST(v_precision_score, 100),
    'overall', ROUND((v_completeness_score + v_coherence_score + v_freshness_score + v_precision_score) / 4, 1),
    'total_products', v_total_products,
    'details', json_build_object(
      'products_with_price', v_products_with_price,
      'products_with_stock', v_products_with_stock,
      'products_with_family', v_products_with_family,
      'coherent_products', v_coherent_products,
      'recent_products', v_recent_products
    )
  );

  RETURN v_result;
END;
$$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';