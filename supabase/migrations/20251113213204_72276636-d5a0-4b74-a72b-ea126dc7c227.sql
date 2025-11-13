-- Correction de la RPC get_stock_alerts_with_products avec les bons noms de colonnes
-- Remplace: quantite_actuelle -> quantite_restante, date_derniere_entree -> date_reception, actif -> is_active

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
    v_conditions := v_conditions || format(' AND (p.libelle_produit ILIKE %L OR p.code_cip ILIKE %L OR p.dci ILIKE %L)', 
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
        p.dci,
        COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
        p.unite_mesure as unite,
        p.famille_id,
        p.rayon_id,
        fp.libelle_famille as categorie,
        COALESCE(p.prix_unitaire, 0) as prix_unitaire,
        p.fournisseur_principal_id,
        -- Logique de cascade pour seuils (Produit > Settings > Défaut)
        COALESCE(p.stock_critique, gas.critical_stock_threshold, 2) as seuil_critique,
        COALESCE(p.stock_faible, gas.low_stock_threshold, 5) as seuil_faible,
        COALESCE(p.stock_limite, gas.maximum_stock_threshold, 10) as seuil_limite,
        MAX(l.date_reception) as dernier_mouvement
      FROM produits p
      LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id
      LEFT JOIN famille_produit fp ON fp.id = p.famille_id AND fp.tenant_id = p.tenant_id
      LEFT JOIN global_alert_settings gas ON gas.tenant_id = p.tenant_id
      WHERE p.tenant_id = %L
        AND p.is_active = true
      GROUP BY p.id, p.tenant_id, p.code_cip, p.libelle_produit, p.dci, p.unite_mesure,
               p.famille_id, p.rayon_id, fp.libelle_famille, p.prix_unitaire, 
               p.fournisseur_principal_id, p.stock_critique, p.stock_faible, p.stock_limite,
               gas.critical_stock_threshold, gas.low_stock_threshold, gas.maximum_stock_threshold
    ),
    classified_stock AS (
      SELECT 
        *,
        -- Calculer le statut selon les seuils
        CASE 
          WHEN stock_actuel = 0 THEN ''rupture''
          WHEN stock_actuel > 0 AND stock_actuel <= seuil_critique THEN ''critique''
          WHEN stock_actuel > seuil_critique AND stock_actuel <= seuil_faible THEN ''faible''
          WHEN stock_actuel > seuil_faible AND stock_actuel <= seuil_limite THEN ''normal''
          ELSE ''surstock''
        END as stock_status,
        -- Ordre pour tri
        CASE 
          WHEN stock_actuel = 0 THEN 1
          WHEN stock_actuel > 0 AND stock_actuel <= seuil_critique THEN 2
          WHEN stock_actuel > seuil_critique AND stock_actuel <= seuil_faible THEN 3
          WHEN stock_actuel > seuil_faible AND stock_actuel <= seuil_limite THEN 4
          ELSE 5
        END as stock_status_order,
        -- Calculer la rotation
        CASE 
          WHEN stock_actuel <= seuil_faible THEN ''rapide''
          WHEN stock_actuel <= seuil_limite THEN ''normale''
          ELSE ''lente''
        END as rotation,
        -- Ordre de rotation pour tri
        CASE 
          WHEN stock_actuel <= seuil_faible THEN 1
          WHEN stock_actuel <= seuil_limite THEN 2
          ELSE 3
        END as rotation_order,
        -- Valeur du stock
        (stock_actuel * prix_unitaire) as valeur_stock,
        -- Jours sans mouvement (approximatif)
        COALESCE(EXTRACT(DAY FROM NOW() - dernier_mouvement)::INT, 999) as jours_sans_mouvement
      FROM stock_data
    )
    SELECT json_agg(row_to_json(t)) as data
    FROM (
      SELECT * FROM classified_stock
      WHERE stock_status IN (''rupture'', ''critique'', ''faible'')
      %s
      %s
      LIMIT %s OFFSET %s
    ) t
  ', p_tenant_id, v_conditions, v_order_by, p_limit, p_offset);

  -- Requête de comptage
  v_count_query := format('
    WITH stock_data AS (
      SELECT 
        p.id,
        COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
        COALESCE(p.stock_critique, gas.critical_stock_threshold, 2) as seuil_critique,
        COALESCE(p.stock_faible, gas.low_stock_threshold, 5) as seuil_faible,
        COALESCE(p.stock_limite, gas.maximum_stock_threshold, 10) as seuil_limite
      FROM produits p
      LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id
      LEFT JOIN global_alert_settings gas ON gas.tenant_id = p.tenant_id
      WHERE p.tenant_id = %L AND p.is_active = true
      GROUP BY p.id, p.stock_critique, p.stock_faible, p.stock_limite,
               gas.critical_stock_threshold, gas.low_stock_threshold, gas.maximum_stock_threshold
    )
    SELECT COUNT(*)::INT
    FROM stock_data
    WHERE (
      stock_actuel = 0 OR
      (stock_actuel > 0 AND stock_actuel <= seuil_critique) OR
      (stock_actuel > seuil_critique AND stock_actuel <= seuil_faible)
    )
    %s
  ', p_tenant_id, REPLACE(v_conditions, 'p.', ''));

  -- Exécuter la requête de comptage
  EXECUTE v_count_query INTO v_total_count;

  -- Exécuter la requête principale
  EXECUTE v_query INTO v_result;

  -- Retourner le résultat avec total
  RETURN jsonb_build_object(
    'data', COALESCE(v_result, '[]'::jsonb),
    'total', COALESCE(v_total_count, 0)
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur dans get_stock_alerts_with_products: %', SQLERRM;
  RETURN jsonb_build_object('data', '[]'::jsonb, 'total', 0, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION get_stock_alerts_with_products IS 'Récupère les produits en alerte (rupture/critique/faible) avec logique de cascade pour les seuils (Produit > Settings > Défaut) et pagination côté serveur - VERSION CORRIGÉE avec quantite_restante, date_reception et is_active';