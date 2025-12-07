-- =============================================
-- Help Center Tables for Dashboard
-- =============================================

-- Table: help_categories (Catégories d'aide par module)
CREATE TABLE public.help_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES public.help_categories(id) ON DELETE SET NULL,
  module_key TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  translations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: help_articles (Articles de documentation)
CREATE TABLE public.help_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.help_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  keywords TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  video_url TEXT,
  steps JSONB DEFAULT '[]',
  faq_items JSONB DEFAULT '[]',
  translations JSONB DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: help_history (Historique des consultations)
CREATE TABLE public.help_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  article_id UUID REFERENCES public.help_articles(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  search_query TEXT,
  helpful_vote BOOLEAN
);

-- Table: help_settings (Configuration du module d'aide)
CREATE TABLE public.help_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  show_video_tutorials BOOLEAN DEFAULT true,
  enable_search_analytics BOOLEAN DEFAULT true,
  max_recent_items INTEGER DEFAULT 10,
  default_language TEXT DEFAULT 'fr',
  ai_suggestions_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for help_categories
CREATE POLICY "Users can view help categories for their tenant"
  ON public.help_categories FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can manage help categories"
  ON public.help_categories FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() AND role IN ('Admin', 'Manager', 'Gérant')));

-- RLS Policies for help_articles
CREATE POLICY "Users can view help articles for their tenant"
  ON public.help_articles FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can manage help articles"
  ON public.help_articles FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() AND role IN ('Admin', 'Manager', 'Gérant')));

-- RLS Policies for help_history
CREATE POLICY "Users can view their own help history"
  ON public.help_history FOR SELECT
  USING (user_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() AND role IN ('Admin', 'Manager')));

CREATE POLICY "Users can create their own help history"
  ON public.help_history FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their own help history"
  ON public.help_history FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for help_settings
CREATE POLICY "Users can view help settings for their tenant"
  ON public.help_settings FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can manage help settings"
  ON public.help_settings FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() AND role IN ('Admin', 'Manager', 'Gérant')));

-- Indexes for performance
CREATE INDEX idx_help_categories_tenant ON public.help_categories(tenant_id);
CREATE INDEX idx_help_categories_parent ON public.help_categories(parent_id);
CREATE INDEX idx_help_categories_module ON public.help_categories(module_key);
CREATE INDEX idx_help_articles_tenant ON public.help_articles(tenant_id);
CREATE INDEX idx_help_articles_category ON public.help_articles(category_id);
CREATE INDEX idx_help_articles_keywords ON public.help_articles USING GIN(keywords);
CREATE INDEX idx_help_history_tenant ON public.help_history(tenant_id);
CREATE INDEX idx_help_history_user ON public.help_history(user_id);
CREATE INDEX idx_help_history_article ON public.help_history(article_id);

-- Full-text search index for articles
CREATE INDEX idx_help_articles_search ON public.help_articles 
  USING GIN(to_tsvector('french', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(summary, '')));

-- Triggers for updated_at
CREATE TRIGGER update_help_categories_updated_at
  BEFORE UPDATE ON public.help_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_settings_updated_at
  BEFORE UPDATE ON public.help_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RPC Functions
-- =============================================

-- Function: search_help_articles (Full-text search with module filtering)
CREATE OR REPLACE FUNCTION public.search_help_articles(
  p_tenant_id UUID,
  p_query TEXT,
  p_language TEXT DEFAULT 'fr',
  p_module TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  content TEXT,
  category_id UUID,
  category_name TEXT,
  module_key TEXT,
  keywords TEXT[],
  video_url TEXT,
  view_count INTEGER,
  is_featured BOOLEAN,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    COALESCE(a.translations->>p_language->>'title', a.title)::TEXT as title,
    COALESCE(a.translations->>p_language->>'summary', a.summary)::TEXT as summary,
    COALESCE(a.translations->>p_language->>'content', a.content)::TEXT as content,
    a.category_id,
    COALESCE(c.translations->>p_language->>'name', c.name)::TEXT as category_name,
    c.module_key,
    a.keywords,
    a.video_url,
    a.view_count,
    a.is_featured,
    ts_rank(
      to_tsvector('french', a.title || ' ' || COALESCE(a.content, '') || ' ' || COALESCE(a.summary, '')),
      plainto_tsquery('french', p_query)
    ) as rank
  FROM public.help_articles a
  LEFT JOIN public.help_categories c ON a.category_id = c.id
  WHERE a.tenant_id = p_tenant_id
    AND a.is_active = true
    AND (p_module IS NULL OR c.module_key = p_module)
    AND (
      p_query = '' 
      OR to_tsvector('french', a.title || ' ' || COALESCE(a.content, '') || ' ' || COALESCE(a.summary, '')) 
         @@ plainto_tsquery('french', p_query)
      OR a.title ILIKE '%' || p_query || '%'
      OR a.summary ILIKE '%' || p_query || '%'
      OR p_query = ANY(a.keywords)
    )
  ORDER BY a.is_featured DESC, rank DESC, a.view_count DESC
  LIMIT p_limit;
END;
$$;

-- Function: get_help_metrics (Statistics for help usage)
CREATE OR REPLACE FUNCTION public.get_help_metrics(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_articles INTEGER;
  v_total_views INTEGER;
  v_popular_articles JSONB;
  v_frequent_searches JSONB;
  v_satisfaction_rate NUMERIC;
BEGIN
  -- Total articles count
  SELECT COUNT(*) INTO v_total_articles
  FROM public.help_articles
  WHERE tenant_id = p_tenant_id AND is_active = true;

  -- Total views in period
  SELECT COUNT(*) INTO v_total_views
  FROM public.help_history
  WHERE tenant_id = p_tenant_id
    AND accessed_at >= NOW() - (p_days || ' days')::INTERVAL;

  -- Top 5 popular articles
  SELECT COALESCE(jsonb_agg(article_data), '[]'::jsonb) INTO v_popular_articles
  FROM (
    SELECT jsonb_build_object(
      'id', a.id,
      'title', a.title,
      'views', COUNT(h.id)
    ) as article_data
    FROM public.help_articles a
    LEFT JOIN public.help_history h ON h.article_id = a.id
    WHERE a.tenant_id = p_tenant_id AND a.is_active = true
    GROUP BY a.id, a.title
    ORDER BY COUNT(h.id) DESC
    LIMIT 5
  ) sub;

  -- Top 10 frequent searches
  SELECT COALESCE(jsonb_agg(search_data), '[]'::jsonb) INTO v_frequent_searches
  FROM (
    SELECT jsonb_build_object(
      'query', search_query,
      'count', COUNT(*)
    ) as search_data
    FROM public.help_history
    WHERE tenant_id = p_tenant_id
      AND search_query IS NOT NULL
      AND search_query != ''
      AND accessed_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY search_query
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) sub;

  -- Satisfaction rate
  SELECT COALESCE(
    ROUND(
      (COUNT(*) FILTER (WHERE helpful_vote = true)::NUMERIC / 
       NULLIF(COUNT(*) FILTER (WHERE helpful_vote IS NOT NULL), 0)) * 100,
      1
    ),
    0
  ) INTO v_satisfaction_rate
  FROM public.help_history
  WHERE tenant_id = p_tenant_id
    AND accessed_at >= NOW() - (p_days || ' days')::INTERVAL;

  v_result := jsonb_build_object(
    'totalArticles', v_total_articles,
    'totalViews', v_total_views,
    'popularArticles', v_popular_articles,
    'frequentSearches', v_frequent_searches,
    'satisfactionRate', v_satisfaction_rate,
    'periodDays', p_days
  );

  RETURN v_result;
END;
$$;