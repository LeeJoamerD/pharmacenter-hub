CREATE OR REPLACE FUNCTION public.generate_inventaire_report(
  p_session_id UUID,
  p_type TEXT,
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_data JSONB;
  v_items_data JSONB;
  v_result JSONB;
  v_total_items INTEGER;
  v_items_comptes INTEGER;
  v_items_conformes INTEGER;
  v_items_ecarts INTEGER;
  v_ecart_positif INTEGER;
  v_ecart_negatif INTEGER;
  v_valeur_theorique NUMERIC;
  v_valeur_reelle NUMERIC;
BEGIN
  -- Vérifier que la session existe et appartient au tenant
  SELECT to_jsonb(s.*) INTO v_session_data
  FROM inventaire_sessions s
  WHERE s.id = p_session_id AND s.tenant_id = p_tenant_id;
  
  IF v_session_data IS NULL THEN
    RAISE EXCEPTION 'Session d''inventaire non trouvée';
  END IF;

  -- Récupérer les données des items de la session
  SELECT 
    jsonb_agg(to_jsonb(i.*)) INTO v_items_data
  FROM inventaire_items i
  WHERE i.session_id = p_session_id AND i.tenant_id = p_tenant_id;

  -- Calculer les statistiques de base
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE statut = 'compte'),
    COUNT(*) FILTER (WHERE statut = 'compte' AND quantite_comptee = quantite_theorique),
    COUNT(*) FILTER (WHERE statut = 'compte' AND quantite_comptee != quantite_theorique),
    COUNT(*) FILTER (WHERE statut = 'compte' AND quantite_comptee > quantite_theorique),
    COUNT(*) FILTER (WHERE statut = 'compte' AND quantite_comptee < quantite_theorique),
    COALESCE(SUM(quantite_theorique * 0), 0),
    COALESCE(SUM(quantite_comptee * 0), 0)
  INTO 
    v_total_items,
    v_items_comptes,
    v_items_conformes,
    v_items_ecarts,
    v_ecart_positif,
    v_ecart_negatif,
    v_valeur_theorique,
    v_valeur_reelle
  FROM inventaire_items
  WHERE session_id = p_session_id AND tenant_id = p_tenant_id;

  -- Générer le rapport selon le type demandé
  CASE p_type
    WHEN 'synthese' THEN
      v_result := jsonb_build_object(
        'type', 'synthese',
        'session', v_session_data,
        'statistiques', jsonb_build_object(
          'total_items', v_total_items,
          'items_comptes', v_items_comptes,
          'items_conformes', v_items_conformes,
          'items_ecarts', v_items_ecarts,
          'taux_completion', CASE WHEN v_total_items > 0 THEN ROUND((v_items_comptes::NUMERIC / v_total_items) * 100, 2) ELSE 0 END,
          'taux_conformite', CASE WHEN v_items_comptes > 0 THEN ROUND((v_items_conformes::NUMERIC / v_items_comptes) * 100, 2) ELSE 0 END
        ),
        'valorisation', jsonb_build_object(
          'valeur_theorique', v_valeur_theorique,
          'valeur_reelle', v_valeur_reelle,
          'ecart_valeur', v_valeur_reelle - v_valeur_theorique
        )
      );

    WHEN 'ecarts' THEN
      SELECT jsonb_build_object(
        'type', 'ecarts',
        'session', v_session_data,
        'statistiques', jsonb_build_object(
          'total_ecarts', v_items_ecarts,
          'ecarts_positifs', v_ecart_positif,
          'ecarts_negatifs', v_ecart_negatif
        ),
        'details_ecarts', jsonb_agg(
          jsonb_build_object(
            'produit_nom', i.produit_nom,
            'lot_numero', i.lot_numero,
            'emplacement', i.emplacement_reel,
            'quantite_theorique', i.quantite_theorique,
            'quantite_comptee', i.quantite_comptee,
            'ecart', i.quantite_comptee - i.quantite_theorique,
            'unite', i.unite,
            'operateur', i.operateur_nom,
            'date_comptage', i.date_comptage
          )
        )
      ) INTO v_result
      FROM inventaire_items i
      WHERE i.session_id = p_session_id 
        AND i.tenant_id = p_tenant_id 
        AND i.statut = 'compte' 
        AND i.quantite_comptee != i.quantite_theorique;

    WHEN 'valorisation' THEN
      v_result := jsonb_build_object(
        'type', 'valorisation',
        'session', v_session_data,
        'resume', jsonb_build_object(
          'valeur_theorique_totale', v_valeur_theorique,
          'valeur_reelle_totale', v_valeur_reelle,
          'ecart_valeur_totale', v_valeur_reelle - v_valeur_theorique
        )
      );

    WHEN 'conformite' THEN
      v_result := jsonb_build_object(
        'type', 'conformite',
        'session', v_session_data,
        'conformite_globale', jsonb_build_object(
          'items_conformes', v_items_conformes,
          'items_non_conformes', v_items_ecarts,
          'taux_conformite', CASE WHEN v_items_comptes > 0 THEN ROUND((v_items_conformes::NUMERIC / v_items_comptes) * 100, 2) ELSE 0 END
        )
      );

    WHEN 'performance' THEN
      v_result := jsonb_build_object(
        'type', 'performance',
        'session', v_session_data,
        'performance_data', 'TODO'
      );

    ELSE
      v_result := jsonb_build_object(
        'type', 'personnalise',
        'session', v_session_data,
        'items', v_items_data
      );
  END CASE;

  -- Ajouter les métadonnées du rapport
  v_result := v_result || jsonb_build_object(
    'meta', jsonb_build_object(
      'date_generation', NOW(),
      'tenant_id', p_tenant_id,
      'session_id', p_session_id,
      'type_rapport', p_type
    )
  );

  RETURN v_result;
END;
$$;