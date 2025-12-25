-- Ajout de la colonne Centime Additionnel à la table factures_importees
ALTER TABLE public.factures_importees 
ADD COLUMN centime_additionnel NUMERIC(15,2) DEFAULT 0;

-- Commentaire de documentation
COMMENT ON COLUMN public.factures_importees.centime_additionnel IS 'Montant du centime additionnel appliqué à la facture';