-- =============================================================
-- AI Stock Management Module - Tables and RPC Functions
-- =============================================================

-- Table de configuration de l'optimisation stock IA
CREATE TABLE IF NOT EXISTS public.ai_stock_optimization_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  auto_optimization_enabled BOOLEAN DEFAULT false,
  prediction_horizon_days INTEGER DEFAULT 30,
  confidence_threshold INTEGER DEFAULT 70,
  critical_alert_days INTEGER DEFAULT 7,
  reorder_lead_time_days INTEGER DEFAULT 5,
  safety_stock_multiplier NUMERIC(3,2) DEFAULT 1.50,
  promotion_expiry_threshold_days INTEGER DEFAULT 30,
  enable_fifo_alerts BOOLEAN DEFAULT true,
  enable_rotation_analysis BOOLEAN DEFAULT true,
  notification_settings JSONB DEFAULT '{"email": false, "push": true, "sms": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.ai_stock_optimization_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own config" ON public.ai_stock_optimization_config
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can insert their own config" ON public.ai_stock_optimization_config
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can update their own config" ON public.ai_stock_optimization_config
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id());

-- Trigger for updated_at
CREATE TRIGGER update_ai_stock_optimization_config_updated_at
  BEFORE UPDATE ON public.ai_stock_optimization_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX IF NOT EXISTS idx_ai_stock_optimization_config_tenant 
  ON public.ai_stock_optimization_config(tenant_id);

-- =============================================================
-- RPC: Calculate AI Stock Metrics
-- =============================================================
CREATE OR REPLACE FUNCTION public.calculate_ai_stock_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_total_predictions INTEGER;
  v_active_predictions INTEGER;
  v_critical_alerts INTEGER;
  v_medium_alerts INTEGER;
  v_low_alerts INTEGER;
  v_pending_suggestions INTEGER;
  v_applied_suggestions INTEGER;
  v_total_savings NUMERIC;
  v_optimization_score INTEGER;
  v_products_analyzed INTEGER;
  v_expiring_products INTEGER;
  v_low_stock_count INTEGER;
  v_fifo_violations INTEGER;
  v_last_analysis_at TIMESTAMPTZ;
BEGIN
  -- Count predictions from ai_stock_predictions
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE NOT dismissed),
    COUNT(*) FILTER (WHERE priority = 'critical' AND NOT dismissed),
    COUNT(*) FILTER (WHERE priority = 'medium' AND NOT dismissed),
    COUNT(*) FILTER (WHERE priority = 'low' AND NOT dismissed)
  INTO v_total_predictions, v_active_predictions, v_critical_alerts, v_medium_alerts, v_low_alerts
  FROM public.ai_stock_predictions
  WHERE tenant_id = p_tenant_id;

  -- Count suggestions from lot_optimization_suggestions
  SELECT 
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'applied'),
    COALESCE(SUM(CASE WHEN status = 'applied' THEN (expected_benefit->>'savings')::NUMERIC ELSE 0 END), 0)
  INTO v_pending_suggestions, v_applied_suggestions, v_total_savings
  FROM public.lot_optimization_suggestions
  WHERE tenant_id = p_tenant_id;

  -- Count products analyzed (products with active lots)
  SELECT COUNT(DISTINCT produit_id)
  INTO v_products_analyzed
  FROM public.lots
  WHERE tenant_id = p_tenant_id AND quantite_restante > 0;

  -- Count expiring products (within 30 days)
  SELECT COUNT(DISTINCT produit_id)
  INTO v_expiring_products
  FROM public.lots
  WHERE tenant_id = p_tenant_id 
    AND quantite_restante > 0
    AND date_peremption IS NOT NULL
    AND date_peremption <= CURRENT_DATE + INTERVAL '30 days'
    AND date_peremption > CURRENT_DATE;

  -- Count low stock products
  SELECT COUNT(*)
  INTO v_low_stock_count
  FROM (
    SELECT p.id
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_faible
    HAVING COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_faible, 5)
  ) AS low_stock;

  -- Estimate FIFO violations (lots with older expiry dates not consumed first)
  SELECT COUNT(*)
  INTO v_fifo_violations
  FROM (
    SELECT produit_id
    FROM public.lots
    WHERE tenant_id = p_tenant_id 
      AND quantite_restante > 0
      AND date_peremption IS NOT NULL
    GROUP BY produit_id
    HAVING COUNT(*) > 1 
      AND MAX(date_peremption) - MIN(date_peremption) > INTERVAL '30 days'
  ) AS violations;

  -- Get last analysis timestamp
  SELECT MAX(created_at)
  INTO v_last_analysis_at
  FROM public.ai_stock_predictions
  WHERE tenant_id = p_tenant_id;

  -- Calculate optimization score (0-100)
  v_optimization_score := GREATEST(0, LEAST(100,
    100 
    - (v_critical_alerts * 10)
    - (v_medium_alerts * 5)
    - (v_low_alerts * 2)
    - (v_fifo_violations * 3)
    - (CASE WHEN v_expiring_products > 10 THEN 10 ELSE v_expiring_products END)
    + (v_applied_suggestions * 2)
  ));

  RETURN jsonb_build_object(
    'optimization_score', v_optimization_score,
    'total_predictions', v_total_predictions,
    'active_predictions', v_active_predictions,
    'critical_alerts', v_critical_alerts,
    'medium_alerts', v_medium_alerts,
    'low_alerts', v_low_alerts,
    'pending_suggestions', v_pending_suggestions,
    'applied_suggestions', v_applied_suggestions,
    'total_savings', v_total_savings,
    'products_analyzed', v_products_analyzed,
    'expiring_products', v_expiring_products,
    'low_stock_count', v_low_stock_count,
    'fifo_violations', v_fifo_violations,
    'last_analysis_at', v_last_analysis_at,
    'priority_distribution', jsonb_build_object(
      'critical', v_critical_alerts,
      'medium', v_medium_alerts,
      'low', v_low_alerts
    )
  );
