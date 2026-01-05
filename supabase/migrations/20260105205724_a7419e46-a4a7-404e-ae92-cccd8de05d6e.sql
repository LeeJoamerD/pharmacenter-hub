-- Nettoyage du catalogue global des produits
-- Supprimer les colonnes inutiles (codes, taux, statuts)

-- 1. Supprimer l'index qui dépend de is_active
DROP INDEX IF EXISTS idx_catalogue_global_active;

-- 2. Supprimer les 11 colonnes inutiles
ALTER TABLE catalogue_global_produits 
  DROP COLUMN IF EXISTS code_forme,
  DROP COLUMN IF EXISTS code_famille,
  DROP COLUMN IF EXISTS code_rayon,
  DROP COLUMN IF EXISTS code_dci,
  DROP COLUMN IF EXISTS code_classe_therapeutique,
  DROP COLUMN IF EXISTS code_laboratoire,
  DROP COLUMN IF EXISTS code_categorie_tarification,
  DROP COLUMN IF EXISTS code_statut,
  DROP COLUMN IF EXISTS taux_tva,
  DROP COLUMN IF EXISTS prescription_requise,
  DROP COLUMN IF EXISTS is_active;

-- 3. Ajouter la nouvelle colonne TVA (boolean)
ALTER TABLE catalogue_global_produits 
  ADD COLUMN IF NOT EXISTS tva BOOLEAN NOT NULL DEFAULT FALSE;