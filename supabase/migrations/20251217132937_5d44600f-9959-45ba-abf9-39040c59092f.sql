
-- =====================================================
-- CORRECTION: Génération des écritures comptables pour réceptions
-- Utilise la structure parent-enfant (ecritures_comptables + lignes_ecriture)
-- =====================================================

-- 1. Créer les comptes fiscaux manquants (4471 et 4472) s'ils n'existent pas
INSERT INTO plan_comptable (tenant_id, numero_compte, libelle_compte, type_compte, classe, niveau, is_active)
SELECT p.id, '4471', 'Centime Additionnel déductible', 'detail', '4', 4, true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM plan_comptable pc WHERE pc.tenant_id = p.id AND pc.numero_compte = '4471'
);

INSERT INTO plan_comptable (tenant_id, numero_compte, libelle_compte, type_compte, classe, niveau, is_active)
SELECT p.id, '4472', 'ASDI - Acompte Sur Divers Impôts', 'detail', '4', 4, true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM plan_comptable pc WHERE pc.tenant_id = p.id AND pc.numero_compte = '4472'
);

-- 2. Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS trg_achat_accounting ON receptions_fournisseurs;
DROP FUNCTION IF EXISTS trg_achat_accounting_fn();

-- 3. Créer la fonction corrigée avec structure parent-enfant
CREATE OR REPLACE FUNCTION trg_achat_accounting_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exercice_id UUID;
  v_journal_id UUID;
  v_ecriture_id UUID;
  v_numero_piece TEXT;
  v_compte_601 UUID;
  v_compte_4452 UUID;
  v_compte_4471 UUID;
  v_compte_4472 UUID;
  v_compte_401 UUID;
  v_total_debit NUMERIC := 0;
  v_total_credit NUMERIC := 0;
