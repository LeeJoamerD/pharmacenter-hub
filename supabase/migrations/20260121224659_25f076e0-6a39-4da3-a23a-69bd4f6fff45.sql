
-- Migration C — Mapping accounting_default_accounts pour MAZAYU
-- Utilise les comptes SYSCOHADA: 4431 (TVA collectée), 4461 (Centime additionnel)

-- vente_comptant: Espèces → Caisse (5711)
INSERT INTO public.accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT 'aa8717d1-d450-48dd-a484-66402e435797', 'vente_comptant', '5711', '701', 'VT', 'Vente au comptant - Espèces', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounting_default_accounts
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' AND event_type = 'vente_comptant'
);

-- vente_client: Crédit client → Client (4111)
INSERT INTO public.accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT 'aa8717d1-d450-48dd-a484-66402e435797', 'vente_client', '4111', '701', 'VT', 'Vente à crédit client', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounting_default_accounts
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' AND event_type = 'vente_client'
);

-- vente_mobile_money: Mobile Money → Monnaie électronique (5721)
INSERT INTO public.accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT 'aa8717d1-d450-48dd-a484-66402e435797', 'vente_mobile_money', '5721', '701', 'VT', 'Vente par Mobile Money', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounting_default_accounts
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' AND event_type = 'vente_mobile_money'
);

-- tva_collectee: Crédit sur compte 4431 (TVA collectée SYSCOHADA)
INSERT INTO public.accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT 'aa8717d1-d450-48dd-a484-66402e435797', 'tva_collectee', '', '4431', 'VT', 'TVA collectée sur ventes', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounting_default_accounts
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' AND event_type = 'tva_collectee'
);

-- centime_additionnel: Crédit sur compte 4461 (Centime additionnel SYSCOHADA)
INSERT INTO public.accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description, is_active)
SELECT 'aa8717d1-d450-48dd-a484-66402e435797', 'centime_additionnel', '', '4461', 'VT', 'Centime additionnel sur CA', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounting_default_accounts
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' AND event_type = 'centime_additionnel'
);
