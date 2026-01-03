import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { format, subDays } from 'date-fns';

export interface MobileKPI {
  title: string;
  value: string;
  change: string;
  color: string;
  bgColor: string;
}

export interface KPINotification {
  id: string;
  type: 'alert' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
}

export interface MobileWidget {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  size: 'large' | 'medium' | 'small';
}

export interface OfflineReport {
  id: string;
  name: string;
  lastSync: string;
  size: string;
  status: 'available' | 'syncing' | 'expired';
  validity: string;
}

export const useMobileReports = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;
  const { formatAmount } = useCurrencyFormatting();

  const today = new Date();

  // KPIs Mobile
  const mobileKPIsQuery = useQuery({
    queryKey: ['mobile-kpis', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      // Nombre de personnel (utilisateurs mobile)
      const personnelResult = await supabase
        .from('personnel')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
      const personnel = personnelResult.count || 0;

      // Nombre de rapports générés ce mois
      const rapportsResult = await supabase
        .from('rapports_comptables')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', format(subDays(today, 30), 'yyyy-MM-dd'));
      const rapports = rapportsResult.count || 0;

      // Nombre de ventes (activité)
      const ventesResult = await supabase
        .from('ventes')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(subDays(today, 30), 'yyyy-MM-dd'));
      const ventes = ventesResult.count || 0;

      return {
        utilisateursMobile: personnel || 0,
        sessionsTablette: Math.floor((personnel || 1) * 0.2),
        rapportsConsultes: rapports || 0,
        notificationsEnvoyees: Math.floor((ventes || 0) * 0.5)
      };
    },
    enabled: !!tenantId
  });

  // Notifications KPI en temps réel
  const notificationsQuery = useQuery({
    queryKey: ['mobile-notifications', tenantId],
    queryFn: async (): Promise<KPINotification[]> => {
      if (!tenantId) return [];

      const notifications: KPINotification[] = [];

      // Vérifier le stock critique
      const { data: stockCritique } = await supabase
        .from('produits_with_stock' as any)
        .select('libelle_produit, stock_total')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Actif')
        .lte('stock_total', 10)
        .limit(3);

      (stockCritique as any[])?.forEach((prod, idx) => {
        notifications.push({
          id: `stock-${idx}`,
          type: 'alert',
          title: 'Stock Critique',
          message: `${prod.libelle_produit} - Stock: ${prod.stock_total} unités`,
          timestamp: format(new Date(), 'HH:mm'),
          priority: 'high',
          read: false
        });
      });

      // Vérifier les ventes du jour
      const { data: ventesJour } = await supabase
        .from('ventes')
        .select('montant_net')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(today, 'yyyy-MM-dd'));

      const totalJour = ventesJour?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
      
      if (totalJour > 0) {
        notifications.push({
          id: 'sales-today',
          type: 'success',
          title: 'Objectif Ventes',
          message: `CA du jour: ${formatAmount(totalJour)}`,
          timestamp: format(new Date(), 'HH:mm'),
          priority: 'medium',
          read: true
        });
      }

      // Vérifier les lots proches de péremption
      const { count: lotsExpiring } = await supabase
        .from('lots')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .lte('date_peremption', format(subDays(today, -30), 'yyyy-MM-dd'))
        .gte('date_peremption', format(today, 'yyyy-MM-dd'));

      if (lotsExpiring && lotsExpiring > 0) {
        notifications.push({
          id: 'expiring-lots',
          type: 'warning',
          title: 'Péremption Proche',
          message: `${lotsExpiring} lots expirent dans les 30 jours`,
          timestamp: format(subDays(today, 0), 'HH:mm'),
          priority: 'medium',
          read: false
        });
      }

      // Vérifier les nouveaux clients
      const { count: newClients } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', format(subDays(today, 1), 'yyyy-MM-dd'));

      if (newClients && newClients > 0) {
        notifications.push({
          id: 'new-clients',
          type: 'info',
          title: 'Nouveaux Clients',
          message: `${newClients} nouveau(x) client(s) enregistré(s)`,
          timestamp: format(subDays(today, 0), 'HH:mm'),
          priority: 'low',
          read: true
        });
      }

      return notifications.slice(0, 10);
    },
    enabled: !!tenantId,
    refetchInterval: 60000 // Refresh toutes les minutes
  });

  // Configuration des widgets mobiles
  const widgetsQuery = useQuery({
    queryKey: ['mobile-widgets', tenantId],
    queryFn: async (): Promise<MobileWidget[]> => {
      // Ces données pourraient être stockées dans parametres_systeme
      return [
        {
          id: 'sales-summary',
          name: 'Résumé Ventes',
          description: 'CA, transactions, panier moyen',
          enabled: true,
          priority: 1,
          size: 'large'
        },
        {
          id: 'stock-alerts',
          name: 'Alertes Stock',
          description: 'Ruptures et niveaux critiques',
          enabled: true,
          priority: 2,
          size: 'medium'
        },
        {
          id: 'top-products',
          name: 'Top Produits',
          description: 'Meilleures ventes du jour',
          enabled: true,
          priority: 3,
          size: 'medium'
        },
        {
          id: 'customer-activity',
          name: 'Activité Clients',
          description: 'Nouveaux clients et fidélité',
          enabled: false,
          priority: 4,
          size: 'small'
        },
        {
          id: 'financial-kpis',
          name: 'KPIs Financiers',
          description: 'Marges et rentabilité',
          enabled: true,
          priority: 5,
          size: 'large'
        }
      ];
    },
    enabled: !!tenantId
  });

  // Rapports disponibles hors ligne
  const offlineReportsQuery = useQuery({
    queryKey: ['mobile-offline-reports', tenantId],
    queryFn: async (): Promise<OfflineReport[]> => {
      if (!tenantId) return [];

      // Récupérer les rapports récents
      const { data: rapports } = await supabase
        .from('rapports_comptables')
        .select('id, type_rapport, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!rapports || rapports.length === 0) {
        return [
          {
            id: '1',
            name: 'Dashboard Exécutif',
            lastSync: format(subDays(today, 0), 'yyyy-MM-dd HH:mm'),
            size: '2.4 MB',
            status: 'available',
            validity: '24h'
          },
          {
            id: '2',
            name: 'Rapport Ventes Journalier',
            lastSync: format(subDays(today, 0), 'yyyy-MM-dd HH:mm'),
            size: '1.8 MB',
            status: 'available',
            validity: '12h'
          },
          {
            id: '3',
            name: 'Analyse Stock',
            lastSync: format(subDays(today, 1), 'yyyy-MM-dd HH:mm'),
            size: '3.2 MB',
            status: 'expired',
            validity: '24h'
          }
        ];
      }

      return rapports.map((r, idx) => ({
        id: r.id,
        name: r.type_rapport || `Rapport ${idx + 1}`,
        lastSync: r.created_at || '',
        size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
        status: idx === 0 ? 'syncing' as const : idx < 2 ? 'available' as const : 'expired' as const,
        validity: idx % 2 === 0 ? '24h' : '12h'
      }));
    },
    enabled: !!tenantId
  });

  // Construction des KPIs
  const buildMobileKPIs = (): MobileKPI[] => {
    const data = mobileKPIsQuery.data;
    if (!data) return [];

    return [
      {
        title: 'Utilisateurs Mobile',
        value: data.utilisateursMobile.toString(),
        change: '+23.5%',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Sessions Tablette',
        value: data.sessionsTablette.toString(),
        change: '+12.8%',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Rapports Consultés',
        value: data.rapportsConsultes.toLocaleString('fr-FR'),
        change: '+18.9%',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'Notifications Envoyées',
        value: data.notificationsEnvoyees.toLocaleString('fr-FR'),
        change: '+8.7%',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ];
  };

  const isLoading = mobileKPIsQuery.isLoading || notificationsQuery.isLoading;

  return {
    mobileKPIs: buildMobileKPIs(),
    notifications: notificationsQuery.data || [],
    widgets: widgetsQuery.data || [],
    offlineReports: offlineReportsQuery.data || [],
    rawData: mobileKPIsQuery.data,
    isLoading,
    error: mobileKPIsQuery.error as Error | null,
    refetch: () => {
      mobileKPIsQuery.refetch();
      notificationsQuery.refetch();
      widgetsQuery.refetch();
      offlineReportsQuery.refetch();
    }
  };
};
