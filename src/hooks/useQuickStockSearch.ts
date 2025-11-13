import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useMemo } from 'react';
import { useDebounce } from '@/utils/supplyChainOptimizations';
import { splitIntoBatches } from '@/utils/queryHelpers';

// Validation et sécurité des entrées
const validateSearchInput = (searchTerm: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return { isValid: false, sanitized: '', error: 'Terme de recherche invalide' };
  }

  // Nettoyer et valider l'entrée
  const sanitized = searchTerm.trim().toLowerCase();
  
  // Vérifier la longueur minimale
  if (sanitized.length < 2) {
    return { isValid: false, sanitized, error: 'Minimum 2 caractères requis' };
  }

  // Vérifier la longueur maximale pour éviter les attaques DoS
  if (sanitized.length > 100) {
    return { isValid: false, sanitized: sanitized.substring(0, 100), error: 'Terme de recherche trop long' };
  }

  // Bloquer les caractères potentiellement dangereux
  const dangerousChars = /[<>'";&|`$(){}[\]\\]/;
  if (dangerousChars.test(sanitized)) {
    return { isValid: false, sanitized: sanitized.replace(dangerousChars, ''), error: 'Caractères non autorisés détectés' };
  }

  // Bloquer les mots-clés SQL potentiellement dangereux
  const sqlKeywords = /\b(select|insert|update|delete|drop|create|alter|exec|union|script)\b/i;
  if (sqlKeywords.test(sanitized)) {
    return { isValid: false, sanitized: '', error: 'Contenu non autorisé détecté' };
  }

  return { isValid: true, sanitized };
};

export interface QuickSearchProduct {
  id: string;
  libelle_produit: string;
  code_cip: string;
  code_produit?: string;
  stock_actuel: number;
  stock_critique: number;
  stock_faible: number;
  stock_limite: number;
  stock_minimum?: number;
  prix_vente_ttc: number;
  prix_vente?: number;
  statut_stock: string;
  famille_libelle?: string;
  rayon_libelle?: string;
  rotation: string;
}

export interface QuickSearchResult {
  products: QuickSearchProduct[];
  totalCount: number;
  hasMore: boolean;
}

export const useQuickStockSearch = (searchTerm: string = '', pageSize: number = 50) => {
  const { tenantId } = useTenant();
  
  // Validation sécurisée de l'entrée utilisateur
  const validationResult = useMemo(() => validateSearchInput(searchTerm), [searchTerm]);
  
  // Debounce du terme de recherche validé
  const debouncedSearchTerm = useDebounce(validationResult.sanitized, 300);
  
  // Sécurité multi-tenant : vérifier que tenantId est valide
  const isValidTenant = useMemo(() => {
    if (!tenantId || typeof tenantId !== 'string') return false;
    // Vérifier le format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(tenantId);
  }, [tenantId]);

  const query = useQuery({
    queryKey: ['quick-stock-search', debouncedSearchTerm, pageSize, tenantId],
    queryFn: async (): Promise<QuickSearchResult> => {
      // Vérifications de sécurité avant la requête
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || 'Terme de recherche invalide');
      }
      
      if (!isValidTenant) {
        throw new Error('Accès non autorisé - tenant invalide');
      }

      if (!debouncedSearchTerm) {
        return {
          products: [],
          totalCount: 0,
          hasMore: false
        };
      }

      // Construction sécurisée de la requête avec protection multi-tenant
      const queryBuilder = supabase
        .from('produits_with_stock')
        .select(`
          id,
          libelle_produit,
          code_cip,
          prix_achat,
          prix_vente_ttc,
          stock_actuel,
          stock_critique,
          stock_faible,
          stock_limite,
          is_active,
          famille_id,
          rayon_id
        `, { count: 'exact' })
        .eq('tenant_id', tenantId) // Sécurité multi-tenant OBLIGATOIRE
        .eq('is_active', true);

      // Application sécurisée des filtres de recherche
      if (debouncedSearchTerm) {
        // Utilisation de ilike pour une recherche insensible à la casse
        // Les termes sont déjà validés et nettoyés
        queryBuilder.or(`libelle_produit.ilike.%${debouncedSearchTerm}%,code_cip.ilike.%${debouncedSearchTerm}%`);
      }

      // Application de la pagination avec limites de sécurité
      const safePageSize = Math.min(Math.max(pageSize, 10), 500); // Limiter entre 10 et 500
      const offset = 0; // Toujours commencer à 0 pour cette implémentation simplifiée
      
      const { data: products, error, count } = await queryBuilder
        .order('libelle_produit', { ascending: true })
        .range(offset, offset + safePageSize - 1);

      if (error) {
        // Log de sécurité pour les erreurs de requête
        console.error('Erreur de requête sécurisée:', {
          tenantId,
          searchTerm: debouncedSearchTerm,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      // Les produits ont déjà stock_actuel de la vue
      const productsWithStock = (products || []).map((item) => {
        const stock_actuel = item.stock_actuel || 0;
        
        let statut_stock = 'normal';
        if (stock_actuel === 0) {
          statut_stock = 'rupture';
        } else if (item.stock_critique && stock_actuel <= item.stock_critique) {
          statut_stock = 'critique';
        } else if (item.stock_faible && stock_actuel <= item.stock_faible) {
          statut_stock = 'faible';
        }

        const rotation = stock_actuel > (item.stock_limite || 0) * 2 ? 'lente' : 
                        stock_actuel > (item.stock_limite || 0) ? 'normale' : 'rapide';

        return {
          id: item.id,
          libelle_produit: item.libelle_produit || '',
          code_cip: item.code_cip || '',
          stock_actuel,
          stock_critique: item.stock_critique || 0,
          stock_faible: item.stock_faible || 0,
          stock_limite: item.stock_limite || 0,
          prix_vente_ttc: item.prix_vente_ttc || 0,
          statut_stock,
          famille_libelle: null, // À implémenter avec une jointure si nécessaire
          rayon_libelle: null, // À implémenter avec une jointure si nécessaire
          rotation
        };
      });

      return {
        products: productsWithStock,
        totalCount: count || 0,
        hasMore: (count || 0) > safePageSize
      };
    },
    enabled: !!tenantId && validationResult.isValid,
    staleTime: 30000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Ne pas réessayer en cas d'erreur de sécurité
      if (error.message.includes('non autorisé') || error.message.includes('invalide')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    validationError: validationResult.isValid ? null : validationResult.error
  };
};