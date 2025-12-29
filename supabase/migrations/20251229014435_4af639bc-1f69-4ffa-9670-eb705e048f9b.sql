-- Drop ALL existing versions of preview_inventaire_items_count to avoid PGRST202 (overload confusion)
DROP FUNCTION IF EXISTS public.preview_inventaire_items_count(uuid, text, uuid[], uuid[], text[], integer, integer);
DROP FUNCTION IF EXISTS public.preview_inventaire_items_count(uuid, text, uuid[], uuid[], text[], integer);
DROP FUNCTION IF EXISTS public.preview_inventaire_items_count(uuid, text);

-- Recreate the function with the exact signature expected by the frontend
CREATE OR REPLACE FUNCTION public.preview_inventaire_items_count(
  p_tenant_id uuid,
  p_type_inventaire text,
  p_filtres_rayon uuid[] DEFAULT NULL,
  p_filtres_fournisseur uuid[] DEFAULT NULL,
  p_filtres_emplacement text[] DEFAULT NULL,
  p_filtres_peremption_jours integer DEFAULT NULL,
  p_cyclique_jours integer DEFAULT 30
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count integer := 0;
  v_date_limite date;
BEGIN
  -- For peremption filter
  IF p_filtres_peremption_jours IS NOT NULL THEN
    v_date_limite := CURRENT_DATE + p_filtres_peremption_jours;
  END IF;

  -- Count distinct products based on type and filters
  SELECT COUNT(DISTINCT p.id) INTO v_count
  FROM produits p
  INNER JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND l.quantite_restante > 0
    -- Type-specific filters
    AND (
      CASE p_type_inventaire
        WHEN 'complet' THEN true
        WHEN 'partiel' THEN 
          (p_filtres_rayon IS NULL OR p.rayon_id = ANY(p_filtres_rayon))
          AND (p_filtres_fournisseur IS NULL OR l.fournisseur_id = ANY(p_filtres_fournisseur))
          AND (p_filtres_emplacement IS NULL OR l.emplacement = ANY(p_filtres_emplacement))
        WHEN 'tournant' THEN true
        WHEN 'cyclique' THEN true
        WHEN 'peremption' THEN 
          p_filtres_peremption_jours IS NOT NULL 
          AND l.date_peremption IS NOT NULL 
          AND l.date_peremption <= v_date_limite
        ELSE true
      END
    );

  RETURN v_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.preview_inventaire_items_count(uuid, text, uuid[], uuid[], text[], integer, integer) TO authenticated;