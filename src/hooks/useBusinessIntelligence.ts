import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

// Types
export interface BIMetrics {
  churn_prediction: number;
  avg_ltv: number;
  average_ltv: number; // Alias for compatibility
  next_best_action: string;
  risk_score: number;
  total_clients: number;
  at_risk_clients: number;
  total_patterns: number;
  actionable_patterns: number;
}

export interface ClientPrediction {
  id: string;
  client_id: string | null;
  prediction_type: string;
  segment: string | null;
  predicted_value: number | null;
  confidence: number;
  risk_level: string | null;
  factors: Json;
  valid_until: string | null;
  is_applied: boolean;
  created_at: string;
}

export interface BusinessPattern {
  id: string;
  pattern_name: string;
  description: string | null;
  confidence: number;
  frequency: string;
  impact: string;
  discovery_method: string;
  is_actionable: boolean;
  is_exploited: boolean;
  exploited_at: string | null;
  created_at: string;
}

export interface ClientSegment {
  id: string;
  segment_name: string;
  size: number;
  color: string;
  characteristics: string[];
  clv: number;
  next_action: string | null;
  is_active: boolean;
  is_auto_generated: boolean;
}

export interface ProcessOptimization {
  id: string;
  process_name: string;
  current_time_minutes: number;
  optimized_time_minutes: number;
  improvement_percentage: number;
  difficulty: string;
  roi: string;
  status: string;
  implementation_notes: string | null;
  implemented_at: string | null;
}

export interface BIConfig {
  id: string;
  auto_analysis_enabled: boolean;
  analysis_frequency: string;
  model_preferences: Json;
  notification_thresholds: Json;
  data_retention_days: number;
  enable_pattern_discovery: boolean;
  enable_auto_segmentation: boolean;
}

