-- La FK caissier_id a peut-être été créée, on s'assure qu'elle existe
ALTER TABLE public.sessions_caisse
  DROP CONSTRAINT IF EXISTS sessions_caisse_caissier_id_fkey;

ALTER TABLE public.sessions_caisse
  ADD CONSTRAINT sessions_caisse_caissier_id_fkey
  FOREIGN KEY (caissier_id) REFERENCES public.personnel(id);

NOTIFY pgrst, 'reload schema';