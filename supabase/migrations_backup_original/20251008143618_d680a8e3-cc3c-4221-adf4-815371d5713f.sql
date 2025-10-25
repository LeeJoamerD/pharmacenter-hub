-- Supprimer chaque signature de fonction explicitement
DROP FUNCTION IF EXISTS public.rpc_stock_record_movement(p_lot_id uuid, p_produit_id uuid, p_type_mouvement text, p_quantite_mouvement integer, p_motif text, p_reference_document text, p_reference_type text, p_reference_id uuid, p_agent_id uuid, p_emplacement_source text, p_emplacement_destination text, p_lot_destination_id uuid, p_metadata jsonb, p_quantite_reelle integer);

DROP FUNCTION IF EXISTS public.rpc_stock_record_movement(p_type_mouvement text, p_produit_id uuid, p_quantite_mouvement integer, p_lot_id uuid, p_prix_unitaire numeric, p_reference_id uuid, p_reference_type text, p_reference_document text, p_motif text, p_emplacement_source text, p_emplacement_destination text, p_metadata jsonb);

-- Recréer UNE SEULE version canonique
CREATE FUNCTION public.rpc_stock_record_movement(
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
    p_quantite_reelle INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_current_tenant_id UUID;
    v_mouvement_id UUID;
    v_quantite_avant INTEGER;
    v_quantite_apres INTEGER;
    v_allow_negative_stock BOOLEAN := false;
    v_lot_destination_quantite INTEGER;
BEGIN
    SELECT tenant_id INTO v_current_tenant_id
    FROM public.personnel
    WHERE auth_user_id = auth.uid();

    IF v_current_tenant_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
    END IF;

    SELECT tenant_id INTO v_tenant_id FROM public.lots WHERE id = p_lot_id;

    IF v_tenant_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lot non trouvé');
    END IF;

    IF v_tenant_id != v_current_tenant_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Accès refusé');
    END IF;

    SELECT quantite_restante INTO v_quantite_avant FROM public.lots WHERE id = p_lot_id;

    SELECT COALESCE((SELECT valeur_parametre::boolean FROM public.parametres_stock WHERE cle_parametre = 'autoriser_stock_negatif' AND tenant_id = v_current_tenant_id), false) INTO v_allow_negative_stock;

    IF p_type_mouvement IN ('entree', 'reception', 'retour', 'ajustement_positif') THEN
        v_quantite_apres := v_quantite_avant + p_quantite_mouvement;
    ELSIF p_type_mouvement IN ('sortie', 'vente', 'transfert', 'ajustement_negatif', 'perte', 'casse') THEN
        v_quantite_apres := v_quantite_avant - p_quantite_mouvement;
        IF v_quantite_apres < 0 AND NOT v_allow_negative_stock THEN
            RETURN jsonb_build_object('success', false, 'error', 'Stock insuffisant. Quantité disponible: ' || v_quantite_avant);
        END IF;
    ELSIF p_type_mouvement = 'ajustement' THEN
        IF p_quantite_reelle IS NOT NULL THEN
            v_quantite_apres := p_quantite_reelle;
        ELSE
            v_quantite_apres := v_quantite_avant + p_quantite_mouvement;
        END IF;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Type de mouvement invalide');
    END IF;

    INSERT INTO public.mouvements_lots (tenant_id, lot_id, produit_id, type_mouvement, quantite_mouvement, quantite_avant, quantite_apres, motif, reference_document, reference_type, reference_id, agent_id, emplacement_source, emplacement_destination, metadata)
    VALUES (v_current_tenant_id, p_lot_id, p_produit_id, p_type_mouvement, p_quantite_mouvement, v_quantite_avant, v_quantite_apres, p_motif, p_reference_document, p_reference_type, p_reference_id, COALESCE(p_agent_id, (SELECT id FROM public.personnel WHERE auth_user_id = auth.uid() LIMIT 1)), p_emplacement_source, p_emplacement_destination, p_metadata)
    RETURNING id INTO v_mouvement_id;

    UPDATE public.lots SET quantite_restante = v_quantite_apres, updated_at = NOW() WHERE id = p_lot_id;

    IF p_type_mouvement = 'transfert' AND p_lot_destination_id IS NOT NULL THEN
        SELECT quantite_restante INTO v_lot_destination_quantite FROM public.lots WHERE id = p_lot_destination_id;
        UPDATE public.lots SET quantite_restante = v_lot_destination_quantite + p_quantite_mouvement, updated_at = NOW() WHERE id = p_lot_destination_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'mouvement_id', v_mouvement_id, 'quantite_avant', v_quantite_avant, 'quantite_apres', v_quantite_apres);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;