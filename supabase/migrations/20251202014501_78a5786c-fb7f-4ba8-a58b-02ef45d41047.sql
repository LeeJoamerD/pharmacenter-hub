-- Fonction RPC pour calculer les métriques des lots de manière optimisée
CREATE OR REPLACE FUNCTION calculate_lot_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'totalLots', COUNT(*)::int,
    'activeLots', COUNT(*) FILTER (WHERE quantite_restante > 0 AND (date_peremption IS NULL OR date_peremption > CURRENT_DATE))::int,
    'expiredLots', COUNT(*) FILTER (WHERE date_peremption IS NOT NULL AND date_peremption <= CURRENT_DATE)::int,
    'emptyLots', COUNT(*) FILTER (WHERE quantite_restante <= 0)::int,
    'expiringLots30', COUNT(*) FILTER (WHERE date_peremption IS NOT NULL AND date_peremption > CURRENT_DATE AND date_peremption <= CURRENT_DATE + INTERVAL '30 days')::int,
    'expiringLots60', COUNT(*) FILTER (WHERE date_peremption IS NOT NULL AND date_peremption > CURRENT_DATE AND date_peremption <= CURRENT_DATE + INTERVAL '60 days')::int,
    'locations', COUNT(DISTINCT emplacement)::int,
    'totalQuantity', COALESCE(SUM(quantite_restante), 0)::numeric,
    'totalValue', COALESCE(SUM(quantite_restante * prix_achat_unitaire), 0)::numeric
  ) INTO v_result
  FROM lots
  WHERE tenant_id = p_tenant_id;
  
  RETURN v_result;
END;
$$;