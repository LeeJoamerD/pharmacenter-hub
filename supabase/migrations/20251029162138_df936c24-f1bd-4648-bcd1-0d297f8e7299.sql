-- Ajouter la colonne niu à la table pharmacies
-- Cette colonne stocke le Numéro d'Identification Unique (NIU) de la pharmacie

ALTER TABLE public.pharmacies 
ADD COLUMN IF NOT EXISTS niu TEXT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.pharmacies.niu IS 'Numéro d''Identification Unique (NIU) de la pharmacie - utilisé pour la facturation et les déclarations fiscales';