/**
 * Types pour les rapports financiers
 */

// Types existants (déjà utilisés dans useFinancialReports)
export interface RegionalParams {
  id: string;
  tenant_id: string;
  pays: string;
  devise: string;
  systeme_comptable: string;
  format_nombre: string;
  separateur_milliers: string;
  separateur_decimal: string;
  mention_legale_footer: string;
  seuil_ratio_liquidite: number;
  seuil_ratio_endettement: number;
  seuil_ratio_autonomie: number;
  seuil_marge_exploitation: number;
  seuil_marge_nette: number;
  seuil_rentabilite_capitaux: number;
}

export interface Exercice {
  id: string;
  tenant_id: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  cloture_le?: string;
}

export interface BalanceSheetItem {
  libelle: string;
  montant_n: number;
  montant_n_1?: number;
  variation?: number;
  variation_percent?: number;
}

export interface BalanceSheet {
  actif: {
    immobilise: BalanceSheetItem[];
    circulant: BalanceSheetItem[];
    tresorerie: BalanceSheetItem[];
    total: number;
    total_n_1?: number;
  };
  passif: {
    capitauxPropres: BalanceSheetItem[];
    dettes: BalanceSheetItem[];
    total: number;
    total_n_1?: number;
  };
}

export interface IncomeStatementItem {
  libelle: string;
  montant_n: number;
  montant_n_1?: number;
  variation?: number;
  variation_percent?: number;
}

export interface IncomeStatement {
  produits: {
    exploitation: IncomeStatementItem[];
    financiers: IncomeStatementItem[];
    total: number;
    total_n_1?: number;
  };
  charges: {
    exploitation: IncomeStatementItem[];
    financiers: IncomeStatementItem[];
    total: number;
    total_n_1?: number;
  };
  resultatExploitation: number;
  resultatExploitation_n_1?: number;
  resultatFinancier: number;
  resultatFinancier_n_1?: number;
  resultatNet: number;
  resultatNet_n_1?: number;
}

// Nouveaux types pour les flux de trésorerie
export interface CashFlowItem {
  libelle: string;
  montant: number;
  details?: CashFlowItem[];
}

export interface CashFlowStatement {
  fluxExploitation: {
    resultatNet: number;
    dotationsAmortissements: number;
    variationBFR: number;
    autresAjustements: number;
    total: number;
    details: CashFlowItem[];
  };
  fluxInvestissement: {
    acquisitionsImmobilisations: number;
    cessionsImmobilisations: number;
    total: number;
    details: CashFlowItem[];
  };
  fluxFinancement: {
    empruntsObtenus: number;
    remboursementsEmprunts: number;
    dividendesVerses: number;
    total: number;
    details: CashFlowItem[];
  };
  variationTresorerie: number;
  tresorerieDebut: number;
  tresorerieFin: number;
}

// Nouveaux types pour les annexes
export interface AmortissementItem {
  immobilisation: string;
  valeurBrute: number;
  amortissementsCumules: number;
  valeurNette: number;
  dotationExercice: number;
  tauxAmortissement: number;
}

export interface CreanceClientItem {
  client: string;
  montantTotal: number;
  montantEchu: number;
  montantNonEchu: number;
  joursRetard: number;
  dateEmission: string;
  dateEcheance: string;
}

export interface DetteFournisseurItem {
  fournisseur: string;
  montantTotal: number;
  montantEchu: number;
  montantNonEchu: number;
  joursRetard: number;
  dateEmission: string;
  dateEcheance: string;
}

export interface FinancialAnnexes {
  amortissements: {
    items: AmortissementItem[];
    totalValeurBrute: number;
    totalAmortissements: number;
    totalValeurNette: number;
  };
  creancesClients: {
    items: CreanceClientItem[];
    totalCreances: number;
    totalEchu: number;
    totalNonEchu: number;
    tauxRecouvrement: number;
  };
  dettesFournisseurs: {
    items: DetteFournisseurItem[];
    totalDettes: number;
    totalEchu: number;
    totalNonEchu: number;
    delaiMoyenPaiement: number;
  };
}

export interface FinancialRatios {
  ratioLiquidite: number;
  ratioEndettement: number;
  ratioAutonomie: number;
  margeExploitation: number;
  margeNette: number;
  rentabiliteCapitaux: number;
}

// Types pour les graphiques
export interface AssetDistributionData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface ResultEvolutionData {
  periode: string;
  resultat_n: number;
  resultat_n_1: number;
}

export interface CashFlowChartData {
  mois: string;
  exploitation: number;
  investissement: number;
  financement: number;
}
