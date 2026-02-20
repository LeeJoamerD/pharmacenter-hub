
-- ============================================================
-- PARTIE 1 : Insérer la config manquante pour tous les tenants
-- ============================================================

-- Config vente_comptant pour tous les tenants qui ont comptes 571 et 701 et journal VT
INSERT INTO accounting_default_accounts (
  tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active
)
SELECT DISTINCT
  pc571.tenant_id,
  'vente_comptant',
  '571',
  '701',
  'VT',
  'Vente au comptant - Débit Caisse / Crédit Ventes',
  true
FROM plan_comptable pc571
JOIN plan_comptable pc701 ON pc701.tenant_id = pc571.tenant_id AND pc701.numero_compte LIKE '701%'
JOIN journaux_comptables jvt ON jvt.tenant_id = pc571.tenant_id AND jvt.code_journal = 'VT' AND jvt.is_active = true
WHERE pc571.numero_compte LIKE '571%'
  AND NOT EXISTS (
    SELECT 1 FROM accounting_default_accounts ada
    WHERE ada.tenant_id = pc571.tenant_id AND ada.event_type = 'vente_comptant'
  )
ON CONFLICT DO NOTHING;

-- Config vente_client
INSERT INTO accounting_default_accounts (
  tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active
)
SELECT DISTINCT
  pc411.tenant_id,
  'vente_client',
  '411',
  '701',
  'VT',
  'Vente client - Débit Créances / Crédit Ventes',
  true
FROM plan_comptable pc411
JOIN plan_comptable pc701 ON pc701.tenant_id = pc411.tenant_id AND pc701.numero_compte LIKE '701%'
JOIN journaux_comptables jvt ON jvt.tenant_id = pc411.tenant_id AND jvt.code_journal = 'VT' AND jvt.is_active = true
WHERE pc411.numero_compte LIKE '411%'
  AND NOT EXISTS (
    SELECT 1 FROM accounting_default_accounts ada
    WHERE ada.tenant_id = pc411.tenant_id AND ada.event_type = 'vente_client'
  )
ON CONFLICT DO NOTHING;

-- Config tva_collectee pour les tenants qui ont le compte 4431
INSERT INTO accounting_default_accounts (
  tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active
)
SELECT DISTINCT
  pc.tenant_id,
  'tva_collectee',
  '571',
  pc.numero_compte,
  'VT',
  'TVA collectée sur ventes',
  true
FROM plan_comptable pc
JOIN journaux_comptables jvt ON jvt.tenant_id = pc.tenant_id AND jvt.code_journal = 'VT' AND jvt.is_active = true
WHERE pc.numero_compte LIKE '4431%'
  AND NOT EXISTS (
    SELECT 1 FROM accounting_default_accounts ada
    WHERE ada.tenant_id = pc.tenant_id AND ada.event_type = 'tva_collectee'
  )
ON CONFLICT DO NOTHING;

-- Config centime_additionnel pour les tenants qui ont le compte 4461
INSERT INTO accounting_default_accounts (
  tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active
)
SELECT DISTINCT
  pc.tenant_id,
  'centime_additionnel',
  '571',
  pc.numero_compte,
  'VT',
  'Centime additionnel sur ventes',
  true
FROM plan_comptable pc
JOIN journaux_comptables jvt ON jvt.tenant_id = pc.tenant_id AND jvt.code_journal = 'VT' AND jvt.is_active = true
WHERE pc.numero_compte LIKE '4461%'
  AND NOT EXISTS (
    SELECT 1 FROM accounting_default_accounts ada
    WHERE ada.tenant_id = pc.tenant_id AND ada.event_type = 'centime_additionnel'
  )
ON CONFLICT DO NOTHING;

-- Créer le journal VT pour les tenants qui n'en ont pas mais ont le plan comptable
INSERT INTO journaux_comptables (tenant_id, code_journal, libelle_journal, type_journal, is_active)
SELECT DISTINCT pc.tenant_id, 'VT', 'Journal des Ventes', 'Ventes', true
FROM plan_comptable pc
WHERE pc.numero_compte LIKE '701%'
  AND NOT EXISTS (
    SELECT 1 FROM journaux_comptables jvt
    WHERE jvt.tenant_id = pc.tenant_id AND jvt.code_journal = 'VT'
  )
