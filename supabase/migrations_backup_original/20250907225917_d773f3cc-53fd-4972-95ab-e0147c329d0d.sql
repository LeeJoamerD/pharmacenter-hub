-- Phase 1: Backend alignment and security
-- Extend RLS policies for mouvements_lots to allow UPDATE and DELETE
DROP POLICY IF EXISTS "Users can update lot movements from their tenant" ON mouvements_lots;
DROP POLICY IF EXISTS "Users can delete lot movements from their tenant" ON mouvements_lots;

CREATE POLICY "Users can update lot movements from their tenant" 
ON mouvements_lots 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete lot movements from their tenant" 
ON mouvements_lots 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_tenant_date 
ON mouvements_lots(tenant_id, date_mouvement DESC);

CREATE INDEX IF NOT EXISTS idx_mouvements_lots_tenant_type 
ON mouvements_lots(tenant_id, type_mouvement);

CREATE INDEX IF NOT EXISTS idx_mouvements_lots_tenant_lot 
ON mouvements_lots(tenant_id, lot_id);

-- Create utility view for frontend queries
CREATE OR REPLACE VIEW v_mouvements_lots_details AS
SELECT 
    ml.*,
    p.libelle_produit,
    p.code_cip,
    l.numero_lot,
    l.date_peremption,
    l.quantite_restante as lot_quantite_restante
FROM mouvements_lots ml
LEFT JOIN lots l ON ml.lot_id = l.id
LEFT JOIN produits p ON ml.produit_id = p.id;

