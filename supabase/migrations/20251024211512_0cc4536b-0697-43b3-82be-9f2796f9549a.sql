-- ===================================
-- Migration 02: Pharmacies & Personnel  
-- ===================================

CREATE TYPE public.situation_familiale AS ENUM ('Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)');
CREATE TYPE public.statut_contractuel AS ENUM ('CDI', 'CDD', 'Stage', 'Intérim', 'Freelance');

CREATE TABLE public.pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  address TEXT, city TEXT, region TEXT, departement TEXT, arrondissement TEXT, quartier TEXT,
  postal_code TEXT, pays TEXT DEFAULT 'Cameroun',
  phone TEXT, telephone_appel TEXT, telephone_whatsapp TEXT, email TEXT,
  logo TEXT, photo_exterieur TEXT, photo_interieur TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'hospital', 'clinic')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_pharmacies_code ON public.pharmacies(code);
CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON public.pharmacies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_agent TEXT UNIQUE NOT NULL,
  noms TEXT NOT NULL, prenoms TEXT NOT NULL,
  role TEXT DEFAULT 'Employé' CHECK (role IN ('Admin', 'Pharmacien', 'Employé', 'Caissier', 'Gestionnaire')) NOT NULL,
  fonction TEXT, email TEXT, telephone_appel TEXT, telephone_whatsapp TEXT, adresse TEXT,
  niu_cni TEXT, photo_identite TEXT, date_naissance DATE, date_recrutement DATE, profession TEXT,
  situation_familiale situation_familiale, nombre_enfants INTEGER DEFAULT 0,
  numero_cnss TEXT, statut_contractuel statut_contractuel,
  salaire_base NUMERIC(15,2), limite_dette NUMERIC(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_personnel_tenant_id ON public.personnel(tenant_id);
CREATE INDEX idx_personnel_auth_user_id ON public.personnel(auth_user_id);
CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON public.personnel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own pharmacy" ON public.pharmacies FOR SELECT USING (id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));
CREATE POLICY "Admins update pharmacy" ON public.pharmacies FOR UPDATE USING (id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));

ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View tenant members" ON public.personnel FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Admins insert" ON public.personnel FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id() AND tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins update" ON public.personnel FOR UPDATE USING (tenant_id = get_current_user_tenant_id() AND tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins delete" ON public.personnel FOR DELETE USING (tenant_id = get_current_user_tenant_id() AND tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'tenant_id' IS NOT NULL THEN
    INSERT INTO public.personnel (tenant_id, auth_user_id, reference_agent, noms, prenoms, role, email)
    VALUES ((NEW.raw_user_meta_data->>'tenant_id')::UUID, NEW.id, COALESCE(NEW.raw_user_meta_data->>'reference_agent', 'REF-' || substr(NEW.id::text, 1, 8)), COALESCE(NEW.raw_user_meta_data->>'noms', ''), COALESCE(NEW.raw_user_meta_data->>'prenoms', ''), COALESCE(NEW.raw_user_meta_data->>'role', 'Employé'), NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.pharmacies (code, name, email, phone, city) VALUES ('PH-TEST-001', 'Pharmacie Test', 'test@pharmasoft.cm', '+237600000000', 'Yaoundé') ON CONFLICT (code) DO NOTHING;