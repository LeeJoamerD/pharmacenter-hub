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

/**
 * Détecte si un terme de recherche ressemble à un code-barres
 * (lot, EAN, CIP) plutôt qu'un nom de produit.
 */
const looksLikeBarcode = (term: string): boolean => {
  if (!term) return false;
  // Commence par LOT (code-barres de lot)
  if (/^LOT/i.test(term)) return true;
  // Purement numérique de 7-14 chiffres (EAN-8, EAN-13, CIP)
  if (/^\d{7,14}$/.test(term)) return true;
  // Contient le séparateur ° typique des codes-barres de lots
  if (term.includes('°')) return true;
  return false;
};

export const usePOSProductsPaginated = (
  searchTerm: string = '',
  pageSize: number = 50
): POSProductsPaginatedResult => {
  const { tenantId } = useTenant();
  const [currentPage, setCurrentPage] = useState(1);

  const isBarcode = looksLikeBarcode(searchTerm);

  // Pour les codes-barres, pas de minimum de caractères
  // Pour la recherche texte, minimum 2 caractères
  const shouldFetch = !!tenantId && (isBarcode ? searchTerm.length >= 3 : searchTerm.length >= 2);

  // Fetch paginated products using RPC
  const { data, isLoading, error } = useQuery({
    queryKey: ['pos-products-paginated', tenantId, searchTerm, pageSize, currentPage, isBarcode],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      // === Recherche par code-barres ===
      if (isBarcode) {
        // Normaliser les séparateurs : le scanner physique envoie ° mais la DB stocke -
        const normalizedBarcode = searchTerm.trim().toUpperCase().replace(/°/g, '-');
        const { data: barcodeData, error: barcodeError } = await supabase.rpc('search_product_by_barcode', {
          p_tenant_id: tenantId,
          p_barcode: normalizedBarcode
        });

        if (barcodeError) throw barcodeError;

        if (barcodeData && barcodeData.length > 0) {
          const products: POSProduct[] = barcodeData.map((row: any) => ({
            id: row.id,
            tenant_id: row.tenant_id,
            name: row.name || row.libelle_produit,
            libelle_produit: row.libelle_produit,
            dci: row.dci,
            code_cip: row.code_cip,
            prix_vente_ht: Number(row.price_ht) || 0,
            prix_vente_ttc: Number(row.price) || 0,
            taux_tva: Number(row.taux_tva) || 0,
            tva_montant: Number(row.tva_montant) || 0,
            taux_centime_additionnel: Number(row.taux_centime_additionnel) || 0,
            centime_additionnel_montant: Number(row.centime_additionnel_montant) || 0,
            price: Number(row.price) || 0,
            price_ht: Number(row.price_ht) || 0,
            tva_rate: Number(row.taux_tva) || 0,
            stock: Number(row.stock) || 0,
            category: row.category || 'Non catégorisé',
            requiresPrescription: row.requires_prescription || false,
            lots: row.lot_id ? [{
              id: row.lot_id,
              numero_lot: row.numero_lot,
              quantite_restante: 0,
              date_peremption: row.date_peremption ? new Date(row.date_peremption) : null,
              prix_achat_unitaire: Number(row.prix_achat_unitaire) || 0,
              prix_vente_ht: Number(row.price_ht) || 0,
              prix_vente_ttc: Number(row.price) || 0,
              taux_tva: Number(row.taux_tva) || 0,
              montant_tva: Number(row.tva_montant) || 0,
              taux_centime_additionnel: Number(row.taux_centime_additionnel) || 0,
              montant_centime_additionnel: Number(row.centime_additionnel_montant) || 0,
            }] : [],
            earliest_expiration_date: row.date_peremption,
            has_valid_stock: true,
            all_lots_expired: false,
            niveau_detail: 1,
            has_detail_product: false
          }));

          return { products, totalCount: products.length, totalPages: 1 };
        }

        // Aucun résultat par code-barres, retourner vide
        return { products: [], totalCount: 0, totalPages: 0 };
      }

      // === Recherche texte classique ===
      const { data, error } = await supabase.rpc('get_pos_products', {
        p_tenant_id: tenantId,
        p_search: searchTerm,
        p_page_size: pageSize,
        p_page: currentPage
      });

      if (error) throw error;

      const result = data as { 
        products: any[]; 
        total_count: number; 
        page: number; 
        page_size: number; 
        total_pages: number 
      };

      if (!result || !result.products || result.products.length === 0) {
        return { products: [], totalCount: 0, totalPages: 0 };
      }

      const products: POSProduct[] = result.products.map(row => ({
        id: row.id,
        tenant_id: row.tenant_id,
        name: row.libelle_produit,
        libelle_produit: row.libelle_produit,
        dci: row.dci_nom,
        code_cip: row.code_cip,
        prix_vente_ht: Number(row.prix_vente_ht) || 0,
        prix_vente_ttc: Number(row.prix_vente_ttc) || 0,
        taux_tva: Number(row.taux_tva) || 0,
        tva_montant: Number(row.tva_montant) || 0,
        taux_centime_additionnel: Number(row.taux_centime_additionnel) || 0,
        centime_additionnel_montant: Number(row.centime_additionnel_montant) || 0,
        price: Number(row.prix_vente_ttc) || 0,
        price_ht: Number(row.prix_vente_ht) || 0,
        tva_rate: Number(row.taux_tva) || 0,
        stock: Number(row.stock_disponible) || 0,
        category: row.category || 'Non catégorisé',
        requiresPrescription: row.prescription_requise || false,
        lots: [],
        earliest_expiration_date: row.earliest_expiration_date,
        has_valid_stock: row.has_valid_stock ?? true,
        all_lots_expired: row.all_lots_expired ?? false,
        niveau_detail: row.niveau_detail ?? 1,
        has_detail_product: row.has_detail_product ?? false
      }));

      return {
        products,
        totalCount: result.total_count,
        totalPages: result.total_pages
      };
    },
    enabled: shouldFetch,
    staleTime: 30000,
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
        date_peremption: lot.date_peremption ? new Date(lot.date_peremption) : null,
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
