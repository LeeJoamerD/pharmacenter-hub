-- Fix: Corriger les agrégations imbriquées dans calculate_valuation_by_family et calculate_valuation_by_rayon

-- Correction de calculate_valuation_by_family
CREATE OR REPLACE FUNCTION public.calculate_valuation_by_family(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  total_value NUMERIC;
BEGIN
  -- Calculer d'abord la valeur totale
  SELECT COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0)
  INTO total_value
  FROM public.produits p
  LEFT JOIN public.lots l ON p.id = l.produit_id AND l.quantite_restante > 0
  WHERE p.tenant_id = p_tenant_id AND p.is_active = true;
  
  -- Calculer par famille en utilisant une CTE
  WITH famille_stats AS (
    SELECT 
      f.id,
      f.libelle_famille,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as family_value,
      COALESCE(SUM(l.quantite_restante), 0) as family_quantity,
      COUNT(DISTINCT p.id) as product_count
    FROM public.famille_produit f
    LEFT JOIN public.produits p ON f.id = p.famille_id AND p.tenant_id = p_tenant_id AND p.is_active = true
    LEFT JOIN public.lots l ON p.id = l.produit_id AND l.quantite_restante > 0
    WHERE f.tenant_id = p_tenant_id
    GROUP BY f.id, f.libelle_famille
    HAVING COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) > 0
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', libelle_famille,
      'value', family_value,
      'quantity', family_quantity,
      'percentage', CASE WHEN total_value > 0 
        THEN (family_value / total_value * 100)
        ELSE 0 END,
      'productCount', product_count
    )
    ORDER BY family_value DESC
  )
  INTO result
  FROM famille_stats;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Correction de calculate_valuation_by_rayon
CREATE OR REPLACE FUNCTION public.calculate_valuation_by_rayon(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  total_value NUMERIC;
BEGIN
  -- Calculer d'abord la valeur totale
  SELECT COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0)
  INTO total_value
  FROM public.produits p
  LEFT JOIN public.lots l ON p.id = l.produit_id AND l.quantite_restante > 0
  WHERE p.tenant_id = p_tenant_id AND p.is_active = true;
  
  -- Calculer par rayon en utilisant une CTE
  WITH rayon_stats AS (
    SELECT 
      r.id,
      r.libelle_rayon,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as rayon_value,
      COALESCE(SUM(l.quantite_restante), 0) as rayon_quantity,
      COUNT(DISTINCT p.id) as product_count
    FROM public.rayons_produits r
    LEFT JOIN public.produits p ON r.id = p.rayon_id AND p.tenant_id = p_tenant_id AND p.is_active = true
    LEFT JOIN public.lots l ON p.id = l.produit_id AND l.quantite_restante > 0
    WHERE r.tenant_id = p_tenant_id
    GROUP BY r.id, r.libelle_rayon
    HAVING COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) > 0
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', libelle_rayon,
      'value', rayon_value,
      'quantity', rayon_quantity,
      'percentage', CASE WHEN total_value > 0 
        THEN (rayon_value / total_value * 100)
        ELSE 0 END,
      'productCount', product_count
    )
    ORDER BY rayon_value DESC
  )
  INTO result
  FROM rayon_stats;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;