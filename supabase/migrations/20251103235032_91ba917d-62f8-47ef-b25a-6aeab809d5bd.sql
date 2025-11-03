-- COMPTABILITÉ ANALYTIQUE - Migration simplifiée
CREATE TABLE public.centres_couts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL, code TEXT NOT NULL, nom TEXT NOT NULL,
  type_centre TEXT NOT NULL CHECK (type_centre IN ('operationnel','commercial','support','profit','investissement')),
  centre_parent_id UUID REFERENCES public.centres_couts(id), niveau INTEGER NOT NULL DEFAULT 1,
  responsable_id UUID REFERENCES public.personnel(id), est_actif BOOLEAN NOT NULL DEFAULT true,
  date_ouverture DATE NOT NULL DEFAULT CURRENT_DATE, date_fermeture DATE,
  compte_analytique_id UUID REFERENCES public.plan_comptable(id),
  objectif_marge_min NUMERIC(5,2), objectif_rotation_stock NUMERIC(8,2), description TEXT, notes TEXT,
  created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_code_centre_tenant UNIQUE (code, tenant_id),
  CONSTRAINT check_dates_centre CHECK (date_fermeture IS NULL OR date_fermeture >= date_ouverture)
);
CREATE INDEX idx_centres_couts_tenant ON public.centres_couts(tenant_id);
CREATE INDEX idx_centres_couts_type ON public.centres_couts(type_centre);

CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL, libelle TEXT NOT NULL,
  exercice_comptable_id UUID REFERENCES public.exercices_comptables(id),
  centre_cout_id UUID REFERENCES public.centres_couts(id), compte_id UUID REFERENCES public.plan_comptable(id),
  type_periode TEXT NOT NULL CHECK (type_periode IN ('annuel','trimestriel','mensuel')),
  date_debut DATE NOT NULL, date_fin DATE NOT NULL, annee INTEGER NOT NULL, mois INTEGER, trimestre INTEGER,
  montant_prevu NUMERIC(15,2) NOT NULL DEFAULT 0, montant_realise NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_engage NUMERIC(15,2) NOT NULL DEFAULT 0,
  ecart_montant NUMERIC(15,2) GENERATED ALWAYS AS (montant_realise - montant_prevu) STORED,
  ecart_pourcentage NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN montant_prevu = 0 THEN 0 ELSE ((montant_realise - montant_prevu) / montant_prevu * 100) END
  ) STORED,
  statut TEXT NOT NULL DEFAULT 'previsionnel' CHECK (statut IN ('previsionnel','valide','en_cours','cloture','annule')),
  valide_par_id UUID REFERENCES public.personnel(id), date_validation TIMESTAMP WITH TIME ZONE,
  notes TEXT, commentaire_ecart TEXT, created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT check_dates_budget CHECK (date_fin >= date_debut)
);
CREATE INDEX idx_budgets_tenant ON public.budgets(tenant_id);

CREATE TABLE public.cles_repartition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL, code TEXT NOT NULL, libelle TEXT NOT NULL,
  type_cle TEXT NOT NULL CHECK (type_cle IN ('chiffre_affaires','nombre_employes','surface_occupee','couts_directs','unites_produites','heures_machine','personnalisee')),
  est_active BOOLEAN NOT NULL DEFAULT true, methode_calcul TEXT, formule JSONB DEFAULT '{}'::jsonb, description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_code_cle_tenant UNIQUE (code, tenant_id)
);

CREATE TABLE public.coefficients_repartition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
  cle_repartition_id UUID NOT NULL REFERENCES public.cles_repartition(id) ON DELETE CASCADE,
  centre_cout_id UUID NOT NULL REFERENCES public.centres_couts(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL, date_fin DATE, coefficient NUMERIC(10,4) NOT NULL, valeur_base NUMERIC(15,2), notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_cle_centre_periode UNIQUE (cle_repartition_id, centre_cout_id, date_debut)
);

CREATE TABLE public.repartitions_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL, numero_repartition TEXT NOT NULL,
  date_repartition DATE NOT NULL, libelle TEXT NOT NULL,
  type_charge TEXT NOT NULL CHECK (type_charge IN ('frais_admin','services_generaux','maintenance','assurances','informatique','autres')),
  montant_total NUMERIC(15,2) NOT NULL, montant_reparti NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_non_reparti NUMERIC(15,2) GENERATED ALWAYS AS (montant_total - montant_reparti) STORED,
  cle_repartition_id UUID REFERENCES public.cles_repartition(id),
  methode TEXT NOT NULL CHECK (methode IN ('automatique','manuelle','mixte')),
  compte_charge_id UUID REFERENCES public.plan_comptable(id),
  ecriture_comptable_id UUID REFERENCES public.ecritures_comptables(id),
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours','valide','comptabilise','annule')),
  valide_par_id UUID REFERENCES public.personnel(id), date_validation TIMESTAMP WITH TIME ZONE,
  comptabilise_par_id UUID REFERENCES public.personnel(id), date_comptabilisation TIMESTAMP WITH TIME ZONE,
  notes TEXT, created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_numero_repartition_tenant UNIQUE (numero_repartition, tenant_id)
);

CREATE TABLE public.lignes_repartition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
  repartition_id UUID NOT NULL REFERENCES public.repartitions_charges(id) ON DELETE CASCADE,
  centre_cout_id UUID NOT NULL REFERENCES public.centres_couts(id),
  coefficient NUMERIC(10,4) NOT NULL, montant NUMERIC(15,2) NOT NULL,
  compte_destination_id UUID REFERENCES public.plan_comptable(id), justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lignes_ecriture ADD COLUMN IF NOT EXISTS centre_cout_id UUID REFERENCES public.centres_couts(id);
