import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { generateTransactionReference } from "@/services/TransactionReferenceService";
import { generateBankTransactionEntry, BankTransactionEcritureData } from "@/services/BankTransactionAccountingService";
import { TRANSACTION_STATUS, isReconciled } from "@/constants/transactionStatus";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ==================== TYPES USING SUPABASE GENERATED TYPES ====================

type BankAccount = Database['public']['Tables']['comptes_bancaires']['Row'];
type BankAccountInsert = Database['public']['Tables']['comptes_bancaires']['Insert'];

type BankTransaction = Database['public']['Tables']['transactions_bancaires']['Row'];
type BankTransactionInsert = Database['public']['Tables']['transactions_bancaires']['Insert'];

type BankReconciliation = Database['public']['Tables']['rapprochements_bancaires']['Row'];
type BankReconciliationInsert = Database['public']['Tables']['rapprochements_bancaires']['Insert'];

type CategorizationRule = Database['public']['Tables']['regles_categorisation_bancaire']['Row'];
type CategorizationRuleInsert = Database['public']['Tables']['regles_categorisation_bancaire']['Insert'];

type TreasuryForecast = Database['public']['Tables']['previsions_tresorerie']['Row'];
type TreasuryForecastInsert = Database['public']['Tables']['previsions_tresorerie']['Insert'];

type TreasuryCommitment = Database['public']['Tables']['engagements_tresorerie']['Row'];
type TreasuryCommitmentInsert = Database['public']['Tables']['engagements_tresorerie']['Insert'];

type TreasuryAlert = Database['public']['Tables']['alertes_tresorerie']['Row'];
type TreasuryAlertInsert = Database['public']['Tables']['alertes_tresorerie']['Insert'];

type BankingParameters = Database['public']['Tables']['parametres_bancaires']['Row'];
type BankingParametersUpdate = Database['public']['Tables']['parametres_bancaires']['Update'];

export interface BankingRegionalParams {
  id: string;
  tenant_id: string;
  pays: string;
  code_pays: string;
  devise_principale: string;
  format_rib: string;
  longueur_rib: number | null;
  format_iban: string | null;
  banque_centrale: string;
  format_import_defaut: string;
  liste_banques: { code: string; name: string }[];
  validation_regex_rib: string | null;
  validation_regex_iban: string | null;
  mention_legale_footer: string;
  seuil_alerte_bas: number;
  seuil_alerte_critique: number;
  created_at: string;
  updated_at: string;
}

// Export types for external use
export type { BankAccount, BankTransaction, BankReconciliation, CategorizationRule, TreasuryForecast, TreasuryCommitment, TreasuryAlert, BankingParameters };

// ==================== MAIN HOOK ====================

