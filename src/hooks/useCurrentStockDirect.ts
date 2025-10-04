import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/utils/supplyChainOptimizations';

export interface CurrentStockItem {
  id: string;
  tenant_id: string;
  libelle_produit: string;
  code_cip: string;
  famille_id?: string;
  famille_libelle?: string;
  rayon_id?: string;
  rayon_libelle?: string;
  prix_achat: number;
  prix_vente_ttc: number;
  stock_actuel: number;
  stock_limite: number;
  stock_alerte: number;
  date_derniere_entree?: string;
  date_derniere_sortie?: string;
  valeur_stock: number;
  statut_stock: 'normal' | 'faible' | 'critique' | 'rupture' | 'surstock';
  rotation: 'rapide' | 'normale' | 'lente';
  lots_expires_prochainement?: number;
}

export interface StockAlert {
  id: string;
  type: 'rupture' | 'stock_faible' | 'surstock' | 'expiration';
  produit_id: string;
  produit_libelle: string;
  niveau_alerte: 'info' | 'warning' | 'danger' | 'critical';
  message: string;
  stock_actuel: number;
  stock_minimum?: number;
  stock_maximum?: number;
  jours_avant_expiration?: number;
}

export const useCurrentStockDirect = () => {
  const [products, setProducts] = useState<CurrentStockItem[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [rayons, setRayons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedRayon, setSelectedRayon] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'low' | 'out' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'value' | 'rotation'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const { toast } = useToast();
  
  // Debounced search term (500ms)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchCurrentStock = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's tenant_id
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.tenant_id) throw new Error('Tenant non trouvé');

      // Fetch products with stock using correct column names - optimized select
      const { data: productsData, error: productsError } = await supabase
        .from('produits')
        .select(`
          id, tenant_id, libelle_produit, code_cip, famille_id, rayon_id,
          prix_achat, prix_vente_ttc, stock_limite, stock_alerte,
          famille_produit!famille_id(id, libelle_famille),
          rayons_produits!rayon_id(id, libelle_rayon)
        `)
        .eq('tenant_id', personnel.tenant_id)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Fetch families
      const { data: familiesData, error: familiesError } = await supabase
        .from('famille_produit')
        .select('id, libelle_famille')
        .eq('tenant_id', personnel.tenant_id)
        .order('libelle_famille');

      if (familiesError) throw familiesError;

      // Fetch rayons
      const { data: rayonsData, error: rayonsError } = await supabase
        .from('rayons_produits')
        .select('id, libelle_rayon')
        .eq('tenant_id', personnel.tenant_id)
        .order('libelle_rayon');

      if (rayonsError) throw rayonsError;

      // Fetch alert thresholds by category
      const { data: alertThresholds, error: thresholdsError } = await supabase
        .from('alert_thresholds_by_category')
        .select('category, threshold')
        .eq('tenant_id', personnel.tenant_id)
        .eq('enabled', true);

      if (thresholdsError) {
        console.error('Erreur lors de la récupération des seuils:', thresholdsError);
      }

      // Create a map of thresholds by category (famille)
      const thresholdsMap = new Map<string, number>();
      (alertThresholds || []).forEach(threshold => {
        thresholdsMap.set(threshold.category, threshold.threshold);
      });

      // Fetch lots data to calculate actual stock
      const { data: lotsData, error: lotsError } = await supabase
        .from('lots')
        .select('produit_id, quantite_restante')
        .eq('tenant_id', personnel.tenant_id)
        .gt('quantite_restante', 0);

      if (lotsError) throw lotsError;

      // Aggregate stock by product
      const stockByProduct = (lotsData || []).reduce((acc: Record<string, number>, lot: any) => {
        acc[lot.produit_id] = (acc[lot.produit_id] || 0) + lot.quantite_restante;
        return acc;
      }, {});

      // Fetch stock movements for rotation calculation and real entry/exit dates
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: mouvementsData, error: mouvementsError } = await supabase
        .from('stock_mouvements')
        .select('produit_id, type_mouvement, quantite, date_mouvement')
        .eq('tenant_id', personnel.tenant_id)
        .gte('date_mouvement', thirtyDaysAgo.toISOString())
        .order('date_mouvement', { ascending: false });

      if (mouvementsError) throw mouvementsError;

      // Calculate movements by product
      const movementsByProduct = (mouvementsData || []).reduce((acc: Record<string, any>, mvt: any) => {
        if (!acc[mvt.produit_id]) {
          acc[mvt.produit_id] = {
            sorties: 0,
            entrees: 0,
            derniere_sortie: null,
            derniere_entree: null
          };
        }
        
        if (mvt.type_mouvement === 'sortie' || mvt.type_mouvement === 'vente') {
          acc[mvt.produit_id].sorties += mvt.quantite;
          if (!acc[mvt.produit_id].derniere_sortie) {
            acc[mvt.produit_id].derniere_sortie = mvt.date_mouvement;
          }
        } else if (mvt.type_mouvement === 'entree') {
          acc[mvt.produit_id].entrees += mvt.quantite;
          if (!acc[mvt.produit_id].derniere_entree) {
            acc[mvt.produit_id].derniere_entree = mvt.date_mouvement;
          }
        }
        
        return acc;
      }, {});

      // Process products data with real stock
      const processedProducts: CurrentStockItem[] = (productsData || []).map((product: any) => {
        const currentStock = stockByProduct[product.id] || 0;
        const stockValue = currentStock * (product.prix_achat || 0);
        
        // Calcul de la rotation basé sur les vrais mouvements de stock
        const movements = movementsByProduct[product.id];
        let rotation: CurrentStockItem['rotation'] = 'normale';
        
        if (movements && currentStock > 0) {
          // Calcul du stock moyen sur la période de 30 jours
          // Stock au début de la période = stock actuel + sorties - entrées
          const stockDebut = currentStock + movements.sorties - movements.entrees;
          const stockFin = currentStock;
          const stockMoyen = (stockDebut + stockFin) / 2;
          
          // Calcul de la vélocité réelle: sorties / stock moyen
          const velocite = stockMoyen > 0 ? movements.sorties / stockMoyen : 0;
          
          // Classification basée sur la vélocité
          if (velocite >= 2) rotation = 'rapide';      // Plus de 2 rotations complètes en 30 jours
          else if (velocite < 0.5) rotation = 'lente'; // Moins d'1/2 rotation en 30 jours
          else rotation = 'normale';
        } else if (movements && movements.sorties === 0) {
          rotation = 'lente'; // Aucune sortie en 30 jours
        }

        // Déterminer le statut du stock en utilisant alert_thresholds_by_category
        let stockStatus: CurrentStockItem['statut_stock'] = 'normal';
        const familleLibelle = product.famille_produit?.libelle_famille;
        const categoryThreshold = familleLibelle ? thresholdsMap.get(familleLibelle) : undefined;

        if (currentStock === 0) {
          stockStatus = 'rupture';
        } else if (categoryThreshold !== undefined) {
          // Utiliser les seuils configurés pour cette catégorie
          if (currentStock <= categoryThreshold * 0.5) {
            stockStatus = 'critique';
          } else if (currentStock <= categoryThreshold) {
            stockStatus = 'faible';
          } else if (currentStock >= (product.stock_alerte || 100)) {
            stockStatus = 'surstock';
          } else {
            stockStatus = 'normal';
          }
        } else {
          // Logique par défaut si aucun seuil n'est configuré
          if (currentStock <= (product.stock_limite || 0)) {
            stockStatus = currentStock <= (product.stock_limite || 0) * 0.5 ? 'critique' : 'faible';
          } else if (currentStock >= (product.stock_alerte || 100)) {
            stockStatus = 'surstock';
          } else {
            stockStatus = 'normal';
          }
        }
        
        // Dates réelles d'entrée/sortie depuis les mouvements
        const dateEntree = movements?.derniere_entree || product.created_at;
        const dateSortie = movements?.derniere_sortie || product.updated_at;

        return {
          id: product.id,
          tenant_id: product.tenant_id,
          libelle_produit: product.libelle_produit,
          code_cip: product.code_cip || '',
          famille_id: product.famille_id,
          famille_libelle: product.famille_produit?.libelle_famille,
          rayon_id: product.rayon_id,
          rayon_libelle: product.rayons_produits?.libelle_rayon,
          laboratoire_nom: product.laboratoires?.libelle,
          prix_achat: product.prix_achat || 0,
          prix_vente_ttc: product.prix_vente_ttc || 0,
          stock_actuel: currentStock,
          stock_limite: product.stock_limite || 0,
          stock_alerte: product.stock_alerte || 100,
          date_derniere_entree: dateEntree,
          date_derniere_sortie: dateSortie,
          valeur_stock: stockValue,
          statut_stock: stockStatus,
          rotation
        };
      });

      setProducts(processedProducts);
      setFamilies(familiesData || []);
      setRayons(rayonsData || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du stock actuel';
      setError(errorMessage);
      console.error('Erreur Stock Actuel:', err);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrage, tri et pagination des produits
  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(product => {
      // Filtre par terme de recherche (debounced)
      if (debouncedSearchTerm && 
          !product.libelle_produit.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) &&
          !product.code_cip.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
        return false;
      }

      // Filtre par famille
      if (selectedFamily && selectedFamily !== 'all' && product.famille_id !== selectedFamily) {
        return false;
      }

      // Filtre par rayon
      if (selectedRayon && selectedRayon !== 'all' && product.rayon_id !== selectedRayon) {
        return false;
      }

      // Filtre par statut de stock
      switch (stockFilter) {
        case 'available':
          return product.stock_actuel > 0;
        case 'low':
          return product.statut_stock === 'faible';
        case 'out':
          return product.statut_stock === 'rupture';
        case 'critical':
          return product.statut_stock === 'critique';
        default:
          return true;
      }
    });

    // Tri des produits
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.libelle_produit.localeCompare(b.libelle_produit);
          break;
        case 'stock':
          comparison = a.stock_actuel - b.stock_actuel;
          break;
        case 'value':
          comparison = a.valeur_stock - b.valeur_stock;
          break;
        case 'rotation':
          const rotationOrder = { rapide: 3, normale: 2, lente: 1 };
          comparison = rotationOrder[a.rotation] - rotationOrder[b.rotation];
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [products, debouncedSearchTerm, selectedFamily, selectedRayon, stockFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage]);

  // Génération des alertes
  const generateAlerts = (products: CurrentStockItem[]): StockAlert[] => {
    const alerts: StockAlert[] = [];

    products.forEach(product => {
      if (product.statut_stock === 'rupture') {
        alerts.push({
          id: `rupture-${product.id}`,
          type: 'rupture',
          produit_id: product.id,
          produit_libelle: product.libelle_produit,
          niveau_alerte: 'critical',
          message: `Produit en rupture de stock`,
          stock_actuel: product.stock_actuel
        });
      } else if (product.statut_stock === 'critique') {
        alerts.push({
          id: `critique-${product.id}`,
          type: 'stock_faible',
          produit_id: product.id,
          produit_libelle: product.libelle_produit,
          niveau_alerte: 'danger',
          message: `Stock critique: ${product.stock_actuel} unités restantes`,
          stock_actuel: product.stock_actuel,
          stock_minimum: product.stock_limite
        });
      } else if (product.statut_stock === 'faible') {
        alerts.push({
          id: `faible-${product.id}`,
          type: 'stock_faible',
          produit_id: product.id,
          produit_libelle: product.libelle_produit,
          niveau_alerte: 'warning',
          message: `Stock faible: ${product.stock_actuel} unités restantes`,
          stock_actuel: product.stock_actuel,
          stock_minimum: product.stock_limite
        });
      } else if (product.statut_stock === 'surstock') {
        alerts.push({
          id: `surstock-${product.id}`,
          type: 'surstock',
          produit_id: product.id,
          produit_libelle: product.libelle_produit,
          niveau_alerte: 'info',
          message: `Surstock détecté: ${product.stock_actuel} unités`,
          stock_actuel: product.stock_actuel,
          stock_maximum: product.stock_alerte
        });
      }
    });

    return alerts;
  };

  // Métriques calculées
  const metrics = {
    totalProducts: filteredAndSortedProducts.length,
    availableProducts: filteredAndSortedProducts.filter(p => p.stock_actuel > 0).length,
    lowStockProducts: filteredAndSortedProducts.filter(p => p.statut_stock === 'faible').length,
    outOfStockProducts: filteredAndSortedProducts.filter(p => p.statut_stock === 'rupture').length,
    criticalStockProducts: filteredAndSortedProducts.filter(p => p.statut_stock === 'critique').length,
    totalStockValue: filteredAndSortedProducts.reduce((sum, p) => sum + p.valeur_stock, 0),
    fastMovingProducts: filteredAndSortedProducts.filter(p => p.rotation === 'rapide').length,
    slowMovingProducts: filteredAndSortedProducts.filter(p => p.rotation === 'lente').length
  };

  const alerts = generateAlerts(filteredAndSortedProducts);

  useEffect(() => {
    fetchCurrentStock();
  }, []);

  return {
    products: paginatedProducts,
    allProductsCount: filteredAndSortedProducts.length,
    families,
    rayons,
    metrics,
    alerts,
    filters: {
      searchTerm,
      setSearchTerm,
      selectedFamily,
      setSelectedFamily,
      selectedRayon,
      setSelectedRayon,
      stockFilter,
      setStockFilter
    },
    sorting: {
      sortBy,
      setSortBy,
      sortOrder,
      setSortOrder
    },
    pagination: {
      currentPage,
      setCurrentPage,
      totalPages,
      itemsPerPage
    },
    loading,
    error,
    refetch: fetchCurrentStock,
  };
};