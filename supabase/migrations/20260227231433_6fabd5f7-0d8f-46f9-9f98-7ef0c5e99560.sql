
-- Insert payroll accounting default accounts for all existing tenants
-- charge_salaires: Débit 6611 (Appointements, salaires et commissions) / Crédit 422 (Rémunérations dues au personnel)
-- charge_cnss_patronale: Débit 6641 (Charges sociales sur rémunérations du personnel) / Crédit 431 (Sécurité sociale)
-- paiement_salaire_especes: Débit 422 / Crédit 571 (Caisse) / Journal CAI
-- paiement_salaire_banque: Débit 422 / Crédit 521 (Banque) / Journal BQ1
-- paiement_salaire_mobile: Débit 422 / Crédit 5721 (Mobile Money) / Journal CAI

INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'charge_salaires', '6611', '422', 'OD', 'Constatation des salaires bruts', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts a WHERE a.tenant_id = p.id AND a.event_type = 'charge_salaires'
);

INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'charge_cnss_patronale', '6641', '431', 'OD', 'Constatation des charges sociales patronales', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts a WHERE a.tenant_id = p.id AND a.event_type = 'charge_cnss_patronale'
);

INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'retenue_cnss_employe', '422', '431', 'OD', 'Retenue CNSS part salariale', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts a WHERE a.tenant_id = p.id AND a.event_type = 'retenue_cnss_employe'
);

INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'retenue_irpp', '422', '447', 'OD', 'Retenue IRPP sur salaires', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts a WHERE a.tenant_id = p.id AND a.event_type = 'retenue_irpp'
);

INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'paiement_salaire_especes', '422', '571', 'CAI', 'Paiement salaire en espèces', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts a WHERE a.tenant_id = p.id AND a.event_type = 'paiement_salaire_especes'
);

INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'paiement_salaire_banque', '422', '521', 'BQ1', 'Paiement salaire par virement bancaire', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts a WHERE a.tenant_id = p.id AND a.event_type = 'paiement_salaire_banque'
);

INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'paiement_salaire_mobile', '422', '5721', 'CAI', 'Paiement salaire par Mobile Money', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts a WHERE a.tenant_id = p.id AND a.event_type = 'paiement_salaire_mobile'
);
