-- Phase 1: Création du schéma de base de données pour les factures (CORRIGÉ)

-- 1.1 Table factures (Unifié clients + fournisseurs)
CREATE TABLE IF NOT EXISTS public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  numero TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('client', 'fournisseur')),
  
  client_id UUID REFERENCES public.clients(id),
  fournisseur_id UUID REFERENCES public.fournisseurs(id),
  vente_id UUID REFERENCES public.ventes(id),
  reception_id UUID REFERENCES public.receptions_fournisseurs(id),
  
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE NOT NULL,
  
  libelle TEXT NOT NULL,
  reference_externe TEXT,
  notes TEXT,
  
  montant_ht NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_tva NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_ttc NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  statut TEXT NOT NULL DEFAULT 'brouillon' 
    CHECK (statut IN ('brouillon', 'emise', 'partiellement_payee', 'payee', 'en_retard', 'annulee')),
  statut_paiement TEXT NOT NULL DEFAULT 'impayee' 
    CHECK (statut_paiement IN ('impayee', 'partielle', 'payee')),
  montant_paye NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_restant NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  relances_effectuees INTEGER NOT NULL DEFAULT 0,
  derniere_relance DATE,
  
  pieces_jointes JSONB DEFAULT '[]'::jsonb,
  
  created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_client_or_fournisseur CHECK (
    (type = 'client' AND client_id IS NOT NULL AND fournisseur_id IS NULL) OR
    (type = 'fournisseur' AND fournisseur_id IS NOT NULL AND client_id IS NULL)
  ),
  CONSTRAINT check_montant_paye CHECK (montant_paye <= montant_ttc),
  CONSTRAINT check_montant_restant_calc CHECK (montant_restant = montant_ttc - montant_paye),
  CONSTRAINT factures_numero_tenant_unique UNIQUE (numero, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_factures_tenant ON public.factures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_factures_type ON public.factures(type);
CREATE INDEX IF NOT EXISTS idx_factures_client ON public.factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_fournisseur ON public.factures(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON public.factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_date_echeance ON public.factures(date_echeance);
CREATE INDEX IF NOT EXISTS idx_factures_numero ON public.factures(numero);

-- 1.2 Table lignes_facture
CREATE TABLE IF NOT EXISTS public.lignes_facture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  
  designation TEXT NOT NULL,
  quantite NUMERIC(10,2) NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(15,2) NOT NULL DEFAULT 0,
  taux_tva NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  montant_ht NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_tva NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_ttc NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_quantite_positive CHECK (quantite > 0),
  CONSTRAINT check_prix_positif CHECK (prix_unitaire >= 0)
);

CREATE INDEX IF NOT EXISTS idx_lignes_facture_facture ON public.lignes_facture(facture_id);
CREATE INDEX IF NOT EXISTS idx_lignes_facture_tenant ON public.lignes_facture(tenant_id);

-- 1.3 Table avoirs
CREATE TABLE IF NOT EXISTS public.avoirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  numero TEXT NOT NULL,
  facture_origine_id UUID NOT NULL REFERENCES public.factures(id),
  
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  motif TEXT NOT NULL,
  
  montant_ht NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_tva NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_ttc NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  statut TEXT NOT NULL DEFAULT 'brouillon' 
    CHECK (statut IN ('brouillon', 'emis', 'applique', 'annule')),
  
  created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT avoirs_numero_tenant_unique UNIQUE (numero, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_avoirs_tenant ON public.avoirs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_avoirs_facture ON public.avoirs(facture_origine_id);

-- 1.4 Table paiements_factures
CREATE TABLE IF NOT EXISTS public.paiements_factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  facture_id UUID NOT NULL REFERENCES public.factures(id),
  
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  montant NUMERIC(15,2) NOT NULL,
  mode_paiement TEXT NOT NULL,
  reference_paiement TEXT,
  notes TEXT,
  
  created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_montant_positif CHECK (montant > 0)
);

CREATE INDEX IF NOT EXISTS idx_paiements_facture ON public.paiements_factures(facture_id);
CREATE INDEX IF NOT EXISTS idx_paiements_tenant ON public.paiements_factures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON public.paiements_factures(date_paiement);

-- 1.5 Table relances_factures
CREATE TABLE IF NOT EXISTS public.relances_factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  facture_id UUID NOT NULL REFERENCES public.factures(id),
  
  date_relance DATE NOT NULL DEFAULT CURRENT_DATE,
  type_relance TEXT NOT NULL,
  message TEXT,
  destinataire TEXT,
  statut TEXT NOT NULL DEFAULT 'envoyee' 
    CHECK (statut IN ('envoyee', 'echec', 'delivree', 'lue')),
  
  created_by_id UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relances_facture ON public.relances_factures(facture_id);
CREATE INDEX IF NOT EXISTS idx_relances_tenant ON public.relances_factures(tenant_id);

-- Fonctions
CREATE OR REPLACE FUNCTION public.generate_invoice_number(
  p_tenant_id UUID,
  p_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_sequence INTEGER;
  v_numero TEXT;
BEGIN
  v_prefix := CASE 
    WHEN p_type = 'client' THEN 'FC'
    WHEN p_type = 'fournisseur' THEN 'FF'
    ELSE 'FA'
  END;
  
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.factures
  WHERE tenant_id = p_tenant_id 
    AND type = p_type
    AND numero LIKE v_prefix || v_year || '%';
  
  v_numero := v_prefix || v_year || '-' || LPAD(v_sequence::TEXT, 3, '0');
  
  RETURN v_numero;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_avoir_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_numero TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.avoirs
  WHERE tenant_id = p_tenant_id 
    AND numero LIKE 'AV' || v_year || '%';
  
  v_numero := 'AV' || v_year || '-' || LPAD(v_sequence::TEXT, 3, '0');
  
  RETURN v_numero;
END;
$$;

-- Triggers
CREATE OR REPLACE FUNCTION public.update_facture_montant_restant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.montant_restant := NEW.montant_ttc - NEW.montant_paye;
  
  IF NEW.montant_paye = 0 THEN
    NEW.statut_paiement := 'impayee';
  ELSIF NEW.montant_paye >= NEW.montant_ttc THEN
    NEW.statut_paiement := 'payee';
    IF NEW.statut != 'annulee' THEN
      NEW.statut := 'payee';
    END IF;
  ELSE
    NEW.statut_paiement := 'partielle';
    IF NEW.statut NOT IN ('annulee', 'en_retard') THEN
      NEW.statut := 'partiellement_payee';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_facture_montant_restant ON public.factures;
CREATE TRIGGER trg_update_facture_montant_restant
BEFORE INSERT OR UPDATE ON public.factures
FOR EACH ROW
EXECUTE FUNCTION public.update_facture_montant_restant();

CREATE OR REPLACE FUNCTION public.calculate_facture_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_ht NUMERIC(15,2);
  v_total_tva NUMERIC(15,2);
  v_total_ttc NUMERIC(15,2);
BEGIN
  SELECT 
    COALESCE(SUM(montant_ht), 0),
    COALESCE(SUM(montant_tva), 0),
    COALESCE(SUM(montant_ttc), 0)
  INTO v_total_ht, v_total_tva, v_total_ttc
  FROM public.lignes_facture
  WHERE facture_id = COALESCE(NEW.facture_id, OLD.facture_id);
  
  UPDATE public.factures
  SET 
    montant_ht = v_total_ht,
    montant_tva = v_total_tva,
    montant_ttc = v_total_ttc,
    montant_restant = v_total_ttc - montant_paye,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.facture_id, OLD.facture_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_calculate_facture_totals_insert ON public.lignes_facture;
CREATE TRIGGER trg_calculate_facture_totals_insert
AFTER INSERT ON public.lignes_facture
FOR EACH ROW
EXECUTE FUNCTION public.calculate_facture_totals();

DROP TRIGGER IF EXISTS trg_calculate_facture_totals_update ON public.lignes_facture;
CREATE TRIGGER trg_calculate_facture_totals_update
AFTER UPDATE ON public.lignes_facture
FOR EACH ROW
EXECUTE FUNCTION public.calculate_facture_totals();

DROP TRIGGER IF EXISTS trg_calculate_facture_totals_delete ON public.lignes_facture;
CREATE TRIGGER trg_calculate_facture_totals_delete
AFTER DELETE ON public.lignes_facture
FOR EACH ROW
EXECUTE FUNCTION public.calculate_facture_totals();

CREATE OR REPLACE FUNCTION public.check_facture_overdue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.date_echeance < CURRENT_DATE 
     AND NEW.statut_paiement != 'payee' 
     AND NEW.statut != 'en_retard'
     AND NEW.statut != 'annulee' THEN
    NEW.statut := 'en_retard';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_facture_overdue ON public.factures;
CREATE TRIGGER trg_check_facture_overdue
BEFORE INSERT OR UPDATE ON public.factures
FOR EACH ROW
EXECUTE FUNCTION public.check_facture_overdue();

-- Vue (CORRIGÉE - sans EXTRACT sur soustraction de dates)
CREATE OR REPLACE VIEW public.v_factures_avec_details AS
SELECT 
  f.id,
  f.tenant_id,
  f.numero,
  f.type,
  f.client_id,
  f.fournisseur_id,
  f.vente_id,
  f.reception_id,
  f.date_emission,
  f.date_echeance,
  f.libelle,
  f.reference_externe,
  f.notes,
  f.montant_ht,
  f.montant_tva,
  f.montant_ttc,
  f.statut,
  f.statut_paiement,
  f.montant_paye,
  f.montant_restant,
  f.relances_effectuees,
  f.derniere_relance,
  f.pieces_jointes,
  f.created_by_id,
  f.created_at,
  f.updated_at,
  
  c.nom_complet as client_nom,
  c.telephone as client_telephone,
  c.email as client_email,
  c.adresse as client_adresse,
  
  fou.nom as fournisseur_nom,
  fou.telephone_appel as fournisseur_telephone,
  fou.email as fournisseur_email,
  fou.adresse as fournisseur_adresse,
  
  COALESCE(c.nom_complet, fou.nom) as client_fournisseur,
  
  p.prenoms || ' ' || p.noms as created_by,
  
  (SELECT COUNT(*) FROM public.lignes_facture WHERE facture_id = f.id) as nombre_lignes,
  
  CASE 
    WHEN f.date_echeance < CURRENT_DATE AND f.statut_paiement != 'payee'
    THEN (CURRENT_DATE - f.date_echeance)::INTEGER
    ELSE 0
  END as jours_retard,
  
  CASE 
    WHEN f.date_echeance >= CURRENT_DATE AND f.statut_paiement != 'payee'
    THEN (f.date_echeance - CURRENT_DATE)::INTEGER
    ELSE 0
  END as jours_avant_echeance
  
FROM public.factures f
LEFT JOIN public.clients c ON f.client_id = c.id
LEFT JOIN public.fournisseurs fou ON f.fournisseur_id = fou.id
LEFT JOIN public.personnel p ON f.created_by_id = p.id;

GRANT SELECT ON public.v_factures_avec_details TO authenticated;

-- RLS Policies
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view factures from their tenant" ON public.factures;
CREATE POLICY "Users can view factures from their tenant"
ON public.factures FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Authorized users can manage factures in their tenant" ON public.factures;
CREATE POLICY "Authorized users can manage factures in their tenant"
ON public.factures FOR ALL
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id())
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.lignes_facture ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view lignes_facture from their tenant" ON public.lignes_facture;
CREATE POLICY "Users can view lignes_facture from their tenant"
ON public.lignes_facture FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Authorized users can manage lignes_facture in their tenant" ON public.lignes_facture;
CREATE POLICY "Authorized users can manage lignes_facture in their tenant"
ON public.lignes_facture FOR ALL
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id())
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.avoirs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view avoirs from their tenant" ON public.avoirs;
CREATE POLICY "Users can view avoirs from their tenant"
ON public.avoirs FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Authorized users can manage avoirs in their tenant" ON public.avoirs;
CREATE POLICY "Authorized users can manage avoirs in their tenant"
ON public.avoirs FOR ALL
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id())
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.paiements_factures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view paiements from their tenant" ON public.paiements_factures;
CREATE POLICY "Users can view paiements from their tenant"
ON public.paiements_factures FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Authorized users can manage paiements in their tenant" ON public.paiements_factures;
CREATE POLICY "Authorized users can manage paiements in their tenant"
ON public.paiements_factures FOR ALL
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id())
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.relances_factures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relances from their tenant" ON public.relances_factures;
CREATE POLICY "Users can view relances from their tenant"
ON public.relances_factures FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Authorized users can manage relances in their tenant" ON public.relances_factures;
CREATE POLICY "Authorized users can manage relances in their tenant"
ON public.relances_factures FOR ALL
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id())
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

GRANT EXECUTE ON FUNCTION public.generate_invoice_number(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_avoir_number(UUID) TO authenticated;