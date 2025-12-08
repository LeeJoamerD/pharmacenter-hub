import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  tenant_id: string;
  module_key?: string;
  limit?: number;
  include_suggestions?: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  content: string;
  category_id: string;
  category_name: string;
  module_key: string;
  keywords: string[];
  relevance_score: number;
  match_type: 'exact' | 'partial' | 'keyword' | 'fuzzy';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, tenant_id, module_key, limit = 10, include_suggestions = true }: SearchRequest = await req.json();

    if (!query || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Query and tenant_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalize query for search
    const normalizedQuery = query.toLowerCase().trim();
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

    // Build the search query
    let articlesQuery = supabase
      .from('help_articles')
      .select(`
        id,
        title,
        summary,
        content,
        keywords,
        category_id,
        help_categories!inner(name, module_key)
      `)
      .eq('tenant_id', tenant_id)
      .eq('is_active', true);

    // Filter by module if specified
    if (module_key) {
      articlesQuery = articlesQuery.eq('help_categories.module_key', module_key);
    }

    const { data: articles, error: articlesError } = await articlesQuery;

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      throw articlesError;
    }

    // Score and rank articles
    const scoredResults: SearchResult[] = (articles || []).map(article => {
      const category = article.help_categories as { name: string; module_key: string };
      let score = 0;
      let matchType: 'exact' | 'partial' | 'keyword' | 'fuzzy' = 'fuzzy';

      const titleLower = article.title.toLowerCase();
      const summaryLower = article.summary?.toLowerCase() || '';
      const contentLower = article.content?.toLowerCase() || '';
      const keywordsLower = (article.keywords || []).map((k: string) => k.toLowerCase());

      // Exact title match (highest priority)
      if (titleLower === normalizedQuery) {
        score += 100;
        matchType = 'exact';
      } else if (titleLower.includes(normalizedQuery)) {
        score += 80;
        matchType = 'partial';
      }

      // Exact summary match
      if (summaryLower.includes(normalizedQuery)) {
        score += 60;
        if (matchType === 'fuzzy') matchType = 'partial';
      }

      // Keyword matches
      for (const keyword of keywordsLower) {
        if (keyword === normalizedQuery) {
          score += 70;
          matchType = matchType === 'fuzzy' ? 'keyword' : matchType;
        } else if (keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword)) {
          score += 40;
          matchType = matchType === 'fuzzy' ? 'keyword' : matchType;
        }
      }

      // Word-by-word matching
      for (const word of queryWords) {
        if (titleLower.includes(word)) score += 25;
        if (summaryLower.includes(word)) score += 15;
        if (contentLower.includes(word)) score += 10;
        if (keywordsLower.some((k: string) => k.includes(word))) score += 20;
      }

      // Content deep search
      if (contentLower.includes(normalizedQuery)) {
        score += 30;
      }

      return {
        id: article.id,
        title: article.title,
        summary: article.summary || '',
        content: article.content || '',
        category_id: article.category_id,
        category_name: category.name,
        module_key: category.module_key,
        keywords: article.keywords || [],
        relevance_score: score,
        match_type: matchType
      };
    })
    .filter(result => result.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);

    // Generate smart suggestions if enabled
    let suggestions: string[] = [];
    if (include_suggestions && scoredResults.length > 0) {
      const allKeywords = new Set<string>();
      scoredResults.forEach(result => {
        result.keywords.forEach(k => allKeywords.add(k));
      });
      
      suggestions = Array.from(allKeywords)
        .filter(k => k.toLowerCase() !== normalizedQuery && !queryWords.includes(k.toLowerCase()))
        .slice(0, 5);
    }

    // Log search for analytics
    try {
      await supabase.from('help_history').insert({
        tenant_id,
        article_id: scoredResults[0]?.id || null,
        action: 'search',
        metadata: {
          query: normalizedQuery,
          results_count: scoredResults.length,
          module_filter: module_key || null
        }
      });
    } catch (logError) {
      console.warn('Failed to log search:', logError);
    }

    return new Response(
      JSON.stringify({
        results: scoredResults,
        suggestions,
        total: scoredResults.length,
        query: normalizedQuery
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search help error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
