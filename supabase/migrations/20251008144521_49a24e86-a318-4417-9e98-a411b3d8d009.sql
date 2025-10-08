-- Corriger la fonction rpc_stock_record_movement pour utiliser stock_settings au lieu de parametres_stock

DROP FUNCTION IF EXISTS public.rpc_stock_record_movement(
    UUID, UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, UUID, UUID, TEXT, TEXT, UUID, JSONB, INTEGER
);

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
    -- Récupérer le tenant de l'utilisateur actuel
    SELECT tenant_id INTO v_current_tenant_id
    FROM public.personnel
    WHERE auth_user_id = auth.uid();

    IF v_current_tenant_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
    END IF;

    -- Récupérer le tenant du lot
    SELECT tenant_id INTO v_tenant_id FROM public.lots WHERE id = p_lot_id;

    IF v_tenant_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lot non trouvé');
    END IF;

    -- Validation cross-tenant
    IF v_tenant_id != v_current_tenant_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Accès refusé');
    END IF;

    -- Récupérer la quantité actuelle
    SELECT quantite_restante INTO v_quantite_avant FROM public.lots WHERE id = p_lot_id;

    -- CORRECTION: Utiliser stock_settings au lieu de parametres_stock
    SELECT COALESCE(
        (SELECT allow_negative_stock FROM public.stock_settings WHERE tenant_id = v_current_tenant_id LIMIT 1),
        false
    ) INTO v_allow_negative_stock;

    -- Calculer la nouvelle quantité
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

    -- Créer le mouvement
    INSERT INTO public.mouvements_lots (
        tenant_id, lot_id, produit_id, type_mouvement, quantite_mouvement,
        quantite_avant, quantite_apres, motif, reference_document, reference_type,
        reference_id, agent_id, emplacement_source, emplacement_destination, metadata
    )
    VALUES (
        v_current_tenant_id, p_lot_id, p_produit_id, p_type_mouvement, p_quantite_mouvement,
        v_quantite_avant, v_quantite_apres, p_motif, p_reference_document, p_reference_type,
        p_reference_id, COALESCE(p_agent_id, (SELECT id FROM public.personnel WHERE auth_user_id = auth.uid() LIMIT 1)),
        p_emplacement_source, p_emplacement_destination, p_metadata
    )
    RETURNING id INTO v_mouvement_id;

    -- Mettre à jour le lot
    UPDATE public.lots SET quantite_restante = v_quantite_apres, updated_at = NOW() WHERE id = p_lot_id;

    -- Gérer les transferts
    IF p_type_mouvement = 'transfert' AND p_lot_destination_id IS NOT NULL THEN
        SELECT quantite_restante INTO v_lot_destination_quantite FROM public.lots WHERE id = p_lot_destination_id;
        UPDATE public.lots SET quantite_restante = v_lot_destination_quantite + p_quantite_mouvement, updated_at = NOW() WHERE id = p_lot_destination_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'mouvement_id', v_mouvement_id, 'quantite_avant', v_quantite_avant, 'quantite_apres', v_quantite_apres);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- S'assurer que tous les tenants ont des paramètres stock par défaut
INSERT INTO public.stock_settings (tenant_id, allow_negative_stock)
SELECT DISTINCT tenant_id, false
FROM public.personnel
WHERE tenant_id NOT IN (SELECT tenant_id FROM public.stock_settings)
ON CONFLICT (tenant_id) DO NOTHING;