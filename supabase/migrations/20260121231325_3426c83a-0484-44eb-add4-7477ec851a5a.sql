-- Migration B: Configure accounting_default_accounts for purchase operations (Pharmacie MAZAYU)

-- 1. achat_marchandises - Purchases of goods
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
VALUES (
  'aa8717d1-d450-48dd-a484-66402e435797',
  'achat_marchandises',
  '6011',
  '4011',
  'ACH',
  'Achats de marchandises - Débit 6011 Achats, Crédit 4011 Fournisseur',
  true
)
ON CONFLICT (tenant_id, event_type) DO UPDATE SET
  compte_debit_numero = EXCLUDED.compte_debit_numero,
  compte_credit_numero = EXCLUDED.compte_credit_numero,
  journal_code = EXCLUDED.journal_code,
  is_active = true;

-- 2. tva_deductible - Deductible VAT on purchases
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
VALUES (
  'aa8717d1-d450-48dd-a484-66402e435797',
  'tva_deductible',
  '4452',
  '',
  'ACH',
  'TVA déductible sur achats - Débit 4452',
  true
)
ON CONFLICT (tenant_id, event_type) DO UPDATE SET
  compte_debit_numero = EXCLUDED.compte_debit_numero,
  journal_code = EXCLUDED.journal_code,
  is_active = true;

-- 3. centime_deductible - Deductible Centime Additionnel on purchases
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
VALUES (
  'aa8717d1-d450-48dd-a484-66402e435797',
  'centime_deductible',
  '4467',
  '',
  'ACH',
  'Centime additionnel déductible sur achats - Débit 4467',
  true
)
ON CONFLICT (tenant_id, event_type) DO UPDATE SET
  compte_debit_numero = EXCLUDED.compte_debit_numero,
  journal_code = EXCLUDED.journal_code,
  is_active = true;

-- 4. asdi_deductible - Deductible ASDI on purchases
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
VALUES (
  'aa8717d1-d450-48dd-a484-66402e435797',
  'asdi_deductible',
  '4468',
  '',
  'ACH',
  'ASDI déductible sur achats - Débit 4468',
  true
)
ON CONFLICT (tenant_id, event_type) DO UPDATE SET
  compte_debit_numero = EXCLUDED.compte_debit_numero,
  journal_code = EXCLUDED.journal_code,
  is_active = true;