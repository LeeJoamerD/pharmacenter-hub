-- ============================================
-- MIGRATION: Restauration complète du module Lots
-- Tables: alertes_peremption, parametres_expiration, configurations_fifo,
--         lot_optimization_rules, lot_optimization_suggestions, lot_optimization_metrics
-- Fonction RPC: generer_alertes_expiration_automatiques
-- ============================================

-- ============================================
-- SECTION 1: Tables pour la gestion des expirations
-- ============================================

-- Table parametres_expiration
CREATE TABLE IF NOT EXISTS public.parametres_expiration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  famille_produit_id UUID REFERENCES public.famille_produit(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES public.produits(id) ON DELETE CASCADE,
  jours_alerte INTEGER NOT NULL DEFAULT 60,
  jours_critique INTEGER NOT NULL DEFAULT 30,
  jours_blocage INTEGER NOT NULL DEFAULT 7,
  action_automatique TEXT DEFAULT 'notification',
  priorite INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_single_reference CHECK (
    (famille_produit_id IS NOT NULL AND produit_id IS NULL) OR
    (famille_produit_id IS NULL AND produit_id IS NOT NULL)
  )
);

-- Table alertes_peremption
CREATE TABLE IF NOT EXISTS public.alertes_peremption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  type_alerte TEXT NOT NULL CHECK (type_alerte IN ('proche', 'critique', 'perime')),
  niveau_urgence TEXT NOT NULL CHECK (niveau_urgence IN ('bas', 'moyen', 'eleve', 'critique')),
  jours_restants INTEGER,
  quantite_concernee NUMERIC NOT NULL,
  date_expiration DATE NOT NULL,
  statut TEXT DEFAULT 'active' CHECK (statut IN ('active', 'traitee', 'ignoree')),
  action_recommandee TEXT,
  notes TEXT,
  traitee_par UUID REFERENCES public.personnel(id),
  date_traitement TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table configurations_fifo
CREATE TABLE IF NOT EXISTS public.configurations_fifo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  famille_produit_id UUID REFERENCES public.famille_produit(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES public.produits(id) ON DELETE CASCADE,
  priorite_fifo INTEGER DEFAULT 1,
  delai_alerte_jours INTEGER DEFAULT 30,
  action_automatique TEXT DEFAULT 'notification',
  tolerance_ecart_prix NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_single_reference_fifo CHECK (
    (famille_produit_id IS NOT NULL AND produit_id IS NULL) OR
    (famille_produit_id IS NULL AND produit_id IS NOT NULL)
  )
);

-- ============================================
-- SECTION 2: Tables pour l'optimisation des lots
-- ============================================

-- Table lot_optimization_rules
CREATE TABLE IF NOT EXISTS public.lot_optimization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  rule_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, rule_id)
);

-- Table lot_optimization_suggestions
CREATE TABLE IF NOT EXISTS public.lot_optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  current_value NUMERIC,
  suggested_value NUMERIC,
  expected_benefit TEXT,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table lot_optimization_metrics
CREATE TABLE IF NOT EXISTS public.lot_optimization_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  metric_date DATE DEFAULT CURRENT_DATE,
  total_suggestions_generated INTEGER DEFAULT 0,
  suggestions_applied INTEGER DEFAULT 0,
  suggestions_ignored INTEGER DEFAULT 0,
  expirations_avoided INTEGER DEFAULT 0,
  expirations_avoided_value NUMERIC DEFAULT 0,
  stock_reorders_suggested INTEGER DEFAULT 0,
  fifo_corrections INTEGER DEFAULT 0,
  total_savings NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, metric_date)
);

-- ============================================
-- SECTION 3: Fonction RPC pour alertes automatiques
-- ============================================

