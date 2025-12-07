-- Tables pour le module Expert Pharma

-- Table des recommandations thérapeutiques
CREATE TABLE IF NOT EXISTS public.ai_therapeutic_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  condition_name TEXT NOT NULL,
  condition_category TEXT,
  first_line_treatments JSONB DEFAULT '[]'::jsonb,
  alternative_treatments JSONB DEFAULT '[]'::jsonb,
  contraindications TEXT,
  duration TEXT,
  monitoring TEXT,
  evidence_level TEXT,
  source_guidelines TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.personnel(id)
);

-- Table des contrôles de conformité
CREATE TABLE IF NOT EXISTS public.ai_pharma_compliance_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items_count INTEGER DEFAULT 0,
  issues_count INTEGER DEFAULT 0,
  last_check_at TIMESTAMPTZ,
  last_check_by UUID REFERENCES public.personnel(id),
  next_audit_date DATE,
  audit_notes TEXT,
  issues_details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des consultations IA pharmaceutiques
CREATE TABLE IF NOT EXISTS public.ai_pharma_consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  ai_response TEXT,
  consultation_type TEXT,
  related_drugs UUID[],
  confidence NUMERIC(5,2),
  is_useful BOOLEAN,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.personnel(id)
);

-- Table de configuration du module Expert Pharma
CREATE TABLE IF NOT EXISTS public.ai_pharma_expert_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  auto_interaction_check BOOLEAN DEFAULT true,
  interaction_alert_level TEXT DEFAULT 'moderate',
  enable_ai_consultation BOOLEAN DEFAULT true,
  enable_compliance_alerts BOOLEAN DEFAULT true,
  compliance_check_frequency TEXT DEFAULT 'weekly',
  pharmacovigilance_sources TEXT[] DEFAULT '{"ANSM","EMA","FDA"}',
  therapeutic_guidelines_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Activer RLS
ALTER TABLE public.ai_therapeutic_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_pharma_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_pharma_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_pharma_expert_config ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ai_therapeutic_recommendations
CREATE POLICY "Users can view therapeutic recommendations from their tenant" 
ON public.ai_therapeutic_recommendations FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert therapeutic recommendations in their tenant" 
ON public.ai_therapeutic_recommendations FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update therapeutic recommendations from their tenant" 
ON public.ai_therapeutic_recommendations FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete therapeutic recommendations from their tenant" 
ON public.ai_therapeutic_recommendations FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour ai_pharma_compliance_checks
CREATE POLICY "Users can view compliance checks from their tenant" 
ON public.ai_pharma_compliance_checks FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance checks in their tenant" 
ON public.ai_pharma_compliance_checks FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update compliance checks from their tenant" 
ON public.ai_pharma_compliance_checks FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete compliance checks from their tenant" 
ON public.ai_pharma_compliance_checks FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour ai_pharma_consultations
CREATE POLICY "Users can view consultations from their tenant" 
ON public.ai_pharma_consultations FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert consultations in their tenant" 
ON public.ai_pharma_consultations FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update consultations from their tenant" 
ON public.ai_pharma_consultations FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete consultations from their tenant" 
ON public.ai_pharma_consultations FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour ai_pharma_expert_config
CREATE POLICY "Users can view config from their tenant" 
ON public.ai_pharma_expert_config FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert config in their tenant" 
ON public.ai_pharma_expert_config FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update config from their tenant" 
ON public.ai_pharma_expert_config FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

-- Indexes pour performance
CREATE INDEX idx_ai_therapeutic_recommendations_tenant ON public.ai_therapeutic_recommendations(tenant_id);
CREATE INDEX idx_ai_therapeutic_recommendations_category ON public.ai_therapeutic_recommendations(condition_category);
CREATE INDEX idx_ai_pharma_compliance_checks_tenant ON public.ai_pharma_compliance_checks(tenant_id);
CREATE INDEX idx_ai_pharma_compliance_checks_status ON public.ai_pharma_compliance_checks(status);
CREATE INDEX idx_ai_pharma_consultations_tenant ON public.ai_pharma_consultations(tenant_id);
CREATE INDEX idx_ai_pharma_consultations_type ON public.ai_pharma_consultations(consultation_type);

-- Triggers pour updated_at
CREATE TRIGGER update_ai_therapeutic_recommendations_updated_at
  BEFORE UPDATE ON public.ai_therapeutic_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_pharma_compliance_checks_updated_at
  BEFORE UPDATE ON public.ai_pharma_compliance_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_pharma_expert_config_updated_at
  BEFORE UPDATE ON public.ai_pharma_expert_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction RPC pour obtenir les métriques Expert Pharma
CREATE OR REPLACE FUNCTION public.get_pharma_expert_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_drugs_count INTEGER;
  v_interactions_count INTEGER;
  v_active_alerts INTEGER;
  v_recommendations_count INTEGER;
  v_compliance_score NUMERIC;
  v_consultations_today INTEGER;
  v_result JSONB;
