-- ============================================
-- MIGRATION COMPLÈTE - SECTION INVENTAIRES
-- Restauration de toutes les tables et fonctions RPC
-- ============================================

-- ===========================================
-- PHASE 1: MISE À JOUR TABLE inventaire_sessions
-- ===========================================

-- Ajouter les colonnes manquantes
ALTER TABLE public.inventaire_sessions 
ADD COLUMN IF NOT EXISTS nom TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS date_creation TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'complet',
ADD COLUMN IF NOT EXISTS responsable TEXT,
ADD COLUMN IF NOT EXISTS participants TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS secteurs TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS progression NUMERIC(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS produits_comptes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS produits_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ecarts INTEGER DEFAULT 0;

-- Mettre à jour la contrainte de type
DO $$
BEGIN
  ALTER TABLE public.inventaire_sessions DROP CONSTRAINT IF EXISTS inventaire_sessions_type_check;
  ALTER TABLE public.inventaire_sessions 
  ADD CONSTRAINT inventaire_sessions_type_check 
  CHECK (type IN ('complet', 'partiel', 'cyclique'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Mettre à jour la contrainte de statut
DO $$
BEGIN
  ALTER TABLE public.inventaire_sessions DROP CONSTRAINT IF EXISTS inventaire_sessions_statut_check;
  ALTER TABLE public.inventaire_sessions 
  ADD CONSTRAINT inventaire_sessions_statut_check 
  CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'suspendue'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ===========================================
-- PHASE 2: CRÉATION TABLE inventaire_items
-- ===========================================

CREATE TABLE IF NOT EXISTS public.inventaire_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.inventaire_sessions(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES public.produits(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
  code_barre TEXT NOT NULL,
  produit_nom TEXT NOT NULL,
  lot_numero TEXT,
  emplacement_theorique TEXT NOT NULL DEFAULT '',
  emplacement_reel TEXT,
  quantite_theorique INTEGER NOT NULL DEFAULT 0,
  quantite_comptee INTEGER,
  unite TEXT NOT NULL DEFAULT 'unités',
  statut TEXT NOT NULL DEFAULT 'non_compte' CHECK (statut IN ('non_compte', 'compte', 'ecart', 'valide')),
  date_comptage TIMESTAMP WITH TIME ZONE,
  operateur_id UUID REFERENCES public.personnel(id),
  operateur_nom TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.inventaire_items ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
DROP POLICY IF EXISTS "Users can view inventory items from their tenant" ON public.inventaire_items;
CREATE POLICY "Users can view inventory items from their tenant" 
ON public.inventaire_items 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can insert inventory items in their tenant" ON public.inventaire_items;
CREATE POLICY "Users can insert inventory items in their tenant" 
ON public.inventaire_items 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can update inventory items from their tenant" ON public.inventaire_items;
CREATE POLICY "Users can update inventory items from their tenant" 
ON public.inventaire_items 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can delete inventory items from their tenant" ON public.inventaire_items;
CREATE POLICY "Users can delete inventory items from their tenant" 
ON public.inventaire_items 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer un trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_inventaire_items_updated_at ON public.inventaire_items;
CREATE TRIGGER update_inventaire_items_updated_at
  BEFORE UPDATE ON public.inventaire_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_inventaire_items_session_id ON public.inventaire_items(session_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_items_tenant_id ON public.inventaire_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_items_code_barre ON public.inventaire_items(code_barre);
CREATE INDEX IF NOT EXISTS idx_inventaire_items_statut ON public.inventaire_items(statut);

-- ===========================================
-- PHASE 3: CRÉATION TABLE inventaire_saisies
-- ===========================================

CREATE TABLE IF NOT EXISTS public.inventaire_saisies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.inventaire_sessions(id) ON DELETE CASCADE,
  code_barre TEXT NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  emplacement TEXT,
  operateur_id UUID NOT NULL,
  date_saisie TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  produit_trouve BOOLEAN DEFAULT false,
  lot_id UUID,
  produit_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.inventaire_saisies ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
DROP POLICY IF EXISTS "Users can view inventory entries from their tenant" ON public.inventaire_saisies;
CREATE POLICY "Users can view inventory entries from their tenant" 
ON public.inventaire_saisies 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can insert inventory entries in their tenant" ON public.inventaire_saisies;
CREATE POLICY "Users can insert inventory entries in their tenant" 
ON public.inventaire_saisies 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can update inventory entries from their tenant" ON public.inventaire_saisies;
CREATE POLICY "Users can update inventory entries from their tenant" 
ON public.inventaire_saisies 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can delete inventory entries from their tenant" ON public.inventaire_saisies;
CREATE POLICY "Users can delete inventory entries from their tenant" 
ON public.inventaire_saisies 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_inventaire_saisies_session_id ON public.inventaire_saisies(session_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_saisies_tenant_id ON public.inventaire_saisies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_saisies_code_barre ON public.inventaire_saisies(code_barre);
CREATE INDEX IF NOT EXISTS idx_inventaire_saisies_date_saisie ON public.inventaire_saisies(date_saisie);

-- ===========================================
-- PHASE 4: CRÉATION TABLE inventaire_rapports
-- ===========================================

CREATE TABLE IF NOT EXISTS public.inventaire_rapports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_id UUID REFERENCES public.inventaire_sessions(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('synthese', 'ecarts', 'valorisation', 'conformite', 'performance', 'personnalise')),
  format TEXT DEFAULT 'PDF' CHECK (format IN ('PDF', 'Excel', 'CSV')),
  contenu JSONB DEFAULT '{}',
  fichier_url TEXT,
  taille_fichier INTEGER,
  statut TEXT DEFAULT 'genere' CHECK (statut IN ('genere', 'en_cours', 'erreur')),
  genere_par_id UUID,
  date_generation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parametres JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.inventaire_rapports ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
DROP POLICY IF EXISTS "Users can view inventory reports from their tenant" ON public.inventaire_rapports;
CREATE POLICY "Users can view inventory reports from their tenant" 
ON public.inventaire_rapports 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can insert inventory reports in their tenant" ON public.inventaire_rapports;
CREATE POLICY "Users can insert inventory reports in their tenant" 
ON public.inventaire_rapports 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can update inventory reports from their tenant" ON public.inventaire_rapports;
CREATE POLICY "Users can update inventory reports from their tenant" 
ON public.inventaire_rapports 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can delete inventory reports from their tenant" ON public.inventaire_rapports;
CREATE POLICY "Users can delete inventory reports from their tenant" 
ON public.inventaire_rapports 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_inventaire_rapports_session_id ON public.inventaire_rapports(session_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_rapports_tenant_id ON public.inventaire_rapports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_rapports_type ON public.inventaire_rapports(type);
CREATE INDEX IF NOT EXISTS idx_inventaire_rapports_date ON public.inventaire_rapports(date_generation);

-- ===========================================
-- PHASE 5: FONCTION init_inventaire_items
-- ===========================================

CREATE OR REPLACE FUNCTION public.init_inventaire_items(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_tenant_id UUID;
  current_tenant_id UUID;
  items_count INTEGER;
  inserted_count INTEGER := 0;
BEGIN
  current_tenant_id := public.get_current_user_tenant_id();
  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
  END IF;

  SELECT tenant_id INTO session_tenant_id
  FROM public.inventaire_sessions
  WHERE id = p_session_id AND tenant_id = current_tenant_id;

  IF session_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session non trouvée');
  END IF;

  SELECT COUNT(*) INTO items_count
  FROM public.inventaire_items
  WHERE session_id = p_session_id AND tenant_id = current_tenant_id;

  IF items_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La session contient déjà des éléments');
  END IF;

  INSERT INTO public.inventaire_items (
    tenant_id, session_id, produit_id, lot_id, code_barre, produit_nom, 
    lot_numero, quantite_theorique, emplacement_theorique, unite, statut
  )
  SELECT DISTINCT
    current_tenant_id,
    p_session_id,
    v.produit_id,
    v.lot_id,
    COALESCE(v.code_cip, 'PRODUIT-' || v.produit_id::text),
    v.libelle_produit,
    v.numero_lot,
    COALESCE(v.lot_quantite_restante, 0),
    COALESCE(v.emplacement_source, 'Stock principal'),
    'unités',
    'non_compte'
  FROM public.v_mouvements_lots_details v
  WHERE v.tenant_id = current_tenant_id 
    AND v.lot_quantite_restante > 0
    AND v.libelle_produit IS NOT NULL;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  UPDATE public.inventaire_sessions
  SET 
    produits_total = inserted_count,
    produits_comptes = 0,
    ecarts = 0,
    progression = 0,
    updated_at = NOW()
  WHERE id = p_session_id AND tenant_id = current_tenant_id;

  RETURN jsonb_build_object(
    'success', true, 
    'inserted_count', inserted_count,
    'message', format('Session initialisée avec %s éléments', inserted_count)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ===========================================
-- PHASE 6: FONCTION rpc_inventory_create_session
-- ===========================================

CREATE OR REPLACE FUNCTION public.rpc_inventory_create_session(
  session_name TEXT,
  session_description TEXT DEFAULT NULL,
  session_type TEXT DEFAULT 'complet',
  session_secteurs TEXT[] DEFAULT '{}',
  session_participants TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_session_id UUID;
  current_tenant_id UUID;
  current_personnel_id UUID;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  SELECT id INTO current_personnel_id 
  FROM personnel 
  WHERE auth_user_id = auth.uid() AND tenant_id = current_tenant_id;
  
  IF current_tenant_id IS NULL OR current_personnel_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;
  
  INSERT INTO inventaire_sessions (
    tenant_id, nom, description, type, secteurs, participants,
    agent_id, responsable, statut, date_creation
  ) VALUES (
    current_tenant_id, session_name, session_description, session_type,
    session_secteurs, session_participants, current_personnel_id,
    (SELECT CONCAT(prenoms, ' ', noms) FROM personnel WHERE id = current_personnel_id),
    'planifiee', now()
  ) RETURNING id INTO new_session_id;
  
  RETURN new_session_id;
END;
$$;

-- ===========================================
-- PHASE 7: FONCTION rpc_inventory_start_session
-- ===========================================

CREATE OR REPLACE FUNCTION public.rpc_inventory_start_session(session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tenant_id UUID;
  total_products INTEGER;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  
  IF NOT EXISTS (
    SELECT 1 FROM inventaire_sessions 
    WHERE id = session_id AND tenant_id = current_tenant_id
  ) THEN
    RAISE EXCEPTION 'Session not found or unauthorized';
  END IF;
  
  SELECT COUNT(*) INTO total_products
  FROM produits p
  WHERE p.tenant_id = current_tenant_id AND p.is_active = true;
  
  UPDATE inventaire_sessions 
  SET statut = 'en_cours', 
      date_debut = now(),
      produits_total = total_products,
      updated_at = now()
  WHERE id = session_id AND tenant_id = current_tenant_id;
  
  RETURN FOUND;
END;
$$;

-- ===========================================
-- PHASE 8: FONCTION rpc_inventory_record_entry
-- ===========================================

CREATE OR REPLACE FUNCTION public.rpc_inventory_record_entry(
  session_id UUID,
  code_barre TEXT,
  quantite INTEGER DEFAULT 1,
  emplacement TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tenant_id UUID;
  current_personnel_id UUID;
  found_product RECORD;
  found_lot RECORD;
  entry_id UUID;
  result JSONB;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  SELECT id INTO current_personnel_id 
  FROM personnel 
  WHERE auth_user_id = auth.uid() AND tenant_id = current_tenant_id;
  
  IF current_tenant_id IS NULL OR current_personnel_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM inventaire_sessions 
    WHERE id = session_id AND tenant_id = current_tenant_id AND statut = 'en_cours'
  ) THEN
    RAISE EXCEPTION 'Session not found, completed, or not started';
  END IF;
  
  SELECT p.id, p.libelle_produit, p.code_cip 
  INTO found_product
  FROM produits p
  WHERE p.tenant_id = current_tenant_id 
    AND p.is_active = true
    AND (p.code_cip = code_barre OR p.code_barre = code_barre)
  LIMIT 1;
  
  IF found_product IS NULL THEN
    SELECT l.id, l.numero_lot, l.produit_id, p.libelle_produit
    INTO found_lot
    FROM lots l
    JOIN produits p ON l.produit_id = p.id
    WHERE l.tenant_id = current_tenant_id 
      AND (l.numero_lot = code_barre OR l.code_barre = code_barre)
    LIMIT 1;
    
    IF found_lot IS NOT NULL THEN
      found_product.id := found_lot.produit_id;
      found_product.libelle_produit := found_lot.libelle_produit;
    END IF;
  END IF;
  
  INSERT INTO inventaire_saisies (
    tenant_id, session_id, code_barre, quantite, emplacement,
    operateur_id, produit_trouve, produit_id, lot_id
  ) VALUES (
    current_tenant_id, session_id, code_barre, quantite, emplacement,
    current_personnel_id, found_product IS NOT NULL, 
    found_product.id, found_lot.id
  ) RETURNING id INTO entry_id;
  
  result := jsonb_build_object(
    'entry_id', entry_id,
    'product_found', found_product IS NOT NULL,
    'product_name', COALESCE(found_product.libelle_produit, 'Produit non trouvé'),
    'lot_number', found_lot.numero_lot
  );
  
  RETURN result;
END;
$$;

-- ===========================================
-- PHASE 9: FONCTION generate_inventaire_report
-- ===========================================

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
  SELECT to_jsonb(s.*) INTO v_session_data
  FROM inventaire_sessions s
  WHERE s.id = p_session_id AND s.tenant_id = p_tenant_id;
  
  IF v_session_data IS NULL THEN
    RAISE EXCEPTION 'Session d''inventaire non trouvée';
  END IF;

  SELECT 
    jsonb_agg(to_jsonb(i.*)) INTO v_items_data
  FROM inventaire_items i
  WHERE i.session_id = p_session_id AND i.tenant_id = p_tenant_id;

  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE statut = 'compte'),
    COUNT(*) FILTER (WHERE statut = 'compte' AND quantite_comptee = quantite_theorique),
    COUNT(*) FILTER (WHERE statut = 'compte' AND quantite_comptee != quantite_theorique),
    COUNT(*) FILTER (WHERE statut = 'compte' AND quantite_comptee > quantite_theorique),
    COUNT(*) FILTER (WHERE statut = 'compte' AND quantite_comptee < quantite_theorique),
    COALESCE(SUM(quantite_theorique * COALESCE((SELECT prix_unitaire FROM lots WHERE numero_lot = i.lot_numero AND tenant_id = i.tenant_id LIMIT 1), 0)), 0),
    COALESCE(SUM(quantite_comptee * COALESCE((SELECT prix_unitaire FROM lots WHERE numero_lot = i.lot_numero AND tenant_id = i.tenant_id LIMIT 1), 0)), 0)
  INTO 
    v_total_items, v_items_comptes, v_items_conformes, v_items_ecarts,
    v_ecart_positif, v_ecart_negatif, v_valeur_theorique, v_valeur_reelle
  FROM inventaire_items i
  WHERE session_id = p_session_id AND tenant_id = p_tenant_id;

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
      LEFT JOIN lots l ON l.numero_lot = i.lot_numero AND l.tenant_id = i.tenant_id
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
          'items_en_deficit', v_ecart_negatif
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

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.init_inventaire_items(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_inventory_create_session(TEXT, TEXT, TEXT, TEXT[], TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_inventory_start_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_inventory_record_entry(UUID, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_inventaire_report(UUID, TEXT, UUID) TO authenticated;

-- Commentaires
COMMENT ON TABLE public.inventaire_items IS 'Articles à compter dans chaque session d''inventaire';
COMMENT ON TABLE public.inventaire_saisies IS 'Historique des scans de codes-barres lors des inventaires';
COMMENT ON TABLE public.inventaire_rapports IS 'Rapports générés pour les sessions d''inventaire';
COMMENT ON FUNCTION public.init_inventaire_items IS 'Initialise les items d''une session d''inventaire depuis le stock actuel';
COMMENT ON FUNCTION public.generate_inventaire_report IS 'Génère des rapports d''inventaire selon différents types';
COMMENT ON FUNCTION public.rpc_inventory_create_session IS 'Crée une nouvelle session d''inventaire';
COMMENT ON FUNCTION public.rpc_inventory_start_session IS 'Démarre une session d''inventaire planifiée';
COMMENT ON FUNCTION public.rpc_inventory_record_entry IS 'Enregistre un scan de code-barre lors d''un inventaire';