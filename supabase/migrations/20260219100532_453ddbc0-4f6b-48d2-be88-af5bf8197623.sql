
CREATE OR REPLACE FUNCTION public.calculate_expected_closing(p_session_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_fond_ouverture NUMERIC(15,2);
  v_total_mouvements NUMERIC(15,2);
  v_montant_theorique NUMERIC(15,2);
BEGIN
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant non trouvé pour l''utilisateur actuel';
  END IF;
  
  SELECT fond_caisse_ouverture INTO v_fond_ouverture
  FROM public.sessions_caisse
  WHERE id = p_session_id 
    AND tenant_id = v_tenant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session de caisse non trouvée';
  END IF;
  
  SELECT COALESCE(SUM(
    CASE 
      WHEN type_mouvement IN ('Sortie', 'Remboursement', 'Dépense') THEN -montant
      ELSE montant
    END
  ), 0) INTO v_total_mouvements
  FROM public.mouvements_caisse
  WHERE session_caisse_id = p_session_id
    AND tenant_id = v_tenant_id
    AND type_mouvement != 'Fond_initial';
  
  -- Montant théorique = Total Entrées - Total Sorties (sans fond de caisse)
  v_montant_theorique := v_total_mouvements;
  
  RETURN v_montant_theorique;
END;
$$;

NOTIFY pgrst, 'reload schema';
