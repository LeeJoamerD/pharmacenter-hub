import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { 
  generateBankTransactionEntry, 
  deleteTransactionEntry,
  hasExistingEntry,
  BankTransactionEcritureData 
} from "@/services/BankTransactionAccountingService";
import { TRANSACTION_STATUS, isReconciled } from "@/constants/transactionStatus";

type BankTransaction = Database['public']['Tables']['transactions_bancaires']['Row'];

export interface TransactionFilters {
  page: number;
  limit: number;
  search?: string;
  accountId?: string;
  status?: 'all' | 'matched' | 'unmatched';
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedTransactionsResult {
  data: (BankTransaction & { compte?: { nom_compte: string; banque: string } | null })[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export const useTransactionsPaginated = (filters: TransactionFilters) => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bank-transactions-paginated", tenantId, filters],
    queryFn: async (): Promise<PaginatedTransactionsResult> => {
      if (!tenantId) return { data: [], totalCount: 0, currentPage: 0, totalPages: 0 };

      let queryBuilder = supabase
        .from("transactions_bancaires")
        .select("*, compte:comptes_bancaires(nom_compte, banque)", { count: 'exact' })
        .eq("tenant_id", tenantId);

      // Filtres dynamiques
      if (filters.accountId && filters.accountId !== 'all') {
        queryBuilder = queryBuilder.eq('compte_bancaire_id', filters.accountId);
      }

      if (filters.status === 'matched') {
        queryBuilder = queryBuilder.eq('statut_rapprochement', TRANSACTION_STATUS.RAPPROCHE);
      } else if (filters.status === 'unmatched') {
        queryBuilder = queryBuilder.neq('statut_rapprochement', TRANSACTION_STATUS.RAPPROCHE);
      }

      if (filters.search && filters.search.trim()) {
        queryBuilder = queryBuilder.ilike('libelle', `%${filters.search.trim()}%`);
      }

      if (filters.dateFrom) {
        queryBuilder = queryBuilder.gte('date_transaction', filters.dateFrom);
      }

      if (filters.dateTo) {
        queryBuilder = queryBuilder.lte('date_transaction', filters.dateTo);
      }

      // Tri
      const sortCol = filters.sortColumn || 'date_transaction';
      const sortAsc = filters.sortDirection === 'asc';
      queryBuilder = queryBuilder.order(sortCol, { ascending: sortAsc });

      // Pagination - gestion de la limite Supabase de 1000
      const from = filters.page * filters.limit;
      const to = from + filters.limit - 1;
      queryBuilder = queryBuilder.range(from, to);

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / filters.limit);

      return {
        data: data || [],
        totalCount,
        currentPage: filters.page,
        totalPages
      };
    },
    enabled: !!tenantId,
  });

  // Mutation pour supprimer une transaction (et son écriture comptable si elle existe)
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant ID");

      // Supprimer d'abord l'écriture comptable liée si elle existe
      await deleteTransactionEntry(id, tenantId);

      const { error } = await supabase
        .from("transactions_bancaires")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-entries"] });
      toast({ title: "Transaction supprimée avec succès" });
    },
    onError: (error) => {
      toast({ 
        title: "Erreur lors de la suppression", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutation pour rapprocher une transaction et générer l'écriture comptable
  const reconcileTransaction = useMutation({
    mutationFn: async ({ id, generateAccounting = true, categorie }: { 
      id: string; 
      generateAccounting?: boolean;
      categorie?: string;
    }) => {
      if (!tenantId) throw new Error("No tenant ID");

      // Récupérer la transaction pour générer l'écriture
      const { data: transaction, error: fetchError } = await supabase
        .from("transactions_bancaires")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (fetchError || !transaction) throw fetchError || new Error("Transaction non trouvée");

      // Mettre à jour la catégorie si fournie
      const updateData: any = { 
        statut_rapprochement: TRANSACTION_STATUS.RAPPROCHE,
        date_rapprochement: new Date().toISOString()
      };
      
      if (categorie) {
        updateData.categorie = categorie;
      }

      const { data, error } = await supabase
        .from("transactions_bancaires")
        .update(updateData)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      // Générer l'écriture comptable si demandé
      if (generateAccounting) {
        const ecritureData: BankTransactionEcritureData = {
          transactionId: id,
          tenantId,
          compteBancaireId: transaction.compte_bancaire_id,
          montant: transaction.montant,
          typeTransaction: transaction.type_transaction as 'credit' | 'debit',
          categorie: categorie || transaction.categorie,
          libelle: transaction.libelle,
          dateTransaction: transaction.date_transaction,
          reference: transaction.reference_externe
        };

        const generated = await generateBankTransactionEntry(ecritureData);
        if (generated) {
          console.log('✅ Écriture comptable générée au rapprochement');
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-entries"] });
      toast({ title: "Transaction rapprochée avec succès" });
    },
    onError: (error) => {
      toast({ 
        title: "Erreur lors du rapprochement", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutation pour catégoriser une transaction et générer l'écriture
  const categorizeTransaction = useMutation({
    mutationFn: async ({ id, categorie, generateAccounting = true }: { 
      id: string; 
      categorie: string;
      generateAccounting?: boolean;
    }) => {
      if (!tenantId) throw new Error("No tenant ID");

      // Récupérer la transaction
      const { data: transaction, error: fetchError } = await supabase
        .from("transactions_bancaires")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (fetchError || !transaction) throw fetchError || new Error("Transaction non trouvée");

      // Mettre à jour la catégorie
      const { data, error } = await supabase
        .from("transactions_bancaires")
        .update({ categorie })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      // Générer l'écriture comptable si demandé
      if (generateAccounting) {
        const ecritureData: BankTransactionEcritureData = {
          transactionId: id,
          tenantId,
          compteBancaireId: transaction.compte_bancaire_id,
          montant: transaction.montant,
          typeTransaction: transaction.type_transaction as 'credit' | 'debit',
          categorie,
          libelle: transaction.libelle,
          dateTransaction: transaction.date_transaction,
          reference: transaction.reference_externe
        };

        const generated = await generateBankTransactionEntry(ecritureData);
        if (generated) {
          console.log('✅ Écriture comptable générée à la catégorisation');
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-entries"] });
      toast({ title: "Transaction catégorisée avec succès" });
    },
    onError: (error) => {
      toast({ 
        title: "Erreur lors de la catégorisation", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Vérifier si une transaction a une écriture comptable
  const checkHasAccountingEntry = async (transactionId: string): Promise<boolean> => {
    if (!tenantId) return false;
    return await hasExistingEntry(transactionId, tenantId);
  };

  return {
    ...query,
    transactions: query.data?.data || [],
    totalCount: query.data?.totalCount || 0,
    totalPages: query.data?.totalPages || 0,
    currentPage: query.data?.currentPage || 0,
    deleteTransaction,
    reconcileTransaction,
    categorizeTransaction,
    checkHasAccountingEntry,
  };
};
