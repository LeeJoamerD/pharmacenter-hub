import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CashExpense, CashExpensePermissions } from '@/hooks/useCashExpenses';

export interface CashExpenseSearchFilters {
  dateFrom: string;
  dateTo: string;
  motif: string;
  agentId: string;
  sessionStatus: string;
  includesCancelled: boolean;
  search: string;
  montantMin: string;
  montantMax: string;
  sessionId: string;
}

export interface CashExpenseSearchResult {
  id: string;
  session_caisse_id: string;
  type_mouvement: string;
  montant: number;
  motif: string;
  description: string | null;
  reference: string | null;
  notes: string | null;
  agent_id: string | null;
  date_mouvement: string | null;
  tenant_id: string;
  est_annule: boolean | null;
  annule_par: string | null;
  date_annulation: string | null;
  motif_annulation: string | null;
  session_statut: string;
  session_date_ouverture: string;
  session_date_fermeture: string | null;
  session_agent_id: string;
  session_caisse_id_fk: string;
  agent_noms: string | null;
  agent_prenoms: string | null;
  cancelled_by_noms: string | null;
  cancelled_by_prenoms: string | null;
}

const DEFAULT_FILTERS: CashExpenseSearchFilters = {
  dateFrom: '',
  dateTo: '',
  motif: '',
  agentId: '',
  sessionStatus: 'all',
  includesCancelled: false,
  search: '',
  montantMin: '',
  montantMax: '',
  sessionId: '',
};

const MANAGER_ROLES = ['Admin', 'Pharmacien Titulaire', 'Secrétaire'];

/** Convert a CashExpenseSearchResult to CashExpense for table compatibility */
export const toCashExpense = (r: CashExpenseSearchResult): CashExpense => ({
  id: r.id,
  session_caisse_id: r.session_caisse_id,
  type_mouvement: r.type_mouvement,
  montant: r.montant,
  motif: r.motif,
  description: r.description,
  reference: r.reference,
  notes: r.notes,
  agent_id: r.agent_id,
  date_mouvement: r.date_mouvement,
  tenant_id: r.tenant_id,
  est_annule: r.est_annule,
  annule_par: r.annule_par,
  date_annulation: r.date_annulation,
  motif_annulation: r.motif_annulation,
  session: {
    id: r.session_caisse_id,
    caisse_id: r.session_caisse_id_fk,
    agent_id: r.session_agent_id,
    statut: r.session_statut,
    date_ouverture: r.session_date_ouverture,
    date_fermeture: r.session_date_fermeture,
  },
  agent: r.agent_noms || r.agent_prenoms ? {
    id: r.agent_id || '',
    noms: r.agent_noms || '',
    prenoms: r.agent_prenoms || '',
  } : undefined,
  cancelled_by: r.cancelled_by_noms || r.cancelled_by_prenoms ? {
    id: r.annule_par || '',
    noms: r.cancelled_by_noms || '',
    prenoms: r.cancelled_by_prenoms || '',
  } : undefined,
});

