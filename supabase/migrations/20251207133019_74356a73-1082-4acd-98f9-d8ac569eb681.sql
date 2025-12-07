-- =====================================================
-- AI INTEGRATIONS MODULE - Tables and RPC Functions
-- =====================================================

-- Table 1: ai_provider_connections - Fournisseurs IA (Lovable AI Gateway, Gemini, OpenAI, etc.)
CREATE TABLE IF NOT EXISTS public.ai_provider_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'ai_gateway', -- ai_gateway, openai, gemini, anthropic, custom
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  model_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  last_connection_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending, connected, error, disconnected
  error_message TEXT,
  config JSONB DEFAULT '{}',
  total_calls INTEGER DEFAULT 0,
  success_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  avg_latency_ms NUMERIC(10,2) DEFAULT 0,
  max_tokens INTEGER DEFAULT 4096,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 2: ai_data_sources - Sources de données pour ML/IA
CREATE TABLE IF NOT EXISTS public.ai_data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'table', -- table, api, file, webhook
  description TEXT,
  source_config JSONB DEFAULT '{}', -- table_name, api_url, file_path, etc.
  sync_frequency TEXT DEFAULT 'daily', -- realtime, hourly, daily, weekly, manual
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- pending, syncing, synced, error
  sync_error_message TEXT,
  records_count INTEGER DEFAULT 0,
  data_size_mb NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_encrypted BOOLEAN DEFAULT false,
  retention_days INTEGER DEFAULT 365,
  created_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 3: ai_webhook_events - Logs des webhooks et événements IA
