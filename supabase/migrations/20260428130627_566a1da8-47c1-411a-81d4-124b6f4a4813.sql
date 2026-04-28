
-- Create RDC catalog table mirroring catalogue_global_produits
CREATE TABLE public.catalogue_global_produits_rdc (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_cip text NOT NULL,
  ancien_code_cip text,
  libelle_produit text NOT NULL,
  libelle_forme text,
  libelle_famille text,
  libelle_rayon text,
  libelle_dci text,
  libelle_classe_therapeutique text,
  libelle_laboratoire text,
  libelle_categorie_tarification text,
  prix_achat_reference numeric DEFAULT 0,
  prix_vente_reference numeric DEFAULT 0,
  prix_achat_reference_pnr numeric DEFAULT 0,
  prix_vente_reference_pnr numeric DEFAULT 0,
  libelle_statut text,
  tva boolean NOT NULL DEFAULT false,
  vidal_product_id integer,
  vidal_package_id integer,
  code_cis text,
  code_ucd text,
  market_status text,
  refund_rate text,
  generic_type text,
  is_narcotic boolean,
  is_assimilated_narcotic boolean,
  safety_alert boolean,
  vidal_updated_at timestamptz,
  is_biosimilar boolean DEFAULT false,
  is_doping boolean DEFAULT false,
  has_restricted_prescription boolean DEFAULT false,
  tfr numeric,
  ucd_price numeric,
  drug_in_sport boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT catalogue_global_produits_rdc_code_cip_unique UNIQUE (code_cip)
);

CREATE INDEX idx_catalogue_global_produits_rdc_code_cip ON public.catalogue_global_produits_rdc(code_cip);
CREATE INDEX idx_catalogue_global_produits_rdc_libelle ON public.catalogue_global_produits_rdc(libelle_produit);
CREATE INDEX idx_catalogue_global_produits_rdc_ancien_cip ON public.catalogue_global_produits_rdc(ancien_code_cip);

ALTER TABLE public.catalogue_global_produits_rdc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read RDC global catalog"
  ON public.catalogue_global_produits_rdc FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only platform admins can insert RDC global products"
  ON public.catalogue_global_produits_rdc FOR INSERT TO authenticated WITH CHECK (is_platform_admin());

CREATE POLICY "Only platform admins can update RDC global products"
  ON public.catalogue_global_produits_rdc FOR UPDATE TO authenticated USING (is_platform_admin());

CREATE POLICY "Only platform admins can delete RDC global products"
  ON public.catalogue_global_produits_rdc FOR DELETE TO authenticated USING (is_platform_admin());

CREATE TRIGGER update_catalogue_global_produits_rdc_updated_at
  BEFORE UPDATE ON public.catalogue_global_produits_rdc
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
