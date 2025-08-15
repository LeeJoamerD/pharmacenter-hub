-- Supprimer la colonne password de la table pharmacies
-- L'authentification se fait uniquement via auth.users
ALTER TABLE public.pharmacies DROP COLUMN IF EXISTS password;