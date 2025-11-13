-- Add missing foreign keys to mouvements_lots table
-- This fixes the 400 Bad Request error when loading the Journal module

-- First, validate data integrity before adding constraints
DO $$
BEGIN
  -- Check if all lot_id references exist
  IF EXISTS (
    SELECT 1 FROM public.mouvements_lots ml
    WHERE ml.lot_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.lots l WHERE l.id = ml.lot_id)
  ) THEN
    RAISE EXCEPTION 'Cannot add FK: some lot_id values reference non-existent lots';
  END IF;

  -- Check if all produit_id references exist
  IF EXISTS (
    SELECT 1 FROM public.mouvements_lots ml
    WHERE ml.produit_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.produits p WHERE p.id = ml.produit_id)
  ) THEN
    RAISE EXCEPTION 'Cannot add FK: some produit_id values reference non-existent products';
  END IF;

  -- Check if all lot_destination_id references exist
  IF EXISTS (
    SELECT 1 FROM public.mouvements_lots ml
    WHERE ml.lot_destination_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.lots l WHERE l.id = ml.lot_destination_id)
  ) THEN
    RAISE EXCEPTION 'Cannot add FK: some lot_destination_id values reference non-existent lots';
  END IF;
END $$;

-- Add foreign key for lot_id (source lot)
ALTER TABLE public.mouvements_lots 
ADD CONSTRAINT fk_mouvements_lots_lot_id 
FOREIGN KEY (lot_id) 
REFERENCES public.lots(id) 
ON DELETE CASCADE;

-- Add foreign key for produit_id
ALTER TABLE public.mouvements_lots 
ADD CONSTRAINT fk_mouvements_lots_produit_id 
FOREIGN KEY (produit_id) 
REFERENCES public.produits(id) 
ON DELETE RESTRICT;

-- Add foreign key for lot_destination_id (destination lot for transfers)
ALTER TABLE public.mouvements_lots 
ADD CONSTRAINT fk_mouvements_lots_lot_destination_id 
FOREIGN KEY (lot_destination_id) 
REFERENCES public.lots(id) 
ON DELETE SET NULL;

-- Create indexes to optimize joins and queries
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_lot_id 
  ON public.mouvements_lots(lot_id);

CREATE INDEX IF NOT EXISTS idx_mouvements_lots_produit_id 
  ON public.mouvements_lots(produit_id);

CREATE INDEX IF NOT EXISTS idx_mouvements_lots_lot_destination_id 
  ON public.mouvements_lots(lot_destination_id) 
  WHERE lot_destination_id IS NOT NULL;

-- Add comment to document the fix
COMMENT ON CONSTRAINT fk_mouvements_lots_lot_id ON public.mouvements_lots 
  IS 'Foreign key to lots table - enables PostgREST joins for lot details';

COMMENT ON CONSTRAINT fk_mouvements_lots_produit_id ON public.mouvements_lots 
  IS 'Foreign key to produits table - enables PostgREST joins for product details';

COMMENT ON CONSTRAINT fk_mouvements_lots_lot_destination_id ON public.mouvements_lots 
  IS 'Foreign key to lots table for destination lot in transfers - enables PostgREST joins';