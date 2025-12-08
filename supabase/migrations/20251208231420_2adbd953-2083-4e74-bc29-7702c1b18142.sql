-- Add statut column to fournisseurs table
ALTER TABLE fournisseurs 
ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'actif' 
CHECK (statut IN ('actif', 'inactif'));

-- Update all existing suppliers to active status
UPDATE fournisseurs SET statut = 'actif' WHERE statut IS NULL;

-- Create index for performance on tenant_id and statut
CREATE INDEX IF NOT EXISTS idx_fournisseurs_tenant_statut 
ON fournisseurs(tenant_id, statut);