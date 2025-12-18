-- Create RPC get_hero_metrics with SECURITY DEFINER
-- This allows fetching Hero metrics even when only pharmacy session is active (no user auth)

CREATE OR REPLACE FUNCTION public.get_hero_metrics(p_tenant_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_sales NUMERIC;
  v_previous_sales NUMERIC;
  v_sales_growth INTEGER;
  v_total_products INTEGER;
  v_products_with_stock INTEGER;
  v_availability_rate INTEGER;
  v_stock_status TEXT;
  v_pharmacy_count INTEGER;
BEGIN
  -- Bypass RLS for this function
  SET LOCAL row_security = off;
  
  -- Vérifier que le tenant existe
  IF NOT EXISTS (SELECT 1 FROM pharmacies WHERE id = p_tenant_id) THEN
    RETURN jsonb_build_object('error', 'Tenant non trouvé');
  END IF;
  
  -- CA mois courant
  SELECT COALESCE(SUM(montant_total_ttc), 0) INTO v_current_sales
  FROM ventes 
  WHERE tenant_id = p_tenant_id 
    AND created_at >= date_trunc('month', CURRENT_DATE);
  
  -- CA mois précédent
  SELECT COALESCE(SUM(montant_total_ttc), 0) INTO v_previous_sales
  FROM ventes 
  WHERE tenant_id = p_tenant_id 
    AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
    AND created_at < date_trunc('month', CURRENT_DATE);
  
  -- Croissance des ventes
  IF v_previous_sales > 0 THEN
    v_sales_growth := ROUND(((v_current_sales - v_previous_sales) / v_previous_sales) * 100);
  ELSIF v_current_sales > 0 THEN
    v_sales_growth := 100;
  ELSE
    v_sales_growth := 0;
  END IF;
  
  -- Total produits actifs
  SELECT COUNT(*) INTO v_total_products
  FROM produits 
  WHERE tenant_id = p_tenant_id AND is_active = true;
  
  -- Produits avec stock > 0
  SELECT COUNT(DISTINCT produit_id) INTO v_products_with_stock
  FROM lots 
  WHERE tenant_id = p_tenant_id AND quantite_restante > 0;
  
  -- Taux de disponibilité
  IF v_total_products > 0 THEN
    v_availability_rate := ROUND((v_products_with_stock::NUMERIC / v_total_products) * 100);
  ELSE
    v_availability_rate := 0;
  END IF;
  
  -- Statut du stock
  IF v_availability_rate < 70 THEN
    v_stock_status := 'Critique';
  ELSIF v_availability_rate < 90 THEN
    v_stock_status := 'Attention';
  ELSE
    v_stock_status := 'Optimal';
  END IF;
  
  -- Nombre total de pharmacies
  SELECT COUNT(*) INTO v_pharmacy_count FROM pharmacies;
  
  RETURN jsonb_build_object(
    'salesGrowth', v_sales_growth,
    'totalProducts', v_total_products,
    'availabilityRate', v_availability_rate,
    'stockStatus', v_stock_status,
    'pharmacyCount', v_pharmacy_count,
    'isRealData', true
  );
END;
$$;

-- Grant execute permission to both authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.get_hero_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hero_metrics(UUID) TO anon;