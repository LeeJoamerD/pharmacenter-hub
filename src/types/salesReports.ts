/**
 * Types pour les rapports de ventes
 */

export type SalesPeriod = 'day' | 'week' | 'month' | 'quarter';
export type SalesCategory = 'all' | 'medicines' | 'parapharmacy' | 'medical';

export interface SalesKPI {
  caAujourdhui: number;
  caVariation: number;
  transactions: number;
  transactionsVariation: number;
  panierMoyen: number;
  panierMoyenVariation: number;
  clientsUniques: number;
  clientsUniquesVariation: number;
}

export interface EvolutionDataPoint {
  date: string;
  ventes: number;
  objectif: number;
  transactions: number;
}

export interface TopProduct {
  produit: string;
  ventes: number;
  quantite: number;
  marge: number;
}

export interface StaffPerformance {
  nom: string;
  ventes: number;
  transactions: number;
  moyenne: number;
  performance: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface SalesReportsData {
  kpis: SalesKPI;
  evolutionData: EvolutionDataPoint[];
  topProducts: TopProduct[];
  staffPerformance: StaffPerformance[];
  categoryData: CategoryData[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PeriodComparison {
  current: DateRange;
  previous: DateRange;
}
