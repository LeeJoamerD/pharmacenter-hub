import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';

// Interfaces
export interface BankAccount {
  id: string;
  tenant_id: string;
  nom_compte: string;
  numero_compte: string;
  banque: string;
  type_compte: 'courant' | 'epargne' | 'mobile_money' | 'caisse';
  devise: string;
  solde_initial: number;
  solde_actuel: number;
  solde_rapproche: number;
  est_actif: boolean;
  autoriser_decouvert: boolean;
  limite_decouvert: number;
  iban?: string;
  swift_bic?: string;
  contact_banque?: string;
  telephone_banque?: string;
  email_banque?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  tenant_id: string;
  compte_bancaire_id: string;
  compte_bancaire?: BankAccount;
  reference: string;
  reference_externe?: string;
  date_transaction: string;
  date_valeur?: string;
  montant: number;
  type_transaction: 'debit' | 'credit';
  libelle: string;
  description?: string;
  categorie?: string;
  statut_rapprochement: 'non_rapproche' | 'rapproche' | 'rapproche_partiel' | 'suspect' | 'ignore';
  date_rapprochement?: string;
  paiement_facture_id?: string;
  encaissement_id?: string;
  notes?: string;
  pieces_jointes: string[];
  source_import?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentSchedule {
  id: string;
  tenant_id: string;
  type_echeancier: 'client' | 'fournisseur' | 'autre';
  facture_id?: string;
  client_id?: string;
  fournisseur_id?: string;
  tiers_nom?: string;
  libelle: string;
  description?: string;
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  date_emission: string;
  date_premiere_echeance: string;
  date_derniere_echeance?: string;
  nombre_echeances: number;
  periodicite: 'unique' | 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';
  statut: 'actif' | 'termine' | 'suspendu' | 'annule';
  alerte_avant_echeance: number;
  notes?: string;
  lignes?: ScheduleLine[];
  created_at: string;
  updated_at: string;
}

export interface ScheduleLine {
  id: string;
  tenant_id: string;
  echeancier_id: string;
  numero_echeance: number;
  montant_echeance: number;
  montant_paye: number;
  montant_restant: number;
  date_echeance: string;
  date_paiement?: string;
  statut: 'a_payer' | 'paye_partiel' | 'paye' | 'en_retard' | 'annule';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  tenant_id: string;
  code: string;
  libelle: string;
  est_actif: boolean;
  ordre_affichage: number;
  compte_bancaire_id?: string;
  exige_reference: boolean;
  exige_validation: boolean;
  delai_encaissement: number;
  frais_pourcentage: number;
  frais_fixes: number;
  icone?: string;
  couleur?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsolidatedPayment {
  id: string;
  tenant_id: string;
  type_paiement: 'facture' | 'vente';
  numero_piece: string;
  date_paiement: string;
  montant: number;
  mode_paiement: string;
  reference: string;
  statut: string;
  facture_numero?: string;
  facture_type?: string;
  tiers?: string;
  compte_bancaire_id?: string;
  compte_bancaire?: string;
  notes?: string;
  created_at: string;
}

export interface RegionalPaymentParams {
  id: string;
  tenant_id: string;
  pays: string;
  code_pays: string;
  devise_principale: string;
  symbole_devise: string;
  modes_paiement_defaut: any[];
  format_iban?: string;
  validation_iban_active: boolean;
  swift_obligatoire: boolean;
  frais_bancaires_standard: number;
  frais_mobile_money_pourcentage: number;
  frais_carte_pourcentage: number;
  delai_encaissement_cheque: number;
  delai_compensation_virement: number;
  montant_max_especes?: number;
  plafond_mobile_money?: number;
  require_kyc_au_dessus?: number;
  tolerance_rapprochement: number;
  created_at: string;
  updated_at: string;
}

export const usePaymentManager = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { toast } = useToast();
  const { formatPrice, currentCurrency, changeCurrency, currencies } = useCurrency();
  const { settings: systemSettings } = useGlobalSystemSettings();
  
  const tenantId = session?.user?.user_metadata?.tenant_id;
  const personnelId = session?.user?.user_metadata?.personnel_id;

