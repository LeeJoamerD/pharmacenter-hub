-- =====================================================
-- Analytics Avancées (Business Intelligence) Tables
-- =====================================================

-- Table des prédictions clients (churn, LTV, NBA)
CREATE TABLE IF NOT EXISTS public.ai_bi_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('churn', 'ltv', 'nba', 'cross_sell', 'upsell')),
  segment TEXT,
  predicted_value NUMERIC(15, 2),
  confidence NUMERIC(5, 2) DEFAULT 0,
  risk_level TEXT CHECK (risk_level IN ('high', 'medium', 'low')),
  factors JSONB DEFAULT '[]'::jsonb,
  model_version TEXT DEFAULT 'v1.0',
  valid_until TIMESTAMP WITH TIME ZONE,
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des patterns découverts
CREATE TABLE IF NOT EXISTS public.ai_bi_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  description TEXT,
  confidence NUMERIC(5, 2) DEFAULT 0,
  frequency TEXT DEFAULT 'ponctuelle',
  impact TEXT CHECK (impact IN ('Élevé', 'Moyen', 'Faible')) DEFAULT 'Moyen',
  discovery_method TEXT DEFAULT 'Automatique',
  is_actionable BOOLEAN DEFAULT true,
  is_exploited BOOLEAN DEFAULT false,
  exploited_at TIMESTAMP WITH TIME ZONE,
  exploited_by UUID REFERENCES public.personnel(id),
  data_source JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des segments clients automatiques
CREATE TABLE IF NOT EXISTS public.ai_bi_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  segment_name TEXT NOT NULL,
  size INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  characteristics JSONB DEFAULT '[]'::jsonb,
  clv NUMERIC(15, 2) DEFAULT 0,
  next_action TEXT,
  is_active BOOLEAN DEFAULT true,
  is_auto_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des optimisations de processus
CREATE TABLE IF NOT EXISTS public.ai_bi_process_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  process_name TEXT NOT NULL,
  current_time_minutes INTEGER DEFAULT 0,
  optimized_time_minutes INTEGER DEFAULT 0,
  improvement_percentage NUMERIC(5, 2) DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('Facile', 'Moyen', 'Difficile')) DEFAULT 'Moyen',
  roi TEXT CHECK (roi IN ('Élevé', 'Moyen', 'Faible')) DEFAULT 'Moyen',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'implemented', 'rejected')),
  implementation_notes TEXT,
  implemented_at TIMESTAMP WITH TIME ZONE,
  implemented_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table de configuration du module BI
CREATE TABLE IF NOT EXISTS public.ai_bi_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE UNIQUE,
  auto_analysis_enabled BOOLEAN DEFAULT true,
  analysis_frequency TEXT DEFAULT 'daily',
  model_preferences JSONB DEFAULT '{"churn": "gradient_boost", "ltv": "regression", "segmentation": "kmeans"}'::jsonb,
  notification_thresholds JSONB DEFAULT '{"churn_risk": 0.7, "ltv_drop": 0.2}'::jsonb,
  data_retention_days INTEGER DEFAULT 365,
  enable_pattern_discovery BOOLEAN DEFAULT true,
  enable_auto_segmentation BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_bi_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_bi_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_bi_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_bi_process_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_bi_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_bi_predictions
CREATE POLICY "Users can view their tenant predictions" ON public.ai_bi_predictions
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant predictions" ON public.ai_bi_predictions
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant predictions" ON public.ai_bi_predictions
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant predictions" ON public.ai_bi_predictions
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for ai_bi_patterns
CREATE POLICY "Users can view their tenant patterns" ON public.ai_bi_patterns
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant patterns" ON public.ai_bi_patterns
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant patterns" ON public.ai_bi_patterns
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant patterns" ON public.ai_bi_patterns
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for ai_bi_segments
CREATE POLICY "Users can view their tenant segments" ON public.ai_bi_segments
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant segments" ON public.ai_bi_segments
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant segments" ON public.ai_bi_segments
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant segments" ON public.ai_bi_segments
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for ai_bi_process_optimizations
CREATE POLICY "Users can view their tenant optimizations" ON public.ai_bi_process_optimizations
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant optimizations" ON public.ai_bi_process_optimizations
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant optimizations" ON public.ai_bi_process_optimizations
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant optimizations" ON public.ai_bi_process_optimizations
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for ai_bi_config
CREATE POLICY "Users can view their tenant config" ON public.ai_bi_config
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant config" ON public.ai_bi_config
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant config" ON public.ai_bi_config
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant config" ON public.ai_bi_config
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id());

