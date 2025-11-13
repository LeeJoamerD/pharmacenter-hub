import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockMetrics {
  totalProduits: number;
  ruptures: number;
  stockCritique: number;
  stockFaible: number;
  expirationProche: number;
  commandesEnCours: number;
  valeurStock: number;
  mouvementsRecents: number;
}

export const useStockMetrics = () => {
  const [metrics, setMetrics] = useState<StockMetrics>({
    totalProduits: 0,
    ruptures: 0,
    stockCritique: 0,
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
          .from('produits_with_stock')
          .select('id')
          .eq('tenant_id', tenantId),
        
        // Stock faible (produits avec stock < stock_limite)
        supabase
          .from('produits_with_stock')
          .select(`
            id, stock_limite, stock_alerte, libelle_produit, stock_actuel,
            famille_id, rayon_id,
            famille_produit!fk_produits_famille_id(libelle_famille)
          `)
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
        
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
      
      let ruptures = 0;
      let stockCritique = 0;
      let stockFaible = 0;
      
      if (lowStockResult.status === 'fulfilled' && lowStockResult.value.data) {
        lowStockResult.value.data.forEach((product: any) => {
          const totalStock = product.stock_actuel || 0;
          const effectiveThreshold = product.stock_limite || 10;
          
          // Classification selon le modèle métier
          if (totalStock === 0) {
            ruptures++;  // Vraie rupture: stock = 0
          } else if (totalStock <= Math.floor(effectiveThreshold * 0.3)) {
            stockCritique++;  // Stock critique: 0 < stock <= 30% du seuil
          } else if (totalStock <= effectiveThreshold) {
            stockFaible++;  // Stock faible: 30% < stock <= 100% du seuil
          }
        });
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
        ruptures,
        stockCritique,
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