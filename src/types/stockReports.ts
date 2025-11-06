export interface StockKPI {
  valeurStockTotal: number;
  valeurStockVariation: number;
  produitsEnStock: number;
  referencesActives: number;
  alertesCritiques: number;
  ruptures: number;
  peremptions: number;
  tauxRotation: number;
  tauxRotationVariation: number;
}

export interface StockLevel {
  categorie: string;
  nb_produits: number;
  stock_actuel: number;
  stock_limite: number;
  stock_alerte: number;
  valorisation: number;
  statut: 'critique' | 'attention' | 'normal' | 'surstock';
  pourcentage: number;
}

export interface CriticalStockItem {
  produit_id: string;
  produit: string;
  stock_actuel: number;
  stock_limite: number;
  statut: 'critique' | 'attention';
  expiration: string | null;
  famille: string;
}

export interface ExpiryAlert {
  produit: string;
  lot: string;
  lot_id: string;
  quantite: number;
  expiration: string;
  jours_restants: number;
  urgence: 'urgent' | 'attention' | 'normal';
}

export interface MovementData {
  date: string;
  entrees: number;
  sorties: number;
  solde: number;
  valorisation: number;
}

export interface StockReportsData {
  kpis: StockKPI;
  stockLevels: StockLevel[];
  criticalStock: CriticalStockItem[];
  expiryAlerts: ExpiryAlert[];
  movementHistory: MovementData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export type StockReportPeriod = 'week' | 'month' | 'quarter';
export type StockReportCategory = 'all' | 'medicines' | 'parapharmacy' | 'medical';
