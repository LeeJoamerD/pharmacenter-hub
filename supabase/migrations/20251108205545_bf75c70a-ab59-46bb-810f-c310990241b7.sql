-- Ajouter les foreign keys manquantes pour produits

-- Foreign key vers famille_produit
ALTER TABLE public.produits 
ADD CONSTRAINT fk_produits_famille_id 
FOREIGN KEY (famille_id) 
REFERENCES public.famille_produit(id) 
ON DELETE SET NULL;

-- Foreign key vers dci
ALTER TABLE public.produits 
ADD CONSTRAINT fk_produits_dci_id 
FOREIGN KEY (dci_id) 
REFERENCES public.dci(id) 
ON DELETE SET NULL;

-- Index pour optimiser les jointures
CREATE INDEX IF NOT EXISTS idx_produits_famille_id 
ON public.produits(famille_id);

CREATE INDEX IF NOT EXISTS idx_produits_dci_id 
ON public.produits(dci_id);