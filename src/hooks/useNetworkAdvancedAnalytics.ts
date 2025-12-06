import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  unit?: string;
  target?: number;
}

export interface NetworkInsight {
  id: string;
  type: 'performance' | 'usage' | 'efficiency' | 'growth';
  title: string;
  description: string | null;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  pharmacies_involved: string[];
  metric_change: number | null;
  is_applied: boolean;
  applied_at: string | null;
  is_dismissed: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface HeatmapData {
  pharmacy_id: string;
  pharmacy_name: string;
  activity_score: number;
  collaboration_score: number;
  efficiency_score: number;
  overall_score: number;
  messages_count?: number;
  collaborations_count?: number;
}

export interface TimeSeriesData {
  timestamp: string;
  messages: number;
  active_users: number;
  collaborations: number;
  response_time: number;
}

export interface ActivityDistribution {
  type: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CollaborationStats {
  activeProjects: Array<{
    id: string;
    name: string;
    participant_count: number;
    status: string;
    progress: number;
  }>;
  pharmacyEngagement: Array<{
    pharmacy_id: string;
    pharmacy_name: string;
    engagement_rate: number;
  }>;
  trends: {
    new_collaborations: number;
    new_collaborations_change: number;
    completion_rate: number;
    average_satisfaction: number;
  };
}

export const useNetworkAdvancedAnalytics = () => {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<NetworkInsight[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [activityDistribution, setActivityDistribution] = useState<ActivityDistribution[]>([]);
  const [collaborationStats, setCollaborationStats] = useState<CollaborationStats | null>(null);

  // Load metrics from RPC
  const loadMetrics = useCallback(async (timeframe: string = '7d') => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase.rpc('calculate_network_analytics_metrics', {
        p_tenant_id: tenantId,
        p_timeframe: timeframe
      });

      if (error) throw error;

      if (data) {
        const d = data as Record<string, any>;
        const metricsData: AnalyticsMetric[] = [
          {
            id: '1',
            name: 'Messages échangés',
            value: d.messages?.value || 0,
            change: d.messages?.change || 0,
            trend: d.messages?.trend || 'stable',
            category: 'communication',
            unit: ' messages',
            target: d.messages?.target
          },
          {
            id: '2',
            name: 'Temps de réponse moyen',
            value: d.response_time?.value || 2.5,
            change: d.response_time?.change || 0,
            trend: d.response_time?.trend || 'stable',
            category: 'performance',
            unit: ' min',
            target: d.response_time?.target
          },
          {
            id: '3',
            name: 'Collaborations actives',
            value: d.collaborations?.value || 0,
            change: d.collaborations?.change || 0,
            trend: d.collaborations?.trend || 'stable',
            category: 'collaboration',
            unit: ' projets'
          },
          {
            id: '4',
            name: 'Taux d\'engagement',
            value: d.engagement_rate?.value || 75,
            change: d.engagement_rate?.change || 0,
            trend: d.engagement_rate?.trend || 'stable',
            category: 'engagement',
            unit: '%',
            target: d.engagement_rate?.target
          },
          {
            id: '5',
            name: 'Efficacité réseau',
            value: d.network_efficiency?.value || 85,
            change: d.network_efficiency?.change || 0,
            trend: d.network_efficiency?.trend || 'stable',
            category: 'efficiency',
            unit: '%',
            target: d.network_efficiency?.target
          },
          {
            id: '6',
            name: 'Utilisateurs actifs',
            value: d.active_users?.value || 0,
            change: d.active_users?.change || 0,
            trend: d.active_users?.trend || 'stable',
            category: 'users',
            unit: ' utilisateurs'
          }
        ];
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [tenantId]);

  // Load insights from database
  const loadInsights = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('network_analytics_insights')
        .select('*')
        .or(`tenant_id.eq.${tenantId},pharmacies_involved.cs.{${tenantId}}`)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedInsights: NetworkInsight[] = (data || []).map(item => ({
        id: item.id,
        type: item.insight_type as NetworkInsight['type'],
        title: item.title,
        description: item.description,
        impact: item.impact as NetworkInsight['impact'],
        confidence: Number(item.confidence) || 0.5,
        pharmacies_involved: item.pharmacies_involved || [],
        metric_change: item.metric_change ? Number(item.metric_change) : null,
        is_applied: item.is_applied || false,
        applied_at: item.applied_at,
        is_dismissed: item.is_dismissed || false,
        created_at: item.created_at,
        metadata: (item.metadata as Record<string, unknown>) || {}
      }));

      setInsights(formattedInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  }, [tenantId]);

  // Load heatmap data from RPC
  const loadHeatmapData = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase.rpc('generate_network_heatmap_data', {
        p_tenant_id: tenantId
      });

      if (error) throw error;

      if (Array.isArray(data)) {
        setHeatmapData(data as unknown as HeatmapData[]);
      }
    } catch (error) {
      console.error('Error loading heatmap data:', error);
    }
  }, [tenantId]);

