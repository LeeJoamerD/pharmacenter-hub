-- Restauration des fonctions RPC pour le module Stock Faible

-- 1. Supprimer et recréer get_current_tenant_alert_settings
DROP FUNCTION IF EXISTS public.get_current_tenant_alert_settings();

CREATE OR REPLACE FUNCTION public.get_current_tenant_alert_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  current_tenant_id UUID;
BEGIN
  current_tenant_id := public.get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant non trouvé';
  END IF;
  
  SELECT jsonb_build_object(
    'stock_alerte_default', COALESCE(s.stock_alerte_default, 10),
    'stock_limite_default', COALESCE(s.stock_limite_default, 5),
    'alert_email_enabled', COALESCE(s.alert_email_enabled, false),
    'alert_sound_enabled', COALESCE(s.alert_sound_enabled, true)
  )
  INTO result
  FROM public.stock_settings s
  WHERE s.tenant_id = current_tenant_id
  LIMIT 1;
  
  IF result IS NULL THEN
    result := jsonb_build_object(
      'stock_alerte_default', 10,
      'stock_limite_default', 5,
      'alert_email_enabled', false,
      'alert_sound_enabled', true
    );
  END IF;
  
  RETURN result;
END;
$$;

-- 2. Création de get_low_stock_products avec pagination correcte
CREATE OR REPLACE FUNCTION public.get_low_stock_products(
  p_tenant_id UUID,
  p_search TEXT DEFAULT NULL,
  p_category UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  total_count INTEGER;
BEGIN
  IF p_tenant_id != public.get_current_user_tenant_id() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;
  
  WITH stock_data AS (
    SELECT 
      p.id,
      p.tenant_id,
      p.code_cip,
      p.libelle_produit,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      p.stock_limite,
      p.stock_alerte,
      COALESCE(p.prix_achat, 0) as prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) * COALESCE(p.prix_achat, 0) as valeur_stock,
      p.famille_id,
      f.libelle_famille,
      p.rayon_id,
      r.libelle_rayon,
      p.updated_at,
      CASE 
        WHEN COALESCE(SUM(l.quantite_restante), 0) = 0 THEN 'critique'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_limite, 0) THEN 'critique'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_alerte, 0) THEN 'faible'
        ELSE 'attention'
      END as statut_stock
    FROM public.produits p
    LEFT JOIN public.lots l ON p.id = l.produit_id AND l.quantite_restante > 0
    LEFT JOIN public.famille_produit f ON p.famille_id = f.id
    LEFT JOIN public.rayons_produits r ON p.rayon_id = r.id
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
    GROUP BY p.id, p.tenant_id, p.code_cip, p.libelle_produit, p.stock_limite, 
             p.stock_alerte, p.prix_achat, p.famille_id, f.libelle_famille, 
             p.rayon_id, r.libelle_rayon, p.updated_at
    HAVING COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_alerte, 0)
  ),
  filtered_data AS (
    SELECT * FROM stock_data
    WHERE 
      (p_search IS NULL OR 
       code_cip ILIKE '%' || p_search || '%' OR 
       libelle_produit ILIKE '%' || p_search || '%')
      AND (p_category IS NULL OR famille_id = p_category)
      AND (p_status IS NULL OR statut_stock = p_status)
  ),
  paginated_data AS (
    SELECT * FROM filtered_data
    ORDER BY 
      CASE statut_stock 
        WHEN 'critique' THEN 1 
        WHEN 'faible' THEN 2 
        ELSE 3 
      END,
      stock_actuel ASC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT 
    jsonb_build_object(
      'data', COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'tenant_id', tenant_id,
          'code_cip', code_cip,
          'libelle_produit', libelle_produit,
          'stock_actuel', stock_actuel,
          'stock_limite', stock_limite,
          'stock_alerte', stock_alerte,
          'prix_achat', prix_achat,
          'valeur_stock', valeur_stock,
          'famille_id', famille_id,
          'famille_libelle', libelle_famille,
          'rayon_id', rayon_id,
          'rayon_libelle', libelle_rayon,
          'statut_stock', statut_stock,
          'updated_at', updated_at
        )
      ), '[]'::jsonb),
      'total', (SELECT COUNT(*) FROM filtered_data)
    )
  INTO result
  FROM paginated_data;
  
  RETURN COALESCE(result, jsonb_build_object('data', '[]'::jsonb, 'total', 0));
END;
$$;

-- 3. Création de calculate_low_stock_metrics_v2
CREATE OR REPLACE FUNCTION public.calculate_low_stock_metrics_v2(
  p_tenant_id UUID,
  p_critical_threshold INTEGER DEFAULT 5,
  p_low_threshold INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  v_total_items INTEGER;
  v_critical_items INTEGER;
  v_low_items INTEGER;
  v_total_value NUMERIC;
  v_urgent_actions INTEGER;
BEGIN
  IF p_tenant_id != public.get_current_user_tenant_id() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;
  
  WITH stock_summary AS (
    SELECT 
      p.id,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(p.prix_achat, 0) as prix_achat,
      COALESCE(p.stock_limite, p_critical_threshold) as seuil_critique,
      COALESCE(p.stock_alerte, p_low_threshold) as seuil_faible
    FROM public.produits p
    LEFT JOIN public.lots l ON p.id = l.produit_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
    GROUP BY p.id, p.prix_achat, p.stock_limite, p.stock_alerte
  )
  SELECT
    COUNT(*) FILTER (WHERE stock_actuel <= seuil_faible),
    COUNT(*) FILTER (WHERE stock_actuel <= seuil_critique),
    COUNT(*) FILTER (WHERE stock_actuel > seuil_critique AND stock_actuel <= seuil_faible),
    COALESCE(SUM(stock_actuel * prix_achat) FILTER (WHERE stock_actuel <= seuil_faible), 0),
    COUNT(*) FILTER (WHERE stock_actuel <= seuil_critique)
  INTO 
    v_total_items,
    v_critical_items,
    v_low_items,
    v_total_value,
    v_urgent_actions
  FROM stock_summary;
  
  result := jsonb_build_object(
    'totalItems', COALESCE(v_total_items, 0),
    'criticalItems', COALESCE(v_critical_items, 0),
    'lowItems', COALESCE(v_low_items, 0),
    'totalValue', COALESCE(v_total_value, 0),
    'urgentActions', COALESCE(v_urgent_actions, 0)
  );
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_current_tenant_alert_settings() IS 
'Retourne les paramètres d''alerte de stock du tenant courant sous forme JSON';

COMMENT ON FUNCTION public.get_low_stock_products(UUID, TEXT, UUID, TEXT, INTEGER, INTEGER) IS 
'Récupère les produits en stock faible avec pagination et filtres';

COMMENT ON FUNCTION public.calculate_low_stock_metrics_v2(UUID, INTEGER, INTEGER) IS 
'Calcule les métriques de stock faible avec seuils personnalisables';