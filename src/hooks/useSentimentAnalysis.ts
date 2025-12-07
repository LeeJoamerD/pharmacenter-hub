import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface SentimentAnalysis {
  id: string;
  tenant_id: string;
  text: string;
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  score: number;
  emotions: string[];
  category: string | null;
  source: string;
  client_id: string | null;
  keywords: string[];
  analysis_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SentimentKeyword {
  id: string;
  tenant_id: string;
  word: string;
  sentiment: 'positive' | 'negative';
  frequency: number;
  impact: 'low' | 'medium' | 'high';
  last_detected_at: string;
  created_at: string;
}

export interface SentimentSettings {
  id: string;
  tenant_id: string;
  auto_analysis_enabled: boolean;
  default_model: string;
  categories: string[];
  sources: string[];
  notification_threshold: number;
  retention_days: number;
}

export interface SentimentMetrics {
  totalAnalyses: number;
  globalScore: number;
  positiveRate: number;
  neutralRate: number;
  negativeRate: number;
  distribution: Array<{ sentiment: string; count: number; percentage: number }>;
  categoryBreakdown: Array<{ category: string; score: number; volume: number; trend: string }>;
  trend: Array<{ date: string; positive: number; neutral: number; negative: number; avgScore: number }>;
}

export interface SentimentFilters {
  sentiment?: string;
  category?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface RealTimeAnalysisResult {
  sentiment: string;
  score: number;
  emotions: string[];
  keywords: string[];
}

export const useSentimentAnalysis = () => {
  const { tenantId } = useTenant();
  const [analyses, setAnalyses] = useState<SentimentAnalysis[]>([]);
  const [keywords, setKeywords] = useState<SentimentKeyword[]>([]);
  const [settings, setSettings] = useState<SentimentSettings | null>(null);
  const [metrics, setMetrics] = useState<SentimentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load analyses with filters
  const loadAnalyses = useCallback(async (filters?: SentimentFilters) => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('ai_sentiment_analyses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (filters?.sentiment) {
        query = query.eq('sentiment', filters.sentiment);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setAnalyses((data || []) as SentimentAnalysis[]);
    } catch (error) {
      console.error('Error loading analyses:', error);
      toast.error('Erreur lors du chargement des analyses');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  // Load metrics
  const loadMetrics = useCallback(async (days: number = 30) => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase.rpc('calculate_sentiment_metrics', {
        p_tenant_id: tenantId,
        p_days: days
      });

      if (error) throw error;
      setMetrics(data as unknown as SentimentMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [tenantId]);

  // Load keywords
  const loadKeywords = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_sentiment_keywords')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('frequency', { ascending: false });

      if (error) throw error;
      setKeywords((data || []) as SentimentKeyword[]);
    } catch (error) {
      console.error('Error loading keywords:', error);
    }
  }, [tenantId]);

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_sentiment_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          ...data,
          categories: Array.isArray(data.categories) ? data.categories : JSON.parse(data.categories as string || '[]'),
          sources: Array.isArray(data.sources) ? data.sources : JSON.parse(data.sources as string || '[]')
        } as SentimentSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, [tenantId]);

  // Save settings
  const saveSettings = useCallback(async (newSettings: Partial<SentimentSettings>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_sentiment_settings')
        .upsert({
          tenant_id: tenantId,
          ...newSettings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' });

      if (error) throw error;
      
      toast.success('Paramètres sauvegardés');
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [tenantId, loadSettings]);

  // Create analysis manually
  const createAnalysis = useCallback(async (
    text: string, 
    source: string, 
    category?: string
  ) => {
    if (!tenantId) return null;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: {
          text,
          tenant_id: tenantId,
          source,
          category,
          save_result: true
        }
      });

      if (error) throw error;
      
      toast.success('Analyse effectuée');
      await loadAnalyses();
      await loadMetrics();
      await loadKeywords();
      
      return data;
    } catch (error) {
      console.error('Error creating analysis:', error);
      toast.error('Erreur lors de l\'analyse');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [tenantId, loadAnalyses, loadMetrics, loadKeywords]);

  // Analyze text in real-time without saving
  const analyzeTextRealtime = useCallback(async (text: string): Promise<RealTimeAnalysisResult | null> => {
    if (!tenantId) return null;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: {
          text,
          tenant_id: tenantId,
          save_result: false
        }
      });

      if (error) throw error;
      return data.result as RealTimeAnalysisResult;
    } catch (error) {
      console.error('Error analyzing text:', error);
      toast.error('Erreur lors de l\'analyse');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [tenantId]);

  // Delete analysis
  const deleteAnalysis = useCallback(async (id: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_sentiment_analyses')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Analyse supprimée');
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [tenantId]);

  // Update keyword impact
  const updateKeywordImpact = useCallback(async (id: string, impact: 'low' | 'medium' | 'high') => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_sentiment_keywords')
        .update({ impact, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Impact mis à jour');
      await loadKeywords();
    } catch (error) {
      console.error('Error updating keyword:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [tenantId, loadKeywords]);

  // Delete keyword
  const deleteKeyword = useCallback(async (id: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_sentiment_keywords')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Mot-clé supprimé');
      setKeywords(prev => prev.filter(k => k.id !== id));
    } catch (error) {
      console.error('Error deleting keyword:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [tenantId]);

  // Get sentiment distribution for charts
  const getSentimentDistribution = useCallback(() => {
    if (!metrics?.distribution) {
      return [
        { name: 'Très Positif', value: 0, color: '#10b981', count: 0 },
        { name: 'Positif', value: 0, color: '#34d399', count: 0 },
        { name: 'Neutre', value: 0, color: '#6b7280', count: 0 },
        { name: 'Négatif', value: 0, color: '#f59e0b', count: 0 },
        { name: 'Très Négatif', value: 0, color: '#ef4444', count: 0 }
      ];
    }

    const sentimentLabels: Record<string, { name: string; color: string }> = {
      'very_positive': { name: 'Très Positif', color: '#10b981' },
      'positive': { name: 'Positif', color: '#34d399' },
      'neutral': { name: 'Neutre', color: '#6b7280' },
      'negative': { name: 'Négatif', color: '#f59e0b' },
      'very_negative': { name: 'Très Négatif', color: '#ef4444' }
    };

    return metrics.distribution.map(d => ({
      name: sentimentLabels[d.sentiment]?.name || d.sentiment,
      value: d.percentage,
      color: sentimentLabels[d.sentiment]?.color || '#6b7280',
      count: d.count
    }));
  }, [metrics]);

  // Initial load
  useEffect(() => {
    if (tenantId) {
      loadAnalyses();
      loadMetrics();
      loadKeywords();
      loadSettings();
    }
  }, [tenantId, loadAnalyses, loadMetrics, loadKeywords, loadSettings]);

  return {
    // Data
    analyses,
    keywords,
    settings,
    metrics,
    
    // States
    isLoading,
    isAnalyzing,
    
    // Actions
    loadAnalyses,
    loadMetrics,
    loadKeywords,
    loadSettings,
    saveSettings,
    createAnalysis,
    analyzeTextRealtime,
    deleteAnalysis,
    updateKeywordImpact,
    deleteKeyword,
    getSentimentDistribution
  };
};
