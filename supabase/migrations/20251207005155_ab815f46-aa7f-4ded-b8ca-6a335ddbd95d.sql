-- =============================================
-- TABLES POUR L'ANALYSE DE SENTIMENT IA
-- =============================================

-- 1. Table des analyses de sentiment
CREATE TABLE public.ai_sentiment_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
  score NUMERIC(5,4) NOT NULL CHECK (score >= 0 AND score <= 1),
  emotions JSONB DEFAULT '[]'::jsonb,
  category VARCHAR(50),
  source VARCHAR(50) DEFAULT 'manual',
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  keywords JSONB DEFAULT '[]'::jsonb,
  analysis_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table des mots-clés de sentiment
CREATE TABLE public.ai_sentiment_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('positive', 'negative')),
  frequency INTEGER DEFAULT 0,
  impact VARCHAR(20) DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),
  last_detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, word)
);

-- 3. Table de configuration du module sentiment
CREATE TABLE public.ai_sentiment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE UNIQUE,
  auto_analysis_enabled BOOLEAN DEFAULT false,
  default_model VARCHAR(100) DEFAULT 'google/gemini-2.5-flash',
  categories JSONB DEFAULT '["service", "produits", "prix", "conseil", "horaires", "digital"]'::jsonb,
  sources JSONB DEFAULT '["google_reviews", "facebook", "email", "enquete", "manual"]'::jsonb,
  notification_threshold NUMERIC(3,2) DEFAULT 0.30,
  retention_days INTEGER DEFAULT 365,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.ai_sentiment_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sentiment_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sentiment_settings ENABLE ROW LEVEL SECURITY;

-- Policies for ai_sentiment_analyses
CREATE POLICY "Users can view sentiment analyses from their tenant"
  ON public.ai_sentiment_analyses FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert sentiment analyses in their tenant"
  ON public.ai_sentiment_analyses FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update sentiment analyses from their tenant"
  ON public.ai_sentiment_analyses FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete sentiment analyses from their tenant"
  ON public.ai_sentiment_analyses FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Policies for ai_sentiment_keywords
CREATE POLICY "Users can view sentiment keywords from their tenant"
  ON public.ai_sentiment_keywords FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert sentiment keywords in their tenant"
  ON public.ai_sentiment_keywords FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update sentiment keywords from their tenant"
  ON public.ai_sentiment_keywords FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete sentiment keywords from their tenant"
  ON public.ai_sentiment_keywords FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Policies for ai_sentiment_settings
CREATE POLICY "Users can view sentiment settings from their tenant"
  ON public.ai_sentiment_settings FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert sentiment settings in their tenant"
  ON public.ai_sentiment_settings FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update sentiment settings from their tenant"
  ON public.ai_sentiment_settings FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_sentiment_analyses_tenant ON public.ai_sentiment_analyses(tenant_id);
CREATE INDEX idx_sentiment_analyses_sentiment ON public.ai_sentiment_analyses(sentiment);
CREATE INDEX idx_sentiment_analyses_category ON public.ai_sentiment_analyses(category);
CREATE INDEX idx_sentiment_analyses_source ON public.ai_sentiment_analyses(source);
CREATE INDEX idx_sentiment_analyses_created_at ON public.ai_sentiment_analyses(created_at DESC);
CREATE INDEX idx_sentiment_keywords_tenant ON public.ai_sentiment_keywords(tenant_id);
CREATE INDEX idx_sentiment_keywords_sentiment ON public.ai_sentiment_keywords(sentiment);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_ai_sentiment_analyses_updated_at
  BEFORE UPDATE ON public.ai_sentiment_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_sentiment_keywords_updated_at
  BEFORE UPDATE ON public.ai_sentiment_keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_sentiment_settings_updated_at
  BEFORE UPDATE ON public.ai_sentiment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RPC FUNCTION: Calculate Sentiment Metrics
-- =============================================

CREATE OR REPLACE FUNCTION calculate_sentiment_metrics(p_tenant_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  total_count INTEGER;
  date_filter TIMESTAMPTZ;
BEGIN
  date_filter := NOW() - (p_days || ' days')::INTERVAL;
  
  SELECT COUNT(*) INTO total_count
  FROM ai_sentiment_analyses
  WHERE tenant_id = p_tenant_id AND created_at >= date_filter;

  SELECT json_build_object(
    'totalAnalyses', total_count,
    'globalScore', COALESCE(
      ROUND((SELECT AVG(score) * 5 FROM ai_sentiment_analyses WHERE tenant_id = p_tenant_id AND created_at >= date_filter), 2),
      0
    ),
    'positiveRate', COALESCE(
      ROUND((
        SELECT COUNT(*)::NUMERIC / NULLIF(total_count, 0) * 100
        FROM ai_sentiment_analyses 
        WHERE tenant_id = p_tenant_id AND created_at >= date_filter
          AND sentiment IN ('very_positive', 'positive')
      ), 1),
      0
    ),
    'neutralRate', COALESCE(
      ROUND((
        SELECT COUNT(*)::NUMERIC / NULLIF(total_count, 0) * 100
        FROM ai_sentiment_analyses 
        WHERE tenant_id = p_tenant_id AND created_at >= date_filter
          AND sentiment = 'neutral'
      ), 1),
      0
    ),
    'negativeRate', COALESCE(
      ROUND((
        SELECT COUNT(*)::NUMERIC / NULLIF(total_count, 0) * 100
        FROM ai_sentiment_analyses 
        WHERE tenant_id = p_tenant_id AND created_at >= date_filter
          AND sentiment IN ('very_negative', 'negative')
      ), 1),
      0
    ),
    'distribution', COALESCE(
      (SELECT json_agg(json_build_object(
        'sentiment', sq.sentiment,
        'count', sq.cnt,
        'percentage', ROUND(sq.cnt::NUMERIC / NULLIF(total_count, 0) * 100, 1)
      ))
      FROM (
        SELECT sentiment, COUNT(*) as cnt
        FROM ai_sentiment_analyses
        WHERE tenant_id = p_tenant_id AND created_at >= date_filter
        GROUP BY sentiment
        ORDER BY cnt DESC
      ) sq),
      '[]'::json
    ),
    'categoryBreakdown', COALESCE(
      (SELECT json_agg(json_build_object(
        'category', sq.category,
        'score', ROUND(sq.avg_score * 5, 2),
        'volume', sq.cnt,
        'trend', '+0.0'
      ))
      FROM (
        SELECT category, AVG(score) as avg_score, COUNT(*) as cnt
        FROM ai_sentiment_analyses
        WHERE tenant_id = p_tenant_id AND created_at >= date_filter AND category IS NOT NULL
        GROUP BY category
        ORDER BY cnt DESC
      ) sq),
      '[]'::json
    ),
    'trend', COALESCE(
      (SELECT json_agg(json_build_object(
        'date', sq.day::DATE,
        'positive', sq.positive_cnt,
        'neutral', sq.neutral_cnt,
        'negative', sq.negative_cnt,
        'avgScore', ROUND(sq.avg_score * 5, 2)
      ) ORDER BY sq.day)
      FROM (
        SELECT 
          date_trunc('day', created_at) as day,
          COUNT(*) FILTER (WHERE sentiment IN ('very_positive', 'positive')) as positive_cnt,
          COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_cnt,
          COUNT(*) FILTER (WHERE sentiment IN ('very_negative', 'negative')) as negative_cnt,
          AVG(score) as avg_score
        FROM ai_sentiment_analyses
        WHERE tenant_id = p_tenant_id AND created_at >= date_filter
        GROUP BY date_trunc('day', created_at)
      ) sq),
      '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;