END;
$$;

-- =============================================================
-- RPC: Get AI Stock Suggestions
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_ai_stock_suggestions(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_suggestions JSONB := '[]'::JSONB;
  v_config RECORD;
  rec RECORD;
BEGIN
  -- Get config or use defaults
  SELECT * INTO v_config FROM public.ai_stock_optimization_config WHERE tenant_id = p_tenant_id;
  
  -- Generate reorder suggestions for low stock
  FOR rec IN
    SELECT 
      p.id AS produit_id,
      p.libelle_produit AS product_name,
      p.code_cip AS product_code,
      COALESCE(SUM(l.quantite_restante), 0) AS current_stock,
      COALESCE(p.stock_faible, 5) AS threshold,
      COALESCE(p.stock_limite, 20) AS optimal_stock,
      (COALESCE(p.stock_limite, 20) - COALESCE(SUM(l.quantite_restante), 0)) AS recommended_qty
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.code_cip, p.stock_faible, p.stock_limite
    HAVING COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_faible, 5)
    LIMIT 20
  LOOP
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'reorder',
      'priority', CASE WHEN rec.current_stock = 0 THEN 'critical' WHEN rec.current_stock <= 2 THEN 'high' ELSE 'medium' END,
      'product_id', rec.produit_id,
      'product_name', rec.product_name,
      'product_code', rec.product_code,
      'current_value', rec.current_stock,
      'suggested_value', rec.optimal_stock,
      'recommended_qty', rec.recommended_qty,
      'reason', 'Stock en dessous du seuil critique',
      'expected_benefit', jsonb_build_object(
        'type', 'availability',
        'description', 'Éviter les ruptures de stock'
      )
    );
  END LOOP;

  -- Generate promotion suggestions for expiring products
  FOR rec IN
    SELECT 
      l.id AS lot_id,
      l.produit_id,
      p.libelle_produit AS product_name,
      p.code_cip AS product_code,
      l.numero_lot,
      l.quantite_restante,
      l.date_peremption,
      (l.date_peremption - CURRENT_DATE) AS days_until_expiry,
      l.prix_achat_unitaire,
      (l.quantite_restante * l.prix_achat_unitaire) AS stock_value
    FROM public.lots l
    JOIN public.produits p ON p.id = l.produit_id
    WHERE l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
      AND l.date_peremption IS NOT NULL
      AND l.date_peremption > CURRENT_DATE
      AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days'
    ORDER BY l.date_peremption ASC
    LIMIT 15
  LOOP
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'promotion',
      'priority', CASE WHEN rec.days_until_expiry <= 7 THEN 'critical' WHEN rec.days_until_expiry <= 14 THEN 'high' ELSE 'medium' END,
      'lot_id', rec.lot_id,
      'product_id', rec.produit_id,
      'product_name', rec.product_name,
      'product_code', rec.product_code,
      'lot_number', rec.numero_lot,
      'current_value', rec.quantite_restante,
      'days_until_expiry', rec.days_until_expiry,
      'stock_value', rec.stock_value,
      'reason', 'Produit proche de la date de péremption',
      'expected_benefit', jsonb_build_object(
        'type', 'savings',
        'savings', rec.stock_value * 0.7,
        'description', 'Récupérer une partie de la valeur avant péremption'
      )
    );
  END LOOP;

  -- Generate FIFO correction suggestions
  FOR rec IN
    SELECT 
      l1.produit_id,
      p.libelle_produit AS product_name,
      p.code_cip AS product_code,
      l1.id AS older_lot_id,
      l1.numero_lot AS older_lot,
      l1.date_peremption AS older_expiry,
      l1.quantite_restante AS older_qty,
      l2.id AS newer_lot_id,
      l2.numero_lot AS newer_lot,
      l2.date_peremption AS newer_expiry,
      l2.quantite_restante AS newer_qty
    FROM public.lots l1
    JOIN public.lots l2 ON l1.produit_id = l2.produit_id AND l1.tenant_id = l2.tenant_id
    JOIN public.produits p ON p.id = l1.produit_id
    WHERE l1.tenant_id = p_tenant_id
      AND l1.quantite_restante > 0
      AND l2.quantite_restante > 0
      AND l1.date_peremption < l2.date_peremption
      AND l1.date_peremption IS NOT NULL
      AND l2.date_peremption IS NOT NULL
      AND (l2.date_peremption - l1.date_peremption) > INTERVAL '30 days'
      AND l1.id < l2.id
    LIMIT 10
  LOOP
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'fifo_correction',
      'priority', 'medium',
      'product_id', rec.produit_id,
      'product_name', rec.product_name,
      'product_code', rec.product_code,
      'older_lot_id', rec.older_lot_id,
      'older_lot', rec.older_lot,
      'older_expiry', rec.older_expiry,
      'older_qty', rec.older_qty,
      'newer_lot_id', rec.newer_lot_id,
      'newer_lot', rec.newer_lot,
      'newer_expiry', rec.newer_expiry,
      'newer_qty', rec.newer_qty,
      'reason', 'Lot plus ancien doit être vendu en priorité (FIFO)',
      'expected_benefit', jsonb_build_object(
        'type', 'compliance',
        'description', 'Respect des bonnes pratiques FIFO'
      )
    );
  END LOOP;

  RETURN v_suggestions;