CREATE TABLE IF NOT EXISTS public.ai_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- provider_call, data_sync, model_update, error, alert
  source TEXT NOT NULL, -- provider_name or data_source_name
  source_id UUID, -- Reference to provider or data_source
  direction TEXT DEFAULT 'inbound', -- inbound, outbound
  payload JSONB DEFAULT '{}',
  response JSONB,
  status TEXT DEFAULT 'pending', -- pending, processing, success, error
  status_code INTEGER,
  latency_ms INTEGER,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_provider_connections_tenant ON public.ai_provider_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_connections_status ON public.ai_provider_connections(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_provider_connections_active ON public.ai_provider_connections(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_ai_data_sources_tenant ON public.ai_data_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_data_sources_type ON public.ai_data_sources(tenant_id, source_type);
CREATE INDEX IF NOT EXISTS idx_ai_data_sources_sync ON public.ai_data_sources(tenant_id, sync_status);

CREATE INDEX IF NOT EXISTS idx_ai_webhook_events_tenant ON public.ai_webhook_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_webhook_events_type ON public.ai_webhook_events(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ai_webhook_events_created ON public.ai_webhook_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_webhook_events_source ON public.ai_webhook_events(tenant_id, source_id);

-- Enable RLS
ALTER TABLE public.ai_provider_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_provider_connections
CREATE POLICY "ai_provider_connections_tenant_isolation" ON public.ai_provider_connections
  FOR ALL USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for ai_data_sources
CREATE POLICY "ai_data_sources_tenant_isolation" ON public.ai_data_sources
  FOR ALL USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for ai_webhook_events
CREATE POLICY "ai_webhook_events_tenant_isolation" ON public.ai_webhook_events
  FOR ALL USING (tenant_id = public.get_current_user_tenant_id());

-- Trigger for updated_at
CREATE TRIGGER update_ai_provider_connections_updated_at
  BEFORE UPDATE ON public.ai_provider_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_data_sources_updated_at
  BEFORE UPDATE ON public.ai_data_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RPC Function 1: get_ai_integration_metrics
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_ai_integration_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_active_providers INTEGER;
  v_total_providers INTEGER;
  v_active_sources INTEGER;
  v_total_sources INTEGER;
  v_api_calls_24h INTEGER;
  v_success_calls_24h INTEGER;
  v_success_rate NUMERIC;
  v_avg_latency NUMERIC;
  v_total_records INTEGER;
  v_pending_syncs INTEGER;
  v_errors_24h INTEGER;
BEGIN
  -- Provider metrics
  SELECT 
    COUNT(*) FILTER (WHERE is_active = true AND status = 'connected'),
    COUNT(*)
  INTO v_active_providers, v_total_providers
  FROM public.ai_provider_connections
  WHERE tenant_id = p_tenant_id;

  -- Data source metrics
  SELECT 
    COUNT(*) FILTER (WHERE is_active = true),
    COUNT(*),
    COALESCE(SUM(records_count), 0),
    COUNT(*) FILTER (WHERE sync_status = 'pending' OR sync_status = 'syncing')
  INTO v_active_sources, v_total_sources, v_total_records, v_pending_syncs
  FROM public.ai_data_sources
  WHERE tenant_id = p_tenant_id;

  -- API calls in last 24h
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'success'),
    COUNT(*) FILTER (WHERE status = 'error'),
    COALESCE(AVG(latency_ms), 0)
  INTO v_api_calls_24h, v_success_calls_24h, v_errors_24h, v_avg_latency
  FROM public.ai_webhook_events
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - INTERVAL '24 hours';

  -- Calculate success rate
  v_success_rate := CASE 
    WHEN v_api_calls_24h > 0 THEN ROUND((v_success_calls_24h::NUMERIC / v_api_calls_24h) * 100, 1)
    ELSE 100
  END;

  v_result := jsonb_build_object(
    'active_providers', COALESCE(v_active_providers, 0),
    'total_providers', COALESCE(v_total_providers, 0),
    'active_sources', COALESCE(v_active_sources, 0),
    'total_sources', COALESCE(v_total_sources, 0),
    'api_calls_24h', COALESCE(v_api_calls_24h, 0),
    'success_calls_24h', COALESCE(v_success_calls_24h, 0),
    'success_rate', COALESCE(v_success_rate, 100),
    'avg_latency_ms', ROUND(COALESCE(v_avg_latency, 0), 2),
    'total_records', COALESCE(v_total_records, 0),
    'pending_syncs', COALESCE(v_pending_syncs, 0),
    'errors_24h', COALESCE(v_errors_24h, 0),
    'calculated_at', NOW()
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- RPC Function 2: sync_ai_data_source
-- =====================================================
CREATE OR REPLACE FUNCTION public.sync_ai_data_source(p_tenant_id UUID, p_source_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source RECORD;
  v_records_count INTEGER := 0;
  v_table_name TEXT;
BEGIN
  -- Get source details
  SELECT * INTO v_source
  FROM public.ai_data_sources
  WHERE id = p_source_id AND tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Source non trouvée');
  END IF;

  -- Update status to syncing
  UPDATE public.ai_data_sources
  SET sync_status = 'syncing', updated_at = NOW()
  WHERE id = p_source_id;

  -- Simulate sync based on source type
  IF v_source.source_type = 'table' THEN
    v_table_name := v_source.source_config->>'table_name';
    
    -- Count records in the source table (simplified)
    IF v_table_name = 'produits' THEN
      SELECT COUNT(*) INTO v_records_count FROM public.produits WHERE tenant_id = p_tenant_id;
    ELSIF v_table_name = 'ventes' THEN
      SELECT COUNT(*) INTO v_records_count FROM public.ventes WHERE tenant_id = p_tenant_id;
    ELSIF v_table_name = 'clients' THEN
      SELECT COUNT(*) INTO v_records_count FROM public.clients WHERE tenant_id = p_tenant_id;
    ELSIF v_table_name = 'lots' THEN
      SELECT COUNT(*) INTO v_records_count FROM public.lots WHERE tenant_id = p_tenant_id;
    ELSE
      v_records_count := 0;
    END IF;
  END IF;

  -- Update source with sync results
  UPDATE public.ai_data_sources
  SET 
    sync_status = 'synced',
    last_sync_at = NOW(),
    next_sync_at = CASE sync_frequency
      WHEN 'realtime' THEN NOW() + INTERVAL '1 minute'
      WHEN 'hourly' THEN NOW() + INTERVAL '1 hour'
      WHEN 'daily' THEN NOW() + INTERVAL '1 day'
      WHEN 'weekly' THEN NOW() + INTERVAL '7 days'
      ELSE NULL
    END,
    records_count = v_records_count,
    sync_error_message = NULL,
    updated_at = NOW()
  WHERE id = p_source_id;

  -- Log the sync event
  INSERT INTO public.ai_webhook_events (
    tenant_id, event_type, source, source_id, direction, 
    payload, status, processed_at
  ) VALUES (
    p_tenant_id, 'data_sync', v_source.source_name, p_source_id, 'inbound',
    jsonb_build_object('records_count', v_records_count, 'source_type', v_source.source_type),
    'success', NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'records_count', v_records_count,
    'synced_at', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  -- Update source with error
  UPDATE public.ai_data_sources
  SET 
    sync_status = 'error',
    sync_error_message = SQLERRM,
    updated_at = NOW()
  WHERE id = p_source_id;

  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =====================================================
-- RPC Function 3: test_ai_provider_connection
-- =====================================================
CREATE OR REPLACE FUNCTION public.test_ai_provider_connection(p_tenant_id UUID, p_provider_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider RECORD;
  v_start_time TIMESTAMPTZ;
  v_latency_ms INTEGER;
BEGIN
  v_start_time := clock_timestamp();

  -- Get provider details
  SELECT * INTO v_provider
  FROM public.ai_provider_connections
  WHERE id = p_provider_id AND tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fournisseur non trouvé');
  END IF;

  -- Simulate connection test (actual test done via edge function)
  v_latency_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

  -- Update provider stats
  UPDATE public.ai_provider_connections
  SET 
    total_calls = total_calls + 1,
    last_connection_at = NOW(),
    updated_at = NOW()
  WHERE id = p_provider_id;

  -- Log the test event
  INSERT INTO public.ai_webhook_events (
    tenant_id, event_type, source, source_id, direction,
    payload, status, latency_ms, processed_at
  ) VALUES (
    p_tenant_id, 'provider_call', v_provider.provider_name, p_provider_id, 'outbound',
    jsonb_build_object('action', 'connection_test', 'provider_type', v_provider.provider_type),
    'pending', v_latency_ms, NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'provider_id', p_provider_id,
    'provider_name', v_provider.provider_name,
    'latency_ms', v_latency_ms,
    'tested_at', NOW()
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_ai_integration_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_ai_data_source(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_ai_provider_connection(UUID, UUID) TO authenticated;