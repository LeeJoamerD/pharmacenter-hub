-- =============================================
-- PHARMA TOOLS RÉSEAU - Tables et Fonctions RPC
-- =============================================

-- Table 1: drug_interactions (Interactions Médicamenteuses)
CREATE TABLE public.drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id),
  drug1_id UUID REFERENCES public.produits(id),
  drug1_name TEXT NOT NULL,
  drug2_id UUID REFERENCES public.produits(id),
  drug2_name TEXT NOT NULL,
  dci1_id UUID REFERENCES public.dci(id),
  dci2_id UUID REFERENCES public.dci(id),
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'moderate', 'major', 'contraindicated')),
  mechanism TEXT,
  clinical_effect TEXT,
  management TEXT,
  source_references TEXT[] DEFAULT '{}',
  is_network_shared BOOLEAN DEFAULT false,
  shared_by_pharmacy_id UUID REFERENCES public.pharmacies(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2: clinical_alerts (Alertes Cliniques)
CREATE TABLE public.clinical_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('drug_alert', 'interaction', 'recall', 'shortage', 'regulatory')),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  affected_drugs TEXT[] DEFAULT '{}',
  affected_product_ids UUID[] DEFAULT '{}',
  source TEXT,
  date_issued TIMESTAMPTZ DEFAULT now(),
  expiry_date TIMESTAMPTZ,
  actions_required TEXT[] DEFAULT '{}',
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES public.personnel(id),
  acknowledged_at TIMESTAMPTZ,
  is_network_alert BOOLEAN DEFAULT false,
  target_pharmacies UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3: pharmacy_specialties (Spécialités Pharmaceutiques)
CREATE TABLE public.pharmacy_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'stethoscope',
  certifications TEXT[] DEFAULT '{}',
  protocols TEXT[] DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  staff_requirements TEXT[] DEFAULT '{}',
  patient_demographics TEXT,
  is_active BOOLEAN DEFAULT true,
  is_network_shared BOOLEAN DEFAULT false,
  shared_with_pharmacies UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 4: pharma_tool_configs (Configurations Outils)
CREATE TABLE public.pharma_tool_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id),
  tool_type TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  external_url TEXT,
  is_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes pour performances
CREATE INDEX idx_drug_interactions_tenant ON public.drug_interactions(tenant_id);
CREATE INDEX idx_drug_interactions_severity ON public.drug_interactions(severity);
CREATE INDEX idx_drug_interactions_shared ON public.drug_interactions(is_network_shared) WHERE is_network_shared = true;
CREATE INDEX idx_drug_interactions_drugs ON public.drug_interactions(drug1_id, drug2_id);

CREATE INDEX idx_clinical_alerts_tenant ON public.clinical_alerts(tenant_id);
CREATE INDEX idx_clinical_alerts_type ON public.clinical_alerts(alert_type);
CREATE INDEX idx_clinical_alerts_severity ON public.clinical_alerts(severity);
CREATE INDEX idx_clinical_alerts_network ON public.clinical_alerts(is_network_alert) WHERE is_network_alert = true;
CREATE INDEX idx_clinical_alerts_acknowledged ON public.clinical_alerts(is_acknowledged);
CREATE INDEX idx_clinical_alerts_date ON public.clinical_alerts(date_issued DESC);

CREATE INDEX idx_pharmacy_specialties_tenant ON public.pharmacy_specialties(tenant_id);
CREATE INDEX idx_pharmacy_specialties_active ON public.pharmacy_specialties(is_active) WHERE is_active = true;
CREATE INDEX idx_pharmacy_specialties_shared ON public.pharmacy_specialties(is_network_shared) WHERE is_network_shared = true;

CREATE INDEX idx_pharma_tool_configs_tenant ON public.pharma_tool_configs(tenant_id);
CREATE INDEX idx_pharma_tool_configs_type ON public.pharma_tool_configs(tool_type);

-- Enable RLS
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharma_tool_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - drug_interactions
CREATE POLICY "Users can view own and shared drug interactions"
ON public.drug_interactions FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id()
  OR is_network_shared = true
);

CREATE POLICY "Users can create drug interactions in their tenant"
ON public.drug_interactions FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update drug interactions in their tenant"
ON public.drug_interactions FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete drug interactions in their tenant"
ON public.drug_interactions FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies - clinical_alerts
CREATE POLICY "Users can view relevant clinical alerts"
ON public.clinical_alerts FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id()
  OR is_network_alert = true
  OR get_current_user_tenant_id() = ANY(target_pharmacies)
);

