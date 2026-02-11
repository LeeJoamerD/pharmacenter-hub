import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';

export interface MovementsPaginatedFilters {
  search?: string;
  type_mouvement?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface MovementsPaginatedStats {
  total: number;
  entrees: number;
  sorties: number;
  ajustements: number;
  transferts: number;
  retours: number;
  destructions: number;
}

export interface PaginatedMovement {
  id: string;
  tenant_id: string;
  lot_id: string;
  produit_id: string;
  type_mouvement: string;
  quantite_avant: number;
  quantite_mouvement: number;
  quantite_apres: number;
  prix_unitaire: number | null;
  valeur_mouvement: number | null;
  motif: string | null;
  reference_document: string | null;
  reference_id: string | null;
  reference_type: string | null;
  agent_id: string | null;
  lot_destination_id: string | null;
  emplacement_source: string | null;
  emplacement_destination: string | null;
  date_mouvement: string;
  metadata: any;
  created_at: string;
  lot: { id: string; numero_lot: string; produit_id: string; quantite_restante: number } | null;
  lot_destination: { id: string; numero_lot: string; produit_id: string; quantite_restante: number } | null;
  produit: { id: string; libelle_produit: string; code_cip: string } | null;
}

export function useMovementsPaginated(filters: MovementsPaginatedFilters = {}, pageSize: number = 50) {
  const { tenantId } = useTenant();
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(filters.search || '', 400);

  // Reset page when filters change
  const filterKey = useMemo(() => 
    JSON.stringify({
      search: debouncedSearch,
      type: filters.type_mouvement,
      dateDebut: filters.date_debut,
      dateFin: filters.date_fin,
      sortBy: filters.sort_by,
      sortOrder: filters.sort_order,
    }),
    [debouncedSearch, filters.type_mouvement, filters.date_debut, filters.date_fin, filters.sort_by, filters.sort_order]
  );

  // Reset page when filters change
  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      setPage(1);
      prevFilterKey.current = filterKey;
    }
  }, [filterKey]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['movements-paginated', tenantId, filterKey, page, pageSize],
    queryFn: async () => {
      const { data: result, error } = await supabase.rpc('search_movements_paginated', {
        p_tenant_id: tenantId!,
        p_search: debouncedSearch || '',
        p_type_mouvement: filters.type_mouvement || null,
        p_date_debut: filters.date_debut || null,
        p_date_fin: filters.date_fin || null,
        p_sort_by: filters.sort_by || 'date_mouvement',
        p_sort_order: filters.sort_order || 'desc',
        p_page_size: pageSize,
        p_page: page,
      });

      if (error) throw error;
      return result as unknown as {
        movements: PaginatedMovement[];
        count: number;
        stats: MovementsPaginatedStats;
      };
    },
    enabled: !!tenantId,
    placeholderData: (previousData) => previousData,
  });

  const totalPages = Math.ceil((data?.count || 0) / pageSize);

  return {
    movements: (data?.movements || []) as PaginatedMovement[],
    count: data?.count || 0,
    totalPages,
    stats: data?.stats || { total: 0, entrees: 0, sorties: 0, ajustements: 0, transferts: 0, retours: 0, destructions: 0 },
    isLoading,
    isFetching,
    error,
    refetch,
    page,
    setPage,
    pageSize,
    // Reset page when filters change
    resetPage: () => setPage(1),
  };
}
