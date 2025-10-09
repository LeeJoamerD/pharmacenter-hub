-- Fix RPC function to remove reference to non-existent 'updated_at' column in mouvements_lots table

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

  -- Mettre à jour le mouvement (sans updated_at car cette colonne n'existe pas)
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