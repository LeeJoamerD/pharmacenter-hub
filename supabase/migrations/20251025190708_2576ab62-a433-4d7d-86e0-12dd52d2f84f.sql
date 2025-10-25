-- ============================================
-- MIGRATION: Fonctions RPC Stock
-- Corrige les signatures des fonctions RPC pour le module Stock
-- ============================================

-- 1. FONCTION: rpc_stock_record_movement
-- Signature complète avec tous les paramètres attendus par le frontend
CREATE OR REPLACE FUNCTION public.rpc_stock_record_movement(
  p_lot_id UUID,
  p_produit_id UUID,
  p_type_mouvement TEXT,
  p_quantite_mouvement INTEGER,
  p_quantite_reelle INTEGER DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_document TEXT DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_lot_destination_id UUID DEFAULT NULL,
  p_emplacement_source TEXT DEFAULT NULL,
  p_emplacement_destination TEXT DEFAULT NULL,
  p_motif TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_lot_record RECORD;
  v_quantite_avant INTEGER;
  v_quantite_apres INTEGER;
  v_mouvement_id UUID;
  v_prix_unitaire NUMERIC;
  v_valeur_mouvement NUMERIC;
BEGIN
  -- Récupérer le tenant de l'utilisateur actuel
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tenant non trouvé pour l''utilisateur actuel'
    );
  END IF;

  -- Récupérer l'état actuel du lot
  SELECT * INTO v_lot_record 
  FROM public.lots 
  WHERE id = p_lot_id AND tenant_id = v_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Lot non trouvé'
    );
  END IF;
  
  v_quantite_avant := v_lot_record.quantite_restante;
  v_prix_unitaire := v_lot_record.prix_achat_unitaire;
  
  -- Calculer la quantité après selon le type de mouvement
  IF p_type_mouvement IN ('sortie', 'peremption', 'destruction', 'retour_fournisseur') THEN
    v_quantite_apres := v_quantite_avant - p_quantite_mouvement;
  ELSIF p_type_mouvement IN ('entree', 'retour', 'ajustement_positif') THEN
    v_quantite_apres := v_quantite_avant + p_quantite_mouvement;
  ELSIF p_type_mouvement = 'ajustement' THEN
    -- Pour les ajustements, utiliser quantite_reelle si fournie, sinon calculer la différence
    IF p_quantite_reelle IS NOT NULL THEN
      v_quantite_apres := p_quantite_reelle;
    ELSE
      v_quantite_apres := p_quantite_mouvement;
    END IF;
  ELSIF p_type_mouvement = 'transfert' THEN
    v_quantite_apres := v_quantite_avant - p_quantite_mouvement;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Type de mouvement invalide: ' || p_type_mouvement
    );
  END IF;
  
  -- Vérifier que la quantité ne devient pas négative
  IF v_quantite_apres < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Stock insuffisant. Stock actuel: ' || v_quantite_avant || ', Demandé: ' || p_quantite_mouvement
    );
  END IF;

  -- Calculer la valeur du mouvement
  v_valeur_mouvement := v_prix_unitaire * p_quantite_mouvement;
  
  -- Insérer le mouvement dans mouvements_lots
  INSERT INTO public.mouvements_lots (
    tenant_id, 
    lot_id, 
    produit_id, 
    type_mouvement,
    date_mouvement,
    quantite_avant, 
    quantite_mouvement, 
    quantite_apres,
    prix_unitaire,
    valeur_mouvement,
    reference_id,
    reference_type,
    reference_document,
    motif, 
    agent_id,
    lot_destination_id,
    emplacement_source,
    emplacement_destination,
    metadata
  ) VALUES (
    v_tenant_id, 
    p_lot_id, 
    p_produit_id, 
    p_type_mouvement,
    now(),
    v_quantite_avant, 
    p_quantite_mouvement, 
    v_quantite_apres,
    v_prix_unitaire,
    v_valeur_mouvement,
    p_reference_id,
    p_reference_type,
    p_reference_document,
    p_motif, 
    p_agent_id,
    p_lot_destination_id,
    p_emplacement_source,
    p_emplacement_destination,
    p_metadata
  ) RETURNING id INTO v_mouvement_id;
  
  -- Mettre à jour le lot
  UPDATE public.lots 
  SET quantite_restante = v_quantite_apres,
      updated_at = now()
  WHERE id = p_lot_id;
  
  -- Si c'est un transfert, créer le mouvement d'entrée dans le lot destination
  IF p_type_mouvement = 'transfert' AND p_lot_destination_id IS NOT NULL THEN
    PERFORM public.rpc_stock_record_movement(
      p_lot_destination_id,
      p_produit_id,
      'entree',
      p_quantite_mouvement,
      NULL,
      p_reference_id,
      p_reference_type,
      p_reference_document,
      p_agent_id,
      NULL,
      p_emplacement_source,
      p_emplacement_destination,
      'Transfert depuis lot ' || p_lot_id::text,
      p_metadata
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'movement_id', v_mouvement_id,
    'quantite_avant', v_quantite_avant,
    'quantite_apres', v_quantite_apres,
    'valeur_mouvement', v_valeur_mouvement
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 2. FONCTION: rpc_stock_update_movement
-- Permet de modifier un mouvement existant
CREATE OR REPLACE FUNCTION public.rpc_stock_update_movement(
  p_mouvement_id UUID,
  p_quantite_mouvement INTEGER,
  p_motif TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_mouvement_record RECORD;
  v_lot_record RECORD;
  v_diff INTEGER;
  v_quantite_apres INTEGER;
BEGIN
  -- Récupérer le tenant
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant non trouvé');
  END IF;

  -- Récupérer le mouvement existant
  SELECT * INTO v_mouvement_record 
  FROM public.mouvements_lots 
  WHERE id = p_mouvement_id AND tenant_id = v_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mouvement non trouvé');
  END IF;
  
  -- Récupérer l'état actuel du lot
  SELECT * INTO v_lot_record 
  FROM public.lots 
  WHERE id = v_mouvement_record.lot_id AND tenant_id = v_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;
  
  -- Calculer la différence
  v_diff := p_quantite_mouvement - v_mouvement_record.quantite_mouvement;
  
  -- Calculer la nouvelle quantité
  IF v_mouvement_record.type_mouvement IN ('sortie', 'peremption', 'destruction') THEN
    v_quantite_apres := v_lot_record.quantite_restante - v_diff;
  ELSIF v_mouvement_record.type_mouvement IN ('entree', 'retour') THEN
    v_quantite_apres := v_lot_record.quantite_restante + v_diff;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Type de mouvement non supporté pour modification');
  END IF;
  
  -- Vérifier que la quantité ne devient pas négative
  IF v_quantite_apres < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stock insuffisant');
  END IF;
  
  -- Mettre à jour le mouvement
  UPDATE public.mouvements_lots
  SET quantite_mouvement = p_quantite_mouvement,
      quantite_apres = v_quantite_apres,
      motif = COALESCE(p_motif, motif),
      metadata = COALESCE(p_metadata, metadata)
  WHERE id = p_mouvement_id;
  
  -- Mettre à jour le lot
  UPDATE public.lots
  SET quantite_restante = v_quantite_apres,
      updated_at = now()
  WHERE id = v_mouvement_record.lot_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'quantite_apres', v_quantite_apres
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. FONCTION: rpc_stock_delete_movement
-- Permet de supprimer un mouvement et d'inverser son impact
CREATE OR REPLACE FUNCTION public.rpc_stock_delete_movement(p_mouvement_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_mouvement_record RECORD;
  v_lot_record RECORD;
  v_quantite_apres INTEGER;
BEGIN
  -- Récupérer le tenant
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant non trouvé');
  END IF;

  -- Récupérer le mouvement
  SELECT * INTO v_mouvement_record 
  FROM public.mouvements_lots 
  WHERE id = p_mouvement_id AND tenant_id = v_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mouvement non trouvé');
  END IF;
  
  -- Récupérer le lot
  SELECT * INTO v_lot_record 
  FROM public.lots 
  WHERE id = v_mouvement_record.lot_id AND tenant_id = v_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;
  
  -- Inverser le mouvement
  IF v_mouvement_record.type_mouvement IN ('sortie', 'peremption', 'destruction') THEN
    v_quantite_apres := v_lot_record.quantite_restante + v_mouvement_record.quantite_mouvement;
  ELSIF v_mouvement_record.type_mouvement IN ('entree', 'retour') THEN
    v_quantite_apres := v_lot_record.quantite_restante - v_mouvement_record.quantite_mouvement;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Type de mouvement non supporté pour suppression');
  END IF;
  
  -- Vérifier que la quantité ne devient pas négative
  IF v_quantite_apres < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Impossible de supprimer: stock insuffisant');
  END IF;
  
  -- Mettre à jour le lot
  UPDATE public.lots
  SET quantite_restante = v_quantite_apres,
      updated_at = now()
  WHERE id = v_mouvement_record.lot_id;
  
  -- Supprimer le mouvement
  DELETE FROM public.mouvements_lots
  WHERE id = p_mouvement_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'quantite_apres', v_quantite_apres
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. FONCTION: Récupérer la configuration des rapports
CREATE OR REPLACE FUNCTION public.reports_get_configuration()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_config JSONB;
BEGIN
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT jsonb_build_object(
    'general_settings', jsonb_build_object(
      'default_date_range', '30',
      'default_export_formats', 'pdf,excel',
      'timezone', 'Africa/Porto-Novo',
      'auto_refresh_seconds', '300',
      'retention_days', COALESCE(rap.retention_days::text, '365'),
      'notifications_enabled', 'true',
      'data_masking_enabled', 'false',
      'default_report_currency', 'XOF',
      'pdf_template_style', 'standard',
      'export_watermark_enabled', 'false'
    )
  )
  INTO v_config
  FROM report_archiving_policies rap
  WHERE rap.tenant_id = v_tenant_id
  LIMIT 1;

  RETURN COALESCE(v_config, jsonb_build_object(
    'general_settings', jsonb_build_object(
      'default_date_range', '30',
      'default_export_formats', 'pdf,excel',
      'timezone', 'Africa/Porto-Novo',
      'auto_refresh_seconds', '300',
      'retention_days', '365',
      'notifications_enabled', 'true',
      'data_masking_enabled', 'false',
      'default_report_currency', 'XOF',
      'pdf_template_style', 'standard',
      'export_watermark_enabled', 'false'
    )
  ));
END;
$$;

-- 5. FONCTION: Sauvegarder les paramètres des rapports
CREATE OR REPLACE FUNCTION public.reports_upsert_settings(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_retention_days INTEGER;
BEGIN
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant non trouvé');
  END IF;

  -- Extraire retention_days du payload si présent
  v_retention_days := COALESCE((payload->>'retention_days')::integer, 365);

  -- Upsert dans report_archiving_policies
  INSERT INTO report_archiving_policies (tenant_id, retention_days, updated_at)
  VALUES (v_tenant_id, v_retention_days, now())
  ON CONFLICT (tenant_id)
  DO UPDATE SET 
    retention_days = EXCLUDED.retention_days,
    updated_at = now();

  RETURN jsonb_build_object('success', true);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;