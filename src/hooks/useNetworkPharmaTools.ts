import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface DrugInfo {
  id: string;
  name: string;
  dci: string;
  therapeutic_class: string;
  form: string;
  dosage: string;
  manufacturer: string;
  atc_code: string;
  cip_code: string;
  price: number;
  reimbursement_rate: number;
  prescription_required: boolean;
  contraindications: string[];
  interactions: string[];
  side_effects: string[];
  storage_conditions: string;
  expiry_monitoring: boolean;
  is_generic?: boolean;
  stock_quantity?: number;
}

export interface DrugInteraction {
  id: string;
  drug1_name: string;
  drug2_name: string;
  drug1_id?: string;
  drug2_id?: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  mechanism: string;
  clinical_effect: string;
  management: string;
  source_references: string[];
  is_network_shared: boolean;
  shared_by_pharmacy?: string;
}

export interface ClinicalAlert {
  id: string;
  alert_type: 'drug_alert' | 'interaction' | 'recall' | 'shortage' | 'regulatory';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  affected_drugs: string[];
  source: string;
  date_issued: string;
  expiry_date?: string;
  actions_required: string[];
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  is_network_alert: boolean;
}

export interface PharmacySpecialty {
  id: string;
  name: string;
  description: string;
  icon: string;
  certifications: string[];
  protocols: string[];
  equipment: string[];
  staff_requirements: string[];
  patient_demographics: string;
  is_active: boolean;
  is_network_shared: boolean;
}

export interface PharmaToolConfig {
  id: string;
  tool_type: string;
  tool_name: string;
  config: Record<string, any>;
  external_url?: string;
  is_enabled: boolean;
  last_sync_at?: string;
}

export interface PharmaToolsMetrics {
  totalDrugs: number;
  activeAlerts: number;
  criticalAlerts: number;
  interactionsCount: number;
  specialtiesCount: number;
}