CREATE OR REPLACE FUNCTION public.generer_alertes_expiration_automatiques()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tenant_id UUID;
  v_alertes_creees INTEGER := 0;
  v_lots_traites INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Récupérer le tenant_id de l'utilisateur connecté
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tenant ID not found'
    );
  END IF;

  -- Générer les alertes pour les lots avec dates d'expiration
  INSERT INTO public.alertes_peremption (
    tenant_id,
    lot_id,
    produit_id,
    type_alerte,
    niveau_urgence,
    jours_restants,
    quantite_concernee,
    date_expiration,
    statut,
    action_recommandee
  )
  SELECT 
    l.tenant_id,
    l.id,
    l.produit_id,
    CASE 
      WHEN (l.date_expiration - CURRENT_DATE) <= 7 THEN 'critique'
      WHEN (l.date_expiration - CURRENT_DATE) <= 30 THEN 'proche'
      WHEN l.date_expiration < CURRENT_DATE THEN 'perime'
      ELSE 'proche'
    END,
    CASE 
      WHEN l.date_expiration < CURRENT_DATE THEN 'critique'
      WHEN (l.date_expiration - CURRENT_DATE) <= 7 THEN 'eleve'
      WHEN (l.date_expiration - CURRENT_DATE) <= 30 THEN 'moyen'
      ELSE 'bas'
    END,
    (l.date_expiration - CURRENT_DATE),
    l.quantite_restante,
    l.date_expiration,
    'active',
    CASE 
      WHEN l.date_expiration < CURRENT_DATE THEN 'Retirer du stock immédiatement'
      WHEN (l.date_expiration - CURRENT_DATE) <= 7 THEN 'Promouvoir en priorité'
      WHEN (l.date_expiration - CURRENT_DATE) <= 30 THEN 'Surveiller et promouvoir si nécessaire'
      ELSE 'Surveiller'
    END
  FROM public.lots l
  WHERE l.tenant_id = v_tenant_id
    AND l.date_expiration IS NOT NULL
    AND l.quantite_restante > 0
    AND (l.date_expiration - CURRENT_DATE) <= 60
    AND NOT EXISTS (
      SELECT 1 FROM public.alertes_peremption ap
      WHERE ap.lot_id = l.id
        AND ap.statut = 'active'
        AND ap.date_expiration = l.date_expiration
    );

  GET DIAGNOSTICS v_alertes_creees = ROW_COUNT;

  -- Compter les lots traités
  SELECT COUNT(*) INTO v_lots_traites
  FROM public.lots l
  WHERE l.tenant_id = v_tenant_id
    AND l.date_expiration IS NOT NULL
    AND l.quantite_restante > 0
    AND (l.date_expiration - CURRENT_DATE) <= 60;

  v_result := jsonb_build_object(
    'success', true,
    'alertes_creees', v_alertes_creees,
    'lots_traites', v_lots_traites,
    'tenant_id', v_tenant_id
  );

  RETURN v_result;
END;
$$;

-- ============================================
-- SECTION 4: Triggers pour updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour parametres_expiration
DROP TRIGGER IF EXISTS update_parametres_expiration_updated_at ON public.parametres_expiration;
CREATE TRIGGER update_parametres_expiration_updated_at
  BEFORE UPDATE ON public.parametres_expiration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers pour alertes_peremption
DROP TRIGGER IF EXISTS update_alertes_peremption_updated_at ON public.alertes_peremption;
CREATE TRIGGER update_alertes_peremption_updated_at
  BEFORE UPDATE ON public.alertes_peremption
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers pour configurations_fifo
DROP TRIGGER IF EXISTS update_configurations_fifo_updated_at ON public.configurations_fifo;
CREATE TRIGGER update_configurations_fifo_updated_at
  BEFORE UPDATE ON public.configurations_fifo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers pour lot_optimization_rules
DROP TRIGGER IF EXISTS update_lot_optimization_rules_updated_at ON public.lot_optimization_rules;
CREATE TRIGGER update_lot_optimization_rules_updated_at
  BEFORE UPDATE ON public.lot_optimization_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SECTION 5: RLS Policies
-- ============================================

-- RLS pour parametres_expiration
ALTER TABLE public.parametres_expiration ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view expiration parameters from their tenant" ON public.parametres_expiration;
CREATE POLICY "Users can view expiration parameters from their tenant"
  ON public.parametres_expiration FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage expiration parameters in their tenant" ON public.parametres_expiration;
