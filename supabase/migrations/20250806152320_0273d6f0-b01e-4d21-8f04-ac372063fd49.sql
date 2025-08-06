-- Complete the cleanup of produits table structure

-- Remove duplicate and obsolete columns
ALTER TABLE public.produits DROP COLUMN IF EXISTS famille_produit_id;
ALTER TABLE public.produits DROP COLUMN IF EXISTS rayon_produit_id;  
ALTER TABLE public.produits DROP COLUMN IF EXISTS quantite_stock;
ALTER TABLE public.produits DROP COLUMN IF EXISTS prix_vente;

-- Add missing column for centime additionnel rate
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS taux_centime_additionnel numeric DEFAULT 0.00;

-- Transform laboratoire text column to laboratoires_id FK
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS laboratoires_id uuid;
ALTER TABLE public.produits DROP COLUMN IF EXISTS laboratoire;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_produits_laboratoires'
    ) THEN
        ALTER TABLE public.produits 
        ADD CONSTRAINT fk_produits_laboratoires 
        FOREIGN KEY (laboratoires_id) REFERENCES public.laboratoires(id);
    END IF;
END $$;