export const useNetworkPharmaTools = () => {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [drugDatabase, setDrugDatabase] = useState<DrugInfo[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [clinicalAlerts, setClinicalAlerts] = useState<ClinicalAlert[]>([]);
  const [specialties, setSpecialties] = useState<PharmacySpecialty[]>([]);
  const [toolConfigs, setToolConfigs] = useState<PharmaToolConfig[]>([]);
  const [metrics, setMetrics] = useState<PharmaToolsMetrics>({
    totalDrugs: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    interactionsCount: 0,
    specialtiesCount: 0
  });
  const [drugsPagination, setDrugsPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0
  });

  // Load metrics
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_pharma_tools_metrics', {
        p_tenant_id: tenantId
      });
      
      if (error) throw error;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setMetrics(data as unknown as PharmaToolsMetrics);
      }
    } catch (error) {
      console.error('Error loading pharma tools metrics:', error);
    }
  }, [tenantId]);

  // Load drug database with pagination and search
  const loadDrugDatabase = useCallback(async (search = '', category = 'all', page = 1) => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_drug_database_with_details', {
        p_tenant_id: tenantId,
        p_search: search,
        p_category: category,
        p_page: page,
        p_page_size: 50
      });
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const result = data as unknown as { drugs: DrugInfo[]; total: number; page: number; pageSize: number; totalPages: number };
        setDrugDatabase(result.drugs || []);
        setDrugsPagination({
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading drug database:', error);
      toast.error('Erreur lors du chargement de la base de données médicaments');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Load all interactions
  const loadInteractions = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('drug_interactions')
        .select('*')
        .or(`tenant_id.eq.${tenantId},is_network_shared.eq.true`)
        .order('severity', { ascending: true });
      
      if (error) throw error;
      
      setInteractions((data || []).map(item => ({
        ...item,
        severity: item.severity as DrugInteraction['severity'],
        source_references: item.source_references || []
      })));
    } catch (error) {
      console.error('Error loading interactions:', error);
    }
  }, [tenantId]);

  // Check interaction between two drugs
  const checkInteraction = useCallback(async (drug1Id: string, drug2Id: string, drug1Name?: string, drug2Name?: string) => {
    if (!tenantId) return [];
    
    try {
      const { data, error } = await supabase.rpc('check_drug_interactions', {
        p_tenant_id: tenantId,
        p_drug1_id: drug1Id || null,
        p_drug2_id: drug2Id || null,
        p_drug1_name: drug1Name || null,
        p_drug2_name: drug2Name || null
      });
      
      if (error) throw error;
      const result = data as unknown as { interactions: DrugInteraction[] };
      return result?.interactions || [];
    } catch (error) {
      console.error('Error checking interactions:', error);
      toast.error('Erreur lors de la vérification des interactions');
      return [];
    }
  }, [tenantId]);

  // Create interaction
  const createInteraction = useCallback(async (interaction: Partial<DrugInteraction>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('drug_interactions')
        .insert({
          tenant_id: tenantId,
          drug1_name: interaction.drug1_name,
          drug2_name: interaction.drug2_name,
          drug1_id: interaction.drug1_id,
          drug2_id: interaction.drug2_id,
          severity: interaction.severity || 'minor',
          mechanism: interaction.mechanism,
          clinical_effect: interaction.clinical_effect,
          management: interaction.management,
          source_references: interaction.source_references || [],
          is_network_shared: interaction.is_network_shared || false,
          shared_by_pharmacy_id: interaction.is_network_shared ? tenantId : null
        });
      
      if (error) throw error;
      toast.success('Interaction créée avec succès');
      await loadInteractions();
      await loadMetrics();
    } catch (error) {
      console.error('Error creating interaction:', error);
      toast.error('Erreur lors de la création de l\'interaction');
    }
  }, [tenantId, loadInteractions, loadMetrics]);

  // Update interaction
  const updateInteraction = useCallback(async (id: string, data: Partial<DrugInteraction>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('drug_interactions')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      toast.success('Interaction mise à jour');
      await loadInteractions();
    } catch (error) {
      console.error('Error updating interaction:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [tenantId, loadInteractions]);

  // Delete interaction
  const deleteInteraction = useCallback(async (id: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('drug_interactions')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      toast.success('Interaction supprimée');
      await loadInteractions();
      await loadMetrics();
    } catch (error) {
      console.error('Error deleting interaction:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [tenantId, loadInteractions, loadMetrics]);

  // Load clinical alerts
  const loadClinicalAlerts = useCallback(async (filters?: { type?: string; severity?: string; acknowledged?: boolean }) => {
    if (!tenantId) return;
    
    try {
      let query = supabase
        .from('clinical_alerts')
        .select('*')
        .order('date_issued', { ascending: false });

      // RLS handles tenant filtering automatically for SELECT
      
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('alert_type', filters.type);
      }
      if (filters?.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.acknowledged !== undefined) {
        query = query.eq('is_acknowledged', filters.acknowledged);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setClinicalAlerts((data || []).map(item => ({
        ...item,
        alert_type: item.alert_type as ClinicalAlert['alert_type'],
        severity: item.severity as ClinicalAlert['severity'],
        affected_drugs: item.affected_drugs || [],
        actions_required: item.actions_required || []
      })));
    } catch (error) {
      console.error('Error loading clinical alerts:', error);
    }
  }, [tenantId]);

  // Create alert
  const createAlert = useCallback(async (alert: Partial<ClinicalAlert>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('clinical_alerts')
        .insert({
          tenant_id: tenantId,
          alert_type: alert.alert_type || 'drug_alert',
          title: alert.title,
          description: alert.description,
          severity: alert.severity || 'info',
          affected_drugs: alert.affected_drugs || [],
          source: alert.source,
          actions_required: alert.actions_required || [],
          is_network_alert: alert.is_network_alert || false
        });
      
      if (error) throw error;
      toast.success('Alerte créée avec succès');
      await loadClinicalAlerts();
      await loadMetrics();
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Erreur lors de la création de l\'alerte');
    }
  }, [tenantId, loadClinicalAlerts, loadMetrics]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (id: string, personnelId: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('clinical_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_by: personnelId,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Alerte acquittée');
      await loadClinicalAlerts();
      await loadMetrics();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Erreur lors de l\'acquittement');
    }
  }, [tenantId, loadClinicalAlerts, loadMetrics]);

  // Delete alert
  const deleteAlert = useCallback(async (id: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('clinical_alerts')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      toast.success('Alerte supprimée');
      await loadClinicalAlerts();
      await loadMetrics();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [tenantId, loadClinicalAlerts, loadMetrics]);

  // Load specialties
  const loadSpecialties = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('pharmacy_specialties')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setSpecialties((data || []).map(item => ({
        ...item,
        certifications: item.certifications || [],
        protocols: item.protocols || [],
        equipment: item.equipment || [],
        staff_requirements: item.staff_requirements || []
      })));
    } catch (error) {
      console.error('Error loading specialties:', error);
    }
  }, [tenantId]);

  // Create specialty
  const createSpecialty = useCallback(async (specialty: Partial<PharmacySpecialty>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('pharmacy_specialties')
        .insert({
          tenant_id: tenantId,
          name: specialty.name,
          description: specialty.description,
          icon: specialty.icon || 'stethoscope',
          certifications: specialty.certifications || [],
          protocols: specialty.protocols || [],
          equipment: specialty.equipment || [],
          staff_requirements: specialty.staff_requirements || [],
          patient_demographics: specialty.patient_demographics,
          is_network_shared: specialty.is_network_shared || false
        });
      
      if (error) throw error;
      toast.success('Spécialité créée avec succès');
      await loadSpecialties();
      await loadMetrics();
    } catch (error) {
      console.error('Error creating specialty:', error);
      toast.error('Erreur lors de la création de la spécialité');
    }
  }, [tenantId, loadSpecialties, loadMetrics]);

  // Update specialty
  const updateSpecialty = useCallback(async (id: string, data: Partial<PharmacySpecialty>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('pharmacy_specialties')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      toast.success('Spécialité mise à jour');
      await loadSpecialties();
    } catch (error) {
      console.error('Error updating specialty:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [tenantId, loadSpecialties]);

  // Delete specialty
  const deleteSpecialty = useCallback(async (id: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('pharmacy_specialties')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      toast.success('Spécialité supprimée');
      await loadSpecialties();
      await loadMetrics();
    } catch (error) {
      console.error('Error deleting specialty:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [tenantId, loadSpecialties, loadMetrics]);

  // Load tool configs
  const loadToolConfigs = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('pharma_tool_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('tool_name');
      
      if (error) throw error;
      setToolConfigs((data || []).map(item => ({
        ...item,
        config: (typeof item.config === 'object' && item.config !== null && !Array.isArray(item.config)) 
          ? item.config as Record<string, any> 
          : {}
      })));
    } catch (error) {
      console.error('Error loading tool configs:', error);
    }
  }, [tenantId]);

  // Update tool config
  const updateToolConfig = useCallback(async (id: string, config: Record<string, any>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('pharma_tool_configs')
        .update({
          config,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      toast.success('Configuration mise à jour');
      await loadToolConfigs();
    } catch (error) {
      console.error('Error updating tool config:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [tenantId, loadToolConfigs]);

  // Sync databases (placeholder - would connect to external APIs)
  const syncDatabases = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate sync with external databases (ANSM, Claude Bernard, etc.)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update last sync time for all tools
      if (tenantId) {
        await supabase
          .from('pharma_tool_configs')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('tenant_id', tenantId);
      }
      
      toast.success('Bases de données synchronisées');
      await loadMetrics();
      await loadToolConfigs();
    } catch (error) {
      console.error('Error syncing databases:', error);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadMetrics, loadToolConfigs]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadDrugDatabase(),
        loadInteractions(),
        loadClinicalAlerts(),
        loadSpecialties(),
        loadToolConfigs()
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadMetrics, loadDrugDatabase, loadInteractions, loadClinicalAlerts, loadSpecialties, loadToolConfigs]);

  // Initial load
  useEffect(() => {
    if (tenantId) {
      refreshAllData();
    }
  }, [tenantId]);

  return {
    loading,
    drugDatabase,
    interactions,
    clinicalAlerts,
    specialties,
    toolConfigs,
    metrics,
    drugsPagination,
    
    // Drug database
    loadDrugDatabase,
    
    // Interactions
    loadInteractions,
    checkInteraction,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    
    // Alerts
    loadClinicalAlerts,
    createAlert,
    acknowledgeAlert,
    deleteAlert,
    
    // Specialties
    loadSpecialties,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
    
    // Tool configs
    loadToolConfigs,
    updateToolConfig,
    syncDatabases,
    
    // Refresh
    refreshAllData
  };
};