  // Fetch regional payment parameters
  const { data: regionalParams, isLoading: isLoadingRegional } = useQuery({
    queryKey: ['payment-regional-params', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametres_paiements_regionaux')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();
      
      if (error) {
        // If not found, initialize with Congo-Brazzaville default
        if (error.code === 'PGRST116') {
          const { error: rpcError } = await supabase.rpc('init_payment_params_for_tenant', {
            p_tenant_id: tenantId,
            p_country_code: 'CG'
          });
          
          if (rpcError) throw rpcError;
          
          // Retry fetch after initialization
          const { data: retryData, error: retryError } = await supabase
            .from('parametres_paiements_regionaux')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();
          
          if (retryError) throw retryError;
          return retryData as RegionalPaymentParams;
        }
        throw error;
      }
      
      return data as RegionalPaymentParams;
    },
    enabled: !!tenantId,
  });

  // Fetch bank accounts
  const { data: bankAccounts = [], isLoading: isLoadingBankAccounts } = useQuery({
    queryKey: ['bank-accounts', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comptes_bancaires')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nom_compte');
      
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!tenantId,
  });

  // Fetch bank transactions
  const { data: bankTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['bank-transactions', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions_bancaires')
        .select('*, compte_bancaire:comptes_bancaires(*)')
        .eq('tenant_id', tenantId)
        .order('date_transaction', { ascending: false });
      
      if (error) throw error;
      return data as BankTransaction[];
    },
    enabled: !!tenantId,
  });

