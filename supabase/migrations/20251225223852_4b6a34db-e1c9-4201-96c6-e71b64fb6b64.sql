-- Add Browse AI import credentials columns to fournisseurs table
ALTER TABLE public.fournisseurs 
ADD COLUMN IF NOT EXISTS url_fournisseur_import TEXT,
ADD COLUMN IF NOT EXISTS id_fournisseur_import TEXT,
ADD COLUMN IF NOT EXISTS mp_fournisseur_import TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.fournisseurs.url_fournisseur_import IS 'URL du portail fournisseur pour import Browse AI';
COMMENT ON COLUMN public.fournisseurs.id_fournisseur_import IS 'Identifiant de connexion Browse AI';
COMMENT ON COLUMN public.fournisseurs.mp_fournisseur_import IS 'Mot de passe de connexion Browse AI';