export const useBusinessIntelligence = () => {
  const { tenantId } = useTenant();

  // States
  const [metrics, setMetrics] = useState<BIMetrics | null>(null);
  const [predictions, setPredictions] = useState<ClientPrediction[]>([]);
  const [patterns, setPatterns] = useState<BusinessPattern[]>([]);
  const [segments, setSegments] = useState<ClientSegment[]>([]);
  const [processOptimizations, setProcessOptimizations] = useState<ProcessOptimization[]>([]);
  const [config, setConfig] = useState<BIConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load BI Metrics
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase.rpc('get_bi_metrics', { p_tenant_id: tenantId });
      if (error) throw error;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const metricsData = data as unknown as BIMetrics;
        // Add alias for compatibility
        metricsData.average_ltv = metricsData.avg_ltv;
        setMetrics(metricsData);
      }
    } catch (err) {
      console.error('Error loading BI metrics:', err);
    }
  }, [tenantId]);

  // Load Predictions
  const loadPredictions = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_bi_predictions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPredictions((data || []) as ClientPrediction[]);
    } catch (err) {
      console.error('Error loading predictions:', err);
    }
  }, [tenantId]);

  // Load Patterns
  const loadPatterns = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_bi_patterns')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('confidence', { ascending: false });
      if (error) throw error;
      setPatterns(data || []);
    } catch (err) {
      console.error('Error loading patterns:', err);
    }
  }, [tenantId]);

  // Load Segments
  const loadSegments = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_bi_segments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('size', { ascending: false });
      if (error) throw error;
      
      // Parse characteristics from JSONB
      const parsedSegments = (data || []).map(s => ({
        ...s,
        characteristics: Array.isArray(s.characteristics) ? s.characteristics.map(c => String(c)) : []
      }));
      setSegments(parsedSegments as ClientSegment[]);
    } catch (err) {
      console.error('Error loading segments:', err);
    }
  }, [tenantId]);

  // Load Process Optimizations
  const loadProcessOptimizations = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_bi_process_optimizations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('improvement_percentage', { ascending: false });
      if (error) throw error;
      setProcessOptimizations(data || []);
    } catch (err) {
      console.error('Error loading optimizations:', err);
    }
  }, [tenantId]);

  // Load Config
  const loadConfig = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_bi_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      setConfig(data as BIConfig | null);
    } catch (err) {
      console.error('Error loading config:', err);
    }
  }, [tenantId]);

  // Run Full Analysis
  const runFullAnalysis = async () => {
    if (!tenantId) return;
    setIsProcessing(true);
    try {
      // Calculate predictions
      await supabase.rpc('calculate_client_predictions', { p_tenant_id: tenantId });
      
      // Discover patterns
      await supabase.rpc('discover_business_patterns', { p_tenant_id: tenantId });
      
      // Auto segment clients
      await supabase.rpc('auto_segment_clients', { p_tenant_id: tenantId });
      
      // Analyze process optimization
      await supabase.rpc('analyze_process_optimization', { p_tenant_id: tenantId });
      
      // Reload all data
      await Promise.all([
        loadMetrics(),
        loadPredictions(),
        loadPatterns(),
        loadSegments(),
        loadProcessOptimizations()
      ]);

      toast({
        title: "Analyse complète",
        description: "L'analyse BI a été exécutée avec succès"
      });
    } catch (err) {
      console.error('Error running analysis:', err);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'analyse BI",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Predictive Analysis only
  const runPredictiveAnalysis = async () => {
    if (!tenantId) return;
    setIsProcessing(true);
    try {
      await supabase.rpc('calculate_client_predictions', { p_tenant_id: tenantId });
      await loadPredictions();
      await loadMetrics();
      toast({
        title: "Analyse prédictive terminée",
        description: "Les prédictions clients ont été recalculées"
      });
    } catch (err) {
      console.error('Error running predictive analysis:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Discover Patterns only
  const discoverPatterns = async () => {
    if (!tenantId) return;
    setIsProcessing(true);
    try {
      await supabase.rpc('discover_business_patterns', { p_tenant_id: tenantId });
      await loadPatterns();
      toast({
        title: "Découverte terminée",
        description: "De nouveaux patterns ont été identifiés"
      });
    } catch (err) {
      console.error('Error discovering patterns:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export Report
  const exportReport = async (
    type: 'predictions' | 'patterns' | 'segments' | 'optimizations' | 'full',
    format: 'pdf' | 'excel'
  ) => {
    // Import export utilities dynamically
    const { 
      exportBIPredictionsPDF, 
      exportBIPredictionsExcel,
      exportBIPatternsPDF,
      exportBIPatternsExcel,
      exportBISegmentsPDF,
      exportBISegmentsExcel,
      exportBIOptimizationsPDF,
      exportBIOptimizationsExcel,
      exportBIFullReportPDF,
      exportBIFullReportExcel
    } = await import('@/utils/biExportUtils');

    switch (type) {
      case 'predictions':
        if (format === 'pdf') exportBIPredictionsPDF(predictions);
        else exportBIPredictionsExcel(predictions);
        break;
      case 'patterns':
        if (format === 'pdf') exportBIPatternsPDF(patterns);
        else exportBIPatternsExcel(patterns);
        break;
      case 'segments':
        if (format === 'pdf') exportBISegmentsPDF(segments);
        else exportBISegmentsExcel(segments);
        break;
      case 'optimizations':
        if (format === 'pdf') exportBIOptimizationsPDF(processOptimizations);
        else exportBIOptimizationsExcel(processOptimizations);
        break;
      case 'full':
        if (format === 'pdf') exportBIFullReportPDF(metrics, predictions, patterns, segments, processOptimizations);
        else exportBIFullReportExcel(metrics, predictions, patterns, segments, processOptimizations);
        break;
    }
  };

  // Exploit Pattern
  const exploitPattern = async (patternId: string) => {
    if (!tenantId) return;
    try {
      const { error } = await supabase
        .from('ai_bi_patterns')
        .update({ 
          is_exploited: true, 
          exploited_at: new Date().toISOString() 
        })
        .eq('id', patternId)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      await loadPatterns();
      toast({
        title: "Pattern exploité",
        description: "Le pattern a été marqué comme exploité"
      });
    } catch (err) {
      console.error('Error exploiting pattern:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'exploiter ce pattern",
        variant: "destructive"
      });
    }
  };

  // Delete Pattern
  const deletePattern = async (patternId: string) => {
    if (!tenantId) return;
    try {
      const { error } = await supabase
        .from('ai_bi_patterns')
        .delete()
        .eq('id', patternId)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      await loadPatterns();
      toast({ title: "Pattern supprimé" });
    } catch (err) {
      console.error('Error deleting pattern:', err);
    }
  };

  // Create Segment
  const createSegment = async (segment: Partial<ClientSegment>) => {
    if (!tenantId) return;
    try {
      const { error } = await supabase
        .from('ai_bi_segments')
        .insert({
          tenant_id: tenantId,
          segment_name: segment.segment_name,
          size: segment.size || 0,
          color: segment.color || '#3b82f6',
          characteristics: segment.characteristics || [],
          clv: segment.clv || 0,
          next_action: segment.next_action,
          is_auto_generated: false
        });
      
      if (error) throw error;
      await loadSegments();
      toast({ title: "Segment créé" });
    } catch (err) {
      console.error('Error creating segment:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le segment",
        variant: "destructive"
      });
    }
  };

  // Update Segment
  const updateSegment = async (segmentId: string, updates: Partial<ClientSegment>) => {
    if (!tenantId) return;
    try {
      const { error } = await supabase
        .from('ai_bi_segments')
        .update(updates)
        .eq('id', segmentId)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      await loadSegments();
      toast({ title: "Segment mis à jour" });
    } catch (err) {
      console.error('Error updating segment:', err);
    }
  };

  // Delete Segment
  const deleteSegment = async (segmentId: string) => {
    if (!tenantId) return;
    try {
      const { error } = await supabase
        .from('ai_bi_segments')
        .delete()
        .eq('id', segmentId)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      await loadSegments();
      toast({ title: "Segment supprimé" });
    } catch (err) {
      console.error('Error deleting segment:', err);
    }
  };

  // Implement Optimization
  const implementOptimization = async (optimizationId: string, notes?: string) => {
    if (!tenantId) return;
    try {
      const { error } = await supabase
        .from('ai_bi_process_optimizations')
        .update({ 
          status: 'implemented',
          implemented_at: new Date().toISOString(),
          implementation_notes: notes
        })
        .eq('id', optimizationId)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      await loadProcessOptimizations();
      toast({
        title: "Optimisation implémentée",
        description: "Le processus a été marqué comme optimisé"
      });
    } catch (err) {
      console.error('Error implementing optimization:', err);
    }
  };

  // Reject Optimization
  const rejectOptimization = async (optimizationId: string) => {
    if (!tenantId) return;
    try {
      const { error } = await supabase
        .from('ai_bi_process_optimizations')
        .update({ status: 'rejected' })
        .eq('id', optimizationId)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      await loadProcessOptimizations();
    } catch (err) {
      console.error('Error rejecting optimization:', err);
    }
  };

  // Save Config
  const saveConfig = async (newConfig: Partial<BIConfig>) => {
    if (!tenantId) return;
    try {
      const { data: existing } = await supabase
        .from('ai_bi_config')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('ai_bi_config')
          .update(newConfig)
          .eq('tenant_id', tenantId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ai_bi_config')
          .insert({ tenant_id: tenantId, ...newConfig });
        if (error) throw error;
      }

      await loadConfig();
      toast({ title: "Configuration sauvegardée" });
    } catch (err) {
      console.error('Error saving config:', err);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    }
  };

  // AI Consultation
  const consultAI = async (
    consultationType: 'predictive' | 'pattern_discovery' | 'segmentation' | 'optimization',
    question: string,
    onChunk: (chunk: string) => void
  ): Promise<string> => {
    if (!tenantId) throw new Error('Tenant non défini');

    const context: Record<string, any> = {
      churn_rate: metrics?.churn_prediction,
      avg_ltv: metrics?.avg_ltv,
      total_clients: metrics?.total_clients,
      at_risk_clients: metrics?.at_risk_clients,
      risk_score: metrics?.risk_score,
      patterns_count: patterns.length,
      actionable_patterns: patterns.filter(p => p.is_actionable && !p.is_exploited).length,
      segments: segments,
      processes: processOptimizations
    };

    const response = await supabase.functions.invoke('bi-analytics-consultation', {
      body: {
        consultation_type: consultationType,
        context,
        question,
        tenant_id: tenantId
      }
    });

    if (response.error) throw response.error;

    // Handle streaming response
    const reader = response.data.getReader?.();
    if (!reader) {
      return response.data?.choices?.[0]?.message?.content || '';
    }

    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
      
      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            onChunk(content);
          }
        } catch {
          // Skip unparseable chunks
        }
      }
    }

    return fullResponse;
  };

  // Get aggregated predictions by segment
  const getPredictionsBySegment = useCallback(() => {
    const segmentMap: Record<string, {
      segment: string;
      totalClients: number;
      riskHigh: number;
      riskMedium: number;
      riskLow: number;
      averageLTV: number;
      retentionRate: number;
    }> = {};

    predictions.forEach(pred => {
      const seg = pred.segment || 'Autre';
      if (!segmentMap[seg]) {
        segmentMap[seg] = {
          segment: seg,
          totalClients: 0,
          riskHigh: 0,
          riskMedium: 0,
          riskLow: 0,
          averageLTV: 0,
          retentionRate: 0
        };
      }
      segmentMap[seg].totalClients++;
      if (pred.risk_level === 'high') segmentMap[seg].riskHigh++;
      else if (pred.risk_level === 'medium') segmentMap[seg].riskMedium++;
      else segmentMap[seg].riskLow++;
    });

    // Calculate retention rate and average LTV
    Object.values(segmentMap).forEach(seg => {
      seg.retentionRate = seg.totalClients > 0 
        ? Math.round(((seg.riskLow + seg.riskMedium * 0.5) / seg.totalClients) * 100 * 10) / 10
        : 0;
      seg.averageLTV = metrics?.avg_ltv || 0;
    });

    return Object.values(segmentMap);
  }, [predictions, metrics]);

  // Load all data on mount
  useEffect(() => {
    if (tenantId) {
      setLoading(true);
      Promise.all([
        loadMetrics(),
        loadPredictions(),
        loadPatterns(),
        loadSegments(),
        loadProcessOptimizations(),
        loadConfig()
      ]).finally(() => setLoading(false));
    }
  }, [tenantId, loadMetrics, loadPredictions, loadPatterns, loadSegments, loadProcessOptimizations, loadConfig]);

  return {
    // Data
    metrics,
    predictions,
    patterns,
    segments,
    processOptimizations,
    config,
    loading,
    isProcessing,

    // Actions
    loadMetrics,
    loadPredictions,
    loadPatterns,
    loadSegments,
    loadProcessOptimizations,
    loadConfig,
    runFullAnalysis,
    runPredictiveAnalysis,
    discoverPatterns,
    exploitPattern,
    deletePattern,
    createSegment,
    updateSegment,
    deleteSegment,
    implementOptimization,
    rejectOptimization,
    saveConfig,
    consultAI,
    exportReport,

    // Utilities
    getPredictionsBySegment,

    // Refresh
    refresh: () => Promise.all([
      loadMetrics(),
      loadPredictions(),
      loadPatterns(),
      loadSegments(),
      loadProcessOptimizations()
    ])
  };
};
