
-- Ajout de colonnes VIDAL à catalogue_global_produits
ALTER TABLE public.catalogue_global_produits
  ADD COLUMN IF NOT EXISTS vidal_product_id integer,
  ADD COLUMN IF NOT EXISTS vidal_package_id integer,
  ADD COLUMN IF NOT EXISTS code_cis text,
  ADD COLUMN IF NOT EXISTS code_ucd text,
  ADD COLUMN IF NOT EXISTS market_status text,
  ADD COLUMN IF NOT EXISTS refund_rate text,
  ADD COLUMN IF NOT EXISTS generic_type text,
  ADD COLUMN IF NOT EXISTS is_narcotic boolean,
  ADD COLUMN IF NOT EXISTS is_assimilated_narcotic boolean,
  ADD COLUMN IF NOT EXISTS safety_alert boolean,
  ADD COLUMN IF NOT EXISTS vidal_updated_at timestamptz;

-- Index pour recherches par IDs VIDAL
CREATE INDEX IF NOT EXISTS idx_catalogue_global_vidal_package_id ON public.catalogue_global_produits (vidal_package_id) WHERE vidal_package_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalogue_global_vidal_product_id ON public.catalogue_global_produits (vidal_product_id) WHERE vidal_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalogue_global_code_cis ON public.catalogue_global_produits (code_cis) WHERE code_cis IS NOT NULL;
