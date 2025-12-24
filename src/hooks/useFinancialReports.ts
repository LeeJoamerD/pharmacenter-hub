import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrencyFormatting } from './useCurrencyFormatting';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Types
export interface RegionalParams {
  id: string;
  tenant_id: string;
  pays: string;
  code_pays: string;
  systeme_comptable: string;
  devise_principale: string;
  format_nombre: string;
  format_date: string;
  champ_identification_1: string;
  champ_identification_2: string;
  mention_legale_footer: string;
  mention_signature: string;
  seuil_ratio_liquidite: number;
  seuil_ratio_endettement: number;
  seuil_ratio_autonomie: number;
  seuil_marge_exploitation: number;
  seuil_marge_nette: number;
  seuil_rentabilite_capitaux: number;
  export_pdf_enabled: boolean;
  export_excel_enabled: boolean;
}

export interface Exercice {
  id: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  annee: number;
}

export interface BalanceSheetItem {
  code: string;
  libelle: string;
  montant_n: number;
  montant_n1?: number;
  variation?: number;
  variation_pct?: number;
}

export interface BalanceSheet {
  actif: {
    immobilise: BalanceSheetItem[];
    circulant: BalanceSheetItem[];
    tresorerie: BalanceSheetItem[];
    total: number;
    total_n1?: number;
  };
  passif: {
    capitauxPropres: BalanceSheetItem[];
    dettes: BalanceSheetItem[];
    total: number;
    total_n1?: number;
  };
}

export interface IncomeStatementItem {
  code: string;
  libelle: string;
  montant_n: number;
  montant_n1?: number;
  variation?: number;
  variation_pct?: number;
}

export interface IncomeStatement {
  produits: {
    exploitation: IncomeStatementItem[];
    financiers: IncomeStatementItem[];
    exceptionnels: IncomeStatementItem[];
    total: number;
  };
  charges: {
    exploitation: IncomeStatementItem[];
    financiers: IncomeStatementItem[];
    exceptionnels: IncomeStatementItem[];
    total: number;
  };
  resultatExploitation: number;
  resultatFinancier: number;
  resultatExceptionnel: number;
  resultatNet: number;
  centimeAdditionnel: number;
}

export interface CashFlowItem {
  libelle: string;
  montant: number;
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

export interface AmortissementItem {
  id: string;
  immobilisation: string;
  valeurBrute: number;
  amortissementsCumules: number;
  valeurNette: number;
  dotationExercice: number;
  tauxAmortissement: number;
  dateAcquisition?: string;
  dureeAmortissement?: number;
}

export interface ProvisionItem {
  id: string;
  libelle: string;
  type: string;
  montantDebut: number;
  dotation: number;
  reprise: number;
  montantFin: number;
}

export interface CreanceClientItem {
  id: string;
  client: string;
  numeroFacture: string;
  montantTotal: number;
  montantEchu: number;
  montantNonEchu: number;
  joursRetard: number;
  dateEmission: string;
  dateEcheance: string;
  tranche: 'non_echu' | '0_30' | '30_60' | '60_90' | 'plus_90';
}

export interface DetteFournisseurItem {
  id: string;
  fournisseur: string;
  reference: string;
  montantTotal: number;
  montantEchu: number;
  montantNonEchu: number;
  joursRetard: number;
  dateEmission: string;
  dateEcheance: string;
  tranche: 'non_echu' | '0_30' | '30_60' | '60_90' | 'plus_90';
}

export interface FinancialAnnexes {
  amortissements: {
    items: AmortissementItem[];
    totalValeurBrute: number;
    totalAmortissements: number;
    totalValeurNette: number;
    totalDotation: number;
  };
  provisions: {
    items: ProvisionItem[];
    totalDebut: number;
    totalDotations: number;
    totalReprises: number;
    totalFin: number;
  };
  creancesClients: {
    items: CreanceClientItem[];
    totalCreances: number;
    totalEchu: number;
    totalNonEchu: number;
    tauxRecouvrement: number;
    parTranche: {
      non_echu: number;
      '0_30': number;
      '30_60': number;
      '60_90': number;
      plus_90: number;
    };
  };
  dettesFournisseurs: {
    items: DetteFournisseurItem[];
    totalDettes: number;
    totalEchu: number;
    totalNonEchu: number;
    delaiMoyenPaiement: number;
    parTranche: {
      non_echu: number;
      '0_30': number;
      '30_60': number;
      '60_90': number;
      plus_90: number;
    };
  };
}

export interface FinancialRatios {
  ratioLiquidite: number;
  ratioEndettement: number;
  ratioAutonomie: number;
  margeExploitation: number;
  margeNette: number;
  rentabiliteCapitaux: number;
  seuilLiquidite: number;
  seuilEndettement: number;
  seuilAutonomie: number;
  seuilMargeExploitation: number;
  seuilMargeNette: number;
  seuilRentabilite: number;
}

export function useFinancialReports(selectedExerciceId?: string) {
  const { tenantId } = useTenant();
  const { formatAmount, getCurrencySymbol, isNoDecimalCurrency } = useCurrencyFormatting();
  const queryClient = useQueryClient();

  // Get regional parameters
  const { data: regionalParams, isLoading: isLoadingRegionalParams } = useQuery({
    queryKey: ['regional-params-reports', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('parametres_regionaux_rapports')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching regional params:', error);
        throw error;
      }

      // Return default params if not found
      if (!data) {
        return {
          id: '',
          tenant_id: tenantId,
          pays: 'Congo-Brazzaville',
          code_pays: 'CG',
          systeme_comptable: 'OHADA',
          devise_principale: 'XAF',
          format_nombre: 'space',
          format_date: 'DD/MM/YYYY',
          champ_identification_1: 'RCCM',
          champ_identification_2: 'NIU',
          mention_legale_footer: 'Document généré conformément au système comptable OHADA',
          mention_signature: 'Le Directeur Général / Le Commissaire aux Comptes',
          seuil_ratio_liquidite: 1.5,
          seuil_ratio_endettement: 60,
          seuil_ratio_autonomie: 40,
          seuil_marge_exploitation: 10,
          seuil_marge_nette: 5,
          seuil_rentabilite_capitaux: 15,
          export_pdf_enabled: true,
          export_excel_enabled: true,
        } as RegionalParams;
      }

      return data as RegionalParams;
    },
    enabled: !!tenantId,
  });

