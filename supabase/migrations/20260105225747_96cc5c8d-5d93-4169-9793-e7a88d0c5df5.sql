-- Ajout des colonnes Prix Pointe Noire au catalogue global
ALTER TABLE catalogue_global_produits
ADD COLUMN IF NOT EXISTS prix_achat_reference_pnr NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS prix_vente_reference_pnr NUMERIC DEFAULT 0;

-- Commentaires pour clarifier la signification des colonnes
COMMENT ON COLUMN catalogue_global_produits.prix_achat_reference_pnr IS 'Prix d''achat référence Pointe Noire';
COMMENT ON COLUMN catalogue_global_produits.prix_vente_reference_pnr IS 'Prix de vente référence Pointe Noire';