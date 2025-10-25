-- Ajouter une contrainte unique pour permettre l'upsert sur preferences_utilisateur
ALTER TABLE public.preferences_utilisateur 
ADD CONSTRAINT preferences_utilisateur_unique_key 
UNIQUE (tenant_id, personnel_id, cle_preference);