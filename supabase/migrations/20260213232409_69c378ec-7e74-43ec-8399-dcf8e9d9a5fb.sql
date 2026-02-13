
ALTER TABLE public.dci
  ADD COLUMN IF NOT EXISTS vidal_substance_id integer,
  ADD COLUMN IF NOT EXISTS vidal_name text;

ALTER TABLE public.classes_therapeutiques
  ADD COLUMN IF NOT EXISTS code_atc text,
  ADD COLUMN IF NOT EXISTS vidal_classification_id integer,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.classes_therapeutiques(id);

ALTER TABLE public.formes_galeniques
  ADD COLUMN IF NOT EXISTS vidal_form_id integer;

NOTIFY pgrst, 'reload schema';