export const useBankingManager = () => {
  const { tenantId } = useTenant();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();

  // ========== REGIONAL PARAMETERS ==========

  // Default regional params for fallback
  const defaultRegionalParams: BankingRegionalParams = {
    id: '',
    tenant_id: tenantId || '',
    pays: 'Congo-Brazzaville',
    code_pays: 'CG',
    devise_principale: 'XAF',
    format_rib: '23_digits',
    longueur_rib: 23,
    format_iban: 'CG + 25 digits',
    banque_centrale: 'BEAC',
    format_import_defaut: 'CSV_BEAC',
    liste_banques: [
      { code: '10001', name: 'UBA CONGO' },
      { code: '10002', name: 'BGFI BANK CONGO' },
      { code: '10003', name: 'ECOBANK CONGO' },
      { code: '10004', name: 'LCB BANK' },
      { code: '10005', name: 'CRÉDIT DU CONGO' }
    ],
    validation_regex_rib: '^\\d{23}$',
    validation_regex_iban: '^CG\\d{25}$',
    mention_legale_footer: 'Conforme aux normes BEAC - République du Congo',
    seuil_alerte_bas: 500000,
    seuil_alerte_critique: 100000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: regionalParams, isLoading: loadingRegionalParams } = useQuery({
    queryKey: ["banking-regional-params", tenantId],
    queryFn: async () => {
      if (!tenantId) return defaultRegionalParams;
      
      const { data, error } = await supabase
        .from("parametres_regionaux_bancaires")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      
      // Si erreur autre que "pas de données", on log et retourne les valeurs par défaut
      if (error && error.code !== 'PGRST116') {
        console.warn("Erreur fetch regional params:", error);
        return defaultRegionalParams;
      }
      
      // Si pas de données, tenter d'initialiser via RPC
      if (!data) {
        try {
          await supabase.rpc(
            'init_banking_params_for_tenant',
            { p_tenant_id: tenantId, p_country_code: 'CG' }
          );
          
          // Refetch après init
          const { data: createdData } = await supabase
            .from("parametres_regionaux_bancaires")
            .select("*")
            .eq("tenant_id", tenantId)
            .maybeSingle();
          
          return (createdData as BankingRegionalParams) || defaultRegionalParams;
        } catch (rpcError) {
          console.warn("Erreur init params régionaux:", rpcError);
          return defaultRegionalParams;
        }
      }
      
      return data as BankingRegionalParams;
    },
    enabled: !!tenantId,
  });

  // ========== BANK ACCOUNTS ==========

  const { data: bankAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["bank-accounts", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("comptes_bancaires")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createBankAccount = useMutation({
    mutationFn: async (account: Partial<BankAccountInsert>) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      // Initialiser solde_actuel avec solde_initial à la création
      const accountData = {
        ...account,
        tenant_id: tenantId,
        solde_actuel: account.solde_initial || 0,
        solde_rapproche: 0
      } as BankAccountInsert;
      
      const { data, error } = await supabase
        .from("comptes_bancaires")
        .insert([accountData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast({ title: "Compte bancaire créé avec succès" });
    },
  });

  const updateBankAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BankAccount> & { id: string }) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("comptes_bancaires")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast({ title: "Compte bancaire mis à jour" });
    },
  });

  const deleteBankAccount = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { error } = await supabase
        .from("comptes_bancaires")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast({ title: "Compte bancaire supprimé" });
    },
  });

  // ========== TRANSACTIONS ==========

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["bank-transactions", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("transactions_bancaires")
        .select("*, compte:comptes_bancaires(nom_compte, banque)")
        .eq("tenant_id", tenantId)
        .order("date_transaction", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: Partial<BankTransactionInsert>) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      // Générer automatiquement la référence si non fournie
      let reference = transaction.reference;
      if (!reference || reference.trim() === '') {
        reference = await generateTransactionReference(tenantId);
      }
      
      const { data, error } = await supabase
        .from("transactions_bancaires")
        .insert([{ 
          ...transaction, 
          reference,
          tenant_id: tenantId 
        } as BankTransactionInsert])
        .select()
        .single();
      
      if (error) throw error;

      // Générer l'écriture comptable automatiquement si une catégorie est renseignée
      if (data && data.categorie) {
        const ecritureData: BankTransactionEcritureData = {
          transactionId: data.id,
          tenantId,
          compteBancaireId: data.compte_bancaire_id,
          montant: data.montant,
          typeTransaction: data.type_transaction as 'credit' | 'debit',
          categorie: data.categorie,
          libelle: data.libelle,
          dateTransaction: data.date_transaction,
          reference: data.reference
        };
        
        try {
          await generateBankTransactionEntry(ecritureData);
          console.log('✅ Écriture comptable générée automatiquement à la création');
        } catch (err) {
          console.warn('⚠️ Impossible de générer l\'écriture comptable:', err);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-entries"] });
      toast({ title: "Transaction créée" });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BankTransaction> & { id: string }) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("transactions_bancaires")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      toast({ title: "Transaction mise à jour" });
    },
  });

  // ========== RECONCILIATION ==========

  const { data: reconciliations = [], isLoading: loadingReconciliations } = useQuery({
    queryKey: ["bank-reconciliations", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("rapprochements_bancaires")
        .select("*, compte:comptes_bancaires(nom_compte)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createReconciliation = useMutation({
    mutationFn: async (reconciliation: Partial<BankReconciliationInsert>) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("rapprochements_bancaires")
        .insert([{ ...reconciliation, tenant_id: tenantId } as BankReconciliationInsert])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-reconciliations"] });
      toast({ title: "Rapprochement créé" });
    },
  });

  const updateReconciliation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BankReconciliation> & { id: string }) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("rapprochements_bancaires")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-reconciliations"] });
      toast({ title: "Rapprochement mis à jour" });
    },
  });

  // ========== CATEGORIZATION RULES ==========

  const { data: categorizationRules = [] } = useQuery({
    queryKey: ["categorization-rules", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("regles_categorisation_bancaire")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("est_actif", true)
        .order("priorite", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createCategorizationRule = useMutation({
    mutationFn: async (rule: Partial<CategorizationRuleInsert>) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("regles_categorisation_bancaire")
        .insert([{ ...rule, tenant_id: tenantId } as CategorizationRuleInsert])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorization-rules"] });
      toast({ title: "Règle de catégorisation créée" });
    },
  });

  const updateCategorizationRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CategorizationRule> & { id: string }) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("regles_categorisation_bancaire")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorization-rules"] });
      toast({ title: "Règle mise à jour" });
    },
  });

  const deleteCategorizationRule = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { error } = await supabase
        .from("regles_categorisation_bancaire")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorization-rules"] });
      toast({ title: "Règle supprimée" });
    },
  });

  // ========== TREASURY FORECASTS ==========

  const { data: forecasts = [] } = useQuery({
    queryKey: ["treasury-forecasts", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("previsions_tresorerie")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createForecast = useMutation({
    mutationFn: async (forecast: Partial<TreasuryForecastInsert>) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("previsions_tresorerie")
        .insert([{ ...forecast, tenant_id: tenantId } as TreasuryForecastInsert])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury-forecasts"] });
      toast({ title: "Prévision créée" });
    },
  });

  // ========== TREASURY COMMITMENTS ==========

  const { data: commitments = [] } = useQuery({
    queryKey: ["treasury-commitments", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("engagements_tresorerie")
        .select("*, compte:comptes_bancaires(nom_compte)")
        .eq("tenant_id", tenantId)
        .order("date_echeance", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createCommitment = useMutation({
    mutationFn: async (commitment: Partial<TreasuryCommitmentInsert>) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("engagements_tresorerie")
        .insert([{ ...commitment, tenant_id: tenantId } as TreasuryCommitmentInsert])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury-commitments"] });
      toast({ title: "Engagement créé" });
    },
  });

  const updateCommitment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TreasuryCommitment> & { id: string }) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("engagements_tresorerie")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury-commitments"] });
      toast({ title: "Engagement mis à jour" });
    },
  });

  // ========== TREASURY ALERTS ==========

  const { data: alerts = [] } = useQuery({
    queryKey: ["treasury-alerts", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("alertes_tresorerie")
        .select("*, compte:comptes_bancaires(nom_compte)")
        .eq("tenant_id", tenantId)
        .eq("statut", "Active")
        .order("date_alerte", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createAlert = useMutation({
    mutationFn: async (alert: Partial<TreasuryAlertInsert>) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("alertes_tresorerie")
        .insert([{ ...alert, tenant_id: tenantId } as TreasuryAlertInsert])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury-alerts"] });
      toast({ title: "Alerte créée" });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("alertes_tresorerie")
        .update({ statut: "Résolue", resolu_le: new Date().toISOString() })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury-alerts"] });
      toast({ title: "Alerte résolue" });
    },
  });

  // ========== BANKING PARAMETERS ==========

  // Default banking parameters for fallback
  const defaultBankingParams: Partial<BankingParameters> = {
    tenant_id: tenantId || '',
    synchronisation_auto: true,
    frequence_sync: 'Quotidien',
    rapprochement_auto: false,
    tolerance_rapprochement_jours: 3,
    tolerance_rapprochement_montant_xaf: 100,
    alertes_actives: true,
    seuil_alerte_bas_xaf: 500000,
    seuil_alerte_critique_xaf: 100000,
    format_import_defaut: 'CSV_BEAC',
    devise_principale: 'XAF',
    code_pays: 'CG'
  };

  const { data: parameters, isLoading: loadingParameters } = useQuery({
    queryKey: ["banking-parameters", tenantId],
    queryFn: async () => {
      if (!tenantId) return defaultBankingParams as BankingParameters;
      
      const { data, error } = await supabase
        .from("parametres_bancaires")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      
      // Si erreur autre que "pas de données"
      if (error && error.code !== 'PGRST116') {
        console.warn("Erreur fetch parametres bancaires:", error);
        return defaultBankingParams as BankingParameters;
      }
      
      // Si pas de données, créer les paramètres par défaut
      if (!data) {
        try {
          const { data: createdData, error: createError } = await supabase
            .from("parametres_bancaires")
            .insert([{
              tenant_id: tenantId,
              synchronisation_auto: true,
              frequence_sync: 'Quotidien',
              rapprochement_auto: false,
              tolerance_rapprochement_jours: 3,
              tolerance_rapprochement_montant_xaf: 100,
              alertes_actives: true,
              seuil_alerte_bas_xaf: 500000,
              seuil_alerte_critique_xaf: 100000,
              format_import_defaut: 'CSV_BEAC',
              devise_principale: 'XAF',
              code_pays: 'CG'
            }])
            .select()
            .single();
          
          if (createError) {
            console.warn("Erreur création paramètres bancaires:", createError);
            return defaultBankingParams as BankingParameters;
          }
          
          return createdData;
        } catch (insertError) {
          console.warn("Exception création paramètres bancaires:", insertError);
          return defaultBankingParams as BankingParameters;
        }
      }
      
      return data;
    },
    enabled: !!tenantId,
  });

  const updateParameters = useMutation({
    mutationFn: async (updates: BankingParametersUpdate) => {
      if (!tenantId) throw new Error("No tenant ID");
      
      const { data, error } = await supabase
        .from("parametres_bancaires")
        .update(updates)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banking-parameters"] });
      toast({ title: "Paramètres mis à jour" });
    },
  });

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Get dynamic list of banks based on regional parameters
   */
  const getBanksList = (): { code: string; name: string }[] => {
    return regionalParams?.liste_banques || [];
  };

  /**
   * Validate RIB format based on regional parameters
   */
  const validateRIB = (rib: string): boolean => {
    if (!regionalParams?.validation_regex_rib) return true;
    const regex = new RegExp(regionalParams.validation_regex_rib);
    return regex.test(rib.replace(/\s/g, ''));
  };

  /**
   * Validate IBAN format based on regional parameters
   */
  const validateIBAN = (iban: string): boolean => {
    if (!regionalParams?.validation_regex_iban) return true;
    const regex = new RegExp(regionalParams.validation_regex_iban);
    return regex.test(iban.replace(/\s/g, ''));
  };

  /**
   * Format amount with currency context
   */
  const formatAmount = (amount: number): string => {
    return formatPrice(amount);
  };

  /**
   * Calcule le solde réel d'un compte : solde_initial + somme des transactions
   */
  const calculateAccountBalance = (accountId: string): number => {
    const account = bankAccounts.find(a => a.id === accountId);
    if (!account) return 0;
    
    const soldeInitial = account.solde_initial || 0;
    
    const accountTransactions = transactions.filter(
      (t: any) => t.compte_bancaire_id === accountId
    );
    
    const transactionsSum = accountTransactions.reduce((sum: number, t: any) => {
      if (t.type_transaction === 'credit') {
        return sum + (t.montant || 0);
      } else {
        return sum - Math.abs(t.montant || 0);
      }
    }, 0);
    
    return soldeInitial + transactionsSum;
  };

  /**
   * Calculate total balance in main currency
   */
  const getTotalBalance = (): number => {
    const mainCurrency = regionalParams?.devise_principale || 'XAF';
    return bankAccounts.reduce((sum, account) => {
      const accountDevise = account.devise || 'XAF';
      if (accountDevise === mainCurrency || accountDevise === 'FCFA') {
        return sum + calculateAccountBalance(account.id);
      }
      return sum;
    }, 0);
  };

  /**
   * Calculate reconciliation rate
   */
  const getReconciliationRate = (): number => {
    if (transactions.length === 0) return 0;
    const rapprochees = transactions.filter((t: any) => isReconciled(t.statut_rapprochement)).length;
    return Math.round((rapprochees / transactions.length) * 100);
  };

  /**
   * Export transactions to Excel with adaptive headers
   */
  const exportTransactionsExcel = (transactionsList: BankTransaction[]) => {
    const currency = regionalParams?.devise_principale || 'XAF';
    const countryName = regionalParams?.pays || 'Congo-Brazzaville';
    
    const ws = XLSX.utils.json_to_sheet(transactionsList.map(t => ({
      'Date': t.date_transaction,
      'Libellé': t.libelle,
      [`Montant (${currency})`]: t.montant,
      'Type': t.type_transaction,
      'Catégorie': t.categorie || 'N/A',
      'Rapproché': isReconciled(t.statut_rapprochement) ? 'Oui' : 'Non'
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `transactions_bancaires_${countryName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({ title: "Export Excel généré avec succès" });
  };

  /**
   * Generate bank journal PDF with adaptive formatting
   */
  const generateBankJournalPDF = (accountId: string, periodStart: string, periodEnd: string) => {
    const account = bankAccounts.find(a => a.id === accountId);
    if (!account) {
      toast({ title: "Compte introuvable", variant: "destructive" });
      return;
    }
    
    const doc = new jsPDF();
    const countryName = regionalParams?.pays || 'Congo-Brazzaville';
    const currency = regionalParams?.devise_principale || 'XAF';
    const centralBank = regionalParams?.banque_centrale || 'BEAC';
    const legalFooter = regionalParams?.mention_legale_footer || '';
    
    // Header
    doc.setFontSize(16);
    doc.text(`Journal de Banque - ${account.nom_compte}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Période: ${periodStart} au ${periodEnd}`, 14, 28);
    doc.text(`${countryName} - Devise: ${currency} (${centralBank})`, 14, 34);
    
    const accountTransactions = transactions.filter(
      t => t.compte_bancaire_id === accountId &&
      t.date_transaction >= periodStart &&
      t.date_transaction <= periodEnd
    );
    
    autoTable(doc, {
      startY: 42,
      head: [['Date', 'Libellé', 'Référence', `Montant (${currency})`, 'Type']],
      body: accountTransactions.map(t => [
        t.date_transaction,
        t.libelle,
        t.reference || '-',
        t.montant.toLocaleString(),
        t.type_transaction
      ]),
    });
    
    // Footer with regional legal mention
    const finalY = (doc as any).lastAutoTable.finalY || 42;
    doc.setFontSize(8);
    doc.text(legalFooter, 14, finalY + 15, { maxWidth: 180 });
    
    doc.save(`journal_bancaire_${account.nom_compte}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "Journal PDF généré avec succès" });
  };

  // ==================== RETURN ====================

  return {
    // Regional params
    regionalParams,
    loadingRegionalParams,
    
    // Bank Accounts
    bankAccounts,
    loadingAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    
    // Transactions
    transactions,
    loadingTransactions,
    createTransaction,
    updateTransaction,
    
    // Reconciliation
    reconciliations,
    loadingReconciliations,
    createReconciliation,
    updateReconciliation,
    
    // Categorization Rules
    categorizationRules,
    createCategorizationRule,
    updateCategorizationRule,
    deleteCategorizationRule,
    
    // Treasury Forecasts
    forecasts,
    createForecast,
    
    // Treasury Commitments
    commitments,
    createCommitment,
    updateCommitment,
    
    // Treasury Alerts
    alerts,
    createAlert,
    resolveAlert,
    
    // Banking Parameters
    parameters,
    updateParameters,
    
    // Utilities
    getBanksList,
    validateRIB,
    validateIBAN,
    formatAmount,
    getTotalBalance,
    calculateAccountBalance,
    getReconciliationRate,
    exportTransactionsExcel,
    generateBankJournalPDF,
  };
};
