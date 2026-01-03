import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantQuery } from './useTenantQuery';
import type { 
  SalesPeriod, 
  SalesCategory, 
  SalesReportsData, 
  SalesKPI,
  EvolutionDataPoint,
  TopProduct,
  StaffPerformance,
  CategoryData
} from '@/types/salesReports';
import { getDateRangeForPeriod, formatDateForSQL, formatDateForDisplay } from '@/utils/dateRanges';
import { format, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Hook principal pour récupérer toutes les données des rapports de ventes
 */
export function useSalesReports(period: SalesPeriod, category: SalesCategory) {
  const { tenantId } = useTenant();
  const { useTenantQueryWithCache } = useTenantQuery();

  // Récupération des paramètres système pour les objectifs
  const { data: salesParams } = useTenantQueryWithCache(
    ['sales-params'],
    'parametres_systeme',
    'cle_parametre, valeur_parametre, type_parametre',
    { categorie: 'ventes' }
  );

  const objectifJournalier = salesParams?.find(p => p.cle_parametre === 'objectif_ventes_journalier')?.valeur_parametre || '3000000';

  // Requête principale pour toutes les données
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sales-reports', tenantId, period, category],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { current, previous } = getDateRangeForPeriod(period);
      
      // Construction du filtre de catégorie si nécessaire
      const categoryFilter = category !== 'all' ? getCategoryFilter(category) : null;

      // Récupération des ventes de la période courante
      let currentQuery = supabase
        .from('ventes')
        .select(`
          id,
          montant_net,
          date_vente,
          client_id,
          agent_id,
          statut,
          lignes_ventes(
            montant_ligne_ttc,
            quantite,
            produit_id,
            produits(
              id,
              libelle_produit,
              famille_produit(
                id,
                libelle_famille
              )
            )
          ),
          personnel!ventes_agent_id_fkey(
            id,
            noms,
            prenoms
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(current.startDate, 'yyyy-MM-dd'))
        .lte('date_vente', format(current.endDate, 'yyyy-MM-dd'));

      // Récupération des ventes de la période précédente
      let previousQuery = supabase
        .from('ventes')
        .select('id, montant_net, client_id')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(previous.startDate, 'yyyy-MM-dd'))
        .lte('date_vente', format(previous.endDate, 'yyyy-MM-dd'));

      const [currentResult, previousResult] = await Promise.all([
        currentQuery,
        previousQuery
      ]);

      if (currentResult.error) throw currentResult.error;
      if (previousResult.error) throw previousResult.error;

      let currentSales = currentResult.data || [];
      const previousSales = previousResult.data || [];

      // Filtrage par catégorie si nécessaire (côté client car les jointures complexes)
      if (categoryFilter && currentSales.length > 0) {
        currentSales = currentSales.filter(sale => {
          const hasMatchingCategory = sale.lignes_ventes?.some((ligne: any) => 
            ligne.produits?.famille_produit?.libelle_famille === categoryFilter
          );
          return hasMatchingCategory;
        });
      }

      // Calcul des KPIs
      const kpis = calculateKPIs(currentSales, previousSales);

      // Calcul des données d'évolution
      const evolutionData = calculateEvolutionData(currentSales, current, period, parseFloat(objectifJournalier));

      // Calcul du top produits
      const topProducts = calculateTopProducts(currentSales);

      // Calcul de la performance de l'équipe
      const staffPerformance = calculateStaffPerformance(currentSales, parseFloat(objectifJournalier));

      // Calcul de la répartition par catégories
      const categoryData = calculateCategoryData(currentSales);

      return {
        kpis,
        evolutionData,
        topProducts,
        staffPerformance,
        categoryData
      } as SalesReportsData;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (anciennement cacheTime)
  });

  return {
    data: data || getEmptyData(),
    isLoading,
    error,
    refetch
  };
}

/**
 * Mapping des catégories frontend vers la base de données
 */
function getCategoryFilter(category: SalesCategory): string | null {
  // Mapping vers les valeurs réelles de libelle_famille dans la base
  const mapping: Record<SalesCategory, string | null> = {
    'all': null,
    'medicines': 'Médicaments',
    'parapharmacy': 'Parapharmacie',
    'medical': 'Matériel médical'
  };
  return mapping[category];
}

/**
 * Calcul des KPIs avec variations
 */
function calculateKPIs(currentSales: any[], previousSales: any[]): SalesKPI {
  // Période courante
  const caAujourdhui = currentSales.reduce((sum, sale) => sum + (sale.montant_net || 0), 0);
  const transactions = currentSales.length;
  const clientsUniquesSet = new Set(currentSales.map(s => s.client_id).filter(Boolean));
  const clientsUniques = clientsUniquesSet.size;
  const panierMoyen = transactions > 0 ? caAujourdhui / transactions : 0;

  // Période précédente
  const caPrecedent = previousSales.reduce((sum, sale) => sum + (sale.montant_net || 0), 0);
  const transactionsPrecedentes = previousSales.length;
  const clientsUniquesPrecedentsSet = new Set(previousSales.map(s => s.client_id).filter(Boolean));
  const clientsUniquesPrecedents = clientsUniquesPrecedentsSet.size;
  const panierMoyenPrecedent = transactionsPrecedentes > 0 ? caPrecedent / transactionsPrecedentes : 0;

  // Calcul des variations
  const caVariation = calculatePercentageChange(caAujourdhui, caPrecedent);
  const transactionsVariation = calculatePercentageChange(transactions, transactionsPrecedentes);
  const panierMoyenVariation = calculatePercentageChange(panierMoyen, panierMoyenPrecedent);
  const clientsUniquesVariation = calculatePercentageChange(clientsUniques, clientsUniquesPrecedents);

  return {
    caAujourdhui,
    caVariation,
    transactions,
    transactionsVariation,
    panierMoyen,
    panierMoyenVariation,
    clientsUniques,
    clientsUniquesVariation
  };
}

/**
 * Calcul du pourcentage de variation
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calcul des données d'évolution quotidienne
 */
function calculateEvolutionData(
  sales: any[], 
  dateRange: { startDate: Date; endDate: Date }, 
  period: SalesPeriod,
  objectifJournalier: number
): EvolutionDataPoint[] {
  // Générer tous les jours de la période
  const days = eachDayOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate
  });

  // Grouper les ventes par jour
  const salesByDay = new Map<string, any[]>();
  sales.forEach(sale => {
    const day = format(new Date(sale.date_vente), 'yyyy-MM-dd');
    if (!salesByDay.has(day)) {
      salesByDay.set(day, []);
    }
    salesByDay.get(day)!.push(sale);
  });

  // Créer les points de données pour chaque jour
  return days.map(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const daySales = salesByDay.get(dayKey) || [];
    const ventes = daySales.reduce((sum, sale) => sum + (sale.montant_net || 0), 0);
    const transactions = daySales.length;

    return {
      date: formatDateForDisplay(day, period),
      ventes,
      objectif: objectifJournalier,
      transactions
    };
  }).slice(-7); // Garder seulement les 7 derniers jours
}

/**
 * Calcul du top 5 produits
 */
function calculateTopProducts(sales: any[]): TopProduct[] {
  const productMap = new Map<string, { ventes: number; quantite: number; marge: number }>();

  sales.forEach(sale => {
    sale.lignes_ventes?.forEach((ligne: any) => {
      const productName = ligne.produits?.libelle_produit || 'Produit inconnu';
      const existing = productMap.get(productName) || { ventes: 0, quantite: 0, marge: 0 };
      
      productMap.set(productName, {
        ventes: existing.ventes + (ligne.montant_ligne_ttc || 0),
        quantite: existing.quantite + (ligne.quantite || 0),
        marge: existing.marge // marge_beneficiaire n'existe pas, on garde la valeur existante
      });
    });
  });

  return Array.from(productMap.entries())
    .map(([produit, data]) => ({
      produit,
      ...data
    }))
    .sort((a, b) => b.ventes - a.ventes)
    .slice(0, 5);
}

/**
 * Calcul de la performance de l'équipe
 */
function calculateStaffPerformance(sales: any[], objectifJournalier: number): StaffPerformance[] {
  const staffMap = new Map<string, { ventes: number; transactions: number }>();

  sales.forEach(sale => {
    if (!sale.personnel) return;
    
    const agentName = `${sale.personnel.noms || ''} ${sale.personnel.prenoms || ''}`.trim() || 'Agent inconnu';
    const existing = staffMap.get(agentName) || { ventes: 0, transactions: 0 };
    
    staffMap.set(agentName, {
      ventes: existing.ventes + (sale.montant_net || 0),
      transactions: existing.transactions + 1
    });
  });

  return Array.from(staffMap.entries())
    .map(([nom, data]) => ({
      nom,
      ventes: data.ventes,
      transactions: data.transactions,
      moyenne: data.transactions > 0 ? data.ventes / data.transactions : 0,
      performance: objectifJournalier > 0 ? (data.ventes / objectifJournalier) * 100 : 0
    }))
    .sort((a, b) => b.ventes - a.ventes);
}

/**
 * Calcul de la répartition par catégories
 */
function calculateCategoryData(sales: any[]): CategoryData[] {
  const categoryMap = new Map<string, number>();
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  sales.forEach(sale => {
    sale.lignes_ventes?.forEach((ligne: any) => {
      const categoryName = ligne.produits?.famille_produit?.libelle_famille || 'Autres';
      const existing = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, existing + (ligne.montant_ligne_ttc || 0));
    });
  });

  const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

  return Array.from(categoryMap.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
      percentage: total > 0 ? (value / total) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Données vides pour l'initialisation
 */
function getEmptyData(): SalesReportsData {
  return {
    kpis: {
      caAujourdhui: 0,
      caVariation: 0,
      transactions: 0,
      transactionsVariation: 0,
      panierMoyen: 0,
      panierMoyenVariation: 0,
      clientsUniques: 0,
      clientsUniquesVariation: 0
    },
    evolutionData: [],
    topProducts: [],
    staffPerformance: [],
    categoryData: []
  };
}
