-- Create stock_settings table
CREATE TABLE IF NOT EXISTS public.stock_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  default_units TEXT DEFAULT 'Unité',
  valuation_method TEXT DEFAULT 'FIFO',
  rounding_precision INTEGER DEFAULT 2 CHECK (rounding_precision >= 0 AND rounding_precision <= 100),
  minimum_stock_days INTEGER DEFAULT 30,
  maximum_stock_days INTEGER DEFAULT 365,
  reorder_point_days INTEGER DEFAULT 15,
  safety_stock_percentage NUMERIC DEFAULT 10.00,
  auto_reorder_enabled BOOLEAN DEFAULT false,
  allow_negative_stock BOOLEAN DEFAULT false,
  track_expiration_dates BOOLEAN DEFAULT true,
  require_lot_numbers BOOLEAN DEFAULT false,
  auto_generate_lots BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on stock_settings
ALTER TABLE public.stock_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stock_settings
CREATE POLICY "Users can view stock settings from their tenant"
ON public.stock_settings FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert stock settings in their tenant"
ON public.stock_settings FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update stock settings from their tenant"
ON public.stock_settings FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete stock settings from their tenant"
ON public.stock_settings FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create pricing_settings table
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  default_margin NUMERIC DEFAULT 20.00,
  minimum_margin NUMERIC DEFAULT 5.00,
  maximum_margin NUMERIC DEFAULT 100.00,
  price_rounding_method TEXT DEFAULT 'Nearest',
  price_rounding_value NUMERIC DEFAULT 0.01,
  auto_update_prices BOOLEAN DEFAULT false,
  include_tax_in_price BOOLEAN DEFAULT true,
  default_tax_rate NUMERIC DEFAULT 19.25,
  default_centime_additionnel_rate NUMERIC DEFAULT 0.175,
  allow_discounts BOOLEAN DEFAULT true,
  max_discount_percent NUMERIC DEFAULT 10.00,
  require_discount_approval BOOLEAN DEFAULT false,
  show_cost_to_customers BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on pricing_settings
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pricing_settings
CREATE POLICY "Users can view pricing settings from their tenant"
ON public.pricing_settings FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert pricing settings in their tenant"
ON public.pricing_settings FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update pricing settings from their tenant"
ON public.pricing_settings FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete pricing settings from their tenant"
ON public.pricing_settings FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create margin_rules table
CREATE TABLE IF NOT EXISTS public.margin_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category TEXT NOT NULL,
  margin NUMERIC NOT NULL DEFAULT 20.00,
  min_price NUMERIC DEFAULT 0.00,
  max_price NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on margin_rules
ALTER TABLE public.margin_rules ENABLE ROW LEVEL SECURITY;

-- Create index on margin_rules
CREATE INDEX IF NOT EXISTS idx_margin_rules_tenant_id ON public.margin_rules(tenant_id);

-- Create RLS policies for margin_rules
CREATE POLICY "Users can view margin rules from their tenant"
ON public.margin_rules FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert margin rules in their tenant"
ON public.margin_rules FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update margin rules from their tenant"
ON public.margin_rules FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete margin rules from their tenant"
ON public.margin_rules FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create alert_settings table
CREATE TABLE IF NOT EXISTS public.alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  low_stock_enabled BOOLEAN DEFAULT true,
  low_stock_threshold INTEGER DEFAULT 10,
  critical_stock_threshold INTEGER DEFAULT 5,
  expiration_alert_days INTEGER DEFAULT 30,
  near_expiration_days INTEGER DEFAULT 7,
  overdue_inventory_days INTEGER DEFAULT 365,
  slow_moving_days INTEGER DEFAULT 90,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  dashboard_notifications BOOLEAN DEFAULT true,
  alert_frequency TEXT DEFAULT 'daily',
  business_days_only BOOLEAN DEFAULT true,
  alert_start_time TIME DEFAULT '08:00',
  alert_end_time TIME DEFAULT '18:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on alert_settings
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for alert_settings
CREATE POLICY "Users can view alert settings from their tenant"
ON public.alert_settings FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert alert settings in their tenant"
ON public.alert_settings FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update alert settings from their tenant"
ON public.alert_settings FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete alert settings from their tenant"
ON public.alert_settings FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create alert_thresholds_by_category table
CREATE TABLE IF NOT EXISTS public.alert_thresholds_by_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category TEXT NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 10,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on alert_thresholds_by_category
ALTER TABLE public.alert_thresholds_by_category ENABLE ROW LEVEL SECURITY;

-- Create index on alert_thresholds_by_category
CREATE INDEX IF NOT EXISTS idx_alert_thresholds_tenant_id ON public.alert_thresholds_by_category(tenant_id);

-- Create RLS policies for alert_thresholds_by_category
CREATE POLICY "Users can view alert thresholds from their tenant"
ON public.alert_thresholds_by_category FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert alert thresholds in their tenant"
ON public.alert_thresholds_by_category FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update alert thresholds from their tenant"
ON public.alert_thresholds_by_category FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete alert thresholds from their tenant"
ON public.alert_thresholds_by_category FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Add missing columns to categorie_tarification if they don't exist
ALTER TABLE public.categorie_tarification 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update RLS on categorie_tarification if needed
DO $$ 
BEGIN
    -- Check if RLS is enabled, if not enable it
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'categorie_tarification' AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.categorie_tarification ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for categorie_tarification if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categorie_tarification' 
        AND policyname = 'Users can view categories from their tenant'
    ) THEN
        CREATE POLICY "Users can view categories from their tenant"
        ON public.categorie_tarification FOR SELECT
        USING (tenant_id = get_current_user_tenant_id());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categorie_tarification' 
        AND policyname = 'Users can insert categories in their tenant'
    ) THEN
        CREATE POLICY "Users can insert categories in their tenant"
        ON public.categorie_tarification FOR INSERT
        WITH CHECK (tenant_id = get_current_user_tenant_id());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categorie_tarification' 
        AND policyname = 'Users can update categories from their tenant'
    ) THEN
        CREATE POLICY "Users can update categories from their tenant"
        ON public.categorie_tarification FOR UPDATE
        USING (tenant_id = get_current_user_tenant_id());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categorie_tarification' 
        AND policyname = 'Users can delete categories from their tenant'
    ) THEN
        CREATE POLICY "Users can delete categories from their tenant"
        ON public.categorie_tarification FOR DELETE
        USING (tenant_id = get_current_user_tenant_id());
    END IF;
END $$;

-- Create triggers for updated_at columns
CREATE TRIGGER update_stock_settings_updated_at
    BEFORE UPDATE ON public.stock_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_settings_updated_at
    BEFORE UPDATE ON public.pricing_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_margin_rules_updated_at
    BEFORE UPDATE ON public.margin_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_settings_updated_at
    BEFORE UPDATE ON public.alert_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_thresholds_updated_at
    BEFORE UPDATE ON public.alert_thresholds_by_category
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();