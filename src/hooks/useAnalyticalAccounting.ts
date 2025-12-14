import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ============= TYPES =============
export interface CostCenter {
  id: string;
  tenant_id: string;
  code: string;
  nom: string;
  type_centre: 'operationnel' | 'commercial' | 'support' | 'profit' | 'investissement';
  centre_parent_id?: string;
  niveau: number;
  responsable_id?: string;
  responsable?: {
    id: string;
    noms: string;
    prenoms: string;
  };
  est_actif: boolean;
  date_ouverture: string;
  date_fermeture?: string;
  compte_analytique_id?: string;
  objectif_marge_min?: number;
  objectif_rotation_stock?: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  tenant_id: string;
  libelle: string;
  exercice_comptable_id?: string;
  centre_cout_id?: string;
  centre?: CostCenter;
  compte_id?: string;
  type_periode: 'annuel' | 'trimestriel' | 'mensuel';
  date_debut: string;
  date_fin: string;
  annee: number;
  mois?: number;
  trimestre?: number;
  montant_prevu: number;
  montant_realise: number;
  montant_engage: number;
  ecart_montant: number;
  ecart_pourcentage: number;
  statut: 'previsionnel' | 'valide' | 'en_cours' | 'cloture' | 'annule';
  valide_par_id?: string;
  date_validation?: string;
  notes?: string;
  commentaire_ecart?: string;
  created_at: string;
  updated_at: string;
}

export interface AllocationKey {
  id: string;
  tenant_id: string;
  code: string;
  libelle: string;
  type_cle: 'chiffre_affaires' | 'nombre_employes' | 'surface_occupee' | 
    'couts_directs' | 'unites_produites' | 'heures_machine' | 'personnalisee';
  est_active: boolean;
  methode_calcul?: string;
  formule: any;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AllocationCoefficient {
  id: string;
  tenant_id: string;
  cle_repartition_id: string;
  cle?: AllocationKey;
  centre_cout_id: string;
  centre?: CostCenter;
  date_debut: string;
  date_fin?: string;
  coefficient: number;
  valeur_base?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChargeAllocation {
  id: string;
  tenant_id: string;
  numero_repartition: string;
  date_repartition: string;
  libelle: string;
  type_charge: 'frais_admin' | 'services_generaux' | 'maintenance' | 
    'assurances' | 'informatique' | 'autres';
  montant_total: number;
  montant_reparti: number;
  montant_non_reparti: number;
  cle_repartition_id?: string;
  cle?: AllocationKey;
  methode: 'automatique' | 'manuelle' | 'mixte';
  compte_charge_id?: string;
  ecriture_comptable_id?: string;
  statut: 'en_cours' | 'valide' | 'comptabilise' | 'annule';
  valide_par_id?: string;
  date_validation?: string;
  comptabilise_par_id?: string;
  date_comptabilisation?: string;
  notes?: string;
  lines?: AllocationLine[];
  created_at: string;
  updated_at: string;
}

export interface AllocationLine {
  id: string;
  tenant_id: string;
  repartition_id: string;
  centre_cout_id: string;
  centre?: CostCenter;
  coefficient: number;
  montant: number;
  compte_destination_id?: string;
  justification?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfitabilityData {
  produit_id: string;
  tenant_id: string;
  produit_nom: string;
  code_produit: string;
  famille: string;
  chiffre_affaires: number;
  quantite_vendue: number;
  cout_achat: number;
  marge_brute: number;
  taux_marge: number;
  derniere_vente?: string;
}

export interface CostCenterPerformance {
  id: string;
  code: string;
  nom: string;
  type_centre: string;
  responsable_nom: string;
  budget_total: number;
  realise_total: number;
  ecart_montant: number;
  ecart_pourcentage: number;
  nombre_budgets: number;
  budgets_depassement: number;
  est_actif: boolean;
}

export const useAnalyticalAccounting = () => {
  const { personnel } = useAuth();
  const tenantId = personnel?.tenant_id;

  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [allocationKeys, setAllocationKeys] = useState<AllocationKey[]>([]);
  const [coefficients, setCoefficients] = useState<AllocationCoefficient[]>([]);
  const [chargeAllocations, setChargeAllocations] = useState<ChargeAllocation[]>([]);
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityData[]>([]);
  
  const [isLoadingCenters, setIsLoadingCenters] = useState(false);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false);
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(false);
  const [isLoadingProfitability, setIsLoadingProfitability] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = isLoadingCenters || isLoadingBudgets || isLoadingAllocations || isLoadingProfitability;

  // ============= LOAD DATA =============
  const loadCostCenters = async () => {
    if (!tenantId) return;
    setIsLoadingCenters(true);
    try {
      const { data, error } = await supabase
        .from('centres_couts')
        .select(`
          *,
          responsable:personnel!centres_couts_responsable_id_fkey(id, noms, prenoms)
        `)
        .eq('tenant_id', tenantId)
        .order('code')
        .limit(5000);

      if (error) {
        console.error('Error loading cost centers details:', error.message, error.details, error.hint);
        throw error;
      }
      setCostCenters(data as any || []);
    } catch (error: any) {
      console.error('Error loading cost centers:', error);
      // Initialiser avec tableau vide sans toast si c'est le premier chargement
      setCostCenters([]);
    } finally {
      setIsLoadingCenters(false);
    }
  };

  const loadBudgets = async () => {
    if (!tenantId) return;
    setIsLoadingBudgets(true);
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          centre:centres_couts(id, code, nom)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10000); // ✅ Limite explicite pour éviter la pagination Supabase

      if (error) throw error;
      setBudgets(data as any || []);
    } catch (error: any) {
      console.error('Error loading budgets:', error);
      toast.error('Erreur lors du chargement des budgets');
    } finally {
      setIsLoadingBudgets(false);
    }
  };

