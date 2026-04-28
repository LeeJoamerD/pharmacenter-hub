-- 1. Enum pour les types de localisation
DO $$ BEGIN
  CREATE TYPE public.geo_location_type AS ENUM ('pays', 'departement', 'arrondissement', 'quartier');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Table des localisations géographiques (référentiel global partagé)
CREATE TABLE IF NOT EXISTS public.geo_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.geo_location_type NOT NULL,
  nom text NOT NULL,
  parent_id uuid REFERENCES public.geo_locations(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unicité: même type + même nom + même parent (NULL inclus via coalesce trick)
CREATE UNIQUE INDEX IF NOT EXISTS geo_locations_unique_idx
  ON public.geo_locations (type, lower(nom), COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS geo_locations_type_idx ON public.geo_locations(type);
CREATE INDEX IF NOT EXISTS geo_locations_parent_idx ON public.geo_locations(parent_id);

-- 3. RLS
ALTER TABLE public.geo_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read geo_locations" ON public.geo_locations;
CREATE POLICY "Authenticated can read geo_locations"
  ON public.geo_locations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert geo_locations" ON public.geo_locations;
CREATE POLICY "Authenticated can insert geo_locations"
  ON public.geo_locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Platform admin can update geo_locations" ON public.geo_locations;
CREATE POLICY "Platform admin can update geo_locations"
  ON public.geo_locations FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admin can delete geo_locations" ON public.geo_locations;
CREATE POLICY "Platform admin can delete geo_locations"
  ON public.geo_locations FOR DELETE
  TO authenticated
  USING (public.is_platform_admin());

-- 4. Trigger updated_at
DROP TRIGGER IF EXISTS update_geo_locations_updated_at ON public.geo_locations;
CREATE TRIGGER update_geo_locations_updated_at
  BEFORE UPDATE ON public.geo_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Seed pays
INSERT INTO public.geo_locations (type, nom, parent_id) VALUES
  ('pays', 'République du Congo', NULL),
  ('pays', 'République Démocratique du Congo', NULL),
  ('pays', 'Cameroun', NULL),
  ('pays', 'Gabon', NULL),
  ('pays', 'République Centrafricaine', NULL),
  ('pays', 'Tchad', NULL),
  ('pays', 'Côte d''Ivoire', NULL),
  ('pays', 'Sénégal', NULL),
  ('pays', 'Mali', NULL),
  ('pays', 'Burkina Faso', NULL),
  ('pays', 'Niger', NULL),
  ('pays', 'Bénin', NULL),
  ('pays', 'Togo', NULL),
  ('pays', 'Guinée', NULL),
  ('pays', 'France', NULL)
ON CONFLICT DO NOTHING;

-- 6. Correction donnée : Kinshasa = RDC
UPDATE public.pharmacies
SET pays = 'République Démocratique du Congo'
WHERE city ILIKE 'Kinshasa%' AND (pays IS NULL OR pays = 'République du Congo');

-- 7. Pour les pharmacies sans pays, copier depuis l'ancienne colonne region si présente
UPDATE public.pharmacies
SET pays = region
WHERE (pays IS NULL OR pays = '') AND region IS NOT NULL AND region <> '';
