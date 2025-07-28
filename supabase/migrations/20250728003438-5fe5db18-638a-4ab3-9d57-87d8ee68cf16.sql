-- Créer les tables manquantes pour tester les insertions
CREATE TABLE IF NOT EXISTS public.societes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  libelle_societe text NOT NULL,
  adresse text,
  telephone_appel text,
  telephone_whatsapp text,
  email text,
  limite_dette numeric DEFAULT 0.00,
  niu text,
  assureur_id uuid,
  taux_couverture_agent numeric DEFAULT 0,
  taux_couverture_ayant_droit numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conventionnes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  noms text NOT NULL,
  adresse text,
  ville text,
  telephone_appel text,
  telephone_whatsapp text,
  email text,
  niu text,
  limite_dette numeric DEFAULT 0.00,
  taux_ticket_moderateur numeric DEFAULT 0.00,
  caution numeric DEFAULT 0.00,
  taux_remise_automatique numeric DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activer RLS sur ces tables
ALTER TABLE public.societes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conventionnes ENABLE ROW LEVEL SECURITY;

-- Créer les policies manquantes
CREATE POLICY "Users can insert companies in their tenant" ON public.societes
FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view companies from their tenant" ON public.societes
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update companies from their tenant" ON public.societes
FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete companies from their tenant" ON public.societes
FOR DELETE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert contracted partners in their tenant" ON public.conventionnes
FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());