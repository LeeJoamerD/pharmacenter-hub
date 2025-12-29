-- =============================================
-- AMÉLIORATION COMPLÈTE DU MODULE INVENTAIRE
-- Phase 1: Nouvelles colonnes de filtrage
-- Phase 2: Fonction init_inventaire_items corrigée
-- =============================================

-- ===========================================
-- PHASE 1: AJOUT DES COLONNES DE FILTRAGE
-- ===========================================

-- Colonnes pour inventaire PARTIEL
ALTER TABLE public.inventaire_sessions 
ADD COLUMN IF NOT EXISTS filtres_rayon UUID[],
ADD COLUMN IF NOT EXISTS filtres_fournisseur UUID[],
ADD COLUMN IF NOT EXISTS filtres_emplacement TEXT[],
ADD COLUMN IF NOT EXISTS filtres_peremption_jours INTEGER;

-- Colonne pour inventaire CYCLIQUE
ALTER TABLE public.inventaire_sessions 
ADD COLUMN IF NOT EXISTS cyclique_jours INTEGER DEFAULT 30;

-- ===========================================
-- PHASE 2: SUPPRIMER LES ANCIENNES FONCTIONS
-- ===========================================

DROP FUNCTION IF EXISTS public.init_inventaire_items(UUID);
DROP FUNCTION IF EXISTS public.init_inventaire_items(UUID, UUID);

-- ===========================================
-- PHASE 3: NOUVELLE FONCTION UNIFIÉE
-- ===========================================

CREATE OR REPLACE FUNCTION public.init_inventaire_items(
  p_session_id UUID,
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  v_session RECORD;
  v_inserted_count INTEGER := 0;
  v_existing_count INTEGER;
BEGIN
  -- Vérifier que le tenant est valide
  IF p_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant ID requis');
  END IF;

  -- Récupérer les informations de la session
  SELECT 
    id, type, filtres_rayon, filtres_fournisseur, 
    filtres_emplacement, filtres_peremption_jours, cyclique_jours
  INTO v_session
  FROM public.inventaire_sessions
  WHERE id = p_session_id AND tenant_id = p_tenant_id;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session non trouvée');
  END IF;

  -- Vérifier si la session a déjà des éléments
  SELECT COUNT(*) INTO v_existing_count
  FROM public.inventaire_items
  WHERE session_id = p_session_id AND tenant_id = p_tenant_id;

  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La session contient déjà des éléments', 'count', v_existing_count);
  END IF;

  -- Insérer les items selon le type d'inventaire
  IF v_session.type = 'complet' THEN
    -- INVENTAIRE COMPLET: Tous les lots actifs avec quantité > 0
    INSERT INTO public.inventaire_items (
      tenant_id, session_id, produit_id, lot_id, code_barre, produit_nom,
      lot_numero, quantite_theorique, emplacement_theorique, unite, statut
    )
    SELECT 
      p_tenant_id,
      p_session_id,
      l.produit_id,
      l.id,
      COALESCE(p.code_cip, p.code_ean, 'PROD-' || p.id::text),
      p.libelle_produit,
      l.numero_lot,
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.emplacement, 'Stock principal'),
      'unités',
      'non_compte'
    FROM public.lots l
    JOIN public.produits p ON l.produit_id = p.id AND p.tenant_id = p_tenant_id
    LEFT JOIN public.rayons_produits rp ON p.rayon_id = rp.id
    WHERE l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
      AND p.is_active = true;
      
  ELSIF v_session.type = 'partiel' THEN
    -- INVENTAIRE PARTIEL: Filtrer par rayon, fournisseur, emplacement ou péremption
    INSERT INTO public.inventaire_items (
      tenant_id, session_id, produit_id, lot_id, code_barre, produit_nom,
      lot_numero, quantite_theorique, emplacement_theorique, unite, statut
    )
    SELECT 
      p_tenant_id,
      p_session_id,
      l.produit_id,
      l.id,
      COALESCE(p.code_cip, p.code_ean, 'PROD-' || p.id::text),
      p.libelle_produit,
      l.numero_lot,
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.emplacement, 'Stock principal'),
      'unités',
      'non_compte'
    FROM public.lots l
    JOIN public.produits p ON l.produit_id = p.id AND p.tenant_id = p_tenant_id
    LEFT JOIN public.rayons_produits rp ON p.rayon_id = rp.id
    WHERE l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
      AND p.is_active = true
      -- Filtre par RAYON (si spécifié)
      AND (
        v_session.filtres_rayon IS NULL 
        OR array_length(v_session.filtres_rayon, 1) IS NULL 
        OR p.rayon_id = ANY(v_session.filtres_rayon)
      )
      -- Filtre par FOURNISSEUR (si spécifié)
      AND (
        v_session.filtres_fournisseur IS NULL 
        OR array_length(v_session.filtres_fournisseur, 1) IS NULL 
        OR l.fournisseur_id = ANY(v_session.filtres_fournisseur)
      )
      -- Filtre par EMPLACEMENT (si spécifié)
      AND (
        v_session.filtres_emplacement IS NULL 
        OR array_length(v_session.filtres_emplacement, 1) IS NULL 
        OR l.emplacement = ANY(v_session.filtres_emplacement)
      )
      -- Filtre par DATE DE PÉREMPTION (si spécifié)
      AND (
        v_session.filtres_peremption_jours IS NULL 
        OR l.date_peremption <= (CURRENT_DATE + (v_session.filtres_peremption_jours || ' days')::interval)
      );
      
  ELSIF v_session.type = 'cyclique' THEN
    -- INVENTAIRE CYCLIQUE: Produits non inventoriés depuis X jours
    INSERT INTO public.inventaire_items (
      tenant_id, session_id, produit_id, lot_id, code_barre, produit_nom,
      lot_numero, quantite_theorique, emplacement_theorique, unite, statut
    )
    SELECT 
      p_tenant_id,
      p_session_id,
      l.produit_id,
      l.id,
      COALESCE(p.code_cip, p.code_ean, 'PROD-' || p.id::text),
      p.libelle_produit,
      l.numero_lot,
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.emplacement, 'Stock principal'),
      'unités',
      'non_compte'
    FROM public.lots l
    JOIN public.produits p ON l.produit_id = p.id AND p.tenant_id = p_tenant_id
    LEFT JOIN public.rayons_produits rp ON p.rayon_id = rp.id
    LEFT JOIN LATERAL (
      -- Trouver la dernière date d'inventaire pour ce produit
      SELECT MAX(ii.updated_at) as derniere_date
      FROM public.inventaire_items ii
      WHERE ii.produit_id = l.produit_id 
        AND ii.tenant_id = p_tenant_id 
        AND ii.statut IN ('compte', 'valide')
    ) last_inv ON true
    WHERE l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
      AND p.is_active = true
      -- Sélectionner si jamais inventorié OU inventorié il y a plus de X jours
      AND (
        last_inv.derniere_date IS NULL 
        OR last_inv.derniere_date < (NOW() - (COALESCE(v_session.cyclique_jours, 30) || ' days')::interval)
      );
      
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Type d''inventaire non reconnu: ' || v_session.type);
  END IF;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  -- Mettre à jour les agrégats de la session
  UPDATE public.inventaire_sessions
  SET 
    produits_total = v_inserted_count,
    produits_comptes = 0,
    ecarts = 0,
    progression = 0,
    updated_at = NOW()
  WHERE id = p_session_id AND tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'success', true, 
    'inserted_count', v_inserted_count,
    'session_type', v_session.type,
    'message', format('Session initialisée avec %s éléments', v_inserted_count)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ===========================================
