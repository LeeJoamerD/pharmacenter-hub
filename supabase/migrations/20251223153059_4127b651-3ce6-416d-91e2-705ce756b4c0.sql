-- Ajouter la règle de numérotation pour les transactions bancaires
INSERT INTO accounting_numbering_rules (
  tenant_id,
  rule_type,
  format_pattern,
  reset_frequency,
  current_number
)
SELECT 
  p.id as tenant_id,
  'transaction_bancaire' as rule_type,
  'TRX-{YYYY}{MM}-{SEQ:5}' as format_pattern,
  'monthly' as reset_frequency,
  0 as current_number
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_numbering_rules 
  WHERE tenant_id = p.id AND rule_type = 'transaction_bancaire'
);