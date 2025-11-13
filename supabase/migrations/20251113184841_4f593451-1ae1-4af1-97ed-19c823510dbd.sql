-- Remove duplicate foreign keys on mouvements_lots table
-- This fixes the 400 Bad Request error caused by PostgREST confusion with multiple FKs

-- Drop the old auto-generated foreign keys (keeping the explicit named ones)
ALTER TABLE public.mouvements_lots 
DROP CONSTRAINT IF EXISTS mouvements_lots_lot_id_fkey;

ALTER TABLE public.mouvements_lots 
DROP CONSTRAINT IF EXISTS mouvements_lots_lot_destination_id_fkey;

-- Verify the remaining FK constraints are correct
-- We keep: fk_mouvements_lots_lot_id, fk_mouvements_lots_produit_id, fk_mouvements_lots_lot_destination_id
-- These have the proper ON DELETE behaviors