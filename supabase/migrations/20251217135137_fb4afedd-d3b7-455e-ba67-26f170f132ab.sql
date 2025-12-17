-- Migration corrigée avec les bonnes tables et colonnes
-- Générer les écritures comptables pour les 12 réceptions validées manquantes

DO $$
DECLARE
  rec RECORD;
  v_exercice_id UUID;
  v_journal_id UUID;
  v_ecriture_id UUID;
  v_numero_piece TEXT;
  v_compte_601 UUID;
  v_compte_4452 UUID;
  v_compte_4471 UUID;
  v_compte_4472 UUID;
  v_compte_401 UUID;
  v_total_debit NUMERIC;
  v_count INT := 0;
BEGIN
  FOR rec IN 
    SELECT r.* FROM receptions_fournisseurs r
    WHERE LOWER(r.statut) IN ('validé', 'validée', 'valide')
    AND NOT EXISTS (
      SELECT 1 FROM ecritures_comptables e 
      WHERE e.reference_id = r.id AND e.reference_type = 'reception'
    )
    AND (COALESCE(r.montant_ht, 0) > 0 OR COALESCE(r.montant_ttc, 0) > 0)
  LOOP
    -- Utiliser journaux_comptables avec code_journal = 'AC'
    SELECT id INTO v_exercice_id FROM exercices_comptables 
    WHERE tenant_id = rec.tenant_id AND LOWER(statut) = 'ouvert' LIMIT 1;
    
    SELECT id INTO v_journal_id FROM journaux_comptables 
    WHERE tenant_id = rec.tenant_id AND code_journal = 'AC' AND is_active = true LIMIT 1;
    
    SELECT id INTO v_compte_601 FROM plan_comptable WHERE tenant_id = rec.tenant_id AND numero_compte = '601' LIMIT 1;
    SELECT id INTO v_compte_4452 FROM plan_comptable WHERE tenant_id = rec.tenant_id AND numero_compte = '4452' LIMIT 1;
    SELECT id INTO v_compte_4471 FROM plan_comptable WHERE tenant_id = rec.tenant_id AND numero_compte = '4471' LIMIT 1;
    SELECT id INTO v_compte_4472 FROM plan_comptable WHERE tenant_id = rec.tenant_id AND numero_compte = '4472' LIMIT 1;
    SELECT id INTO v_compte_401 FROM plan_comptable WHERE tenant_id = rec.tenant_id AND numero_compte = '401' LIMIT 1;
    
    IF v_exercice_id IS NULL OR v_journal_id IS NULL OR v_compte_601 IS NULL OR v_compte_401 IS NULL THEN
      CONTINUE;
    END IF;
    
    v_total_debit := COALESCE(rec.montant_ht, 0) + COALESCE(rec.montant_tva, 0) + 
                     COALESCE(rec.montant_centime_additionnel, 0) + COALESCE(rec.montant_asdi, 0);
    
    v_numero_piece := 'REC-' || TO_CHAR(rec.date_reception::date, 'YYYYMMDD') || '-' || SUBSTRING(rec.id::TEXT, 1, 8);
    
    INSERT INTO ecritures_comptables (
      tenant_id, exercice_id, journal_id, numero_piece, date_ecriture,
      libelle, reference_type, reference_id, statut, is_auto_generated,
      total_debit, total_credit, montant_total
    ) VALUES (
      rec.tenant_id, v_exercice_id, v_journal_id, v_numero_piece, 
      COALESCE(rec.date_reception::date, rec.created_at::date),
      'Réception fournisseur ' || COALESCE(rec.numero_reception, rec.id::TEXT),
      'reception', rec.id, 'Validé', true, v_total_debit, rec.montant_ttc, v_total_debit
    ) RETURNING id INTO v_ecriture_id;
    
    -- Lignes de débit
    IF COALESCE(rec.montant_ht, 0) > 0 THEN
      INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
      VALUES (rec.tenant_id, v_ecriture_id, v_compte_601, 'Achats marchandises', rec.montant_ht, 0);
    END IF;
    
    IF COALESCE(rec.montant_tva, 0) > 0 AND v_compte_4452 IS NOT NULL THEN
      INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
      VALUES (rec.tenant_id, v_ecriture_id, v_compte_4452, 'TVA déductible', rec.montant_tva, 0);
    END IF;
    
    IF COALESCE(rec.montant_centime_additionnel, 0) > 0 AND v_compte_4471 IS NOT NULL THEN
      INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
      VALUES (rec.tenant_id, v_ecriture_id, v_compte_4471, 'Centime Additionnel', rec.montant_centime_additionnel, 0);
    END IF;
    
    IF COALESCE(rec.montant_asdi, 0) > 0 AND v_compte_4472 IS NOT NULL THEN
      INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
      VALUES (rec.tenant_id, v_ecriture_id, v_compte_4472, 'ASDI', rec.montant_asdi, 0);
    END IF;
    
    -- Ligne de crédit (fournisseur)
    IF COALESCE(rec.montant_ttc, 0) > 0 THEN
      INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
      VALUES (rec.tenant_id, v_ecriture_id, v_compte_401, 'Fournisseur', 0, rec.montant_ttc);
    END IF;
    
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Écritures comptables générées pour % réceptions', v_count;
END;
$$;

