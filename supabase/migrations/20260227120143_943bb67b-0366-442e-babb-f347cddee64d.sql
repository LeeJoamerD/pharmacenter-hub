
-- Table des bulletins de paie
CREATE TABLE public.bulletins_paie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  personnel_id uuid NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  periode_mois integer NOT NULL CHECK (periode_mois BETWEEN 1 AND 12),
  periode_annee integer NOT NULL CHECK (periode_annee BETWEEN 2000 AND 2100),
  salaire_base numeric NOT NULL DEFAULT 0,
  primes numeric NOT NULL DEFAULT 0,
  heures_sup numeric NOT NULL DEFAULT 0,
  avances numeric NOT NULL DEFAULT 0,
  retenues_cnss_employe numeric NOT NULL DEFAULT 0,
  retenues_irpp numeric NOT NULL DEFAULT 0,
  retenues_autres numeric NOT NULL DEFAULT 0,
  cotisations_patronales_cnss numeric NOT NULL DEFAULT 0,
  cotisations_patronales_autres numeric NOT NULL DEFAULT 0,
  salaire_brut numeric NOT NULL DEFAULT 0,
  salaire_net numeric NOT NULL DEFAULT 0,
  net_a_payer numeric NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'Brouillon' CHECK (statut IN ('Brouillon', 'Validé', 'Payé')),
  date_paiement date,
  mode_paiement text CHECK (mode_paiement IN ('Espèces', 'Virement', 'Mobile Money', 'Chèque')),
  reference_paiement text,
  notes text,
  ecriture_id uuid,
  created_by_id uuid REFERENCES public.personnel(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bulletins_paie_unique_periode UNIQUE (tenant_id, personnel_id, periode_mois, periode_annee)
);

-- Table des paramètres de paie
CREATE TABLE public.parametres_paie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE UNIQUE,
  taux_cnss_employe numeric NOT NULL DEFAULT 3.5,
  taux_cnss_patronal numeric NOT NULL DEFAULT 20.29,
  taux_irpp numeric NOT NULL DEFAULT 0,
  smic numeric NOT NULL DEFAULT 90000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bulletins_paie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_paie ENABLE ROW LEVEL SECURITY;

-- RLS for bulletins_paie
CREATE POLICY "Bulletins paie: lecture même tenant"
  ON public.bulletins_paie FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()));

CREATE POLICY "Bulletins paie: insertion même tenant"
  ON public.bulletins_paie FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()));

CREATE POLICY "Bulletins paie: modification même tenant"
  ON public.bulletins_paie FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()));

CREATE POLICY "Bulletins paie: suppression même tenant"
  ON public.bulletins_paie FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()));

-- RLS for parametres_paie
CREATE POLICY "Parametres paie: lecture même tenant"
  ON public.parametres_paie FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()));

CREATE POLICY "Parametres paie: insertion même tenant"
  ON public.parametres_paie FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()));

CREATE POLICY "Parametres paie: modification même tenant"
  ON public.parametres_paie FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_bulletins_paie_updated_at
  BEFORE UPDATE ON public.bulletins_paie
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parametres_paie_updated_at
  BEFORE UPDATE ON public.parametres_paie
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_bulletins_paie_tenant_periode ON public.bulletins_paie (tenant_id, periode_annee, periode_mois);
CREATE INDEX idx_bulletins_paie_personnel ON public.bulletins_paie (personnel_id);
