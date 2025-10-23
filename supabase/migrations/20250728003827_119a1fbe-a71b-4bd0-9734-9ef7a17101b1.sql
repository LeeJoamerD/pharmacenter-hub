-- Modifier la contrainte NOT NULL sur assureur_id dans la table societes
ALTER TABLE public.societes ALTER COLUMN assureur_id DROP NOT NULL;

-- Modifier aussi les autres colonnes NULL si nécessaire
ALTER TABLE public.societes ALTER COLUMN niu DROP NOT NULL;
ALTER TABLE public.societes ALTER COLUMN telephone_whatsapp DROP NOT NULL;

-- Pour conventionnes aussi
ALTER TABLE public.conventionnes ALTER COLUMN niu DROP NOT NULL;
ALTER TABLE public.conventionnes ALTER COLUMN telephone_whatsapp DROP NOT NULL;