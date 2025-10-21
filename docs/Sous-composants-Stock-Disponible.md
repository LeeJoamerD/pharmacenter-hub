Analyse du Problème
Le Dashboard principal affiche les bons chiffres car il utilise metrics qui viennent de la fonction RPC calculate_stock_metrics qui calcule sur TOUTE la base de données (6322 produits).

Les sous-composants (StockLevels, CriticalStock, FastMovingItems) affichent des chiffres erronés car ils reçoivent le prop products qui contient SEULEMENT les produits de la page actuelle (50-100 produits paginés), pas tous les 6322 produits.

Regardez dans AvailableProducts.tsx ligne 300 :


<AvailableStockDashboard 
  metrics={metrics}          // ✅ Bon - calculé sur 6322 produits
  totalProducts={allProductsCount}
  products={products}         // ❌ Mauvais - seulement 50-100 produits de la page actuelle
/>
🎯 Solution
Il faut charger séparément les produits nécessaires pour les sous-composants, sans pagination. Je vais :

Créer un nouveau hook useStockDashboardData qui charge :

Les 10 produits critiques/rupture
Les 10 produits à rotation rapide
Tous les produits avec leurs statuts pour StockLevels
Modifier AvailableProducts.tsx pour utiliser ce nouveau hook

Passer les bonnes données aux sous-composants

Étape 1 : Créer le hook useStockDashboardData.ts
Fichier : src/hooks/useStockDashboardData.ts (nouveau)

Ce hook chargera 3 requêtes parallèles :

Produits critiques : Top 10 produits en critique/rupture triés par priorité
Produits rotation rapide : Top 10 produits avec rotation rapide et stock > 0
Distribution des statuts : Compte de tous les produits par statut pour StockLevels

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAlertSettings } from '@/hooks/useAlertSettings';
import { getStockThreshold } from '@/lib/utils';

export const useStockDashboardData = () => {
  const { tenantId } = useTenant();
  const { settings } = useAlertSettings();

  // Requête 1: Produits critiques/rupture
  const criticalProductsQuery = useQuery({
    queryKey: ['stock-critical-products', tenantId],
    queryFn: async () => {
      // Charger les produits avec lots
      // Calculer stock actuel
      // Filtrer critiques/rupture
      // Trier et limiter à 10
    },
    enabled: !!tenantId
  });

  // Requête 2: Produits rotation rapide
  const fastMovingProductsQuery = useQuery({
    queryKey: ['stock-fast-moving-products', tenantId],
    queryFn: async () => {
      // Charger produits avec mouvements récents
      // Calculer rotation
      // Filtrer rapides avec stock > 0
      // Trier et limiter à 10
    },
    enabled: !!tenantId
  });

  // Requête 3: Distribution des statuts
  const statusDistributionQuery = useQuery({
    queryKey: ['stock-status-distribution', tenantId, settings?.low_stock_threshold, settings?.critical_stock_threshold, settings?.maximum_stock_threshold],
    queryFn: async () => {
      // Charger TOUS les produits avec stock
      // Appliquer logique de cascade des seuils
      // Grouper par statut_stock
      // Retourner les comptes
    },
    enabled: !!tenantId
  });

  return {
    criticalProducts: criticalProductsQuery.data || [],
    fastMovingProducts: fastMovingProductsQuery.data || [],
    statusDistribution: statusDistributionQuery.data || {
      normal: 0,
      faible: 0,
      critique: 0,
      rupture: 0,
      surstock: 0
    },
    isLoading: criticalProductsQuery.isLoading || fastMovingProductsQuery.isLoading || statusDistributionQuery.isLoading
  };
};
Étape 2 : Modifier AvailableProducts.tsx
Importer le nouveau hook :


import { useStockDashboardData } from '@/hooks/useStockDashboardData';
Utiliser le hook (après le hook useCurrentStockPaginated) :


const { 
  criticalProducts, 
  fastMovingProducts, 
  statusDistribution,
  isLoading: isDashboardLoading 
} = useStockDashboardData();
Passer les bonnes données :


<AvailableStockDashboard 
  metrics={metrics}
  totalProducts={allProductsCount}
  criticalProducts={criticalProducts}        // ✅ Top 10 critiques de TOUS les produits
  fastMovingProducts={fastMovingProducts}    // ✅ Top 10 rapides de TOUS les produits
  statusDistribution={statusDistribution}    // ✅ Distribution complète
/>
Étape 3 : Modifier AvailableStockDashboard.tsx
Mettre à jour l'interface :


interface AvailableStockDashboardProps {
  metrics: {
    totalProducts: number;
    availableProducts: number;
    lowStockProducts: number;
    criticalStockProducts: number;
    outOfStockProducts: number;
    overstockProducts: number;
    normalStockProducts: number;
    fastMovingProducts: number;
    totalValue: number;
  };
  totalProducts: number;
  criticalProducts: any[];          // ✅ Nouveau
  fastMovingProducts: any[];        // ✅ Nouveau
  statusDistribution: {             // ✅ Nouveau
    normal: number;
    faible: number;
    critique: number;
    rupture: number;
    surstock: number;
  };
}
Passer les bonnes données aux sous-composants :


