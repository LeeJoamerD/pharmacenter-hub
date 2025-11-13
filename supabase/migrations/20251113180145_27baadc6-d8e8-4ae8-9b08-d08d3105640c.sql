-- ============================================
-- Unifier rpc_stock_record_movement
-- Résout le conflit PGRST203 entre deux versions de la fonction
-- ============================================

-- Supprimer les deux versions conflictuelles existantes
-- Version 1: avec p_quantite_reelle (pour ajustements)
DROP FUNCTION IF EXISTS public.rpc_stock_record_movement(
  UUID, UUID, TEXT, INTEGER, INTEGER, UUID, TEXT, TEXT, UUID, UUID, TEXT, TEXT, TEXT, JSONB
);

-- Version 2: avec p_prix_unitaire (pour mouvements normaux)
DROP FUNCTION IF EXISTS public.rpc_stock_record_movement(
  UUID, UUID, TEXT, INTEGER, NUMERIC, UUID, TEXT, TEXT, UUID, UUID, TEXT, TEXT, TEXT, JSONB
);

-- Supprimer aussi les autres signatures possibles
DROP FUNCTION IF EXISTS public.rpc_stock_record_movement(
  p_lot_id UUID,
  p_produit_id UUID,
  p_type_mouvement TEXT,
  p_quantite_mouvement INTEGER,
  p_motif TEXT,
  p_reference_document TEXT,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_agent_id UUID,
  p_emplacement_source TEXT,
  p_emplacement_destination TEXT,
  p_lot_destination_id UUID,
  p_metadata JSONB,
  p_quantite_reelle INTEGER
);

-- Créer la version unifiée avec TOUS les paramètres
CREATE OR REPLACE FUNCTION public.rpc_stock_record_movement(
  p_lot_id UUID,
  p_produit_id UUID,
  p_type_mouvement TEXT,
  p_quantite_mouvement INTEGER,
  p_motif TEXT DEFAULT NULL,
  p_reference_document TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_emplacement_source TEXT DEFAULT NULL,
  p_emplacement_destination TEXT DEFAULT NULL,
  p_lot_destination_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_prix_unitaire NUMERIC DEFAULT NULL,
  p_quantite_reelle INTEGER DEFAULT NULL
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
  valeur_mouvement NUMERIC;
BEGIN
  -- Récupération du tenant de l'utilisateur actuel
  current_tenant_id := get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non autorisé');
  END IF;

  -- Récupération du lot avec validation tenant
  SELECT * INTO lot_record
  FROM public.lots 
  WHERE id = p_lot_id AND tenant_id = current_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;

  -- Récupération des paramètres stock du tenant
  SELECT * INTO stock_settings
  FROM public.stock_settings
  WHERE tenant_id = current_tenant_id
  LIMIT 1;

  -- Valeur par défaut si pas de paramètres configurés
  IF stock_settings IS NULL THEN
    stock_settings.allow_negative_stock := false;
  END IF;

  -- Quantité actuelle du lot
  quantite_avant := lot_record.quantite_restante;
  
  -- Calcul de la quantité après selon le type de mouvement
  CASE p_type_mouvement
    WHEN 'ajustement' THEN
      -- Si quantite_reelle est fournie, l'utiliser directement (ajustement absolu)
      IF p_quantite_reelle IS NOT NULL THEN
        quantite_apres := p_quantite_reelle;
      ELSE
        -- Sinon, ajustement relatif
        quantite_apres := quantite_avant + p_quantite_mouvement;
      END IF;
    
    WHEN 'entree', 'reception', 'retour', 'ajustement_positif' THEN
      quantite_apres := quantite_avant + p_quantite_mouvement;
    
    WHEN 'sortie', 'vente', 'ajustement_negatif', 'perte', 'casse', 'destruction' THEN
      quantite_apres := quantite_avant - p_quantite_mouvement;
      -- Validation stock négatif pour les sorties
      IF quantite_apres < 0 AND NOT stock_settings.allow_negative_stock THEN
        RETURN jsonb_build_object(
          'success', false, 
          'error', 'Stock insuffisant. Quantité disponible: ' || quantite_avant
        );
      END IF;
    
    WHEN 'transfert' THEN
      quantite_apres := quantite_avant - p_quantite_mouvement;
      -- Les transferts ne peuvent jamais créer de stock négatif
      IF quantite_apres < 0 THEN
        RETURN jsonb_build_object(
          'success', false, 
          'error', 'Stock insuffisant pour le transfert. Quantité disponible: ' || quantite_avant
        );
      END IF;
    
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Type de mouvement invalide: ' || p_type_mouvement);
  END CASE;

  -- Calcul de la valeur du mouvement si prix unitaire fourni
  IF p_prix_unitaire IS NOT NULL THEN
    valeur_mouvement := p_prix_unitaire * p_quantite_mouvement;
  ELSE
    valeur_mouvement := NULL;
  END IF;

  -- Récupération de l'agent_id si non fourni
  IF p_agent_id IS NULL THEN
    SELECT id INTO p_agent_id 
    FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
      AND tenant_id = current_tenant_id
    LIMIT 1;
  END IF;

  -- Insertion du mouvement dans la table mouvements_lots
  INSERT INTO public.mouvements_lots (
    tenant_id, 
    lot_id, 
    produit_id, 
    type_mouvement,
    quantite_avant, 
    quantite_mouvement, 
    quantite_apres,
    prix_unitaire, 
    valeur_mouvement,
    reference_id, 
    reference_type, 
    reference_document,
    agent_id, 
    lot_destination_id,
    emplacement_source, 
    emplacement_destination,
    motif, 
    metadata, 
    date_mouvement
  ) VALUES (
    current_tenant_id, 
    p_lot_id, 
    p_produit_id, 
    p_type_mouvement,
    quantite_avant, 
    p_quantite_mouvement, 
    quantite_apres,
    p_prix_unitaire, 
    valeur_mouvement,
    p_reference_id, 
    p_reference_type, 
    p_reference_document,
    p_agent_id, 
    p_lot_destination_id,
    p_emplacement_source, 
    p_emplacement_destination,
    p_motif, 
    p_metadata, 
    NOW()
  ) RETURNING id INTO new_mouvement_id;

  -- Mise à jour de la quantité du lot source
  UPDATE public.lots 
  SET quantite_restante = quantite_apres,
      updated_at = NOW()
  WHERE id = p_lot_id 
    AND tenant_id = current_tenant_id;

  -- Gestion spécifique des transferts : mise à jour du lot destination
  IF p_type_mouvement = 'transfert' AND p_lot_destination_id IS NOT NULL THEN
    UPDATE public.lots
    SET quantite_restante = quantite_restante + p_quantite_mouvement,
        updated_at = NOW()
    WHERE id = p_lot_destination_id 
      AND tenant_id = current_tenant_id;
  END IF;

  -- Retour succès avec détails
  RETURN jsonb_build_object(
    'success', true,
    'mouvement_id', new_mouvement_id,
    'quantite_avant', quantite_avant,
    'quantite_apres', quantite_apres
  );

EXCEPTION WHEN OTHERS THEN
  -- Gestion des erreurs
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$function$;