-- Fix stock_mouvements type_mouvement constraint to accept lowercase values without accents
-- This aligns with the frontend code and backup migrations

-- Step 1: Update existing data to lowercase without accents
UPDATE public.stock_mouvements
SET type_mouvement = CASE
  WHEN type_mouvement = 'Entrée' THEN 'entree'
  WHEN type_mouvement = 'Sortie' THEN 'sortie'
  WHEN type_mouvement = 'Ajustement' THEN 'ajustement'
  WHEN type_mouvement = 'Inventaire' THEN 'inventaire'
  WHEN type_mouvement = 'Péremption' THEN 'peremption'
  WHEN type_mouvement = 'Perte' THEN 'perte'
  WHEN type_mouvement = 'Transfert' THEN 'transfert'
  WHEN type_mouvement = 'Vente' THEN 'vente'
  WHEN type_mouvement = 'Retour' THEN 'retour'
  WHEN type_mouvement = 'Destruction' THEN 'destruction'
  WHEN type_mouvement = 'Réservation' THEN 'reservation'
  ELSE type_mouvement
END
WHERE type_mouvement IN ('Entrée', 'Sortie', 'Ajustement', 'Inventaire', 'Péremption', 'Perte', 'Transfert', 'Vente', 'Retour', 'Destruction', 'Réservation');

-- Step 2: Drop the old constraint
ALTER TABLE public.stock_mouvements 
  DROP CONSTRAINT IF EXISTS stock_mouvements_type_mouvement_check;

-- Step 3: Add the new constraint with lowercase values without accents
ALTER TABLE public.stock_mouvements 
  ADD CONSTRAINT stock_mouvements_type_mouvement_check 
  CHECK (type_mouvement IN (
    'entree',      -- Entrée de stock (réception, production)
    'sortie',      -- Sortie de stock (vente, consommation)
    'ajustement',  -- Ajustement de stock (inventaire)
    'transfert',   -- Transfert entre emplacements
    'vente',       -- Vente spécifique
    'retour',      -- Retour client/fournisseur
    'destruction', -- Destruction de produits
    'peremption',  -- Péremption de produits
    'perte',       -- Perte de stock
    'inventaire',  -- Inventaire
    'reservation'  -- Réservation de stock
  ));