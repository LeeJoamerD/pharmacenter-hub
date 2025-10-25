-- Ajouter une contrainte unique sur (tenant_id, cle_parametre) pour les paramètres système
ALTER TABLE public.parametres_systeme 
ADD CONSTRAINT unique_tenant_cle_parametre 
UNIQUE (tenant_id, cle_parametre);