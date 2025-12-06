import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface StrategicRecommendation {
  id: string;
  tenant_id: string;
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  priority: number;
  estimated_roi: string | null;
  timeframe: string | null;
  effort: 'high' | 'medium' | 'low';
  factors: string[];
  actions: string[];
  status: 'new' | 'in-progress' | 'scheduled' | 'implemented' | 'rejected';
  scheduled_date: string | null;
  implemented_at: string | null;
  implemented_by: string | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  generated_by: string;
  ai_model_used: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RecommendationsMetrics {
  total_recommendations: number;
  new_recommendations: number;
  in_progress: number;
  scheduled: number;
  implemented: number;
  rejected: number;
  avg_confidence: number;
  high_impact_count: number;
  potential_roi: string;
}

export interface RecommendationFilters {
  category: string;
  status: string;
  sortBy: 'priority' | 'impact' | 'confidence';
}

const CATEGORIES = ['Assortiment', 'Pricing', 'Promotion', 'Fidélisation', 'Cross-selling'];

export function useStrategicRecommendations() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<StrategicRecommendation[]>([]);
  const [metrics, setMetrics] = useState<RecommendationsMetrics>({
    total_recommendations: 0,
    new_recommendations: 0,
    in_progress: 0,
    scheduled: 0,
    implemented: 0,
    rejected: 0,
    avg_confidence: 0,
    high_impact_count: 0,
    potential_roi: '€0'
  });
  const [filters, setFilters] = useState<RecommendationFilters>({
    category: 'all',
    status: 'all',
    sortBy: 'priority'
  });

  // Load recommendations from database
  const loadRecommendations = useCallback(async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('ai_strategic_recommendations')
        .select('*')
        .eq('tenant_id', tenantId);
      
      // Apply category filter
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      
      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      // Apply sorting
      switch (filters.sortBy) {
        case 'priority':
          query = query.order('priority', { ascending: true });
          break;
        case 'impact':
          query = query.order('impact', { ascending: false });
          break;
        case 'confidence':
          query = query.order('confidence', { ascending: false });
          break;
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data to match interface
      const transformedData: StrategicRecommendation[] = (data || []).map(item => ({
        ...item,
        impact: item.impact as 'high' | 'medium' | 'low',
        effort: item.effort as 'high' | 'medium' | 'low',
        status: item.status as 'new' | 'in-progress' | 'scheduled' | 'implemented' | 'rejected',
        factors: Array.isArray(item.factors) ? item.factors as string[] : [],
        actions: Array.isArray(item.actions) ? item.actions as string[] : [],
        metadata: typeof item.metadata === 'object' && item.metadata !== null ? item.metadata as Record<string, unknown> : {}
      }));
      
      setRecommendations(transformedData);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Erreur lors du chargement des recommandations');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters]);

  // Load metrics from RPC
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_recommendations_metrics', {
        p_tenant_id: tenantId
      });
      
      if (error) throw error;
      
      if (data && typeof data === 'object') {
        setMetrics(data as unknown as RecommendationsMetrics);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [tenantId]);

  // Generate recommendations via RPC
  const generateRecommendations = useCallback(async () => {
    if (!tenantId) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_strategic_recommendations', {
        p_tenant_id: tenantId
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; recommendations_created: number };
      
      if (result?.success) {
        toast.success(`${result.recommendations_created} nouvelles recommandations générées`);
        await loadRecommendations();
        await loadMetrics();
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Erreur lors de la génération des recommandations');
    } finally {
      setGenerating(false);
    }
  }, [tenantId, loadRecommendations, loadMetrics]);

  // Implement a recommendation
  const implementRecommendation = useCallback(async (id: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_strategic_recommendations')
        .update({
          status: 'implemented',
          implemented_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      toast.success('Recommandation marquée comme implémentée');
      await loadRecommendations();
      await loadMetrics();
    } catch (error) {
      console.error('Error implementing recommendation:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [tenantId, loadRecommendations, loadMetrics]);

  // Start progress on a recommendation
  const startProgress = useCallback(async (id: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_strategic_recommendations')
        .update({ status: 'in-progress' })
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      toast.success('Recommandation en cours de traitement');
      await loadRecommendations();
      await loadMetrics();
    } catch (error) {
      console.error('Error starting progress:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [tenantId, loadRecommendations, loadMetrics]);

  // Reject a recommendation
  const rejectRecommendation = useCallback(async (id: string, reason: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_strategic_recommendations')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      toast.success('Recommandation rejetée');
      await loadRecommendations();
      await loadMetrics();
    } catch (error) {
      console.error('Error rejecting recommendation:', error);
      toast.error('Erreur lors du rejet');
    }
  }, [tenantId, loadRecommendations, loadMetrics]);

  // Schedule a recommendation
  const scheduleRecommendation = useCallback(async (id: string, date: Date) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_strategic_recommendations')
        .update({
          status: 'scheduled',
          scheduled_date: date.toISOString().split('T')[0]
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      toast.success('Recommandation programmée');
      await loadRecommendations();
      await loadMetrics();
    } catch (error) {
      console.error('Error scheduling recommendation:', error);
      toast.error('Erreur lors de la programmation');
    }
  }, [tenantId, loadRecommendations, loadMetrics]);

  // Delete a recommendation
  const deleteRecommendation = useCallback(async (id: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_strategic_recommendations')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      toast.success('Recommandation supprimée');
      await loadRecommendations();
      await loadMetrics();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [tenantId, loadRecommendations, loadMetrics]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([loadRecommendations(), loadMetrics()]);
  }, [loadRecommendations, loadMetrics]);

  // Initial load
  useEffect(() => {
    if (tenantId) {
      refreshData();
    }
  }, [tenantId, refreshData]);

  // Reload when filters change
  useEffect(() => {
    if (tenantId) {
      loadRecommendations();
    }
  }, [filters, tenantId, loadRecommendations]);

  return {
    // States
    loading,
    generating,
    
    // Data
    recommendations,
    metrics,
    categories: CATEGORIES,
    
    // Filters
    filters,
    setFilters,
    
    // Actions
    loadRecommendations,
    generateRecommendations,
    implementRecommendation,
    startProgress,
    rejectRecommendation,
    scheduleRecommendation,
    deleteRecommendation,
    refreshData
  };
}