-- Corriger le trigger pour les futures réceptions
CREATE OR REPLACE FUNCTION trg_achat_accounting_fn()
RETURNS TRIGGER AS $$
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
  v_total_debit NUMERIC;
BEGIN
  IF NOT (LOWER(NEW.statut) IN ('validé', 'validée', 'valide')) THEN
    RETURN NEW;
  END IF;
  
  IF EXISTS (SELECT 1 FROM ecritures_comptables WHERE reference_id = NEW.id AND reference_type = 'reception') THEN
    RETURN NEW;
  END IF;
  
  SELECT id INTO v_exercice_id FROM exercices_comptables 
  WHERE tenant_id = NEW.tenant_id AND LOWER(statut) = 'ouvert' LIMIT 1;
  
  SELECT id INTO v_journal_id FROM journaux_comptables 
  WHERE tenant_id = NEW.tenant_id AND code_journal = 'AC' AND is_active = true LIMIT 1;
  
  SELECT id INTO v_compte_601 FROM plan_comptable WHERE tenant_id = NEW.tenant_id AND numero_compte = '601' LIMIT 1;
  SELECT id INTO v_compte_4452 FROM plan_comptable WHERE tenant_id = NEW.tenant_id AND numero_compte = '4452' LIMIT 1;
  SELECT id INTO v_compte_4471 FROM plan_comptable WHERE tenant_id = NEW.tenant_id AND numero_compte = '4471' LIMIT 1;
  SELECT id INTO v_compte_4472 FROM plan_comptable WHERE tenant_id = NEW.tenant_id AND numero_compte = '4472' LIMIT 1;
  SELECT id INTO v_compte_401 FROM plan_comptable WHERE tenant_id = NEW.tenant_id AND numero_compte = '401' LIMIT 1;
  
  IF v_exercice_id IS NULL OR v_journal_id IS NULL OR v_compte_601 IS NULL OR v_compte_401 IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_total_debit := COALESCE(NEW.montant_ht, 0) + COALESCE(NEW.montant_tva, 0) + 
                   COALESCE(NEW.montant_centime_additionnel, 0) + COALESCE(NEW.montant_asdi, 0);
  
  v_numero_piece := 'REC-' || TO_CHAR(NEW.date_reception::date, 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  
  INSERT INTO ecritures_comptables (
    tenant_id, exercice_id, journal_id, numero_piece, date_ecriture,
    libelle, reference_type, reference_id, statut, is_auto_generated,
    total_debit, total_credit, montant_total
  ) VALUES (
    NEW.tenant_id, v_exercice_id, v_journal_id, v_numero_piece, 
    COALESCE(NEW.date_reception::date, NEW.created_at::date),
    'Réception fournisseur ' || COALESCE(NEW.numero_reception, NEW.id::TEXT),
    'reception', NEW.id, 'Validé', true, v_total_debit, NEW.montant_ttc, v_total_debit
  ) RETURNING id INTO v_ecriture_id;
  
  -- Lignes de débit
  IF COALESCE(NEW.montant_ht, 0) > 0 THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_601, 'Achats marchandises', NEW.montant_ht, 0);
  END IF;
  
  IF COALESCE(NEW.montant_tva, 0) > 0 AND v_compte_4452 IS NOT NULL THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_4452, 'TVA déductible', NEW.montant_tva, 0);
  END IF;
  
  IF COALESCE(NEW.montant_centime_additionnel, 0) > 0 AND v_compte_4471 IS NOT NULL THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_4471, 'Centime Additionnel', NEW.montant_centime_additionnel, 0);
  END IF;
  
  IF COALESCE(NEW.montant_asdi, 0) > 0 AND v_compte_4472 IS NOT NULL THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_4472, 'ASDI', NEW.montant_asdi, 0);
  END IF;
  
  -- Ligne de crédit
  IF COALESCE(NEW.montant_ttc, 0) > 0 THEN
    INSERT INTO lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (NEW.tenant_id, v_ecriture_id, v_compte_401, 'Fournisseur', 0, NEW.montant_ttc);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trg_achat_accounting ON receptions_fournisseurs;
CREATE TRIGGER trg_achat_accounting
  AFTER INSERT OR UPDATE OF statut ON receptions_fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION trg_achat_accounting_fn();