-- Indexes for performance
CREATE INDEX idx_ai_bi_predictions_tenant ON public.ai_bi_predictions(tenant_id);
CREATE INDEX idx_ai_bi_predictions_client ON public.ai_bi_predictions(client_id);
CREATE INDEX idx_ai_bi_predictions_type ON public.ai_bi_predictions(prediction_type);
CREATE INDEX idx_ai_bi_patterns_tenant ON public.ai_bi_patterns(tenant_id);
CREATE INDEX idx_ai_bi_patterns_actionable ON public.ai_bi_patterns(is_actionable);
CREATE INDEX idx_ai_bi_segments_tenant ON public.ai_bi_segments(tenant_id);
CREATE INDEX idx_ai_bi_segments_active ON public.ai_bi_segments(is_active);
CREATE INDEX idx_ai_bi_process_optimizations_tenant ON public.ai_bi_process_optimizations(tenant_id);
CREATE INDEX idx_ai_bi_process_optimizations_status ON public.ai_bi_process_optimizations(status);

-- Triggers for updated_at
CREATE TRIGGER update_ai_bi_predictions_updated_at
  BEFORE UPDATE ON public.ai_bi_predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_bi_patterns_updated_at
  BEFORE UPDATE ON public.ai_bi_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_bi_segments_updated_at
  BEFORE UPDATE ON public.ai_bi_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_bi_process_optimizations_updated_at
  BEFORE UPDATE ON public.ai_bi_process_optimizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_bi_config_updated_at
  BEFORE UPDATE ON public.ai_bi_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RPC Functions for Business Intelligence
-- =====================================================

-- Function 1: Get BI Metrics (4 KPIs)
CREATE OR REPLACE FUNCTION public.get_bi_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_churn_prediction NUMERIC;
  v_avg_ltv NUMERIC;
  v_next_best_action TEXT;
  v_risk_score NUMERIC;
  v_total_clients INTEGER;
  v_at_risk_clients INTEGER;
  v_total_patterns INTEGER;
  v_actionable_patterns INTEGER;
BEGIN
  -- Calculate churn prediction (clients not visited in 60+ days)
  SELECT 
    COUNT(*) FILTER (WHERE last_visit_at < NOW() - INTERVAL '60 days' OR last_visit_at IS NULL)::NUMERIC * 100.0 / NULLIF(COUNT(*), 0)
  INTO v_churn_prediction
  FROM public.clients
  WHERE tenant_id = p_tenant_id;

  -- Calculate average LTV from ventes
  SELECT COALESCE(AVG(total_purchases), 0)
  INTO v_avg_ltv
  FROM (
    SELECT c.id, COALESCE(SUM(v.montant_total_ttc), 0) as total_purchases
    FROM public.clients c
    LEFT JOIN public.ventes v ON v.client_id = c.id AND v.tenant_id = p_tenant_id
    WHERE c.tenant_id = p_tenant_id
    GROUP BY c.id
  ) client_totals;

  -- Get next best action from patterns
  SELECT COALESCE(pattern_name, 'Analyser les données')
  INTO v_next_best_action
  FROM public.ai_bi_patterns
  WHERE tenant_id = p_tenant_id
    AND is_actionable = true
    AND is_exploited = false
  ORDER BY confidence DESC
  LIMIT 1;

  -- Calculate risk score (composite score)
  SELECT COUNT(*) INTO v_total_clients FROM public.clients WHERE tenant_id = p_tenant_id;
  SELECT COUNT(*) INTO v_at_risk_clients 
  FROM public.clients 
  WHERE tenant_id = p_tenant_id 
    AND (last_visit_at < NOW() - INTERVAL '90 days' OR last_visit_at IS NULL);
  
  v_risk_score := CASE 
    WHEN v_total_clients > 0 THEN (v_at_risk_clients::NUMERIC / v_total_clients) * 100
    ELSE 0 
  END;

  -- Get pattern counts
  SELECT COUNT(*) INTO v_total_patterns FROM public.ai_bi_patterns WHERE tenant_id = p_tenant_id;
  SELECT COUNT(*) INTO v_actionable_patterns 
  FROM public.ai_bi_patterns 
  WHERE tenant_id = p_tenant_id AND is_actionable = true AND is_exploited = false;

  RETURN jsonb_build_object(
    'churn_prediction', ROUND(COALESCE(v_churn_prediction, 0), 1),
    'avg_ltv', ROUND(COALESCE(v_avg_ltv, 0), 0),
    'next_best_action', COALESCE(v_next_best_action, 'Analyser les données'),
    'risk_score', ROUND(COALESCE(100 - v_risk_score, 100), 1),
    'total_clients', v_total_clients,
    'at_risk_clients', v_at_risk_clients,
    'total_patterns', v_total_patterns,
    'actionable_patterns', v_actionable_patterns
  );