CREATE POLICY "Users can manage expiration parameters in their tenant"
  ON public.parametres_expiration FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- RLS pour alertes_peremption
ALTER TABLE public.alertes_peremption ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view alerts from their tenant" ON public.alertes_peremption;
CREATE POLICY "Users can view alerts from their tenant"
  ON public.alertes_peremption FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage alerts in their tenant" ON public.alertes_peremption;
CREATE POLICY "Users can manage alerts in their tenant"
  ON public.alertes_peremption FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- RLS pour configurations_fifo
ALTER TABLE public.configurations_fifo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view FIFO rules from their tenant" ON public.configurations_fifo;
CREATE POLICY "Users can view FIFO rules from their tenant"
  ON public.configurations_fifo FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage FIFO rules in their tenant" ON public.configurations_fifo;
CREATE POLICY "Users can manage FIFO rules in their tenant"
  ON public.configurations_fifo FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- RLS pour lot_optimization_rules
ALTER TABLE public.lot_optimization_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view rules from their tenant" ON public.lot_optimization_rules;
CREATE POLICY "Users can view rules from their tenant"
  ON public.lot_optimization_rules FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage rules in their tenant" ON public.lot_optimization_rules;
CREATE POLICY "Users can manage rules in their tenant"
  ON public.lot_optimization_rules FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- RLS pour lot_optimization_suggestions
ALTER TABLE public.lot_optimization_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view suggestions from their tenant" ON public.lot_optimization_suggestions;
CREATE POLICY "Users can view suggestions from their tenant"
  ON public.lot_optimization_suggestions FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage suggestions in their tenant" ON public.lot_optimization_suggestions;
CREATE POLICY "Users can manage suggestions in their tenant"
  ON public.lot_optimization_suggestions FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- RLS pour lot_optimization_metrics
ALTER TABLE public.lot_optimization_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view metrics from their tenant" ON public.lot_optimization_metrics;
CREATE POLICY "Users can view metrics from their tenant"
  ON public.lot_optimization_metrics FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage metrics in their tenant" ON public.lot_optimization_metrics;
CREATE POLICY "Users can manage metrics in their tenant"
  ON public.lot_optimization_metrics FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================
-- SECTION 6: Indexes pour performance
-- ============================================

-- Indexes pour parametres_expiration
CREATE INDEX IF NOT EXISTS idx_parametres_expiration_tenant 
  ON public.parametres_expiration(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parametres_expiration_famille 
  ON public.parametres_expiration(tenant_id, famille_produit_id);
CREATE INDEX IF NOT EXISTS idx_parametres_expiration_produit 
  ON public.parametres_expiration(tenant_id, produit_id);

-- Indexes pour alertes_peremption
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_tenant_statut 
  ON public.alertes_peremption(tenant_id, statut);
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_lot 
  ON public.alertes_peremption(lot_id);
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_produit 
  ON public.alertes_peremption(produit_id);
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_date_expiration 
  ON public.alertes_peremption(date_expiration);

-- Indexes pour configurations_fifo
CREATE INDEX IF NOT EXISTS idx_configurations_fifo_tenant 
  ON public.configurations_fifo(tenant_id);
CREATE INDEX IF NOT EXISTS idx_configurations_fifo_famille 
  ON public.configurations_fifo(tenant_id, famille_produit_id);
CREATE INDEX IF NOT EXISTS idx_configurations_fifo_produit 
  ON public.configurations_fifo(tenant_id, produit_id);

-- Indexes pour lot_optimization_rules
CREATE INDEX IF NOT EXISTS idx_lot_optimization_rules_tenant 
  ON public.lot_optimization_rules(tenant_id, is_active);

-- Indexes pour lot_optimization_suggestions
CREATE INDEX IF NOT EXISTS idx_lot_optimization_suggestions_tenant_status 
  ON public.lot_optimization_suggestions(tenant_id, status, created_at);

-- Indexes pour lot_optimization_metrics
CREATE INDEX IF NOT EXISTS idx_lot_optimization_metrics_tenant_date 
  ON public.lot_optimization_metrics(tenant_id, metric_date);