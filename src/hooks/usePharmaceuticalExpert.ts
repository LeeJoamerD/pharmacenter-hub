import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export interface PharmaExpertMetrics {
  drugsCount: number;
  interactionsCount: number;
  activeAlerts: number;
  recommendationsCount: number;
  complianceScore: number;
  consultationsToday: number;
}

export interface DrugInfo {
  id: string;
  name: string;
  genericName: string;
  therapeuticClass: string;
  indications: string[];
  contraindications: string[];
  sideEffects: string[];
  dosage: string;
  interactions: string[];
  pregnancy: string;
  breastfeeding: string;
  age: string;
  price: number;
  reimbursement: number;
  prescriptionRequired: boolean;
}

export interface DrugInteraction {
  id: string;
  drug1_name: string;
  drug2_name: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  mechanism: string;
  clinical_effect: string;
  management: string;
  source_references: string[];
  is_network_shared: boolean;
}

export interface TherapeuticRecommendation {
  id: string;
  condition_name: string;
  condition_category: string;
  first_line_treatments: { name: string; dosage: string; notes?: string }[];
  alternative_treatments: { name: string; dosage: string; notes?: string }[];
  contraindications: string;
  duration: string;
  monitoring: string;
  evidence_level: string;
  source_guidelines: string[];
  is_active: boolean;
  created_at: string;
}

export interface PharmacovigilanceAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  affected_drugs: string[];
  source: string;
  date_issued: string;
  actions_required: string[];
  is_acknowledged: boolean;
  acknowledged_at?: string;
}

export interface ComplianceCheck {
  id: string;
  category: string;
  status: 'compliant' | 'warning' | 'critical' | 'pending';
  items_count: number;
  issues_count: number;
  last_check_at: string;
  next_audit_date: string;
  issues_details: { product: string; issue: string; severity: string }[];
}

export interface PharmaConsultation {
  id: string;
  question: string;
  ai_response: string;
  consultation_type: string;
  confidence: number;
  is_useful?: boolean;
  feedback?: string;
  created_at: string;
}

export interface PharmaExpertConfig {
  id?: string;
  auto_interaction_check: boolean;
  interaction_alert_level: string;
  enable_ai_consultation: boolean;
  enable_compliance_alerts: boolean;
  compliance_check_frequency: string;
  pharmacovigilance_sources: string[];
  therapeutic_guidelines_version?: string;
}

