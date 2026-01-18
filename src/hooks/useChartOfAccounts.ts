import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export interface Account {
  id: string;
  code: string;
  libelle: string;
  classe: number;
  type: 'detail' | 'titre' | 'sous-titre';
  parent_id?: string;
  niveau: number;
  actif: boolean;
  analytique: boolean;
  rapprochement: boolean;
  description?: string;
  solde_debiteur: number;
  solde_crediteur: number;
  children?: Account[];
}

export interface CoaRegionalParams {
  id: string;
  tenant_id: string;
  code_pays: string;
  pays: string;
  systeme_comptable: string;
  version_systeme: string;
  classes_definition: Array<{
    classe: number;
    nom: string;
    description: string;
    icon: string;
    color: string;
  }>;
  format_code_compte: string;
  longueur_code_min: number;
  longueur_code_max: number;
  devise_principale: string;
  symbole_devise: string;
  separateur_milliers: string;
  separateur_decimal: string;
  position_symbole_devise: string;
  validation_code_strict: boolean;
  autoriser_comptes_negatifs: boolean;
  gestion_analytique_obligatoire: boolean;
  organisme_normalisation: string;
  reference_reglementaire: string;
  mentions_legales_plan: string;
}

interface UseChartOfAccountsReturn {
  accounts: Account[];
  accountsTree: Account[];
  accountsByClass: Record<number, Account[]>;
  analyticalAccounts: Account[];
  loading: boolean;
  error: string | null;
  isSaving: boolean;
  createAccount: (data: Omit<Account, 'id' | 'solde_debiteur' | 'solde_crediteur' | 'children'>) => Promise<void>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleAccountStatus: (id: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  getAccountById: (id: string) => Account | undefined;
  searchAccounts: (term: string) => Account[];
  // Regional parameters
  coaParams: CoaRegionalParams | null | undefined;
  loadingCoaParams: boolean;
  // Regional utilities
  getAccountingSystemName: () => string;
  getAccountingSystemVersion: () => string;
  getClassesDefinition: () => Array<any>;
  formatAmount: (amount: number) => string;
  validateAccountCode: (code: string) => boolean;
  getAccountingRules: () => any;
  getLegalMentions: () => string;
  getRegulatoryBody: () => string;
}

const defaultOhadaClasses = [
  { classe: 1, nom: 'Comptes de ressources durables', description: 'Capitaux propres et dettes à plus d\'un an', icon: 'Building', color: 'text-blue-600' },
  { classe: 2, nom: 'Comptes d\'actif immobilisé', description: 'Immobilisations corporelles et incorporelles', icon: 'BookOpen', color: 'text-green-600' },
  { classe: 3, nom: 'Comptes de stocks', description: 'Stocks de marchandises et produits', icon: 'Package', color: 'text-orange-600' },
  { classe: 4, nom: 'Comptes de tiers', description: 'Créances et dettes d\'exploitation', icon: 'Briefcase', color: 'text-purple-600' },
  { classe: 5, nom: 'Comptes de trésorerie', description: 'Comptes financiers et valeurs mobilières', icon: 'CreditCard', color: 'text-cyan-600' },
  { classe: 6, nom: 'Comptes de charges des activités ordinaires', description: 'Charges liées à l\'exploitation courante', icon: 'TrendingUp', color: 'text-red-600' },
  { classe: 7, nom: 'Comptes de produits des activités ordinaires', description: 'Produits liés à l\'exploitation courante', icon: 'DollarSign', color: 'text-emerald-600' },
  { classe: 8, nom: 'Comptes des autres charges et produits', description: 'Charges et produits hors activités ordinaires', icon: 'Calculator', color: 'text-orange-500' },
  { classe: 9, nom: 'Comptes des engagements hors bilan et CAGE', description: 'Engagements donnés et reçus, comptabilité analytique', icon: 'FileText', color: 'text-slate-600' }
];

export const useChartOfAccounts = (): UseChartOfAccountsReturn => {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Query paramètres régionaux Plan Comptable
  const { data: coaParams, isLoading: isLoadingCOA } = useQuery({
    queryKey: ['coa-regional-params', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const { data, error } = await supabase
        .from('parametres_plan_comptable_regionaux')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Auto-init avec Congo par défaut
        await supabase.rpc('init_coa_params_for_tenant', {
          p_tenant_id: tenantId,
          p_country_code: 'CG'
        });
        const { data: retryData } = await supabase
          .from('parametres_plan_comptable_regionaux')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();
        return retryData as unknown as CoaRegionalParams | null;
      }
      
      if (error) throw error;
      return data as unknown as CoaRegionalParams | null;
    },
    enabled: !!tenantId,
  });