ON CONFLICT DO NOTHING;

-- Après création des journaux VT, insérer config vente_comptant pour les tenants qui en ont maintenant besoin
INSERT INTO accounting_default_accounts (
  tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active
)
SELECT DISTINCT
  pc571.tenant_id,
  'vente_comptant',
  '571',
  '701',
  'VT',
  'Vente au comptant - Débit Caisse / Crédit Ventes',
  true
FROM plan_comptable pc571
JOIN plan_comptable pc701 ON pc701.tenant_id = pc571.tenant_id AND pc701.numero_compte LIKE '701%'
JOIN journaux_comptables jvt ON jvt.tenant_id = pc571.tenant_id AND jvt.code_journal = 'VT' AND jvt.is_active = true
WHERE pc571.numero_compte LIKE '571%'
  AND NOT EXISTS (
    SELECT 1 FROM accounting_default_accounts ada
    WHERE ada.tenant_id = pc571.tenant_id AND ada.event_type = 'vente_comptant'
  )
ON CONFLICT DO NOTHING;


-- ============================================================
-- PARTIE 2 : Enrichir import_global_accounting_plan
-- ============================================================
CREATE OR REPLACE FUNCTION public.import_global_accounting_plan(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_imported_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_journal_count INTEGER := 0;
  v_config_count INTEGER := 0;
  v_result jsonb;
  v_compte RECORD;
  v_existing_id UUID;
  v_has_571 BOOLEAN := false;
  v_has_701 BOOLEAN := false;
  v_has_411 BOOLEAN := false;
  v_has_4431 BOOLEAN := false;
  v_has_4461 BOOLEAN := false;
BEGIN
  SET LOCAL row_security = off;

  -- Import des comptes depuis le plan global (référence)
  FOR v_compte IN
    SELECT * FROM plan_comptable_global ORDER BY numero_compte
  LOOP
    SELECT id INTO v_existing_id
    FROM plan_comptable
    WHERE tenant_id = p_tenant_id AND numero_compte = v_compte.numero_compte;

    IF v_existing_id IS NULL THEN
      INSERT INTO plan_comptable (
        tenant_id, numero_compte, libelle, type_compte, classe,
        is_active, solde_debiteur, solde_crediteur
      ) VALUES (
        p_tenant_id,
        v_compte.numero_compte,
        v_compte.libelle,
        COALESCE(v_compte.type_compte, 'detail'),
        v_compte.classe,
        true,
        0,
        0
      );
      v_imported_count := v_imported_count + 1;
    ELSE
      UPDATE plan_comptable
      SET libelle = v_compte.libelle, updated_at = now()
      WHERE id = v_existing_id AND libelle != v_compte.libelle;
      IF FOUND THEN
        v_updated_count := v_updated_count + 1;
      END IF;
    END IF;
  END LOOP;

  -- Initialiser la config comptable générale si absente
  INSERT INTO accounting_general_config (
    tenant_id, plan_comptable, regime_tva, periodicite_tva,
    taux_tva_normal, taux_tva_reduit, decimal_places,
    auto_calcul_tva, auto_lettrage, controle_equilibre, saisie_analytique
  ) VALUES (
    p_tenant_id, 'OHADA', 'Normal', 'Mensuelle',
    18.0, 9.0, 0,
    true, false, true, false
  )
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Créer les journaux comptables standard si absents
  INSERT INTO journaux_comptables (tenant_id, code_journal, libelle_journal, type_journal, is_active)
  VALUES
    (p_tenant_id, 'VT', 'Journal des Ventes', 'Ventes', true),
    (p_tenant_id, 'AC', 'Journal des Achats', 'Achats', true),
    (p_tenant_id, 'BQ', 'Journal de Banque', 'Banque', true),
    (p_tenant_id, 'CA', 'Journal de Caisse', 'Caisse', true),
    (p_tenant_id, 'OD', 'Journal des Opérations Diverses', 'OD', true)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_journal_count = ROW_COUNT;

  -- Vérifier quels comptes clés existent après l'import
  SELECT EXISTS(SELECT 1 FROM plan_comptable WHERE tenant_id = p_tenant_id AND numero_compte LIKE '571%') INTO v_has_571;
  SELECT EXISTS(SELECT 1 FROM plan_comptable WHERE tenant_id = p_tenant_id AND numero_compte LIKE '701%') INTO v_has_701;
  SELECT EXISTS(SELECT 1 FROM plan_comptable WHERE tenant_id = p_tenant_id AND numero_compte LIKE '411%') INTO v_has_411;
  SELECT EXISTS(SELECT 1 FROM plan_comptable WHERE tenant_id = p_tenant_id AND numero_compte LIKE '4431%') INTO v_has_4431;
  SELECT EXISTS(SELECT 1 FROM plan_comptable WHERE tenant_id = p_tenant_id AND numero_compte LIKE '4461%') INTO v_has_4461;

  IF v_has_571 AND v_has_701 THEN
    INSERT INTO accounting_default_accounts (
      tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active
    ) VALUES (
      p_tenant_id, 'vente_comptant', '571', '701', 'VT', 'Vente au comptant - Débit Caisse / Crédit Ventes', true
    ) ON CONFLICT DO NOTHING;
    v_config_count := v_config_count + 1;
  END IF;

  IF v_has_411 AND v_has_701 THEN
    INSERT INTO accounting_default_accounts (
      tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active
    ) VALUES (
      p_tenant_id, 'vente_client', '411', '701', 'VT', 'Vente client - Débit Créances / Crédit Ventes', true
    ) ON CONFLICT DO NOTHING;
    v_config_count := v_config_count + 1;
  END IF;

  IF v_has_4431 THEN
    INSERT INTO accounting_default_accounts (
      tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active
    ) VALUES (
      p_tenant_id, 'tva_collectee', '571', '4431', 'VT', 'TVA collectée sur ventes', true
    ) ON CONFLICT DO NOTHING;
    v_config_count := v_config_count + 1;
  END IF;

  IF v_has_4461 THEN
    INSERT INTO accounting_default_accounts (
      tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active
    ) VALUES (
      p_tenant_id, 'centime_additionnel', '571', '4461', 'VT', 'Centime additionnel sur ventes', true
    ) ON CONFLICT DO NOTHING;
    v_config_count := v_config_count + 1;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'imported', v_imported_count,
    'updated', v_updated_count,
    'journals_created', v_journal_count,
    'default_accounts_configured', v_config_count,
    'message', format('Import terminé : %s comptes importés, %s mis à jour, %s journaux créés, %s configurations comptables ajoutées',
      v_imported_count, v_updated_count, v_journal_count, v_config_count)
  );

  NOTIFY pgrst, 'reload schema';
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;


