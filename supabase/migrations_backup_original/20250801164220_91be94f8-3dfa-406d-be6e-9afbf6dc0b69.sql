-- Add missing columns to produits table
ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS famille_id UUID,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rayon_id UUID,
ADD COLUMN IF NOT EXISTS dci_id UUID,
ADD COLUMN IF NOT EXISTS categorie_tarification_id UUID,
ADD COLUMN IF NOT EXISTS laboratoire TEXT,
ADD COLUMN IF NOT EXISTS code_produit TEXT,
ADD COLUMN IF NOT EXISTS stock_limite INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prix_achat NUMERIC DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS prix_vente NUMERIC DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS taux_tva NUMERIC DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS quantite_stock INTEGER DEFAULT 0;

-- Add foreign key constraints
ALTER TABLE public.produits 
ADD CONSTRAINT fk_produits_famille 
FOREIGN KEY (famille_id) REFERENCES public.famille_produit(id);

ALTER TABLE public.produits 
ADD CONSTRAINT fk_produits_rayon 
FOREIGN KEY (rayon_id) REFERENCES public.rayons_produits(id);

ALTER TABLE public.produits 
ADD CONSTRAINT fk_produits_dci 
FOREIGN KEY (dci_id) REFERENCES public.dci(id);

ALTER TABLE public.produits 
ADD CONSTRAINT fk_produits_categorie 
FOREIGN KEY (categorie_tarification_id) REFERENCES public.categorie_tarification(id);