ALTER TABLE public.inventaire_sessions DROP CONSTRAINT IF EXISTS inventaire_sessions_type_check;
ALTER TABLE public.inventaire_sessions 
  ADD CONSTRAINT inventaire_sessions_type_check 
  CHECK (type IN ('complet', 'partiel', 'cyclique', 'reception', 'vente'));

NOTIFY pgrst, 'reload schema';