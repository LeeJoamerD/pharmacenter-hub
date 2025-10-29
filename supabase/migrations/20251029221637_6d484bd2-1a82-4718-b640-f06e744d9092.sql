-- =====================================================
-- MIGRATION: Correction colonne exercices_comptables
-- Date: 2025-01-29
-- Description: Renommer libelle → libelle_exercice pour correspondre au frontend
-- =====================================================

-- Renommer la colonne
ALTER TABLE public.exercices_comptables 
RENAME COLUMN libelle TO libelle_exercice;

-- Ajouter un commentaire pour documenter
COMMENT ON COLUMN public.exercices_comptables.libelle_exercice IS 
'Libellé de l''exercice comptable (ex: "Exercice 2025")';

-- Vérification de la structure après migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exercices_comptables' 
    AND column_name = 'libelle_exercice'
  ) THEN
    RAISE EXCEPTION 'La colonne libelle_exercice n''a pas été créée correctement';
  END IF;
  
  RAISE NOTICE 'Migration réussie: colonne libelle_exercice créée';
END $$;