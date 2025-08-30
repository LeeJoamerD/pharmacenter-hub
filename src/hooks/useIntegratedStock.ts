import { useCallback, useEffect, useState } from 'react';
import { useStockSettings } from './useStockSettings';
import { useAlertThresholds } from './useAlertThresholds';
import { useCurrentStock } from './useCurrentStock';
import { StockNotificationService, StockNotification } from '@/services/stockNotificationService';
import { StockValuationService } from '@/services/stockValuationService';
import { StockUpdateService } from '@/services/stockUpdateService';

export interface IntegratedStockData {
  notifications: StockNotification[];
  reorderSuggestions: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    suggestedQuantity: number;
    category: string;
  }>;
  valuationSummary: {
    totalValue: number;
    productCount: number;
    avgRotation: number;
    methodUsed: string;
  };
}

export const useIntegratedStock = () => {
  const { settings, loading: settingsLoading } = useStockSettings();
  const { thresholds, loading: thresholdsLoading } = useAlertThresholds();
  const { products, isLoading: productsLoading, refetch } = useCurrentStock();
  
  const [integratedData, setIntegratedData] = useState<IntegratedStockData>({
    notifications: [],
    reorderSuggestions: [],
    valuationSummary: {
      totalValue: 0,
      productCount: 0,
      avgRotation: 0,
      methodUsed: 'FIFO'
    }
  });
  const [loading, setLoading] = useState(false);

  const generateIntegratedData = useCallback(async () => {
    if (!settings || !thresholds || settingsLoading || thresholdsLoading || productsLoading) {
      return;
    }

    setLoading(true);

    try {
      // Generate notifications
      const notifications = await StockNotificationService.generateNotifications(settings, thresholds);

      // Generate reorder suggestions
      const reorderSuggestions = [];
      for (const product of products) {
        if (product.statut_stock === 'faible' || product.statut_stock === 'critique') {
          try {
            const reorderPoint = await StockValuationService.calculateReorderPoint(product.id, settings);
            const suggestedQuantity = await StockValuationService.calculateOptimalOrderQuantity(product.id, settings);

            reorderSuggestions.push({
              productId: product.id,
              productName: product.libelle_produit,
              currentStock: product.stock_actuel,
              reorderPoint,
              suggestedQuantity,
              category: product.famille_libelle || 'Non classé'
            });
          } catch (error) {
            console.warn(`Error calculating reorder for product ${product.id}:`, error);
          }
        }
      }

      // Calculate valuation summary
      let totalValue = 0;
      let rotationSum = 0;

      for (const product of products) {
        totalValue += product.valeur_stock;
        
        // Convert rotation to numeric for averaging
        switch (product.rotation) {
          case 'rapide':
            rotationSum += 3;
            break;
          case 'normale':
            rotationSum += 2;
            break;
          case 'lente':
            rotationSum += 1;
            break;
        }
      }

      const valuationSummary = {
        totalValue,
        productCount: products.length,
        avgRotation: products.length > 0 ? rotationSum / products.length : 0,
        methodUsed: settings.valuation_method
      };

      setIntegratedData({
        notifications,
        reorderSuggestions,
        valuationSummary
      });

      // Send notifications if configured (would need alert settings here)
      // await StockNotificationService.sendNotifications(notifications, settings);
      
    } catch (error) {
      console.error('Error generating integrated stock data:', error);
    } finally {
      setLoading(false);
    }
  }, [settings, thresholds, products, settingsLoading, thresholdsLoading, productsLoading]);

  // Refresh data when dependencies change
  useEffect(() => {
    generateIntegratedData();
  }, [generateIntegratedData]);

  const recordMovementWithValidation = useCallback(async (movement: any) => {
    if (!settings) {
      throw new Error('Configuration stock non disponible');
    }

    // Validate movement
    const errors = await StockUpdateService.validateMovement(movement, settings);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // Record movement with settings
    await StockUpdateService.recordStockMovement(movement, settings);
    
    // Refresh data after movement
    await refetch();
    await generateIntegratedData();
  }, [settings, refetch, generateIntegratedData]);

  const calculateProductValuation = useCallback(async (productId: string) => {
    if (!settings) return null;

    try {
      return await StockValuationService.calculateValuation(productId, settings);
    } catch (error) {
      console.error('Error calculating product valuation:', error);
      return null;
    }
  }, [settings]);

  const getReorderRecommendation = useCallback(async (productId: string) => {
    if (!settings) return null;

    try {
      const reorderPoint = await StockValuationService.calculateReorderPoint(productId, settings);
      const optimalQuantity = await StockValuationService.calculateOptimalOrderQuantity(productId, settings);
      
      return {
        reorderPoint,
        optimalQuantity,
        method: settings.valuation_method
      };
    } catch (error) {
      console.error('Error calculating reorder recommendation:', error);
      return null;
    }
  }, [settings]);

  return {
    // Data
    integratedData,
    products,
    settings,
    thresholds,
    
    // State
    loading: loading || settingsLoading || thresholdsLoading || productsLoading,
    
    // Actions
    recordMovementWithValidation,
    calculateProductValuation,
    getReorderRecommendation,
    refreshData: generateIntegratedData,
    refetch
  };
};