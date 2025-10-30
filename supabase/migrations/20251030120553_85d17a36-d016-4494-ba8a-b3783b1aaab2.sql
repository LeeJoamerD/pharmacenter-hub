-- ============================================================================
-- PHASE 0: SUPPRESSION DES FONCTIONS EXISTANTES
-- ============================================================================

DROP FUNCTION IF EXISTS public.rpc_stock_record_movement(uuid, uuid, uuid, text, integer, text, uuid);
DROP FUNCTION IF EXISTS public.rpc_stock_update_movement(uuid, uuid, integer, text);
DROP FUNCTION IF EXISTS public.rpc_stock_delete_movement(uuid, uuid);

-- ============================================================================
-- PHASE 1: CORRECTION DES FONCTIONS RPC (CRITIQUE)
-- ============================================================================

-- 1.1: Restaurer rpc_stock_record_movement avec signature complète
CREATE OR REPLACE FUNCTION public.rpc_stock_record_movement(
  p_lot_id UUID,
  p_produit_id UUID,
  p_type_mouvement TEXT,
  p_quantite_mouvement INTEGER,
  p_prix_unitaire NUMERIC DEFAULT NULL,
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
SET search_path = 'public'
AS $function$
DECLARE
  current_tenant_id UUID;
  lot_record RECORD;
  quantite_avant INTEGER;
  quantite_apres INTEGER;
  new_mouvement_id UUID;
  stock_settings RECORD;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non autorisé');
  END IF;

  SELECT * INTO lot_record
  FROM public.lots 
  WHERE id = p_lot_id AND tenant_id = current_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;

  SELECT * INTO stock_settings
  FROM public.stock_settings
  WHERE tenant_id = current_tenant_id
  LIMIT 1;

  IF stock_settings IS NULL THEN
    stock_settings.allow_negative_stock := false;
  END IF;

  quantite_avant := lot_record.quantite_restante;
  
  CASE p_type_mouvement
    WHEN 'entree', 'retour' THEN
      quantite_apres := quantite_avant + p_quantite_mouvement;
    WHEN 'sortie', 'destruction' THEN
      quantite_apres := quantite_avant - p_quantite_mouvement;
      IF quantite_apres < 0 AND NOT stock_settings.allow_negative_stock THEN
        RETURN jsonb_build_object('success', false, 'error', 'Stock insuffisant');
      END IF;
    WHEN 'ajustement' THEN
      quantite_apres := quantite_avant + p_quantite_mouvement;
    WHEN 'transfert' THEN
      quantite_apres := quantite_avant - p_quantite_mouvement;
      IF quantite_apres < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Stock insuffisant pour le transfert');
      END IF;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Type de mouvement invalide');
  END CASE;

  INSERT INTO public.mouvements_lots (
    tenant_id, lot_id, produit_id, type_mouvement,
    quantite_avant, quantite_mouvement, quantite_apres,
    prix_unitaire, valeur_mouvement,
    reference_id, reference_type, reference_document,
    agent_id, lot_destination_id,
    emplacement_source, emplacement_destination,
    motif, metadata, date_mouvement
  ) VALUES (
    current_tenant_id, p_lot_id, p_produit_id, p_type_mouvement,
    quantite_avant, p_quantite_mouvement, quantite_apres,
    p_prix_unitaire, (p_prix_unitaire * p_quantite_mouvement),
    p_reference_id, p_reference_type, p_reference_document,
    p_agent_id, p_lot_destination_id,
    p_emplacement_source, p_emplacement_destination,
    p_motif, p_metadata, NOW()
  ) RETURNING id INTO new_mouvement_id;

  UPDATE public.lots 
  SET quantite_restante = quantite_apres,
      updated_at = NOW()
  WHERE id = p_lot_id AND tenant_id = current_tenant_id;

  IF p_type_mouvement = 'transfert' AND p_lot_destination_id IS NOT NULL THEN
    UPDATE public.lots 
    SET quantite_restante = quantite_restante + p_quantite_mouvement,
        updated_at = NOW()
    WHERE id = p_lot_destination_id AND tenant_id = current_tenant_id;
  END IF;

  INSERT INTO public.stock_mouvements (
    tenant_id, produit_id, lot_id, type_mouvement,
    quantite, reference_type, reference_id,
    agent_id, date_mouvement
  ) VALUES (
    current_tenant_id, p_produit_id, p_lot_id, p_type_mouvement,
    p_quantite_mouvement, p_reference_type, p_reference_id,
    p_agent_id, NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'mouvement_id', new_mouvement_id,
    'quantite_avant', quantite_avant,
    'quantite_apres', quantite_apres
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 1.2: Corriger rpc_stock_update_movement
CREATE OR REPLACE FUNCTION public.rpc_stock_update_movement(
  p_movement_id UUID,
  p_quantite_mouvement INTEGER DEFAULT NULL,
  p_motif TEXT DEFAULT NULL,
  p_reference_document TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_tenant_id UUID;
  movement_record RECORD;
  new_quantite_apres INTEGER;
  quantite_diff INTEGER;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non autorisé');
  END IF;

  SELECT * INTO movement_record
  FROM public.mouvements_lots 
  WHERE id = p_movement_id AND tenant_id = current_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mouvement non trouvé');
  END IF;

  IF p_quantite_mouvement IS NOT NULL AND p_quantite_mouvement != movement_record.quantite_mouvement THEN
    quantite_diff := p_quantite_mouvement - movement_record.quantite_mouvement;
    
    CASE movement_record.type_mouvement
      WHEN 'entree', 'retour' THEN
        new_quantite_apres := movement_record.quantite_apres + quantite_diff;
      WHEN 'sortie', 'destruction' THEN
        new_quantite_apres := movement_record.quantite_apres - quantite_diff;
        IF new_quantite_apres < 0 THEN
          RETURN jsonb_build_object('success', false, 'error', 'Stock insuffisant');
        END IF;
      WHEN 'ajustement' THEN
        new_quantite_apres := movement_record.quantite_avant + p_quantite_mouvement;
      WHEN 'transfert' THEN
        new_quantite_apres := movement_record.quantite_avant - p_quantite_mouvement;
        IF new_quantite_apres < 0 THEN
          RETURN jsonb_build_object('success', false, 'error', 'Stock insuffisant');
        END IF;
      ELSE
        new_quantite_apres := movement_record.quantite_apres;
    END CASE;
  ELSE
    new_quantite_apres := movement_record.quantite_apres;
    quantite_diff := 0;
  END IF;

  UPDATE public.mouvements_lots SET
    quantite_mouvement = COALESCE(p_quantite_mouvement, quantite_mouvement),
    quantite_apres = new_quantite_apres,
    motif = COALESCE(p_motif, motif),
    reference_document = COALESCE(p_reference_document, reference_document),
    metadata = COALESCE(p_metadata, metadata)
  WHERE id = p_movement_id AND tenant_id = current_tenant_id;

  IF quantite_diff != 0 THEN
    UPDATE public.lots 
    SET quantite_restante = quantite_restante + quantite_diff,
        updated_at = NOW()
    WHERE id = movement_record.lot_id AND tenant_id = current_tenant_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Mouvement mis à jour avec succès',
    'quantite_apres', new_quantite_apres
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 1.3: Corriger rpc_stock_delete_movement
CREATE OR REPLACE FUNCTION public.rpc_stock_delete_movement(
  p_movement_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_tenant_id UUID;
  movement_record RECORD;
  lot_record RECORD;
  new_quantite_apres INTEGER;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non autorisé');
  END IF;

  SELECT * INTO movement_record
  FROM public.mouvements_lots 
  WHERE id = p_movement_id AND tenant_id = current_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mouvement non trouvé');
  END IF;

  SELECT * INTO lot_record
  FROM public.lots 
  WHERE id = movement_record.lot_id AND tenant_id = current_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;

  CASE movement_record.type_mouvement
    WHEN 'sortie', 'destruction' THEN
      new_quantite_apres := lot_record.quantite_restante + movement_record.quantite_mouvement;
    WHEN 'entree', 'retour' THEN
      new_quantite_apres := lot_record.quantite_restante - movement_record.quantite_mouvement;
      IF new_quantite_apres < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Impossible de supprimer: stock insuffisant');
      END IF;
    WHEN 'ajustement' THEN
      new_quantite_apres := movement_record.quantite_avant;
    WHEN 'transfert' THEN
      new_quantite_apres := lot_record.quantite_restante + movement_record.quantite_mouvement;
      IF movement_record.lot_destination_id IS NOT NULL THEN
        UPDATE public.lots 
        SET quantite_restante = quantite_restante - movement_record.quantite_mouvement,
            updated_at = NOW()
        WHERE id = movement_record.lot_destination_id AND tenant_id = current_tenant_id;
      END IF;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Type de mouvement non supporté');
  END CASE;

  UPDATE public.lots
  SET quantite_restante = new_quantite_apres,
      updated_at = NOW()
  WHERE id = movement_record.lot_id AND tenant_id = current_tenant_id;

  DELETE FROM public.mouvements_lots
  WHERE id = p_movement_id AND tenant_id = current_tenant_id;

  DELETE FROM public.stock_mouvements
  WHERE reference_id = p_movement_id AND tenant_id = current_tenant_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Mouvement supprimé avec succès',
    'quantite_apres', new_quantite_apres
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- ============================================================================
-- PHASE 2: AMÉLIORATION DES RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "tenant_access_mouvements_lots_update" ON public.mouvements_lots;
CREATE POLICY "tenant_access_mouvements_lots_update" 
ON public.mouvements_lots 
FOR UPDATE 
USING (
  tenant_id = get_current_user_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND tenant_id = get_current_user_tenant_id()
    AND role IN ('Admin', 'Pharmacien', 'Gestionnaire')
  )
)
WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "tenant_access_mouvements_lots_delete" ON public.mouvements_lots;
CREATE POLICY "tenant_access_mouvements_lots_delete" 
ON public.mouvements_lots 
FOR DELETE 
USING (
  tenant_id = get_current_user_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND tenant_id = get_current_user_tenant_id()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- ============================================================================
-- PHASE 3: OPTIMISATION ET DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.mouvements_lots IS 
'Table de traçabilité détaillée des mouvements de lots. Utilisée pour l''audit et la gestion FIFO. 
Chaque mouvement est immuable une fois créé (modifications uniquement via RPC validée).';

COMMENT ON TABLE public.stock_mouvements IS 
'Vue globale simplifiée des mouvements de stock. Utilisée pour les rapports et analytics. 
Synchronisée automatiquement avec mouvements_lots via les RPC.';

CREATE INDEX IF NOT EXISTS idx_mouvements_lots_date_mouvement 
ON public.mouvements_lots(tenant_id, date_mouvement DESC);

CREATE INDEX IF NOT EXISTS idx_mouvements_lots_type_date 
ON public.mouvements_lots(tenant_id, type_mouvement, date_mouvement DESC);

CREATE INDEX IF NOT EXISTS idx_mouvements_lots_produit_date 
ON public.mouvements_lots(tenant_id, produit_id, date_mouvement DESC);

CREATE INDEX IF NOT EXISTS idx_mouvements_lots_agent 
ON public.mouvements_lots(tenant_id, agent_id, date_mouvement DESC);

CREATE INDEX IF NOT EXISTS idx_mouvements_lots_metadata 
ON public.mouvements_lots USING gin(metadata jsonb_path_ops);