-- ============================================================
-- PARTIE 3 : Fonction RPC pour génération rétroactive
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_missing_session_accounting_entries()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_config RECORD;
  v_journal RECORD;
  v_exercice RECORD;
  v_ecriture_id UUID;
  v_total_ht NUMERIC;
  v_total_tva NUMERIC;
  v_total_centime NUMERIC;
  v_total_ttc NUMERIC;
  v_nombre_ventes INTEGER;
  v_mode_principal TEXT;
  v_event_type TEXT;
  v_compte_debit_id UUID;
  v_compte_credit_id UUID;
  v_compte_tva_id UUID;
  v_compte_centime_id UUID;
  v_num_piece TEXT;
  v_date_str TEXT;
  v_generated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors INTEGER := 0;
  v_skip_reason TEXT;
  v_details jsonb := '[]'::jsonb;
BEGIN
  SET LOCAL row_security = off;

  FOR v_session IN
    SELECT sc.id, sc.numero_session, sc.tenant_id, sc.date_fermeture
    FROM sessions_caisse sc
    WHERE sc.statut = 'Fermée'
      AND NOT EXISTS (
        SELECT 1 FROM ecritures_comptables ec
        WHERE ec.tenant_id = sc.tenant_id
          AND ec.reference_type = 'session_caisse'
          AND ec.reference_id = sc.id
      )
    ORDER BY sc.tenant_id, sc.date_fermeture
  LOOP
    v_skip_reason := NULL;

    -- Calculer les totaux des ventes validées
    SELECT
      COALESCE(SUM(v.montant_total_ht), 0),
      COALESCE(SUM(v.montant_tva), 0),
      COALESCE(SUM(v.montant_centime_additionnel), 0),
      COALESCE(SUM(v.montant_total_ttc), 0),
      COUNT(*)::INTEGER,
      COALESCE(
        (SELECT v2.mode_paiement FROM ventes v2
         WHERE v2.tenant_id = v_session.tenant_id
           AND v2.session_caisse_id = v_session.id
           AND v2.statut = 'Validée'
         GROUP BY v2.mode_paiement ORDER BY COUNT(*) DESC LIMIT 1),
        'Espèces'
      )
    INTO v_total_ht, v_total_tva, v_total_centime, v_total_ttc, v_nombre_ventes, v_mode_principal
    FROM ventes v
    WHERE v.tenant_id = v_session.tenant_id
      AND v.session_caisse_id = v_session.id
      AND v.statut = 'Validée';

    IF v_mode_principal IN ('Espèces', 'Carte Bancaire', 'Mobile Money', 'Carte') THEN
      v_event_type := 'vente_comptant';
    ELSE
      v_event_type := 'vente_client';
    END IF;

    -- Vérifier la config
    SELECT compte_debit_numero, compte_credit_numero, journal_code
    INTO v_config
    FROM accounting_default_accounts
    WHERE tenant_id = v_session.tenant_id
      AND event_type = v_event_type
      AND is_active = true
    LIMIT 1;

    IF NOT FOUND THEN
      v_skipped := v_skipped + 1;
      v_details := v_details || jsonb_build_object(
        'session', v_session.numero_session, 'tenant', v_session.tenant_id,
        'status', 'skipped', 'reason', format('Config %s manquante', v_event_type)
      );
      CONTINUE;
    END IF;

    -- Vérifier le journal
    SELECT id INTO v_journal
    FROM journaux_comptables
    WHERE tenant_id = v_session.tenant_id
      AND code_journal = v_config.journal_code
      AND is_active = true
    LIMIT 1;

    IF NOT FOUND THEN
      v_skipped := v_skipped + 1;
      v_details := v_details || jsonb_build_object(
        'session', v_session.numero_session, 'tenant', v_session.tenant_id,
        'status', 'skipped', 'reason', format('Journal %s introuvable', v_config.journal_code)
      );
      CONTINUE;
    END IF;

    -- Vérifier l'exercice
    SELECT id INTO v_exercice
    FROM exercices_comptables
    WHERE tenant_id = v_session.tenant_id
      AND statut IN ('En cours', 'Ouvert')
    LIMIT 1;

    IF NOT FOUND THEN
      v_skipped := v_skipped + 1;
      v_details := v_details || jsonb_build_object(
        'session', v_session.numero_session, 'tenant', v_session.tenant_id,
        'status', 'skipped', 'reason', 'Aucun exercice comptable ouvert'
      );
      CONTINUE;
    END IF;

    -- Récupérer IDs des comptes
    SELECT id INTO v_compte_debit_id
    FROM plan_comptable
    WHERE tenant_id = v_session.tenant_id
      AND numero_compte LIKE v_config.compte_debit_numero || '%'
    LIMIT 1;

    SELECT id INTO v_compte_credit_id
    FROM plan_comptable
    WHERE tenant_id = v_session.tenant_id
      AND numero_compte LIKE v_config.compte_credit_numero || '%'
    LIMIT 1;

    IF v_compte_debit_id IS NULL OR v_compte_credit_id IS NULL THEN
      v_skipped := v_skipped + 1;
      v_details := v_details || jsonb_build_object(
        'session', v_session.numero_session, 'tenant', v_session.tenant_id,
        'status', 'skipped', 'reason', format('Comptes %s ou %s non trouvés', v_config.compte_debit_numero, v_config.compte_credit_numero)
      );
      CONTINUE;
    END IF;

    -- Compte TVA optionnel
    SELECT pc.id INTO v_compte_tva_id
    FROM accounting_default_accounts ada
    JOIN plan_comptable pc ON pc.tenant_id = ada.tenant_id AND pc.numero_compte LIKE ada.compte_credit_numero || '%'
    WHERE ada.tenant_id = v_session.tenant_id
      AND ada.event_type = 'tva_collectee'
      AND ada.is_active = true
    LIMIT 1;

    -- Compte Centime optionnel
    SELECT pc.id INTO v_compte_centime_id
    FROM accounting_default_accounts ada
    JOIN plan_comptable pc ON pc.tenant_id = ada.tenant_id AND pc.numero_compte LIKE ada.compte_credit_numero || '%'
    WHERE ada.tenant_id = v_session.tenant_id
      AND ada.event_type = 'centime_additionnel'
      AND ada.is_active = true
    LIMIT 1;

    v_date_str := TO_CHAR(COALESCE(v_session.date_fermeture, now()), 'YYYYMMDD');
    v_num_piece := 'SESS-' || v_date_str || '-' || RIGHT(v_session.numero_session, 4);

    BEGIN
      INSERT INTO ecritures_comptables (
        tenant_id, exercice_id, journal_id,
        date_ecriture, numero_piece, libelle,
        reference_type, reference_id,
        statut, is_auto_generated
      ) VALUES (
        v_session.tenant_id, v_exercice.id, v_journal.id,
        COALESCE(v_session.date_fermeture::DATE, CURRENT_DATE),
        v_num_piece,
        format('Ventes Session #%s (%s ventes) [Rétroactif]', v_session.numero_session, v_nombre_ventes),
        'session_caisse', v_session.id,
        'Brouillon', true
      ) RETURNING id INTO v_ecriture_id;

      -- Ligne 1 : Débit Caisse (TTC)
      INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
      VALUES (
        v_session.tenant_id, v_ecriture_id, v_compte_debit_id,
        format('Ventes Session #%s (%s ventes)', v_session.numero_session, v_nombre_ventes),
        COALESCE(v_total_ttc, 0), 0
      );

      -- Ligne 2 : Crédit Ventes
      IF COALESCE(v_total_ht, 0) > 0 THEN
        INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
        VALUES (
          v_session.tenant_id, v_ecriture_id, v_compte_credit_id,
          format('Ventes Session #%s - HT', v_session.numero_session),
          0, v_total_ht
        );
      ELSE
        INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
        VALUES (
          v_session.tenant_id, v_ecriture_id, v_compte_credit_id,
          format('Ventes Session #%s', v_session.numero_session),
          0, COALESCE(v_total_ttc, 0)
        );
      END IF;

      -- Ligne 3 : TVA
      IF COALESCE(v_total_tva, 0) > 0 AND v_compte_tva_id IS NOT NULL THEN
        INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
        VALUES (
          v_session.tenant_id, v_ecriture_id, v_compte_tva_id,
          format('Ventes Session #%s - TVA', v_session.numero_session),
          0, v_total_tva
        );
      END IF;

      -- Ligne 4 : Centime
      IF COALESCE(v_total_centime, 0) > 0 AND v_compte_centime_id IS NOT NULL THEN
        INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
        VALUES (
          v_session.tenant_id, v_ecriture_id, v_compte_centime_id,
          format('Ventes Session #%s - Centime Add.', v_session.numero_session),
          0, v_total_centime
        );
      END IF;

      v_generated := v_generated + 1;
      v_details := v_details || jsonb_build_object(
        'session', v_session.numero_session, 'tenant', v_session.tenant_id,
        'status', 'generated', 'total_ttc', v_total_ttc,
        'nb_ventes', v_nombre_ventes, 'ecriture_id', v_ecriture_id
      );

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      v_details := v_details || jsonb_build_object(
        'session', v_session.numero_session, 'tenant', v_session.tenant_id,
        'status', 'error', 'reason', SQLERRM
      );
    END;
  END LOOP;

  NOTIFY pgrst, 'reload schema';

  RETURN jsonb_build_object(
    'success', true,
    'generated', v_generated,
    'skipped', v_skipped,
    'errors', v_errors,
    'total_processed', v_generated + v_skipped + v_errors,
    'details', v_details
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
