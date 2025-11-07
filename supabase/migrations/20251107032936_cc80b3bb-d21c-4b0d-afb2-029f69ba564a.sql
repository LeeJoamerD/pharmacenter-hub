-- Phase 1: Initialisation des lots à partir des produits existants
-- Cette migration crée des lots initiaux pour tous les produits qui n'en ont pas

-- Fonction pour initialiser les lots d'un tenant
CREATE OR REPLACE FUNCTION public.init_product_lots(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_count INTEGER := 0;
  v_product RECORD;
  v_lot_id UUID;
BEGIN
  -- Pour chaque produit actif sans lot
  FOR v_product IN
    SELECT 
      p.id,
      p.code_cip,
      p.libelle_produit,
      p.stock_actuel,
      p.prix_achat,
      p.is_medicament
    FROM public.produits p
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.lots l 
        WHERE l.produit_id = p.id AND l.tenant_id = p_tenant_id
      )
  LOOP
    -- Créer un lot initial si le produit a du stock
    IF COALESCE(v_product.stock_actuel, 0) > 0 THEN
      INSERT INTO public.lots (
        tenant_id,
        produit_id,
        numero_lot,
        quantite_initiale,
        quantite_restante,
        prix_achat_unitaire,
        date_reception,
        date_peremption,
        statut
      ) VALUES (
        p_tenant_id,
        v_product.id,
        'LOT-INIT-' || COALESCE(v_product.code_cip, v_product.id::text),
        v_product.stock_actuel,
        v_product.stock_actuel,
        COALESCE(v_product.prix_achat, 0),
        CURRENT_DATE,
        -- Péremption: +2 ans pour médicaments, +5 ans pour autres
        CURRENT_DATE + INTERVAL '1 year' * CASE 
          WHEN v_product.is_medicament THEN 2 
          ELSE 5 
        END,
        'disponible'
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'lots_created', v_count,
    'message', format('%s lots initiaux créés', v_count)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour obtenir les seuils de stock
CREATE OR REPLACE FUNCTION public.get_stock_threshold(
  p_threshold_type TEXT,
  p_stock_limite INTEGER
)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE p_threshold_type
    WHEN 'critical' THEN GREATEST(FLOOR(COALESCE(p_stock_limite, 10) * 0.2), 1)
    WHEN 'low' THEN GREATEST(FLOOR(COALESCE(p_stock_limite, 10) * 0.5), 5)
    WHEN 'maximum' THEN COALESCE(p_stock_limite, 10) * 3
    ELSE COALESCE(p_stock_limite, 10)
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Nettoyer et normaliser les données produits
UPDATE public.produits
SET stock_actuel = COALESCE(stock_actuel, 0)
WHERE stock_actuel IS NULL;

UPDATE public.produits
SET stock_limite = 10
WHERE stock_limite IS NULL OR stock_limite = 0;

UPDATE public.produits
SET stock_alerte = FLOOR(stock_limite * 0.5)
WHERE stock_alerte IS NULL OR stock_alerte = 0;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.init_product_lots(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stock_threshold(TEXT, INTEGER) TO authenticated;