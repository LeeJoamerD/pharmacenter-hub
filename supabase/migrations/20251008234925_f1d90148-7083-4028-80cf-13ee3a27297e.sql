-- Table pour stocker les règles d'optimisation configurées
CREATE TABLE IF NOT EXISTS public.lot_optimization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
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

-- Table pour l'historique des suggestions générées
CREATE TABLE IF NOT EXISTS public.lot_optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
  product_id UUID REFERENCES produits(id) ON DELETE SET NULL,
  current_value NUMERIC,
  suggested_value NUMERIC,
  expected_benefit TEXT,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES personnel(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les métriques de performance
CREATE TABLE IF NOT EXISTS public.lot_optimization_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
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

-- RLS policies pour lot_optimization_rules
ALTER TABLE public.lot_optimization_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rules from their tenant"
  ON public.lot_optimization_rules FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage rules in their tenant"
  ON public.lot_optimization_rules FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- RLS policies pour lot_optimization_suggestions
ALTER TABLE public.lot_optimization_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions from their tenant"
  ON public.lot_optimization_suggestions FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage suggestions in their tenant"
  ON public.lot_optimization_suggestions FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- RLS policies pour lot_optimization_metrics
ALTER TABLE public.lot_optimization_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics from their tenant"
  ON public.lot_optimization_metrics FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage metrics in their tenant"
  ON public.lot_optimization_metrics FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_lot_optimization_rules_tenant 
  ON public.lot_optimization_rules(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_lot_optimization_suggestions_tenant_status 
  ON public.lot_optimization_suggestions(tenant_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_lot_optimization_metrics_tenant_date 
  ON public.lot_optimization_metrics(tenant_id, metric_date);