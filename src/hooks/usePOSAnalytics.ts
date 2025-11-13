import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface POSMetrics {
  date: string;
  heure?: number;
  caisse_id?: string;
  agent_id?: string;
  nombre_transactions: number;
  montant_total_ventes: number;
  montant_moyen_transaction: number;
  panier_moyen_articles: number;
  ventes_especes: number;
  ventes_carte: number;
  ventes_mobile: number;
  ventes_assurance: number;
  nouveaux_clients: number;
  clients_fidelite: number;
  points_distribues: number;
  articles_vendus: number;
  retours: number;
}

export interface TopProduct {
  produit_id: string;
  libelle_produit: string;
  quantite_vendue: number;
  ca_genere: number;
}

export interface CashierPerformance {
  agent_id: string;
  agent_nom: string;
  nombre_transactions: number;
  montant_total: number;
  panier_moyen: number;
  temps_moyen_transaction: number;
}

/**
 * Hook pour les analytiques temps réel du Point de Vente
 * Enregistre et analyse les métriques de vente
 */
export const usePOSAnalytics = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // Enregistrer une transaction dans les analytiques
  const recordTransactionMutation = useMutation({
    mutationFn: async (transaction: {
      caisse_id: string;
      agent_id: string;
      montant: number;
      mode_paiement: string;
      nombre_articles: number;
      client_fidelite: boolean;
      points_distribues?: number;
    }) => {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const heure = now.getHours();

      // Récupérer ou créer la métrique horaire
      const { data: existing } = await supabase
        .from('analytiques_pos')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('date', date)
        .eq('heure', heure)
        .eq('caisse_id', transaction.caisse_id)
        .maybeSingle();

      const modeField = `ventes_${transaction.mode_paiement.toLowerCase().replace(' ', '_')}` as keyof POSMetrics;

      if (existing) {
        // Mettre à jour
        const newTotal = existing.nombre_transactions + 1;
        const newMontant = existing.montant_total_ventes + transaction.montant;
        
        const { error } = await supabase
          .from('analytiques_pos')
          .update({
            nombre_transactions: newTotal,
            montant_total_ventes: newMontant,
            montant_moyen_transaction: newMontant / newTotal,
            panier_moyen_articles: (existing.panier_moyen_articles * existing.nombre_transactions + transaction.nombre_articles) / newTotal,
            [modeField]: Number(existing[modeField] || 0) + transaction.montant,
            clients_fidelite: existing.clients_fidelite + (transaction.client_fidelite ? 1 : 0),
            points_distribues: existing.points_distribues + (transaction.points_distribues || 0),
            articles_vendus: existing.articles_vendus + transaction.nombre_articles,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Créer nouvelle entrée
        const { error } = await supabase
          .from('analytiques_pos')
          .insert({
            tenant_id: tenantId,
            date,
            heure,
            caisse_id: transaction.caisse_id,
            agent_id: transaction.agent_id,
            nombre_transactions: 1,
            montant_total_ventes: transaction.montant,
            montant_moyen_transaction: transaction.montant,
            panier_moyen_articles: transaction.nombre_articles,
            [modeField]: transaction.montant,
            clients_fidelite: transaction.client_fidelite ? 1 : 0,
            points_distribues: transaction.points_distribues || 0,
            articles_vendus: transaction.nombre_articles,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-analytics', tenantId] });
    },
  });

  // Métriques du dashboard temps réel
  const { data: dashboardMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['pos-dashboard', tenantId, new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('analytiques_pos')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('date', today);

      if (error) throw error;

      // Agréger les données
      const total_transactions = data.reduce((sum, m) => sum + m.nombre_transactions, 0);
      const total_ventes = data.reduce((sum, m) => sum + m.montant_total_ventes, 0);
      const total_especes = data.reduce((sum, m) => sum + m.ventes_especes, 0);
      const total_carte = data.reduce((sum, m) => sum + m.ventes_carte, 0);
      const total_mobile = data.reduce((sum, m) => sum + m.ventes_mobile, 0);
      const total_assurance = data.reduce((sum, m) => sum + m.ventes_assurance, 0);
      const total_articles = data.reduce((sum, m) => sum + m.articles_vendus, 0);

      return {
        total_transactions,
        total_ventes,
        panier_moyen: total_transactions > 0 ? total_ventes / total_transactions : 0,
        articles_moyen: total_transactions > 0 ? total_articles / total_transactions : 0,
        repartition_paiements: {
          especes: total_especes,
          carte: total_carte,
          mobile: total_mobile,
          assurance: total_assurance,
        },
      };
    },
    enabled: !!tenantId,
    refetchInterval: 30000, // Rafraîchir toutes les 30s
  });

  // Top produits vendus
  const { data: topProducts } = useQuery({
    queryKey: ['top-products', tenantId],
    queryFn: async () => {
      const today = new Date();
      const last30Days = new Date(today);
      last30Days.setDate(today.getDate() - 30);

      const { data, error } = await supabase
        .from('lignes_ventes')
        .select(`
          produit_id,
          quantite,
          montant_ligne_ttc,
          produit:produit_id(libelle_produit)
        `)
        .eq('tenant_id', tenantId)
        .gte('created_at', last30Days.toISOString())
        .order('quantite', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Agréger par produit
      const products = new Map<string, TopProduct>();
      
      data.forEach((ligne: any) => {
        const existing = products.get(ligne.produit_id);
        if (existing) {
          existing.quantite_vendue += ligne.quantite;
          existing.ca_genere += ligne.montant_ligne_ttc;
        } else {
          products.set(ligne.produit_id, {
            produit_id: ligne.produit_id,
            libelle_produit: ligne.produit?.libelle_produit || 'Inconnu',
            quantite_vendue: ligne.quantite,
            ca_genere: ligne.montant_ligne_ttc,
          });
        }
      });

      return Array.from(products.values())
        .sort((a, b) => b.ca_genere - a.ca_genere)
        .slice(0, 10);
    },
    enabled: !!tenantId,
  });

  // Performance par caissier
  const getCashierPerformance = async (period: { start: string; end: string }): Promise<CashierPerformance[]> => {
    const { data, error } = await supabase
      .from('analytiques_pos')
      .select(`
        agent_id,
        nombre_transactions,
        montant_total_ventes,
        montant_moyen_transaction,
        agent:agent_id(noms, prenoms)
      `)
      .eq('tenant_id', tenantId)
      .gte('date', period.start)
      .lte('date', period.end);

    if (error) throw error;

    // Agréger par agent
    const agents = new Map<string, CashierPerformance>();
    
    data.forEach((metric: any) => {
      const existing = agents.get(metric.agent_id);
      if (existing) {
        existing.nombre_transactions += metric.nombre_transactions;
        existing.montant_total += metric.montant_total_ventes;
      } else {
        agents.set(metric.agent_id, {
          agent_id: metric.agent_id,
          agent_nom: `${metric.agent?.noms} ${metric.agent?.prenoms}`,
          nombre_transactions: metric.nombre_transactions,
          montant_total: metric.montant_total_ventes,
          panier_moyen: 0,
          temps_moyen_transaction: 0,
        });
      }
    });

    // Calculer moyennes
    agents.forEach(agent => {
      agent.panier_moyen = agent.nombre_transactions > 0 ? agent.montant_total / agent.nombre_transactions : 0;
    });

    return Array.from(agents.values());
  };

  // Statistiques des modes de paiement
  const { data: paymentMethodStats } = useQuery({
    queryKey: ['payment-stats', tenantId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const { data, error } = await supabase
        .from('analytiques_pos')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('date', last7Days.toISOString().split('T')[0]);

      if (error) throw error;

      const total_especes = data.reduce((sum, m) => sum + m.ventes_especes, 0);
      const total_carte = data.reduce((sum, m) => sum + m.ventes_carte, 0);
      const total_mobile = data.reduce((sum, m) => sum + m.ventes_mobile, 0);
      const total_assurance = data.reduce((sum, m) => sum + m.ventes_assurance, 0);
      const total = total_especes + total_carte + total_mobile + total_assurance;

      return {
        especes: { montant: total_especes, pourcentage: total > 0 ? (total_especes / total) * 100 : 0 },
        carte: { montant: total_carte, pourcentage: total > 0 ? (total_carte / total) * 100 : 0 },
        mobile: { montant: total_mobile, pourcentage: total > 0 ? (total_mobile / total) * 100 : 0 },
        assurance: { montant: total_assurance, pourcentage: total > 0 ? (total_assurance / total) * 100 : 0 },
      };
    },
    enabled: !!tenantId,
  });

  // Analyse horaire des ventes
  const { data: hourlyAnalytics } = useQuery({
    queryKey: ['hourly-analytics', tenantId, new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('analytiques_pos')
        .select('heure, nombre_transactions, montant_total_ventes')
        .eq('tenant_id', tenantId)
        .eq('date', today)
        .order('heure', { ascending: true });

      if (error) throw error;

      // Créer un tableau avec toutes les heures (0-23)
      const hours = Array.from({ length: 24 }, (_, i) => ({
        heure: i,
        nombre_transactions: 0,
        montant_total_ventes: 0,
      }));

      // Remplir avec les données réelles
      data.forEach((metric: any) => {
        if (metric.heure !== null) {
          hours[metric.heure].nombre_transactions += metric.nombre_transactions;
          hours[metric.heure].montant_total_ventes += metric.montant_total_ventes;
        }
      });

      return hours;
    },
    enabled: !!tenantId,
  });

  return {
    recordTransaction: recordTransactionMutation.mutateAsync,
    dashboardMetrics,
    metricsLoading,
    topProducts,
    getCashierPerformance,
    paymentMethodStats,
    hourlyAnalytics,
  };
};
