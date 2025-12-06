import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
export interface DiagnosticSession {
  id: string;
  tenant_id: string;
  global_score: number;
  improvement_potential: number;
  status_level: string;
  sales_score: number;
  sales_trend: string;
  sales_status: string;
  sales_details: string | null;
  stock_score: number;
  stock_trend: string;
  stock_status: string;
  stock_details: string | null;
  margin_score: number;
  margin_trend: string;
  margin_status: string;
  margin_details: string | null;
  customer_score: number;
  customer_trend: string;
  customer_status: string;
  customer_details: string | null;
  positive_trends: { text: string }[];
  attention_points: { text: string }[];
  duration_ms: number;
  ai_model_used: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Anomaly {
  id: string;
  tenant_id: string;
  diagnostic_session_id: string | null;
  type: 'critique' | 'warning' | 'info';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  suggestions: string[];
  status: 'detected' | 'investigating' | 'resolved' | 'dismissed';
  investigated_at: string | null;
  investigated_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  detected_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Bottleneck {
  id: string;
  tenant_id: string;
  diagnostic_session_id: string | null;
  area: string;
  severity: 'low' | 'medium' | 'high';
  priority: number;
  description: string;
  impact: string;
  recommended_solution: string | null;
  status: 'identified' | 'analyzing' | 'action_planned' | 'resolved';
  action_plan: string | null;
  action_planned_at: string | null;
  action_planned_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticMetrics {
  total_diagnostics: number;
  active_anomalies: number;
  resolved_anomalies: number;
  dismissed_anomalies: number;
  active_bottlenecks: number;
  resolved_bottlenecks: number;
  last_diagnostic_date: string | null;
  last_global_score: number | null;
  avg_global_score: number | null;
}

export interface DiagnosticResult {
  success: boolean;
  session_id?: string;
  global_score?: number;
  anomalies_created?: number;
  bottlenecks_created?: number;
  duration_ms?: number;
  error?: string;
}

export function useIntelligentDiagnostic() {
  const [loading, setLoading] = useState(true);
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [personnelId, setPersonnelId] = useState<string | null>(null);

  // Data states
  const [latestSession, setLatestSession] = useState<DiagnosticSession | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [metrics, setMetrics] = useState<DiagnosticMetrics>({
    total_diagnostics: 0,
    active_anomalies: 0,
    resolved_anomalies: 0,
    dismissed_anomalies: 0,
    active_bottlenecks: 0,
    resolved_bottlenecks: 0,
    last_diagnostic_date: null,
    last_global_score: null,
    avg_global_score: null
  });

  // Get user context
  useEffect(() => {
    const fetchUserContext = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('personnel')
          .select('id, tenant_id')
          .eq('auth_user_id', user.id)
          .limit(1);
        
        const personnel = data?.[0];
        if (personnel) {
          setTenantId(personnel.tenant_id);
          setPersonnelId(personnel.id);
        }
      }
    };
    fetchUserContext();
  }, []);

  // Load latest diagnostic session
  const loadLatestDiagnostic = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('ai_diagnostic_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const session = data[0];
        setLatestSession({
          ...session,
          positive_trends: Array.isArray(session.positive_trends) ? session.positive_trends : [],
          attention_points: Array.isArray(session.attention_points) ? session.attention_points : []
        });
      }
    } catch (error) {
      console.error('Error loading diagnostic session:', error);
    }
  }, [tenantId]);

  // Load anomalies
  const loadAnomalies = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('ai_anomalies')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('detected_at', { ascending: false });

      if (error) throw error;
      
      setAnomalies((data || []).map((a: Record<string, unknown>) => ({
        ...a,
        suggestions: Array.isArray(a.suggestions) ? a.suggestions : []
      })));
    } catch (error) {
      console.error('Error loading anomalies:', error);
    }
  }, [tenantId]);

  // Load bottlenecks
  const loadBottlenecks = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('ai_bottlenecks')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('priority', { ascending: true });

      if (error) throw error;
      
      setBottlenecks(data || []);
    } catch (error) {
      console.error('Error loading bottlenecks:', error);
    }
  }, [tenantId]);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_diagnostic_metrics', {
        p_tenant_id: tenantId
      });

      if (error) throw error;
      
      if (data) {
        setMetrics(data as unknown as DiagnosticMetrics);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [tenantId]);

  // Run diagnostic
  const runDiagnostic = useCallback(async (): Promise<DiagnosticResult> => {
    if (!tenantId) {
      return { success: false, error: 'Tenant non identifié' };
    }
    
    setDiagnosticRunning(true);
    
    try {
      const { data, error } = await supabase.rpc('run_ai_diagnostic', {
        p_tenant_id: tenantId
      });

      if (error) throw error;
      
      const result = data as unknown as DiagnosticResult;
      
      if (result.success) {
        toast.success(`Diagnostic terminé`, {
          description: `Score: ${result.global_score}/100 - ${result.anomalies_created} anomalies détectées`
        });
        
        // Reload all data
        await Promise.all([
          loadLatestDiagnostic(),
          loadAnomalies(),
          loadBottlenecks(),
          loadMetrics()
        ]);
      }
      
      return result;
    } catch (error) {
      console.error('Error running diagnostic:', error);
      toast.error('Erreur lors du diagnostic');
      return { success: false, error: String(error) };
    } finally {
      setDiagnosticRunning(false);
    }
  }, [tenantId, loadLatestDiagnostic, loadAnomalies, loadBottlenecks, loadMetrics]);

  // Investigate anomaly
  const investigateAnomaly = useCallback(async (anomalyId: string): Promise<boolean> => {
    if (!tenantId || !personnelId) return false;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('ai_anomalies')
        .update({
          status: 'investigating',
          investigated_at: new Date().toISOString(),
          investigated_by: personnelId,
          updated_at: new Date().toISOString()
        })
        .eq('id', anomalyId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Investigation démarrée');
      await loadAnomalies();
      await loadMetrics();
      return true;
    } catch (error) {
      console.error('Error investigating anomaly:', error);
      toast.error('Erreur lors de l\'investigation');
      return false;
    }
  }, [tenantId, personnelId, loadAnomalies, loadMetrics]);

  // Resolve anomaly
  const resolveAnomaly = useCallback(async (anomalyId: string, notes: string): Promise<boolean> => {
    if (!tenantId || !personnelId) return false;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('ai_anomalies')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: personnelId,
          resolution_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', anomalyId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Anomalie résolue');
      await loadAnomalies();
      await loadMetrics();
      return true;
    } catch (error) {
      console.error('Error resolving anomaly:', error);
      toast.error('Erreur lors de la résolution');
      return false;
    }
  }, [tenantId, personnelId, loadAnomalies, loadMetrics]);

  // Dismiss anomaly
  const dismissAnomaly = useCallback(async (anomalyId: string): Promise<boolean> => {
    if (!tenantId) return false;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('ai_anomalies')
        .update({
          status: 'dismissed',
          updated_at: new Date().toISOString()
        })
        .eq('id', anomalyId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Anomalie ignorée');
      await loadAnomalies();
      await loadMetrics();
      return true;
    } catch (error) {
      console.error('Error dismissing anomaly:', error);
      toast.error('Erreur lors de l\'opération');
      return false;
    }
  }, [tenantId, loadAnomalies, loadMetrics]);

  // Analyze bottleneck
  const analyzeBottleneck = useCallback(async (bottleneckId: string): Promise<boolean> => {
    if (!tenantId) return false;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('ai_bottlenecks')
        .update({
          status: 'analyzing',
          updated_at: new Date().toISOString()
        })
        .eq('id', bottleneckId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Analyse en cours');
      await loadBottlenecks();
      return true;
    } catch (error) {
      console.error('Error analyzing bottleneck:', error);
      toast.error('Erreur lors de l\'analyse');
      return false;
    }
  }, [tenantId, loadBottlenecks]);

  // Plan action for bottleneck
  const planAction = useCallback(async (bottleneckId: string, actionPlan: string): Promise<boolean> => {
    if (!tenantId || !personnelId) return false;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('ai_bottlenecks')
        .update({
          status: 'action_planned',
          action_plan: actionPlan,
          action_planned_at: new Date().toISOString(),
          action_planned_by: personnelId,
          updated_at: new Date().toISOString()
        })
        .eq('id', bottleneckId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Plan d\'action enregistré');
      await loadBottlenecks();
      await loadMetrics();
      return true;
    } catch (error) {
      console.error('Error planning action:', error);
      toast.error('Erreur lors de la planification');
      return false;
    }
  }, [tenantId, personnelId, loadBottlenecks, loadMetrics]);

  // Resolve bottleneck
  const resolveBottleneck = useCallback(async (bottleneckId: string): Promise<boolean> => {
    if (!tenantId || !personnelId) return false;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('ai_bottlenecks')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: personnelId,
          updated_at: new Date().toISOString()
        })
        .eq('id', bottleneckId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Goulot résolu');
      await loadBottlenecks();
      await loadMetrics();
      return true;
    } catch (error) {
      console.error('Error resolving bottleneck:', error);
      toast.error('Erreur lors de la résolution');
      return false;
    }
  }, [tenantId, personnelId, loadBottlenecks, loadMetrics]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLatestDiagnostic(),
        loadAnomalies(),
        loadBottlenecks(),
        loadMetrics()
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadLatestDiagnostic, loadAnomalies, loadBottlenecks, loadMetrics]);

  // Get formatted last scan time
  const getLastScanTime = useCallback((): string => {
    if (!latestSession?.created_at) return 'Jamais';
    return format(new Date(latestSession.created_at), 'dd/MM/yyyy HH:mm', { locale: fr });
  }, [latestSession]);

  // Initial load
  useEffect(() => {
    if (tenantId) {
      refreshAllData();
    }
  }, [tenantId, refreshAllData]);

  return {
    // States
    loading,
    diagnosticRunning,
    tenantId,
    
    // Data
    latestSession,
    anomalies,
    bottlenecks,
    metrics,
    
    // Actions
    runDiagnostic,
    loadLatestDiagnostic,
    loadAnomalies,
    loadBottlenecks,
    loadMetrics,
    
    // Anomaly management
    investigateAnomaly,
    resolveAnomaly,
    dismissAnomaly,
    
    // Bottleneck management
    analyzeBottleneck,
    planAction,
    resolveBottleneck,
    
    // Utilities
    refreshAllData,
    getLastScanTime
  };
}
