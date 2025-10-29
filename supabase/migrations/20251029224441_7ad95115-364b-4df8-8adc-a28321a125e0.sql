-- =====================================================
-- MIGRATION: Ajout colonne description à famille_produit
-- Date: 2025-01-29
-- Source: supabase/migrations_backup_original/20250910162313_42a22e3c-e5e9-44e2-a817-dbae85caf3cc.sql
-- Description: Ajouter colonne description à famille_produit
-- =====================================================

-- Ajouter la colonne description à famille_produit
ALTER TABLE public.famille_produit 
ADD COLUMN IF NOT EXISTS description text;

-- Ajouter un commentaire pour documenter
COMMENT ON COLUMN public.famille_produit.description IS 
'Description de la famille de produits';

-- Vérification de la structure après migration
DO $$
BEGIN
  -- Vérifier famille_produit.description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'famille_produit' 
    AND column_name = 'description'
  ) THEN
    RAISE EXCEPTION 'La colonne famille_produit.description n''a pas été créée';
  END IF;
  
  RAISE NOTICE 'Migration réussie: colonne description créée dans famille_produit';
END $$;