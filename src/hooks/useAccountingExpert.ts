import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

interface AccountingMetrics {
  entries: {
    total: number;
    balanced: number;
    balance_rate: number;
  };
  anomalies: {
    pending: number;
    resolved: number;
    total: number;
  };
  optimizations: {
    total: number;
    implemented: number;
    estimated_savings: number;
    realized_savings: number;
  };
  fiscal: {
    compliance_rate: number;
    upcoming: number;
    overdue: number;
  };
}

interface AccountingAnomaly {
  id: string;
  anomaly_type: string;
  severity: string;
  title: string;
  description: string;
  affected_accounts: string[] | null;
  affected_entries: string[] | null;
  suggested_correction: string | null;
  correction_steps: any;
  status: string;
  detected_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

interface TaxOptimization {
  id: string;
  optimization_type: string;
  category: string;
  title: string;
  description: string;
  estimated_savings: number | null;
  confidence: number | null;
  implementation_steps: any;
  legal_references: string[] | null;
  applicable_period: string | null;
  deadline: string | null;
  priority: number;
  status: string;
}

interface FiscalObligation {
  id: string;
  type_obligation: string;
  description: string;
  prochaine_echeance: string;
  frequence: string | null;
  statut: string;
  rappel_jours_avant: number | null;
}

interface AccountingEntry {
  id: string;
  numero_piece: string;
  libelle: string;
  date_ecriture: string;
  statut: string;
  journal_id: string | null;
}

interface AccountingConsultation {
  id: string;
  question: string;
  ai_response: string | null;
  consultation_type: string;
  confidence: number | null;
  is_useful: boolean | null;
  created_at: string;
}

interface AccountingExpertConfig {
  id: string;
  enable_auto_anomaly_detection: boolean;
  anomaly_detection_frequency: string;
  enable_tax_optimization_suggestions: boolean;
  optimization_check_frequency: string;
  enable_fiscal_reminders: boolean;
  reminder_days_before: number;
  accounting_system: string;
  fiscal_year_start_month: number;
  auto_reconciliation: boolean;
  min_anomaly_severity: string;
  notification_settings: any;
}

interface ChartOfAccount {
  id: string;
  numero_compte: string;
  libelle_compte: string;
  classe: number;
  type_compte: string | null;
  is_active: boolean;
}

export function useAccountingExpert() {
  const { tenantId } = useTenant();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<AccountingMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<AccountingAnomaly[]>([]);
  const [optimizations, setOptimizations] = useState<TaxOptimization[]>([]);
  const [obligations, setObligations] = useState<FiscalObligation[]>([]);
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [consultations, setConsultations] = useState<AccountingConsultation[]>([]);
  const [config, setConfig] = useState<AccountingExpertConfig | null>(null);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase.rpc('get_accounting_expert_metrics', {
        p_tenant_id: tenantId
      });
      if (error) throw error;
      if (data) setMetrics(data as unknown as AccountingMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [tenantId]);

  // Load anomalies
  const loadAnomalies = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_accounting_anomalies')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('detected_at', { ascending: false });
      if (error) throw error;
      setAnomalies(data || []);
    } catch (error) {
      console.error('Error loading anomalies:', error);
    }
  }, [tenantId]);

  // Load optimizations
  const loadOptimizations = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_tax_optimizations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('priority', { ascending: true });
      if (error) throw error;
      setOptimizations(data || []);
    } catch (error) {
      console.error('Error loading optimizations:', error);
    }
  }, [tenantId]);

  // Load fiscal obligations
  const loadObligations = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('obligations_fiscales')
        .select('id, type_obligation, description, prochaine_echeance, frequence, statut, rappel_jours_avant')
        .eq('tenant_id', tenantId)
        .order('prochaine_echeance', { ascending: true });
      if (error) throw error;
      setObligations(data || []);
    } catch (error) {
      console.error('Error loading obligations:', error);
    }
  }, [tenantId]);

  // Load accounting entries
  const loadEntries = useCallback(async (limit = 100) => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ecritures_comptables')
        .select('id, numero_piece, libelle, date_ecriture, statut, journal_id')
        .eq('tenant_id', tenantId)
        .order('date_ecriture', { ascending: false })
        .limit(limit);
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }, [tenantId]);

  // Load consultations
  const loadConsultations = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_accounting_consultations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error loading consultations:', error);
    }
  }, [tenantId]);

  // Load config
  const loadConfig = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_accounting_expert_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }, [tenantId]);

  // Load chart of accounts
  const loadChartOfAccounts = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('plan_comptable')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('numero_compte', { ascending: true });
      if (error) throw error;
      setChartOfAccounts(data || []);
    } catch (error) {
      console.error('Error loading chart of accounts:', error);
    }
  }, [tenantId]);

  // Detect anomalies
  const detectAnomalies = useCallback(async () => {
    if (!tenantId) return 0;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('detect_accounting_anomalies', {
        p_tenant_id: tenantId
      });
      if (error) throw error;
      await loadAnomalies();
      await loadMetrics();
      toast({
        title: 'Détection terminée',
        description: `${data || 0} nouvelle(s) anomalie(s) détectée(s)`,
      });
      return data || 0;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de détecter les anomalies',
        variant: 'destructive',
      });
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, loadAnomalies, loadMetrics, toast]);

  // Resolve anomaly
  const resolveAnomaly = useCallback(async (anomalyId: string, resolutionNotes: string) => {
    if (!tenantId) return false;
    try {
      const { error } = await supabase
        .from('ai_accounting_anomalies')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
        })
        .eq('id', anomalyId)
        .eq('tenant_id', tenantId);
      if (error) throw error;
      await loadAnomalies();
      await loadMetrics();
      toast({
        title: 'Anomalie résolue',
        description: 'L\'anomalie a été marquée comme résolue',
      });
      return true;
    } catch (error) {
      console.error('Error resolving anomaly:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de résoudre l\'anomalie',
        variant: 'destructive',
      });
      return false;
    }
  }, [tenantId, loadAnomalies, loadMetrics, toast]);

  // Dismiss anomaly
  const dismissAnomaly = useCallback(async (anomalyId: string) => {
    if (!tenantId) return false;
    try {
      const { error } = await supabase
        .from('ai_accounting_anomalies')
        .update({ status: 'dismissed' })
        .eq('id', anomalyId)
        .eq('tenant_id', tenantId);
      if (error) throw error;
      await loadAnomalies();
      await loadMetrics();
      return true;
    } catch (error) {
      console.error('Error dismissing anomaly:', error);
      return false;
    }
  }, [tenantId, loadAnomalies, loadMetrics]);

  // Implement optimization
  const implementOptimization = useCallback(async (optimizationId: string) => {
    if (!tenantId) return false;
    try {
      const { error } = await supabase
        .from('ai_tax_optimizations')
        .update({
          status: 'implemented',
          implemented_at: new Date().toISOString(),
        })
        .eq('id', optimizationId)
        .eq('tenant_id', tenantId);
      if (error) throw error;
      await loadOptimizations();
      await loadMetrics();
      toast({
        title: 'Optimisation implémentée',
        description: 'L\'optimisation fiscale a été marquée comme implémentée',
      });
      return true;
    } catch (error) {
      console.error('Error implementing optimization:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'implémenter l\'optimisation',
        variant: 'destructive',
      });
      return false;
    }
  }, [tenantId, loadOptimizations, loadMetrics, toast]);

  // Reject optimization
  const rejectOptimization = useCallback(async (optimizationId: string, reason: string) => {
    if (!tenantId) return false;
    try {
      const { error } = await supabase
        .from('ai_tax_optimizations')
        .update({
          status: 'rejected',
          rejected_reason: reason,
        })
        .eq('id', optimizationId)
        .eq('tenant_id', tenantId);
      if (error) throw error;
      await loadOptimizations();
      await loadMetrics();
      return true;
    } catch (error) {
      console.error('Error rejecting optimization:', error);
      return false;
    }
  }, [tenantId, loadOptimizations, loadMetrics]);

  // AI Consultation
  const askAI = useCallback(async (
    question: string,
    consultationType: string = 'general'
  ): Promise<{ response: string; confidence: number } | null> => {
    if (!tenantId) return null;
    setIsLoading(true);
    try {
      const contextData = {
        total_entries: metrics?.entries.total || 0,
        fiscal_year: new Date().getFullYear(),
        pending_anomalies: metrics?.anomalies.pending || 0,
        upcoming_obligations: metrics?.fiscal.upcoming || 0,
        accounting_system: config?.accounting_system || 'SYSCOHADA',
      };

      const { data, error } = await supabase.functions.invoke('accounting-expert-consultation', {
        body: {
          question,
          consultation_type: consultationType,
          context_data: contextData,
          tenant_id: tenantId,
        },
      });

      if (error) throw error;

      // Save consultation
      await supabase.from('ai_accounting_consultations').insert({
        tenant_id: tenantId,
        question,
        ai_response: data.response,
        consultation_type: consultationType,
        confidence: data.confidence,
      });

      await loadConsultations();

      return {
        response: data.response,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error('Error asking AI:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de consulter l\'expert IA',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, metrics, config, loadConsultations, toast]);

  // Rate consultation
  const rateConsultation = useCallback(async (consultationId: string, isUseful: boolean, feedback?: string) => {
    if (!tenantId) return false;
    try {
      const { error } = await supabase
        .from('ai_accounting_consultations')
        .update({
          is_useful: isUseful,
          feedback,
        })
        .eq('id', consultationId)
        .eq('tenant_id', tenantId);
      if (error) throw error;
      await loadConsultations();
      return true;
    } catch (error) {
      console.error('Error rating consultation:', error);
      return false;
    }
  }, [tenantId, loadConsultations]);

  // Save config
  const saveConfig = useCallback(async (newConfig: Partial<AccountingExpertConfig>) => {
    if (!tenantId) return false;
    try {
      const { error } = await supabase
        .from('ai_accounting_expert_config')
        .upsert({
          tenant_id: tenantId,
          ...newConfig,
        }, { onConflict: 'tenant_id' });
      if (error) throw error;
      await loadConfig();
      toast({
        title: 'Configuration sauvegardée',
        description: 'Les paramètres ont été mis à jour',
      });
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la configuration',
        variant: 'destructive',
      });
      return false;
    }
  }, [tenantId, loadConfig, toast]);

  // Mark obligation as paid
  const markObligationPaid = useCallback(async (obligationId: string) => {
    if (!tenantId) return false;
    try {
      const { error } = await supabase
        .from('obligations_fiscales')
        .update({
          statut: 'payee',
          date_paiement: new Date().toISOString(),
        })
        .eq('id', obligationId)
        .eq('tenant_id', tenantId);
      if (error) throw error;
      await loadObligations();
      await loadMetrics();
      toast({
        title: 'Obligation payée',
        description: 'L\'obligation fiscale a été marquée comme payée',
      });
      return true;
    } catch (error) {
      console.error('Error marking obligation paid:', error);
      return false;
    }
  }, [tenantId, loadObligations, loadMetrics, toast]);

  // Load all data on mount
  useEffect(() => {
    if (tenantId) {
      loadMetrics();
      loadAnomalies();
      loadOptimizations();
      loadObligations();
      loadEntries();
      loadConsultations();
      loadConfig();
      loadChartOfAccounts();
    }
  }, [tenantId, loadMetrics, loadAnomalies, loadOptimizations, loadObligations, loadEntries, loadConsultations, loadConfig, loadChartOfAccounts]);

  return {
    isLoading,
    metrics,
    anomalies,
    optimizations,
    obligations,
    entries,
    consultations,
    config,
    chartOfAccounts,
    loadMetrics,
    loadAnomalies,
    loadOptimizations,
    loadObligations,
    loadEntries,
    loadConsultations,
    loadConfig,
    loadChartOfAccounts,
    detectAnomalies,
    resolveAnomaly,
    dismissAnomaly,
    implementOptimization,
    rejectOptimization,
    askAI,
    rateConsultation,
    saveConfig,
    markObligationPaid,
  };
}
