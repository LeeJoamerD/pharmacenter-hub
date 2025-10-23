-- Ajouter les champs manquants à la table pharmacies
ALTER TABLE public.pharmacies 
ADD COLUMN rccm TEXT,
ADD COLUMN niu TEXT UNIQUE,
ADD COLUMN slogan TEXT,
ADD COLUMN banque TEXT,
ADD COLUMN numero_compte_bancaire TEXT;

-- Ajouter des commentaires pour documenter les nouveaux champs
COMMENT ON COLUMN public.pharmacies.rccm IS 'Registre de Commerce et du Crédit Mobilier';
COMMENT ON COLUMN public.pharmacies.niu IS 'Numéro d''Identification Unique';
COMMENT ON COLUMN public.pharmacies.slogan IS 'Slogan de la pharmacie';
COMMENT ON COLUMN public.pharmacies.banque IS 'Nom de la banque';
COMMENT ON COLUMN public.pharmacies.numero_compte_bancaire IS 'Numéro de compte bancaire';