-- PHASE 4: FONCTION DE PRÉVISUALISATION
-- ===========================================

CREATE OR REPLACE FUNCTION public.preview_inventaire_items_count(
  p_tenant_id UUID,
  p_type TEXT,
  p_filtres_rayon UUID[] DEFAULT NULL,
  p_filtres_fournisseur UUID[] DEFAULT NULL,
  p_filtres_emplacement TEXT[] DEFAULT NULL,
  p_filtres_peremption_jours INTEGER DEFAULT NULL,
  p_cyclique_jours INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant ID requis');
  END IF;

  IF p_type = 'complet' THEN
    SELECT COUNT(DISTINCT l.id) INTO v_count
    FROM public.lots l
    JOIN public.produits p ON l.produit_id = p.id AND p.tenant_id = p_tenant_id
    WHERE l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
      AND p.is_active = true;
      
  ELSIF p_type = 'partiel' THEN
    SELECT COUNT(DISTINCT l.id) INTO v_count
    FROM public.lots l
    JOIN public.produits p ON l.produit_id = p.id AND p.tenant_id = p_tenant_id
    WHERE l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
      AND p.is_active = true
      AND (p_filtres_rayon IS NULL OR array_length(p_filtres_rayon, 1) IS NULL OR p.rayon_id = ANY(p_filtres_rayon))
      AND (p_filtres_fournisseur IS NULL OR array_length(p_filtres_fournisseur, 1) IS NULL OR l.fournisseur_id = ANY(p_filtres_fournisseur))
      AND (p_filtres_emplacement IS NULL OR array_length(p_filtres_emplacement, 1) IS NULL OR l.emplacement = ANY(p_filtres_emplacement))
      AND (p_filtres_peremption_jours IS NULL OR l.date_peremption <= (CURRENT_DATE + (p_filtres_peremption_jours || ' days')::interval));
      
  ELSIF p_type = 'cyclique' THEN
    SELECT COUNT(DISTINCT l.id) INTO v_count
    FROM public.lots l
    JOIN public.produits p ON l.produit_id = p.id AND p.tenant_id = p_tenant_id
    LEFT JOIN LATERAL (
      SELECT MAX(ii.updated_at) as derniere_date
      FROM public.inventaire_items ii
      WHERE ii.produit_id = l.produit_id 
        AND ii.tenant_id = p_tenant_id 
        AND ii.statut IN ('compte', 'valide')
    ) last_inv ON true
    WHERE l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
      AND p.is_active = true
      AND (last_inv.derniere_date IS NULL OR last_inv.derniere_date < (NOW() - (COALESCE(p_cyclique_jours, 30) || ' days')::interval));
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Type non reconnu');
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'count', v_count,
    'type', p_type
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;