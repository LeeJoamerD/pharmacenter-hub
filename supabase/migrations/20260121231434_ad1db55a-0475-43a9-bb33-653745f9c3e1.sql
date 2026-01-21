-- Migration C: Refactor trg_achat_accounting_fn to use dynamic accounts from accounting_default_accounts
-- No more hardcoded account numbers - fully configurable per tenant

CREATE OR REPLACE FUNCTION trg_achat_accounting_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_exercice_id UUID;
  v_journal_id UUID;
  v_ecriture_id UUID;
  v_numero_piece TEXT;
  v_total_debit NUMERIC;
  
  -- Dynamic account config from accounting_default_accounts
  v_achat_config RECORD;
  v_tva_config RECORD;
  v_centime_config RECORD;
  v_asdi_config RECORD;
  
  -- Resolved account IDs from plan_comptable
  v_compte_achat_id UUID;
  v_compte_fournisseur_id UUID;
  v_compte_tva_id UUID;
  v_compte_centime_id UUID;
  v_compte_asdi_id UUID;
  
  v_journal_code TEXT;
BEGIN
  -- Only proceed if status is 'Validé'
  IF NOT (LOWER(COALESCE(NEW.statut, '')) IN ('validé', 'validée', 'valide')) THEN
    RETURN NEW;
  END IF;
  
  -- Avoid duplicates: check if entry already exists for this reception
  IF EXISTS (SELECT 1 FROM ecritures_comptables WHERE reference_id = NEW.id AND reference_type = 'reception') THEN
    RETURN NEW;
  END IF;
  
  -- Skip if no amounts
  IF COALESCE(NEW.montant_ht, 0) <= 0 AND COALESCE(NEW.montant_ttc, 0) <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Get open fiscal year
  SELECT id INTO v_exercice_id 
  FROM exercices_comptables 
  WHERE tenant_id = NEW.tenant_id AND LOWER(statut) IN ('ouvert', 'en cours')
  AND CURRENT_DATE BETWEEN date_debut AND date_fin
  LIMIT 1;
  
  IF v_exercice_id IS NULL THEN 
    RAISE WARNING 'No open fiscal year found for tenant %', NEW.tenant_id;
    RETURN NEW; 
  END IF;
  
  -- Load purchase config from accounting_default_accounts (dynamic - no hardcoding)
  SELECT compte_debit_numero, compte_credit_numero, journal_code 
  INTO v_achat_config
  FROM accounting_default_accounts
  WHERE tenant_id = NEW.tenant_id AND event_type = 'achat_marchandises' AND is_active = true
  LIMIT 1;
  
  -- If no config found, try fallback to 'AC' journal with accounts 601/401
  IF v_achat_config IS NULL THEN
    v_journal_code := 'ACH';
  ELSE
    v_journal_code := COALESCE(v_achat_config.journal_code, 'ACH');
  END IF;
  
  -- Get journal from journaux_comptables (not accounting_journals!)
  SELECT id INTO v_journal_id 
  FROM journaux_comptables 
  WHERE tenant_id = NEW.tenant_id AND code_journal = v_journal_code AND is_active = true
  LIMIT 1;
  
  -- Fallback to 'AC' if 'ACH' not found
  IF v_journal_id IS NULL THEN
    SELECT id INTO v_journal_id 
    FROM journaux_comptables 
    WHERE tenant_id = NEW.tenant_id AND code_journal = 'AC' AND is_active = true
    LIMIT 1;
  END IF;
  
  IF v_journal_id IS NULL THEN 
    RAISE WARNING 'No purchase journal (ACH/AC) found for tenant %', NEW.tenant_id;
    RETURN NEW; 
  END IF;
  
  -- Load tax configs
  SELECT compte_debit_numero INTO v_tva_config
  FROM accounting_default_accounts
  WHERE tenant_id = NEW.tenant_id AND event_type = 'tva_deductible' AND is_active = true
  LIMIT 1;
  
  SELECT compte_debit_numero INTO v_centime_config
  FROM accounting_default_accounts
  WHERE tenant_id = NEW.tenant_id AND event_type = 'centime_deductible' AND is_active = true
  LIMIT 1;
  
  SELECT compte_debit_numero INTO v_asdi_config
  FROM accounting_default_accounts
  WHERE tenant_id = NEW.tenant_id AND event_type = 'asdi_deductible' AND is_active = true
  LIMIT 1;
  
  -- Resolve account IDs from plan_comptable using dynamic config
  -- Purchase account (debit) - use config or fallback to 601/6011
  SELECT id INTO v_compte_achat_id 
  FROM plan_comptable 
  WHERE tenant_id = NEW.tenant_id 
    AND numero_compte = COALESCE(v_achat_config.compte_debit_numero, '6011')
    AND type_compte = 'detail'
  LIMIT 1;
  
  -- Fallback to parent account if detail not found
  IF v_compte_achat_id IS NULL THEN
    SELECT id INTO v_compte_achat_id 
    FROM plan_comptable 
    WHERE tenant_id = NEW.tenant_id AND numero_compte = '601'
    LIMIT 1;
  END IF;
  
  -- Supplier account (credit) - use config or fallback to 401/4011
  SELECT id INTO v_compte_fournisseur_id 
  FROM plan_comptable 
  WHERE tenant_id = NEW.tenant_id 
    AND numero_compte = COALESCE(v_achat_config.compte_credit_numero, '4011')
    AND type_compte = 'detail'
  LIMIT 1;
  
  IF v_compte_fournisseur_id IS NULL THEN
    SELECT id INTO v_compte_fournisseur_id 
    FROM plan_comptable 
    WHERE tenant_id = NEW.tenant_id AND numero_compte = '401'
    LIMIT 1;
  END IF;
  
  -- TVA account (debit)
  IF v_tva_config.compte_debit_numero IS NOT NULL THEN
    SELECT id INTO v_compte_tva_id 
    FROM plan_comptable 
    WHERE tenant_id = NEW.tenant_id AND numero_compte = v_tva_config.compte_debit_numero
    LIMIT 1;
  ELSE
    SELECT id INTO v_compte_tva_id 
    FROM plan_comptable 
    WHERE tenant_id = NEW.tenant_id AND numero_compte = '4452'
    LIMIT 1;
  END IF;
  
  -- Centime account (debit)
  IF v_centime_config.compte_debit_numero IS NOT NULL THEN
    SELECT id INTO v_compte_centime_id 
    FROM plan_comptable 
    WHERE tenant_id = NEW.tenant_id AND numero_compte = v_centime_config.compte_debit_numero
    LIMIT 1;
  ELSE
    SELECT id INTO v_compte_centime_id 
    FROM plan_comptable 
    WHERE tenant_id = NEW.tenant_id AND numero_compte IN ('4467', '4471')
    LIMIT 1;
  END IF;
  
  -- ASDI account (debit)
  IF v_asdi_config.compte_debit_numero IS NOT NULL THEN
    SELECT id INTO v_compte_asdi_id 
    FROM plan_comptable 
    WHERE tenant_id = NEW.tenant_id AND numero_compte = v_asdi_config.compte_debit_numero
    LIMIT 1;
  ELSE
    SELECT id INTO v_compte_asdi_id 
    FROM plan_comptable 
    WHERE tenant_id = NEW.tenant_id AND numero_compte IN ('4468', '4472')
    LIMIT 1;
  END IF;
  
  -- Check minimum required accounts
  IF v_compte_achat_id IS NULL OR v_compte_fournisseur_id IS NULL THEN
    RAISE WARNING 'Missing purchase (%) or supplier (%) accounts for tenant %', 
      v_compte_achat_id, v_compte_fournisseur_id, NEW.tenant_id;
    RETURN NEW;
  END IF;
  
  -- Calculate total debit
  v_total_debit := COALESCE(NEW.montant_ht, 0) + COALESCE(NEW.montant_tva, 0) + 
                   COALESCE(NEW.montant_centime_additionnel, 0) + COALESCE(NEW.montant_asdi, 0);
  
  -- Generate piece number
  v_numero_piece := 'REC-' || TO_CHAR(COALESCE(NEW.date_reception::date, CURRENT_DATE), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  
  -- Create accounting entry header
  INSERT INTO ecritures_comptables (
    tenant_id, exercice_id, journal_id, numero_piece, date_ecriture,
    libelle, reference_type, reference_id, statut, is_auto_generated,
    total_debit, total_credit, montant_total
  ) VALUES (
    NEW.tenant_id, v_exercice_id, v_journal_id, v_numero_piece, 
    COALESCE(NEW.date_reception::date, CURRENT_DATE),
    'Réception fournisseur ' || COALESCE(NEW.numero_reception, NEW.id::TEXT),
    'reception', NEW.id, 'Brouillon', true, v_total_debit, NEW.montant_ttc, v_total_debit
  ) RETURNING id INTO v_ecriture_id;
  
  -- Create debit lines
  -- 1. Purchase (HT)
  IF COALESCE(NEW.montant_ht, 0) > 0 THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_achat_id, 'Achats marchandises', NEW.montant_ht, 0);
  END IF;
  
  -- 2. TVA déductible
  IF COALESCE(NEW.montant_tva, 0) > 0 AND v_compte_tva_id IS NOT NULL THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_tva_id, 'TVA déductible', NEW.montant_tva, 0);
  END IF;
  
  -- 3. Centime Additionnel déductible
  IF COALESCE(NEW.montant_centime_additionnel, 0) > 0 AND v_compte_centime_id IS NOT NULL THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_centime_id, 'Centime Additionnel', NEW.montant_centime_additionnel, 0);
  END IF;
  
  -- 4. ASDI déductible
  IF COALESCE(NEW.montant_asdi, 0) > 0 AND v_compte_asdi_id IS NOT NULL THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_asdi_id, 'ASDI', NEW.montant_asdi, 0);
  END IF;
  
  -- Create credit line (Supplier TTC)
  IF COALESCE(NEW.montant_ttc, 0) > 0 THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_fournisseur_id, 'Fournisseur', 0, NEW.montant_ttc);
  END IF;
  
  RAISE NOTICE 'Accounting entries generated for reception % with % lines', NEW.id, 
    (SELECT COUNT(*) FROM lignes_ecriture WHERE ecriture_id = v_ecriture_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trg_achat_accounting ON receptions_fournisseurs;
CREATE TRIGGER trg_achat_accounting
  AFTER INSERT OR UPDATE OF statut ON receptions_fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION trg_achat_accounting_fn();