  // Load time series data from RPC
  const loadTimeSeriesData = useCallback(async (timeframe: string = '7d') => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase.rpc('get_network_time_series_data', {
        p_tenant_id: tenantId,
        p_timeframe: timeframe
      });

      if (error) throw error;

      if (Array.isArray(data)) {
        setTimeSeriesData(data as unknown as TimeSeriesData[]);
      }
    } catch (error) {
      console.error('Error loading time series data:', error);
    }
  }, [tenantId]);

  // Load activity distribution from RPC
  const loadActivityDistribution = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase.rpc('get_network_activity_distribution', {
        p_tenant_id: tenantId
      });

      if (error) throw error;

      if (data) {
        const d = data as Record<string, any>;
        const distribution: ActivityDistribution[] = [
          {
            type: 'direct_messages',
            label: 'Messages directs',
            count: d.direct_messages?.count || 0,
            percentage: d.direct_messages?.percentage || 0,
            color: 'hsl(var(--primary))'
          },
          {
            type: 'collaborations',
            label: 'Collaborations',
            count: d.collaborations?.count || 0,
            percentage: d.collaborations?.percentage || 0,
            color: 'hsl(217, 91%, 60%)'
          },
          {
            type: 'documents',
            label: 'Partage documents',
            count: d.documents?.count || 0,
            percentage: d.documents?.percentage || 0,
            color: 'hsl(142, 76%, 36%)'
          },
          {
            type: 'ai_assistant',
            label: 'IA Assistant',
            count: d.ai_assistant?.count || 0,
            percentage: d.ai_assistant?.percentage || 0,
            color: 'hsl(48, 96%, 53%)'
          }
        ];
        setActivityDistribution(distribution);
      }
    } catch (error) {
      console.error('Error loading activity distribution:', error);
    }
  }, [tenantId]);

  // Load collaboration analytics from RPC
  const loadCollaborationStats = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase.rpc('get_collaboration_analytics', {
        p_tenant_id: tenantId
      });

      if (error) throw error;

      if (data) {
        const d = data as Record<string, any>;
        setCollaborationStats({
          activeProjects: d.active_projects || [],
          pharmacyEngagement: d.pharmacy_engagement || [],
          trends: d.trends || {
            new_collaborations: 0,
            new_collaborations_change: 0,
            completion_rate: 85,
            average_satisfaction: 4.2
          }
        });
      }
    } catch (error) {
      console.error('Error loading collaboration stats:', error);
    }
  }, [tenantId]);

  // Load all analytics data
  const loadAllAnalytics = useCallback(async (timeframe: string = '7d') => {
    setLoading(true);
    try {
      await Promise.all([
        loadMetrics(timeframe),
        loadInsights(),
        loadHeatmapData(),
        loadTimeSeriesData(timeframe),
        loadActivityDistribution(),
        loadCollaborationStats()
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Erreur lors du chargement des analytics');
    } finally {
      setLoading(false);
    }
  }, [loadMetrics, loadInsights, loadHeatmapData, loadTimeSeriesData, loadActivityDistribution, loadCollaborationStats]);

  // Apply an insight
  const applyInsight = useCallback(async (insightId: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('network_analytics_insights')
        .update({
          is_applied: true,
          applied_at: new Date().toISOString()
        })
        .eq('id', insightId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success('Insight appliqué avec succès');
      await loadInsights();
    } catch (error) {
      console.error('Error applying insight:', error);
      toast.error('Erreur lors de l\'application de l\'insight');
    }
  }, [tenantId, loadInsights]);

  // Dismiss an insight
  const dismissInsight = useCallback(async (insightId: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('network_analytics_insights')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString()
        })
        .eq('id', insightId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success('Insight ignoré');
      await loadInsights();
    } catch (error) {
      console.error('Error dismissing insight:', error);
      toast.error('Erreur lors de l\'ignorance de l\'insight');
    }
  }, [tenantId, loadInsights]);

  // Generate new insights based on analytics data
  const generateInsights = useCallback(async () => {
    if (!tenantId) return;

    try {
      // Get current metrics to analyze
      const { data: metricsData } = await supabase.rpc('calculate_network_analytics_metrics', {
        p_tenant_id: tenantId,
        p_timeframe: '7d'
      });

      if (!metricsData) return;

      const md = metricsData as Record<string, any>;
      const newInsights: Array<Omit<NetworkInsight, 'id' | 'created_at' | 'is_applied' | 'applied_at' | 'is_dismissed' | 'metadata'>> = [];

      // Generate insights based on metrics
      if (md.response_time?.change < -5) {
        newInsights.push({
          type: 'performance',
          title: 'Amélioration du temps de réponse',
          description: `Le temps de réponse moyen a diminué de ${Math.abs(md.response_time.change).toFixed(1)}% cette période.`,
          impact: 'positive',
          confidence: 0.92,
          pharmacies_involved: [tenantId],
          metric_change: md.response_time.change
        });
      }

      if (md.engagement_rate?.value > 80) {
        newInsights.push({
          type: 'usage',
          title: 'Fort taux d\'engagement',
          description: `Le taux d\'engagement réseau est excellent à ${md.engagement_rate.value.toFixed(1)}%.`,
          impact: 'positive',
          confidence: 0.88,
          pharmacies_involved: [tenantId],
          metric_change: md.engagement_rate.change
        });
      }

      if (md.collaborations?.change > 10) {
        newInsights.push({
          type: 'efficiency',
          title: 'Augmentation des collaborations',
          description: `Les projets collaboratifs ont augmenté de ${md.collaborations.change.toFixed(1)}%.`,
          impact: 'positive',
          confidence: 0.95,
          pharmacies_involved: [tenantId],
          metric_change: md.collaborations.change
        });
      }

      // Insert new insights
      for (const insight of newInsights) {
        await supabase.from('network_analytics_insights').insert({
          tenant_id: tenantId,
          insight_type: insight.type,
          title: insight.title,
          description: insight.description,
          impact: insight.impact,
          confidence: insight.confidence,
          pharmacies_involved: insight.pharmacies_involved,
          metric_change: insight.metric_change
        });
      }

      if (newInsights.length > 0) {
        toast.success(`${newInsights.length} nouvel(s) insight(s) généré(s)`);
        await loadInsights();
      } else {
        toast.info('Aucun nouvel insight à générer pour le moment');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Erreur lors de la génération des insights');
    }
  }, [tenantId, loadInsights]);

  // Get insight by ID
  const getInsightById = useCallback((insightId: string): NetworkInsight | undefined => {
    return insights.find(i => i.id === insightId);
  }, [insights]);

  return {
    loading,
    metrics,
    insights,
    heatmapData,
    timeSeriesData,
    activityDistribution,
    collaborationStats,
    loadMetrics,
    loadInsights,
    loadHeatmapData,
    loadTimeSeriesData,
    loadActivityDistribution,
    loadCollaborationStats,
    loadAllAnalytics,
    applyInsight,
    dismissInsight,
    generateInsights,
    getInsightById
  };
};