CREATE INDEX IF NOT EXISTS idx_lignes_ecriture_centre ON public.lignes_ecriture(centre_cout_id);

CREATE OR REPLACE FUNCTION update_repartition_montant() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.repartitions_charges SET montant_reparti = (
    SELECT COALESCE(SUM(montant), 0) FROM public.lignes_repartition 
    WHERE repartition_id = COALESCE(NEW.repartition_id, OLD.repartition_id)
  ), updated_at = NOW() WHERE id = COALESCE(NEW.repartition_id, OLD.repartition_id);
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_update_repartition_montant_insert AFTER INSERT ON public.lignes_repartition FOR EACH ROW EXECUTE FUNCTION update_repartition_montant();

CREATE OR REPLACE VIEW v_performance_centres_couts AS
SELECT cc.id, cc.tenant_id, cc.code, cc.nom, cc.type_centre, cc.responsable_id,
  p.noms || ' ' || p.prenoms as responsable_nom,
  COALESCE(SUM(b.montant_prevu), 0) as budget_total,
  COALESCE(SUM(b.montant_realise), 0) as realise_total,
  COALESCE(SUM(b.montant_prevu) - SUM(b.montant_realise), 0) as ecart_montant,
  CASE WHEN SUM(b.montant_prevu) > 0 THEN ((SUM(b.montant_realise) - SUM(b.montant_prevu)) / SUM(b.montant_prevu) * 100) ELSE 0 END as ecart_pourcentage,
  COUNT(DISTINCT b.id) as nombre_budgets, 0 as budgets_depassement, cc.est_actif, cc.created_at
FROM public.centres_couts cc
LEFT JOIN public.personnel p ON cc.responsable_id = p.id
LEFT JOIN public.budgets b ON cc.id = b.centre_cout_id AND b.statut IN ('valide', 'en_cours')
GROUP BY cc.id, cc.code, cc.nom, cc.type_centre, cc.responsable_id, p.noms, p.prenoms, cc.est_actif, cc.created_at;

CREATE OR REPLACE VIEW v_rentabilite_produits AS
SELECT p.id as produit_id, p.tenant_id, p.libelle_produit as produit_nom, p.code_cip as code_produit,
  fp.libelle_famille as famille, 0 as chiffre_affaires, 0 as quantite_vendue, 0 as cout_achat,
  0 as marge_brute, 0 as taux_marge, NULL::date as derniere_vente
FROM public.produits p
LEFT JOIN public.famille_produit fp ON p.famille_id = fp.id;

GRANT SELECT ON v_performance_centres_couts TO authenticated;
GRANT SELECT ON v_rentabilite_produits TO authenticated;

ALTER TABLE public.centres_couts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view centres_couts from their tenant" ON public.centres_couts FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Authorized users can manage centres_couts in their tenant" ON public.centres_couts FOR ALL TO authenticated USING (tenant_id = public.get_current_user_tenant_id()) WITH CHECK (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view budgets from their tenant" ON public.budgets FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Authorized users can manage budgets in their tenant" ON public.budgets FOR ALL TO authenticated USING (tenant_id = public.get_current_user_tenant_id()) WITH CHECK (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.cles_repartition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view cles_repartition from their tenant" ON public.cles_repartition FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Authorized users can manage cles_repartition in their tenant" ON public.cles_repartition FOR ALL TO authenticated USING (tenant_id = public.get_current_user_tenant_id()) WITH CHECK (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.coefficients_repartition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view coefficients from their tenant" ON public.coefficients_repartition FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.repartitions_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view repartitions from their tenant" ON public.repartitions_charges FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.lignes_repartition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view lignes_repartition from their tenant" ON public.lignes_repartition FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());

CREATE OR REPLACE FUNCTION generate_cost_center_code(p_tenant_id UUID) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_last_code TEXT; v_number INTEGER;
BEGIN
  SELECT code INTO v_last_code FROM public.centres_couts WHERE tenant_id = p_tenant_id ORDER BY code DESC LIMIT 1;
  IF v_last_code IS NULL THEN v_number := 1; ELSE v_number := SUBSTRING(v_last_code FROM 3)::INTEGER + 1; END IF;
  RETURN 'CC' || LPAD(v_number::TEXT, 3, '0');
END; $$;

CREATE OR REPLACE FUNCTION calculate_automatic_allocation(p_tenant_id UUID, p_cle_id UUID, p_montant_total NUMERIC, p_date_ref DATE)
RETURNS TABLE (centre_cout_id UUID, coefficient NUMERIC, montant NUMERIC) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total_valeur NUMERIC;
BEGIN
  SELECT SUM(valeur_base) INTO v_total_valeur FROM public.coefficients_repartition 
  WHERE cle_repartition_id = p_cle_id AND tenant_id = p_tenant_id AND p_date_ref BETWEEN date_debut AND COALESCE(date_fin, '9999-12-31'::DATE);
  IF v_total_valeur IS NULL OR v_total_valeur = 0 THEN RAISE EXCEPTION 'Aucun coefficient défini'; END IF;
  RETURN QUERY SELECT cr.centre_cout_id, (cr.valeur_base / v_total_valeur)::NUMERIC(10,4), ROUND(p_montant_total * (cr.valeur_base / v_total_valeur), 2)
  FROM public.coefficients_repartition cr WHERE cr.cle_repartition_id = p_cle_id AND cr.tenant_id = p_tenant_id 
  AND p_date_ref BETWEEN cr.date_debut AND COALESCE(cr.date_fin, '9999-12-31'::DATE);
END; $$;