export const useCashExpenseSearch = () => {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const tenantId = currentTenant?.id;

  const [filters, setFilters] = useState<CashExpenseSearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<CashExpenseSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<{ total_montant: number } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [sortField, setSortField] = useState('date_mouvement');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentPersonnelId, setCurrentPersonnelId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user || !currentTenant) return;
      const { data } = await supabase
        .from('personnel')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .eq('tenant_id', currentTenant.id)
        .maybeSingle();
      if (data) {
        setCurrentUserRole(data.role);
        setCurrentPersonnelId(data.id);
      }
    };
    fetchUserInfo();
  }, [user, currentTenant]);

  const buildRpcParams = useCallback((f: CashExpenseSearchFilters, forExport = false) => {
    const params: Record<string, any> = { p_tenant_id: tenantId };

    if (f.dateFrom) params.p_date_from = new Date(f.dateFrom).toISOString();
    if (f.dateTo) {
      const end = new Date(f.dateTo);
      end.setHours(23, 59, 59, 999);
      params.p_date_to = end.toISOString();
    }
    if (f.motif) params.p_motif = f.motif;
    if (f.agentId) params.p_agent_id = f.agentId;
    if (f.sessionStatus && f.sessionStatus !== 'all') params.p_session_status = f.sessionStatus;
    if (f.includesCancelled) params.p_includes_cancelled = true;
    if (f.search) params.p_search = f.search;
    if (f.montantMin) params.p_montant_min = parseFloat(f.montantMin);
    if (f.montantMax) params.p_montant_max = parseFloat(f.montantMax);
    if (f.sessionId) params.p_session_id = f.sessionId;

    // Role-based filtering for cashiers
    if (currentUserRole === 'Caissier' && currentPersonnelId) {
      params.p_agent_session_id = currentPersonnelId;
      params.p_session_status = 'open';
    }

    params.p_sort_field = sortField;
    params.p_sort_direction = sortDirection;

    if (!forExport) {
      params.p_page = page;
      params.p_page_size = pageSize;
    }

    return params;
  }, [tenantId, page, pageSize, sortField, sortDirection, currentUserRole, currentPersonnelId]);

  const search = useCallback(async () => {
    if (!tenantId || !currentPersonnelId || !currentUserRole) return;

    setLoading(true);
    try {
      const params = buildRpcParams(filters);
      const { data, error } = await supabase.rpc('search_cash_expenses_paginated' as any, params);
      if (error) throw error;

      const result = data as any;
      setResults((result?.expenses || []) as CashExpenseSearchResult[]);
      setTotalCount(result?.count || 0);
      setStats(result?.stats || null);
    } catch (err) {
      console.error('Erreur recherche dépenses:', err);
      toast.error('Erreur lors de la recherche des dépenses');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters, buildRpcParams, currentPersonnelId, currentUserRole]);

  const fetchAllForExport = useCallback(async (): Promise<CashExpenseSearchResult[]> => {
    if (!tenantId) return [];

    setExportLoading(true);
    try {
      const params = buildRpcParams(filters, true);
      const { data, error } = await supabase.rpc('fetch_all_cash_expenses_for_export' as any, params);
      if (error) throw error;
      return (data || []) as CashExpenseSearchResult[];
    } catch (err) {
      console.error('Erreur export dépenses:', err);
      toast.error('Erreur lors de la récupération des données pour export');
      return [];
    } finally {
      setExportLoading(false);
    }
  }, [tenantId, filters, buildRpcParams]);

  const updateFilters = useCallback((newFilters: Partial<CashExpenseSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // Permissions (same logic as useCashExpenses)
  const getPermissions = useCallback((expense: CashExpense): CashExpensePermissions => {
    if (!currentUserRole || !currentPersonnelId) {
      return { canView: false, canEdit: false, canDelete: false };
    }
    const isOpenSession = expense.session?.statut === 'Ouverte';
    const isOwnSession = expense.session?.agent_id === currentPersonnelId;
    const isAdminOrManager = MANAGER_ROLES.includes(currentUserRole);
    const isCancelled = expense.est_annule === true;

    if (isCancelled) return { canView: true, canEdit: false, canDelete: false };
    if (currentUserRole === 'Caissier') {
      return { canView: isOwnSession && isOpenSession, canEdit: isOwnSession && isOpenSession, canDelete: isOwnSession && isOpenSession };
    }
    if (isAdminOrManager) {
      return { canView: true, canEdit: isOpenSession, canDelete: isOpenSession };
    }
    return { canView: false, canEdit: false, canDelete: false };
  }, [currentUserRole, currentPersonnelId]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { search(); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Convert results for table compatibility
  const expenses: CashExpense[] = results.map(toCashExpense);

  return {
    filters,
    expenses,
    totalCount,
    stats,
    page,
    pageSize,
    totalPages,
    loading,
    exportLoading,
    sortField,
    sortDirection,
    currentUserRole,
    setPage,
    setSortField,
    setSortDirection,
    updateFilters,
    resetFilters,
    fetchAllForExport,
    getPermissions,
    refresh: search,
  };
};