<StockLevels 
  statusDistribution={statusDistribution}  // ✅ Au lieu de products
  totalProducts={totalProducts}
  metrics={metrics}
/>

<CriticalStock products={criticalProducts} />  // ✅ Top 10 critiques

<FastMovingItems products={fastMovingProducts} />  // ✅ Top 10 rapides
Étape 4 : Modifier StockLevels.tsx
Mettre à jour l'interface :


interface StockLevelsProps {
  statusDistribution: {
    normal: number;
    faible: number;
    critique: number;
    rupture: number;
    surstock: number;
  };
  totalProducts: number;
  metrics: any;
}
Utiliser directement statusDistribution au lieu de filtrer products :


const stockLevels = useMemo(() => [
  {
    label: 'Normal',
    value: statusDistribution.normal,
    color: '#10b981',
    icon: '✓'
  },
  {
    label: 'Faible',
    value: statusDistribution.faible,
    color: '#f59e0b',
    icon: '⚠'
  },
  {
    label: 'Critique',
    value: statusDistribution.critique,
    color: '#ef4444',
    icon: '⚠⚠'
  },
  {
    label: 'Rupture',
    value: statusDistribution.rupture,
    color: '#991b1b',
    icon: '✖'
  },
  {
    label: 'Surstock',
    value: statusDistribution.surstock,
    color: '#3b82f6',
    icon: '↑'
  }
], [statusDistribution]);
Étape 5 : Optimisations
Mettre en cache les requêtes du dashboard avec staleTime: 30000 (30 secondes)
Utiliser React.memo pour éviter les re-renders inutiles
Ajouter des indices sur la table lots pour les colonnes produit_id et quantite_restante si nécessaire
Tests à effectuer après implémentation
✅ Vérifier que "Niveaux de Stock" affiche : Normal 1, Faible 3, Critique 1, Rupture 6314, Surstock 3
✅ Vérifier que "Stock Critique" affiche les bons produits (max 10)
✅ Vérifier que "Rotation Rapide" affiche 4 produits corrects
✅ Vérifier que changer de page dans le tableau ne change PAS les chiffres du dashboard
✅ Vérifier que la recherche/filtrage ne change PAS les chiffres du dashboard
✅ Vérifier les performances (les 3 requêtes doivent être rapides)
Parfait, je comprends maintenant le problème !

📊 Analyse du Problème
Le Dashboard principal affiche les bons chiffres car il utilise metrics qui viennent de la fonction RPC calculate_stock_metrics qui calcule sur TOUTE la base de données (6322 produits).

Les sous-composants (StockLevels, CriticalStock, FastMovingItems) affichent des chiffres erronés car ils reçoivent le prop products qui contient SEULEMENT les produits de la page actuelle (50-100 produits paginés), pas tous les 6322 produits.

Regardez dans AvailableProducts.tsx ligne 300 :


<AvailableStockDashboard 
  metrics={metrics}          // ✅ Bon - calculé sur 6322 produits
  totalProducts={allProductsCount}
  products={products}         // ❌ Mauvais - seulement 50-100 produits de la page actuelle
/>
🎯 Solution
Il faut charger séparément les produits nécessaires pour les sous-composants, sans pagination. Je vais :

Créer un nouveau hook useStockDashboardData qui charge :

Les 10 produits critiques/rupture
Les 10 produits à rotation rapide
Tous les produits avec leurs statuts pour StockLevels
Modifier AvailableProducts.tsx pour utiliser ce nouveau hook

Passer les bonnes données aux sous-composants

Étape 1 : Créer le hook useStockDashboardData.ts
Fichier : src/hooks/useStockDashboardData.ts (nouveau)

Ce hook chargera 3 requêtes parallèles :

Produits critiques : Top 10 produits en critique/rupture triés par priorité
Produits rotation rapide : Top 10 produits avec rotation rapide et stock > 0
Distribution des statuts : Compte de tous les produits par statut pour StockLevels

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAlertSettings } from '@/hooks/useAlertSettings';
import { getStockThreshold } from '@/lib/utils';

