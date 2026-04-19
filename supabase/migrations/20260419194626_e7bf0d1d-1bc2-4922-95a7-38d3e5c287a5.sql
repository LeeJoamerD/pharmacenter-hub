-- Ajouter colonnes snapshot valeur stock à l'ouverture
ALTER TABLE public.sessions_caisse
  ADD COLUMN IF NOT EXISTS valeur_stock_achat NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valeur_stock_vente NUMERIC(15,2) DEFAULT 0;

COMMENT ON COLUMN public.sessions_caisse.valeur_stock_achat IS 'Snapshot de la valeur totale du stock au prix d''achat lors de l''ouverture de la session';
COMMENT ON COLUMN public.sessions_caisse.valeur_stock_vente IS 'Snapshot de la valeur totale du stock au prix de vente TTC lors de l''ouverture de la session';

-- RPC: calcule la valeur totale du stock (achat + vente TTC) pour un tenant
CREATE OR REPLACE FUNCTION public.calculate_stock_value_snapshot(p_tenant_id uuid)
RETURNS TABLE(valeur_achat numeric, valeur_vente numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, 0)), 0)::numeric AS valeur_achat,
    COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_vente_ttc, 0)), 0)::numeric AS valeur_vente
  FROM public.lots l
  WHERE l.tenant_id = p_tenant_id
    AND l.quantite_restante > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_stock_value_snapshot(uuid) TO authenticated;

COMMENT ON FUNCTION public.calculate_stock_value_snapshot IS 'Retourne la valeur totale du stock disponible (au prix d''achat et au prix de vente TTC) pour un tenant. Utilisé pour figer un snapshot à l''ouverture des sessions de caisse.';