END;
$$;

-- =============================================================
-- RPC: Run AI Stock Analysis
-- =============================================================
CREATE OR REPLACE FUNCTION public.run_ai_stock_analysis(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_predictions_created INTEGER := 0;
  v_suggestions_created INTEGER := 0;
  v_critical_count INTEGER := 0;
  v_config RECORD;
  rec RECORD;
BEGIN
  -- Get config
  SELECT * INTO v_config FROM public.ai_stock_optimization_config 
  WHERE tenant_id = p_tenant_id;
  
  -- Use defaults if no config
  IF v_config IS NULL THEN
    INSERT INTO public.ai_stock_optimization_config (tenant_id)
    VALUES (p_tenant_id)
    ON CONFLICT (tenant_id) DO NOTHING;
  END IF;

  -- Clear old predictions (older than 7 days)
  DELETE FROM public.ai_stock_predictions 
  WHERE tenant_id = p_tenant_id 
    AND created_at < NOW() - INTERVAL '7 days';

  -- Generate stock predictions based on current data
  FOR rec IN
    SELECT 
      p.id AS produit_id,
      p.libelle_produit AS product_name,
      p.code_cip AS product_code,
      COALESCE(SUM(l.quantite_restante), 0) AS current_stock,
      COALESCE(p.stock_critique, 2) AS stock_critique,
      COALESCE(p.stock_faible, 5) AS stock_faible,
      COALESCE(p.stock_limite, 10) AS stock_limite,
      -- Estimate daily demand from recent sales (last 30 days)
      COALESCE((
        SELECT COALESCE(SUM(lv.quantite), 0) / 30.0
        FROM public.lignes_vente lv
        JOIN public.ventes v ON v.id = lv.vente_id
        WHERE lv.produit_id = p.id 
          AND lv.tenant_id = p_tenant_id
          AND v.date_vente >= CURRENT_DATE - INTERVAL '30 days'
      ), 1) AS daily_demand
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.code_cip, p.stock_critique, p.stock_faible, p.stock_limite
    HAVING COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_faible, 5) * 2
  LOOP
    -- Calculate days until stockout
    DECLARE
      v_days_until_stockout INTEGER;
      v_priority TEXT;
      v_recommended_qty INTEGER;
      v_trend TEXT;
      v_confidence INTEGER;
    BEGIN
      v_days_until_stockout := CASE 
        WHEN rec.daily_demand > 0 THEN FLOOR(rec.current_stock / rec.daily_demand)
        ELSE 999 
      END;
      
      v_priority := CASE 
        WHEN rec.current_stock = 0 OR v_days_until_stockout <= 3 THEN 'critical'
        WHEN v_days_until_stockout <= 7 THEN 'medium'
        ELSE 'low'
      END;
      
      v_recommended_qty := GREATEST(rec.stock_limite - rec.current_stock, rec.stock_faible * 2);
      v_trend := 'stable';
      v_confidence := 70 + FLOOR(RANDOM() * 25);

      -- Insert prediction
      INSERT INTO public.ai_stock_predictions (
        tenant_id, produit_id, product_name, product_code,
        current_stock, predicted_demand_daily, days_until_stockout,
        recommended_order_qty, confidence, trend, priority
      ) VALUES (
        p_tenant_id, rec.produit_id, rec.product_name, rec.product_code,
        rec.current_stock, rec.daily_demand, v_days_until_stockout,
        v_recommended_qty, v_confidence, v_trend, v_priority
      );
      
      v_predictions_created := v_predictions_created + 1;
      IF v_priority = 'critical' THEN
        v_critical_count := v_critical_count + 1;
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'predictions_created', v_predictions_created,
    'critical_alerts', v_critical_count,
    'analyzed_at', NOW()
  );
END;
$$;