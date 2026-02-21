ALTER TABLE factures DROP CONSTRAINT IF EXISTS check_client_or_fournisseur;
ALTER TABLE factures ADD CONSTRAINT check_client_or_fournisseur CHECK (
  (type = 'client' AND client_id IS NOT NULL AND fournisseur_id IS NULL)
  OR (type = 'client' AND assureur_id IS NOT NULL AND fournisseur_id IS NULL)
  OR (type = 'fournisseur' AND fournisseur_id IS NOT NULL AND client_id IS NULL)
);