-- RPC Function 1: Record movement atomically
CREATE OR REPLACE FUNCTION rpc_stock_record_movement(
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
    p_quantite_reelle INTEGER DEFAULT NULL -- Pour les ajustements
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    current_quantity INTEGER;
    quantite_avant INTEGER;
    quantite_apres INTEGER;
    movement_record RECORD;
    lot_record RECORD;
BEGIN
    -- Get current tenant
    current_tenant_id := get_current_user_tenant_id();
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant non trouvé pour l''utilisateur actuel';
    END IF;
    
    -- Verify lot belongs to same tenant
    SELECT * INTO lot_record FROM lots WHERE id = p_lot_id AND tenant_id = current_tenant_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lot non trouvé ou accès non autorisé';
    END IF;
    
    -- Get current lot quantity
    current_quantity := lot_record.quantite_restante;
    quantite_avant := current_quantity;
    
    -- Calculate quantities based on movement type
    CASE p_type_mouvement
        WHEN 'entree', 'retour' THEN
            quantite_apres := quantite_avant + p_quantite_mouvement;
        WHEN 'sortie', 'destruction' THEN
            quantite_apres := GREATEST(0, quantite_avant - p_quantite_mouvement);
            -- Check for negative stock
            IF quantite_apres < 0 THEN
                RAISE EXCEPTION 'Stock insuffisant. Disponible: %, Demandé: %', quantite_avant, p_quantite_mouvement;
            END IF;
        WHEN 'ajustement' THEN
            -- For adjustments, use real quantity provided
            IF p_quantite_reelle IS NULL THEN
                RAISE EXCEPTION 'Quantité réelle requise pour un ajustement';
            END IF;
            quantite_apres := p_quantite_reelle;
            -- Recalculate movement quantity as difference
            p_quantite_mouvement := p_quantite_reelle - quantite_avant;
        WHEN 'transfert' THEN
            -- For transfers, log without changing quantity by default
            -- Unless specific logic is needed
            quantite_apres := GREATEST(0, quantite_avant - p_quantite_mouvement);
        ELSE
            RAISE EXCEPTION 'Type de mouvement non supporté: %', p_type_mouvement;
    END CASE;
    
    -- Insert movement record
    INSERT INTO mouvements_lots (
        tenant_id, lot_id, produit_id, type_mouvement,
        quantite_avant, quantite_mouvement, quantite_apres,
        motif, reference_document, reference_type, reference_id,
        agent_id, emplacement_source, emplacement_destination,
        lot_destination_id, metadata, date_mouvement
    ) VALUES (
        current_tenant_id, p_lot_id, p_produit_id, p_type_mouvement,
        quantite_avant, p_quantite_mouvement, quantite_apres,
        p_motif, p_reference_document, p_reference_type, p_reference_id,
        p_agent_id, p_emplacement_source, p_emplacement_destination,
        p_lot_destination_id, p_metadata, NOW()
    ) RETURNING * INTO movement_record;
    
    -- Update lot quantity atomically
    UPDATE lots 
    SET quantite_restante = quantite_apres, updated_at = NOW()
    WHERE id = p_lot_id AND tenant_id = current_tenant_id;
    
    -- Return success with movement details
    RETURN jsonb_build_object(
        'success', true,
        'movement_id', movement_record.id,
        'quantite_avant', quantite_avant,
        'quantite_apres', quantite_apres,
        'quantite_mouvement', movement_record.quantite_mouvement
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Return error details
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$;

-- RPC Function 2: Update existing movement
CREATE OR REPLACE FUNCTION rpc_stock_update_movement(
    p_movement_id UUID,
    p_new_quantite_mouvement INTEGER DEFAULT NULL,
    p_new_motif TEXT DEFAULT NULL,
    p_new_reference_document TEXT DEFAULT NULL,
    p_new_metadata JSONB DEFAULT NULL,
    p_new_quantite_reelle INTEGER DEFAULT NULL -- For adjustments
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    movement_record RECORD;
    lot_record RECORD;
    old_quantite_apres INTEGER;
    new_quantite_avant INTEGER;
    new_quantite_apres INTEGER;
    effective_movement INTEGER;
BEGIN
    -- Get current tenant
    current_tenant_id := get_current_user_tenant_id();
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant non trouvé pour l''utilisateur actuel';
    END IF;
    
    -- Get existing movement
    SELECT * INTO movement_record FROM mouvements_lots 
    WHERE id = p_movement_id AND tenant_id = current_tenant_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mouvement non trouvé ou accès non autorisé';
    END IF;
    
    -- Get current lot state
    SELECT * INTO lot_record FROM lots 
    WHERE id = movement_record.lot_id AND tenant_id = current_tenant_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lot non trouvé';
    END IF;
    
    -- Rollback the old movement effect
    old_quantite_apres := movement_record.quantite_apres;
    
    -- Calculate new quantities
    new_quantite_avant := movement_record.quantite_avant;
    
    -- Use new movement quantity if provided, otherwise keep original
    effective_movement := COALESCE(p_new_quantite_mouvement, movement_record.quantite_mouvement);
    
    -- Calculate new final quantity based on movement type
    CASE movement_record.type_mouvement
        WHEN 'entree', 'retour' THEN
            new_quantite_apres := new_quantite_avant + effective_movement;
        WHEN 'sortie', 'destruction' THEN
            new_quantite_apres := GREATEST(0, new_quantite_avant - effective_movement);
            IF new_quantite_apres < 0 THEN
                RAISE EXCEPTION 'Stock insuffisant après modification. Disponible: %, Demandé: %', 
                    new_quantite_avant, effective_movement;
            END IF;
        WHEN 'ajustement' THEN
            IF p_new_quantite_reelle IS NOT NULL THEN
                new_quantite_apres := p_new_quantite_reelle;
                effective_movement := p_new_quantite_reelle - new_quantite_avant;
            ELSE
                new_quantite_apres := new_quantite_avant + effective_movement;
            END IF;
        WHEN 'transfert' THEN
            new_quantite_apres := GREATEST(0, new_quantite_avant - effective_movement);
        ELSE
            RAISE EXCEPTION 'Type de mouvement non supporté: %', movement_record.type_mouvement;
    END CASE;
    
    -- Update movement record
    UPDATE mouvements_lots SET
        quantite_mouvement = effective_movement,
        quantite_apres = new_quantite_apres,
        motif = COALESCE(p_new_motif, motif),
        reference_document = COALESCE(p_new_reference_document, reference_document),
        metadata = COALESCE(p_new_metadata, metadata),
        updated_at = NOW()
    WHERE id = p_movement_id;
    
    -- Update lot quantity with the new final state
    UPDATE lots 
    SET quantite_restante = new_quantite_apres, updated_at = NOW()
    WHERE id = movement_record.lot_id AND tenant_id = current_tenant_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'movement_id', p_movement_id,
        'old_quantite_apres', old_quantite_apres,
        'new_quantite_apres', new_quantite_apres,
        'effective_movement', effective_movement
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$;

-- RPC Function 3: Delete movement and rollback effect
CREATE OR REPLACE FUNCTION rpc_stock_delete_movement(
    p_movement_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    movement_record RECORD;
    lot_record RECORD;
    rollback_quantity INTEGER;
BEGIN
    -- Get current tenant
    current_tenant_id := get_current_user_tenant_id();
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant non trouvé pour l''utilisateur actuel';
    END IF;
    
    -- Get movement to delete
    SELECT * INTO movement_record FROM mouvements_lots 
    WHERE id = p_movement_id AND tenant_id = current_tenant_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mouvement non trouvé ou accès non autorisé';
    END IF;
    
    -- Get lot to update
    SELECT * INTO lot_record FROM lots 
    WHERE id = movement_record.lot_id AND tenant_id = current_tenant_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lot non trouvé';
    END IF;
    
    -- Calculate rollback quantity (return to quantite_avant)
    rollback_quantity := movement_record.quantite_avant;
    
    -- Delete the movement record
    DELETE FROM mouvements_lots WHERE id = p_movement_id;
    
    -- Rollback lot quantity to before the movement
    UPDATE lots 
    SET quantite_restante = rollback_quantity, updated_at = NOW()
    WHERE id = movement_record.lot_id AND tenant_id = current_tenant_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'deleted_movement_id', p_movement_id,
        'rollback_quantity', rollback_quantity,
        'previous_quantity', lot_record.quantite_restante
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$;