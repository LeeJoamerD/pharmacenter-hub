/**
 * Utilities for managing stock-related React Query cache
 */
import { QueryClient } from '@tanstack/react-query';

export class StockCacheManager {
  /**
   * Invalidate all stock-related queries
   */
  static invalidateAllStockQueries(queryClient: QueryClient) {
    queryClient.invalidateQueries({ queryKey: ['current-stock'] });
    queryClient.invalidateQueries({ queryKey: ['low-stock'] });
    queryClient.invalidateQueries({ queryKey: ['out-of-stock'] });
    queryClient.invalidateQueries({ queryKey: ['lots'] });
    queryClient.invalidateQueries({ queryKey: ['product-lots'] });
    queryClient.invalidateQueries({ queryKey: ['product-lots-cart'] });
    queryClient.invalidateQueries({ queryKey: ['stock-mouvements'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['produits'] });
  }

  /**
   * Invalidate queries for a specific product
   */
  static invalidateProductQueries(queryClient: QueryClient, productId: string) {
    queryClient.invalidateQueries({ queryKey: ['product-lots', productId] });
    queryClient.invalidateQueries({ queryKey: ['product-lots-cart', productId] });
    queryClient.invalidateQueries({ queryKey: ['product-details', productId] });
  }

  /**
   * Clear all stock cache completely
   */
  static clearAllStockCache(queryClient: QueryClient) {
    queryClient.removeQueries({ queryKey: ['current-stock'] });
    queryClient.removeQueries({ queryKey: ['low-stock'] });
    queryClient.removeQueries({ queryKey: ['out-of-stock'] });
    queryClient.removeQueries({ queryKey: ['lots'] });
    queryClient.removeQueries({ queryKey: ['product-lots'] });
    queryClient.removeQueries({ queryKey: ['stock-mouvements'] });
  }

  /**
   * Setup realtime listeners for stock updates
   */
  static setupRealtimeListeners(
    queryClient: QueryClient,
    tenantId: string,
    supabase: any
  ) {
    // Listen to lots changes
    const lotsChannel = supabase
      .channel('stock-lots-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lots',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          console.log('🔄 Lots updated, invalidating cache...');
          this.invalidateAllStockQueries(queryClient);
        }
      )
      .subscribe();

    // Listen to stock movements
    const movementsChannel = supabase
      .channel('stock-movements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_mouvements',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          console.log('🔄 Stock movements updated, invalidating cache...');
          this.invalidateAllStockQueries(queryClient);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(lotsChannel);
      supabase.removeChannel(movementsChannel);
    };
  }
}
