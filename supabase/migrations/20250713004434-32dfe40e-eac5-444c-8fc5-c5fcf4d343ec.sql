-- Ajouter le champ password manquant à la table personnel
ALTER TABLE public.personnel 
ADD COLUMN password TEXT;

-- Ajouter un commentaire pour documenter le nouveau champ
COMMENT ON COLUMN public.personnel.password IS 'Mot de passe hashé de l''utilisateur pour l''authentification locale';