BEGIN
  -- Compter les médicaments
  SELECT COUNT(*) INTO v_drugs_count
  FROM public.produits
  WHERE tenant_id = p_tenant_id AND is_active = true;
  
  -- Compter les interactions connues
  SELECT COUNT(*) INTO v_interactions_count
  FROM public.drug_interactions
  WHERE tenant_id = p_tenant_id OR is_network_shared = true;
  
  -- Compter les alertes actives
  SELECT COUNT(*) INTO v_active_alerts
  FROM public.clinical_alerts
  WHERE tenant_id = p_tenant_id 
    AND is_acknowledged = false
    AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE);
  
  -- Compter les recommandations thérapeutiques
  SELECT COUNT(*) INTO v_recommendations_count
  FROM public.ai_therapeutic_recommendations
  WHERE tenant_id = p_tenant_id AND is_active = true;
  
  -- Calculer le score de conformité
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 100
      ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'compliant') / COUNT(*), 1)
    END INTO v_compliance_score
  FROM public.ai_pharma_compliance_checks
  WHERE tenant_id = p_tenant_id;
  
  -- Consultations IA aujourd'hui
  SELECT COUNT(*) INTO v_consultations_today
  FROM public.ai_pharma_consultations
  WHERE tenant_id = p_tenant_id 
    AND created_at >= CURRENT_DATE;
  
  v_result := jsonb_build_object(
    'drugsCount', COALESCE(v_drugs_count, 0),
    'interactionsCount', COALESCE(v_interactions_count, 0),
    'activeAlerts', COALESCE(v_active_alerts, 0),
    'recommendationsCount', COALESCE(v_recommendations_count, 0),
    'complianceScore', COALESCE(v_compliance_score, 100),
    'consultationsToday', COALESCE(v_consultations_today, 0)
  );
  
  RETURN v_result;
END;
$$;

-- Fonction RPC pour exécuter un contrôle de conformité
CREATE OR REPLACE FUNCTION public.run_pharma_compliance_check(
  p_tenant_id UUID,
  p_category TEXT,
  p_checked_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items_count INTEGER;
  v_issues_count INTEGER;
  v_issues JSONB := '[]'::jsonb;
  v_status TEXT;
  v_check_id UUID;
  v_result JSONB;
BEGIN
  -- Compter les produits de la catégorie
  SELECT COUNT(*) INTO v_items_count
  FROM public.produits p
  LEFT JOIN public.lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND (
      (p_category = 'Stupéfiants' AND p.prescription_requise = true)
      OR (p_category = 'Liste I' AND p.prescription_requise = true)
      OR (p_category = 'Liste II' AND p.prescription_requise = true)
      OR (p_category = 'Produits Froid' AND p.conditions_conservation ILIKE '%froid%')
      OR (p_category = 'Tous')
    );
  
  -- Détecter les problèmes (lots périmés ou stock négatif)
  SELECT 
    COUNT(*),
    COALESCE(jsonb_agg(jsonb_build_object(
      'product', p.libelle_produit,
      'issue', CASE 
        WHEN l.date_peremption < CURRENT_DATE THEN 'Lot périmé'
        WHEN l.quantite_restante < 0 THEN 'Stock négatif'
        ELSE 'Autre'
      END,
      'severity', 'warning'
    )), '[]'::jsonb)
  INTO v_issues_count, v_issues
  FROM public.produits p
  INNER JOIN public.lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND (l.date_peremption < CURRENT_DATE OR l.quantite_restante < 0);
  
  -- Déterminer le statut
  v_status := CASE 
    WHEN v_issues_count = 0 THEN 'compliant'
    WHEN v_issues_count <= 2 THEN 'warning'
    ELSE 'critical'
  END;
  
  -- Insérer ou mettre à jour le contrôle
  INSERT INTO public.ai_pharma_compliance_checks (
    tenant_id, category, status, items_count, issues_count,
    last_check_at, last_check_by, issues_details,
    next_audit_date
  ) VALUES (
    p_tenant_id, p_category, v_status, v_items_count, v_issues_count,
    now(), p_checked_by, v_issues,
    CURRENT_DATE + INTERVAL '7 days'
  )
  ON CONFLICT (tenant_id, category) 
  DO UPDATE SET
    status = EXCLUDED.status,
    items_count = EXCLUDED.items_count,
    issues_count = EXCLUDED.issues_count,
    last_check_at = EXCLUDED.last_check_at,
    last_check_by = EXCLUDED.last_check_by,
    issues_details = EXCLUDED.issues_details,
    next_audit_date = EXCLUDED.next_audit_date,
    updated_at = now()
  RETURNING id INTO v_check_id;
  
  v_result := jsonb_build_object(
    'checkId', v_check_id,
    'category', p_category,
    'status', v_status,
    'itemsCount', v_items_count,
    'issuesCount', v_issues_count,
    'issues', v_issues
  );
  
  RETURN v_result;
END;
$$;

-- Contrainte unique pour compliance checks par catégorie
ALTER TABLE public.ai_pharma_compliance_checks 
ADD CONSTRAINT unique_compliance_check_category UNIQUE (tenant_id, category);