export const useStockDashboardData = () => {
  const { tenantId } = useTenant();
  const { settings } = useAlertSettings();

  // Requête 1: Produits critiques/rupture
  const criticalProductsQuery = useQuery({
    queryKey: ['stock-critical-products', tenantId],
    queryFn: async () => {
      // Charger les produits avec lots
      // Calculer stock actuel
      // Filtrer critiques/rupture
      // Trier et limiter à 10
    },
    enabled: !!tenantId
  });

  // Requête 2: Produits rotation rapide
  const fastMovingProductsQuery = useQuery({
    queryKey: ['stock-fast-moving-products', tenantId],
    queryFn: async () => {
      // Charger produits avec mouvements récents
      // Calculer rotation
      // Filtrer rapides avec stock > 0
      // Trier et limiter à 10
    },
    enabled: !!tenantId
  });

  // Requête 3: Distribution des statuts
  const statusDistributionQuery = useQuery({
    queryKey: ['stock-status-distribution', tenantId, settings?.low_stock_threshold, settings?.critical_stock_threshold, settings?.maximum_stock_threshold],
    queryFn: async () => {
      // Charger TOUS les produits avec stock
      // Appliquer logique de cascade des seuils
      // Grouper par statut_stock
      // Retourner les comptes
    },
    enabled: !!tenantId
  });

  return {
    criticalProducts: criticalProductsQuery.data || [],
    fastMovingProducts: fastMovingProductsQuery.data || [],
    statusDistribution: statusDistributionQuery.data || {
      normal: 0,
      faible: 0,
      critique: 0,
      rupture: 0,
      surstock: 0
    },
    isLoading: criticalProductsQuery.isLoading || fastMovingProductsQuery.isLoading || statusDistributionQuery.isLoading
  };
};
Étape 2 : Modifier AvailableProducts.tsx
Importer le nouveau hook :


import { useStockDashboardData } from '@/hooks/useStockDashboardData';
Utiliser le hook (après le hook useCurrentStockPaginated) :


const { 
  criticalProducts, 
  fastMovingProducts, 
  statusDistribution,
  isLoading: isDashboardLoading 
} = useStockDashboardData();
Passer les bonnes données :


<AvailableStockDashboard 
  metrics={metrics}
  totalProducts={allProductsCount}
  criticalProducts={criticalProducts}        // ✅ Top 10 critiques de TOUS les produits
  fastMovingProducts={fastMovingProducts}    // ✅ Top 10 rapides de TOUS les produits
  statusDistribution={statusDistribution}    // ✅ Distribution complète
/>
Étape 3 : Modifier AvailableStockDashboard.tsx
Mettre à jour l'interface :


interface AvailableStockDashboardProps {
  metrics: {
    totalProducts: number;
    availableProducts: number;
    lowStockProducts: number;
    criticalStockProducts: number;
    outOfStockProducts: number;
    overstockProducts: number;
    normalStockProducts: number;
    fastMovingProducts: number;
    totalValue: number;
  };
  totalProducts: number;
  criticalProducts: any[];          // ✅ Nouveau
  fastMovingProducts: any[];        // ✅ Nouveau
  statusDistribution: {             // ✅ Nouveau
    normal: number;
    faible: number;
    critique: number;
    rupture: number;
    surstock: number;
  };
}
Passer les bonnes données aux sous-composants :


<StockLevels 
  statusDistribution={statusDistribution}  // ✅ Au lieu de products
  totalProducts={totalProducts}
  metrics={metrics}
/>

<CriticalStock products={criticalProducts} />  // ✅ Top 10 critiques

<FastMovingItems products={fastMovingProducts} />  // ✅ Top 10 rapides
Étape 4 : Modifier StockLevels.tsx
Mettre à jour l'interface :


interface StockLevelsProps {
  statusDistribution: {
    normal: number;
    faible: number;
    critique: number;
    rupture: number;
    surstock: number;
  };
  totalProducts: number;
  metrics: any;
}
Utiliser directement statusDistribution au lieu de filtrer products :


const stockLevels = useMemo(() => [
  {
    label: 'Normal',
    value: statusDistribution.normal,
    color: '#10b981',
    icon: '✓'
  },
  {
    label: 'Faible',
    value: statusDistribution.faible,
    color: '#f59e0b',
    icon: '⚠'
  },
  {
    label: 'Critique',
    value: statusDistribution.critique,
    color: '#ef4444',
    icon: '⚠⚠'
  },
  {
    label: 'Rupture',
    value: statusDistribution.rupture,
    color: '#991b1b',
    icon: '✖'
  },
  {
    label: 'Surstock',
    value: statusDistribution.surstock,
    color: '#3b82f6',
    icon: '↑'
  }
], [statusDistribution]);
Étape 5 : Optimisations
Mettre en cache les requêtes du dashboard avec staleTime: 30000 (30 secondes)
Utiliser React.memo pour éviter les re-renders inutiles
Ajouter des indices sur la table lots pour les colonnes produit_id et quantite_restante si nécessaire
Tests à effectuer après implémentation
✅ Vérifier que "Niveaux de Stock" affiche : Normal 1, Faible 3, Critique 1, Rupture 6314, Surstock 3
✅ Vérifier que "Stock Critique" affiche les bons produits (max 10)
✅ Vérifier que "Rotation Rapide" affiche 4 produits corrects
✅ Vérifier que changer de page dans le tableau ne change PAS les chiffres du dashboard
✅ Vérifier que la recherche/filtrage ne change PAS les chiffres du dashboard
✅ Vérifier les performances (les 3 requêtes doivent être rapides)
Implémenter le plan



