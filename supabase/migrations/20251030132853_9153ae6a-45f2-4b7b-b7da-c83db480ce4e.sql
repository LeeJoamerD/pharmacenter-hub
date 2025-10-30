-- ============================================
-- RESTAURATION COMPLÈTE - SECTION ANALYSES
-- Module: Stock - Analyses (ABCAnalysis + ComplianceReports)
-- ============================================

-- ============================================
-- PHASE 1: CATEGORIES TARIFICATION (P1)
-- ============================================

-- Créer la table categories_tarification
CREATE TABLE IF NOT EXISTS public.categories_tarification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  libelle TEXT NOT NULL,
  code_categorie TEXT,
  description TEXT,
  taux_marge_defaut NUMERIC(5,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories_tarification ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour categories_tarification
CREATE POLICY "Users can view categories from their tenant"
ON public.categories_tarification
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert categories in their tenant"
ON public.categories_tarification
FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update categories from their tenant"
ON public.categories_tarification
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete categories from their tenant"
ON public.categories_tarification
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Trigger updated_at
CREATE TRIGGER update_categories_tarification_updated_at
  BEFORE UPDATE ON public.categories_tarification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_tarification_tenant 
ON public.categories_tarification(tenant_id);

CREATE INDEX IF NOT EXISTS idx_categories_tarification_active 
ON public.categories_tarification(tenant_id, is_active);

-- Commentaires
COMMENT ON TABLE public.categories_tarification IS 
'Catégories de tarification pour la classification des produits dans l''analyse ABC';

-- ============================================
-- PHASE 2: COMPLIANCE SYSTEM (P0 - CRITIQUE)
-- ============================================

-- 2.1 - COMPLIANCE REQUIREMENTS (aucune dépendance)
-- ============================================

CREATE TABLE IF NOT EXISTS public.compliance_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  regulation_reference TEXT,
  priority_level TEXT NOT NULL DEFAULT 'moyenne' 
    CHECK (priority_level IN ('basse', 'moyenne', 'haute', 'critique')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view compliance requirements from their tenant"
ON public.compliance_requirements
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance requirements in their tenant"
ON public.compliance_requirements
FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update compliance requirements from their tenant"
ON public.compliance_requirements
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete compliance requirements from their tenant"
ON public.compliance_requirements
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_tenant_category 
ON public.compliance_requirements(tenant_id, category);

-- Trigger updated_at
CREATE TRIGGER update_compliance_requirements_updated_at
  BEFORE UPDATE ON public.compliance_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Données initiales: 7 exigences réglementaires par défaut
INSERT INTO public.compliance_requirements (tenant_id, category, title, description, regulation_reference, priority_level, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'documentation', 'Conservation des ordonnances', 'Obligation de conserver les ordonnances de stupéfiants pendant 3 ans', 'Art. R.5132-9 CSP', 'haute', true),
  ('00000000-0000-0000-0000-000000000000', 'tracabilite', 'Registre des stupéfiants', 'Tenue obligatoire du registre des entrées et sorties de stupéfiants', 'Art. R.5132-41 CSP', 'critique', true),
  ('00000000-0000-0000-0000-000000000000', 'stock', 'Contrôle des périmés', 'Vérification mensuelle des dates de péremption et retrait des produits périmés', 'Bonnes Pratiques de Pharmacie', 'haute', true),
  ('00000000-0000-0000-0000-000000000000', 'tracabilite', 'Traçabilité des médicaments', 'Système de traçabilité conforme à la directive européenne 2011/62/UE', 'Directive 2011/62/UE', 'critique', true),
  ('00000000-0000-0000-0000-000000000000', 'hygiene', 'Contrôle température', 'Surveillance quotidienne de la température des réfrigérateurs (+2°C à +8°C)', 'Bonnes Pratiques de Pharmacie', 'haute', true),
  ('00000000-0000-0000-0000-000000000000', 'documentation', 'Formation continue', 'Formation annuelle obligatoire du personnel pharmaceutique', 'Art. L.4236-1 CSP', 'moyenne', true),
  ('00000000-0000-0000-0000-000000000000', 'stock', 'Inventaire annuel', 'Réalisation de l''inventaire physique annuel complet', 'Art. L.5125-23 CSP', 'haute', true)
ON CONFLICT DO NOTHING;

-- Commentaires
COMMENT ON TABLE public.compliance_requirements IS 
'Exigences réglementaires pour la conformité pharmaceutique';

-- 2.2 - FONCTION UPDATE_COMPLIANCE_CONTROL_DATES
-- ============================================

CREATE OR REPLACE FUNCTION public.update_compliance_control_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculer la prochaine date de contrôle basée sur la fréquence
  IF NEW.last_control_date IS NOT NULL THEN
    IF NEW.control_frequency = 'daily' THEN
      NEW.next_control_date := NEW.last_control_date + INTERVAL '1 day';
    ELSIF NEW.control_frequency = 'weekly' THEN
      NEW.next_control_date := NEW.last_control_date + INTERVAL '1 week';
    ELSIF NEW.control_frequency = 'monthly' THEN
      NEW.next_control_date := NEW.last_control_date + INTERVAL '1 month';
    ELSIF NEW.control_frequency = 'quarterly' THEN
      NEW.next_control_date := NEW.last_control_date + INTERVAL '3 months';
    ELSIF NEW.control_frequency = 'yearly' THEN
      NEW.next_control_date := NEW.last_control_date + INTERVAL '1 year';
    END IF;
  END IF;
  
  -- Vérifier si le contrôle est expiré
  IF NEW.next_control_date IS NOT NULL AND NEW.next_control_date < CURRENT_DATE AND NEW.status != 'expire' THEN
    NEW.status := 'expire';
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_compliance_control_dates() IS 
'Calcule automatiquement les dates de contrôle et met à jour le statut si expiré';

-- 2.3 - COMPLIANCE CONTROLS (dépend de compliance_requirements et personnel)
-- ============================================

CREATE TABLE IF NOT EXISTS public.compliance_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  requirement_id UUID NOT NULL 
    REFERENCES public.compliance_requirements(id) ON DELETE CASCADE,
  responsible_person_id UUID 
    REFERENCES public.personnel(id) ON DELETE SET NULL,
  control_type TEXT NOT NULL DEFAULT 'manual',
  control_frequency TEXT NOT NULL DEFAULT 'monthly',
  last_control_date TIMESTAMP WITH TIME ZONE,
  next_control_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('conforme', 'non_conforme', 'en_cours', 'expire', 'pending')),
  compliance_score NUMERIC(5,2) DEFAULT 0.00 
    CHECK (compliance_score >= 0 AND compliance_score <= 100),
  control_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_controls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view compliance controls from their tenant"
ON public.compliance_controls
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance controls in their tenant"
ON public.compliance_controls
FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update compliance controls from their tenant"
ON public.compliance_controls
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete compliance controls from their tenant"
ON public.compliance_controls
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_controls_tenant_status 
ON public.compliance_controls(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_compliance_controls_next_control 
ON public.compliance_controls(tenant_id, next_control_date);

CREATE INDEX IF NOT EXISTS idx_compliance_controls_requirement 
ON public.compliance_controls(requirement_id);

-- Trigger pour calculer automatiquement les dates
DROP TRIGGER IF EXISTS trigger_update_compliance_control_dates ON public.compliance_controls;

CREATE TRIGGER trigger_update_compliance_control_dates
  BEFORE INSERT OR UPDATE ON public.compliance_controls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_compliance_control_dates();

-- Trigger updated_at
CREATE TRIGGER update_compliance_controls_updated_at
  BEFORE UPDATE ON public.compliance_controls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.compliance_controls IS 
'Contrôles de conformité réglementaire avec suivi des dates et scores';

-- 2.4 - COMPLIANCE ACTIONS (dépend de compliance_controls et personnel)
-- ============================================

CREATE TABLE IF NOT EXISTS public.compliance_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  control_id UUID NOT NULL 
    REFERENCES public.compliance_controls(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'corrective',
  action_description TEXT NOT NULL,
  assigned_to UUID 
    REFERENCES public.personnel(id) ON DELETE SET NULL,
  due_date DATE,
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' 
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view compliance actions from their tenant"
ON public.compliance_actions
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance actions in their tenant"
ON public.compliance_actions
FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update compliance actions from their tenant"
ON public.compliance_actions
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete compliance actions from their tenant"
ON public.compliance_actions
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_actions_tenant_status 
ON public.compliance_actions(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_compliance_actions_control 
ON public.compliance_actions(control_id);

CREATE INDEX IF NOT EXISTS idx_compliance_actions_assigned 
ON public.compliance_actions(assigned_to);

CREATE INDEX IF NOT EXISTS idx_compliance_actions_due_date 
ON public.compliance_actions(tenant_id, due_date);

-- Trigger updated_at
CREATE TRIGGER update_compliance_actions_updated_at
  BEFORE UPDATE ON public.compliance_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.compliance_actions IS 
'Actions correctives et préventives liées aux contrôles de conformité';

-- 2.5 - COMPLIANCE PRODUCT REQUIREMENTS (dépend de compliance_requirements, produits, famille_produit)
-- ============================================

CREATE TABLE IF NOT EXISTS public.compliance_product_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  requirement_id UUID NOT NULL 
    REFERENCES public.compliance_requirements(id) ON DELETE CASCADE,
  product_id UUID 
    REFERENCES public.produits(id) ON DELETE CASCADE,
  product_family_id UUID 
    REFERENCES public.famille_produit(id) ON DELETE CASCADE,
  specific_rules JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT compliance_product_requirements_product_check CHECK (
    (product_id IS NOT NULL AND product_family_id IS NULL) OR 
    (product_id IS NULL AND product_family_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.compliance_product_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view compliance product requirements from their tenant"
ON public.compliance_product_requirements
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance product requirements in their tenant"
ON public.compliance_product_requirements
FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update compliance product requirements from their tenant"
ON public.compliance_product_requirements
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete compliance product requirements from their tenant"
ON public.compliance_product_requirements
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_product_requirements_tenant 
ON public.compliance_product_requirements(tenant_id);

CREATE INDEX IF NOT EXISTS idx_compliance_product_requirements_requirement 
ON public.compliance_product_requirements(requirement_id);

CREATE INDEX IF NOT EXISTS idx_compliance_product_requirements_product 
ON public.compliance_product_requirements(product_id);

CREATE INDEX IF NOT EXISTS idx_compliance_product_requirements_family 
ON public.compliance_product_requirements(product_family_id);

-- Trigger updated_at
CREATE TRIGGER update_compliance_product_requirements_updated_at
  BEFORE UPDATE ON public.compliance_product_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.compliance_product_requirements IS 
'Association entre exigences réglementaires et produits/familles de produits';

-- 2.6 - FONCTION CALCULATE_COMPLIANCE_METRICS
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_compliance_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metrics JSONB;
  total_count INTEGER;
  compliant_count INTEGER;
  non_compliant_count INTEGER;
  in_progress_count INTEGER;
  expired_count INTEGER;
  global_score NUMERIC(5,2);
BEGIN
  -- Compter les contrôles par statut
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'conforme'),
    COUNT(*) FILTER (WHERE status = 'non_conforme'),
    COUNT(*) FILTER (WHERE status = 'en_cours'),
    COUNT(*) FILTER (WHERE status = 'expire')
  INTO total_count, compliant_count, non_compliant_count, in_progress_count, expired_count
  FROM public.compliance_controls 
  WHERE tenant_id = p_tenant_id;
  
  -- Calculer le score global
  SELECT COALESCE(AVG(compliance_score), 0)
  INTO global_score
  FROM public.compliance_controls 
  WHERE tenant_id = p_tenant_id AND compliance_score IS NOT NULL;
  
  -- Construire le JSON des métriques
  metrics := jsonb_build_object(
    'total', total_count,
    'conformite', compliant_count,
    'nonConformite', non_compliant_count,
    'enCours', in_progress_count,
    'expire', expired_count,
    'scoreGlobal', global_score
  );
  
  RETURN metrics;
END;
$$;

COMMENT ON FUNCTION public.calculate_compliance_metrics(UUID) IS 
'Calcule les métriques de conformité pour un tenant donné';

-- 2.7 - COMPLIANCE METRICS HISTORY (dépend logiquement de compliance_controls)
-- ============================================

CREATE TABLE IF NOT EXISTS public.compliance_metrics_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_requirements INTEGER NOT NULL DEFAULT 0,
  compliant_count INTEGER NOT NULL DEFAULT 0,
  non_compliant_count INTEGER NOT NULL DEFAULT 0,
  in_progress_count INTEGER NOT NULL DEFAULT 0,
  expired_count INTEGER NOT NULL DEFAULT 0,
  global_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  category_scores JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_metrics_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view compliance metrics from their tenant"
ON public.compliance_metrics_history
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance metrics in their tenant"
ON public.compliance_metrics_history
FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_metrics_tenant_date 
ON public.compliance_metrics_history(tenant_id, metric_date DESC);

-- Commentaires
COMMENT ON TABLE public.compliance_metrics_history IS 
'Historique des métriques de conformité pour analyse des tendances';

-- ============================================
-- VÉRIFICATIONS FINALES
-- ============================================

-- Vérifier que toutes les tables ont été créées
DO $$
DECLARE
  tables_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'categories_tarification',
    'compliance_requirements',
    'compliance_controls',
    'compliance_actions',
    'compliance_product_requirements',
    'compliance_metrics_history'
  );
  
  IF tables_count = 6 THEN
    RAISE NOTICE '✅ Toutes les 6 tables ont été créées avec succès';
  ELSE
    RAISE WARNING '⚠️ Seulement % tables sur 6 ont été créées', tables_count;
  END IF;
END $$;