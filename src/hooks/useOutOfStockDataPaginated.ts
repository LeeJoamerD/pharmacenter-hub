import { useState, useEffect, useMemo } from 'react';
import { useTenantQuery } from './useTenantQuery';

export interface OutOfStockItem {
  id: string;
  code_cip: string;
  libelle_produit: string;
  famille: string;
  rayon: string;
  rotation: 'rapide' | 'normale' | 'lente';
  date_derniere_sortie?: string;
  prix_vente_ttc: number;
  prix_achat: number;
  stock_limite: number;
  stock_actuel: number;
  statut_stock: string;
}

export interface OutOfStockMetrics {
  totalItems: number;
  criticalItems: number;
  rapidRotationItems: number;
  recentOutOfStockItems: number;
  totalPotentialLoss: number;
}

interface UseOutOfStockDataPaginatedParams {
  search?: string;
  rotation?: string;
  urgency?: string;
  sortBy?: 'libelle_produit' | 'date_derniere_sortie' | 'rotation' | 'potential_loss' | 'days_out_of_stock';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const useOutOfStockDataPaginated = (params: UseOutOfStockDataPaginatedParams = {}) => {
  const {
    search = '',
    rotation = '',
    urgency = '',
    sortBy = 'date_derniere_sortie',
    sortOrder = 'desc',
    page = 1,
    limit = 50
  } = params;

  const { useTenantQueryWithCache } = useTenantQuery();

  // Récupération des données de base
  const { data: products = [], isLoading: productsLoading } = useTenantQueryWithCache(
    ['products'],
    'produits',
    `
      id,
      code_cip,
      libelle_produit,
      famille,
      rayon,
      prix_vente_ttc,
      prix_achat,
      stock_limite,
      stock_actuel,
      statut_stock,
      rotation,
      date_derniere_sortie
    `,
    { stock_actuel: 0 }, // Filtre pour les produits en rupture
    { orderBy: { column: 'date_derniere_sortie', ascending: false } }
  );

  // Calcul des métriques
  const metrics = useMemo((): OutOfStockMetrics => {
    const getDaysSinceLastStock = (lastExitDate: string | undefined) => {
      if (!lastExitDate) return null;
      return Math.floor((Date.now() - new Date(lastExitDate).getTime()) / (1000 * 60 * 60 * 24));
    };

    const getUrgencyLevel = (lastExitDate: string | undefined, rotation: string) => {
      const days = getDaysSinceLastStock(lastExitDate);
      if (!days) return 'unknown';
      
      if (rotation === 'rapide' && days > 3) return 'critical';
      if (rotation === 'normale' && days > 7) return 'high';
      if (days > 14) return 'medium';
      return 'low';
    };

    const criticalItems = products.filter(p => 
      getUrgencyLevel(p.date_derniere_sortie, p.rotation) === 'critical'
    ).length;

    const rapidRotationItems = products.filter(p => p.rotation === 'rapide').length;

    const recentOutOfStockItems = products.filter(p => {
      const days = getDaysSinceLastStock(p.date_derniere_sortie);
      return days && days <= 7;
    }).length;

    const totalPotentialLoss = products.reduce((sum, p) => 
      sum + (p.prix_vente_ttc * p.stock_limite), 0
    );

    return {
      totalItems: products.length,
      criticalItems,
      rapidRotationItems,
      recentOutOfStockItems,
      totalPotentialLoss
    };
  }, [products]);

  // Filtrage et tri des données
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...products];

    // Filtrage par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.libelle_produit.toLowerCase().includes(searchLower) ||
        item.code_cip.toLowerCase().includes(searchLower) ||
        item.famille.toLowerCase().includes(searchLower)
      );
    }

    // Filtrage par rotation
    if (rotation) {
      filtered = filtered.filter(item => item.rotation === rotation);
    }

    // Filtrage par urgence
    if (urgency) {
      const getDaysSinceLastStock = (lastExitDate: string | undefined) => {
        if (!lastExitDate) return null;
        return Math.floor((Date.now() - new Date(lastExitDate).getTime()) / (1000 * 60 * 60 * 24));
      };

      const getUrgencyLevel = (lastExitDate: string | undefined, rotation: string) => {
        const days = getDaysSinceLastStock(lastExitDate);
        if (!days) return 'unknown';
        
        if (rotation === 'rapide' && days > 3) return 'critical';
        if (rotation === 'normale' && days > 7) return 'high';
        if (days > 14) return 'medium';
        return 'low';
      };

      filtered = filtered.filter(item => getUrgencyLevel(item.date_derniere_sortie, item.rotation) === urgency);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'libelle_produit':
          aValue = a.libelle_produit.toLowerCase();
          bValue = b.libelle_produit.toLowerCase();
          break;
        case 'date_derniere_sortie':
          aValue = a.date_derniere_sortie ? new Date(a.date_derniere_sortie).getTime() : 0;
          bValue = b.date_derniere_sortie ? new Date(b.date_derniere_sortie).getTime() : 0;
          break;
        case 'rotation':
          const rotationPriority = { rapide: 3, normale: 2, lente: 1 };
          aValue = rotationPriority[a.rotation];
          bValue = rotationPriority[b.rotation];
          break;
        case 'potential_loss':
          aValue = a.prix_vente_ttc * a.stock_limite;
          bValue = b.prix_vente_ttc * b.stock_limite;
          break;
        case 'days_out_of_stock':
          const getDays = (date: string | undefined) => {
            if (!date) return 0;
            return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
          };
          aValue = getDays(a.date_derniere_sortie);
          bValue = getDays(b.date_derniere_sortie);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, search, rotation, urgency, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  // Fonction de rafraîchissement
  const refetch = () => {
    // Le cache sera invalidé automatiquement
  };

  return {
    outOfStockItems: paginatedData,
    allItemsCount: filteredAndSortedData.length,
    metrics,
    totalPages,
    currentPage: page,
    isLoading: productsLoading,
    refetch,
  };
};