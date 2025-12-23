import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

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
        queryBuilder = queryBuilder.eq('statut_rapprochement', 'Rapproché');
      } else if (filters.status === 'unmatched') {
        queryBuilder = queryBuilder.neq('statut_rapprochement', 'Rapproché');
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

  // Mutation pour supprimer une transaction
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant ID");

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

  // Mutation pour rapprocher une transaction
  const reconcileTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant ID");

      const { data, error } = await supabase
        .from("transactions_bancaires")
        .update({ 
          statut_rapprochement: 'Rapproché',
          date_rapprochement: new Date().toISOString()
        })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
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

  return {
    ...query,
    transactions: query.data?.data || [],
    totalCount: query.data?.totalCount || 0,
    totalPages: query.data?.totalPages || 0,
    currentPage: query.data?.currentPage || 0,
    deleteTransaction,
    reconcileTransaction,
  };
};
