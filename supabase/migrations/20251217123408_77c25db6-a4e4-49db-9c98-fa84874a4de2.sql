-- =====================================================
-- POINT 1: Corriger la fonction trg_achat_accounting_fn
-- =====================================================
CREATE OR REPLACE FUNCTION public.trg_achat_accounting_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_journal_id UUID;
  v_exercice_id UUID;
  v_numero_piece TEXT;
  v_compte_601 UUID;
  v_compte_4452 UUID;
  v_compte_4471 UUID;
  v_compte_4472 UUID;
  v_compte_401 UUID;
BEGIN
  -- Ne générer que si statut validé
  IF LOWER(COALESCE(NEW.statut, '')) NOT IN ('validé', 'validée', 'valide') THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier que les montants sont présents
  IF NEW.montant_ht IS NULL OR NEW.montant_ht <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier qu'une écriture n'existe pas déjà pour cette réception
  IF EXISTS (
    SELECT 1 FROM ecritures_comptables 
    WHERE tenant_id = NEW.tenant_id 
    AND reference_document = NEW.id::TEXT
    AND type_piece = 'reception'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le journal ACH
  SELECT id INTO v_journal_id 
  FROM accounting_journals 
  WHERE tenant_id = NEW.tenant_id AND code = 'ACH' AND is_active = true;
  
  IF v_journal_id IS NULL THEN
    RAISE NOTICE 'Journal ACH non trouvé pour tenant %', NEW.tenant_id;
    RETURN NEW;
  END IF;
  
  -- Récupérer l'exercice ouvert (insensible à la casse)
  SELECT id INTO v_exercice_id 
  FROM exercices_comptables 
  WHERE tenant_id = NEW.tenant_id AND LOWER(statut) = 'ouvert';
  
  IF v_exercice_id IS NULL THEN
    RAISE NOTICE 'Exercice comptable ouvert non trouvé pour tenant %', NEW.tenant_id;
    RETURN NEW;
  END IF;
  
  -- Récupérer les comptes comptables
  SELECT id INTO v_compte_601 FROM plan_comptable WHERE tenant_id = NEW.tenant_id AND numero_compte = '601';
  SELECT id INTO v_compte_4452 FROM plan_comptable WHERE tenant_id = NEW.tenant_id AND numero_compte = '4452';
  SELECT id INTO v_compte_4471 FROM plan_comptable WHERE tenant_id = NEW.tenant_id AND numero_compte = '4471';
  SELECT id INTO v_compte_4472 FROM plan_comptable WHERE tenant_id = NEW.tenant_id AND numero_compte = '4472';
  SELECT id INTO v_compte_401 FROM plan_comptable WHERE tenant_id = NEW.tenant_id AND numero_compte = '401';
  
  -- Vérifier les comptes essentiels
  IF v_compte_601 IS NULL OR v_compte_401 IS NULL THEN
    RAISE NOTICE 'Comptes comptables 601 ou 401 non trouvés pour tenant %', NEW.tenant_id;
    RETURN NEW;
  END IF;
  
  -- Générer numéro de pièce unique
  v_numero_piece := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  
  -- 1. Débit 601 (Achats) pour montant_ht
  INSERT INTO ecritures_comptables (
    tenant_id, journal_id, exercice_id, compte_id, date_ecriture, 
    numero_piece, libelle, debit, credit, reference_document, type_piece, statut
  ) VALUES (
    NEW.tenant_id, v_journal_id, v_exercice_id, v_compte_601, COALESCE(NEW.date_reception, CURRENT_DATE),
    v_numero_piece, 'Réception ' || COALESCE(NEW.numero_reception, NEW.id::TEXT), 
    NEW.montant_ht, 0, NEW.id::TEXT, 'reception', 'Validé'
  );
  
  -- 2. Débit 4452 (TVA déductible sur achats) pour montant_tva si > 0
  IF v_compte_4452 IS NOT NULL AND COALESCE(NEW.montant_tva, 0) > 0 THEN
    INSERT INTO ecritures_comptables (
      tenant_id, journal_id, exercice_id, compte_id, date_ecriture, 
      numero_piece, libelle, debit, credit, reference_document, type_piece, statut
    ) VALUES (
      NEW.tenant_id, v_journal_id, v_exercice_id, v_compte_4452, COALESCE(NEW.date_reception, CURRENT_DATE),
      v_numero_piece, 'TVA déductible - Réception ' || COALESCE(NEW.numero_reception, NEW.id::TEXT), 
      NEW.montant_tva, 0, NEW.id::TEXT, 'reception', 'Validé'
    );
  END IF;
  
  -- 3. Débit 4471 (Centime Additionnel déductible) si > 0
  IF v_compte_4471 IS NOT NULL AND COALESCE(NEW.montant_centime_additionnel, 0) > 0 THEN
    INSERT INTO ecritures_comptables (
      tenant_id, journal_id, exercice_id, compte_id, date_ecriture, 
      numero_piece, libelle, debit, credit, reference_document, type_piece, statut
    ) VALUES (
      NEW.tenant_id, v_journal_id, v_exercice_id, v_compte_4471, COALESCE(NEW.date_reception, CURRENT_DATE),
      v_numero_piece, 'Centime Additionnel - Réception ' || COALESCE(NEW.numero_reception, NEW.id::TEXT), 
      NEW.montant_centime_additionnel, 0, NEW.id::TEXT, 'reception', 'Validé'
    );
  END IF;
  
  -- 4. Débit 4472 (ASDI) si > 0
  IF v_compte_4472 IS NOT NULL AND COALESCE(NEW.montant_asdi, 0) > 0 THEN
    INSERT INTO ecritures_comptables (
      tenant_id, journal_id, exercice_id, compte_id, date_ecriture, 
      numero_piece, libelle, debit, credit, reference_document, type_piece, statut
    ) VALUES (
      NEW.tenant_id, v_journal_id, v_exercice_id, v_compte_4472, COALESCE(NEW.date_reception, CURRENT_DATE),
      v_numero_piece, 'ASDI - Réception ' || COALESCE(NEW.numero_reception, NEW.id::TEXT), 
      NEW.montant_asdi, 0, NEW.id::TEXT, 'reception', 'Validé'
    );
  END IF;
  
  -- 5. Crédit 401 (Fournisseurs) pour montant_ttc
  INSERT INTO ecritures_comptables (
    tenant_id, journal_id, exercice_id, compte_id, date_ecriture, 
    numero_piece, libelle, debit, credit, reference_document, type_piece, statut
  ) VALUES (
    NEW.tenant_id, v_journal_id, v_exercice_id, v_compte_401, COALESCE(NEW.date_reception, CURRENT_DATE),
    v_numero_piece, 'Fournisseur - Réception ' || COALESCE(NEW.numero_reception, NEW.id::TEXT), 
    0, COALESCE(NEW.montant_ttc, NEW.montant_ht), NEW.id::TEXT, 'reception', 'Validé'
  );
  
  RAISE NOTICE 'Écritures comptables générées pour réception % (tenant %)', NEW.id, NEW.tenant_id;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- POINT 2: Corriger la fonction generate_accounting_entry
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_accounting_entry(
  p_tenant_id UUID,
  p_journal_code TEXT,
  p_date_ecriture DATE,
  p_libelle TEXT,
  p_compte_debit TEXT,
  p_compte_credit TEXT,
  p_montant NUMERIC,
  p_reference_document TEXT DEFAULT NULL,
  p_type_piece TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_journal_id UUID;
  v_exercice_id UUID;
  v_compte_debit_id UUID;
  v_compte_credit_id UUID;
  v_ecriture_id UUID;
  v_numero_piece TEXT;
BEGIN
  -- Récupérer le journal (insensible à la casse)
  SELECT id INTO v_journal_id 
  FROM accounting_journals 
  WHERE tenant_id = p_tenant_id AND LOWER(code) = LOWER(p_journal_code) AND is_active = true;
  
  IF v_journal_id IS NULL THEN
    RAISE EXCEPTION 'Journal % non trouvé pour tenant %', p_journal_code, p_tenant_id;
  END IF;
  
  -- Récupérer l'exercice ouvert (insensible à la casse)
  SELECT id INTO v_exercice_id 
  FROM exercices_comptables 
  WHERE tenant_id = p_tenant_id AND LOWER(statut) = 'ouvert';
  
  IF v_exercice_id IS NULL THEN
    RAISE EXCEPTION 'Aucun exercice comptable ouvert pour tenant %', p_tenant_id;
  END IF;
  
  -- Récupérer les comptes
  SELECT id INTO v_compte_debit_id FROM plan_comptable WHERE tenant_id = p_tenant_id AND numero_compte = p_compte_debit;
  SELECT id INTO v_compte_credit_id FROM plan_comptable WHERE tenant_id = p_tenant_id AND numero_compte = p_compte_credit;
  
  IF v_compte_debit_id IS NULL THEN
    RAISE EXCEPTION 'Compte débit % non trouvé', p_compte_debit;
  END IF;
  
  IF v_compte_credit_id IS NULL THEN
    RAISE EXCEPTION 'Compte crédit % non trouvé', p_compte_credit;
  END IF;
  
  -- Générer numéro de pièce
  v_numero_piece := UPPER(p_journal_code) || '-' || TO_CHAR(p_date_ecriture, 'YYYYMMDD') || '-' || TO_CHAR(NOW(), 'HH24MISS');
  
  -- Créer l'écriture au débit
  INSERT INTO ecritures_comptables (
    tenant_id, journal_id, exercice_id, compte_id, date_ecriture,
    numero_piece, libelle, debit, credit, reference_document, type_piece, statut
  ) VALUES (
    p_tenant_id, v_journal_id, v_exercice_id, v_compte_debit_id, p_date_ecriture,
    v_numero_piece, p_libelle, p_montant, 0, p_reference_document, p_type_piece, 'Validé'
  ) RETURNING id INTO v_ecriture_id;
  
  -- Créer l'écriture au crédit
  INSERT INTO ecritures_comptables (
    tenant_id, journal_id, exercice_id, compte_id, date_ecriture,
    numero_piece, libelle, debit, credit, reference_document, type_piece, statut
  ) VALUES (
    p_tenant_id, v_journal_id, v_exercice_id, v_compte_credit_id, p_date_ecriture,
    v_numero_piece, p_libelle, 0, p_montant, p_reference_document, p_type_piece, 'Validé'
  );
  
  RETURN v_ecriture_id;
END;
$$;

-- =====================================================
-- POINT 3: Recréer le trigger trg_achat_accounting
-- =====================================================
DROP TRIGGER IF EXISTS trg_achat_accounting ON public.receptions_fournisseurs;

CREATE TRIGGER trg_achat_accounting
  AFTER INSERT OR UPDATE OF statut
  ON public.receptions_fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_achat_accounting_fn();