export const usePharmaceuticalExpert = () => {
  const { tenantId } = useTenant();
  const { personnel } = useAuth();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<PharmaExpertMetrics>({
    drugsCount: 0,
    interactionsCount: 0,
    activeAlerts: 0,
    recommendationsCount: 0,
    complianceScore: 100,
    consultationsToday: 0
  });
  const [drugDatabase, setDrugDatabase] = useState<DrugInfo[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [recommendations, setRecommendations] = useState<TherapeuticRecommendation[]>([]);
  const [pharmacovigilanceAlerts, setPharmacovigilanceAlerts] = useState<PharmacovigilanceAlert[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [consultations, setConsultations] = useState<PharmaConsultation[]>([]);
  const [config, setConfig] = useState<PharmaExpertConfig>({
    auto_interaction_check: true,
    interaction_alert_level: 'moderate',
    enable_ai_consultation: true,
    enable_compliance_alerts: true,
    compliance_check_frequency: 'weekly',
    pharmacovigilance_sources: ['ANSM', 'EMA', 'FDA']
  });
  const [drugsPagination, setDrugsPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Load metrics
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_pharma_expert_metrics', {
        p_tenant_id: tenantId
      });
      
      if (error) throw error;
      if (data) {
        setMetrics(data as unknown as PharmaExpertMetrics);
      }
    } catch (error) {
      console.error('Error loading pharma expert metrics:', error);
    }
  }, [tenantId]);

  // Load drug database from produits table
  const loadDrugs = useCallback(async (search = '', page = 1) => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const pageSize = drugsPagination.pageSize;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      let query = supabase
        .from('produits')
        .select(`
          id, libelle_produit, code_cip, prix_vente_ttc,
          prescription_requise, conditions_conservation,
          dci:dci_id(nom_dci),
          famille:famille_id(libelle_famille)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('libelle_produit')
        .range(start, end);

      if (search) {
        query = query.or(`libelle_produit.ilike.%${search}%,code_cip.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;

      const formattedDrugs: DrugInfo[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.libelle_produit,
        genericName: p.dci?.nom_dci || '',
        therapeuticClass: p.famille?.libelle_famille || 'Non classé',
        indications: [],
        contraindications: [],
        sideEffects: [],
        dosage: '',
        interactions: [],
        pregnancy: 'À vérifier',
        breastfeeding: 'À vérifier',
        age: 'Tous âges',
        price: p.prix_vente_ttc || 0,
        reimbursement: 0,
        prescriptionRequired: p.prescription_requise || false
      }));

      setDrugDatabase(formattedDrugs);
      setDrugsPagination(prev => ({
        ...prev,
        page,
        total: count || 0
      }));
    } catch (error) {
      console.error('Error loading drugs:', error);
      toast.error('Erreur lors du chargement des médicaments');
    } finally {
      setLoading(false);
    }
  }, [tenantId, drugsPagination.pageSize]);

  // Load interactions
  const loadInteractions = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('drug_interactions')
        .select('*')
        .or(`tenant_id.eq.${tenantId},is_network_shared.eq.true`)
        .order('severity');
      
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

  // Check interaction between drugs
  const checkInteraction = useCallback(async (drug1Name: string, drug2Name: string): Promise<DrugInteraction[]> => {
    if (!tenantId) return [];
    
    try {
      const { data, error } = await supabase
        .from('drug_interactions')
        .select('*')
        .or(`tenant_id.eq.${tenantId},is_network_shared.eq.true`)
        .or(`and(drug1_name.ilike.%${drug1Name}%,drug2_name.ilike.%${drug2Name}%),and(drug1_name.ilike.%${drug2Name}%,drug2_name.ilike.%${drug1Name}%)`);
      
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        severity: item.severity as DrugInteraction['severity'],
        source_references: item.source_references || []
      }));
    } catch (error) {
      console.error('Error checking interaction:', error);
      toast.error('Erreur lors de la vérification');
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
          severity: interaction.severity || 'minor',
          mechanism: interaction.mechanism,
          clinical_effect: interaction.clinical_effect,
          management: interaction.management,
          source_references: interaction.source_references || [],
          is_network_shared: interaction.is_network_shared || false
        });
      
      if (error) throw error;
      toast.success('Interaction créée avec succès');
      await loadInteractions();
      await loadMetrics();
    } catch (error) {
      console.error('Error creating interaction:', error);
      toast.error('Erreur lors de la création');
    }
  }, [tenantId, loadInteractions, loadMetrics]);

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

  // Load therapeutic recommendations
  const loadRecommendations = useCallback(async (category?: string) => {
    if (!tenantId) return;
    
    try {
      let query = supabase
        .from('ai_therapeutic_recommendations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('condition_name');

      if (category && category !== 'all') {
        query = query.eq('condition_category', category);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setRecommendations((data || []).map(item => ({
        ...item,
        first_line_treatments: item.first_line_treatments as any[] || [],
        alternative_treatments: item.alternative_treatments as any[] || [],
        source_guidelines: item.source_guidelines || []
      })));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  }, [tenantId]);

  // Create recommendation
  const createRecommendation = useCallback(async (rec: Partial<TherapeuticRecommendation>) => {
    if (!tenantId || !personnel?.id) return;
    
    try {
      const { error } = await supabase
        .from('ai_therapeutic_recommendations')
        .insert({
          tenant_id: tenantId,
          condition_name: rec.condition_name,
          condition_category: rec.condition_category,
          first_line_treatments: rec.first_line_treatments || [],
          alternative_treatments: rec.alternative_treatments || [],
          contraindications: rec.contraindications,
          duration: rec.duration,
          monitoring: rec.monitoring,
          evidence_level: rec.evidence_level,
          source_guidelines: rec.source_guidelines || [],
          created_by: personnel.id
        });
      
      if (error) throw error;
      toast.success('Recommandation créée avec succès');
      await loadRecommendations();
      await loadMetrics();
    } catch (error) {
      console.error('Error creating recommendation:', error);
      toast.error('Erreur lors de la création');
    }
  }, [tenantId, personnel?.id, loadRecommendations, loadMetrics]);

  // Update recommendation
  const updateRecommendation = useCallback(async (id: string, data: Partial<TherapeuticRecommendation>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_therapeutic_recommendations')
        .update(data)
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      toast.success('Recommandation mise à jour');
      await loadRecommendations();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [tenantId, loadRecommendations]);

  // Delete recommendation
  const deleteRecommendation = useCallback(async (id: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_therapeutic_recommendations')
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

  // Load pharmacovigilance alerts
  const loadPharmacovigilanceAlerts = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('alert_type', 'drug_alert')
        .order('date_issued', { ascending: false });
      
      if (error) throw error;
      setPharmacovigilanceAlerts((data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        severity: item.severity as 'info' | 'warning' | 'critical',
        affected_drugs: item.affected_drugs || [],
        source: item.source || 'ANSM',
        date_issued: item.date_issued,
        actions_required: item.actions_required || [],
        is_acknowledged: item.is_acknowledged,
        acknowledged_at: item.acknowledged_at
      })));
    } catch (error) {
      console.error('Error loading pharmacovigilance alerts:', error);
    }
  }, [tenantId]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (id: string) => {
    if (!tenantId || !personnel?.id) return;
    
    try {
      const { error } = await supabase
        .from('clinical_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_by: personnel.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Alerte acquittée');
      await loadPharmacovigilanceAlerts();
      await loadMetrics();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Erreur lors de l\'acquittement');
    }
  }, [tenantId, personnel?.id, loadPharmacovigilanceAlerts, loadMetrics]);

  // Load compliance checks
  const loadComplianceChecks = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_pharma_compliance_checks')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('category');
      
      if (error) throw error;
      setComplianceChecks((data || []).map(item => ({
        ...item,
        status: item.status as ComplianceCheck['status'],
        issues_details: (item.issues_details as any[] || [])
      })));
    } catch (error) {
      console.error('Error loading compliance checks:', error);
    }
  }, [tenantId]);

  // Run compliance check
  const runComplianceCheck = useCallback(async (category: string): Promise<ComplianceCheck | null> => {
    if (!tenantId || !personnel?.id) return null;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('run_pharma_compliance_check', {
        p_tenant_id: tenantId,
        p_category: category,
        p_checked_by: personnel.id
      });
      
      if (error) throw error;
      toast.success(`Contrôle "${category}" effectué`);
      await loadComplianceChecks();
      await loadMetrics();
      
      if (data) {
        return {
          id: (data as any).checkId,
          category: (data as any).category,
          status: (data as any).status,
          items_count: (data as any).itemsCount,
          issues_count: (data as any).issuesCount,
          last_check_at: new Date().toISOString(),
          next_audit_date: '',
          issues_details: (data as any).issues || []
        };
      }
      return null;
    } catch (error) {
      console.error('Error running compliance check:', error);
      toast.error('Erreur lors du contrôle');
      return null;
    } finally {
      setLoading(false);
    }
  }, [tenantId, personnel?.id, loadComplianceChecks, loadMetrics]);

  // Load consultations history
  const loadConsultations = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_pharma_consultations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setConsultations((data || []).map(item => ({
        ...item,
        confidence: Number(item.confidence) || 0
      })));
    } catch (error) {
      console.error('Error loading consultations:', error);
    }
  }, [tenantId]);

  // Ask AI consultation
  const askAI = useCallback(async (
    question: string, 
    type: string,
    context?: { drugNames?: string[]; patientInfo?: string; currentMedications?: string[] }
  ): Promise<{ response: string; confidence: number } | null> => {
    if (!tenantId || !personnel?.id) return null;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('pharma-expert-consultation', {
        body: {
          question,
          consultationType: type,
          context
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        // Save consultation to history
        await supabase
          .from('ai_pharma_consultations')
          .insert({
            tenant_id: tenantId,
            question,
            ai_response: data.response,
            consultation_type: type,
            confidence: data.confidence,
            created_by: personnel.id
          });
        
        await loadConsultations();
        await loadMetrics();
        
        return {
          response: data.response,
          confidence: data.confidence
        };
      } else {
        throw new Error(data?.error || 'Erreur de consultation');
      }
    } catch (error) {
      console.error('Error asking AI:', error);
      toast.error('Erreur lors de la consultation IA');
      return null;
    } finally {
      setLoading(false);
    }
  }, [tenantId, personnel?.id, loadConsultations, loadMetrics]);

  // Rate consultation
  const rateConsultation = useCallback(async (id: string, isUseful: boolean, feedback?: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_pharma_consultations')
        .update({
          is_useful: isUseful,
          feedback
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      toast.success('Merci pour votre retour');
      await loadConsultations();
    } catch (error) {
      console.error('Error rating consultation:', error);
    }
  }, [tenantId, loadConsultations]);

  // Load config
  const loadConfig = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_pharma_expert_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setConfig({
          ...data,
          pharmacovigilance_sources: data.pharmacovigilance_sources || ['ANSM', 'EMA', 'FDA']
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }, [tenantId]);

  // Save config
  const saveConfig = useCallback(async (newConfig: Partial<PharmaExpertConfig>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('ai_pharma_expert_config')
        .upsert({
          tenant_id: tenantId,
          ...config,
          ...newConfig
        }, {
          onConflict: 'tenant_id'
        });
      
      if (error) throw error;
      toast.success('Configuration sauvegardée');
      await loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [tenantId, config, loadConfig]);

  // Initial load
  useEffect(() => {
    if (tenantId) {
      loadMetrics();
      loadDrugs();
      loadInteractions();
      loadRecommendations();
      loadPharmacovigilanceAlerts();
      loadComplianceChecks();
      loadConsultations();
      loadConfig();
    }
  }, [tenantId]);

  return {
    // State
    loading,
    metrics,
    drugDatabase,
    interactions,
    recommendations,
    pharmacovigilanceAlerts,
    complianceChecks,
    consultations,
    config,
    drugsPagination,
    
    // Actions
    loadMetrics,
    loadDrugs,
    loadInteractions,
    checkInteraction,
    createInteraction,
    deleteInteraction,
    loadRecommendations,
    createRecommendation,
    updateRecommendation,
    deleteRecommendation,
    loadPharmacovigilanceAlerts,
    acknowledgeAlert,
    loadComplianceChecks,
    runComplianceCheck,
    loadConsultations,
    askAI,
    rateConsultation,
    loadConfig,
    saveConfig
  };
};
