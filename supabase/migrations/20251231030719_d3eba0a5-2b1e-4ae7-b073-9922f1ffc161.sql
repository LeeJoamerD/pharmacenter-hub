-- Corriger le code journal pour les ventes (VTE → VT)
UPDATE accounting_default_accounts 
SET journal_code = 'VT' 
WHERE event_type IN ('vente_comptant', 'vente_client') 
  AND journal_code = 'VTE';