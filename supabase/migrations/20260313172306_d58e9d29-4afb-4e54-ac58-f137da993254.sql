
-- Atomic RPC to process return completion (stock reintegration + sale cleanup)
-- Replaces fragile multi-step client-side logic
CREATE OR REPLACE FUNCTION public.rpc_process_return_completion(p_return_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_tenant_id uuid;
  current_personnel_id uuid;
  v_retour record;
  v_vente record;
  v_ligne_retour record;
  v_ligne_vente record;
  v_lot record;
  v_rpc_result jsonb;
  v_total_retourne_par_produit jsonb := '{}'::jsonb;
  v_is_total_return boolean := true;
  v_ancien_montant_net numeric := 0;
  v_nouveau_total_ttc numeric := 0;
  v_nouveau_total_ht numeric := 0;
  v_nouveau_total_tva numeric := 0;
  v_nouveau_total_centime numeric := 0;
  v_nouveau_montant_net numeric := 0;
  v_montant_remboursement numeric := 0;
  v_lignes_restantes_count integer := 0;
  v_mode text := 'none';
BEGIN
  -- Bypass RLS for admin operations
  SET LOCAL row_security = off;

  -- Get current tenant and personnel
  current_tenant_id := get_current_user_tenant_id();
  SELECT id INTO current_personnel_id
  FROM public.personnel
  WHERE auth_user_id = auth.uid() AND tenant_id = current_tenant_id;

  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non autorisé');
  END IF;

  -- 1. Fetch and validate the return
  SELECT * INTO v_retour
  FROM public.retours
  WHERE id = p_return_id AND tenant_id = current_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Retour non trouvé');
  END IF;

  IF v_retour.statut != 'Approuvé' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le retour doit être approuvé avant traitement. Statut actuel: ' || v_retour.statut);
  END IF;

  -- 2. Stock reintegration for eligible lines
  FOR v_ligne_retour IN
    SELECT lr.*, p.libelle_produit
    FROM public.lignes_retours lr
    LEFT JOIN public.produits p ON p.id = lr.produit_id
    WHERE lr.retour_id = p_return_id
      AND lr.tenant_id = current_tenant_id
      AND lr.remis_en_stock = false
      AND lr.etat_produit IN ('Parfait', 'Endommagé')
      AND lr.lot_id IS NOT NULL
  LOOP
    -- Use existing RPC for stock movement
    SELECT public.rpc_stock_record_movement(
      p_type_mouvement := 'entree',
      p_produit_id := v_ligne_retour.produit_id,
      p_quantite_mouvement := v_ligne_retour.quantite_retournee,
      p_lot_id := v_ligne_retour.lot_id,
      p_prix_unitaire := v_ligne_retour.prix_unitaire,
      p_reference_id := p_return_id,
      p_reference_type := 'retour',
      p_reference_document := v_retour.numero_retour,
      p_motif := COALESCE(v_retour.motif_retour, 'Réintégration stock suite retour')
    ) INTO v_rpc_result;

    IF NOT (v_rpc_result->>'success')::boolean THEN
      RAISE EXCEPTION 'Échec réintégration stock pour %: %', 
        COALESCE(v_ligne_retour.produit_id::text, 'unknown'), 
        v_rpc_result->>'error';
    END IF;

    -- Mark line as restocked
    UPDATE public.lignes_retours
    SET remis_en_stock = true
    WHERE id = v_ligne_retour.id AND tenant_id = current_tenant_id;
  END LOOP;

  -- 3. Mark return as completed
  UPDATE public.retours
  SET statut = 'Terminé'
  WHERE id = p_return_id AND tenant_id = current_tenant_id;

  -- 4. Handle original sale if linked
  IF v_retour.vente_origine_id IS NOT NULL THEN
    SELECT * INTO v_vente
    FROM public.ventes
    WHERE id = v_retour.vente_origine_id AND tenant_id = current_tenant_id;

    IF FOUND THEN
      v_ancien_montant_net := COALESCE(v_vente.montant_net, 0);

      -- Get ALL completed returns for this sale (including current one)
      -- Build aggregated returned quantities per product+lot
      FOR v_ligne_retour IN
        SELECT lr.produit_id, lr.lot_id, SUM(lr.quantite_retournee) as total_retourne
        FROM public.lignes_retours lr
        JOIN public.retours r ON r.id = lr.retour_id
        WHERE r.vente_origine_id = v_retour.vente_origine_id
          AND r.tenant_id = current_tenant_id
          AND r.statut = 'Terminé'
        GROUP BY lr.produit_id, lr.lot_id
      LOOP
        -- Check each sale line
        FOR v_ligne_vente IN
          SELECT * FROM public.lignes_ventes
          WHERE vente_id = v_retour.vente_origine_id
            AND tenant_id = current_tenant_id
            AND produit_id = v_ligne_retour.produit_id
        LOOP
          IF v_ligne_retour.total_retourne >= v_ligne_vente.quantite THEN
            -- This line is fully returned - will be deleted
            NULL; -- handled below
          ELSE
            v_is_total_return := false;
          END IF;
        END LOOP;
      END LOOP;

      -- Also check lines that have NO returns at all
      IF EXISTS (
        SELECT 1 FROM public.lignes_ventes lv
        WHERE lv.vente_id = v_retour.vente_origine_id
          AND lv.tenant_id = current_tenant_id
          AND NOT EXISTS (
            SELECT 1 FROM public.lignes_retours lr
            JOIN public.retours r ON r.id = lr.retour_id
            WHERE r.vente_origine_id = v_retour.vente_origine_id
              AND r.tenant_id = current_tenant_id
              AND r.statut = 'Terminé'
              AND lr.produit_id = lv.produit_id
          )
      ) THEN
        v_is_total_return := false;
      END IF;

      IF v_is_total_return THEN
        -- === TOTAL RETURN: Delete sale completely ===
        v_mode := 'total';

        -- Detach all returns from this sale (avoid FK constraint)
        UPDATE public.retours
        SET vente_origine_id = NULL
        WHERE vente_origine_id = v_retour.vente_origine_id
          AND tenant_id = current_tenant_id;

        -- Delete cash movements
        DELETE FROM public.mouvements_caisse
        WHERE reference_id = v_retour.vente_origine_id
          AND tenant_id = current_tenant_id;

        -- Delete sale lines
        DELETE FROM public.lignes_ventes
        WHERE vente_id = v_retour.vente_origine_id
          AND tenant_id = current_tenant_id;

        -- Delete the sale
        DELETE FROM public.ventes
        WHERE id = v_retour.vente_origine_id
          AND tenant_id = current_tenant_id;

      ELSE
        -- === PARTIAL RETURN: Update lines and totals ===
        v_mode := 'partiel';

        -- Update each sale line
        FOR v_ligne_retour IN
          SELECT lr.produit_id, lr.lot_id, SUM(lr.quantite_retournee) as total_retourne
          FROM public.lignes_retours lr
          JOIN public.retours r ON r.id = lr.retour_id
          WHERE r.vente_origine_id = v_retour.vente_origine_id
            AND r.tenant_id = current_tenant_id
            AND r.statut = 'Terminé'
          GROUP BY lr.produit_id, lr.lot_id
        LOOP
          FOR v_ligne_vente IN
            SELECT * FROM public.lignes_ventes
            WHERE vente_id = v_retour.vente_origine_id
              AND tenant_id = current_tenant_id
              AND produit_id = v_ligne_retour.produit_id
          LOOP
            IF v_ligne_retour.total_retourne >= v_ligne_vente.quantite THEN
              DELETE FROM public.lignes_ventes
              WHERE id = v_ligne_vente.id AND tenant_id = current_tenant_id;
            ELSE
              DECLARE
                v_nouvelle_qte integer;
                v_montant_brut numeric;
                v_montant_remise numeric;
                v_nouveau_montant_ttc numeric;
              BEGIN
                v_nouvelle_qte := v_ligne_vente.quantite - v_ligne_retour.total_retourne;
                v_montant_brut := v_nouvelle_qte * v_ligne_vente.prix_unitaire_ttc;
                v_montant_remise := v_montant_brut * COALESCE(v_ligne_vente.remise_ligne, 0) / 100;
                v_nouveau_montant_ttc := ROUND(v_montant_brut - v_montant_remise);

                UPDATE public.lignes_ventes
                SET quantite = v_nouvelle_qte,
                    montant_ligne_ttc = v_nouveau_montant_ttc,
                    montant_tva_ligne = ROUND(v_nouvelle_qte * COALESCE(v_ligne_vente.prix_unitaire_ht, 0) * COALESCE(v_ligne_vente.taux_tva, 0) / 100),
                    montant_centime_ligne = ROUND(v_nouvelle_qte * COALESCE(v_ligne_vente.prix_unitaire_ht, 0) * COALESCE(v_ligne_vente.taux_centime_additionnel, 0) / 100)
                WHERE id = v_ligne_vente.id AND tenant_id = current_tenant_id;
              END;
            END IF;
          END LOOP;
        END LOOP;

        -- Recalculate sale totals from remaining lines
        SELECT COUNT(*),
               COALESCE(SUM(montant_ligne_ttc), 0),
               COALESCE(SUM(prix_unitaire_ht * quantite), 0),
               COALESCE(SUM(montant_tva_ligne), 0),
               COALESCE(SUM(montant_centime_ligne), 0)
        INTO v_lignes_restantes_count, v_nouveau_total_ttc, v_nouveau_total_ht, v_nouveau_total_tva, v_nouveau_total_centime
        FROM public.lignes_ventes
        WHERE vente_id = v_retour.vente_origine_id AND tenant_id = current_tenant_id;

        IF v_lignes_restantes_count = 0 THEN
          -- All lines removed = actually total return
          v_mode := 'total';
          UPDATE public.retours SET vente_origine_id = NULL
          WHERE vente_origine_id = v_retour.vente_origine_id AND tenant_id = current_tenant_id;
          DELETE FROM public.mouvements_caisse
          WHERE reference_id = v_retour.vente_origine_id AND tenant_id = current_tenant_id;
          DELETE FROM public.ventes
          WHERE id = v_retour.vente_origine_id AND tenant_id = current_tenant_id;
        ELSE
          -- Calculate new net amount
          DECLARE
            v_taux_assurance numeric;
            v_remise_globale_pct numeric;
            v_montant_remise_globale numeric;
            v_montant_apres_remise numeric;
            v_montant_part_assurance numeric;
            v_montant_part_patient numeric;
          BEGIN
            v_taux_assurance := COALESCE(v_vente.taux_couverture_assurance, 0);
            v_remise_globale_pct := COALESCE(v_vente.remise_globale, 0);
            v_montant_remise_globale := ROUND(v_nouveau_total_ttc * v_remise_globale_pct / 100);
            v_montant_apres_remise := v_nouveau_total_ttc - v_montant_remise_globale;
            v_montant_part_assurance := CASE WHEN v_taux_assurance > 0 THEN ROUND(v_montant_apres_remise * v_taux_assurance / 100) ELSE 0 END;
            v_montant_part_patient := v_montant_apres_remise - v_montant_part_assurance;
            v_nouveau_montant_net := v_montant_part_patient;

            UPDATE public.ventes
            SET montant_total_ht = ROUND(v_nouveau_total_ht),
                montant_total_ttc = ROUND(v_nouveau_total_ttc),
                montant_tva = ROUND(v_nouveau_total_tva),
                montant_centime_additionnel = ROUND(v_nouveau_total_centime),
                montant_net = ROUND(v_nouveau_montant_net),
                montant_part_assurance = CASE WHEN v_montant_part_assurance > 0 THEN v_montant_part_assurance ELSE NULL END,
                montant_part_patient = ROUND(v_montant_part_patient),
                montant_paye = ROUND(v_nouveau_montant_net),
                montant_rendu = 0
            WHERE id = v_retour.vente_origine_id AND tenant_id = current_tenant_id;
          END;

          -- Create refund cash movement if needed
          v_montant_remboursement := v_ancien_montant_net - v_nouveau_montant_net;
          IF v_montant_remboursement > 0 AND v_vente.session_caisse_id IS NOT NULL THEN
            INSERT INTO public.mouvements_caisse (
              tenant_id, session_caisse_id, type_mouvement, montant,
              description, motif, reference_id, reference_type,
              agent_id, date_mouvement
            ) VALUES (
              current_tenant_id, v_vente.session_caisse_id, 'Remboursement',
              v_montant_remboursement,
              'Remboursement partiel ' || v_vente.numero_vente || ' - Retour ' || v_retour.numero_retour,
              'Retour partiel sur vente ' || v_vente.numero_vente,
              v_retour.vente_origine_id, 'retour',
              COALESCE(current_personnel_id, v_vente.agent_id),
              now()
            );

            -- Update original Vente cash movement
            UPDATE public.mouvements_caisse
            SET montant = ROUND(v_nouveau_montant_net)
            WHERE reference_id = v_retour.vente_origine_id
              AND type_mouvement = 'Vente'
              AND tenant_id = current_tenant_id;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'mode', v_mode,
    'return_id', p_return_id,
    'vente_origine_id', v_retour.vente_origine_id,
    'numero_retour', v_retour.numero_retour
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
