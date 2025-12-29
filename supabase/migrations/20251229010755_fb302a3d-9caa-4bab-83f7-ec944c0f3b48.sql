-- Supprimer les anciennes versions de init_inventaire_items avec différentes signatures
DROP FUNCTION IF EXISTS public.init_inventaire_items(UUID);
DROP FUNCTION IF EXISTS public.init_inventaire_items(UUID, UUID);

-- Recréer la fonction init_inventaire_items avec signature unique (1 paramètre)
CREATE OR REPLACE FUNCTION public.init_inventaire_items(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_tenant_id UUID;
  v_session RECORD;
  v_count INTEGER := 0;
  v_type TEXT;
  v_filtres_rayon UUID[];
  v_filtres_fournisseur UUID[];
  v_filtres_emplacement TEXT[];
  v_filtres_peremption_jours INTEGER;
  v_cyclique_jours INTEGER;
BEGIN
  -- Récupérer le tenant_id de l'utilisateur courant
  SELECT tenant_id INTO v_tenant_id
  FROM public.personnel
  WHERE auth_user_id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant non trouvé');
  END IF;
  
  -- Récupérer les informations de la session
  SELECT * INTO v_session
  FROM public.inventaire_sessions
  WHERE id = p_session_id AND tenant_id = v_tenant_id;
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session non trouvée');
  END IF;
  
  -- Vérifier si des items existent déjà
  SELECT COUNT(*) INTO v_count
  FROM public.inventaire_items
  WHERE session_id = p_session_id;
  
  IF v_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La session contient déjà des articles');
  END IF;
  
  -- Extraire les paramètres de la session
  v_type := v_session.type_inventaire;
  v_filtres_rayon := CASE 
    WHEN v_session.filtres_rayon IS NOT NULL AND jsonb_array_length(v_session.filtres_rayon) > 0 
    THEN ARRAY(SELECT jsonb_array_elements_text(v_session.filtres_rayon)::UUID)
    ELSE NULL 
  END;
  v_filtres_fournisseur := CASE 
    WHEN v_session.filtres_fournisseur IS NOT NULL AND jsonb_array_length(v_session.filtres_fournisseur) > 0 
    THEN ARRAY(SELECT jsonb_array_elements_text(v_session.filtres_fournisseur)::UUID)
    ELSE NULL 
  END;
  v_filtres_emplacement := CASE 
    WHEN v_session.filtres_emplacement IS NOT NULL AND jsonb_array_length(v_session.filtres_emplacement) > 0 
    THEN ARRAY(SELECT jsonb_array_elements_text(v_session.filtres_emplacement))
    ELSE NULL 
  END;
  v_filtres_peremption_jours := COALESCE((v_session.parametres->>'peremption_jours')::INTEGER, 90);
  v_cyclique_jours := COALESCE((v_session.parametres->>'cyclique_jours')::INTEGER, 30);
  
  -- Insérer les items selon le type d'inventaire
  IF v_type = 'complet' OR v_type = 'partiel' OR v_type = 'tournant' THEN
    INSERT INTO public.inventaire_items (
      tenant_id, session_id, produit_id, lot_id, 
      quantite_theorique, code_barre, designation, emplacement
    )
    SELECT DISTINCT ON (p.id, l.id)
      v_tenant_id,
      p_session_id,
      p.id,
      l.id,
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.code_barre, p.code_barre),
      p.nom,
      l.emplacement
    FROM produits p
    INNER JOIN lots l ON l.produit_id = p.id AND l.tenant_id = v_tenant_id
    WHERE p.tenant_id = v_tenant_id
      AND p.is_active = true
      AND COALESCE(l.quantite_restante, 0) > 0
      AND (l.statut IS NULL OR l.statut = 'Disponible')
      AND (v_filtres_rayon IS NULL OR p.rayon_id = ANY(v_filtres_rayon))
      AND (v_filtres_fournisseur IS NULL OR p.fournisseur_id = ANY(v_filtres_fournisseur))
      AND (v_filtres_emplacement IS NULL OR l.emplacement = ANY(v_filtres_emplacement));
      
  ELSIF v_type = 'cyclique' THEN
    INSERT INTO public.inventaire_items (
      tenant_id, session_id, produit_id, lot_id, 
      quantite_theorique, code_barre, designation, emplacement
    )
    SELECT DISTINCT ON (p.id, l.id)
      v_tenant_id,
      p_session_id,
      p.id,
      l.id,
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.code_barre, p.code_barre),
      p.nom,
      l.emplacement
    FROM produits p
    INNER JOIN lots l ON l.produit_id = p.id AND l.tenant_id = v_tenant_id
    LEFT JOIN inventaire_items ii ON ii.produit_id = p.id 
      AND ii.tenant_id = v_tenant_id
      AND ii.created_at > NOW() - (v_cyclique_jours || ' days')::INTERVAL
    WHERE p.tenant_id = v_tenant_id
      AND p.is_active = true
      AND COALESCE(l.quantite_restante, 0) > 0
      AND (l.statut IS NULL OR l.statut = 'Disponible')
      AND ii.id IS NULL
      AND (v_filtres_rayon IS NULL OR p.rayon_id = ANY(v_filtres_rayon))
      AND (v_filtres_fournisseur IS NULL OR p.fournisseur_id = ANY(v_filtres_fournisseur))
      AND (v_filtres_emplacement IS NULL OR l.emplacement = ANY(v_filtres_emplacement));
      
  ELSIF v_type = 'peremption' THEN
    INSERT INTO public.inventaire_items (
      tenant_id, session_id, produit_id, lot_id, 
      quantite_theorique, code_barre, designation, emplacement
    )
    SELECT DISTINCT ON (p.id, l.id)
      v_tenant_id,
      p_session_id,
      p.id,
      l.id,
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.code_barre, p.code_barre),
      p.nom,
      l.emplacement
    FROM produits p
    INNER JOIN lots l ON l.produit_id = p.id AND l.tenant_id = v_tenant_id
    WHERE p.tenant_id = v_tenant_id
      AND p.is_active = true
      AND COALESCE(l.quantite_restante, 0) > 0
      AND (l.statut IS NULL OR l.statut = 'Disponible')
      AND l.date_peremption IS NOT NULL
      AND l.date_peremption <= NOW() + (v_filtres_peremption_jours || ' days')::INTERVAL
      AND (v_filtres_rayon IS NULL OR p.rayon_id = ANY(v_filtres_rayon))
      AND (v_filtres_fournisseur IS NULL OR p.fournisseur_id = ANY(v_filtres_fournisseur))
      AND (v_filtres_emplacement IS NULL OR l.emplacement = ANY(v_filtres_emplacement));
  END IF;
  
  -- Compter les items insérés
  SELECT COUNT(*) INTO v_count
  FROM public.inventaire_items
  WHERE session_id = p_session_id;
  
  -- Mettre à jour la session avec le nombre d'items
  UPDATE public.inventaire_sessions
  SET 
    total_items = v_count,
    items_comptes = 0,
    items_valides = 0,
    items_ecarts = 0,
    updated_at = NOW()
  WHERE id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'count', v_count,
    'message', 'Articles initialisés avec succès'
  );
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.init_inventaire_items(UUID) TO authenticated;