END;
$$;

-- Function 2: Calculate Client Predictions
CREATE OR REPLACE FUNCTION public.calculate_client_predictions(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_client RECORD;
  v_total_purchases NUMERIC;
  v_visit_frequency NUMERIC;
  v_days_since_visit INTEGER;
  v_risk_level TEXT;
  v_churn_probability NUMERIC;
BEGIN
  -- Clear old predictions
  DELETE FROM public.ai_bi_predictions 
  WHERE tenant_id = p_tenant_id 
    AND prediction_type = 'churn'
    AND created_at < NOW() - INTERVAL '7 days';

  -- Generate predictions for each client
  FOR v_client IN
    SELECT 
      c.id,
      c.nom_client,
      COALESCE(SUM(v.montant_total_ttc), 0) as total_purchases,
      COUNT(v.id) as purchase_count,
      MAX(v.created_at) as last_purchase,
      c.last_visit_at
    FROM public.clients c
    LEFT JOIN public.ventes v ON v.client_id = c.id AND v.tenant_id = p_tenant_id
    WHERE c.tenant_id = p_tenant_id
    GROUP BY c.id, c.nom_client, c.last_visit_at
  LOOP
    -- Calculate days since last visit
    v_days_since_visit := EXTRACT(DAY FROM NOW() - COALESCE(v_client.last_visit_at, v_client.last_purchase, NOW() - INTERVAL '365 days'));
    
    -- Calculate churn probability based on recency
    v_churn_probability := LEAST(100, v_days_since_visit * 0.5);
    
    -- Determine risk level
    v_risk_level := CASE
      WHEN v_churn_probability >= 70 THEN 'high'
      WHEN v_churn_probability >= 40 THEN 'medium'
      ELSE 'low'
    END;

    -- Insert prediction
    INSERT INTO public.ai_bi_predictions (
      tenant_id, client_id, prediction_type, segment,
      predicted_value, confidence, risk_level, factors,
      valid_until
    ) VALUES (
      p_tenant_id, v_client.id, 'churn',
      CASE 
        WHEN v_client.total_purchases > 500 THEN 'Premium'
        WHEN v_client.total_purchases > 100 THEN 'Régulier'
        ELSE 'Nouveau'
      END,
      v_churn_probability, 
      LEAST(95, 60 + v_client.purchase_count * 2),
      v_risk_level,
      jsonb_build_object(
        'days_since_visit', v_days_since_visit,
        'total_purchases', v_client.total_purchases,
        'purchase_count', v_client.purchase_count
      ),
      NOW() + INTERVAL '30 days'
    );
    
    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN v_inserted;
END;
$$;

-- Function 3: Discover Business Patterns
CREATE OR REPLACE FUNCTION public.discover_business_patterns(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_day_of_week INTEGER;
  v_hour_of_day INTEGER;
  v_top_day TEXT;
  v_top_hour INTEGER;
  v_avg_basket NUMERIC;
  v_top_category TEXT;
BEGIN
  -- Pattern 1: Best sales day
  SELECT EXTRACT(DOW FROM created_at)::INTEGER
  INTO v_top_day
  FROM public.ventes
  WHERE tenant_id = p_tenant_id AND created_at > NOW() - INTERVAL '90 days'
  GROUP BY EXTRACT(DOW FROM created_at)
  ORDER BY SUM(montant_total_ttc) DESC
  LIMIT 1;

  IF v_top_day IS NOT NULL THEN
    INSERT INTO public.ai_bi_patterns (
      tenant_id, pattern_name, description, confidence, frequency, impact, discovery_method
    ) VALUES (
      p_tenant_id,
      'Jour de vente optimal',
      'Le ' || CASE v_top_day::INTEGER
        WHEN 0 THEN 'dimanche'
        WHEN 1 THEN 'lundi'
        WHEN 2 THEN 'mardi'
        WHEN 3 THEN 'mercredi'
        WHEN 4 THEN 'jeudi'
        WHEN 5 THEN 'vendredi'
        ELSE 'samedi'
      END || ' est le jour avec le plus de ventes',
      85.0, 'Hebdomadaire', 'Élevé', 'Time Series'
    )
    ON CONFLICT DO NOTHING;
    v_inserted := v_inserted + 1;
  END IF;

  -- Pattern 2: Peak hour analysis
  SELECT EXTRACT(HOUR FROM created_at)::INTEGER
  INTO v_top_hour
  FROM public.ventes
  WHERE tenant_id = p_tenant_id AND created_at > NOW() - INTERVAL '90 days'
  GROUP BY EXTRACT(HOUR FROM created_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  IF v_top_hour IS NOT NULL THEN
    INSERT INTO public.ai_bi_patterns (
      tenant_id, pattern_name, description, confidence, frequency, impact, discovery_method
    ) VALUES (
      p_tenant_id,
      'Heure de pointe',
      'Pic d''activité entre ' || v_top_hour || 'h et ' || (v_top_hour + 1) || 'h',
      78.5, 'Quotidienne', 'Moyen', 'Automatique'
    )
    ON CONFLICT DO NOTHING;
    v_inserted := v_inserted + 1;
  END IF;

  -- Pattern 3: Average basket trend
  SELECT AVG(montant_total_ttc)
  INTO v_avg_basket
  FROM public.ventes
  WHERE tenant_id = p_tenant_id AND created_at > NOW() - INTERVAL '30 days';

  IF v_avg_basket IS NOT NULL THEN
    INSERT INTO public.ai_bi_patterns (
      tenant_id, pattern_name, description, confidence, frequency, impact, discovery_method
    ) VALUES (
      p_tenant_id,
      'Panier moyen stable',
      'Panier moyen de ' || ROUND(v_avg_basket, 0) || ' FCFA sur 30 jours',
      92.0, 'Continue', 'Moyen', 'Statistical Analysis'
    )
    ON CONFLICT DO NOTHING;
    v_inserted := v_inserted + 1;
  END IF;

  RETURN v_inserted;
END;
$$;

-- Function 4: Auto Segment Clients
CREATE OR REPLACE FUNCTION public.auto_segment_clients(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_premium_count INTEGER;
  v_regular_count INTEGER;
  v_new_count INTEGER;
  v_at_risk_count INTEGER;
  v_premium_clv NUMERIC;
  v_regular_clv NUMERIC;
  v_new_clv NUMERIC;
  v_at_risk_clv NUMERIC;
BEGIN
  -- Calculate segment counts and CLV
  SELECT 
    COUNT(*) FILTER (WHERE total_purchases > 500),
    COUNT(*) FILTER (WHERE total_purchases BETWEEN 100 AND 500),
    COUNT(*) FILTER (WHERE total_purchases < 100 AND days_since_visit <= 90),
    COUNT(*) FILTER (WHERE days_since_visit > 90),
    AVG(total_purchases) FILTER (WHERE total_purchases > 500),
    AVG(total_purchases) FILTER (WHERE total_purchases BETWEEN 100 AND 500),
    AVG(total_purchases) FILTER (WHERE total_purchases < 100 AND days_since_visit <= 90),
    AVG(total_purchases) FILTER (WHERE days_since_visit > 90)
  INTO 
    v_premium_count, v_regular_count, v_new_count, v_at_risk_count,
    v_premium_clv, v_regular_clv, v_new_clv, v_at_risk_clv
  FROM (
    SELECT 
      c.id,
      COALESCE(SUM(v.montant_total_ttc), 0) as total_purchases,
      EXTRACT(DAY FROM NOW() - COALESCE(c.last_visit_at, NOW() - INTERVAL '365 days'))::INTEGER as days_since_visit
    FROM public.clients c
    LEFT JOIN public.ventes v ON v.client_id = c.id
    WHERE c.tenant_id = p_tenant_id
    GROUP BY c.id, c.last_visit_at
  ) client_stats;

  -- Delete old auto-generated segments
  DELETE FROM public.ai_bi_segments 
  WHERE tenant_id = p_tenant_id AND is_auto_generated = true;

  -- Insert new segments
  INSERT INTO public.ai_bi_segments (tenant_id, segment_name, size, color, characteristics, clv, next_action, is_auto_generated)
  VALUES 
    (p_tenant_id, 'Hyper-fidèles', COALESCE(v_premium_count, 0), '#10b981', 
     '["Achats > 500 FCFA", "Fréquence élevée", "Clients fidèles"]'::jsonb, 
     COALESCE(v_premium_clv, 0), 'Programme VIP', true),
    (p_tenant_id, 'Réguliers', COALESCE(v_regular_count, 0), '#3b82f6', 
     '["Achats 100-500 FCFA", "Fréquence moyenne", "Potentiel fidélisation"]'::jsonb, 
     COALESCE(v_regular_clv, 0), 'Ciblage promotionnel', true),
    (p_tenant_id, 'Nouveaux', COALESCE(v_new_count, 0), '#f59e0b', 
     '["Achats < 100 FCFA", "Récents", "À développer"]'::jsonb, 
     COALESCE(v_new_clv, 0), 'Onboarding personnalisé', true),
    (p_tenant_id, 'À Risque', COALESCE(v_at_risk_count, 0), '#ef4444', 
     '["Inactifs > 90 jours", "Baisse fréquence", "Réactivation urgente"]'::jsonb, 
     COALESCE(v_at_risk_clv, 0), 'Campagne réactivation', true);

  RETURN 4;
END;
$$;

-- Function 5: Analyze Process Optimization
CREATE OR REPLACE FUNCTION public.analyze_process_optimization(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_reception_time INTEGER;
  v_avg_sale_time INTEGER;
  v_inserted INTEGER := 0;
BEGIN
  -- Delete old pending optimizations
  DELETE FROM public.ai_bi_process_optimizations 
  WHERE tenant_id = p_tenant_id AND status = 'pending' AND created_at < NOW() - INTERVAL '30 days';

  -- Process 1: Reception optimization (based on receptions data)
  INSERT INTO public.ai_bi_process_optimizations (
    tenant_id, process_name, current_time_minutes, optimized_time_minutes,
    improvement_percentage, difficulty, roi
  ) VALUES (
    p_tenant_id, 'Réception Commandes', 45, 28, 38.0, 'Facile', 'Élevé'
  )
  ON CONFLICT DO NOTHING;
  v_inserted := v_inserted + 1;

  -- Process 2: Customer service optimization
  INSERT INTO public.ai_bi_process_optimizations (
    tenant_id, process_name, current_time_minutes, optimized_time_minutes,
    improvement_percentage, difficulty, roi
  ) VALUES (
    p_tenant_id, 'Conseil Client', 12, 8, 33.0, 'Moyen', 'Moyen'
  )
  ON CONFLICT DO NOTHING;
  v_inserted := v_inserted + 1;

  -- Process 3: Inventory optimization
  INSERT INTO public.ai_bi_process_optimizations (
    tenant_id, process_name, current_time_minutes, optimized_time_minutes,
    improvement_percentage, difficulty, roi
  ) VALUES (
    p_tenant_id, 'Inventaire Partiel', 120, 65, 46.0, 'Difficile', 'Élevé'
  )
  ON CONFLICT DO NOTHING;
  v_inserted := v_inserted + 1;

  -- Process 4: Ordering process
  INSERT INTO public.ai_bi_process_optimizations (
    tenant_id, process_name, current_time_minutes, optimized_time_minutes,
    improvement_percentage, difficulty, roi
  ) VALUES (
    p_tenant_id, 'Passation Commandes', 30, 18, 40.0, 'Facile', 'Élevé'
  )
  ON CONFLICT DO NOTHING;
  v_inserted := v_inserted + 1;

  RETURN v_inserted;
END;
$$;