CREATE POLICY "Users can create clinical alerts in their tenant"
ON public.clinical_alerts FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update clinical alerts in their tenant"
ON public.clinical_alerts FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete clinical alerts in their tenant"
ON public.clinical_alerts FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies - pharmacy_specialties
CREATE POLICY "Users can view own and shared pharmacy specialties"
ON public.pharmacy_specialties FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id()
  OR is_network_shared = true
  OR get_current_user_tenant_id() = ANY(shared_with_pharmacies)
);

CREATE POLICY "Users can create pharmacy specialties in their tenant"
ON public.pharmacy_specialties FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update pharmacy specialties in their tenant"
ON public.pharmacy_specialties FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete pharmacy specialties in their tenant"
ON public.pharmacy_specialties FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies - pharma_tool_configs
CREATE POLICY "Users can manage pharma tool configs in their tenant"
ON public.pharma_tool_configs FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Fonction RPC 1: get_drug_database_with_details
CREATE OR REPLACE FUNCTION public.get_drug_database_with_details(
  p_tenant_id UUID,
  p_search TEXT DEFAULT '',
  p_category TEXT DEFAULT 'all',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_total INTEGER;
  v_drugs JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  -- Count total
  SELECT COUNT(*)
  INTO v_total
  FROM produits p
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND (
      p_search = '' 
      OR p.libelle_produit ILIKE '%' || p_search || '%'
      OR p.code_cip ILIKE '%' || p_search || '%'
      OR EXISTS (SELECT 1 FROM dci d WHERE d.id = p.dci_id AND d.libelle_dci ILIKE '%' || p_search || '%')
    )
    AND (
      p_category = 'all'
      OR (p_category = 'prescription' AND p.prescription_requise = true)
      OR (p_category = 'otc' AND COALESCE(p.prescription_requise, false) = false)
      OR (p_category = 'generic' AND p.est_generique = true)
    );
  
  -- Get paginated drugs with details
  SELECT json_agg(drug_data)
  INTO v_drugs
  FROM (
    SELECT 
      p.id,
      p.libelle_produit AS name,
      COALESCE(d.libelle_dci, 'N/A') AS dci,
      COALESCE(ct.libelle_classe, fp.libelle_famille, 'Non classé') AS therapeutic_class,
      COALESCE(fg.libelle_forme, p.forme_galenique, 'N/A') AS form,
      COALESCE(p.dosage, 'N/A') AS dosage,
      COALESCE(l.nom_laboratoire, 'N/A') AS manufacturer,
      COALESCE(p.code_atc, 'N/A') AS atc_code,
      COALESCE(p.code_cip, 'N/A') AS cip_code,
      COALESCE(p.prix_vente_ttc, 0) AS price,
      COALESCE(p.taux_remboursement, 0) AS reimbursement_rate,
      COALESCE(p.prescription_requise, false) AS prescription_required,
      COALESCE(d.contre_indications, ARRAY[]::TEXT[]) AS contraindications,
      ARRAY[]::TEXT[] AS interactions,
      ARRAY[]::TEXT[] AS side_effects,
      COALESCE(p.conditions_stockage, 'Conditions normales') AS storage_conditions,
      true AS expiry_monitoring,
      p.est_generique AS is_generic,
      COALESCE(pws.stock_actuel, 0) AS stock_quantity
    FROM produits p
    LEFT JOIN dci d ON d.id = p.dci_id
    LEFT JOIN classes_therapeutiques ct ON ct.id = d.classe_therapeutique_id
    LEFT JOIN famille_produit fp ON fp.id = p.famille_id
    LEFT JOIN formes_galeniques fg ON fg.id = p.forme_galenique_id
    LEFT JOIN laboratoires l ON l.id = p.laboratoire_id
    LEFT JOIN produits_with_stock pws ON pws.id = p.id
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND (
        p_search = '' 
        OR p.libelle_produit ILIKE '%' || p_search || '%'
        OR p.code_cip ILIKE '%' || p_search || '%'
        OR d.libelle_dci ILIKE '%' || p_search || '%'
      )
      AND (
        p_category = 'all'
        OR (p_category = 'prescription' AND p.prescription_requise = true)
        OR (p_category = 'otc' AND COALESCE(p.prescription_requise, false) = false)
        OR (p_category = 'generic' AND p.est_generique = true)
      )
    ORDER BY p.libelle_produit
    LIMIT p_page_size
    OFFSET v_offset
  ) drug_data;
  
  RETURN json_build_object(
    'drugs', COALESCE(v_drugs, '[]'::json),
    'total', v_total,
    'page', p_page,
    'pageSize', p_page_size,
    'totalPages', CEIL(v_total::FLOAT / p_page_size)
  );
END;
$$;

-- Fonction RPC 2: check_drug_interactions
CREATE OR REPLACE FUNCTION public.check_drug_interactions(
  p_tenant_id UUID,
  p_drug1_id UUID DEFAULT NULL,
  p_drug2_id UUID DEFAULT NULL,
  p_drug1_name TEXT DEFAULT NULL,
  p_drug2_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interactions JSON;
  v_drug1_dci_id UUID;
  v_drug2_dci_id UUID;
BEGIN
  -- Get DCI IDs for the drugs if product IDs provided
  IF p_drug1_id IS NOT NULL THEN
    SELECT dci_id INTO v_drug1_dci_id FROM produits WHERE id = p_drug1_id;
  END IF;
  
  IF p_drug2_id IS NOT NULL THEN
    SELECT dci_id INTO v_drug2_dci_id FROM produits WHERE id = p_drug2_id;
  END IF;
  
  -- Search for interactions
  SELECT json_agg(interaction_data)
  INTO v_interactions
  FROM (
    SELECT 
      di.id,
      di.drug1_name,
      di.drug2_name,
      di.severity,
      di.mechanism,
      di.clinical_effect,
      di.management,
      di.source_references,
      di.is_network_shared,
      p.nom_pharmacie AS shared_by_pharmacy
    FROM drug_interactions di
    LEFT JOIN pharmacies p ON p.id = di.shared_by_pharmacy_id
    WHERE (di.tenant_id = p_tenant_id OR di.is_network_shared = true)
      AND (
        -- Match by product IDs
        (di.drug1_id = p_drug1_id AND di.drug2_id = p_drug2_id)
        OR (di.drug1_id = p_drug2_id AND di.drug2_id = p_drug1_id)
        -- Match by DCI IDs
        OR (di.dci1_id = v_drug1_dci_id AND di.dci2_id = v_drug2_dci_id)
        OR (di.dci1_id = v_drug2_dci_id AND di.dci2_id = v_drug1_dci_id)
        -- Match by names
        OR (di.drug1_name ILIKE '%' || COALESCE(p_drug1_name, '') || '%' AND di.drug2_name ILIKE '%' || COALESCE(p_drug2_name, '') || '%')
        OR (di.drug1_name ILIKE '%' || COALESCE(p_drug2_name, '') || '%' AND di.drug2_name ILIKE '%' || COALESCE(p_drug1_name, '') || '%')
      )
    ORDER BY 
      CASE di.severity 
        WHEN 'contraindicated' THEN 1 
        WHEN 'major' THEN 2 
        WHEN 'moderate' THEN 3 
        WHEN 'minor' THEN 4 
      END
  ) interaction_data;
  
  RETURN json_build_object(
    'interactions', COALESCE(v_interactions, '[]'::json),
    'count', COALESCE(json_array_length(v_interactions), 0)
  );
END;
$$;

-- Fonction RPC 3: get_pharma_tools_metrics
CREATE OR REPLACE FUNCTION public.get_pharma_tools_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_drugs INTEGER;
  v_active_alerts INTEGER;
  v_critical_alerts INTEGER;
  v_interactions_count INTEGER;
  v_specialties_count INTEGER;
BEGIN
  -- Count total active drugs
  SELECT COUNT(*) INTO v_total_drugs
  FROM produits WHERE tenant_id = p_tenant_id AND is_active = true;
  
  -- Count active alerts (not expired, not acknowledged)
  SELECT COUNT(*) INTO v_active_alerts
  FROM clinical_alerts
  WHERE (tenant_id = p_tenant_id OR is_network_alert = true OR p_tenant_id = ANY(target_pharmacies))
    AND is_acknowledged = false
    AND (expiry_date IS NULL OR expiry_date > now());
  
  -- Count critical alerts
  SELECT COUNT(*) INTO v_critical_alerts
  FROM clinical_alerts
  WHERE (tenant_id = p_tenant_id OR is_network_alert = true OR p_tenant_id = ANY(target_pharmacies))
    AND is_acknowledged = false
    AND severity = 'critical'
    AND (expiry_date IS NULL OR expiry_date > now());
  
  -- Count interactions
  SELECT COUNT(*) INTO v_interactions_count
  FROM drug_interactions
  WHERE tenant_id = p_tenant_id OR is_network_shared = true;
  
  -- Count specialties
  SELECT COUNT(*) INTO v_specialties_count
  FROM pharmacy_specialties
  WHERE tenant_id = p_tenant_id AND is_active = true;
  
  RETURN json_build_object(
    'totalDrugs', v_total_drugs,
    'activeAlerts', v_active_alerts,
    'criticalAlerts', v_critical_alerts,
    'interactionsCount', v_interactions_count,
    'specialtiesCount', v_specialties_count
  );
END;
$$;