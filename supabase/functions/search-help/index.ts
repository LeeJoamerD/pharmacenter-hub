import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth validation ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: personnelData } = await supabaseAuth.from('personnel').select('tenant_id').eq('auth_user_id', user.id).single();
    if (!personnelData?.tenant_id) {
      return new Response(JSON.stringify({ error: 'Accès interdit' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const tenantId = personnelData.tenant_id;
    // --- End auth validation ---

    const { query, module_key, limit = 10, include_suggestions = true } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'La requête est requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const normalizedQuery = query.toLowerCase().trim();
    const queryWords = normalizedQuery.split(/\s+/).filter((w: string) => w.length > 2);

    let articlesQuery = supabase
      .from('help_articles')
      .select(`id, title, summary, content, keywords, category_id, help_categories!inner(name, module_key)`)
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (module_key) {
      articlesQuery = articlesQuery.eq('help_categories.module_key', module_key);
    }

    const { data: articles, error: articlesError } = await articlesQuery;

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      throw articlesError;
    }

    const scoredResults = (articles || []).map(article => {
      const category = article.help_categories as { name: string; module_key: string };
      let score = 0;
      let matchType: 'exact' | 'partial' | 'keyword' | 'fuzzy' = 'fuzzy';

      const titleLower = article.title.toLowerCase();
      const summaryLower = article.summary?.toLowerCase() || '';
      const contentLower = article.content?.toLowerCase() || '';
      const keywordsLower = (article.keywords || []).map((k: string) => k.toLowerCase());

      if (titleLower === normalizedQuery) { score += 100; matchType = 'exact'; }
      else if (titleLower.includes(normalizedQuery)) { score += 80; matchType = 'partial'; }
      if (summaryLower.includes(normalizedQuery)) { score += 60; if (matchType === 'fuzzy') matchType = 'partial'; }

      for (const keyword of keywordsLower) {
        if (keyword === normalizedQuery) { score += 70; matchType = matchType === 'fuzzy' ? 'keyword' : matchType; }
        else if (keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword)) { score += 40; matchType = matchType === 'fuzzy' ? 'keyword' : matchType; }
      }

      for (const word of queryWords) {
        if (titleLower.includes(word)) score += 25;
        if (summaryLower.includes(word)) score += 15;
        if (contentLower.includes(word)) score += 10;
        if (keywordsLower.some((k: string) => k.includes(word))) score += 20;
      }

      if (contentLower.includes(normalizedQuery)) score += 30;

      return {
        id: article.id, title: article.title, summary: article.summary || '', content: article.content || '',
        category_id: article.category_id, category_name: category.name, module_key: category.module_key,
        keywords: article.keywords || [], relevance_score: score, match_type: matchType
      };
    })
    .filter(result => result.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);

    let suggestions: string[] = [];
    if (include_suggestions && scoredResults.length > 0) {
      const allKeywords = new Set<string>();
      scoredResults.forEach(result => { result.keywords.forEach((k: string) => allKeywords.add(k)); });
      suggestions = Array.from(allKeywords)
        .filter(k => k.toLowerCase() !== normalizedQuery && !queryWords.includes(k.toLowerCase()))
        .slice(0, 5);
    }

    try {
      await supabase.from('help_history').insert({
        tenant_id: tenantId, article_id: scoredResults[0]?.id || null, action: 'search',
        metadata: { query: normalizedQuery, results_count: scoredResults.length, module_filter: module_key || null }
      });
    } catch (logError) {
      console.warn('Failed to log search:', logError);
    }

    return new Response(
      JSON.stringify({ results: scoredResults, suggestions, total: scoredResults.length, query: normalizedQuery }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search help error:', error);
    return new Response(
      JSON.stringify({ error: 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
