-- Modifier init_inventaire_items pour accepter tenant_id en paramètre
CREATE OR REPLACE FUNCTION public.init_inventaire_items(
  p_session_id uuid,
  p_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  session_tenant_id UUID;
  items_count INTEGER;
  inserted_count INTEGER := 0;
BEGIN
  -- Vérifier que la session existe et appartient au tenant
  SELECT tenant_id INTO session_tenant_id
  FROM public.inventaire_sessions
  WHERE id = p_session_id AND tenant_id = p_tenant_id;

  IF session_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session non trouvée ou accès refusé');
  END IF;

  -- Vérifier si la session contient déjà des éléments
  SELECT COUNT(*) INTO items_count
  FROM public.inventaire_items
  WHERE session_id = p_session_id AND tenant_id = p_tenant_id;

  IF items_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La session contient déjà des éléments', 'inserted_count', items_count);
  END IF;

  -- Insérer les éléments d'inventaire depuis la table lots
  INSERT INTO public.inventaire_items (
    tenant_id, 
    session_id, 
    produit_id, 
    lot_id, 
    code_barre, 
    produit_nom, 
    lot_numero, 
    quantite_theorique, 
    emplacement_theorique, 
    unite, 
    statut
  )
  SELECT DISTINCT
    p_tenant_id,
    p_session_id,
    l.produit_id,
    l.id as lot_id,
    COALESCE(p.code_cip, 'PRODUIT-' || l.produit_id::text),
    p.libelle_produit,
    l.numero_lot,
    COALESCE(l.quantite_restante, 0),
    COALESCE(l.emplacement, 'Stock principal'),
    'unités',
    'non_compte'
  FROM public.lots l
  INNER JOIN public.produits p ON p.id = l.produit_id
  WHERE l.tenant_id = p_tenant_id
    AND l.quantite_restante > 0
    AND p.libelle_produit IS NOT NULL
    AND l.statut IN ('actif', 'Disponible');

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  -- Mettre à jour les agrégats de la session
  UPDATE public.inventaire_sessions
  SET 
    produits_total = inserted_count,
    produits_comptes = 0,
    ecarts = 0,
    progression = 0,
    updated_at = NOW()
  WHERE id = p_session_id AND tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'success', true, 
    'inserted_count', inserted_count,
    'message', format('Session initialisée avec %s produit(s)', inserted_count)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;