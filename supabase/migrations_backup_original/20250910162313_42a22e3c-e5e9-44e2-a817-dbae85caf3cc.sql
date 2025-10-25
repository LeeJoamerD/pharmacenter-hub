-- Add description column to famille_produit table
ALTER TABLE public.famille_produit ADD COLUMN IF NOT EXISTS description text;

-- Add description column to rayons_produits table  
ALTER TABLE public.rayons_produits ADD COLUMN IF NOT EXISTS description text;