BEGIN
  -- Vérifier si la réception est validée
  IF LOWER(COALESCE(NEW.statut, '')) NOT IN ('validé', 'validée', 'valide') THEN
    RETURN NEW;
  END IF;

  -- Vérifier si une écriture existe déjà pour cette réception
  IF EXISTS (
    SELECT 1 FROM ecritures_comptables 
    WHERE reference_id = NEW.id AND reference_type = 'reception'
  ) THEN
    RAISE NOTICE 'Écriture comptable déjà existante pour la réception %', NEW.id;
    RETURN NEW;
  END IF;

  -- Vérifier les montants
  IF COALESCE(NEW.montant_ht, 0) <= 0 AND COALESCE(NEW.montant_ttc, 0) <= 0 THEN
    RAISE NOTICE 'Montants nuls pour la réception %, pas d''écriture générée', NEW.id;
    RETURN NEW;
  END IF;

  -- Récupérer l'exercice comptable ouvert
  SELECT id INTO v_exercice_id
  FROM exercices_comptables
  WHERE tenant_id = NEW.tenant_id
    AND LOWER(statut) = 'ouvert'
    AND CURRENT_DATE BETWEEN date_debut AND date_fin
  LIMIT 1;

  IF v_exercice_id IS NULL THEN
    RAISE WARNING 'Pas d''exercice comptable ouvert pour le tenant %', NEW.tenant_id;
    RETURN NEW;
  END IF;

  -- Récupérer le journal des achats
  SELECT id INTO v_journal_id
  FROM accounting_journals
  WHERE tenant_id = NEW.tenant_id
    AND UPPER(code) = 'ACH'
    AND is_active = true
  LIMIT 1;

  IF v_journal_id IS NULL THEN
    RAISE WARNING 'Journal ACH non trouvé pour le tenant %', NEW.tenant_id;
    RETURN NEW;
  END IF;

  -- Récupérer les comptes comptables
  SELECT id INTO v_compte_601 FROM plan_comptable 
  WHERE tenant_id = NEW.tenant_id AND numero_compte = '601' LIMIT 1;
  
  SELECT id INTO v_compte_4452 FROM plan_comptable 
  WHERE tenant_id = NEW.tenant_id AND numero_compte = '4452' LIMIT 1;
  
  SELECT id INTO v_compte_4471 FROM plan_comptable 
  WHERE tenant_id = NEW.tenant_id AND numero_compte = '4471' LIMIT 1;
  
  SELECT id INTO v_compte_4472 FROM plan_comptable 
  WHERE tenant_id = NEW.tenant_id AND numero_compte = '4472' LIMIT 1;
  
  SELECT id INTO v_compte_401 FROM plan_comptable 
  WHERE tenant_id = NEW.tenant_id AND numero_compte = '401' LIMIT 1;

  -- Vérifier que les comptes essentiels existent
  IF v_compte_601 IS NULL OR v_compte_401 IS NULL THEN
    RAISE WARNING 'Comptes 601 ou 401 non trouvés pour le tenant %', NEW.tenant_id;
    RETURN NEW;
  END IF;

  -- Calculer les totaux
  v_total_debit := COALESCE(NEW.montant_ht, 0) 
                 + COALESCE(NEW.montant_tva, 0) 
                 + COALESCE(NEW.montant_centime_additionnel, 0) 
                 + COALESCE(NEW.montant_asdi, 0);
  v_total_credit := COALESCE(NEW.montant_ttc, 0);

  -- Générer le numéro de pièce
  v_numero_piece := 'REC-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);

  -- ÉTAPE 1: Créer l'en-tête de l'écriture comptable (parent)
  INSERT INTO ecritures_comptables (
    tenant_id,
    exercice_id,
    journal_id,
    numero_piece,
    date_ecriture,
    libelle,
    reference_type,
    reference_id,
    statut,
    is_auto_generated,
    total_debit,
    total_credit,
    montant_total
  ) VALUES (
    NEW.tenant_id,
    v_exercice_id,
    v_journal_id,
    v_numero_piece,
    COALESCE(NEW.date_reception::date, CURRENT_DATE),
    'Réception fournisseur ' || COALESCE(NEW.numero_reception, NEW.id::TEXT),
    'reception',
    NEW.id,
    'Validé',
    true,
    v_total_debit,
    v_total_credit,
    v_total_debit
  ) RETURNING id INTO v_ecriture_id;

  -- ÉTAPE 2: Créer les lignes d'écriture (enfants)
  
  -- Ligne débit 601 - Achats de marchandises (montant HT)
  IF COALESCE(NEW.montant_ht, 0) > 0 THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_601, 'Achats marchandises', NEW.montant_ht, 0);
  END IF;

  -- Ligne débit 4452 - TVA déductible (si TVA > 0)
  IF COALESCE(NEW.montant_tva, 0) > 0 AND v_compte_4452 IS NOT NULL THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_4452, 'TVA déductible', NEW.montant_tva, 0);
  END IF;

  -- Ligne débit 4471 - Centime Additionnel (si > 0)
  IF COALESCE(NEW.montant_centime_additionnel, 0) > 0 AND v_compte_4471 IS NOT NULL THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_4471, 'Centime Additionnel déductible', NEW.montant_centime_additionnel, 0);
  END IF;

  -- Ligne débit 4472 - ASDI (si > 0)
  IF COALESCE(NEW.montant_asdi, 0) > 0 AND v_compte_4472 IS NOT NULL THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_4472, 'ASDI - Acompte Sur Divers Impôts', NEW.montant_asdi, 0);
  END IF;

  -- Ligne crédit 401 - Fournisseurs (montant TTC)
  IF COALESCE(NEW.montant_ttc, 0) > 0 THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_401, 'Fournisseur', 0, NEW.montant_ttc);
  END IF;

  RAISE NOTICE 'Écriture comptable % créée pour la réception % avec % de débit et % de crédit', 
    v_ecriture_id, NEW.id, v_total_debit, v_total_credit;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la génération de l''écriture comptable pour réception %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Recréer le trigger AFTER INSERT OR UPDATE OF statut
CREATE TRIGGER trg_achat_accounting
  AFTER INSERT OR UPDATE OF statut ON receptions_fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION trg_achat_accounting_fn();

-- 5. Ajouter un commentaire explicatif
COMMENT ON FUNCTION trg_achat_accounting_fn() IS 
'Génère automatiquement les écritures comptables lors de la validation des réceptions fournisseurs.
Utilise la structure parent-enfant: ecritures_comptables (en-tête) + lignes_ecriture (détails).
Débite: 601 (HT), 4452 (TVA), 4471 (Centime), 4472 (ASDI).
Crédite: 401 (Fournisseurs) pour le TTC.';