  const loadAllocationKeys = async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('cles_repartition')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('code')
        .limit(2000); // ✅ Limite explicite pour éviter la pagination Supabase

      if (error) throw error;
      setAllocationKeys(data as any || []);
    } catch (error: any) {
      console.error('Error loading allocation keys:', error);
    }
  };

  const loadCoefficients = async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('coefficients_repartition')
        .select(`
          *,
          cle:cles_repartition(id, code, libelle),
          centre:centres_couts(id, code, nom)
        `)
        .eq('tenant_id', tenantId)
        .order('date_debut', { ascending: false })
        .limit(5000); // ✅ Limite explicite pour éviter la pagination Supabase

      if (error) throw error;
      setCoefficients(data as any || []);
    } catch (error: any) {
      console.error('Error loading coefficients:', error);
    }
  };

  const loadChargeAllocations = async () => {
    if (!tenantId) return;
    setIsLoadingAllocations(true);
    try {
      const { data, error } = await supabase
        .from('repartitions_charges')
        .select(`
          *,
          cle:cles_repartition(id, code, libelle)
        `)
        .eq('tenant_id', tenantId)
        .order('date_repartition', { ascending: false })
        .limit(5000); // ✅ Limite explicite pour éviter la pagination Supabase

      if (error) throw error;
      setChargeAllocations(data as any || []);
    } catch (error: any) {
      console.error('Error loading allocations:', error);
      toast.error('Erreur lors du chargement des répartitions');
    } finally {
      setIsLoadingAllocations(false);
    }
  };

  const loadProfitabilityData = async () => {
    if (!tenantId) return;
    setIsLoadingProfitability(true);
    try {
      // Utiliser la RPC corrigée pour charger les données avec les vrais calculs
      const { data, error } = await supabase.rpc('get_profitability_data', {
        p_tenant_id: tenantId,
        p_limit: 10000
      });

      if (error) throw error;
      setProfitabilityData(data as any || []);
    } catch (error: any) {
      console.error('Error loading profitability:', error);
      toast.error('Erreur lors du chargement de la rentabilité');
    } finally {
      setIsLoadingProfitability(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadCostCenters();
      loadBudgets();
      loadAllocationKeys();
      loadCoefficients();
      loadChargeAllocations();
      loadProfitabilityData();
    }
  }, [tenantId]);

  // ============= COST CENTERS =============
  const createCostCenter = async (center: Partial<CostCenter>): Promise<CostCenter> => {
    if (!tenantId || !personnel?.id) throw new Error('Missing tenant or personnel');
    setIsSaving(true);
    try {
      const { data: codeData } = await supabase.rpc('generate_cost_center_code', {
        p_tenant_id: tenantId
      });

      const { data, error } = await supabase
        .from('centres_couts')
        .insert([{
          code: codeData || 'CC001',
          nom: center.nom,
          type_centre: center.type_centre,
          centre_parent_id: center.centre_parent_id,
          niveau: center.niveau || 1,
          responsable_id: center.responsable_id,
          est_actif: center.est_actif ?? true,
          compte_analytique_id: center.compte_analytique_id,
          objectif_marge_min: center.objectif_marge_min,
          objectif_rotation_stock: center.objectif_rotation_stock,
          description: center.description,
          notes: center.notes,
          tenant_id: tenantId,
          created_by_id: personnel.id,
        }])
        .select()
        .single();

      if (error) throw error;
      await loadCostCenters();
      toast.success('Centre de coûts créé avec succès');
      return data as any;
    } catch (error: any) {
      console.error('Error creating cost center:', error);
      toast.error('Erreur lors de la création du centre de coûts');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updateCostCenter = async (id: string, center: Partial<CostCenter>): Promise<CostCenter> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      // Filtrer uniquement les colonnes valides de la table centres_couts
      const validColumns = [
        'code', 'nom', 'type_centre', 'centre_parent_id', 'niveau',
        'responsable_id', 'est_actif', 'date_ouverture', 'date_fermeture',
        'compte_analytique_id', 'objectif_marge_min', 'objectif_rotation_stock',
        'description', 'notes'
      ];
      
      const cleanedData = Object.fromEntries(
        Object.entries(center).filter(([key]) => validColumns.includes(key))
      );

      const { data, error } = await supabase
        .from('centres_couts')
        .update(cleanedData)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      await loadCostCenters();
      toast.success('Centre de coûts modifié');
      return data as any;
    } catch (error: any) {
      console.error('Error updating cost center:', error);
      toast.error('Erreur lors de la modification');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCostCenter = async (id: string): Promise<void> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('centres_couts')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      await loadCostCenters();
      toast.success('Centre de coûts supprimé');
    } catch (error: any) {
      console.error('Error deleting cost center:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCostCenterStatus = async (id: string): Promise<void> => {
    const center = costCenters.find(c => c.id === id);
    if (!center) return;
    await updateCostCenter(id, { est_actif: !center.est_actif });
  };

  // ============= BUDGETS =============
  const createBudget = async (budget: Partial<Budget>): Promise<Budget> => {
    if (!tenantId || !personnel?.id) throw new Error('Missing tenant or personnel');
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          libelle: budget.libelle,
          exercice_comptable_id: budget.exercice_comptable_id,
          centre_cout_id: budget.centre_cout_id,
          compte_id: budget.compte_id,
          type_periode: budget.type_periode,
          date_debut: budget.date_debut,
          date_fin: budget.date_fin,
          annee: budget.annee,
          mois: budget.mois,
          trimestre: budget.trimestre,
          montant_prevu: budget.montant_prevu || 0,
          montant_engage: budget.montant_engage || 0,
          statut: budget.statut || 'previsionnel',
          notes: budget.notes,
          tenant_id: tenantId,
          created_by_id: personnel.id,
        }])
        .select()
        .single();

      if (error) throw error;
      await loadBudgets();
      toast.success('Budget créé avec succès');
      return data as any;
    } catch (error: any) {
      console.error('Error creating budget:', error);
      toast.error('Erreur lors de la création du budget');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updateBudget = async (id: string, budget: Partial<Budget>): Promise<Budget> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      // Filtrer uniquement les colonnes valides de la table budgets
      const validColumns = [
        'libelle', 'exercice_comptable_id', 'centre_cout_id', 'compte_id',
        'type_periode', 'date_debut', 'date_fin', 'annee', 'mois', 'trimestre',
        'montant_prevu', 'montant_realise', 'montant_engage', 'ecart_montant',
        'ecart_pourcentage', 'statut', 'valide_par_id', 'date_validation',
        'notes', 'commentaire_ecart'
      ];
      
      const cleanedData = Object.fromEntries(
        Object.entries(budget).filter(([key]) => validColumns.includes(key))
      );
      
      const { data, error } = await supabase
        .from('budgets')
        .update(cleanedData)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      await loadBudgets();
      toast.success('Budget modifié');
      return data as any;
    } catch (error: any) {
      console.error('Error updating budget:', error);
      toast.error('Erreur lors de la modification');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBudget = async (id: string): Promise<void> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      await loadBudgets();
      toast.success('Budget supprimé');
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const validateBudget = async (id: string): Promise<void> => {
    if (!personnel?.id) throw new Error('Missing personnel');
    await updateBudget(id, {
      statut: 'valide',
      valide_par_id: personnel.id,
      date_validation: new Date().toISOString(),
    });
  };

  const generateBudgets = async (params: {
    centreId: string;
    annee: number;
    typePeriode: 'mensuel' | 'trimestriel' | 'annuel';
    montantTotal: number;
  }): Promise<Budget[]> => {
    if (!tenantId || !personnel?.id) throw new Error('Missing tenant or personnel');
    setIsSaving(true);
    
    try {
      const budgetsToCreate: any[] = [];
      const { centreId, annee, typePeriode, montantTotal } = params;

      if (typePeriode === 'mensuel') {
        const montantMensuel = montantTotal / 12;
        for (let mois = 1; mois <= 12; mois++) {
          const dateDebut = new Date(annee, mois - 1, 1);
          const dateFin = new Date(annee, mois, 0);
          budgetsToCreate.push({
            tenant_id: tenantId,
            libelle: `Budget ${dateDebut.toLocaleString('fr', { month: 'long' })} ${annee}`,
            centre_cout_id: centreId,
            type_periode: 'mensuel',
            date_debut: dateDebut.toISOString().split('T')[0],
            date_fin: dateFin.toISOString().split('T')[0],
            annee,
            mois,
            montant_prevu: montantMensuel,
            statut: 'previsionnel',
            created_by_id: personnel.id,
          });
        }
      } else if (typePeriode === 'trimestriel') {
        const montantTrimestriel = montantTotal / 4;
        for (let trimestre = 1; trimestre <= 4; trimestre++) {
          const dateDebut = new Date(annee, (trimestre - 1) * 3, 1);
          const dateFin = new Date(annee, trimestre * 3, 0);
          budgetsToCreate.push({
            tenant_id: tenantId,
            libelle: `Budget T${trimestre} ${annee}`,
            centre_cout_id: centreId,
            type_periode: 'trimestriel',
            date_debut: dateDebut.toISOString().split('T')[0],
            date_fin: dateFin.toISOString().split('T')[0],
            annee,
            trimestre,
            montant_prevu: montantTrimestriel,
            statut: 'previsionnel',
            created_by_id: personnel.id,
          });
        }
      } else {
        budgetsToCreate.push({
          tenant_id: tenantId,
          libelle: `Budget annuel ${annee}`,
          centre_cout_id: centreId,
          type_periode: 'annuel',
          date_debut: `${annee}-01-01`,
          date_fin: `${annee}-12-31`,
          annee,
          montant_prevu: montantTotal,
          statut: 'previsionnel',
          created_by_id: personnel.id,
        });
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert(budgetsToCreate as any)
        .select();

      if (error) throw error;
      await loadBudgets();
      toast.success(`${budgetsToCreate.length} budget(s) généré(s)`);
      return data as any;
    } catch (error: any) {
      console.error('Error generating budgets:', error);
      toast.error('Erreur lors de la génération des budgets');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // ============= ALLOCATION KEYS =============
  const createAllocationKey = async (key: Partial<AllocationKey>): Promise<AllocationKey> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('cles_repartition')
        .insert([{ ...key, tenant_id: tenantId } as any])
        .select()
        .single();

      if (error) throw error;
      await loadAllocationKeys();
      toast.success('Clé de répartition créée');
      return data as any;
    } catch (error: any) {
      console.error('Error creating allocation key:', error);
      toast.error('Erreur lors de la création');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updateAllocationKey = async (id: string, key: Partial<AllocationKey>): Promise<AllocationKey> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('cles_repartition')
        .update(key as any)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      await loadAllocationKeys();
      toast.success('Clé de répartition modifiée');
      return data as any;
    } catch (error: any) {
      console.error('Error updating allocation key:', error);
      toast.error('Erreur lors de la modification');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAllocationKey = async (id: string): Promise<void> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cles_repartition')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      await loadAllocationKeys();
      toast.success('Clé de répartition supprimée');
    } catch (error: any) {
      console.error('Error deleting allocation key:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // ============= COEFFICIENTS =============
  const createCoefficient = async (coef: Partial<AllocationCoefficient>): Promise<AllocationCoefficient> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('coefficients_repartition')
        .insert([{ ...coef, tenant_id: tenantId } as any])
        .select()
        .single();

      if (error) throw error;
      await loadCoefficients();
      toast.success('Coefficient créé');
      return data as any;
    } catch (error: any) {
      console.error('Error creating coefficient:', error);
      toast.error('Erreur lors de la création');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updateCoefficient = async (id: string, coef: Partial<AllocationCoefficient>): Promise<AllocationCoefficient> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('coefficients_repartition')
        .update(coef as any)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      await loadCoefficients();
      toast.success('Coefficient modifié');
      return data as any;
    } catch (error: any) {
      console.error('Error updating coefficient:', error);
      toast.error('Erreur lors de la modification');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCoefficient = async (id: string): Promise<void> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('coefficients_repartition')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      await loadCoefficients();
      toast.success('Coefficient supprimé');
    } catch (error: any) {
      console.error('Error deleting coefficient:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAutomaticAllocation = async (params: {
    montantTotal: number;
    cleRepartitionId: string;
    dateRef: string;
  }): Promise<AllocationLine[]> => {
    if (!tenantId) throw new Error('Missing tenant');
    
    try {
      const { data, error } = await supabase.rpc('calculate_automatic_allocation', {
        p_tenant_id: tenantId,
        p_cle_id: params.cleRepartitionId,
        p_montant_total: params.montantTotal,
        p_date_ref: params.dateRef,
      });

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: '',
        tenant_id: tenantId,
        repartition_id: '',
        centre_cout_id: item.centre_cout_id,
        coefficient: item.coefficient,
        montant: item.montant,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    } catch (error: any) {
      console.error('Error calculating allocation:', error);
      toast.error('Erreur lors du calcul automatique');
      throw error;
    }
  };

  // ============= CHARGE ALLOCATIONS =============
  const createChargeAllocation = async (allocation: Partial<ChargeAllocation>): Promise<ChargeAllocation> => {
    if (!tenantId || !personnel?.id) throw new Error('Missing tenant or personnel');
    setIsSaving(true);
    try {
      const year = new Date(allocation.date_repartition || new Date()).getFullYear();
      const month = String(new Date(allocation.date_repartition || new Date()).getMonth() + 1).padStart(2, '0');
      
      const { count } = await supabase
        .from('repartitions_charges')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .like('numero_repartition', `REP-${year}${month}-%`);

      const numero = `REP-${year}${month}-${String((count || 0) + 1).padStart(4, '0')}`;

      const { data, error } = await supabase
        .from('repartitions_charges')
        .insert([{
          numero_repartition: numero,
          date_repartition: allocation.date_repartition,
          libelle: allocation.libelle,
          type_charge: allocation.type_charge,
          montant_total: allocation.montant_total,
          cle_repartition_id: allocation.cle_repartition_id,
          methode: allocation.methode,
          compte_charge_id: allocation.compte_charge_id,
          statut: allocation.statut || 'en_cours',
          notes: allocation.notes,
          tenant_id: tenantId,
          created_by_id: personnel.id,
        } as any])
        .select()
        .single();

      if (error) throw error;
      await loadChargeAllocations();
      toast.success('Répartition créée');
      return data as any;
    } catch (error: any) {
      console.error('Error creating allocation:', error);
      toast.error('Erreur lors de la création');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updateChargeAllocation = async (id: string, allocation: Partial<ChargeAllocation>): Promise<ChargeAllocation> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('repartitions_charges')
        .update(allocation as any)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      await loadChargeAllocations();
      toast.success('Répartition modifiée');
      return data as any;
    } catch (error: any) {
      console.error('Error updating allocation:', error);
      toast.error('Erreur lors de la modification');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteChargeAllocation = async (id: string): Promise<void> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('repartitions_charges')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      await loadChargeAllocations();
      toast.success('Répartition supprimée');
    } catch (error: any) {
      console.error('Error deleting allocation:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const validateChargeAllocation = async (id: string): Promise<void> => {
    if (!personnel?.id) throw new Error('Missing personnel');
    await updateChargeAllocation(id, {
      statut: 'valide',
      valide_par_id: personnel.id,
      date_validation: new Date().toISOString(),
    });
  };

  // ============= ALLOCATION LINES =============
  const createAllocationLines = async (repartitionId: string, lines: Partial<AllocationLine>[]): Promise<void> => {
    if (!tenantId) throw new Error('Missing tenant');
    setIsSaving(true);
    try {
      const linesToInsert = lines.map(line => ({
        tenant_id: tenantId,
        repartition_id: repartitionId,
        centre_cout_id: line.centre_cout_id,
        coefficient: line.coefficient,
        montant: line.montant,
        compte_destination_id: line.compte_destination_id,
        justification: line.justification,
      }));

      const { error } = await supabase
        .from('lignes_repartition')
        .insert(linesToInsert as any);

      if (error) throw error;
      toast.success('Lignes de répartition créées');
    } catch (error: any) {
      console.error('Error creating allocation lines:', error);
      toast.error('Erreur lors de la création des lignes');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // ============= ANALYTICS =============
  const getCostCenterPerformance = async (filters?: {
    annee?: number;
    typeCentre?: string;
  }): Promise<CostCenterPerformance[]> => {
    if (!tenantId) return [];
    
    try {
      const { data, error } = await supabase.rpc('get_center_performance_data' as any, {
        p_tenant_id: tenantId,
        p_annee: filters?.annee || null,
      });

      if (error) throw error;
      return (data || []) as any;
    } catch (error: any) {
      console.error('Error getting performance:', error);
      return [];
    }
  };

  // ============= KPIs =============
  const getAnalyticsKPIs = useMemo(() => {
    const activeCenters = costCenters.filter(c => c.est_actif);
    const totalBudget = budgets.reduce((sum, b) => sum + b.montant_prevu, 0);
    const totalRealise = budgets.reduce((sum, b) => sum + b.montant_realise, 0);
    const ecartMoyen = budgets.length > 0 
      ? budgets.reduce((sum, b) => sum + b.ecart_pourcentage, 0) / budgets.length 
      : 0;
    
    const centresDepassement = budgets.filter(b => b.ecart_pourcentage > 5).length;
    const centresSousBudget = budgets.filter(b => b.ecart_pourcentage < -5).length;
    
    const margeGlobale = profitabilityData.length > 0
      ? profitabilityData.reduce((sum, p) => sum + p.taux_marge, 0) / profitabilityData.length
      : 0;

    return {
      nombreCentresActifs: activeCenters.length,
      budgetTotal: totalBudget,
      realiseTotal: totalRealise,
      ecartMoyen,
      margeGlobale,
      centresDepassement,
      centresSousBudget,
    };
  }, [costCenters, budgets, profitabilityData]);

  const getBudgetAlerts = useMemo(() => {
    const alerts: Array<{
      type: 'depassement' | 'sous_budget' | 'ecart_significatif';
      centre: string;
      message: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    budgets.forEach(budget => {
      const centre = costCenters.find(c => c.id === budget.centre_cout_id);
      if (!centre) return;

      if (budget.ecart_pourcentage > 10) {
        alerts.push({
          type: 'depassement',
          centre: centre.nom,
          message: `Dépassement de ${budget.ecart_pourcentage.toFixed(1)}% du budget`,
          severity: budget.ecart_pourcentage > 20 ? 'high' : 'medium',
        });
      } else if (budget.ecart_pourcentage < -10) {
        alerts.push({
          type: 'sous_budget',
          centre: centre.nom,
          message: `Sous-consommation de ${Math.abs(budget.ecart_pourcentage).toFixed(1)}%`,
          severity: 'low',
        });
      }
    });

    return alerts;
  }, [budgets, costCenters]);

  const refreshAll = async () => {
    await Promise.all([
      loadCostCenters(),
      loadBudgets(),
      loadAllocationKeys(),
      loadCoefficients(),
      loadChargeAllocations(),
      loadProfitabilityData(),
    ]);
  };

  return {
    // Data
    costCenters,
    budgets,
    allocationKeys,
    coefficients,
    chargeAllocations,
    profitabilityData,
    
    // Loading states
    isLoadingCenters,
    isLoadingBudgets,
    isLoadingAllocations,
    isLoadingProfitability,
    isLoading,
    isSaving,
    
    // Cost centers
    createCostCenter,
    updateCostCenter,
    deleteCostCenter,
    toggleCostCenterStatus,
    
    // Budgets
    createBudget,
    updateBudget,
    deleteBudget,
    validateBudget,
    generateBudgets,
    
    // Allocation keys
    createAllocationKey,
    updateAllocationKey,
    deleteAllocationKey,
    
    // Coefficients
    createCoefficient,
    updateCoefficient,
    deleteCoefficient,
    
    // Charge allocations
    createChargeAllocation,
    updateChargeAllocation,
    deleteChargeAllocation,
    validateChargeAllocation,
    calculateAutomaticAllocation,
    createAllocationLines,
    
    // Analytics
    getCostCenterPerformance,
    getAnalyticsKPIs,
    getBudgetAlerts,
    
    // Utilities
    refreshAll,
  };
};
