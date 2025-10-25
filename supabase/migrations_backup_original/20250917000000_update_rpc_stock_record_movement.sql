-- Met à jour la fonction rpc_stock_record_movement pour enregistrer également dans stock_mouvements
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

  -- Créer le mouvement de lot
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

  -- Créer le mouvement de stock
  INSERT INTO public.stock_mouvements (
    tenant_id, produit_id, lot_id, type_mouvement, quantite,
    agent_id, reference_id, reference_type
  ) VALUES (
    current_tenant_id, p_produit_id, p_lot_id, p_type_mouvement, p_quantite_mouvement,
    current_personnel_id, p_reference_id, p_reference_type
  );

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