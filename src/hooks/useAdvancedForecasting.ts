import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

// Types
export interface ForecastModel {
  id: string;
  model_code: string;
  display_name: string;
  description: string | null;
  accuracy: number;
  best_for: string | null;
  is_active: boolean;
  is_default: boolean;
  usage_count: number;
  last_used_at: string | null;
}

export interface SalesForecastData {
  date: string;
  actual: number | null;
  predicted: number;
  confidence: number;
}

export interface StockPrediction {
  id: string;
  produit_id: string | null;
  lot_id: string | null;
  product_name: string | null;
  product_code: string | null;
  current_stock: number;
  predicted_demand_daily: number;
  days_until_stockout: number;
  recommended_order_qty: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'seasonal_peak';
  priority: 'critical' | 'medium' | 'low';
  order_created: boolean;
  order_id: string | null;
  dismissed: boolean;
  created_at: string;
}

export interface CashflowData {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
  cumulative: number;
}

export interface InfluentialFactor {
  id: string;
  factor_name: string;
  description: string | null;
  influence_score: number;
  trend_type: 'positive' | 'negative' | 'cyclical' | 'spike' | 'controlled' | 'variable';
  is_active: boolean;
  weight: number;
  data_source: string;
}

export interface ForecastMetrics {
  active_forecasts: number;
  critical_alerts: number;
  avg_accuracy: number;
  estimated_roi: number;
  last_forecast_at: string | null;
  default_model: string;
  default_accuracy: number;
}

export interface Forecast {
  id: string;
  forecast_type: 'sales' | 'stock' | 'cashflow';
  model_used: string;
  period_days: number;
  confidence_score: number;
  forecast_data: SalesForecastData[] | CashflowData[];
  summary_metrics: Record<string, number>;
  status: string;
  created_at: string;
  expires_at: string | null;
}

interface ForecastResult {
  success: boolean;
  forecast_id: string;
  model_used: string;
  model_accuracy: number;
  period_days: number;
  stock_predictions_created: number;
  critical_alerts: number;
  estimated_roi: number;
  avg_daily_sales: number;
}

