-- Fix get_stock_alerts_with_products: correct quote escaping in format() function
-- Step 1: Drop existing function
-- Step 2: Recreate with 6 quotes (''''''value'''''') to get 'value' in final SQL

DROP FUNCTION IF EXISTS public.get_stock_alerts_with_products(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.get_stock_alerts_with_products(
  p_tenant_id UUID,
  p_search TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'product_name',
  p_sort_order TEXT DEFAULT 'asc',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  products JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  sql_query TEXT;
  where_conditions TEXT := '';
  order_clause TEXT;
  count_query TEXT;
  total BIGINT;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR p_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;

  -- Build WHERE conditions
  where_conditions := format('p.tenant_id = %L AND p.is_active = true', p_tenant_id);
  
  IF p_search IS NOT NULL AND p_search != '' THEN
    where_conditions := where_conditions || format(' AND (p.nom ILIKE %L OR p.code_produit ILIKE %L OR d.nom_dci ILIKE %L)', 
      '%' || p_search || '%', '%' || p_search || '%', '%' || p_search || '%');
  END IF;
  
  IF p_category IS NOT NULL AND p_category != '' THEN
    where_conditions := where_conditions || format(' AND p.categorie = %L', p_category);
  END IF;
  
  IF p_status IS NOT NULL AND p_status != '' THEN
    where_conditions := where_conditions || format(' AND (
      CASE 
        WHEN p.stock_actuel = 0 THEN ''''''rupture''''''
        WHEN p.stock_actuel <= p.seuil_alerte THEN ''''''critique''''''
        WHEN p.stock_actuel <= p.stock_min THEN ''''''faible''''''
        WHEN p.stock_actuel >= p.stock_max THEN ''''''surstock''''''
        ELSE ''''''normal''''''
      END
    ) = %L', p_status);
  END IF;

  -- Build ORDER BY clause
  order_clause := CASE p_sort_by
    WHEN 'product_name' THEN 'p.nom'
    WHEN 'stock_level' THEN 'p.stock_actuel'
    WHEN 'alert_threshold' THEN 'p.seuil_alerte'
    WHEN 'category' THEN 'p.categorie'
    ELSE 'p.nom'
  END;
  
  order_clause := order_clause || CASE WHEN p_sort_order = 'desc' THEN ' DESC' ELSE ' ASC' END;

  -- Get total count
  count_query := format('
    SELECT COUNT(*)
    FROM public.produits p
    LEFT JOIN public.dci d ON d.id = p.dci_id AND d.tenant_id = p.tenant_id
    WHERE %s
  ', where_conditions);
  
  EXECUTE count_query INTO total;

  -- Build main query with json_build_object using 6 quotes for string literals
  sql_query := format('
    SELECT json_agg(
      json_build_object(
        ''''''id'''''', p.id,
        ''''''code_produit'''''', p.code_produit,
        ''''''nom'''''', p.nom,
        ''''''dci'''''', d.nom_dci,
        ''''''categorie'''''', p.categorie,
        ''''''stock_actuel'''''', p.stock_actuel,
        ''''''stock_min'''''', p.stock_min,
        ''''''stock_max'''''', p.stock_max,
        ''''''seuil_alerte'''''', p.seuil_alerte,
        ''''''unite'''''', ''''''unité'''''',
        ''''''prix_vente_ttc'''''', p.prix_vente_ttc,
        ''''''stock_status'''''', 
        CASE 
          WHEN p.stock_actuel = 0 THEN ''''''rupture''''''
          WHEN p.stock_actuel <= p.seuil_alerte THEN ''''''critique''''''
          WHEN p.stock_actuel <= p.stock_min THEN ''''''faible''''''
          WHEN p.stock_actuel >= p.stock_max THEN ''''''surstock''''''
          ELSE ''''''normal''''''
        END
      )
    )
    FROM public.produits p
    LEFT JOIN public.dci d ON d.id = p.dci_id AND d.tenant_id = p.tenant_id
    WHERE %s
    ORDER BY %s
    LIMIT %L OFFSET %L
  ', where_conditions, order_clause, p_limit, p_offset);

  -- Execute and return
  RETURN QUERY EXECUTE format('
    SELECT COALESCE((%s), ''[]''::jsonb) as products, %L::bigint as total_count
  ', sql_query, total);

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur dans get_stock_alerts_with_products: %', SQLERRM;
END;
$$;