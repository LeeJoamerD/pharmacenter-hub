-- Create forecast calculation tables and functions

-- Table for storing forecast settings
CREATE TABLE public.forecast_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  produit_id UUID,
  famille_id UUID,
  forecast_method TEXT NOT NULL DEFAULT 'moving_average',
  forecast_horizon_days INTEGER NOT NULL DEFAULT 30,
  historical_period_days INTEGER NOT NULL DEFAULT 90,
  seasonality_enabled BOOLEAN NOT NULL DEFAULT false,
  trend_enabled BOOLEAN NOT NULL DEFAULT true,
  confidence_level NUMERIC NOT NULL DEFAULT 0.95,
  min_sales_threshold INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT forecast_settings_tenant_product_unique UNIQUE (tenant_id, produit_id),
  CONSTRAINT forecast_settings_tenant_famille_unique UNIQUE (tenant_id, famille_id)
);

-- Enable RLS
ALTER TABLE public.forecast_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view forecast settings from their tenant"
ON public.forecast_settings FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert forecast settings in their tenant"
ON public.forecast_settings FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update forecast settings from their tenant"
ON public.forecast_settings FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete forecast settings from their tenant"
ON public.forecast_settings FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Table for storing forecast calculations
CREATE TABLE public.forecast_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  produit_id UUID NOT NULL,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  forecast_date DATE NOT NULL,
  predicted_demand NUMERIC NOT NULL DEFAULT 0,
  confidence_interval_lower NUMERIC NOT NULL DEFAULT 0,
  confidence_interval_upper NUMERIC NOT NULL DEFAULT 0,
  forecast_method TEXT NOT NULL,
  accuracy_score NUMERIC,
  trend TEXT,
  seasonality_factor NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT forecast_calculations_unique UNIQUE (tenant_id, produit_id, calculation_date, forecast_date)
);

-- Enable RLS
ALTER TABLE public.forecast_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view forecast calculations from their tenant"
ON public.forecast_calculations FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert forecast calculations in their tenant"
ON public.forecast_calculations FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update forecast calculations from their tenant"
ON public.forecast_calculations FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete forecast calculations from their tenant"
ON public.forecast_calculations FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Table for forecast calculation history
CREATE TABLE public.forecast_calculation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  calculation_run_id UUID NOT NULL DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  products_processed INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  error_message TEXT,
  calculation_parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forecast_calculation_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view forecast history from their tenant"
ON public.forecast_calculation_history FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert forecast history in their tenant"
ON public.forecast_calculation_history FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update forecast history from their tenant"
ON public.forecast_calculation_history FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

-- Function to calculate average consumption
CREATE OR REPLACE FUNCTION public.calculate_average_consumption(
  p_tenant_id UUID,
  p_produit_id UUID,
  p_days_back INTEGER DEFAULT 90
) RETURNS NUMERIC AS $$
DECLARE
  avg_consumption NUMERIC := 0;
BEGIN
  SELECT COALESCE(AVG(daily_total), 0)
  INTO avg_consumption
  FROM (
    SELECT 
      DATE(v.date_vente) as sale_date,
      COALESCE(SUM(lv.quantite), 0) as daily_total
    FROM public.ventes v
    LEFT JOIN public.lignes_ventes lv ON v.id = lv.vente_id
    WHERE v.tenant_id = p_tenant_id
      AND lv.produit_id = p_produit_id
      AND v.date_vente >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
      AND v.statut = 'Validée'
    GROUP BY DATE(v.date_vente)
  ) daily_sales;
  
  RETURN avg_consumption;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate product forecast
CREATE OR REPLACE FUNCTION public.calculate_product_forecast(
  p_tenant_id UUID,
  p_produit_id UUID,
  p_forecast_days INTEGER DEFAULT 30,
  p_method TEXT DEFAULT 'moving_average'
) RETURNS TABLE (
  forecast_date DATE,
  predicted_demand NUMERIC,
  confidence_lower NUMERIC,
  confidence_upper NUMERIC,
  trend TEXT
) AS $$
DECLARE
  avg_consumption NUMERIC;
  trend_factor NUMERIC := 1.0;
  volatility NUMERIC := 0.1;
  current_stock NUMERIC := 0;
  rec RECORD;
BEGIN
  -- Calculate average consumption
  SELECT public.calculate_average_consumption(p_tenant_id, p_produit_id, 90)
  INTO avg_consumption;
  
  -- Get current stock
  SELECT COALESCE(SUM(quantite_restante), 0)
  INTO current_stock
  FROM public.lots
  WHERE tenant_id = p_tenant_id 
    AND produit_id = p_produit_id
    AND quantite_restante > 0;
  
  -- Calculate trend (simplified - compare last 30 days vs previous 30 days)
  WITH recent_sales AS (
    SELECT COALESCE(AVG(daily_total), 0) as recent_avg
    FROM (
      SELECT 
        DATE(v.date_vente) as sale_date,
        COALESCE(SUM(lv.quantite), 0) as daily_total
      FROM public.ventes v
      LEFT JOIN public.lignes_ventes lv ON v.id = lv.vente_id
      WHERE v.tenant_id = p_tenant_id
        AND lv.produit_id = p_produit_id
        AND v.date_vente >= CURRENT_DATE - INTERVAL '30 days'
        AND v.statut = 'Validée'
      GROUP BY DATE(v.date_vente)
    ) recent
  ),
  older_sales AS (
    SELECT COALESCE(AVG(daily_total), 0) as older_avg
    FROM (
      SELECT 
        DATE(v.date_vente) as sale_date,
        COALESCE(SUM(lv.quantite), 0) as daily_total
      FROM public.ventes v
      LEFT JOIN public.lignes_ventes lv ON v.id = lv.vente_id
      WHERE v.tenant_id = p_tenant_id
        AND lv.produit_id = p_produit_id
        AND v.date_vente >= CURRENT_DATE - INTERVAL '60 days'
        AND v.date_vente < CURRENT_DATE - INTERVAL '30 days'
        AND v.statut = 'Validée'
      GROUP BY DATE(v.date_vente)
    ) older
  )
  SELECT 
    CASE 
      WHEN older_avg > 0 THEN recent_avg / older_avg
      ELSE 1.0
    END
  INTO trend_factor
  FROM recent_sales, older_sales;
  
  -- Generate forecast for each day
  FOR i IN 1..p_forecast_days LOOP
    SELECT 
      (CURRENT_DATE + i)::DATE,
      GREATEST(0, avg_consumption * trend_factor),
      GREATEST(0, avg_consumption * trend_factor * (1 - volatility)),
      avg_consumption * trend_factor * (1 + volatility),
      CASE 
        WHEN trend_factor > 1.1 THEN 'hausse'
        WHEN trend_factor < 0.9 THEN 'baisse'
        ELSE 'stable'
      END
    INTO rec;
    
    forecast_date := rec.forecast_date;
    predicted_demand := rec.predicted_demand;
    confidence_lower := rec.confidence_lower;
    confidence_upper := rec.confidence_upper;
    trend := rec.trend;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;