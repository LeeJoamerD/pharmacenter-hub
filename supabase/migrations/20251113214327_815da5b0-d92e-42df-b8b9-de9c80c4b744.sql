-- Correction finale de la RPC get_stock_alerts_with_products
-- Corrections: p.dci -> d.nom_dci, p.unite_mesure -> 'unité', p.prix_unitaire -> p.prix_vente_ttc
-- Ajout du JOIN sur la table dci

CREATE OR REPLACE FUNCTION get_stock_alerts_with_products(
  p_tenant_id UUID,
  p_search TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'statut',
  p_sort_order TEXT DEFAULT 'desc',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_count INT;
  v_query TEXT;
  v_count_query TEXT;
  v_conditions TEXT := '';
  v_order_by TEXT;
BEGIN
  -- Construire les conditions de filtrage
  IF p_search IS NOT NULL AND p_search != '' THEN
    v_conditions := v_conditions || format(' AND (p.libelle_produit ILIKE %L OR p.code_cip ILIKE %L OR d.nom_dci ILIKE %L)', 
      '%' || p_search || '%', '%' || p_search || '%', '%' || p_search || '%');
  END IF;
  
  IF p_category IS NOT NULL AND p_category != '' THEN
    v_conditions := v_conditions || format(' AND p.famille_id = %L', p_category);
  END IF;
  
  IF p_status IS NOT NULL AND p_status != '' THEN
    v_conditions := v_conditions || format(' AND stock_status = %L', p_status);
  END IF;

  -- Construire l'ordre de tri
  CASE p_sort_by
    WHEN 'statut' THEN
      v_order_by := 'ORDER BY stock_status_order ' || p_sort_order;
    WHEN 'quantite' THEN
      v_order_by := 'ORDER BY stock_actuel ' || p_sort_order;
    WHEN 'nom' THEN
      v_order_by := 'ORDER BY p.libelle_produit ' || p_sort_order;
    WHEN 'rotation' THEN
      v_order_by := 'ORDER BY rotation_order ' || p_sort_order;
    ELSE
      v_order_by := 'ORDER BY stock_status_order DESC';
  END CASE;

  -- Requête principale avec logique de cascade pour les seuils
  v_query := format('
    WITH stock_data AS (
      SELECT 
        p.id,
        p.tenant_id,
        p.code_cip as code_produit,
        p.libelle_produit as nom_produit,
        d.nom_dci as dci,
        COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
        ''''unité''''::text as unite,
        p.famille_id,
        p.rayon_id,
        fp.libelle_famille as categorie,
        COALESCE(p.prix_vente_ttc, 0) as prix_unitaire,
        p.fournisseur_principal_id,
        COALESCE(p.stock_critique, gas.critical_stock_threshold, 2) as seuil_critique,
        COALESCE(p.stock_faible, gas.low_stock_threshold, 5) as seuil_faible,
        COALESCE(p.stock_limite, gas.maximum_stock_threshold, 10) as seuil_limite,
        MAX(l.date_reception) as dernier_mouvement
      FROM produits p
      LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id
      LEFT JOIN famille_produit fp ON fp.id = p.famille_id AND fp.tenant_id = p.tenant_id
      LEFT JOIN dci d ON d.id = p.dci_id AND d.tenant_id = p.tenant_id
      LEFT JOIN global_alert_settings gas ON gas.tenant_id = p.tenant_id
      WHERE p.tenant_id = %L
        AND p.is_active = true
      GROUP BY p.id, p.tenant_id, p.code_cip, p.libelle_produit, d.nom_dci,
               p.famille_id, p.rayon_id, fp.libelle_famille, p.prix_vente_ttc, 
               p.fournisseur_principal_id, p.stock_critique, p.stock_faible, p.stock_limite,
               gas.critical_stock_threshold, gas.low_stock_threshold, gas.maximum_stock_threshold
    ),
    classified_stock AS (
      SELECT 
        *,
        CASE 
          WHEN stock_actuel = 0 THEN ''''rupture''''
          WHEN stock_actuel > 0 AND stock_actuel <= seuil_critique THEN ''''critique''''
          WHEN stock_actuel > seuil_critique AND stock_actuel <= seuil_faible THEN ''''faible''''
          WHEN stock_actuel > seuil_faible AND stock_actuel <= seuil_limite THEN ''''normal''''
          ELSE ''''surstock''''
        END as stock_status,
        CASE 
          WHEN stock_actuel = 0 THEN 1
          WHEN stock_actuel > 0 AND stock_actuel <= seuil_critique THEN 2
          WHEN stock_actuel > seuil_critique AND stock_actuel <= seuil_faible THEN 3
          WHEN stock_actuel > seuil_faible AND stock_actuel <= seuil_limite THEN 4
          ELSE 5
        END as stock_status_order,
        CASE 
          WHEN stock_actuel = 0 THEN 0
          ELSE EXTRACT(EPOCH FROM (NOW() - dernier_mouvement)) / 86400
        END as rotation_order
      FROM stock_data
    )
    SELECT 
      json_build_object(
        ''''id'''', id,
        ''''code_produit'''', code_produit,
        ''''nom_produit'''', nom_produit,
        ''''dci'''', dci,
        ''''stock_actuel'''', stock_actuel,
        ''''unite'''', unite,
        ''''categorie'''', categorie,
        ''''prix_unitaire'''', prix_unitaire,
        ''''stock_status'''', stock_status,
        ''''seuil_critique'''', seuil_critique,
        ''''seuil_faible'''', seuil_faible,
        ''''seuil_limite'''', seuil_limite,
        ''''dernier_mouvement'''', dernier_mouvement,
        ''''famille_id'''', famille_id,
        ''''rayon_id'''', rayon_id,
        ''''fournisseur_principal_id'''', fournisseur_principal_id
      )
    FROM classified_stock
    WHERE 1=1 %s
    %s
    LIMIT %s OFFSET %s
  ', p_tenant_id, v_conditions, v_order_by, p_limit, p_offset);

  -- Requête de comptage total
  v_count_query := format('
    WITH stock_data AS (
      SELECT 
        p.id,
        COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
        COALESCE(p.stock_critique, gas.critical_stock_threshold, 2) as seuil_critique,
        COALESCE(p.stock_faible, gas.low_stock_threshold, 5) as seuil_faible,
        COALESCE(p.stock_limite, gas.maximum_stock_threshold, 10) as seuil_limite,
        d.nom_dci
      FROM produits p
      LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id
      LEFT JOIN famille_produit fp ON fp.id = p.famille_id AND fp.tenant_id = p.tenant_id
      LEFT JOIN dci d ON d.id = p.dci_id AND d.tenant_id = p.tenant_id
      LEFT JOIN global_alert_settings gas ON gas.tenant_id = p.tenant_id
      WHERE p.tenant_id = %L
        AND p.is_active = true
      GROUP BY p.id, p.tenant_id, p.stock_critique, p.stock_faible, p.stock_limite, d.nom_dci,
               gas.critical_stock_threshold, gas.low_stock_threshold, gas.maximum_stock_threshold
    ),
    classified_stock AS (
      SELECT 
        *,
        CASE 
          WHEN stock_actuel = 0 THEN ''''rupture''''
          WHEN stock_actuel > 0 AND stock_actuel <= seuil_critique THEN ''''critique''''
          WHEN stock_actuel > seuil_critique AND stock_actuel <= seuil_faible THEN ''''faible''''
          WHEN stock_actuel > seuil_faible AND stock_actuel <= seuil_limite THEN ''''normal''''
          ELSE ''''surstock''''
        END as stock_status
      FROM stock_data
    )
    SELECT COUNT(*)
    FROM classified_stock
    WHERE 1=1 %s
  ', p_tenant_id, v_conditions);

  -- Exécuter la requête de comptage
  EXECUTE v_count_query INTO v_total_count;

  -- Exécuter la requête principale et construire le résultat
  EXECUTE 'SELECT COALESCE(json_agg(row_data), ''''[]''''::json) FROM (' || v_query || ') as row_data'
    INTO v_result;

  -- Retourner le résultat avec métadonnées
  RETURN json_build_object(
    'data', v_result,
    'total_count', v_total_count,
    'page_size', p_limit,
    'current_offset', p_offset
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erreur dans get_stock_alerts_with_products: %', SQLERRM;
END;
$$;