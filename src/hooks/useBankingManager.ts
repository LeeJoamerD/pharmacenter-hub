import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Types
export interface BankAccount {
  id: string;
  tenant_id: string;
  nom_compte: string;
  numero_compte: string; // RIB 23 chiffres Congo
  iban?: string; // Format CG
  banque: string; // UBA CONGO, BGFI, etc.
  type_compte: 'Courant' | 'Épargne' | 'Devise';
  devise: string;
  solde_actuel: number;
  solde_initial: number;
  date_ouverture: string;
  est_actif: boolean;
  api_connectee: boolean;
  derniere_sync?: string;
  statut_connexion?: 'Connecté' | 'Erreur' | 'En attente';
  configuration?: any;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  tenant_id: string;
  compte_bancaire_id: string;
  date_transaction: string;
  date_valeur: string;
  libelle: string;
  reference?: string;
  montant: number;
  type_mouvement: 'Credit' | 'Debit';
  categorie?: string;
  est_rapproche: boolean;
  ecriture_comptable_id?: string;
  mode_saisie: 'Manuel' | 'Import' | 'API';
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface BankReconciliation {
  id: string;
  tenant_id: string;
  compte_bancaire_id: string;
  periode_debut: string;
  periode_fin: string;
  solde_initial: number;
  solde_final: number;
  solde_comptable: number;
  ecart: number;
  nombre_transactions: number;
  nombre_rapprochees: number;
  statut: 'En cours' | 'Validé' | 'En attente';
  valide_par?: string;
  date_validation?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CategorizationRule {
  id: string;
  tenant_id: string;
  nom_regle: string;
  priorite: number;
  pattern_recherche: string;
  type_pattern: 'contient' | 'commence_par' | 'termine_par' | 'regex' | 'exact';
  categorie_cible: string;
  type_transaction: 'credit' | 'debit' | 'tous';
  banque_specifique?: string;
  montant_min?: number;
  montant_max?: number;
  est_actif: boolean;
  appliquee_automatiquement: boolean;
  created_at: string;
  updated_at: string;
}

export interface TreasuryForecast {
  id: string;
  tenant_id: string;
  exercice_id?: string;
  periode_debut: string;
  periode_fin: string;
  type_scenario: 'Optimiste' | 'Réaliste' | 'Pessimiste';
  coefficient_ajustement: number;
  solde_initial_xaf: number;
  entrees_prevues_xaf: number;
  sorties_prevues_xaf: number;
  solde_final_previsionnel_xaf: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TreasuryCommitment {
  id: string;
  tenant_id: string;
  type_engagement: 'Salaires' | 'Fournisseurs' | 'Charges sociales' | 'Impôts BEAC' | 'Loyers' | 'Autres';
  libelle: string;
  date_echeance: string;
  montant_xaf: number;
  statut: 'Prévu' | 'Confirmé' | 'Payé' | 'Annulé';
  compte_bancaire_id?: string;
  reference_document?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TreasuryAlert {
  id: string;
  tenant_id: string;
  type_alerte: 'Seuil bas' | 'Seuil critique' | 'Découvert' | 'Échéance proche' | 'Anomalie';
  titre: string;
  description: string;
  severite: 'info' | 'warning' | 'error' | 'critical';
  seuil_montant_xaf?: number;
  compte_bancaire_id?: string;
  date_alerte: string;
  statut: 'Active' | 'Résolue' | 'Ignorée';
  resolu_le?: string;
  resolu_par_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BankingParameters {
  id: string;
  tenant_id: string;
  synchronisation_auto: boolean;
  frequence_sync: 'Temps réel' | 'Horaire' | 'Quotidien' | 'Hebdomadaire';
  rapprochement_auto: boolean;
  tolerance_rapprochement_jours: number;
  tolerance_rapprochement_montant_xaf: number;
  alertes_actives: boolean;
  seuil_alerte_bas_xaf: number;
  seuil_alerte_critique_xaf: number;
  emails_alertes?: string[];
  format_import_defaut: 'CSV_BEAC' | 'Excel_Standard' | 'OFX' | 'MT940';
  devise_principale: string;
  code_pays: string;
  created_at: string;
  updated_at: string;
}

// Banques Congo-Brazzaville
export const CONGO_BANKS = [
  { code: '10001', name: 'UBA CONGO' },
  { code: '10002', name: 'BGFI BANK CONGO' },
  { code: '10003', name: 'ECOBANK CONGO' },
  { code: '10004', name: 'LA POSTE FINANCIERE' },
  { code: '10005', name: 'MUCODEC' },
  { code: '10006', name: 'CRÉDIT DU CONGO' },
];

// Hook principal
export const useBankingManager = () => {
  const { session, tenantId } = useAuth();
  const queryClient = useQueryClient();

  // ========== BANK ACCOUNTS ==========

  const { data: bankAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["bank-accounts", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comptes_bancaires")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!tenantId,
  });

  const createBankAccount = useMutation({
    mutationFn: async (account: Partial<BankAccount>) => {
      const { data, error } = await supabase
        .from("comptes_bancaires")
        .insert([{ ...account, tenant_id: tenantId }])
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
      const { data, error } = await supabase
        .from("transactions_bancaires")
        .select("*, compte:comptes_bancaires(nom_compte, banque)")
        .eq("tenant_id", tenantId)
        .order("date_transaction", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as BankTransaction[];
    },
    enabled: !!tenantId,
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: Partial<BankTransaction>) => {
      const { data, error } = await supabase
        .from("transactions_bancaires")
        .insert([{ ...transaction, tenant_id: tenantId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      toast({ title: "Transaction créée" });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BankTransaction> & { id: string }) => {
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
      const { data, error } = await supabase
        .from("rapprochements_bancaires")
        .select("*, compte:comptes_bancaires(nom_compte)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as BankReconciliation[];
    },
    enabled: !!tenantId,
  });

  const createReconciliation = useMutation({
    mutationFn: async (reconciliation: Partial<BankReconciliation>) => {
      const { data, error } = await supabase
        .from("rapprochements_bancaires")
        .insert([{ ...reconciliation, tenant_id: tenantId }])
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

  // ========== CATEGORIZATION RULES ==========

  const { data: categorizationRules = [] } = useQuery({
    queryKey: ["categorization-rules", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regles_categorisation_bancaire")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("est_actif", true)
        .order("priorite", { ascending: false });
      
      if (error) throw error;
      return data as CategorizationRule[];
    },
    enabled: !!tenantId,
  });

  const createCategorizationRule = useMutation({
    mutationFn: async (rule: Partial<CategorizationRule>) => {
      const { data, error } = await supabase
        .from("regles_categorisation_bancaire")
        .insert([{ ...rule, tenant_id: tenantId }])
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
      const { data, error } = await supabase
        .from("previsions_tresorerie")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as TreasuryForecast[];
    },
    enabled: !!tenantId,
  });

  const createForecast = useMutation({
    mutationFn: async (forecast: Partial<TreasuryForecast>) => {
      const { data, error } = await supabase
        .from("previsions_tresorerie")
        .insert([{ ...forecast, tenant_id: tenantId }])
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
      const { data, error } = await supabase
        .from("engagements_tresorerie")
        .select("*, compte:comptes_bancaires(nom_compte)")
        .eq("tenant_id", tenantId)
        .order("date_echeance", { ascending: true });
      
      if (error) throw error;
      return data as TreasuryCommitment[];
    },
    enabled: !!tenantId,
  });

  const createCommitment = useMutation({
    mutationFn: async (commitment: Partial<TreasuryCommitment>) => {
      const { data, error } = await supabase
        .from("engagements_tresorerie")
        .insert([{ ...commitment, tenant_id: tenantId }])
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
      const { data, error } = await supabase
        .from("alertes_tresorerie")
        .select("*, compte:comptes_bancaires(nom_compte)")
        .eq("tenant_id", tenantId)
        .eq("statut", "Active")
        .order("date_alerte", { ascending: false });
      
      if (error) throw error;
      return data as TreasuryAlert[];
    },
    enabled: !!tenantId,
  });

  const createAlert = useMutation({
    mutationFn: async (alert: Partial<TreasuryAlert>) => {
      const { data, error } = await supabase
        .from("alertes_tresorerie")
        .insert([{ ...alert, tenant_id: tenantId }])
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
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("alertes_tresorerie")
        .update({ 
          statut: 'Résolue', 
          resolu_le: new Date().toISOString(),
          resolu_par_id: session?.user?.id,
          notes 
        })
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

  const { data: parameters } = useQuery({
    queryKey: ["banking-parameters", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parametres_bancaires")
        .select("*")
        .eq("tenant_id", tenantId)
        .single();
      
      if (error) {
        // Create default if not exists
        const { data: newData, error: createError } = await supabase
          .from("parametres_bancaires")
          .insert([{ tenant_id: tenantId }])
          .select()
          .single();
        if (createError) throw createError;
        return newData as BankingParameters;
      }
      return data as BankingParameters;
    },
    enabled: !!tenantId,
  });

  const updateParameters = useMutation({
    mutationFn: async (updates: Partial<BankingParameters>) => {
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

  // ========== UTILITIES ==========

  const validateCongoRIB = (rib: string): boolean => {
    // Format: 23 chiffres (Code banque 5 + Code guichet 5 + N° compte 11 + Clé 2)
    return /^\d{23}$/.test(rib.replace(/\s/g, ''));
  };

  const validateCongoIBAN = (iban: string): boolean => {
    // Format: CG + 2 chiffres contrôle + 23 chiffres
    return /^CG\d{25}$/.test(iban.replace(/\s/g, ''));
  };

  const getTotalBalance = (): number => {
    return bankAccounts.reduce((sum, account) => {
      if (account.devise === 'XAF') {
        return sum + account.solde_actuel;
      }
      return sum;
    }, 0);
  };

  const getReconciliationRate = (): number => {
    if (transactions.length === 0) return 0;
    const reconciled = transactions.filter(t => t.est_rapproche).length;
    return (reconciled / transactions.length) * 100;
  };

  // ========== EXPORTS ==========

  const exportTransactionsExcel = (transactionsList: BankTransaction[]) => {
    const ws = XLSX.utils.json_to_sheet(transactionsList.map(t => ({
      'Date': t.date_transaction,
      'Libellé': t.libelle,
      'Montant (XAF)': t.montant,
      'Type': t.type_mouvement,
      'Catégorie': t.categorie || 'N/A',
      'Rapproché': t.est_rapproche ? 'Oui' : 'Non'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Export Excel généré" });
  };

  const generateBankJournalPDF = (accountId: string, periodStart: string, periodEnd: string) => {
    const account = bankAccounts.find(a => a.id === accountId);
    const accountTransactions = transactions.filter(
      t => t.compte_bancaire_id === accountId && 
      t.date_transaction >= periodStart && 
      t.date_transaction <= periodEnd
    );

    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Journal de Banque - ${account?.nom_compte}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Période: ${periodStart} au ${periodEnd}`, 14, 30);
    doc.text(`République du Congo - Devise: XAF (Franc CFA BEAC)`, 14, 36);

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Libellé', 'Débit', 'Crédit', 'Solde']],
      body: accountTransactions.map(t => [
        t.date_transaction,
        t.libelle,
        t.type_mouvement === 'Debit' ? t.montant.toLocaleString() : '',
        t.type_mouvement === 'Credit' ? t.montant.toLocaleString() : '',
        ''
      ]),
    });

    doc.save(`journal_banque_${account?.nom_compte}_${periodStart}.pdf`);
    toast({ title: "Journal de banque généré (PDF)" });
  };

  return {
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

    // Categorization Rules
    categorizationRules,
    createCategorizationRule,
    updateCategorizationRule,
    deleteCategorizationRule,

    // Forecasts
    forecasts,
    createForecast,

    // Commitments
    commitments,
    createCommitment,
    updateCommitment,

    // Alerts
    alerts,
    createAlert,
    resolveAlert,

    // Parameters
    parameters,
    updateParameters,

    // Utilities
    validateCongoRIB,
    validateCongoIBAN,
    getTotalBalance,
    getReconciliationRate,
    CONGO_BANKS,

    // Exports
    exportTransactionsExcel,
    generateBankJournalPDF,
  };
};