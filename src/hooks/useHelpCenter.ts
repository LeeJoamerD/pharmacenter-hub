import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface HelpCategory {
  id: string;
  tenant_id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  module_key: string | null;
  order_index: number;
  is_active: boolean;
  translations: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HelpArticle {
  id: string;
  tenant_id: string;
  category_id: string | null;
  title: string;
  content: string;
  summary: string | null;
  keywords: string[];
  media_urls: string[];
  video_url: string | null;
  steps: any[];
  faq_items: any[];
  translations: Record<string, any>;
  view_count: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  module_key?: string;
}

export interface HelpHistory {
  id: string;
  tenant_id: string;
  user_id: string;
  article_id: string;
  accessed_at: string;
  search_query: string | null;
  helpful_vote: boolean | null;
}

export interface HelpSettings {
  id: string;
  tenant_id: string;
  show_video_tutorials: boolean;
  enable_search_analytics: boolean;
  max_recent_items: number;
  default_language: string;
  ai_suggestions_enabled: boolean;
}

export interface SearchResult extends HelpArticle {
  rank: number;
}

export function useHelpCenter() {
  const { pharmacy, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = pharmacy?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['help-categories', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('help_categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('order_index');
      if (error) throw error;
      return data as HelpCategory[];
    },
    enabled: !!tenantId,
  });

  // Fetch articles
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['help-articles', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('help_articles')
        .select(`
          *,
          help_categories (name, module_key)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('view_count', { ascending: false });
      if (error) throw error;
      return data.map((a: any) => ({
        ...a,
        category_name: a.help_categories?.name,
        module_key: a.help_categories?.module_key,
      })) as HelpArticle[];
    },
    enabled: !!tenantId,
  });

  // Fetch recent history
  const { data: recentHistory = [] } = useQuery({
    queryKey: ['help-history', tenantId, user?.id],
    queryFn: async () => {
      if (!tenantId || !user?.id) return [];
      const { data, error } = await supabase
        .from('help_history')
        .select(`
          *,
          help_articles (id, title, summary)
        `)
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .order('accessed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && !!user?.id,
  });

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['help-settings', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from('help_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data as HelpSettings | null;
    },
    enabled: !!tenantId,
  });

  // Search articles
  const searchArticles = useCallback(
    async (query: string, module?: string | null): Promise<SearchResult[]> => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase.rpc('search_help_articles', {
        p_tenant_id: tenantId,
        p_query: query,
        p_language: 'fr',
        p_module: module || null,
        p_limit: 20,
      });

      if (error) {
        console.error('Search error:', error);
        return [];
      }

      return (data || []) as SearchResult[];
    },
    [tenantId]
  );

  // Track article view
  const trackViewMutation = useMutation({
    mutationFn: async ({ articleId, searchQuery: sq }: { articleId: string; searchQuery?: string }) => {
      if (!tenantId || !user?.id) return;

      // Insert history
      await supabase.from('help_history').insert({
        tenant_id: tenantId,
        user_id: user.id,
        article_id: articleId,
        search_query: sq || null,
      });

      // Increment view count
      await supabase.rpc('search_help_articles', {
        p_tenant_id: tenantId,
        p_query: '',
        p_limit: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-history'] });
    },
  });

  // Vote helpful
  const voteHelpfulMutation = useMutation({
    mutationFn: async ({ historyId, isHelpful }: { historyId: string; isHelpful: boolean }) => {
      const { error } = await supabase
        .from('help_history')
        .update({ helpful_vote: isHelpful })
        .eq('id', historyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Merci pour votre retour !' });
      queryClient.invalidateQueries({ queryKey: ['help-history'] });
    },
  });

  // Create article (Admin)
  const createArticleMutation = useMutation({
    mutationFn: async (article: Partial<HelpArticle>) => {
      if (!tenantId) throw new Error('No tenant');
      const { data, error } = await supabase
        .from('help_articles')
        .insert([{ 
          title: article.title || '',
          content: article.content || '',
          summary: article.summary,
          category_id: article.category_id,
          keywords: article.keywords,
          video_url: article.video_url,
          is_featured: article.is_featured,
          tenant_id: tenantId 
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Article créé avec succès' });
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
    },
  });

  // Update article (Admin)
  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HelpArticle> & { id: string }) => {
      const { data, error } = await supabase
        .from('help_articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Article mis à jour' });
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
    },
  });

  // Delete article (Admin)
  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('help_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Article supprimé' });
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
    },
  });

  // Get articles by category
  const getArticlesByCategory = useCallback(
    (categoryId: string) => {
      return articles.filter((a) => a.category_id === categoryId);
    },
    [articles]
  );

  // Get articles by module
  const getArticlesByModule = useCallback(
    (moduleKey: string) => {
      return articles.filter((a) => a.module_key === moduleKey);
    },
    [articles]
  );

  // Get featured articles
  const featuredArticles = articles.filter((a) => a.is_featured);

  // Get FAQ items from all articles
  const faqItems = articles.flatMap((a) => 
    (a.faq_items || []).map((faq: any) => ({ ...faq, articleId: a.id, articleTitle: a.title }))
  );

  return {
    // Data
    categories,
    articles,
    recentHistory,
    settings,
    featuredArticles,
    faqItems,
    
    // Loading states
    isLoading: categoriesLoading || articlesLoading,
    
    // Search
    searchQuery,
    setSearchQuery,
    selectedModule,
    setSelectedModule,
    searchArticles,
    
    // Actions
    trackView: trackViewMutation.mutate,
    voteHelpful: voteHelpfulMutation.mutate,
    
    // Admin actions
    createArticle: createArticleMutation.mutate,
    updateArticle: updateArticleMutation.mutate,
    deleteArticle: deleteArticleMutation.mutate,
    
    // Helpers
    getArticlesByCategory,
    getArticlesByModule,
  };
}