  // Charger tous les comptes depuis la vue avec les soldes
  const loadAccounts = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .rpc('get_account_hierarchy', { p_tenant_id: tenantId });

      if (queryError) throw queryError;

      const formattedAccounts: Account[] = (data || []).map((account: any) => ({
        id: account.id,
        code: account.code,
        libelle: account.libelle,
        type: account.type,
        classe: account.classe,
        parent_id: account.parent_id,
        niveau: account.niveau,
        actif: account.actif,
        analytique: account.analytique,
        rapprochement: account.rapprochement,
        description: account.description,
        solde_debiteur: parseFloat(account.solde_debiteur || 0),
        solde_crediteur: parseFloat(account.solde_crediteur || 0)
      }));

      setAccounts(formattedAccounts);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des comptes';
      setError(errorMessage);
      console.error('Erreur chargement comptes:', err);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Construire l'arbre hiérarchique
  const accountsTree = useCallback(() => {
    const accountMap = new Map<string, Account>();
    const rootAccounts: Account[] = [];

    // Créer une copie de tous les comptes avec un tableau children vide
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Construire la hiérarchie
    accounts.forEach(account => {
      const accountNode = accountMap.get(account.id);
      if (!accountNode) return;

      if (account.parent_id) {
        const parent = accountMap.get(account.parent_id);
        if (parent && parent.children) {
          parent.children.push(accountNode);
        }
      } else {
        rootAccounts.push(accountNode);
      }
    });

    return rootAccounts;
  }, [accounts])();

  // Regrouper les comptes par classe
  const accountsByClass = useCallback(() => {
    const grouped: Record<number, Account[]> = {};
    accounts.forEach(account => {
      if (!grouped[account.classe]) {
        grouped[account.classe] = [];
      }
      grouped[account.classe].push(account);
    });
    return grouped;
  }, [accounts])();

  // Filtrer les comptes analytiques
  const analyticalAccounts = accounts.filter(account => account.analytique);

