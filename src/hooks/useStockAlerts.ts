import { useState, useEffect } from 'react';
import { useTenantQuery } from './useTenantQuery';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface StockAlert {
  id: string;
  tenant_id: string;
  type: 'stock_faible' | 'critique' | 'rupture' | 'peremption_proche' | 'expire';
  produit_id: string;
  produit_libelle: string;
  niveau_urgence: 'faible' | 'moyen' | 'eleve' | 'critique';
  message: string;
  quantite_actuelle: number;
  quantite_seuil?: number;
  jours_restants?: number;
  statut: 'active' | 'traitee' | 'ignoree';
  date_alerte: string;
  date_traitement?: string;
  traite_par?: string;
  actions_recommandees: string[];
  metadata?: Record<string, any>;
}

export interface AlertNotification {
  id: string;
  tenant_id: string;
  alert_id: string;
  type: 'email' | 'dashboard' | 'sms';
  recipient: string;
  sent_at: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
}

export const useStockAlerts = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  const { toast } = useToast();
  const [realtimeAlerts, setRealtimeAlerts] = useState<StockAlert[]>([]);

  // Récupérer les alertes actives
  const { 
    data: alerts = [], 
    isLoading: alertsLoading, 
    refetch: refetchAlerts 
  } = useTenantQueryWithCache(
    ['stock-alerts'],
    'alertes_peremption',
    `
      id, tenant_id, type_alerte, produit_id, niveau_urgence, 
      jours_restants, quantite_concernee, statut, date_alerte, 
      date_traitement, traite_par_id, actions_recommandees, notes,
      created_at, updated_at
    `,
    { statut: 'active' }
  );

  // Récupérer les produits pour enrichir les alertes
  const { data: products = [] } = useTenantQueryWithCache(
    ['products-for-alerts'],
    'produits',
    'id, libelle_produit, code_cip'
  );

  // Transform alerts to match interface
  useEffect(() => {
    const transformedAlerts: StockAlert[] = alerts.map(alert => ({
      id: alert.id,
      tenant_id: alert.tenant_id,
      type: alert.type_alerte as StockAlert['type'],
      produit_id: alert.produit_id,
      produit_libelle: products.find(p => p.id === alert.produit_id)?.libelle_produit || 'Produit inconnu',
      niveau_urgence: alert.niveau_urgence as StockAlert['niveau_urgence'],
      message: `Alerte ${alert.type_alerte}: ${alert.quantite_concernee || 0} unités concernées`,
      quantite_actuelle: alert.quantite_concernee || 0,
      jours_restants: alert.jours_restants,
      statut: alert.statut as StockAlert['statut'],
      date_alerte: alert.date_alerte || alert.created_at,
      date_traitement: alert.date_traitement,
      traite_par: alert.traite_par_id,
      actions_recommandees: alert.actions_recommandees || [],
      metadata: {}
    }));

    setRealtimeAlerts(transformedAlerts);
  }, [alerts, products]);

  // Real-time subscription for new alerts
  useEffect(() => {
    const channel = supabase
      .channel('stock-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alertes_peremption'
        },
        (payload) => {
          console.log('New alert received:', payload);
          refetchAlerts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alertes_peremption'
        },
        (payload) => {
          console.log('Alert updated:', payload);
          refetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchAlerts]);

  // Create and update functions using direct supabase calls
  const createAlert = async (alertData: {
    type: StockAlert['type'];
    produit_id: string;
    niveau_urgence: StockAlert['niveau_urgence'];
    quantite_concernee: number;
    jours_restants?: number;
    actions_recommandees: string[];
    notes?: string;
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel) throw new Error('Personnel non trouvé');

      // Get first available lot for the product (required by alertes_peremption table)
      const { data: lot } = await supabase
        .from('lots')
        .select('id')
        .eq('produit_id', alertData.produit_id)
        .eq('tenant_id', personnel.tenant_id)
        .limit(1)
        .single();

      const { error } = await supabase
        .from('alertes_peremption')
        .insert({
          lot_id: lot?.id || null,
          produit_id: alertData.produit_id,
          type_alerte: alertData.type,
          niveau_urgence: alertData.niveau_urgence,
          quantite_concernee: alertData.quantite_concernee,
          jours_restants: alertData.jours_restants,
          statut: 'active',
          date_alerte: new Date().toISOString(),
          actions_recommandees: alertData.actions_recommandees,
          notes: alertData.notes
        } as any);

      if (error) throw error;

      toast({
        title: "Alerte créée",
        description: "L'alerte de stock a été créée avec succès.",
      });

      refetchAlerts();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'alerte de stock.",
        variant: "destructive",
      });
      console.error('Error creating alert:', error);
      throw error;
    }
  };

  // Mark alert as treated
  const markAlertAsTreated = async (alertId: string, traitePar?: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('alertes_peremption')
        .update({
          statut: 'traitee',
          date_traitement: new Date().toISOString(),
          traite_par_id: traitePar,
          notes: notes
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alerte traitée",
        description: "L'alerte a été marquée comme traitée.",
      });

      refetchAlerts();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'alerte.",
        variant: "destructive",
      });
      console.error('Error treating alert:', error);
    }
  };

  // Mark alert as ignored
  const markAlertAsIgnored = async (alertId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('alertes_peremption')
        .update({
          statut: 'ignoree',
          date_traitement: new Date().toISOString(),
          notes: notes
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alerte ignorée",
        description: "L'alerte a été marquée comme ignorée.",
      });

      refetchAlerts();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ignorer l'alerte.",
        variant: "destructive",
      });
      console.error('Error ignoring alert:', error);
    }
  };

  // Get alert statistics
  const getAlertStats = () => {
    const active = realtimeAlerts.filter(a => a.statut === 'active');
    const critical = active.filter(a => a.niveau_urgence === 'critique');
    const high = active.filter(a => a.niveau_urgence === 'eleve');
    const medium = active.filter(a => a.niveau_urgence === 'moyen');
    const low = active.filter(a => a.niveau_urgence === 'faible');

    return {
      total: active.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
      byType: {
        stock_faible: active.filter(a => a.type === 'stock_faible').length,
        critique: active.filter(a => a.type === 'critique').length,
        rupture: active.filter(a => a.type === 'rupture').length,
        peremption_proche: active.filter(a => a.type === 'peremption_proche').length,
        expire: active.filter(a => a.type === 'expire').length
      }
    };
  };

  return {
    alerts: realtimeAlerts,
    isLoading: alertsLoading,
    stats: getAlertStats(),
    actions: {
      createAlert,
      markAlertAsTreated,
      markAlertAsIgnored,
      refetch: refetchAlerts
    },
    mutations: {
      isCreating: false,
      isUpdating: false
    }
  };
};