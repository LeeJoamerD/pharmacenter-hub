import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook pour les requêtes optimisées avec cache et pagination
export const useOptimizedQueries = () => {
  const queryClient = useQueryClient();

  // Cache les données fréquemment utilisées
  const cacheKeys = {
    suppliers: 'suppliers',
    products: 'products',
    currentStock: 'currentStock',
    orders: 'orders',
    receptions: 'receptions'
  };

  // Fonction pour obtenir le tenant ID
  const getCurrentTenantId = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data: personnel } = await supabase
      .from('personnel')
      .select('tenant_id')
      .eq('auth_user_id', user.user.id)
      .maybeSingle();

    return personnel?.tenant_id || null;
  };

  // Requête optimisée pour les fournisseurs (cache long terme)
  const useOptimizedSuppliers = () => {
    return useQuery({
      queryKey: [cacheKeys.suppliers],
      queryFn: async () => {
        const tenantId = await getCurrentTenantId();
        if (!tenantId) return [];

        const { data, error } = await supabase
          .from('fournisseurs')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('nom');

        if (error) throw error;
        return data || [];
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,   // 30 minutes
    });
  };

  // Requête optimisée pour les produits avec pagination
  const useOptimizedProducts = (page: number = 1, pageSize: number = 50, searchTerm: string = '') => {
    return useQuery({
      queryKey: [cacheKeys.products, page, pageSize, searchTerm],
      queryFn: async () => {
        const tenantId = await getCurrentTenantId();
        if (!tenantId) return { data: [], count: 0 };

      let query = supabase
        .from('produits_with_stock')
        .select(`
          *,
          famille:famille_produit!fk_produits_famille_id(libelle_famille),
          dci:dci(nom_dci)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId);

        if (searchTerm) {
          query = query.or(`nom_produit.ilike.%${searchTerm}%,reference_produit.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query
          .order('nom_produit')
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) throw error;
        return { data: data || [], count: count || 0 };
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      placeholderData: (previousData) => previousData,
    });
  };

  // Requête optimisée pour les commandes avec filtres
  const useOptimizedOrders = (filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    supplier?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) => {
    const { page = 1, pageSize = 20, status, supplier, dateFrom, dateTo } = filters;

    return useQuery({
      queryKey: [cacheKeys.orders, page, pageSize, status, supplier, dateFrom, dateTo],
      queryFn: async () => {
        const tenantId = await getCurrentTenantId();
        if (!tenantId) return { data: [], count: 0, stats: {} };

        let query = supabase
          .from('commandes_fournisseurs')
          .select(`
            *,
            fournisseur:fournisseurs(nom, telephone_appel),
            agent:personnel(noms, prenoms),
            lignes:lignes_commande_fournisseur(
              quantite_commandee,
              prix_achat_unitaire_attendu,
              produit:produits(nom_produit)
            )
          `, { count: 'exact' })
          .eq('tenant_id', tenantId);

        // Filtres
        if (status && status !== 'tous') {
          query = query.eq('statut', status);
        }
        if (supplier && supplier !== 'tous') {
          query = query.eq('fournisseur_id', supplier);
        }
        if (dateFrom) {
          query = query.gte('date_commande', dateFrom);
        }
        if (dateTo) {
          query = query.lte('date_commande', dateTo);
        }

        const { data, error, count } = await query
          .order('date_commande', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) throw error;

        // Calculer les statistiques
        const { data: statsData } = await supabase
          .from('commandes_fournisseurs')
          .select('statut')
          .eq('tenant_id', tenantId);

        const stats = statsData?.reduce((acc: any, item: any) => {
          acc[item.statut] = (acc[item.statut] || 0) + 1;
          return acc;
        }, {}) || {};

        return { 
          data: data || [], 
          count: count || 0,
          stats
        };
      },
      staleTime: 30 * 1000, // 30 secondes
      placeholderData: (previousData) => previousData,
    });
  };

  // Requête optimisée pour le stock actuel
  const useOptimizedCurrentStock = (filters: {
    page?: number;
    pageSize?: number;
    family?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
  } = {}) => {
    const { page = 1, pageSize = 50, family, lowStock, expiringSoon } = filters;

    return useQuery({
      queryKey: [cacheKeys.currentStock, page, pageSize, family, lowStock, expiringSoon],
      queryFn: async () => {
        const tenantId = await getCurrentTenantId();
        if (!tenantId) return { data: [], count: 0 };

        let query = supabase
          .from('lots')
          .select(`
            *,
            produit:produits(
              nom_produit,
              reference_produit,
              seuil_minimal,
              famille:famille_produit!fk_produits_famille_id(libelle_famille)
            )
          `, { count: 'exact' })
          .eq('tenant_id', tenantId)
          .gt('quantite_restante', 0);

        // Filtres
        if (family && family !== 'tous') {
          query = query.eq('produits.famille_id', family);
        }
        if (lowStock) {
          // Pour le stock faible, on compare avec le seuil minimal
          query = query.lt('quantite_restante', 'produits.seuil_minimal');
        }
        if (expiringSoon) {
          const in30Days = new Date();
          in30Days.setDate(in30Days.getDate() + 30);
          query = query.lte('date_peremption', in30Days.toISOString().split('T')[0]);
        }

        const { data, error, count } = await query
          .order('date_peremption', { ascending: true })
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) throw error;
        return { data: data || [], count: count || 0 };
      },
      staleTime: 1 * 60 * 1000, // 1 minute
      placeholderData: (previousData) => previousData,
    });
  };

  // Fonction pour invalider le cache
  const invalidateCache = (key?: string) => {
    if (key) {
      queryClient.invalidateQueries({ queryKey: [key] });
    } else {
      queryClient.invalidateQueries();
    }
  };

  // Fonction pour précharger les données
  const prefetchData = async (keys: string[]) => {
    const promises = keys.map(async (key) => {
      switch (key) {
        case cacheKeys.suppliers:
          const tenantId = await getCurrentTenantId();
          if (!tenantId) return;
          
          return queryClient.prefetchQuery({
            queryKey: [cacheKeys.suppliers],
            queryFn: async () => {
              const { data, error } = await supabase
                .from('fournisseurs')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('nom');

              if (error) throw error;
              return data || [];
            }
          });
        default:
          return Promise.resolve();
      }
    });
    
    await Promise.all(promises);
  };

  return {
    useOptimizedSuppliers,
    useOptimizedProducts,
    useOptimizedOrders,
    useOptimizedCurrentStock,
    invalidateCache,
    prefetchData,
    cacheKeys
  };
};

// Hook pour la pagination intelligente
export const useSmartPagination = (totalCount: number, pageSize: number = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    
    const pages: (number | string)[] = [];
    
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  return {
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    getPageNumbers
  };
};

// Hook pour les états de chargement optimisés
export const useLoadingStates = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  const isAnyLoading = () => Object.values(loadingStates).some(Boolean);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates
  };
};