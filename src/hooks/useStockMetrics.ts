import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockMetrics {
  totalProduits: number;
  stockFaible: number;
  expirationProche: number;
  commandesEnCours: number;
  valeurStock: number;
  mouvementsRecents: number;
}

export const useStockMetrics = () => {
  const [metrics, setMetrics] = useState<StockMetrics>({
    totalProduits: 0,
    stockFaible: 0,
    expirationProche: 0,
    commandesEnCours: 0,
    valeurStock: 0,
    mouvementsRecents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStockMetrics = async () => {
    try {
      setLoading(true);
      
      // Get current user's tenant_id
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.tenant_id) throw new Error('Tenant non trouvé');

      const tenantId = personnel.tenant_id;

      // Exécuter toutes les requêtes en parallèle
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
        
        // Stock faible (produits avec stock < stock_limite)
        supabase
          .from('produits')
          .select(`
            id, stock_limite,
            lots(quantite_restante)
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
          .in('statut', ['En cours', 'Confirmé', 'Expédié']),

        // Valeur du stock
        supabase
          .from('lots')
          .select('quantite_restante, prix_achat_unitaire')
          .eq('tenant_id', tenantId)
          .gt('quantite_restante', 0),

        // Mouvements récents (7 derniers jours)
        supabase
          .from('stock_mouvements')
          .select('id')
          .eq('tenant_id', tenantId)
          .gte('date_mouvement', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Traitement des résultats
      const totalProduits = productsResult.status === 'fulfilled' ? (productsResult.value.data?.length || 0) : 0;
      
      let stockFaible = 0;
      if (lowStockResult.status === 'fulfilled' && lowStockResult.value.data) {
        stockFaible = lowStockResult.value.data.filter((product: any) => {
          const totalStock = product.lots?.reduce((sum: number, lot: any) => sum + lot.quantite_restante, 0) || 0;
          const effectiveThreshold = product.stock_limite || 10;
          
          // Calculer le statut comme dans useLowStockData
          let stockStatus: 'critique' | 'faible' | 'attention' | null = null;
          
          if (totalStock === 0) {
            stockStatus = 'critique';
          } else if (totalStock <= Math.floor(effectiveThreshold * 0.3)) {
            stockStatus = 'critique';
          } else if (totalStock <= effectiveThreshold) {
            stockStatus = 'faible';  // On veut compter seulement ceux-ci
          } else if (totalStock <= Math.floor(effectiveThreshold * 1.5)) {
            stockStatus = 'attention';
          }
          
          return stockStatus === 'faible';  // Compte SEULEMENT 'faible'
        }).length;
      }
      
      const expirationProche = expiringResult.status === 'fulfilled' ? (expiringResult.value.data?.length || 0) : 0;
      const commandesEnCours = ordersResult.status === 'fulfilled' ? (ordersResult.value.data?.length || 0) : 0;
      
      let valeurStock = 0;
      if (stockValueResult.status === 'fulfilled' && stockValueResult.value.data) {
        valeurStock = stockValueResult.value.data.reduce((sum: number, lot: any) => {
          return sum + (lot.quantite_restante * (lot.prix_achat_unitaire || 0));
        }, 0);
      }
      
      const mouvementsRecents = movementsResult.status === 'fulfilled' ? (movementsResult.value.data?.length || 0) : 0;

      setMetrics({
        totalProduits,
        stockFaible,
        expirationProche,
        commandesEnCours,
        valeurStock,
        mouvementsRecents,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des métriques';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockMetrics();
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch: fetchStockMetrics,
  };
};