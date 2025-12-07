import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import type { StockPrediction } from '@/hooks/useAdvancedForecasting';

export interface AIStockConfig {
  id: string;
  tenant_id: string;
  auto_optimization_enabled: boolean;
  prediction_horizon_days: number;
  confidence_threshold: number;
  critical_alert_days: number;
  reorder_lead_time_days: number;
  safety_stock_multiplier: number;
  promotion_expiry_threshold_days: number;
  enable_fifo_alerts: boolean;
  enable_rotation_analysis: boolean;
  notification_settings: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface AIStockMetrics {
  optimization_score: number;
  total_predictions: number;
  active_predictions: number;
  critical_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  pending_suggestions: number;
  applied_suggestions: number;
  total_savings: number;
  products_analyzed: number;
  expiring_products: number;
  low_stock_count: number;
  fifo_violations: number;
  last_analysis_at: string | null;
  priority_distribution: {
    critical: number;
    medium: number;
    low: number;
  };
}

export interface AIStockSuggestion {
  type: 'reorder' | 'promotion' | 'fifo_correction';
  priority: 'critical' | 'high' | 'medium' | 'low';
  product_id?: string;
  product_name: string;
  product_code?: string;
  lot_id?: string;
  lot_number?: string;
  current_value: number;
  suggested_value?: number;
  recommended_qty?: number;
  days_until_expiry?: number;
  stock_value?: number;
  older_lot?: string;
  older_expiry?: string;
  older_qty?: number;
  newer_lot?: string;
  newer_expiry?: string;
  newer_qty?: number;
  reason: string;
  expected_benefit: {
    type: string;
    savings?: number;
    description: string;
  };
}

export interface AnalysisResult {
  success: boolean;
  predictions_created: number;
  critical_alerts: number;
  analyzed_at: string;
}

const defaultConfig: Omit<AIStockConfig, 'id' | 'tenant_id'> = {
  auto_optimization_enabled: false,
  prediction_horizon_days: 30,
  confidence_threshold: 70,
  critical_alert_days: 7,
  reorder_lead_time_days: 5,
  safety_stock_multiplier: 1.5,
  promotion_expiry_threshold_days: 30,
  enable_fifo_alerts: true,
  enable_rotation_analysis: true,
  notification_settings: { email: false, push: true, sms: false }
};

const defaultMetrics: AIStockMetrics = {
  optimization_score: 0,
  total_predictions: 0,
  active_predictions: 0,
  critical_alerts: 0,
  medium_alerts: 0,
  low_alerts: 0,
  pending_suggestions: 0,
  applied_suggestions: 0,
  total_savings: 0,
  products_analyzed: 0,
  expiring_products: 0,
  low_stock_count: 0,
  fifo_violations: 0,
  last_analysis_at: null,
  priority_distribution: { critical: 0, medium: 0, low: 0 }
};

export function useAIStockManagement() {
  const { tenantId } = useTenant();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<AIStockMetrics>(defaultMetrics);
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [suggestions, setSuggestions] = useState<AIStockSuggestion[]>([]);
  const [config, setConfig] = useState<AIStockConfig | null>(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Load metrics
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase.rpc('calculate_ai_stock_metrics', {
        p_tenant_id: tenantId
      });

      if (error) throw error;
      if (data) {
        setMetrics(data as unknown as AIStockMetrics);
      }
    } catch (error) {
      console.error('Error loading AI stock metrics:', error);
    }
  }, [tenantId]);

  // Load predictions
  const loadPredictions = useCallback(async () => {
    if (!tenantId) return;

    try {
      let query = supabase
        .from('ai_stock_predictions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('dismissed', false)
        .order('priority', { ascending: true })
        .order('days_until_stockout', { ascending: true });

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) {
        setPredictions(data as StockPrediction[]);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  }, [tenantId, priorityFilter]);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase.rpc('get_ai_stock_suggestions', {
        p_tenant_id: tenantId
      });

      if (error) throw error;

      if (data) {
        let filteredSuggestions = data as unknown as AIStockSuggestion[];
        
        if (typeFilter !== 'all') {
          filteredSuggestions = filteredSuggestions.filter(s => s.type === typeFilter);
        }
        
        setSuggestions(filteredSuggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }, [tenantId, typeFilter]);

  // Load config
  const loadConfig = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('ai_stock_optimization_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfig(data as unknown as AIStockConfig);
      } else {
        // Create default config
        const { data: newConfig, error: insertError } = await supabase
          .from('ai_stock_optimization_config')
          .insert({ tenant_id: tenantId })
          .select()
          .single();

        if (!insertError && newConfig) {
          setConfig(newConfig as unknown as AIStockConfig);
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }, [tenantId]);

  // Save config
  const saveConfig = useCallback(async (updates: Partial<AIStockConfig>) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('ai_stock_optimization_config')
        .upsert({
          tenant_id: tenantId,
          ...updates
        }, { onConflict: 'tenant_id' });

      if (error) throw error;

      toast({
        title: 'Configuration sauvegardée',
        description: 'Les paramètres ont été mis à jour'
      });

      await loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la configuration',
        variant: 'destructive'
      });
    }
  }, [tenantId, toast, loadConfig]);

  // Run analysis
  const runAnalysis = useCallback(async () => {
    if (!tenantId) return null;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.rpc('run_ai_stock_analysis', {
        p_tenant_id: tenantId
      });

      if (error) throw error;

      const result = data as unknown as AnalysisResult;

      toast({
        title: 'Analyse terminée',
        description: `${result.predictions_created} prédictions créées, ${result.critical_alerts} alertes critiques`
      });

      // Reload data
      await Promise.all([loadMetrics(), loadPredictions(), loadSuggestions()]);

      return result;
    } catch (error) {
      console.error('Error running analysis:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'exécuter l'analyse",
        variant: 'destructive'
      });
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [tenantId, toast, loadMetrics, loadPredictions, loadSuggestions]);

  // Create order from prediction
  const createOrderFromPrediction = useCallback(async (predictionId: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('ai_stock_predictions')
        .update({ order_created: true })
        .eq('id', predictionId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast({
        title: 'Commande initiée',
        description: 'La commande a été ajoutée à votre liste'
      });

      await loadPredictions();
      await loadMetrics();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande',
        variant: 'destructive'
      });
    }
  }, [tenantId, toast, loadPredictions, loadMetrics]);

  // Dismiss prediction
  const dismissPrediction = useCallback(async (predictionId: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('ai_stock_predictions')
        .update({ dismissed: true })
        .eq('id', predictionId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      await loadPredictions();
      await loadMetrics();
    } catch (error) {
      console.error('Error dismissing prediction:', error);
    }
  }, [tenantId, loadPredictions, loadMetrics]);

  // Apply suggestion (mark as applied in lot_optimization_suggestions)
  const applySuggestion = useCallback(async (suggestion: AIStockSuggestion) => {
    if (!tenantId) return;

    try {
      // If it's a reorder suggestion, mark order created
      if (suggestion.type === 'reorder' && suggestion.product_id) {
        // Update ai_stock_predictions to mark order created
        await supabase
          .from('ai_stock_predictions')
          .update({ order_created: true })
          .eq('produit_id', suggestion.product_id)
          .eq('tenant_id', tenantId);
      }

      toast({
        title: 'Suggestion appliquée',
        description: `Action pour "${suggestion.product_name}" enregistrée`
      });

      await Promise.all([loadSuggestions(), loadMetrics()]);
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'appliquer la suggestion",
        variant: 'destructive'
      });
    }
  }, [tenantId, toast, loadSuggestions, loadMetrics]);

  // Ignore suggestion
  const ignoreSuggestion = useCallback(async (suggestion: AIStockSuggestion) => {
    // For now, just remove from local state (suggestions are generated dynamically)
    setSuggestions(prev => prev.filter(s => 
      !(s.product_id === suggestion.product_id && s.type === suggestion.type)
    ));

    toast({
      title: 'Suggestion ignorée',
      description: `Suggestion pour "${suggestion.product_name}" ignorée`
    });
  }, [toast]);

  // Load all data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadPredictions(),
        loadSuggestions(),
        loadConfig()
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadMetrics, loadPredictions, loadSuggestions, loadConfig]);

  // Initial load
  useEffect(() => {
    if (tenantId) {
      loadAllData();
    }
  }, [tenantId, loadAllData]);

  // Reload when filters change
  useEffect(() => {
    if (tenantId) {
      loadPredictions();
    }
  }, [tenantId, priorityFilter, loadPredictions]);

  useEffect(() => {
    if (tenantId) {
      loadSuggestions();
    }
  }, [tenantId, typeFilter, loadSuggestions]);

  return {
    // State
    loading,
    analyzing,
    metrics,
    predictions,
    suggestions,
    config,

    // Filters
    priorityFilter,
    setPriorityFilter,
    typeFilter,
    setTypeFilter,

    // Actions
    loadAllData,
    runAnalysis,
    createOrderFromPrediction,
    dismissPrediction,
    applySuggestion,
    ignoreSuggestion,
    saveConfig
  };
}
