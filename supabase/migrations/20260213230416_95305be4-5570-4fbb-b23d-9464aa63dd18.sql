ALTER TABLE public.catalogue_global_produits
  ADD COLUMN IF NOT EXISTS is_biosimilar boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_doping boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_restricted_prescription boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tfr numeric,
  ADD COLUMN IF NOT EXISTS ucd_price numeric,
  ADD COLUMN IF NOT EXISTS drug_in_sport boolean DEFAULT false;