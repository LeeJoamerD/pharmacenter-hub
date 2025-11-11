-- Correction de get_low_stock_products pour utiliser la cascade à 3 niveaux
-- Suppression des références à p.stock_alerte et utilisation de get_stock_threshold_cascade

DROP FUNCTION IF EXISTS public.get_low_stock_products(UUID, TEXT, UUID, TEXT, INTEGER, INTEGER) CASCADE;

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
      -- ✅ UTILISER LA CASCADE pour obtenir les seuils dynamiques
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible,
      COALESCE(p.prix_achat, 0) as prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) * COALESCE(p.prix_achat, 0) as valeur_stock,
      p.famille_id,
      f.libelle_famille,
      p.rayon_id,
      r.libelle_rayon,
      p.updated_at
    FROM public.produits p
    LEFT JOIN public.lots l ON p.id = l.produit_id AND l.quantite_restante > 0
    LEFT JOIN public.famille_produit f ON p.famille_id = f.id
    LEFT JOIN public.rayons_produits r ON p.rayon_id = r.id
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
    GROUP BY p.id, p.tenant_id, p.code_cip, p.libelle_produit, p.stock_limite, 
             p.stock_critique, p.stock_faible, p.prix_achat, p.famille_id, 
             f.libelle_famille, p.rayon_id, r.libelle_rayon, p.updated_at
  ),
  stock_with_status AS (
    SELECT 
      *,
      -- ✅ Calculer le statut APRÈS avoir les seuils cascadés
      CASE 
        WHEN stock_actuel = 0 THEN 'rupture'
        WHEN stock_actuel <= seuil_critique THEN 'critique'
        WHEN stock_actuel <= seuil_faible THEN 'faible'
        ELSE 'attention'
      END as statut_stock
    FROM stock_data
    -- ✅ EXCLURE les ruptures (stock = 0) et ne garder que stock > 0 ET stock <= seuil_faible
    WHERE stock_actuel > 0 
      AND stock_actuel <= seuil_faible
  ),
  filtered_data AS (
    SELECT * FROM stock_with_status
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
          -- ✅ Retourner les seuils calculés au lieu de stock_alerte
          'seuil_critique', seuil_critique,
          'seuil_faible', seuil_faible,
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

COMMENT ON FUNCTION public.get_low_stock_products(UUID, TEXT, UUID, TEXT, INTEGER, INTEGER) IS 
'Récupère les produits en stock critique ou faible (stock > 0 ET stock <= seuil_faible).
Utilise la cascade à 3 niveaux (produit → settings → défaut) via get_stock_threshold_cascade.
Exclut automatiquement les produits en rupture (stock = 0) qui ont leur propre module.';

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_low_stock_products(UUID, TEXT, UUID, TEXT, INTEGER, INTEGER) TO authenticated;