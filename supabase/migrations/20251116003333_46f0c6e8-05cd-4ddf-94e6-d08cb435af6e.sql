-- Supprimer les contraintes de clé étrangère en doublon sur lignes_ventes
-- Garder uniquement les contraintes standard générées par Supabase (*_fkey)

-- 1. Supprimer la contrainte dupliquée pour vente_id si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_lignes_ventes_vente'
  ) THEN
    ALTER TABLE public.lignes_ventes 
    DROP CONSTRAINT fk_lignes_ventes_vente;
    
    RAISE NOTICE 'Contrainte fk_lignes_ventes_vente supprimée (doublon de lignes_ventes_vente_id_fkey)';
  END IF;
END $$;

-- 2. Supprimer la contrainte dupliquée pour produit_id si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_lignes_ventes_produit'
  ) THEN
    ALTER TABLE public.lignes_ventes 
    DROP CONSTRAINT fk_lignes_ventes_produit;
    
    RAISE NOTICE 'Contrainte fk_lignes_ventes_produit supprimée (doublon de lignes_ventes_produit_id_fkey)';
  END IF;
END $$;

-- 3. Vérifier les contraintes restantes (pour validation)
SELECT 
  conname AS constraint_name,
  a.attname AS column_name,
  confrelid::regclass AS foreign_table
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.conrelid = 'lignes_ventes'::regclass
  AND c.contype = 'f'
ORDER BY conname;