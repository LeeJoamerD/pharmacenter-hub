import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface CashSessionSearchFilters {
  dateFrom: string;
  dateTo: string;
  statut: string;
  cashierId: string;
  caisseId: string;
  minAmount: string;
  maxAmount: string;
}

export interface CashSessionSearchResult {
  id: string;
  tenant_id?: string;
  numero_session: string;
  caissier_id: string;
  caisse_id?: string;
  date_ouverture: string;
  date_fermeture?: string;
  fond_caisse_ouverture: number;
  montant_theorique_fermeture?: number;
  montant_reel_fermeture?: number;
  ecart?: number;
  statut: string;
  type_session?: string;
  date_session?: string;
  caissier_noms?: string;
  caissier_prenoms?: string;
  caisse_nom?: string;
}

const DEFAULT_FILTERS: CashSessionSearchFilters = {
  dateFrom: '',
  dateTo: '',
  statut: '',
  cashierId: '',
  caisseId: '',
  minAmount: '',
  maxAmount: '',
};

export const useCashSessionSearch = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  const [filters, setFilters] = useState<CashSessionSearchFilters>(DEFAULT_FILTERS);
  const [sessions, setSessions] = useState<CashSessionSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const buildRpcParams = useCallback((f: CashSessionSearchFilters, forExport = false) => {
    const params: Record<string, any> = {
      p_tenant_id: tenantId,
    };

    if (f.dateFrom) params.p_date_from = new Date(f.dateFrom).toISOString();
    if (f.dateTo) {
      const endDate = new Date(f.dateTo);
      endDate.setHours(23, 59, 59, 999);
      params.p_date_to = endDate.toISOString();
    }
    if (f.statut) params.p_statut = f.statut;
    if (f.cashierId) params.p_caissier_id = f.cashierId;
    if (f.caisseId) params.p_caisse_id = f.caisseId;
    if (f.minAmount) params.p_montant_min = parseFloat(f.minAmount);
    if (f.maxAmount) params.p_montant_max = parseFloat(f.maxAmount);

    if (!forExport) {
      params.p_page = page;
      params.p_page_size = pageSize;
    }

    return params;
  }, [tenantId, page, pageSize]);

  const search = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const params = buildRpcParams(filters);
      const { data, error } = await supabase.rpc('search_cash_sessions_paginated' as any, params);

      if (error) throw error;

      const result = data as any;
      setSessions((result?.sessions || []) as CashSessionSearchResult[]);
      setTotalCount(result?.count || 0);
    } catch (err) {
      console.error('Erreur recherche sessions:', err);
      toast.error('Erreur lors de la recherche des sessions');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters, buildRpcParams]);

  const fetchAllForExport = useCallback(async (): Promise<CashSessionSearchResult[]> => {
    if (!tenantId) return [];

    setExportLoading(true);
    try {
      const params = buildRpcParams(filters, true);
      const { data, error } = await supabase.rpc('fetch_all_cash_sessions_for_export' as any, params);

      if (error) throw error;

      return (data || []) as CashSessionSearchResult[];
    } catch (err) {
      console.error('Erreur export sessions:', err);
      toast.error('Erreur lors de la récupération des données pour export');
      return [];
    } finally {
      setExportLoading(false);
    }
  }, [tenantId, filters, buildRpcParams]);

  const updateFilters = useCallback((newFilters: Partial<CashSessionSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // Debounce pour les montants, recherche immédiate pour le reste
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    filters,
    sessions,
    totalCount,
    page,
    pageSize,
    totalPages,
    loading,
    exportLoading,
    setPage,
    updateFilters,
    resetFilters,
    fetchAllForExport,
    refresh: search,
  };
};
