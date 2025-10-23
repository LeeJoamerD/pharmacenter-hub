-- Migration pour corriger la contrainte de clé étrangère manquante
-- entre mouvements_lots.produit_id et produits.id

-- Ajouter la contrainte de clé étrangère pour produit_id dans mouvements_lots
ALTER TABLE public.mouvements_lots 
ADD CONSTRAINT fk_mouvements_lots_produit_id 
FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Créer un index pour optimiser les jointures
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_produit_id ON public.mouvements_lots(produit_id);

-- Commentaire pour documenter la correction
COMMENT ON CONSTRAINT fk_mouvements_lots_produit_id ON public.mouvements_lots IS 
'Contrainte de clé étrangère pour assurer l''intégrité référentielle avec la table produits';