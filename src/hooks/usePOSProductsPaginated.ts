import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { POSProduct, LotInfo } from '@/types/pos';

interface POSProductsPaginatedResult {
  products: POSProduct[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: Error | null;
  setCurrentPage: (page: number) => void;
  getProductLots: (productId: string) => Promise<LotInfo[]>;
}

export const usePOSProductsPaginated = (
  searchTerm: string = '',
  pageSize: number = 50
): POSProductsPaginatedResult => {
  const { tenantId } = useTenant();
  const [currentPage, setCurrentPage] = useState(1);

  // IMPORTANT: Ne charger que si l'utilisateur tape au moins 2 caractères
  // Cela évite les requêtes massives qui causent les erreurs 400
  const shouldFetch = !!tenantId && searchTerm.length >= 2;

  // Fetch paginated products using RPC
  const { data, isLoading, error } = useQuery({
    queryKey: ['pos-products-paginated', tenantId, searchTerm, pageSize, currentPage],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { data, error } = await supabase.rpc('get_pos_products', {
        p_tenant_id: tenantId,
        p_search_term: searchTerm,
        p_page_size: pageSize,
        p_page: currentPage
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          products: [],
          totalCount: 0,
          totalPages: 0
        };
      }

      // Transform RPC result to POSProduct format
      const totalCount = data[0]?.total_count || 0;
      const products: POSProduct[] = data.map(row => ({
        id: row.id,
        tenant_id: row.tenant_id,
        name: row.libelle_produit,
        libelle_produit: row.libelle_produit,
        dci: row.dci_nom,
        code_cip: row.code_cip,
        price: Number(row.prix_vente_ttc),
        price_ht: Number(row.prix_vente_ht),
        tva_rate: Number(row.tva),
        stock: Number(row.stock_disponible),
        category: row.famille_libelle || 'Non catégorisé',
        requiresPrescription: row.requires_prescription || false,
        lots: [] // Lots chargés à la demande
      }));

      return {
        products,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    },
    enabled: shouldFetch, // Ne charge que si recherche >= 2 caractères
    staleTime: 30000, // Cache 30 secondes
  });

  // Function to fetch lots for a specific product on demand
  const getProductLots = useCallback(async (productId: string): Promise<LotInfo[]> => {
    if (!tenantId) return [];

    try {
      const { data, error } = await supabase.rpc('get_product_lots', {
        p_tenant_id: tenantId,
        p_product_id: productId
      });

      if (error) throw error;

      return (data || []).map(lot => ({
        id: lot.id,
        numero_lot: lot.numero_lot,
        quantite_restante: lot.quantite_restante,
        date_peremption: new Date(lot.date_peremption),
        prix_achat_unitaire: Number(lot.prix_achat_unitaire)
      }));
    } catch (error) {
      console.error('Erreur chargement lots:', error);
      return [];
    }
  }, [tenantId]);

  return {
    products: data?.products || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    currentPage,
    isLoading,
    error: error as Error | null,
    setCurrentPage,
    getProductLots
  };
};