  // Créer un nouveau compte
  const createAccount = async (data: Omit<Account, 'id' | 'solde_debiteur' | 'solde_crediteur' | 'children'>) => {
    if (!tenantId) {
      toast({
        title: 'Erreur',
        description: 'Tenant non identifié',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true);

      // Vérifier l'unicité du code compte
      const { data: existing } = await supabase
        .from('plan_comptable')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('numero_compte', data.code)
        .maybeSingle();

      if (existing) {
        toast({
          title: 'Erreur',
          description: 'Ce code de compte existe déjà',
          variant: 'destructive'
        });
        return;
      }

      // Insérer le nouveau compte
      const { error: insertError } = await supabase
        .from('plan_comptable')
        .insert({
          tenant_id: tenantId,
          numero_compte: data.code,
          libelle_compte: data.libelle,
          type_compte: data.type,
          classe: data.classe,
          compte_parent_id: data.parent_id || null,
          niveau: data.niveau,
          is_active: data.actif,
          analytique: data.analytique,
          rapprochement: data.rapprochement,
          description: data.description || null
        });

      if (insertError) throw insertError;

      toast({
        title: 'Succès',
        description: 'Compte créé avec succès'
      });

      await loadAccounts();
    } catch (err: any) {
      console.error('Erreur création compte:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Erreur lors de la création du compte',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Modifier un compte
  const updateAccount = async (id: string, data: Partial<Account>) => {
    if (!tenantId) return;

    try {
      setIsSaving(true);

      const updateData: any = {};
      if (data.code !== undefined) updateData.numero_compte = data.code;
      if (data.libelle !== undefined) updateData.libelle_compte = data.libelle;
      if (data.type !== undefined) updateData.type_compte = data.type;
      if (data.classe !== undefined) updateData.classe = data.classe;
      if (data.parent_id !== undefined) updateData.compte_parent_id = data.parent_id;
      if (data.niveau !== undefined) updateData.niveau = data.niveau;
      if (data.actif !== undefined) updateData.is_active = data.actif;
      if (data.analytique !== undefined) updateData.analytique = data.analytique;
      if (data.rapprochement !== undefined) updateData.rapprochement = data.rapprochement;
      if (data.description !== undefined) updateData.description = data.description;

      const { error: updateError } = await supabase
        .from('plan_comptable')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (updateError) throw updateError;

      toast({
        title: 'Succès',
        description: 'Compte modifié avec succès'
      });

      await loadAccounts();
    } catch (err: any) {
      console.error('Erreur modification compte:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Erreur lors de la modification du compte',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer un compte
  const deleteAccount = async (id: string) => {
    if (!tenantId) return;

    try {
      setIsSaving(true);

      // Vérifier si le compte peut être supprimé
      const { data: canDelete } = await supabase
        .rpc('can_delete_account', { 
          p_account_id: id, 
          p_tenant_id: tenantId 
        });

      const canDeleteData = canDelete as any;
      if (!canDeleteData?.can_delete) {
        toast({
          title: 'Impossible de supprimer',
          description: canDeleteData?.message || 'Ce compte ne peut pas être supprimé',
          variant: 'destructive'
        });
        return;
      }

      const { error: deleteError } = await supabase
        .from('plan_comptable')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Succès',
        description: 'Compte supprimé avec succès'
      });

      await loadAccounts();
    } catch (err: any) {
      console.error('Erreur suppression compte:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Erreur lors de la suppression du compte',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Activer/désactiver un compte
  const toggleAccountStatus = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    await updateAccount(id, { actif: !account.actif });
  };

  // Rafraîchir les comptes
  const refreshAccounts = loadAccounts;

  // Récupérer un compte par ID
  const getAccountById = (id: string): Account | undefined => {
    return accounts.find(account => account.id === id);
  };

  // Rechercher des comptes
  const searchAccounts = (term: string): Account[] => {
    const searchTerm = term.toLowerCase();
    return accounts.filter(account => 
      account.code.toLowerCase().includes(searchTerm) ||
      account.libelle.toLowerCase().includes(searchTerm) ||
      (account.description && account.description.toLowerCase().includes(searchTerm))
    );
  };

  // Regional utilities
  const getAccountingSystemName = useCallback((): string => {
    return coaParams?.systeme_comptable || 'OHADA';
  }, [coaParams]);

  const getAccountingSystemVersion = useCallback((): string => {
    return coaParams?.version_systeme || 'OHADA 2017';
  }, [coaParams]);

  const getClassesDefinition = useCallback((): any[] => {
    if (!coaParams?.classes_definition) {
      return defaultOhadaClasses;
    }
    return coaParams.classes_definition as any[];
  }, [coaParams]);

  const formatAmount = useCallback((amount: number): string => {
    if (!coaParams) {
      return amount.toLocaleString('fr-CG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    const formatted = amount.toFixed(2);
    const [integer, decimal] = formatted.split('.');
    
    const integerFormatted = integer.replace(
      /\B(?=(\d{3})+(?!\d))/g, 
      coaParams.separateur_milliers
    );
    
    const numberFormatted = `${integerFormatted}${coaParams.separateur_decimal}${decimal}`;
    
    if (coaParams.position_symbole_devise === 'before') {
      return `${coaParams.symbole_devise} ${numberFormatted}`;
    }
    return `${numberFormatted} ${coaParams.symbole_devise}`;
  }, [coaParams]);

  const validateAccountCode = useCallback((code: string): boolean => {
    if (!coaParams) return true;
    
    const regex = new RegExp(coaParams.format_code_compte);
    const lengthValid = code.length >= coaParams.longueur_code_min && 
                        code.length <= coaParams.longueur_code_max;
    
    return regex.test(code) && lengthValid;
  }, [coaParams]);

  const getAccountingRules = useCallback(() => {
    if (!coaParams) return null;
    return {
      validationCodeStrict: coaParams.validation_code_strict,
      autoriserComptesNegatifs: coaParams.autoriser_comptes_negatifs,
      gestionAnalytiqueObligatoire: coaParams.gestion_analytique_obligatoire,
    };
  }, [coaParams]);

  const getLegalMentions = useCallback((): string => {
    return coaParams?.mentions_legales_plan || '';
  }, [coaParams]);

  const getRegulatoryBody = useCallback((): string => {
    return coaParams?.organisme_normalisation || 'OHADA';
  }, [coaParams]);

  return {
    accounts,
    accountsTree,
    accountsByClass,
    analyticalAccounts,
    loading: loading || isLoadingCOA,
    error,
    isSaving,
    createAccount,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
    refreshAccounts,
    getAccountById,
    searchAccounts,
    // Regional parameters
    coaParams,
    loadingCoaParams: isLoadingCOA,
    // Regional utilities
    getAccountingSystemName,
    getAccountingSystemVersion,
    getClassesDefinition,
    formatAmount,
    validateAccountCode,
    getAccountingRules,
    getLegalMentions,
    getRegulatoryBody,
  };
};