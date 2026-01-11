-- Fix init_inventaire_items to use correct session columns (type instead of type_inventaire, direct filter columns instead of parametres)
DROP FUNCTION IF EXISTS public.init_inventaire_items(uuid, uuid);

CREATE OR REPLACE FUNCTION public.init_inventaire_items(
  p_session_id uuid,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_tenant_id uuid;
  v_type text;
  v_filtres_rayon uuid[];
  v_filtres_fournisseur uuid[];
  v_filtres_emplacement text[];
  v_filtres_peremption_jours integer;
  v_cyclique_jours integer;
  v_inserted_count integer := 0;
BEGIN
  -- Get session info
  SELECT * INTO v_session
  FROM inventaire_sessions
  WHERE id = p_session_id;
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;
  
  -- Determine tenant_id
  v_tenant_id := COALESCE(p_tenant_id, v_session.tenant_id);
  
  -- Read session fields (using correct column names from inventaire_sessions table)
  v_type := COALESCE(v_session.type, 'complet');
  v_filtres_rayon := v_session.filtres_rayon;
  v_filtres_fournisseur := v_session.filtres_fournisseur;
  v_filtres_emplacement := v_session.filtres_emplacement;
  v_filtres_peremption_jours := COALESCE(v_session.filtres_peremption_jours, 90);
  v_cyclique_jours := COALESCE(v_session.cyclique_jours, 30);
  
  -- Delete existing items for this session
  DELETE FROM inventaire_items WHERE session_id = p_session_id;
  
  -- Insert items based on inventory type
  IF v_type IN ('complet', 'partiel') THEN
    INSERT INTO inventaire_items (
      session_id,
      tenant_id,
      produit_id,
      lot_id,
      produit_nom,
      lot_numero,
      code_barre,
      quantite_theorique,
      emplacement_theorique,
      statut
    )
    SELECT 
      p_session_id,
      v_tenant_id,
      p.id,
      l.id,
      p.libelle_produit,
      l.numero_lot,
      COALESCE(p.code_cip, p.code_barre_externe, ''),
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.emplacement, ''),
      'en_attente'
    FROM lots l
    INNER JOIN produits p ON l.produit_id = p.id AND l.tenant_id = p.tenant_id
    WHERE l.tenant_id = v_tenant_id
      AND COALESCE(l.quantite_restante, 0) > 0
      AND COALESCE(l.statut, 'Disponible') IN ('Disponible', 'actif', 'disponible', 'Actif')
      AND COALESCE(p.is_active, true) = true
      -- Apply rayon filter if set
      AND (v_filtres_rayon IS NULL OR array_length(v_filtres_rayon, 1) IS NULL OR p.rayon_id = ANY(v_filtres_rayon))
      -- Apply fournisseur filter if set
      AND (v_filtres_fournisseur IS NULL OR array_length(v_filtres_fournisseur, 1) IS NULL OR p.fournisseur_id = ANY(v_filtres_fournisseur))
      -- Apply emplacement filter if set
      AND (v_filtres_emplacement IS NULL OR array_length(v_filtres_emplacement, 1) IS NULL OR l.emplacement = ANY(v_filtres_emplacement));
      
  ELSIF v_type = 'cyclique' THEN
    -- Cyclique: products not inventoried in the last N days
    INSERT INTO inventaire_items (
      session_id,
      tenant_id,
      produit_id,
      lot_id,
      produit_nom,
      lot_numero,
      code_barre,
      quantite_theorique,
      emplacement_theorique,
      statut
    )
    SELECT 
      p_session_id,
      v_tenant_id,
      p.id,
      l.id,
      p.libelle_produit,
      l.numero_lot,
      COALESCE(p.code_cip, p.code_barre_externe, ''),
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.emplacement, ''),
      'en_attente'
    FROM lots l
    INNER JOIN produits p ON l.produit_id = p.id AND l.tenant_id = p.tenant_id
    WHERE l.tenant_id = v_tenant_id
      AND COALESCE(l.quantite_restante, 0) > 0
      AND COALESCE(l.statut, 'Disponible') IN ('Disponible', 'actif', 'disponible', 'Actif')
      AND COALESCE(p.is_active, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM inventaire_items ii
        INNER JOIN inventaire_sessions iss ON ii.session_id = iss.id
        WHERE ii.produit_id = p.id
          AND ii.tenant_id = v_tenant_id
          AND iss.statut = 'termine'
          AND iss.date_fin >= (CURRENT_DATE - v_cyclique_jours)
      );
      
  ELSIF v_type = 'peremption' THEN
    -- Peremption: lots expiring within N days
    INSERT INTO inventaire_items (
      session_id,
      tenant_id,
      produit_id,
      lot_id,
      produit_nom,
      lot_numero,
      code_barre,
      quantite_theorique,
      emplacement_theorique,
      statut
    )
    SELECT 
      p_session_id,
      v_tenant_id,
      p.id,
      l.id,
      p.libelle_produit,
      l.numero_lot,
      COALESCE(p.code_cip, p.code_barre_externe, ''),
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.emplacement, ''),
      'en_attente'
    FROM lots l
    INNER JOIN produits p ON l.produit_id = p.id AND l.tenant_id = p.tenant_id
    WHERE l.tenant_id = v_tenant_id
      AND COALESCE(l.quantite_restante, 0) > 0
      AND COALESCE(l.statut, 'Disponible') IN ('Disponible', 'actif', 'disponible', 'Actif')
      AND COALESCE(p.is_active, true) = true
      AND l.date_peremption IS NOT NULL
      AND l.date_peremption <= (CURRENT_DATE + v_filtres_peremption_jours);
  END IF;
  
  -- Get count of inserted items
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  
  -- Update session status if items were inserted
  IF v_inserted_count > 0 THEN
    UPDATE inventaire_sessions 
    SET statut = 'en_cours',
        date_debut = COALESCE(date_debut, now())
    WHERE id = p_session_id
      AND statut = 'planifie';
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', v_inserted_count,
    'session_id', p_session_id,
    'type', v_type
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;