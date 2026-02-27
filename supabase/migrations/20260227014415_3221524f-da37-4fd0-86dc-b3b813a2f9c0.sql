ALTER TABLE public.ventes 
ADD COLUMN type_taux_couverture TEXT DEFAULT 'agent' 
CHECK (type_taux_couverture IN ('agent', 'ayant_droit'));