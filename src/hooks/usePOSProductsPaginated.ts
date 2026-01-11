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
        p_search: searchTerm,
        p_page_size: pageSize,
        p_page: currentPage
      });

      if (error) throw error;

      // La fonction RPC retourne maintenant un objet JSON avec products, total_count, etc.
      const result = data as { 
        products: any[]; 
        total_count: number; 
        page: number; 
        page_size: number; 
        total_pages: number 
      };

      if (!result || !result.products || result.products.length === 0) {
        return {
          products: [],
          totalCount: 0,
          totalPages: 0
        };
      }

      // Transform RPC result to POSProduct format
      const products: POSProduct[] = result.products.map(row => ({
        id: row.id,
        tenant_id: row.tenant_id,
        name: row.libelle_produit,
        libelle_produit: row.libelle_produit,
        dci: row.dci_nom,
        code_cip: row.code_cip,
        // Prix depuis la table produits (source de vérité)
        prix_vente_ht: Number(row.prix_vente_ht) || 0,
        prix_vente_ttc: Number(row.prix_vente_ttc) || 0,
        taux_tva: Number(row.taux_tva) || 0,
        tva_montant: Number(row.tva_montant) || 0,
        taux_centime_additionnel: Number(row.taux_centime_additionnel) || 0,
        centime_additionnel_montant: Number(row.centime_additionnel_montant) || 0,
        // Alias pour compatibilité
        price: Number(row.prix_vente_ttc) || 0,
        price_ht: Number(row.prix_vente_ht) || 0,
        tva_rate: Number(row.taux_tva) || 0,
        stock: Number(row.stock_disponible) || 0,
        category: row.category || 'Non catégorisé',
        requiresPrescription: row.prescription_requise || false,
        lots: [] // Lots chargés à la demande
      }));

      return {
        products,
        totalCount: result.total_count,
        totalPages: result.total_pages
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
        prix_achat_unitaire: Number(lot.prix_achat_unitaire),
        // Prix depuis les lots (source de vérité pour la vente)
        prix_vente_ht: Number(lot.prix_vente_ht) || 0,
        prix_vente_ttc: Number(lot.prix_vente_ttc) || 0,
        taux_tva: Number(lot.taux_tva) || 0,
        montant_tva: Number(lot.montant_tva) || 0,
        taux_centime_additionnel: Number(lot.taux_centime_additionnel) || 0,
        montant_centime_additionnel: Number(lot.montant_centime_additionnel) || 0
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
