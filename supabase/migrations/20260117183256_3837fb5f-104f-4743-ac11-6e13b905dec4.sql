-- Étape 1 : Suppression des doublons en utilisant l'ID comme critère de tri (garde le plus petit UUID)
-- Cela gère les cas où created_at est identique
DELETE FROM produits 
WHERE id IN (
  SELECT p.id 
  FROM produits p
  WHERE p.code_cip IS NOT NULL 
    AND p.code_cip != '' 
    AND p.code_cip != '0'
    AND p.is_active = true
    AND EXISTS (
      SELECT 1 FROM produits p2 
      WHERE p2.tenant_id = p.tenant_id 
        AND p2.code_cip = p.code_cip 
        AND p2.is_active = true
        AND (p2.created_at < p.created_at OR (p2.created_at = p.created_at AND p2.id < p.id))
    )
    -- Sécurité : pas de données liées
    AND NOT EXISTS (SELECT 1 FROM lots WHERE produit_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM lignes_ventes WHERE produit_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM stock_mouvements WHERE produit_id = p.id)
);

-- Étape 2 : Supprimer l'ancien index s'il existe
DROP INDEX IF EXISTS idx_produits_unique_code_cip;

-- Étape 3 : Créer l'index unique pour bloquer les futurs doublons
CREATE UNIQUE INDEX idx_produits_unique_code_cip 
ON produits (tenant_id, code_cip) 
WHERE code_cip IS NOT NULL AND code_cip != '' AND code_cip != '0' AND is_active = true;