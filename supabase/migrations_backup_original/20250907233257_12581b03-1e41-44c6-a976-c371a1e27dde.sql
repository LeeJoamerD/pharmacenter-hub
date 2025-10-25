-- Ajouter les politiques manquantes sur mouvements_lots
DROP POLICY IF EXISTS "Users can update lot movements from their tenant" ON public.mouvements_lots;
DROP POLICY IF EXISTS "Users can delete lot movements from their tenant" ON public.mouvements_lots;

CREATE POLICY "Users can update lot movements from their tenant" 
ON public.mouvements_lots 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete lot movements from their tenant" 
ON public.mouvements_lots 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- RPC pour créer un mouvement de stock
CREATE OR REPLACE FUNCTION public.rpc_stock_record_movement(
  p_type_mouvement text,
  p_produit_id uuid,
  p_quantite_mouvement integer,
  p_lot_id uuid DEFAULT NULL,
  p_prix_unitaire numeric DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_reference_type text DEFAULT NULL,
  p_reference_document text DEFAULT NULL,
  p_motif text DEFAULT NULL,
  p_emplacement_source text DEFAULT NULL,
  p_emplacement_destination text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_tenant_id uuid;
  current_personnel_id uuid;
  lot_record record;
  new_movement_id uuid;
  quantite_avant integer := 0;
  quantite_apres integer := 0;
  valeur_mouvement numeric := 0;
  result jsonb;
BEGIN
  -- Récupérer le tenant et personnel actuels
  current_tenant_id := get_current_user_tenant_id();
  
  SELECT id INTO current_personnel_id
  FROM public.personnel 
  WHERE auth_user_id = auth.uid() AND tenant_id = current_tenant_id;
  
  IF current_tenant_id IS NULL OR current_personnel_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non autorisé');
  END IF;

  -- Validation des paramètres obligatoires
  IF p_type_mouvement IS NULL OR p_produit_id IS NULL OR p_quantite_mouvement IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Paramètres obligatoires manquants');
  END IF;

  -- Pour les mouvements nécessitant un lot, vérifier qu'il existe
  IF p_lot_id IS NOT NULL THEN
    SELECT quantite_restante INTO quantite_avant
    FROM public.lots 
    WHERE id = p_lot_id AND tenant_id = current_tenant_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Lot non trouvé');
    END IF;
  END IF;

  -- Calculer la quantité après mouvement selon le type
  CASE p_type_mouvement
    WHEN 'entree', 'ajustement', 'transfert' THEN
      quantite_apres := quantite_avant + p_quantite_mouvement;
    WHEN 'sortie' THEN
      quantite_apres := quantite_avant - p_quantite_mouvement;
      IF quantite_apres < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Stock insuffisant');
      END IF;
    ELSE
      quantite_apres := quantite_avant;
  END CASE;

  -- Calculer la valeur du mouvement
  IF p_prix_unitaire IS NOT NULL THEN
    valeur_mouvement := p_prix_unitaire * p_quantite_mouvement;
  END IF;

  -- Créer le mouvement
  INSERT INTO public.mouvements_lots (
    tenant_id, lot_id, produit_id, type_mouvement, 
    quantite_avant, quantite_mouvement, quantite_apres,
    prix_unitaire, valeur_mouvement, reference_id, reference_type,
    reference_document, motif, emplacement_source, emplacement_destination,
    agent_id, metadata
  ) VALUES (
    current_tenant_id, p_lot_id, p_produit_id, p_type_mouvement,
    quantite_avant, p_quantite_mouvement, quantite_apres,
    p_prix_unitaire, valeur_mouvement, p_reference_id, p_reference_type,
    p_reference_document, p_motif, p_emplacement_source, p_emplacement_destination,
    current_personnel_id, p_metadata
  ) RETURNING id INTO new_movement_id;

  -- Mettre à jour la quantité du lot si nécessaire
  IF p_lot_id IS NOT NULL AND p_type_mouvement IN ('entree', 'sortie', 'ajustement') THEN
    UPDATE public.lots 
    SET quantite_restante = quantite_apres, updated_at = now()
    WHERE id = p_lot_id AND tenant_id = current_tenant_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'movement_id', new_movement_id,
    'quantite_avant', quantite_avant,
    'quantite_apres', quantite_apres
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- RPC pour mettre à jour un mouvement de stock
CREATE OR REPLACE FUNCTION public.rpc_stock_update_movement(
  p_movement_id uuid,
  p_quantite_mouvement integer DEFAULT NULL,
  p_motif text DEFAULT NULL,
  p_reference_document text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_tenant_id uuid;
  movement_record record;
  old_quantite integer;
  new_quantite_apres integer;
  result jsonb;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non autorisé');
  END IF;

  -- Récupérer le mouvement existant
  SELECT * INTO movement_record
  FROM public.mouvements_lots 
  WHERE id = p_movement_id AND tenant_id = current_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mouvement non trouvé');
  END IF;

  -- Calculer la nouvelle quantité après si la quantité change
  IF p_quantite_mouvement IS NOT NULL AND p_quantite_mouvement != movement_record.quantite_mouvement THEN
    CASE movement_record.type_mouvement
      WHEN 'entree', 'ajustement', 'transfert' THEN
        new_quantite_apres := movement_record.quantite_avant + p_quantite_mouvement;
      WHEN 'sortie' THEN
        new_quantite_apres := movement_record.quantite_avant - p_quantite_mouvement;
        IF new_quantite_apres < 0 THEN
          RETURN jsonb_build_object('success', false, 'error', 'Stock insuffisant');
        END IF;
      ELSE
        new_quantite_apres := movement_record.quantite_apres;
    END CASE;
  ELSE
    new_quantite_apres := movement_record.quantite_apres;
  END IF;

  -- Mettre à jour le mouvement
  UPDATE public.mouvements_lots SET
    quantite_mouvement = COALESCE(p_quantite_mouvement, quantite_mouvement),
    quantite_apres = new_quantite_apres,
    motif = COALESCE(p_motif, motif),
    reference_document = COALESCE(p_reference_document, reference_document),
    metadata = COALESCE(p_metadata, metadata)
  WHERE id = p_movement_id AND tenant_id = current_tenant_id;

  -- Mettre à jour la quantité du lot si nécessaire
  IF movement_record.lot_id IS NOT NULL AND movement_record.type_mouvement IN ('entree', 'sortie', 'ajustement') THEN
    UPDATE public.lots 
    SET quantite_restante = new_quantite_apres, updated_at = now()
    WHERE id = movement_record.lot_id AND tenant_id = current_tenant_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Mouvement mis à jour avec succès');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- RPC pour supprimer un mouvement de stock
CREATE OR REPLACE FUNCTION public.rpc_stock_delete_movement(p_movement_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_tenant_id uuid;
  movement_record record;
  restored_quantity integer;
BEGIN
  current_tenant_id := get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non autorisé');
  END IF;

  -- Récupérer le mouvement à supprimer
  SELECT * INTO movement_record
  FROM public.mouvements_lots 
  WHERE id = p_movement_id AND tenant_id = current_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mouvement non trouvé');
  END IF;

  -- Restaurer la quantité du lot si nécessaire
  IF movement_record.lot_id IS NOT NULL AND movement_record.type_mouvement IN ('entree', 'sortie', 'ajustement') THEN
    UPDATE public.lots 
    SET quantite_restante = movement_record.quantite_avant, updated_at = now()
    WHERE id = movement_record.lot_id AND tenant_id = current_tenant_id;
  END IF;

  -- Supprimer le mouvement
  DELETE FROM public.mouvements_lots 
  WHERE id = p_movement_id AND tenant_id = current_tenant_id;

  RETURN jsonb_build_object('success', true, 'message', 'Mouvement supprimé avec succès');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_tenant_type ON public.mouvements_lots(tenant_id, type_mouvement);
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_tenant_date ON public.mouvements_lots(tenant_id, date_mouvement DESC);
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_produit ON public.mouvements_lots(produit_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_lot ON public.mouvements_lots(lot_id);