-- Add financial columns to commandes_fournisseurs table for storing order totals
ALTER TABLE public.commandes_fournisseurs 
ADD COLUMN IF NOT EXISTS montant_ht NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_tva NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_centime_additionnel NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_asdi NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_ttc NUMERIC(15,2) DEFAULT 0;

-- Create index for faster financial queries
CREATE INDEX IF NOT EXISTS idx_commandes_fournisseurs_montant_ttc ON public.commandes_fournisseurs(montant_ttc);

COMMENT ON COLUMN public.commandes_fournisseurs.montant_ht IS 'Sous-total HT de la commande';
COMMENT ON COLUMN public.commandes_fournisseurs.montant_tva IS 'Montant TVA calculé par catégorie produit';
COMMENT ON COLUMN public.commandes_fournisseurs.montant_centime_additionnel IS 'Montant centime additionnel calculé';
COMMENT ON COLUMN public.commandes_fournisseurs.montant_asdi IS 'ASDI = ((HT + TVA) * 0.42) / 100';
COMMENT ON COLUMN public.commandes_fournisseurs.montant_ttc IS 'Total TTC = HT + TVA + Centime + ASDI';