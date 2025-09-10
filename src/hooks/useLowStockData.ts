import { useState, useEffect } from 'react';
import { useTenantQuery } from './useTenantQuery';
import { useAlertThresholds } from './useAlertThresholds';
import { StockUpdateService } from '@/services/stockUpdateService';
import { StockValuationService } from '@/services/stockValuationService';
import { useStockSettings } from './useStockSettings';

export interface LowStockItem {
  id: string;
  tenant_id: string;
  codeProduit: string;
  nomProduit: string;
  dci: string;
  quantiteActuelle: number;
  seuilMinimum: number;
  seuilOptimal: number;
  unite: string;
  categorie: string;
  fournisseurPrincipal: string;
  prixUnitaire: number;
  valeurStock: number;
  dernierMouvement: Date | null;
  statut: 'critique' | 'faible' | 'attention';
  famille_id: string;
  rayon_id: string;
  rotation: 'rapide' | 'normale' | 'lente';
  jours_sans_mouvement: number;
}

export interface LowStockMetrics {
  totalItems: number;
  criticalItems: number;
  lowItems: number;
  attentionItems: number;
  totalValue: number;
  averageRotation: number;
  urgentActions: number;
}

export const useLowStockData = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  const { thresholds } = useAlertThresholds();
  const { settings: stockSettings } = useStockSettings();
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [metrics, setMetrics] = useState<LowStockMetrics>({
    totalItems: 0,
    criticalItems: 0,
    lowItems: 0,
    attentionItems: 0,
    totalValue: 0,
    averageRotation: 0,
    urgentActions: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Récupérer tous les produits avec leurs relations
  const { data: products = [], isLoading, refetch } = useTenantQueryWithCache(
    ['products-for-low-stock'],
    'produits',
    `
      id, tenant_id, libelle_produit, code_cip, dci,
      prix_achat, prix_vente_ttc, stock_limite, stock_alerte,
      famille_id, rayon_id, created_at, updated_at, is_active,
      famille_produit!inner(libelle_famille),
      rayons_produits!inner(libelle_rayon)
    `,
    { is_active: true }
  );

  // Récupérer les fournisseurs principaux
  const { data: fournisseurs = [] } = useTenantQueryWithCache(
    ['fournisseurs-for-stock'],
    'fournisseurs',
    'id, libelle_fournisseur'
  );

  // Récupérer les catégories pour les filtres
  const { data: categories = [] } = useTenantQueryWithCache(
    ['categories-for-filters'],
    'famille_produit',
    'libelle_famille'
  );

  // Process products to determine low stock status
  useEffect(() => {
    const processLowStockData = async () => {
      if (!products || products.length === 0) {
        setLowStockItems([]);
        return;
      }

      const processedItems: LowStockItem[] = [];

      for (const product of products) {
        // Calculate current stock from lots
        const currentStock = await StockUpdateService.calculateAvailableStock(product.id);
        
        // Get category-specific threshold
        const categoryThreshold = thresholds?.find(t => 
          t.category === product.famille_produit?.libelle_famille && t.enabled
        );
        const effectiveThreshold = categoryThreshold?.threshold || product.stock_limite || 10;
        const optimalThreshold = product.stock_alerte || effectiveThreshold * 3;

        // Determine if this is a low stock item
        let stockStatus: 'critique' | 'faible' | 'attention' | null = null;
        
        if (currentStock === 0) {
          stockStatus = 'critique';
        } else if (currentStock <= Math.floor(effectiveThreshold * 0.3)) {
          stockStatus = 'critique';
        } else if (currentStock <= effectiveThreshold) {
          stockStatus = 'faible';
        } else if (currentStock <= Math.floor(effectiveThreshold * 1.5)) {
          stockStatus = 'attention';
        }

        // Only include items that are actually low in stock
        if (!stockStatus) continue;

        // Calculate stock value
        let stockValue = currentStock * (product.prix_achat || 0);
        if (stockSettings && currentStock > 0) {
          try {
            const valuation = await StockValuationService.calculateValuation(product.id, stockSettings);
            stockValue = valuation.totalValue;
          } catch (error) {
            console.warn('Valuation calculation failed:', error);
          }
        }

        // Calculate rotation and days without movement
        const daysSinceUpdate = product.updated_at 
          ? Math.floor((Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        let rotation: 'rapide' | 'normale' | 'lente' = 'normale';
        if (daysSinceUpdate < 7) rotation = 'rapide';
        else if (daysSinceUpdate > 30) rotation = 'lente';

        // Find principal supplier (simplified - could be enhanced)
        const principalSupplier = fournisseurs.length > 0 ? fournisseurs[0].libelle_fournisseur : 'Non défini';

        processedItems.push({
          id: product.id,
          tenant_id: product.tenant_id,
          codeProduit: product.code_cip || '',
          nomProduit: product.libelle_produit,
          dci: product.dci || '',
          quantiteActuelle: currentStock,
          seuilMinimum: effectiveThreshold,
          seuilOptimal: optimalThreshold,
          unite: 'unités', // Could be enhanced from product data
          categorie: product.famille_produit?.libelle_famille || 'Non catégorisé',
          fournisseurPrincipal: principalSupplier,
          prixUnitaire: product.prix_achat || 0,
          valeurStock: stockValue,
          dernierMouvement: product.updated_at ? new Date(product.updated_at) : null,
          statut: stockStatus,
          famille_id: product.famille_id,
          rayon_id: product.rayon_id,
          rotation,
          jours_sans_mouvement: daysSinceUpdate
        });
      }

      setLowStockItems(processedItems);
    };

    processLowStockData();
  }, [products, thresholds, stockSettings, fournisseurs]);

  // Calculate metrics
  useEffect(() => {
    const criticalItems = lowStockItems.filter(item => item.statut === 'critique').length;
    const lowItems = lowStockItems.filter(item => item.statut === 'faible').length;
    const attentionItems = lowStockItems.filter(item => item.statut === 'attention').length;
    const totalValue = lowStockItems.reduce((sum, item) => sum + item.valeurStock, 0);
    
    const rotationScores = lowStockItems.map(item => {
      switch (item.rotation) {
        case 'rapide': return 3;
        case 'normale': return 2;
        case 'lente': return 1;
        default: return 2;
      }
    });
    
    const averageRotation = rotationScores.length > 0 
      ? rotationScores.reduce((sum, score) => sum + score, 0) / rotationScores.length
      : 2;

    setMetrics({
      totalItems: lowStockItems.length,
      criticalItems,
      lowItems,
      attentionItems,
      totalValue,
      averageRotation,
      urgentActions: criticalItems + lowItems
    });
  }, [lowStockItems]);

  // Apply filters
  const filteredItems = lowStockItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.nomProduit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codeProduit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dci.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.categorie === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.statut === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return {
    lowStockItems: filteredItems,
    allItems: lowStockItems,
    metrics,
    categories,
    filters: {
      searchTerm,
      setSearchTerm,
      categoryFilter,
      setCategoryFilter,
      statusFilter,
      setStatusFilter
    },
    isLoading,
    refetch
  };
};