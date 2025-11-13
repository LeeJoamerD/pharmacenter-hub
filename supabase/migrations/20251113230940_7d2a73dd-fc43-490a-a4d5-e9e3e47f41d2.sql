-- ============================================
-- CORRECTION DÉFINITIVE: get_stock_alerts_with_products
-- AVEC LES VRAIS NOMS DE COLONNES VÉRIFIÉS
-- ============================================

DROP FUNCTION IF EXISTS public.get_stock_alerts_with_products(uuid,text,text,text,text,text,integer,integer);

CREATE OR REPLACE FUNCTION public.get_stock_alerts_with_products(
  p_tenant_id UUID,
  p_search TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'stock_status',
  p_sort_order TEXT DEFAULT 'desc',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_products JSONB;
  v_total_count BIGINT;
  v_total_alerts INT := 0;
  v_ruptures INT := 0;
  v_critiques INT := 0;
  v_faibles INT := 0;
  v_surstocks INT := 0;
  v_total_value NUMERIC := 0;
BEGIN
  -- Vérification d'autorisation
  IF NOT (public.is_system_admin() OR p_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;

  -- CTE pour calculer le stock réel et les seuils depuis les lots
  WITH stock_calculs AS (
    SELECT 
      p.id,
      p.code_cip,
      p.libelle_produit,
      COALESCE(d.nom_dci, '') as dci,
      ''::text as categorie,
      'unité'::text as unite,
      p.prix_vente_ttc,
      p.famille_id,
      p.rayon_id,
      -- Calcul du stock réel depuis les lots
      COALESCE(SUM(l.quantite_restante), 0)::INTEGER AS stock_reel,
      -- Calcul de la valeur du stock
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) AS valeur_stock,
      -- Dernier mouvement
      MAX(l.date_reception) as dernier_mouvement,
      -- Application de la cascade pour les seuils
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::INTEGER AS seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::INTEGER AS seuil_faible,
      public.get_stock_threshold_cascade('maximum', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::INTEGER AS seuil_maximum
    FROM public.produits p
    LEFT JOIN public.dci d ON d.id = p.dci_id AND d.tenant_id = p.tenant_id
    LEFT JOIN public.lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.code_cip, p.libelle_produit, d.nom_dci, p.prix_vente_ttc, 
             p.famille_id, p.rayon_id, p.stock_critique, p.stock_faible, p.stock_limite, p.prix_achat
  ),
  -- CTE avec statut et rotation calculés
  stock_with_status AS (
    SELECT 
      *,
      -- Calcul du statut
      CASE 
        WHEN stock_reel = 0 THEN 'rupture'
        WHEN stock_reel > 0 AND stock_reel <= seuil_critique THEN 'critique'
        WHEN stock_reel > seuil_critique AND stock_reel <= seuil_faible THEN 'faible'
        WHEN seuil_maximum IS NOT NULL AND stock_reel > seuil_maximum THEN 'surstock'
        ELSE 'normal'
      END AS stock_status,
      -- Calcul de la rotation
      CASE 
        WHEN stock_reel <= seuil_faible THEN 'rapide'
        WHEN stock_reel <= seuil_maximum THEN 'normale'
        ELSE 'lente'
      END AS rotation,
      -- Jours sans mouvement
      CASE 
        WHEN dernier_mouvement IS NULL THEN 999
        ELSE EXTRACT(DAY FROM (NOW() - dernier_mouvement))::INTEGER
      END AS jours_sans_mouvement
    FROM stock_calculs
  ),
  -- CTE pour filtrer selon les critères
  filtered_stock AS (
    SELECT *
    FROM stock_with_status
    WHERE 
      (p_search IS NULL OR p_search = '' OR 
       libelle_produit ILIKE '%' || p_search || '%' OR 
       code_cip ILIKE '%' || p_search || '%' OR 
       dci ILIKE '%' || p_search || '%')
      AND (p_category IS NULL OR p_category = '')
      AND (p_status IS NULL OR p_status = '' OR stock_status = p_status)
      AND stock_status IN ('rupture', 'critique', 'faible', 'surstock')
  ),
  -- CTE pour les métriques GLOBALES (avant pagination)
  global_metrics AS (
    SELECT 
      COUNT(*)::INT as total_alerts,
      SUM(CASE WHEN stock_status = 'rupture' THEN 1 ELSE 0 END)::INT as ruptures,
      SUM(CASE WHEN stock_status = 'critique' THEN 1 ELSE 0 END)::INT as critiques,
      SUM(CASE WHEN stock_status = 'faible' THEN 1 ELSE 0 END)::INT as faibles,
      SUM(CASE WHEN stock_status = 'surstock' THEN 1 ELSE 0 END)::INT as surstocks,
      COALESCE(SUM(valeur_stock), 0) as total_value
    FROM filtered_stock
  ),
  -- CTE pour paginer et trier
  paginated_stock AS (
    SELECT *,
      COUNT(*) OVER() as total_count
    FROM filtered_stock
    ORDER BY 
      CASE WHEN p_sort_by = 'stock_status' AND p_sort_order = 'asc' THEN 
        CASE stock_status
          WHEN 'rupture' THEN 1
          WHEN 'critique' THEN 2
          WHEN 'faible' THEN 3
          WHEN 'surstock' THEN 4
          ELSE 5
        END
      END ASC,
      CASE WHEN p_sort_by = 'stock_status' AND p_sort_order = 'desc' THEN 
        CASE stock_status
          WHEN 'rupture' THEN 1
          WHEN 'critique' THEN 2
          WHEN 'faible' THEN 3
          WHEN 'surstock' THEN 4
          ELSE 5
        END
      END DESC,
      CASE WHEN p_sort_by = 'product_name' AND p_sort_order = 'asc' THEN libelle_produit END ASC,
      CASE WHEN p_sort_by = 'product_name' AND p_sort_order = 'desc' THEN libelle_produit END DESC,
      CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'asc' THEN stock_reel END ASC,
      CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'desc' THEN stock_reel END DESC,
      CASE WHEN p_sort_by = 'value' AND p_sort_order = 'asc' THEN valeur_stock END ASC,
      CASE WHEN p_sort_by = 'value' AND p_sort_order = 'desc' THEN valeur_stock END DESC,
      libelle_produit ASC
    LIMIT p_limit
    OFFSET p_offset
  )
  -- Construction du résultat final avec métriques globales
  SELECT INTO v_result
    jsonb_build_object(
      'data', (
        SELECT COALESCE(jsonb_agg(
          json_build_object(
            'id', id,
            'tenant_id', p_tenant_id,
            'code_produit', code_cip,
            'nom_produit', libelle_produit,
            'dci', dci,
            'stock_actuel', stock_reel,
            'seuil_critique', seuil_critique,
            'seuil_faible', seuil_faible,
            'seuil_limite', seuil_maximum,
            'unite', unite,
            'categorie', categorie,
            'famille_id', famille_id,
            'rayon_id', rayon_id,
            'prix_unitaire', prix_vente_ttc,
            'valeur_stock', valeur_stock,
            'dernier_mouvement', dernier_mouvement,
            'stock_status', stock_status,
            'rotation', rotation,
            'jours_sans_mouvement', jours_sans_mouvement
          )
        ), '[]'::jsonb)
        FROM paginated_stock
      ),
      'total', COALESCE((SELECT total_count FROM paginated_stock LIMIT 1), 0),
      'metrics', (
        SELECT jsonb_build_object(
          'total_alerts', total_alerts,
          'ruptures', ruptures,
          'critiques', critiques,
          'faibles', faibles,
          'surstocks', surstocks,
          'total_value', total_value
        )
        FROM global_metrics
      )
    );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur dans get_stock_alerts_with_products: %', SQLERRM;
END;
$$;