  // Fetch payment schedules
  const { data: paymentSchedules = [], isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['payment-schedules', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('echeanciers_paiements')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date_premiere_echeance', { ascending: false });
      
      if (error) throw error;
      return data as PaymentSchedule[];
    },
    enabled: !!tenantId,
  });

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: isLoadingMethods } = useQuery({
    queryKey: ['payment-methods', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modes_paiement_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('ordre_affichage');
      
      if (error) throw error;
      return data as PaymentMethod[];
    },
    enabled: !!tenantId,
  });

  // Fetch consolidated payments (paiements_factures + encaissements)
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['consolidated-payments', tenantId],
    queryFn: async () => {
      // Fetch paiements_factures
      const { data: facturePayments, error: factureError } = await supabase
        .from('paiements_factures')
        .select('*, facture:factures(numero, type, client:clients(nom_complet), fournisseur:fournisseurs(nom))')
        .eq('tenant_id', tenantId);
      
      if (factureError) throw factureError;

      // Fetch encaissements
      const { data: encaissements, error: encError } = await supabase
        .from('encaissements')
        .select('*, vente:ventes(numero_vente, client:clients(nom_complet))')
        .eq('tenant_id', tenantId);
      
      if (encError) throw encError;

      // Consolidate payments
      const consolidated: ConsolidatedPayment[] = [
        ...(facturePayments || []).map((p: any) => ({
          id: p.id,
          tenant_id: p.tenant_id,
          type_paiement: 'facture' as const,
          numero_piece: `PAY-FAC-${p.id.substring(0, 8)}`,
          date_paiement: p.date_paiement,
          montant: p.montant,
          mode_paiement: p.mode_paiement,
          reference: p.reference_paiement,
          statut: 'non_rapproche',
          facture_numero: p.facture?.numero,
          facture_type: p.facture?.type,
          tiers: p.facture?.client?.nom_complet || p.facture?.fournisseur?.nom,
          notes: p.notes,
          created_at: p.created_at,
        })),
        ...(encaissements || []).map((e: any) => ({
          id: e.id,
          tenant_id: e.tenant_id,
          type_paiement: 'vente' as const,
          numero_piece: `PAY-VTE-${e.id.substring(0, 8)}`,
          date_paiement: e.date_encaissement,
          montant: e.montant_recu,
          mode_paiement: e.mode_paiement,
          reference: e.reference_transaction || '',
          statut: 'non_rapproche',
          facture_numero: e.vente?.numero_vente,
          facture_type: 'vente',
          tiers: e.vente?.client?.nom_complet,
          notes: e.notes,
          created_at: e.created_at,
        })),
      ];

      return consolidated.sort((a, b) => 
        new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime()
      );
    },
    enabled: !!tenantId,
  });

  // CRUD mutations for bank accounts
  const createBankAccount = useMutation({
    mutationFn: async (account: Partial<BankAccount>) => {
      const insertData: any = { 
        ...account, 
        tenant_id: tenantId, 
        created_by_id: personnelId 
      };
      
      const { data, error } = await supabase
        .from('comptes_bancaires')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', tenantId] });
      toast({ title: 'Compte bancaire créé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur lors de la création du compte', description: error.message, variant: 'destructive' });
    },
  });

  const updateBankAccount = useMutation({
    mutationFn: async ({ id, ...account }: Partial<BankAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('comptes_bancaires')
        .update(account)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', tenantId] });
      toast({ title: 'Compte bancaire mis à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur lors de la mise à jour', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBankAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comptes_bancaires')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', tenantId] });
      toast({ title: 'Compte bancaire supprimé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur lors de la suppression', description: error.message, variant: 'destructive' });
    },
  });

  // CRUD mutations for bank transactions
  const createBankTransaction = useMutation({
    mutationFn: async (transaction: Partial<BankTransaction>) => {
      const insertData: any = { 
        ...transaction, 
        tenant_id: tenantId, 
        created_by_id: personnelId 
      };
      
      const { data, error } = await supabase
        .from('transactions_bancaires')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', tenantId] });
      toast({ title: 'Transaction bancaire créée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur lors de la création de la transaction', description: error.message, variant: 'destructive' });
    },
  });

  const updateBankTransaction = useMutation({
    mutationFn: async ({ id, ...transaction }: Partial<BankTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions_bancaires')
        .update(transaction)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', tenantId] });
      toast({ title: 'Transaction bancaire mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur lors de la mise à jour', description: error.message, variant: 'destructive' });
    },
  });

  // Reconciliation functions
  const reconcileTransaction = useMutation({
    mutationFn: async ({ transactionId, paymentId, type }: { transactionId: string; paymentId: string; type: 'facture' | 'vente' }) => {
      const updateData: any = {
        statut_rapprochement: 'rapproche',
        date_rapprochement: new Date().toISOString(),
        rapproche_par_id: personnelId,
      };

      if (type === 'facture') {
        updateData.paiement_facture_id = paymentId;
      } else {
        updateData.encaissement_id = paymentId;
      }

      const { error } = await supabase
        .from('transactions_bancaires')
        .update(updateData)
        .eq('id', transactionId)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions', tenantId] });
      toast({ title: 'Transaction rapprochée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur lors du rapprochement', description: error.message, variant: 'destructive' });
    },
  });

  // CRUD mutations for payment schedules
  const createPaymentSchedule = useMutation({
    mutationFn: async (schedule: Partial<PaymentSchedule>) => {
      const insertData: any = { 
        ...schedule, 
        tenant_id: tenantId, 
        created_by_id: personnelId 
      };
      
      const { data, error } = await supabase
        .from('echeanciers_paiements')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules', tenantId] });
      toast({ title: 'Échéancier créé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur lors de la création de l\'échéancier', description: error.message, variant: 'destructive' });
    },
  });

  // CRUD mutations for payment methods
  const createPaymentMethod = useMutation({
    mutationFn: async (method: Partial<PaymentMethod>) => {
      const insertData: any = { 
        ...method, 
        tenant_id: tenantId 
      };
      
      const { data, error } = await supabase
        .from('modes_paiement_config')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods', tenantId] });
      toast({ title: 'Mode de paiement créé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur lors de la création', description: error.message, variant: 'destructive' });
    },
  });

  const updatePaymentMethod = useMutation({
    mutationFn: async ({ id, ...method }: Partial<PaymentMethod> & { id: string }) => {
      const { data, error } = await supabase
        .from('modes_paiement_config')
        .update(method)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods', tenantId] });
      toast({ title: 'Mode de paiement mis à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur lors de la mise à jour', description: error.message, variant: 'destructive' });
    },
  });

  // Statistics calculations
  const getPaymentStats = () => {
    if (!payments) return {
      totalEncaisse: 0,
      totalEnAttente: 0,
      totalCarte: 0,
      totalMobileMoney: 0,
      totalEspeces: 0,
      totalVirement: 0,
      totalCheque: 0,
    };

    return {
      totalEncaisse: payments.filter(p => p.statut === 'rapproche').reduce((sum, p) => sum + p.montant, 0),
      totalEnAttente: payments.filter(p => p.statut === 'non_rapproche').length,
      totalCarte: payments.filter(p => p.mode_paiement === 'carte').reduce((sum, p) => sum + p.montant, 0),
      totalMobileMoney: payments.filter(p => p.mode_paiement === 'mobile_money').reduce((sum, p) => sum + p.montant, 0),
      totalEspeces: payments.filter(p => p.mode_paiement === 'especes').reduce((sum, p) => sum + p.montant, 0),
      totalVirement: payments.filter(p => p.mode_paiement === 'virement').reduce((sum, p) => sum + p.montant, 0),
      totalCheque: payments.filter(p => p.mode_paiement === 'cheque').reduce((sum, p) => sum + p.montant, 0),
    };
  };

  const getBankReconciliationStats = () => {
    if (!bankTransactions) return {
      totalRapproche: 0,
      totalNonRapproche: 0,
      totalSuspect: 0,
      tauxRapprochement: 0,
    };

    const total = bankTransactions.length;
    const rapproche = bankTransactions.filter(t => t.statut_rapprochement === 'rapproche').length;

    return {
      totalRapproche: rapproche,
      totalNonRapproche: bankTransactions.filter(t => t.statut_rapprochement === 'non_rapproche').length,
      totalSuspect: bankTransactions.filter(t => t.statut_rapprochement === 'suspect').length,
      tauxRapprochement: total > 0 ? (rapproche / total) * 100 : 0,
    };
  };

  const getScheduleStats = () => {
    if (!paymentSchedules) return {
      totalEcheancesEnCours: 0,
      totalEcheancesEnRetard: 0,
      montantTotalAPayer: 0,
      prochaineDateEcheance: null,
    };

    const now = new Date();
    const enRetard = paymentSchedules.filter(s => 
      s.statut === 'actif' && new Date(s.date_premiere_echeance) < now && s.montant_restant > 0
    );

    return {
      totalEcheancesEnCours: paymentSchedules.filter(s => s.statut === 'actif').length,
      totalEcheancesEnRetard: enRetard.length,
      montantTotalAPayer: paymentSchedules
        .filter(s => s.statut === 'actif')
        .reduce((sum, s) => sum + s.montant_restant, 0),
      prochaineDateEcheance: paymentSchedules
        .filter(s => s.statut === 'actif' && new Date(s.date_premiere_echeance) >= now)
        .sort((a, b) => new Date(a.date_premiere_echeance).getTime() - new Date(b.date_premiere_echeance).getTime())[0]?.date_premiere_echeance || null,
    };
  };

  // Regional utility functions
  const formatAmount = (amount: number): string => {
    return formatPrice(amount);
  };

  const getDevise = (): string => {
    return regionalParams?.symbole_devise || currentCurrency.symbol;
  };

  const getDefaultPaymentMethods = () => {
    return regionalParams?.modes_paiement_defaut || [];
  };

  const validatePaymentAmount = (amount: number, methodCode: string): { isValid: boolean; error?: string } => {
    if (!regionalParams) return { isValid: true };

    // Validate cash limit
    if (methodCode === 'especes' && regionalParams.montant_max_especes) {
      if (amount > regionalParams.montant_max_especes) {
        return {
          isValid: false,
          error: `Montant espèces limité à ${formatAmount(regionalParams.montant_max_especes)}`
        };
      }
    }

    // Validate mobile money limit
    if (methodCode.includes('mobile') && regionalParams.plafond_mobile_money) {
      if (amount > regionalParams.plafond_mobile_money) {
        return {
          isValid: false,
          error: `Montant Mobile Money limité à ${formatAmount(regionalParams.plafond_mobile_money)}`
        };
      }
    }

    return { isValid: true };
  };

  return {
    // Data
    payments,
    bankAccounts,
    bankTransactions,
    paymentSchedules,
    paymentMethods,
    regionalParams,

    // Loading states
    isLoadingPayments,
    isLoadingBankAccounts,
    isLoadingTransactions,
    isLoadingSchedules,
    isLoadingRegional,
    isLoading: isLoadingPayments || isLoadingBankAccounts || isLoadingTransactions || isLoadingSchedules || isLoadingMethods || isLoadingRegional,

    // Bank accounts
    createBankAccount: createBankAccount.mutate,
    updateBankAccount: updateBankAccount.mutate,
    deleteBankAccount: deleteBankAccount.mutate,

    // Bank transactions
    createBankTransaction: createBankTransaction.mutate,
    updateBankTransaction: updateBankTransaction.mutate,

    // Reconciliation
    reconcileTransaction: reconcileTransaction.mutate,

    // Payment schedules
    createPaymentSchedule: createPaymentSchedule.mutate,

    // Payment methods
    createPaymentMethod: createPaymentMethod.mutate,
    updatePaymentMethod: updatePaymentMethod.mutate,

    // Statistics
    getPaymentStats,
    getBankReconciliationStats,
    getScheduleStats,

    // Regional utilities
    formatAmount,
    getDevise,
    getDefaultPaymentMethods,
    validatePaymentAmount,
  };
};