  // Get exercices
  const { data: exercices, isLoading: isLoadingExercices } = useQuery({
    queryKey: ['exercices-comptables', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('exercices_comptables')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date_debut', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(ex => ({
        id: ex.id,
        libelle: ex.libelle_exercice || `Exercice ${new Date(ex.date_debut).getFullYear()}`,
        date_debut: ex.date_debut,
        date_fin: ex.date_fin,
        statut: ex.statut,
        annee: new Date(ex.date_debut).getFullYear()
      })) as Exercice[];
    },
    enabled: !!tenantId,
  });

  // Get current exercice
  const currentExercice = exercices?.find(e => e.statut === 'Ouvert') || exercices?.[0];
  const activeExerciceId = selectedExerciceId || currentExercice?.id;

  // Get previous exercice for comparison
  const previousExercice = exercices?.find(e => {
    const current = exercices?.find(ex => ex.id === activeExerciceId);
    if (!current) return false;
    return e.annee === current.annee - 1;
  });

  // Generate Balance Sheet from lignes_ecriture
  const { data: balanceSheet, isLoading: isLoadingBalanceSheet } = useQuery({
    queryKey: ['balance-sheet', tenantId, activeExerciceId],
    queryFn: async () => {
      if (!tenantId || !activeExerciceId) return null;

      const exercice = exercices?.find(e => e.id === activeExerciceId);
      if (!exercice) return null;

      // Get all écritures for the period with their lines
      const { data: lignes, error } = await supabase
        .from('lignes_ecriture')
        .select(`
          *,
          ecriture:ecritures_comptables!inner(*),
          compte:plan_comptable(*)
        `)
        .eq('tenant_id', tenantId)
        .gte('ecriture.date_ecriture', exercice.date_debut)
        .lte('ecriture.date_ecriture', exercice.date_fin);

      if (error) throw error;

      // Group by compte and calculate balances
      const compteBalances = new Map<string, { compte: any; solde: number }>();
      
      (lignes || []).forEach((ligne: any) => {
        const compte = ligne.compte;
        if (!compte) return;
        
        const solde = (ligne.montant_debit || 0) - (ligne.montant_credit || 0);
        
        if (compteBalances.has(compte.numero_compte)) {
          compteBalances.get(compte.numero_compte)!.solde += solde;
        } else {
          compteBalances.set(compte.numero_compte, { compte, solde });
        }
      });

      // Build balance sheet structure
      const result: BalanceSheet = {
        actif: {
          immobilise: [],
          circulant: [],
          tresorerie: [],
          total: 0,
        },
        passif: {
          capitauxPropres: [],
          dettes: [],
          total: 0,
        },
      };

      compteBalances.forEach(({ compte, solde }) => {
        const numero = compte.numero_compte;
        const classe = numero.charAt(0);
        
        const item: BalanceSheetItem = {
          code: numero,
          libelle: compte.libelle_compte,
          montant_n: Math.abs(solde),
        };

        // OHADA classification
        if (classe === '2' && !numero.startsWith('28') && !numero.startsWith('29')) {
          // Immobilisations (hors amortissements et provisions)
          result.actif.immobilise.push(item);
          result.actif.total += solde > 0 ? solde : 0;
        } else if (numero.startsWith('28') || numero.startsWith('29')) {
          // Amortissements et provisions sur immobilisations (en déduction)
          const existingIndex = result.actif.immobilise.findIndex(i => i.code === `2${numero.substring(2)}`);
          if (existingIndex >= 0) {
            result.actif.immobilise[existingIndex].montant_n -= Math.abs(solde);
          }
        } else if (classe === '3') {
          // Stocks
          result.actif.circulant.push(item);
          result.actif.total += solde > 0 ? solde : 0;
        } else if (classe === '4' && (numero.startsWith('41') || numero.startsWith('42') || numero.startsWith('43') || numero.startsWith('44') || numero.startsWith('45') || numero.startsWith('46') || numero.startsWith('47') || numero.startsWith('48') || numero.startsWith('49'))) {
          // Créances (comptes 41x à 49x avec solde débiteur)
          if (solde > 0) {
            result.actif.circulant.push(item);
            result.actif.total += solde;
          } else {
            // Solde créditeur = dette
            item.montant_n = Math.abs(solde);
            result.passif.dettes.push(item);
            result.passif.total += Math.abs(solde);
          }
        } else if (classe === '4' && numero.startsWith('40')) {
          // Fournisseurs (dettes)
          item.montant_n = Math.abs(solde);
          result.passif.dettes.push(item);
          result.passif.total += Math.abs(solde);
        } else if (classe === '5') {
          // Trésorerie
          if (solde >= 0) {
            result.actif.tresorerie.push(item);
            result.actif.total += solde;
          } else {
            item.montant_n = Math.abs(solde);
            result.passif.dettes.push({ ...item, libelle: `${item.libelle} (Découvert)` });
            result.passif.total += Math.abs(solde);
          }
        } else if (classe === '1') {
          // Capitaux et dettes financières
          if (numero.startsWith('10') || numero.startsWith('11') || numero.startsWith('12') || numero.startsWith('13') || numero.startsWith('14') || numero.startsWith('15')) {
            // Capitaux propres
            item.montant_n = Math.abs(solde);
            result.passif.capitauxPropres.push(item);
            result.passif.total += Math.abs(solde);
          } else if (numero.startsWith('16') || numero.startsWith('17') || numero.startsWith('18') || numero.startsWith('19')) {
            // Dettes financières
            item.montant_n = Math.abs(solde);
            result.passif.dettes.push(item);
            result.passif.total += Math.abs(solde);
          }
        }
      });

      // Sort items by code
      result.actif.immobilise.sort((a, b) => a.code.localeCompare(b.code));
      result.actif.circulant.sort((a, b) => a.code.localeCompare(b.code));
      result.actif.tresorerie.sort((a, b) => a.code.localeCompare(b.code));
      result.passif.capitauxPropres.sort((a, b) => a.code.localeCompare(b.code));
      result.passif.dettes.sort((a, b) => a.code.localeCompare(b.code));

      return result;
    },
    enabled: !!tenantId && !!activeExerciceId && !!exercices,
  });

  // Generate Income Statement
  const { data: incomeStatement, isLoading: isLoadingIncomeStatement } = useQuery({
    queryKey: ['income-statement', tenantId, activeExerciceId],
    queryFn: async () => {
      if (!tenantId || !activeExerciceId) return null;

      const exercice = exercices?.find(e => e.id === activeExerciceId);
      if (!exercice) return null;

      // Get lignes_ecriture for the period
      const { data: lignes, error } = await supabase
        .from('lignes_ecriture')
        .select(`
          *,
          ecriture:ecritures_comptables!inner(*),
          compte:plan_comptable(*)
        `)
        .eq('tenant_id', tenantId)
        .gte('ecriture.date_ecriture', exercice.date_debut)
        .lte('ecriture.date_ecriture', exercice.date_fin);

      if (error) throw error;

      // Get Centime Additionnel from ventes
      const { data: ventes } = await supabase
        .from('ventes')
        .select('montant_centime_additionnel')
        .eq('tenant_id', tenantId)
        .gte('date_vente', exercice.date_debut)
        .lte('date_vente', exercice.date_fin);

      const totalCentimeAdditionnel = (ventes || []).reduce(
        (sum, v) => sum + (v.montant_centime_additionnel || 0), 
        0
      );

      const result: IncomeStatement = {
        produits: {
          exploitation: [],
          financiers: [],
          exceptionnels: [],
          total: 0,
        },
        charges: {
          exploitation: [],
          financiers: [],
          exceptionnels: [],
          total: 0,
        },
        resultatExploitation: 0,
        resultatFinancier: 0,
        resultatExceptionnel: 0,
        resultatNet: 0,
        centimeAdditionnel: totalCentimeAdditionnel,
      };

      // Group by compte
      const compteMap = new Map<string, { compte: any; montant: number }>();

      (lignes || []).forEach((ligne: any) => {
        const compte = ligne.compte;
        if (!compte) return;

        const classe = compte.numero_compte.charAt(0);
        if (classe !== '6' && classe !== '7' && classe !== '8') return;

        // Pour les charges (6), le montant est au débit
        // Pour les produits (7), le montant est au crédit
        const montant = classe === '6' 
          ? (ligne.montant_debit || 0) - (ligne.montant_credit || 0)
          : (ligne.montant_credit || 0) - (ligne.montant_debit || 0);
        
        if (compteMap.has(compte.numero_compte)) {
          compteMap.get(compte.numero_compte)!.montant += montant;
        } else {
          compteMap.set(compte.numero_compte, { compte, montant });
        }
      });

      // Process and classify
      compteMap.forEach(({ compte, montant }) => {
        const item: IncomeStatementItem = {
          code: compte.numero_compte,
          libelle: compte.libelle_compte,
          montant_n: Math.abs(montant),
        };

        const numero = compte.numero_compte;
        const classe = numero.charAt(0);

        if (classe === '7') {
          // Produits
          if (numero.startsWith('70') || numero.startsWith('71') || numero.startsWith('72') || 
              numero.startsWith('73') || numero.startsWith('74') || numero.startsWith('75')) {
            result.produits.exploitation.push(item);
          } else if (numero.startsWith('76') || numero.startsWith('77')) {
            result.produits.financiers.push(item);
          } else if (numero.startsWith('78') || numero.startsWith('79')) {
            result.produits.exceptionnels.push(item);
          }
          result.produits.total += Math.abs(montant);
        } else if (classe === '6') {
          // Charges
          if (numero.startsWith('60') || numero.startsWith('61') || numero.startsWith('62') || 
              numero.startsWith('63') || numero.startsWith('64') || numero.startsWith('65')) {
            result.charges.exploitation.push(item);
          } else if (numero.startsWith('66') || numero.startsWith('67')) {
            result.charges.financiers.push(item);
          } else if (numero.startsWith('68') || numero.startsWith('69')) {
            result.charges.exceptionnels.push(item);
          }
          result.charges.total += Math.abs(montant);
        } else if (classe === '8') {
          // Comptes HAO (Hors Activités Ordinaires)
          if (numero.startsWith('82') || numero.startsWith('84') || numero.startsWith('86') || numero.startsWith('88')) {
            result.produits.exceptionnels.push(item);
            result.produits.total += Math.abs(montant);
          } else if (numero.startsWith('81') || numero.startsWith('83') || numero.startsWith('85') || numero.startsWith('87') || numero.startsWith('89')) {
            result.charges.exceptionnels.push(item);
            result.charges.total += Math.abs(montant);
          }
        }
      });

      // Calculate results
      const chargesExploitation = result.charges.exploitation.reduce((sum, item) => sum + item.montant_n, 0);
      const produitsExploitation = result.produits.exploitation.reduce((sum, item) => sum + item.montant_n, 0);
      result.resultatExploitation = produitsExploitation - chargesExploitation;

      const chargesFinanciers = result.charges.financiers.reduce((sum, item) => sum + item.montant_n, 0);
      const produitsFinanciers = result.produits.financiers.reduce((sum, item) => sum + item.montant_n, 0);
      result.resultatFinancier = produitsFinanciers - chargesFinanciers;

      const chargesExceptionnels = result.charges.exceptionnels.reduce((sum, item) => sum + item.montant_n, 0);
      const produitsExceptionnels = result.produits.exceptionnels.reduce((sum, item) => sum + item.montant_n, 0);
      result.resultatExceptionnel = produitsExceptionnels - chargesExceptionnels;

      result.resultatNet = result.resultatExploitation + result.resultatFinancier + result.resultatExceptionnel;

      // Sort items by code
      result.produits.exploitation.sort((a, b) => a.code.localeCompare(b.code));
      result.produits.financiers.sort((a, b) => a.code.localeCompare(b.code));
      result.produits.exceptionnels.sort((a, b) => a.code.localeCompare(b.code));
      result.charges.exploitation.sort((a, b) => a.code.localeCompare(b.code));
      result.charges.financiers.sort((a, b) => a.code.localeCompare(b.code));
      result.charges.exceptionnels.sort((a, b) => a.code.localeCompare(b.code));

      return result;
    },
    enabled: !!tenantId && !!activeExerciceId && !!exercices,
  });

  // Generate Cash Flow Statement
  const { data: cashFlowStatement, isLoading: isLoadingCashFlow } = useQuery({
    queryKey: ['cash-flow', tenantId, activeExerciceId],
    queryFn: async () => {
      if (!tenantId || !activeExerciceId || !incomeStatement || !balanceSheet) return null;

      const exercice = exercices?.find(e => e.id === activeExerciceId);
      if (!exercice) return null;

      // Get amortissements (classe 68)
      const { data: amortData } = await supabase
        .from('lignes_ecriture')
        .select(`
          *,
          ecriture:ecritures_comptables!inner(*),
          compte:plan_comptable(*)
        `)
        .eq('tenant_id', tenantId)
        .gte('ecriture.date_ecriture', exercice.date_debut)
        .lte('ecriture.date_ecriture', exercice.date_fin);

      const dotationsAmortissements = (amortData || [])
        .filter((ligne: any) => ligne.compte?.numero_compte?.startsWith('681'))
        .reduce((sum: number, ligne: any) => sum + (ligne.montant_debit || 0), 0);

      // Variation BFR simplified
      const actifCirculant = balanceSheet.actif.circulant.reduce((sum, item) => sum + item.montant_n, 0);
      const dettesCT = balanceSheet.passif.dettes
        .filter(d => d.code.startsWith('4'))
        .reduce((sum, item) => sum + item.montant_n, 0);
      const bfr = actifCirculant - dettesCT;
      const variationBFR = -bfr * 0.05; // Estimation simplifiée

      // Flux d'exploitation
      const fluxExploitation = {
        resultatNet: incomeStatement.resultatNet,
        dotationsAmortissements,
        variationBFR,
        autresAjustements: 0,
        total: incomeStatement.resultatNet + dotationsAmortissements + variationBFR,
        details: [
          { libelle: 'Résultat net', montant: incomeStatement.resultatNet },
          { libelle: 'Dotations aux amortissements', montant: dotationsAmortissements },
          { libelle: 'Variation du BFR', montant: variationBFR },
        ],
      };

      // Flux d'investissement
      const acquisitionsImmobilisations = (amortData || [])
        .filter((ligne: any) => {
          const num = ligne.compte?.numero_compte;
          return num?.charAt(0) === '2' && !num?.startsWith('28') && !num?.startsWith('29') && ligne.montant_debit > 0;
        })
        .reduce((sum: number, ligne: any) => sum + (ligne.montant_debit || 0), 0);
      
      const cessionsImmobilisations = (amortData || [])
        .filter((ligne: any) => ligne.compte?.numero_compte?.startsWith('82'))
        .reduce((sum: number, ligne: any) => sum + (ligne.montant_credit || 0), 0);

      const fluxInvestissement = {
        acquisitionsImmobilisations: -acquisitionsImmobilisations,
        cessionsImmobilisations,
        total: cessionsImmobilisations - acquisitionsImmobilisations,
        details: [
          { libelle: 'Acquisitions d\'immobilisations', montant: -acquisitionsImmobilisations },
          { libelle: 'Cessions d\'immobilisations', montant: cessionsImmobilisations },
        ],
      };

      // Flux de financement
      const empruntsObtenus = (amortData || [])
        .filter((ligne: any) => ligne.compte?.numero_compte?.startsWith('16') && ligne.montant_credit > 0)
        .reduce((sum: number, ligne: any) => sum + (ligne.montant_credit || 0), 0);
      
      const remboursementsEmprunts = (amortData || [])
        .filter((ligne: any) => ligne.compte?.numero_compte?.startsWith('16') && ligne.montant_debit > 0)
        .reduce((sum: number, ligne: any) => sum + (ligne.montant_debit || 0), 0);

      const dividendesVerses = (amortData || [])
        .filter((ligne: any) => ligne.compte?.numero_compte?.startsWith('46'))
        .reduce((sum: number, ligne: any) => sum + (ligne.montant_debit || 0), 0);

      const fluxFinancement = {
        empruntsObtenus,
        remboursementsEmprunts: -remboursementsEmprunts,
        dividendesVerses: -dividendesVerses,
        total: empruntsObtenus - remboursementsEmprunts - dividendesVerses,
        details: [
          { libelle: 'Emprunts obtenus', montant: empruntsObtenus },
          { libelle: 'Remboursements d\'emprunts', montant: -remboursementsEmprunts },
          { libelle: 'Dividendes versés', montant: -dividendesVerses },
        ],
      };

      const tresorerie = balanceSheet.actif.tresorerie.reduce((sum, item) => sum + item.montant_n, 0);
      const variationTresorerie = fluxExploitation.total + fluxInvestissement.total + fluxFinancement.total;

      return {
        fluxExploitation,
        fluxInvestissement,
        fluxFinancement,
        variationTresorerie,
        tresorerieDebut: tresorerie - variationTresorerie,
        tresorerieFin: tresorerie,
      };
    },
    enabled: !!tenantId && !!activeExerciceId && !!incomeStatement && !!balanceSheet,
  });

  // Generate Financial Annexes
  const { data: financialAnnexes, isLoading: isLoadingAnnexes } = useQuery({
    queryKey: ['financial-annexes', tenantId, activeExerciceId],
    queryFn: async () => {
      if (!tenantId || !activeExerciceId) return null;

      const exercice = exercices?.find(e => e.id === activeExerciceId);
      if (!exercice) return null;

      // Get immobilisations
      const { data: immobilisationsData } = await supabase
        .from('immobilisations')
        .select('*')
        .eq('tenant_id', tenantId);

      const amortissementsItems: AmortissementItem[] = (immobilisationsData || []).map((immo: any) => {
        const valeurBrute = immo.valeur_acquisition || 0;
        const tauxAmort = immo.taux_amortissement || 20;
        const duree = immo.duree_amortissement || 5;
        const dateAcq = new Date(immo.date_acquisition || new Date());
        const anneesEcoulees = Math.min(
          (new Date().getFullYear() - dateAcq.getFullYear()),
          duree
        );
        const amortCumule = Math.min(valeurBrute * (tauxAmort / 100) * anneesEcoulees, valeurBrute);
        const dotation = valeurBrute * (tauxAmort / 100);

        return {
          id: immo.id,
          immobilisation: immo.designation || immo.libelle || '',
          valeurBrute,
          amortissementsCumules: amortCumule,
          valeurNette: valeurBrute - amortCumule,
          dotationExercice: dotation,
          tauxAmortissement: tauxAmort,
          dateAcquisition: immo.date_acquisition,
          dureeAmortissement: duree,
        };
      });

      // Get provisions (comptes 15x)
      const { data: provisionsData } = await supabase
        .from('lignes_ecriture')
        .select(`
          *,
          ecriture:ecritures_comptables!inner(*),
          compte:plan_comptable(*)
        `)
        .eq('tenant_id', tenantId)
        .gte('ecriture.date_ecriture', exercice.date_debut)
        .lte('ecriture.date_ecriture', exercice.date_fin);

      const provisionsMap = new Map<string, ProvisionItem>();
      (provisionsData || [])
        .filter((l: any) => l.compte?.numero_compte?.startsWith('15'))
        .forEach((ligne: any) => {
          const code = ligne.compte.numero_compte;
          if (!provisionsMap.has(code)) {
            provisionsMap.set(code, {
              id: code,
              libelle: ligne.compte.libelle_compte,
              type: 'provision',
              montantDebut: 0,
              dotation: 0,
              reprise: 0,
              montantFin: 0,
            });
          }
          const prov = provisionsMap.get(code)!;
          prov.dotation += ligne.montant_credit || 0;
          prov.reprise += ligne.montant_debit || 0;
          prov.montantFin = prov.montantDebut + prov.dotation - prov.reprise;
        });

      const provisionsItems = Array.from(provisionsMap.values());

      // Get créances clients from factures
      const { data: facturesClients } = await supabase
        .from('factures')
        .select(`
          *,
          client:clients(nom, prenom)
        `)
        .eq('tenant_id', tenantId)
        .eq('type', 'client')
        .in('statut', ['en_attente', 'partielle', 'en_retard']);

      const today = new Date();
      const creancesItems: CreanceClientItem[] = (facturesClients || []).map((f: any) => {
        const dateEcheance = new Date(f.date_echeance || f.date_facture);
        const joursRetard = Math.max(0, Math.floor((today.getTime() - dateEcheance.getTime()) / (1000 * 60 * 60 * 24)));
        const montantRestant = (f.montant_ttc || 0) - (f.montant_paye || 0);
        
        let tranche: CreanceClientItem['tranche'] = 'non_echu';
        if (joursRetard > 0 && joursRetard <= 30) tranche = '0_30';
        else if (joursRetard > 30 && joursRetard <= 60) tranche = '30_60';
        else if (joursRetard > 60 && joursRetard <= 90) tranche = '60_90';
        else if (joursRetard > 90) tranche = 'plus_90';

        return {
          id: f.id,
          client: f.client ? `${f.client.nom || ''} ${f.client.prenom || ''}`.trim() : 'Client inconnu',
          numeroFacture: f.numero_facture || '',
          montantTotal: f.montant_ttc || 0,
          montantEchu: joursRetard > 0 ? montantRestant : 0,
          montantNonEchu: joursRetard <= 0 ? montantRestant : 0,
          joursRetard,
          dateEmission: f.date_facture,
          dateEcheance: f.date_echeance || f.date_facture,
          tranche,
        };
      });

      // Get dettes fournisseurs
      const { data: dettesData } = await supabase
        .from('receptions_fournisseurs')
        .select('*, fournisseur:fournisseurs(nom)')
        .eq('tenant_id', tenantId) as any;

      const dettesItems: DetteFournisseurItem[] = (dettesData || []).map((d: any) => {
        const dateEcheance = new Date(d.date_echeance || d.date_reception);
        const joursRetard = Math.max(0, Math.floor((today.getTime() - dateEcheance.getTime()) / (1000 * 60 * 60 * 24)));
        const montantRestant = (d.montant_total_ttc || 0) - (d.montant_paye || 0);
        
        let tranche: DetteFournisseurItem['tranche'] = 'non_echu';
        if (joursRetard > 0 && joursRetard <= 30) tranche = '0_30';
        else if (joursRetard > 30 && joursRetard <= 60) tranche = '30_60';
        else if (joursRetard > 60 && joursRetard <= 90) tranche = '60_90';
        else if (joursRetard > 90) tranche = 'plus_90';

        return {
          id: d.id,
          fournisseur: d.fournisseur?.nom || 'Fournisseur inconnu',
          reference: d.numero_bl || d.numero_facture_fournisseur || '',
          montantTotal: d.montant_total_ttc || 0,
          montantEchu: joursRetard > 0 ? montantRestant : 0,
          montantNonEchu: joursRetard <= 0 ? montantRestant : 0,
          joursRetard,
          dateEmission: d.date_reception,
          dateEcheance: d.date_echeance || d.date_reception,
          tranche,
        };
      });

      // Calculate totals
      const totalValeurBrute = amortissementsItems.reduce((sum, i) => sum + i.valeurBrute, 0);
      const totalAmortissements = amortissementsItems.reduce((sum, i) => sum + i.amortissementsCumules, 0);
      const totalDotation = amortissementsItems.reduce((sum, i) => sum + i.dotationExercice, 0);

      const totalCreances = creancesItems.reduce((sum, i) => sum + i.montantTotal, 0);
      const totalCreancesEchu = creancesItems.reduce((sum, i) => sum + i.montantEchu, 0);
      const totalCreancesNonEchu = creancesItems.reduce((sum, i) => sum + i.montantNonEchu, 0);

      const totalDettes = dettesItems.reduce((sum, i) => sum + i.montantTotal, 0);
      const totalDettesEchu = dettesItems.reduce((sum, i) => sum + i.montantEchu, 0);
      const totalDettesNonEchu = dettesItems.reduce((sum, i) => sum + i.montantNonEchu, 0);

      // Par tranche
      const creancesParTranche = {
        non_echu: creancesItems.filter(c => c.tranche === 'non_echu').reduce((s, c) => s + c.montantTotal - c.montantEchu, 0),
        '0_30': creancesItems.filter(c => c.tranche === '0_30').reduce((s, c) => s + c.montantEchu, 0),
        '30_60': creancesItems.filter(c => c.tranche === '30_60').reduce((s, c) => s + c.montantEchu, 0),
        '60_90': creancesItems.filter(c => c.tranche === '60_90').reduce((s, c) => s + c.montantEchu, 0),
        plus_90: creancesItems.filter(c => c.tranche === 'plus_90').reduce((s, c) => s + c.montantEchu, 0),
      };

      const dettesParTranche = {
        non_echu: dettesItems.filter(d => d.tranche === 'non_echu').reduce((s, d) => s + d.montantTotal - d.montantEchu, 0),
        '0_30': dettesItems.filter(d => d.tranche === '0_30').reduce((s, d) => s + d.montantEchu, 0),
        '30_60': dettesItems.filter(d => d.tranche === '30_60').reduce((s, d) => s + d.montantEchu, 0),
        '60_90': dettesItems.filter(d => d.tranche === '60_90').reduce((s, d) => s + d.montantEchu, 0),
        plus_90: dettesItems.filter(d => d.tranche === 'plus_90').reduce((s, d) => s + d.montantEchu, 0),
      };

      return {
        amortissements: {
          items: amortissementsItems,
          totalValeurBrute,
          totalAmortissements,
          totalValeurNette: totalValeurBrute - totalAmortissements,
          totalDotation,
        },
        provisions: {
          items: provisionsItems,
          totalDebut: provisionsItems.reduce((s, p) => s + p.montantDebut, 0),
          totalDotations: provisionsItems.reduce((s, p) => s + p.dotation, 0),
          totalReprises: provisionsItems.reduce((s, p) => s + p.reprise, 0),
          totalFin: provisionsItems.reduce((s, p) => s + p.montantFin, 0),
        },
        creancesClients: {
          items: creancesItems,
          totalCreances,
          totalEchu: totalCreancesEchu,
          totalNonEchu: totalCreancesNonEchu,
          tauxRecouvrement: totalCreances > 0 ? ((totalCreances - totalCreancesEchu) / totalCreances) * 100 : 100,
          parTranche: creancesParTranche,
        },
        dettesFournisseurs: {
          items: dettesItems,
          totalDettes,
          totalEchu: totalDettesEchu,
          totalNonEchu: totalDettesNonEchu,
          delaiMoyenPaiement: dettesItems.length > 0 
            ? dettesItems.reduce((sum, d) => sum + d.joursRetard, 0) / dettesItems.length 
            : 0,
          parTranche: dettesParTranche,
        },
      };
    },
    enabled: !!tenantId && !!activeExerciceId && !!exercices,
  });

  // Calculate Financial Ratios
  const financialRatios: FinancialRatios | null = (() => {
    if (!balanceSheet || !incomeStatement || !regionalParams) return null;

    const actifCirculant = balanceSheet.actif.circulant.reduce((sum, item) => sum + item.montant_n, 0) +
                          balanceSheet.actif.tresorerie.reduce((sum, item) => sum + item.montant_n, 0);
    const dettesCT = balanceSheet.passif.dettes
      .filter(d => d.code.startsWith('4'))
      .reduce((sum, item) => sum + item.montant_n, 0);
    
    const totalDettes = balanceSheet.passif.dettes.reduce((sum, item) => sum + item.montant_n, 0);
    const totalPassif = balanceSheet.passif.total;
    const capitauxPropres = balanceSheet.passif.capitauxPropres.reduce((sum, item) => sum + item.montant_n, 0);

    const chiffreAffaires = incomeStatement.produits.exploitation
      .filter(p => p.code.startsWith('70'))
      .reduce((sum, item) => sum + item.montant_n, 0);

    return {
      ratioLiquidite: dettesCT > 0 ? actifCirculant / dettesCT : 0,
      ratioEndettement: totalPassif > 0 ? (totalDettes / totalPassif) * 100 : 0,
      ratioAutonomie: totalPassif > 0 ? (capitauxPropres / totalPassif) * 100 : 0,
      margeExploitation: chiffreAffaires > 0 ? (incomeStatement.resultatExploitation / chiffreAffaires) * 100 : 0,
      margeNette: chiffreAffaires > 0 ? (incomeStatement.resultatNet / chiffreAffaires) * 100 : 0,
      rentabiliteCapitaux: capitauxPropres > 0 ? (incomeStatement.resultatNet / capitauxPropres) * 100 : 0,
      seuilLiquidite: regionalParams.seuil_ratio_liquidite || 1.5,
      seuilEndettement: regionalParams.seuil_ratio_endettement || 60,
      seuilAutonomie: regionalParams.seuil_ratio_autonomie || 40,
      seuilMargeExploitation: regionalParams.seuil_marge_exploitation || 10,
      seuilMargeNette: regionalParams.seuil_marge_nette || 5,
      seuilRentabilite: regionalParams.seuil_rentabilite_capitaux || 15,
    };
  })();

  // Export Balance Sheet to PDF
  const exportBalanceSheetPDF = async () => {
    if (!balanceSheet || !regionalParams || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const doc = new jsPDF();
    const currency = getCurrencySymbol();
    
    // Header
    doc.setFontSize(16);
    doc.text(regionalParams.pays.toUpperCase(), 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`BILAN ${regionalParams.systeme_comptable}`, 105, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Exercice: ${currentExercice.libelle}`, 105, 32, { align: 'center' });

    // Actif table
    doc.text('ACTIF', 14, 45);
    const actifData = [
      ['', 'ACTIF IMMOBILISE', formatAmount(balanceSheet.actif.immobilise.reduce((s, i) => s + i.montant_n, 0))],
      ...balanceSheet.actif.immobilise.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ['', 'ACTIF CIRCULANT', formatAmount(balanceSheet.actif.circulant.reduce((s, i) => s + i.montant_n, 0))],
      ...balanceSheet.actif.circulant.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ['', 'TRESORERIE-ACTIF', formatAmount(balanceSheet.actif.tresorerie.reduce((s, i) => s + i.montant_n, 0))],
      ...balanceSheet.actif.tresorerie.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ['', 'TOTAL ACTIF', formatAmount(balanceSheet.actif.total)],
    ];

    (doc as any).autoTable({
      startY: 50,
      head: [['Code', 'Libellé', `Montant (${currency})`]],
      body: actifData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Passif table on new page if needed
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    if (finalY > 200) doc.addPage();
    
    doc.text('PASSIF', 14, finalY > 200 ? 20 : finalY);
    
    const passifData = [
      ['', 'CAPITAUX PROPRES', formatAmount(balanceSheet.passif.capitauxPropres.reduce((s, i) => s + i.montant_n, 0))],
      ...balanceSheet.passif.capitauxPropres.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ['', 'DETTES', formatAmount(balanceSheet.passif.dettes.reduce((s, i) => s + i.montant_n, 0))],
      ...balanceSheet.passif.dettes.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ['', 'TOTAL PASSIF', formatAmount(balanceSheet.passif.total)],
    ];

    (doc as any).autoTable({
      startY: finalY > 200 ? 25 : finalY + 5,
      head: [['Code', 'Libellé', `Montant (${currency})`]],
      body: passifData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(regionalParams.mention_legale_footer, 105, pageHeight - 20, { align: 'center' });
    doc.text(regionalParams.mention_signature, 105, pageHeight - 15, { align: 'center' });

    doc.save(`Bilan_${currentExercice.libelle}.pdf`);
    toast.success('PDF du bilan généré avec succès');
  };

  // Export Balance Sheet to Excel
  const exportBalanceSheetExcel = async () => {
    if (!balanceSheet || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const wb = XLSX.utils.book_new();
    const currency = getCurrencySymbol();

    // Actif sheet
    const actifData = [
      ['BILAN - ACTIF', '', `Exercice: ${currentExercice.libelle}`],
      ['Code', 'Libellé', `Montant (${currency})`],
      ['', 'ACTIF IMMOBILISE', ''],
      ...balanceSheet.actif.immobilise.map(item => [item.code, item.libelle, item.montant_n]),
      ['', 'Sous-total Immobilisé', balanceSheet.actif.immobilise.reduce((s, i) => s + i.montant_n, 0)],
      ['', '', ''],
      ['', 'ACTIF CIRCULANT', ''],
      ...balanceSheet.actif.circulant.map(item => [item.code, item.libelle, item.montant_n]),
      ['', 'Sous-total Circulant', balanceSheet.actif.circulant.reduce((s, i) => s + i.montant_n, 0)],
      ['', '', ''],
      ['', 'TRESORERIE-ACTIF', ''],
      ...balanceSheet.actif.tresorerie.map(item => [item.code, item.libelle, item.montant_n]),
      ['', 'Sous-total Trésorerie', balanceSheet.actif.tresorerie.reduce((s, i) => s + i.montant_n, 0)],
      ['', '', ''],
      ['', 'TOTAL ACTIF', balanceSheet.actif.total],
    ];

    const wsActif = XLSX.utils.aoa_to_sheet(actifData);
    XLSX.utils.book_append_sheet(wb, wsActif, 'Actif');

    // Passif sheet
    const passifData = [
      ['BILAN - PASSIF', '', `Exercice: ${currentExercice.libelle}`],
      ['Code', 'Libellé', `Montant (${currency})`],
      ['', 'CAPITAUX PROPRES', ''],
      ...balanceSheet.passif.capitauxPropres.map(item => [item.code, item.libelle, item.montant_n]),
      ['', 'Sous-total Capitaux Propres', balanceSheet.passif.capitauxPropres.reduce((s, i) => s + i.montant_n, 0)],
      ['', '', ''],
      ['', 'DETTES', ''],
      ...balanceSheet.passif.dettes.map(item => [item.code, item.libelle, item.montant_n]),
      ['', 'Sous-total Dettes', balanceSheet.passif.dettes.reduce((s, i) => s + i.montant_n, 0)],
      ['', '', ''],
      ['', 'TOTAL PASSIF', balanceSheet.passif.total],
    ];

    const wsPassif = XLSX.utils.aoa_to_sheet(passifData);
    XLSX.utils.book_append_sheet(wb, wsPassif, 'Passif');

    XLSX.writeFile(wb, `Bilan_${currentExercice.libelle}.xlsx`);
    toast.success('Excel du bilan généré avec succès');
  };

  // Export Income Statement to PDF
  const exportIncomeStatementPDF = async () => {
    if (!incomeStatement || !regionalParams || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const doc = new jsPDF();
    const currency = getCurrencySymbol();
    
    doc.setFontSize(16);
    doc.text(regionalParams.pays.toUpperCase(), 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`COMPTE DE RESULTAT ${regionalParams.systeme_comptable}`, 105, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Exercice: ${currentExercice.libelle}`, 105, 32, { align: 'center' });

    const data = [
      ['', 'PRODUITS D\'EXPLOITATION', ''],
      ...incomeStatement.produits.exploitation.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ['', 'Total Produits Exploitation', formatAmount(incomeStatement.produits.exploitation.reduce((s, i) => s + i.montant_n, 0))],
      ['', '', ''],
      ['', 'CHARGES D\'EXPLOITATION', ''],
      ...incomeStatement.charges.exploitation.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ['', 'Total Charges Exploitation', formatAmount(incomeStatement.charges.exploitation.reduce((s, i) => s + i.montant_n, 0))],
      ['', '', ''],
      ['', 'RESULTAT D\'EXPLOITATION', formatAmount(incomeStatement.resultatExploitation)],
      ['', 'RESULTAT FINANCIER', formatAmount(incomeStatement.resultatFinancier)],
      ['', 'RESULTAT HAO', formatAmount(incomeStatement.resultatExceptionnel)],
      ['', '', ''],
      ['', 'RESULTAT NET', formatAmount(incomeStatement.resultatNet)],
      ['', '', ''],
      ['', 'CENTIME ADDITIONNEL COLLECTE', formatAmount(incomeStatement.centimeAdditionnel)],
    ];

    (doc as any).autoTable({
      startY: 45,
      head: [['Code', 'Libellé', `Montant (${currency})`]],
      body: data,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(regionalParams.mention_legale_footer, 105, pageHeight - 20, { align: 'center' });

    doc.save(`Compte_Resultat_${currentExercice.libelle}.pdf`);
    toast.success('PDF du compte de résultat généré avec succès');
  };

  // Export Income Statement to Excel
  const exportIncomeStatementExcel = async () => {
    if (!incomeStatement || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const wb = XLSX.utils.book_new();
    const currency = getCurrencySymbol();

    const data = [
      ['COMPTE DE RESULTAT', '', `Exercice: ${currentExercice.libelle}`],
      ['Code', 'Libellé', `Montant (${currency})`],
      ['', 'PRODUITS D\'EXPLOITATION', ''],
      ...incomeStatement.produits.exploitation.map(item => [item.code, item.libelle, item.montant_n]),
      ['', 'Total Produits Exploitation', incomeStatement.produits.exploitation.reduce((s, i) => s + i.montant_n, 0)],
      ['', '', ''],
      ['', 'CHARGES D\'EXPLOITATION', ''],
      ...incomeStatement.charges.exploitation.map(item => [item.code, item.libelle, item.montant_n]),
      ['', 'Total Charges Exploitation', incomeStatement.charges.exploitation.reduce((s, i) => s + i.montant_n, 0)],
      ['', '', ''],
      ['', 'RESULTAT D\'EXPLOITATION', incomeStatement.resultatExploitation],
      ['', 'RESULTAT FINANCIER', incomeStatement.resultatFinancier],
      ['', 'RESULTAT HAO', incomeStatement.resultatExceptionnel],
      ['', '', ''],
      ['', 'RESULTAT NET', incomeStatement.resultatNet],
      ['', '', ''],
      ['', 'CENTIME ADDITIONNEL COLLECTE', incomeStatement.centimeAdditionnel],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Compte de Résultat');

    XLSX.writeFile(wb, `Compte_Resultat_${currentExercice.libelle}.xlsx`);
    toast.success('Excel du compte de résultat généré avec succès');
  };

  // Export Cash Flow to PDF
  const exportCashFlowPDF = async () => {
    if (!cashFlowStatement || !regionalParams || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const doc = new jsPDF();
    const currency = getCurrencySymbol();
    
    doc.setFontSize(16);
    doc.text('TABLEAU DES FLUX DE TRESORERIE', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Exercice: ${currentExercice.libelle}`, 105, 25, { align: 'center' });

    const data = [
      ['FLUX D\'EXPLOITATION', ''],
      ...cashFlowStatement.fluxExploitation.details.map(d => [d.libelle, formatAmount(d.montant)]),
      ['Total Flux Exploitation', formatAmount(cashFlowStatement.fluxExploitation.total)],
      ['', ''],
      ['FLUX D\'INVESTISSEMENT', ''],
      ...cashFlowStatement.fluxInvestissement.details.map(d => [d.libelle, formatAmount(d.montant)]),
      ['Total Flux Investissement', formatAmount(cashFlowStatement.fluxInvestissement.total)],
      ['', ''],
      ['FLUX DE FINANCEMENT', ''],
      ...cashFlowStatement.fluxFinancement.details.map(d => [d.libelle, formatAmount(d.montant)]),
      ['Total Flux Financement', formatAmount(cashFlowStatement.fluxFinancement.total)],
      ['', ''],
      ['VARIATION DE TRESORERIE', formatAmount(cashFlowStatement.variationTresorerie)],
      ['Trésorerie début', formatAmount(cashFlowStatement.tresorerieDebut)],
      ['Trésorerie fin', formatAmount(cashFlowStatement.tresorerieFin)],
    ];

    (doc as any).autoTable({
      startY: 35,
      head: [['Libellé', `Montant (${currency})`]],
      body: data,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    doc.save(`Flux_Tresorerie_${currentExercice.libelle}.pdf`);
    toast.success('PDF des flux de trésorerie généré avec succès');
  };

  // Export Cash Flow to Excel
  const exportCashFlowExcel = async () => {
    if (!cashFlowStatement || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const wb = XLSX.utils.book_new();

    const data: (string | number)[][] = [
      ['TABLEAU DES FLUX DE TRESORERIE', `Exercice: ${currentExercice.libelle}`],
      ['Libellé', 'Montant'],
      ['FLUX D\'EXPLOITATION', ''],
      ...cashFlowStatement.fluxExploitation.details.map(d => [d.libelle, d.montant] as (string | number)[]),
      ['Total Flux Exploitation', cashFlowStatement.fluxExploitation.total],
      ['', ''],
      ['FLUX D\'INVESTISSEMENT', ''],
      ...cashFlowStatement.fluxInvestissement.details.map(d => [d.libelle, d.montant]),
      ['Total Flux Investissement', cashFlowStatement.fluxInvestissement.total],
      ['', ''],
      ['FLUX DE FINANCEMENT', ''],
      ...cashFlowStatement.fluxFinancement.details.map(d => [d.libelle, d.montant]),
      ['Total Flux Financement', cashFlowStatement.fluxFinancement.total],
      ['', ''],
      ['VARIATION DE TRESORERIE', cashFlowStatement.variationTresorerie],
      ['Trésorerie début', cashFlowStatement.tresorerieDebut],
      ['Trésorerie fin', cashFlowStatement.tresorerieFin],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Flux de Trésorerie');

    XLSX.writeFile(wb, `Flux_Tresorerie_${currentExercice.libelle}.xlsx`);
    toast.success('Excel des flux de trésorerie généré avec succès');
  };

  // Export Ratios to PDF
  const exportRatiosPDF = async () => {
    if (!financialRatios || !regionalParams || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('ANALYSE PAR RATIOS FINANCIERS', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Exercice: ${currentExercice.libelle}`, 105, 25, { align: 'center' });

    const data = [
      ['Liquidité Générale', financialRatios.ratioLiquidite.toFixed(2), `Seuil: ${financialRatios.seuilLiquidite}`, financialRatios.ratioLiquidite >= financialRatios.seuilLiquidite ? 'BON' : 'ATTENTION'],
      ['Endettement', `${financialRatios.ratioEndettement.toFixed(1)}%`, `Seuil: ${financialRatios.seuilEndettement}%`, financialRatios.ratioEndettement <= financialRatios.seuilEndettement ? 'NORMAL' : 'ELEVE'],
      ['Autonomie Financière', `${financialRatios.ratioAutonomie.toFixed(1)}%`, `Seuil: ${financialRatios.seuilAutonomie}%`, financialRatios.ratioAutonomie >= financialRatios.seuilAutonomie ? 'BON' : 'MOYEN'],
      ['Marge d\'Exploitation', `${financialRatios.margeExploitation.toFixed(1)}%`, `Seuil: ${financialRatios.seuilMargeExploitation}%`, financialRatios.margeExploitation >= financialRatios.seuilMargeExploitation ? 'EXCELLENT' : 'NORMAL'],
      ['Marge Nette', `${financialRatios.margeNette.toFixed(1)}%`, `Seuil: ${financialRatios.seuilMargeNette}%`, financialRatios.margeNette >= financialRatios.seuilMargeNette ? 'TRES BON' : 'CORRECT'],
      ['Rentabilité Capitaux', `${financialRatios.rentabiliteCapitaux.toFixed(1)}%`, `Seuil: ${financialRatios.seuilRentabilite}%`, financialRatios.rentabiliteCapitaux >= financialRatios.seuilRentabilite ? 'EXCELLENT' : 'BIEN'],
    ];

    (doc as any).autoTable({
      startY: 35,
      head: [['Ratio', 'Valeur', 'Référence', 'Évaluation']],
      body: data,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    doc.save(`Ratios_Financiers_${currentExercice.libelle}.pdf`);
    toast.success('PDF des ratios généré avec succès');
  };

  // Export Annexes to PDF
  const exportAnnexesPDF = async () => {
    if (!financialAnnexes || !regionalParams || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const doc = new jsPDF();
    const currency = getCurrencySymbol();
    
    doc.setFontSize(16);
    doc.text('ETATS ANNEXES', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Exercice: ${currentExercice.libelle}`, 105, 25, { align: 'center' });

    // Amortissements
    doc.setFontSize(12);
    doc.text('TABLEAU DES AMORTISSEMENTS', 14, 40);

    const amortData = financialAnnexes.amortissements.items.map(item => [
      item.immobilisation,
      formatAmount(item.valeurBrute),
      formatAmount(item.amortissementsCumules),
      formatAmount(item.dotationExercice),
      formatAmount(item.valeurNette),
    ]);
    amortData.push([
      'TOTAUX',
      formatAmount(financialAnnexes.amortissements.totalValeurBrute),
      formatAmount(financialAnnexes.amortissements.totalAmortissements),
      formatAmount(financialAnnexes.amortissements.totalDotation),
      formatAmount(financialAnnexes.amortissements.totalValeurNette),
    ]);

    (doc as any).autoTable({
      startY: 45,
      head: [['Immobilisation', 'Valeur Brute', 'Amort. Cumulés', 'Dotation', 'Valeur Nette']],
      body: amortData,
      theme: 'striped',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    doc.save(`Etats_Annexes_${currentExercice.libelle}.pdf`);
    toast.success('PDF des états annexes généré avec succès');
  };

  // Export Annexes to Excel
  const exportAnnexesExcel = async () => {
    if (!financialAnnexes || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Amortissements sheet
    const amortData = [
      ['TABLEAU DES AMORTISSEMENTS', '', '', '', `Exercice: ${currentExercice.libelle}`],
      ['Immobilisation', 'Valeur Brute', 'Amort. Cumulés', 'Dotation', 'Valeur Nette'],
      ...financialAnnexes.amortissements.items.map(item => [
        item.immobilisation,
        item.valeurBrute,
        item.amortissementsCumules,
        item.dotationExercice,
        item.valeurNette,
      ]),
      ['TOTAUX', 
        financialAnnexes.amortissements.totalValeurBrute,
        financialAnnexes.amortissements.totalAmortissements,
        financialAnnexes.amortissements.totalDotation,
        financialAnnexes.amortissements.totalValeurNette,
      ],
    ];
    const wsAmort = XLSX.utils.aoa_to_sheet(amortData);
    XLSX.utils.book_append_sheet(wb, wsAmort, 'Amortissements');

    // Créances sheet
    const creancesData = [
      ['ETAT DES CREANCES CLIENTS', '', '', '', '', `Exercice: ${currentExercice.libelle}`],
      ['Client', 'N° Facture', 'Montant Total', 'Échu', 'Non Échu', 'Jours Retard'],
      ...financialAnnexes.creancesClients.items.map(item => [
        item.client,
        item.numeroFacture,
        item.montantTotal,
        item.montantEchu,
        item.montantNonEchu,
        item.joursRetard,
      ]),
      ['TOTAUX', '', 
        financialAnnexes.creancesClients.totalCreances,
        financialAnnexes.creancesClients.totalEchu,
        financialAnnexes.creancesClients.totalNonEchu,
        '',
      ],
    ];
    const wsCreances = XLSX.utils.aoa_to_sheet(creancesData);
    XLSX.utils.book_append_sheet(wb, wsCreances, 'Créances Clients');

    // Dettes sheet
    const dettesData = [
      ['ETAT DES DETTES FOURNISSEURS', '', '', '', '', `Exercice: ${currentExercice.libelle}`],
      ['Fournisseur', 'Référence', 'Montant Total', 'Échu', 'Non Échu', 'Jours Retard'],
      ...financialAnnexes.dettesFournisseurs.items.map(item => [
        item.fournisseur,
        item.reference,
        item.montantTotal,
        item.montantEchu,
        item.montantNonEchu,
        item.joursRetard,
      ]),
      ['TOTAUX', '', 
        financialAnnexes.dettesFournisseurs.totalDettes,
        financialAnnexes.dettesFournisseurs.totalEchu,
        financialAnnexes.dettesFournisseurs.totalNonEchu,
        '',
      ],
    ];
    const wsDettes = XLSX.utils.aoa_to_sheet(dettesData);
    XLSX.utils.book_append_sheet(wb, wsDettes, 'Dettes Fournisseurs');

    XLSX.writeFile(wb, `Etats_Annexes_${currentExercice.libelle}.xlsx`);
    toast.success('Excel des états annexes généré avec succès');
  };

  // Update regional params mutation
  const updateRegionalParamsMutation = useMutation({
    mutationFn: async (params: Partial<RegionalParams>) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { data, error } = await supabase
        .from('parametres_regionaux_rapports')
        .update(params)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regional-params-reports', tenantId] });
      toast.success('Paramètres régionaux mis à jour');
    },
    onError: (error) => {
      console.error('Error updating regional params:', error);
      toast.error('Erreur lors de la mise à jour des paramètres');
    },
  });

  return {
    // Data
    regionalParams,
    exercices,
    currentExercice,
    balanceSheet,
    incomeStatement,
    cashFlowStatement,
    financialAnnexes,
    financialRatios,

    // Loading states
    isLoading: isLoadingRegionalParams || isLoadingExercices || isLoadingBalanceSheet || isLoadingIncomeStatement || isLoadingCashFlow || isLoadingAnnexes,
    
    // Formatters from useCurrencyFormatting
    formatAmount,
    getCurrencySymbol,
    isNoDecimalCurrency,

    // Exports
    exportBalanceSheetPDF,
    exportBalanceSheetExcel,
    exportIncomeStatementPDF,
    exportIncomeStatementExcel,
    exportCashFlowPDF,
    exportCashFlowExcel,
    exportRatiosPDF,
    exportAnnexesPDF,
    exportAnnexesExcel,

    // Mutations
    updateRegionalParams: updateRegionalParamsMutation.mutate,
    isUpdatingRegionalParams: updateRegionalParamsMutation.isPending,
  };
}
