-- Mettre à jour les comptes bancaires existants où solde_actuel = 0 mais solde_initial > 0
UPDATE comptes_bancaires 
SET solde_actuel = solde_initial 
WHERE (solde_actuel = 0 OR solde_actuel IS NULL)
  AND solde_initial > 0 
  AND solde_initial IS NOT NULL;