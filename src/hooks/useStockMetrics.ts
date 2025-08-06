import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockUpdateService } from '@/services/stockUpdateService';

export const useStockMetrics = () => {
  const [stockMetrics, setStockMetrics] = useState({
    totalProduits: 0,
    stockFaible: 0,
    expirationProche: 0,
    commandesEnCours: 0,
    valeurStock: 0,
    mouvementsJour: 0
  });
  const [loading, setLoading] = useState(true);

  const getCurrentTenantId = async (): Promise<string | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      return personnel?.tenant_id || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du tenant_id:', error);
      return null;
    }
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const tenantId = await getCurrentTenantId();
      if (!tenantId) return;

      // Charger les métriques réelles depuis la base de données
      const [
        productsResult,
        lowStockResult,
        expiringResult,
        ordersResult,
        stockValueResult,
        movementsResult
      ] = await Promise.allSettled([
        // Total produits
        supabase
          .from('produits')
          .select('id')
          .eq('tenant_id', tenantId),
        
        // Stock faible (produits avec stock < stock_minimal)
        supabase
          .from('produits')
          .select(`
            id, stock_minimal,
            lots!inner(quantite_restante)
          `)
          .eq('tenant_id', tenantId),
        
        // Produits expirant dans les 30 prochains jours
        supabase
          .from('lots')
          .select('id')
          .eq('tenant_id', tenantId)
          .gte('date_peremption', new Date().toISOString().split('T')[0])
          .lte('date_peremption', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        // Commandes en cours
        supabase
          .from('commandes_fournisseurs')
          .select('id')
          .eq('tenant_id', tenantId)
          .in('statut', ['En cours', 'Expédiée']),
        
        // Valeur du stock (simulation - calcul basé sur les lots)
        supabase
          .from('lots')
          .select('quantite_restante, prix_achat_unitaire')
          .eq('tenant_id', tenantId)
          .gt('quantite_restante', 0),
        
        // Mouvements du jour
        supabase
          .from('stock_mouvements')
          .select('id')
          .eq('tenant_id', tenantId)
          .gte('date_mouvement', new Date().toISOString().split('T')[0])
      ]);

      // Traitement des résultats
      const totalProduits = productsResult.status === 'fulfilled' ? (productsResult.value.data?.length || 0) : 0;
      
      let stockFaible = 0;
      if (lowStockResult.status === 'fulfilled' && lowStockResult.value.data) {
        stockFaible = lowStockResult.value.data.filter((product: any) => {
          const totalStock = product.lots?.reduce((sum: number, lot: any) => sum + lot.quantite_restante, 0) || 0;
          return totalStock <= (product.stock_minimal || 0);
        }).length;
      }
      
      const expirationProche = expiringResult.status === 'fulfilled' ? (expiringResult.value.data?.length || 0) : 0;
      const commandesEnCours = ordersResult.status === 'fulfilled' ? (ordersResult.value.data?.length || 0) : 0;
      
      let valeurStock = 0;
      if (stockValueResult.status === 'fulfilled' && stockValueResult.value.data) {
        valeurStock = stockValueResult.value.data.reduce((sum: number, lot: any) => {
          return sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || 0));
        }, 0);
      }
      
      const mouvementsJour = movementsResult.status === 'fulfilled' ? (movementsResult.value.data?.length || 0) : 0;

      setStockMetrics({
        totalProduits,
        stockFaible,
        expirationProche,
        commandesEnCours,
        valeurStock: Math.round(valeurStock),
        mouvementsJour
      });
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return { 
    ...stockMetrics, 
    loading,
    refresh: loadMetrics 
  };
};