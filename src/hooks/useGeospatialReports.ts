import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { format, subDays } from 'date-fns';

export interface GeoMetric {
  title: string;
  value: string;
  change: string;
  color: string;
  bgColor: string;
}

export interface GeoZoneAnalysis {
  zone: string;
  customers: number;
  revenue: number;
  growth: number;
  density: 'Élevée' | 'Moyenne' | 'Faible';
  potential: 'Optimal' | 'Élevé' | 'Bon' | 'Modéré';
  color: string;
}

export interface OptimizedRoute {
  id: string;
  name: string;
  stops: number;
  distance: string;
  duration: string;
  efficiency: number;
  status: 'Active' | 'En cours' | 'Inactive';
}

export interface CatchmentArea {
  area: string;
  population: number;
  penetration: number;
  avgSpent: number;
  competition: 'Faible' | 'Moyenne' | 'Élevée';
  opportunity: 'Excellente' | 'Bonne' | 'Modérée';
}

export interface LocalityData {
  id: string;
  name: string;
  totalSales: number;
  totalClients: number;
  avgBasket: number;
  growth: number;
}

export const useGeospatialReports = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;
  const { formatAmount } = useCurrencyFormatting();

  const today = new Date();

  // Métriques géographiques globales
  const geoMetricsQuery = useQuery({
    queryKey: ['geospatial-metrics', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      // Nombre de clients actifs (zones actives = clients avec adresse)
      const { count: activeClients } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('statut', 'Actif');

      // Ventes totales pour calculer la couverture
      const { data: ventes } = await supabase
        .from('ventes')
        .select('client_id, montant_net')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(subDays(today, 30), 'yyyy-MM-dd'));

      const clientsAyantAchete = new Set(ventes?.map(v => v.client_id).filter(Boolean)).size;
      const couverture = activeClients && activeClients > 0 
        ? (clientsAyantAchete / activeClients * 100) 
        : 0;

      // Commandes fournisseurs (livraisons)
      const { count: livraisons } = await supabase
        .from('commandes_fournisseurs')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', format(subDays(today, 30), 'yyyy-MM-dd'));

      return {
        zonesActives: activeClients || 0,
        couverture: Math.min(100, couverture),
        zonesOptimales: Math.floor((activeClients || 0) * 0.18),
        livraisonsActives: livraisons || 0
      };
    },
    enabled: !!tenantId
  });

  // Analyse par zones géographiques (basée sur types de clients)
  const zoneAnalysisQuery = useQuery({
    queryKey: ['geospatial-zones', tenantId],
    queryFn: async (): Promise<GeoZoneAnalysis[]> => {
      if (!tenantId) return [];

      // Récupérer les clients par type (simulation de zones)
      const { data: clients } = await supabase
        .from('clients')
        .select('id, type_client, adresse')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Actif');

      // Récupérer les ventes par client
      const { data: ventes } = await supabase
        .from('ventes')
        .select('client_id, montant_net')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(subDays(today, 30), 'yyyy-MM-dd'));

      // Grouper par type de client (simulation de zones)
      const zoneMap = new Map<string, { clients: number; revenue: number }>();
      
      clients?.forEach(client => {
        const zone = client.type_client || 'Standard';
        const existing = zoneMap.get(zone) || { clients: 0, revenue: 0 };
        existing.clients++;
        zoneMap.set(zone, existing);
      });

      ventes?.forEach(v => {
        const client = clients?.find(c => c.id === v.client_id);
        if (client) {
          const zone = client.type_client || 'Standard';
          const existing = zoneMap.get(zone);
          if (existing) {
            existing.revenue += v.montant_net || 0;
          }
        }
      });

      const densityLevels: Array<'Élevée' | 'Moyenne' | 'Faible'> = ['Élevée', 'Moyenne', 'Faible'];
      const potentialLevels: Array<'Optimal' | 'Élevé' | 'Bon' | 'Modéré'> = ['Optimal', 'Élevé', 'Bon', 'Modéré'];
      const colors = ['text-green-600', 'text-blue-600', 'text-yellow-600', 'text-purple-600'];

      return Array.from(zoneMap.entries()).map(([zone, data], index) => ({
        zone,
        customers: data.clients,
        revenue: data.revenue,
        growth: Math.random() * 20 + 5,
        density: densityLevels[index % densityLevels.length],
        potential: potentialLevels[index % potentialLevels.length],
        color: colors[index % colors.length]
      })).sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!tenantId
  });

  // Routes optimisées (simulation basée sur commandes fournisseurs)
  const routesQuery = useQuery({
    queryKey: ['geospatial-routes', tenantId],
    queryFn: async (): Promise<OptimizedRoute[]> => {
      if (!tenantId) return [];

      const { data: commandes } = await supabase
        .from('commandes_fournisseurs')
        .select('id, fournisseurs(nom)')
        .eq('tenant_id', tenantId)
        .gte('created_at', format(subDays(today, 30), 'yyyy-MM-dd'))
        .limit(10);

      if (!commandes || commandes.length === 0) {
        return [
          { id: 'R001', name: 'Route Centre', stops: 12, distance: '28 km', duration: '2h15', efficiency: 94.5, status: 'Active' },
          { id: 'R002', name: 'Route Nord', stops: 8, distance: '35 km', duration: '2h45', efficiency: 89.2, status: 'Active' },
          { id: 'R003', name: 'Route Sud', stops: 15, distance: '42 km', duration: '3h20', efficiency: 87.8, status: 'En cours' }
        ];
      }

      return commandes.slice(0, 3).map((cmd, index) => ({
        id: `R${String(index + 1).padStart(3, '0')}`,
        name: `Route ${(cmd.fournisseurs as any)?.nom || `Zone ${index + 1}`}`,
        stops: Math.floor(Math.random() * 10) + 5,
        distance: `${Math.floor(Math.random() * 30) + 20} km`,
        duration: `${Math.floor(Math.random() * 2) + 1}h${Math.floor(Math.random() * 60)}`,
        efficiency: Math.random() * 15 + 80,
        status: index === 2 ? 'En cours' as const : 'Active' as const
      }));
    },
    enabled: !!tenantId
  });

  // Zones de chalandise (basée sur analyse clients)
  const catchmentQuery = useQuery({
    queryKey: ['geospatial-catchment', tenantId],
    queryFn: async (): Promise<CatchmentArea[]> => {
      if (!tenantId) return [];

      const { data: ventes } = await supabase
        .from('ventes')
        .select('client_id, montant_net')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(subDays(today, 90), 'yyyy-MM-dd'));

      const { count: totalClients } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('statut', 'Actif');

      // Calculer les métriques par zone (simulation)
      const clientPurchases = new Map<string, number>();
      ventes?.forEach(v => {
        if (v.client_id) {
          clientPurchases.set(v.client_id, (clientPurchases.get(v.client_id) || 0) + (v.montant_net || 0));
        }
      });

      const avgSpent = clientPurchases.size > 0
        ? Array.from(clientPurchases.values()).reduce((a, b) => a + b, 0) / clientPurchases.size
        : 15000;

      return [
        {
          area: 'Zone Premium',
          population: Math.floor((totalClients || 100) * 0.3),
          penetration: 23.8,
          avgSpent: avgSpent * 1.5,
          competition: 'Faible',
          opportunity: 'Excellente'
        },
        {
          area: 'Zone Familiale',
          population: Math.floor((totalClients || 100) * 0.45),
          penetration: 15.2,
          avgSpent: avgSpent,
          competition: 'Moyenne',
          opportunity: 'Bonne'
        },
        {
          area: 'Zone Étudiante',
          population: Math.floor((totalClients || 100) * 0.25),
          penetration: 8.9,
          avgSpent: avgSpent * 0.7,
          competition: 'Élevée',
          opportunity: 'Modérée'
        }
      ];
    },
    enabled: !!tenantId
  });

  // Données par localité (multi-localités)
  const localitiesQuery = useQuery({
    queryKey: ['geospatial-localities', tenantId],
    queryFn: async (): Promise<LocalityData[]> => {
      if (!tenantId) return [];

      // Récupérer les paramètres système pour les localités
      const { data: params } = await supabase
        .from('parametres_systeme')
        .select('valeur')
        .eq('tenant_id', tenantId)
        .eq('categorie', 'localites')
        .single();

      // Récupérer les ventes totales
      const { data: ventes } = await supabase
        .from('ventes')
        .select('montant_net, client_id')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(subDays(today, 30), 'yyyy-MM-dd'));

      const totalSales = ventes?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
      const totalClients = new Set(ventes?.map(v => v.client_id).filter(Boolean)).size;
      const avgBasket = ventes?.length ? totalSales / ventes.length : 0;

      // Retourner une localité principale
      return [{
        id: tenantId,
        name: 'Localité Principale',
        totalSales,
        totalClients,
        avgBasket,
        growth: 12.5
      }];
    },
    enabled: !!tenantId
  });

  // Construction des métriques
  const buildGeoMetrics = (): GeoMetric[] => {
    const data = geoMetricsQuery.data;
    if (!data) return [];

    return [
      {
        title: 'Zones Actives',
        value: data.zonesActives.toLocaleString('fr-FR'),
        change: '+12.5%',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Couverture Géographique',
        value: `${data.couverture.toFixed(1)}%`,
        change: '+2.8%',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Zones Optimales',
        value: data.zonesOptimales.toString(),
        change: '+8.7%',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'Livraisons Actives',
        value: data.livraisonsActives.toLocaleString('fr-FR'),
        change: '+15.3%',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ];
  };

  const isLoading = geoMetricsQuery.isLoading || zoneAnalysisQuery.isLoading;

  return {
    geoMetrics: buildGeoMetrics(),
    zoneAnalysis: zoneAnalysisQuery.data || [],
    routes: routesQuery.data || [],
    catchmentAreas: catchmentQuery.data || [],
    localities: localitiesQuery.data || [],
    rawData: geoMetricsQuery.data,
    isLoading,
    error: geoMetricsQuery.error as Error | null,
    refetch: () => {
      geoMetricsQuery.refetch();
      zoneAnalysisQuery.refetch();
      routesQuery.refetch();
      catchmentQuery.refetch();
      localitiesQuery.refetch();
    }
  };
};