export function useAdvancedForecasting() {
  const { tenantId } = useTenant();
  const { toast } = useToast();

  // États
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Données
  const [models, setModels] = useState<ForecastModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');
  const [salesForecast, setSalesForecast] = useState<SalesForecastData[]>([]);
  const [stockPredictions, setStockPredictions] = useState<StockPrediction[]>([]);
  const [cashflowForecast, setCashflowForecast] = useState<CashflowData[]>([]);
  const [influentialFactors, setInfluentialFactors] = useState<InfluentialFactor[]>([]);
  const [metrics, setMetrics] = useState<ForecastMetrics>({
    active_forecasts: 0,
    critical_alerts: 0,
    avg_accuracy: 90,
    estimated_roi: 0,
    last_forecast_at: null,
    default_model: 'ensemble',
    default_accuracy: 94.7
  });
  const [latestForecast, setLatestForecast] = useState<Forecast | null>(null);

  // Initialiser les modèles pour le tenant
  const initializeModels = useCallback(async () => {
    if (!tenantId) return;

    try {
      await supabase.rpc('init_forecast_models_for_tenant', { p_tenant_id: tenantId });
    } catch (error) {
      console.error('Error initializing forecast models:', error);
    }
  }, [tenantId]);

  // Charger les modèles disponibles
  const loadModels = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('ai_forecast_models')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('accuracy', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setModels(data as ForecastModel[]);
        const defaultModel = data.find(m => m.is_default);
        if (defaultModel) {
          setSelectedModel(defaultModel.model_code);
        }
      } else {
        // Initialiser les modèles si aucun n'existe
        await initializeModels();
        // Recharger après initialisation
        const { data: newData } = await supabase
          .from('ai_forecast_models')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('accuracy', { ascending: false });

        if (newData) {
          setModels(newData as ForecastModel[]);
        }
      }
    } catch (error) {
      console.error('Error loading forecast models:', error);
    }
  }, [tenantId, initializeModels]);

  // Charger les métriques
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase.rpc('get_forecast_metrics', {
        p_tenant_id: tenantId
      });

      if (error) throw error;

      if (data) {
        setMetrics(data as unknown as ForecastMetrics);
      }
    } catch (error) {
      console.error('Error loading forecast metrics:', error);
    }
  }, [tenantId]);

  // Charger les prévisions de ventes
  const loadSalesForecast = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('ai_forecasts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('forecast_type', 'sales')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setLatestForecast(data as unknown as Forecast);
        const forecastData = data.forecast_data as unknown as SalesForecastData[];
        if (Array.isArray(forecastData)) {
          setSalesForecast(forecastData);
        }
      }
    } catch (error) {
      console.error('Error loading sales forecast:', error);
    }
  }, [tenantId]);

  // Charger les prévisions de trésorerie
  const loadCashflowForecast = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('ai_forecasts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('forecast_type', 'cashflow')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const forecastData = data.forecast_data as unknown as CashflowData[];
        if (Array.isArray(forecastData)) {
          setCashflowForecast(forecastData);
        }
      }
    } catch (error) {
      console.error('Error loading cashflow forecast:', error);
    }
  }, [tenantId]);

  // Charger les prédictions de stock
  const loadStockPredictions = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('ai_stock_predictions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('dismissed', false)
        .order('priority', { ascending: true })
        .order('days_until_stockout', { ascending: true });

      if (error) throw error;

      if (data) {
        setStockPredictions(data as StockPrediction[]);
      }
    } catch (error) {
      console.error('Error loading stock predictions:', error);
    }
  }, [tenantId]);

  // Charger les facteurs influents
  const loadInfluentialFactors = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('ai_influential_factors')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('influence_score', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setInfluentialFactors(data as InfluentialFactor[]);
      } else {
        // Initialiser les facteurs s'ils n'existent pas
        await initializeModels();
        const { data: newData } = await supabase
          .from('ai_influential_factors')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('influence_score', { ascending: false });

        if (newData) {
          setInfluentialFactors(newData as InfluentialFactor[]);
        }
      }
    } catch (error) {
      console.error('Error loading influential factors:', error);
    }
  }, [tenantId, initializeModels]);

  // Générer une prévision
  const generateForecast = useCallback(async (modelCode: string = selectedModel, periodDays: number = 30) => {
    if (!tenantId) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_ai_forecast', {
        p_tenant_id: tenantId,
        p_model_code: modelCode,
        p_period_days: periodDays
      });

      if (error) throw error;

      const result = data as unknown as ForecastResult;
      
      toast({
        title: 'Prévisions générées',
        description: `${result.stock_predictions_created} prédictions de stock créées avec ${result.critical_alerts} alertes critiques`,
      });

      // Recharger toutes les données
      await Promise.all([
        loadSalesForecast(),
        loadCashflowForecast(),
        loadStockPredictions(),
        loadMetrics()
      ]);

      return result;
    } catch (error) {
      console.error('Error generating forecast:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer les prévisions',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  }, [tenantId, selectedModel, toast, loadSalesForecast, loadCashflowForecast, loadStockPredictions, loadMetrics]);

  // Créer une commande à partir d'une prédiction
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
        description: 'La commande a été ajoutée à votre liste',
      });

      await loadStockPredictions();
    } catch (error) {
      console.error('Error creating order from prediction:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande',
        variant: 'destructive'
      });
    }
  }, [tenantId, toast, loadStockPredictions]);

  // Rejeter une prédiction
  const dismissPrediction = useCallback(async (predictionId: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('ai_stock_predictions')
        .update({ dismissed: true })
        .eq('id', predictionId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      await loadStockPredictions();
      await loadMetrics();
    } catch (error) {
      console.error('Error dismissing prediction:', error);
    }
  }, [tenantId, loadStockPredictions, loadMetrics]);

  // Ajouter un facteur influent
  const addFactor = useCallback(async (factor: Omit<InfluentialFactor, 'id'>) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('ai_influential_factors')
        .insert({
          tenant_id: tenantId,
          factor_name: factor.factor_name,
          description: factor.description,
          influence_score: factor.influence_score,
          trend_type: factor.trend_type,
          is_active: factor.is_active,
          weight: factor.weight,
          data_source: factor.data_source
        });

      if (error) throw error;

      toast({
        title: 'Facteur ajouté',
        description: `Le facteur "${factor.factor_name}" a été ajouté`,
      });

      await loadInfluentialFactors();
    } catch (error) {
      console.error('Error adding factor:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter le facteur",
        variant: 'destructive'
      });
    }
  }, [tenantId, toast, loadInfluentialFactors]);

  // Mettre à jour un facteur
  const updateFactor = useCallback(async (id: string, updates: Partial<InfluentialFactor>) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('ai_influential_factors')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast({
        title: 'Facteur mis à jour',
        description: 'Les modifications ont été enregistrées',
      });

      await loadInfluentialFactors();
    } catch (error) {
      console.error('Error updating factor:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le facteur',
        variant: 'destructive'
      });
    }
  }, [tenantId, toast, loadInfluentialFactors]);

  // Supprimer un facteur
  const deleteFactor = useCallback(async (id: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('ai_influential_factors')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast({
        title: 'Facteur supprimé',
        description: 'Le facteur a été supprimé',
      });

      await loadInfluentialFactors();
    } catch (error) {
      console.error('Error deleting factor:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le facteur',
        variant: 'destructive'
      });
    }
  }, [tenantId, toast, loadInfluentialFactors]);

  // Définir le modèle par défaut
  const setDefaultModel = useCallback(async (modelCode: string) => {
    if (!tenantId) return;

    try {
      // Réinitialiser tous les modèles
      await supabase
        .from('ai_forecast_models')
        .update({ is_default: false })
        .eq('tenant_id', tenantId);

      // Définir le nouveau modèle par défaut
      const { error } = await supabase
        .from('ai_forecast_models')
        .update({ is_default: true })
        .eq('tenant_id', tenantId)
        .eq('model_code', modelCode);

      if (error) throw error;

      setSelectedModel(modelCode);
      await loadModels();

      toast({
        title: 'Modèle par défaut',
        description: `Le modèle ${modelCode.toUpperCase()} est maintenant le modèle par défaut`,
      });
    } catch (error) {
      console.error('Error setting default model:', error);
    }
  }, [tenantId, toast, loadModels]);

  // Charger toutes les données
  const loadAllData = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      await Promise.all([
        loadModels(),
        loadMetrics(),
        loadSalesForecast(),
        loadCashflowForecast(),
        loadStockPredictions(),
        loadInfluentialFactors()
      ]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadModels, loadMetrics, loadSalesForecast, loadCashflowForecast, loadStockPredictions, loadInfluentialFactors]);

  // Charger au montage
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    // États
    loading,
    generating,

    // Données
    models,
    selectedModel,
    setSelectedModel,
    salesForecast,
    stockPredictions,
    cashflowForecast,
    influentialFactors,
    metrics,
    latestForecast,

    // Actions
    generateForecast,
    loadAllData,
    loadStockPredictions,
    createOrderFromPrediction,
    dismissPrediction,

    // Facteurs
    addFactor,
    updateFactor,
    deleteFactor,

    // Modèles
    setDefaultModel
  };
}
