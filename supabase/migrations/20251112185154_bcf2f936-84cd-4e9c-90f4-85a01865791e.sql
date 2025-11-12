-- ============================================
-- CORRECTION: get_stock_status_distribution
-- Retourne les clés en français attendues par le composant
-- Ajoute le champ 'total' manquant
-- Maintient la logique de cascade à 3 niveaux
-- ============================================

CREATE OR REPLACE FUNCTION public.get_stock_status_distribution(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH stock_calculs AS (
    SELECT 
      p.id,
      COALESCE(SUM(l.quantite_restante), 0)::NUMERIC as stock_actuel,
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::NUMERIC as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::NUMERIC as seuil_faible,
      public.get_stock_threshold_cascade('maximum', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::NUMERIC as seuil_maximum
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_critique, p.stock_faible, p.stock_limite
  )
  SELECT jsonb_build_object(
    'normal', COUNT(*) FILTER (WHERE stock_actuel > seuil_faible AND (seuil_maximum IS NULL OR stock_actuel <= seuil_maximum)),
    'faible', COUNT(*) FILTER (WHERE stock_actuel > seuil_critique AND stock_actuel <= seuil_faible),
    'critique', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= seuil_critique),
    'rupture', COUNT(*) FILTER (WHERE stock_actuel = 0),
    'surstock', COUNT(*) FILTER (WHERE seuil_maximum IS NOT NULL AND stock_actuel > seuil_maximum),
    'total', COUNT(*)
  ) INTO v_result
  FROM stock_calculs;

  RETURN COALESCE(v_result, '{"normal":0,"faible":0,"critique":0,"rupture":0,"surstock":0,"total":0}'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.get_stock_status_distribution IS 
'Retourne la distribution des statuts de stock avec clés françaises (normal, faible, critique, rupture, surstock, total) selon la logique de cascade à 3 niveaux';