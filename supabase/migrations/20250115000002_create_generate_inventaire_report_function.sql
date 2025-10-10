-- Fonction RPC pour générer les rapports d'inventaire
CREATE OR REPLACE FUNCTION public.generate_inventaire_report(
  p_session_id UUID,
  p_type TEXT,
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
    COALESCE(SUM(quantite_theorique * COALESCE((SELECT prix_unitaire FROM lots WHERE numero = lot_numero LIMIT 1), 0)), 0),
    COALESCE(SUM(quantite_comptee * COALESCE((SELECT prix_unitaire FROM lots WHERE numero = lot_numero LIMIT 1), 0)), 0)
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
      SELECT jsonb_build_object(
        'type', 'valorisation',
        'session', v_session_data,
        'resume', jsonb_build_object(
          'valeur_theorique_totale', v_valeur_theorique,
          'valeur_reelle_totale', v_valeur_reelle,
          'ecart_valeur_totale', v_valeur_reelle - v_valeur_theorique
        ),
        'details_valorisation', jsonb_agg(
          jsonb_build_object(
            'produit_nom', i.produit_nom,
            'lot_numero', i.lot_numero,
            'quantite_theorique', i.quantite_theorique,
            'quantite_comptee', i.quantite_comptee,
            'prix_unitaire', COALESCE(l.prix_unitaire, 0),
            'valeur_theorique', i.quantite_theorique * COALESCE(l.prix_unitaire, 0),
            'valeur_reelle', i.quantite_comptee * COALESCE(l.prix_unitaire, 0),
            'ecart_valeur', (i.quantite_comptee - i.quantite_theorique) * COALESCE(l.prix_unitaire, 0)
          )
        )
      ) INTO v_result
      FROM inventaire_items i
      LEFT JOIN lots l ON l.numero = i.lot_numero AND l.tenant_id = i.tenant_id
      WHERE i.session_id = p_session_id AND i.tenant_id = p_tenant_id AND i.statut = 'compte';

    WHEN 'conformite' THEN
      v_result := jsonb_build_object(
        'type', 'conformite',
        'session', v_session_data,
        'conformite_globale', jsonb_build_object(
          'items_conformes', v_items_conformes,
          'items_non_conformes', v_items_ecarts,
          'taux_conformite', CASE WHEN v_items_comptes > 0 THEN ROUND((v_items_conformes::NUMERIC / v_items_comptes) * 100, 2) ELSE 0 END
        ),
        'analyse_conformite', jsonb_build_object(
          'items_en_surplus', v_ecart_positif,
          'items_en_deficit', v_ecart_negatif,
          'items_manquants', (SELECT COUNT(*) FROM inventaire_items WHERE session_id = p_session_id AND tenant_id = p_tenant_id AND statut = 'non_trouve')
        )
      );

    WHEN 'performance' THEN
      SELECT jsonb_build_object(
        'type', 'performance',
        'session', v_session_data,
        'performance_operateurs', jsonb_agg(
          jsonb_build_object(
            'operateur', operateur_stats.operateur_nom,
            'items_comptes', operateur_stats.items_comptes,
            'items_conformes', operateur_stats.items_conformes,
            'taux_conformite', operateur_stats.taux_conformite,
            'temps_moyen', operateur_stats.temps_moyen
          )
        )
      ) INTO v_result
      FROM (
        SELECT 
          i.operateur_nom,
          COUNT(*) as items_comptes,
          COUNT(*) FILTER (WHERE i.quantite_comptee = i.quantite_theorique) as items_conformes,
          CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE i.quantite_comptee = i.quantite_theorique)::NUMERIC / COUNT(*)) * 100, 2) ELSE 0 END as taux_conformite,
          AVG(EXTRACT(EPOCH FROM (i.updated_at - i.created_at))/60) as temps_moyen
        FROM inventaire_items i
        WHERE i.session_id = p_session_id 
          AND i.tenant_id = p_tenant_id 
          AND i.statut = 'compte'
          AND i.operateur_nom IS NOT NULL
        GROUP BY i.operateur_nom
      ) operateur_stats;

    WHEN 'personnalise' THEN
      v_result := jsonb_build_object(
        'type', 'personnalise',
        'session', v_session_data,
        'donnees_completes', v_items_data,
        'statistiques', jsonb_build_object(
          'total_items', v_total_items,
          'items_comptes', v_items_comptes,
          'items_conformes', v_items_conformes,
          'items_ecarts', v_items_ecarts,
          'valeur_theorique', v_valeur_theorique,
          'valeur_reelle', v_valeur_reelle
        )
      );

    ELSE
      RAISE EXCEPTION 'Type de rapport non supporté: %', p_type;
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

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.generate_inventaire_report(UUID, TEXT, UUID) TO authenticated;

-- Ajouter un commentaire sur la fonction
COMMENT ON FUNCTION public.generate_inventaire_report IS 'Génère des rapports d''inventaire selon différents types : synthese, ecarts, valorisation, conformite, performance, personnalise';