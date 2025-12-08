-- Fix JSONB operator syntax in search_help_articles function
-- The error was: operator does not exist: text ->> unknown
-- Problem: a.translations->>p_language->>'field' applies ->> twice
-- Solution: (a.translations->p_language)->>'field' uses -> then ->>

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
    COALESCE((a.translations->p_language)->>'title', a.title)::TEXT as title,
    COALESCE((a.translations->p_language)->>'summary', a.summary)::TEXT as summary,
    COALESCE((a.translations->p_language)->>'content', a.content)::TEXT as content,
    a.category_id,
    COALESCE((c.translations->p_language)->>'name', c.name)::TEXT as category_name,
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