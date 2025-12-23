-- Ajout des configurations de comptes comptables par défaut pour les transactions bancaires
-- Ces configurations permettent la génération automatique des écritures comptables

-- Encaissement client (entrée d'argent - règlement client)
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'encaissement_client', '521', '411', 'BQ1', 'Encaissement client - Règlement reçu', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts 
  WHERE tenant_id = p.id AND event_type = 'encaissement_client'
);

-- Décaissement fournisseur (sortie d'argent - paiement fournisseur)
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'decaissement_fournisseur', '401', '521', 'BQ1', 'Décaissement fournisseur - Paiement émis', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts 
  WHERE tenant_id = p.id AND event_type = 'decaissement_fournisseur'
);

-- Frais bancaires (sortie d'argent - charges)
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'frais_bancaires', '631', '521', 'BQ1', 'Frais bancaires et commissions', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts 
  WHERE tenant_id = p.id AND event_type = 'frais_bancaires'
);

-- Virement interne (transfert entre comptes)
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'virement_interne', '521', '521', 'OD', 'Virement interne entre comptes bancaires', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts 
  WHERE tenant_id = p.id AND event_type = 'virement_interne'
);

-- Autres encaissements (entrée d'argent - produits divers)
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'autre_encaissement', '521', '758', 'BQ1', 'Autres produits - Entrée bancaire', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts 
  WHERE tenant_id = p.id AND event_type = 'autre_encaissement'
);

-- Autres décaissements (sortie d'argent - charges diverses)
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'autre_decaissement', '658', '521', 'BQ1', 'Autres charges - Sortie bancaire', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts 
  WHERE tenant_id = p.id AND event_type = 'autre_decaissement'
);

-- Remise de chèques (encaissement différé)
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'remise_cheques', '521', '511', 'BQ1', 'Remise de chèques à l''encaissement', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts 
  WHERE tenant_id = p.id AND event_type = 'remise_cheques'
);

-- Intérêts bancaires créditeurs
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'interets_crediteurs', '521', '761', 'BQ1', 'Intérêts bancaires reçus', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts 
  WHERE tenant_id = p.id AND event_type = 'interets_crediteurs'
);

-- Intérêts bancaires débiteurs (agios)
INSERT INTO accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT p.id, 'interets_debiteurs', '661', '521', 'BQ1', 'Intérêts bancaires et agios payés', true
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_default_accounts 
  WHERE tenant_id = p.id AND event_type = 'interets_debiteurs'
);