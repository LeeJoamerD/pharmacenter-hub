import { useState, useEffect } from 'react';
import { useTenantQuery } from './useTenantQuery';

export interface CurrentStockItem {
  id: string;
  tenant_id: string;
  libelle_produit: string;
  code_produit: string;
  famille_id?: string;
  famille_libelle?: string;
  rayon_id?: string;
  rayon_libelle?: string;
  prix_achat_ht: number;
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

export const useCurrentStock = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedRayon, setSelectedRayon] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'low' | 'out' | 'critical'>('all');

  // Produits avec stock actuel
  const { data: products = [], isLoading, refetch } = useTenantQueryWithCache(
    ['current-stock', searchTerm, selectedFamily, selectedRayon, stockFilter],
    'produits',
    `
      id, tenant_id, libelle_produit, code_cip, famille_id, rayon_id,
      prix_achat, prix_vente_ttc, stock_limite, stock_alerte,
      created_at, updated_at, is_active,
      famille_produit!inner(libelle_famille),
      rayons_produits!inner(libelle_rayon)
    `,
    { is_active: true }
  );

  // Familles de produits pour les filtres
  const { data: families = [] } = useTenantQueryWithCache(
    ['product-families'],
    'famille_produit',
    'id, libelle_famille'
  );

  // Rayons pour les filtres
  const { data: rayons = [] } = useTenantQueryWithCache(
    ['product-rayons'],
    'rayons_produits',
    'id, libelle_rayon'
  );

  // Transformation des données
  const processedProducts: CurrentStockItem[] = products.map((product: any) => {
    // Pour l'instant, stock_actuel vient des lots, pas de la table produits
    const currentStock = 0; // Sera calculé depuis les lots
    const stockValue = currentStock * (product.prix_achat || 0);
    
    let stockStatus: CurrentStockItem['statut_stock'] = 'normal';
    if (currentStock === 0) {
      stockStatus = 'rupture';
    } else if (currentStock <= (product.stock_limite || 0)) {
      stockStatus = currentStock <= (product.stock_limite || 0) * 0.5 ? 'critique' : 'faible';
    } else if (currentStock >= (product.stock_alerte || 100)) {
      stockStatus = 'surstock';
    }

    // Calcul de la rotation basé sur les mouvements récents (simplifié)
    let rotation: CurrentStockItem['rotation'] = 'normale';
    const daysSinceLastMovement = product.updated_at 
      ? Math.floor((Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysSinceLastMovement < 7) rotation = 'rapide';
    else if (daysSinceLastMovement > 30) rotation = 'lente';

    return {
      id: product.id,
      tenant_id: product.tenant_id,
      libelle_produit: product.libelle_produit,
      code_produit: product.code_cip || '',
      famille_id: product.famille_id,
      famille_libelle: product.famille_produit?.libelle_famille,
      rayon_id: product.rayon_id,
      rayon_libelle: product.rayons_produits?.libelle_rayon,
      prix_achat_ht: product.prix_achat || 0,
      prix_vente_ttc: product.prix_vente_ttc || 0,
      stock_actuel: currentStock,
      stock_limite: product.stock_limite || 0,
      stock_alerte: product.stock_alerte || 100,
      date_derniere_entree: product.created_at,
      date_derniere_sortie: product.updated_at,
      valeur_stock: stockValue,
      statut_stock: stockStatus,
      rotation
    };
  });

  // Filtrage des produits
  const filteredProducts = processedProducts.filter(product => {
    // Filtre par terme de recherche
    if (searchTerm && !product.libelle_produit.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !product.code_produit.toLowerCase().includes(searchTerm.toLowerCase())) {
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
    totalProducts: filteredProducts.length,
    availableProducts: filteredProducts.filter(p => p.stock_actuel > 0).length,
    lowStockProducts: filteredProducts.filter(p => p.statut_stock === 'faible').length,
    outOfStockProducts: filteredProducts.filter(p => p.statut_stock === 'rupture').length,
    criticalStockProducts: filteredProducts.filter(p => p.statut_stock === 'critique').length,
    totalStockValue: filteredProducts.reduce((sum, p) => sum + p.valeur_stock, 0),
    fastMovingProducts: filteredProducts.filter(p => p.rotation === 'rapide').length,
    slowMovingProducts: filteredProducts.filter(p => p.rotation === 'lente').length
  };

  const alerts = generateAlerts(filteredProducts);

  return {
    products: filteredProducts,
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
    isLoading,
    refetch
  };
};