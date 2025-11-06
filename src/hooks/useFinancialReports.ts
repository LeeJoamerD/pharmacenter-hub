import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useGlobalSystemSettings } from './useGlobalSystemSettings';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Types
interface RegionalParams {
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

interface Exercice {
  id: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  annee: number;
}

interface BalanceSheetItem {
  code: string;
  libelle: string;
  montant_n: number;
  montant_n1?: number;
  variation?: number;
  variation_pct?: number;
}

interface BalanceSheet {
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

interface IncomeStatementItem {
  code: string;
  libelle: string;
  montant_n: number;
  montant_n1?: number;
  variation?: number;
  variation_pct?: number;
}

interface IncomeStatement {
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
}

interface CashFlowItem {
  libelle: string;
  montant: number;
}

interface CashFlowStatement {
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

interface AmortissementItem {
  immobilisation: string;
  valeurBrute: number;
  amortissementsCumules: number;
  valeurNette: number;
  dotationExercice: number;
  tauxAmortissement: number;
}

interface CreanceClientItem {
  client: string;
  montantTotal: number;
  montantEchu: number;
  montantNonEchu: number;
  joursRetard: number;
  dateEmission: string;
  dateEcheance: string;
}

interface DetteFournisseurItem {
  fournisseur: string;
  montantTotal: number;
  montantEchu: number;
  montantNonEchu: number;
  joursRetard: number;
  dateEmission: string;
  dateEcheance: string;
}

interface FinancialAnnexes {
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

interface FinancialRatios {
  ratioLiquidite: number;
  ratioEndettement: number;
  ratioAutonomie: number;
  margeExploitation: number;
  margeNette: number;
  rentabiliteCapitaux: number;
}

export function useFinancialReports(selectedExerciceId?: string) {
  const { tenantId } = useTenant();
  const { formatPrice } = useCurrency();
  const { getCurrentCurrency } = useGlobalSystemSettings();
  const queryClient = useQueryClient();

  // Get regional parameters
  const { data: regionalParams, isLoading: isLoadingRegionalParams } = useQuery({
    queryKey: ['regional-params', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('parametres_regionaux_rapports')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching regional params:', error);
        // Initialize with default Congo-Brazzaville params if not found
        if (error.code === 'PGRST116') {
          const { data: initData, error: initError } = await supabase
            .rpc('init_regional_params_for_tenant', {
              p_tenant_id: tenantId,
              p_country_code: 'CG'
            });

          if (initError) {
            console.error('Error initializing regional params:', initError);
            throw initError;
          }

          // Refetch after initialization
          const { data: newData, error: newError } = await supabase
            .from('parametres_regionaux_rapports')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

          if (newError) throw newError;
          return newData as RegionalParams;
        }
        throw error;
      }

      return data as RegionalParams;
    },
    enabled: !!tenantId,
  });

  // Format amount with regional settings
  const formatAmount = (amount: number): string => {
    if (!regionalParams) return formatPrice(amount);

    const devise = regionalParams.devise_principale;
    const format = regionalParams.format_nombre;

    // Format number with thousands separator
    let formattedNumber: string;
    if (format === 'space') {
      formattedNumber = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    } else {
      formattedNumber = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Get currency symbol
    let symbol = devise;
    if (devise === 'XAF' || devise === 'XOF') {
      symbol = 'FCFA';
    } else if (devise === 'EUR') {
      symbol = '€';
    } else if (devise === 'USD') {
      symbol = '$';
    }

    return `${formattedNumber} ${symbol}`;
  };

  // Format date with regional settings
  const formatDate = (date: string): string => {
    if (!regionalParams) return new Date(date).toLocaleDateString('fr-FR');
    
    const d = new Date(date);
    const format = regionalParams.format_date;

    if (format === 'DD/MM/YYYY') {
      return d.toLocaleDateString('fr-FR');
    } else if (format === 'MM/DD/YYYY') {
      return d.toLocaleDateString('en-US');
    }

    return d.toLocaleDateString('fr-FR');
  };

  // Get exercices
  const { data: exercices, isLoading: isLoadingExercices } = useQuery({
    queryKey: ['exercices', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('exercices_comptables')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('annee', { ascending: false });

      if (error) throw error;
      // Map libelle_exercice to libelle for compatibility
      return (data || []).map(ex => ({
        ...ex,
        libelle: ex.libelle_exercice,
        annee: parseInt(ex.libelle_exercice.split(' ')[1] || '2024')
      })) as Exercice[];
    },
    enabled: !!tenantId,
  });

  // Get current exercice
  const currentExercice = exercices?.find(e => e.statut === 'Ouvert') || exercices?.[0];
  const activeExerciceId = selectedExerciceId || currentExercice?.id;

  // Generate Balance Sheet
  const { data: balanceSheet, isLoading: isLoadingBalanceSheet } = useQuery({
    queryKey: ['balance-sheet', tenantId, activeExerciceId],
    queryFn: async () => {
      if (!tenantId || !activeExerciceId) return null;

      const exercice = exercices?.find(e => e.id === activeExerciceId);
      if (!exercice) return null;

      // Get balances for the period
      const { data: balances, error } = await supabase
        .from('balances')
        .select(`
          *,
          compte:plan_comptable(*)
        `)
        .eq('tenant_id', tenantId)
        .eq('exercice_id', activeExerciceId)
        .gte('periode', exercice.date_debut)
        .lte('periode', exercice.date_fin);

      if (error) throw error;

      // Process balances to generate balance sheet structure
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

      balances?.forEach((balance: any) => {
        const compte = balance.compte;
        if (!compte) return;

        const montant = (balance.solde_debit || 0) - (balance.solde_credit || 0);
        const item: BalanceSheetItem = {
          code: compte.numero_compte,
          libelle: compte.libelle_compte,
          montant_n: montant,
        };

        // Classify according to OHADA
        const classe = compte.numero_compte.charAt(0);

        if (classe === '2') {
          // Immobilisations
          result.actif.immobilise.push(item);
          result.actif.total += montant;
        } else if (classe === '3' || classe === '4') {
          // Actif circulant
          result.actif.circulant.push(item);
          result.actif.total += montant;
        } else if (classe === '5') {
          // Trésorerie
          result.actif.tresorerie.push(item);
          result.actif.total += montant;
        } else if (classe === '1') {
          // Capitaux propres
          result.passif.capitauxPropres.push(item);
          result.passif.total += montant;
        } else if (classe === '4' && compte.numero_compte.startsWith('4')) {
          // Dettes
          result.passif.dettes.push(item);
          result.passif.total += montant;
        }
      });

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
      };

      // Group by compte
      const compteMap = new Map<string, { compte: any; montant: number }>();

      lignes?.forEach((ligne: any) => {
        const compte = ligne.compte;
        if (!compte) return;

        const montant = (ligne.montant_credit || 0) - (ligne.montant_debit || 0);
        
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

        const classe = compte.numero_compte.charAt(0);

        if (classe === '7') {
          // Produits
          if (compte.numero_compte.startsWith('70') || compte.numero_compte.startsWith('71')) {
            result.produits.exploitation.push(item);
          } else if (compte.numero_compte.startsWith('77')) {
            result.produits.financiers.push(item);
          } else if (compte.numero_compte.startsWith('78') || compte.numero_compte.startsWith('79')) {
            result.produits.exceptionnels.push(item);
          }
          result.produits.total += Math.abs(montant);
        } else if (classe === '6') {
          // Charges
          if (compte.numero_compte.startsWith('60') || compte.numero_compte.startsWith('61') || compte.numero_compte.startsWith('62') || compte.numero_compte.startsWith('63') || compte.numero_compte.startsWith('64') || compte.numero_compte.startsWith('65') || compte.numero_compte.startsWith('66')) {
            result.charges.exploitation.push(item);
          } else if (compte.numero_compte.startsWith('67')) {
            result.charges.financiers.push(item);
          } else if (compte.numero_compte.startsWith('68') || compte.numero_compte.startsWith('69')) {
            result.charges.exceptionnels.push(item);
          }
          result.charges.total += Math.abs(montant);
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

      return result;
    },
    enabled: !!tenantId && !!activeExerciceId && !!exercices,
  });

  // Generate Cash Flow Statement (OHADA - méthode indirecte)
  const { data: cashFlowStatement, isLoading: isLoadingCashFlow } = useQuery({
    queryKey: ['cash-flow', tenantId, activeExerciceId],
    queryFn: async () => {
      if (!tenantId || !activeExerciceId || !incomeStatement || !balanceSheet) return null;

      const exercice = exercices?.find(e => e.id === activeExerciceId);
      if (!exercice) return null;

      // Get amortissements (classe 68 - dotations aux amortissements)
      const { data: amortData, error: amortError } = await supabase
        .from('lignes_ecriture')
        .select(`
          *,
          ecriture:ecritures_comptables!inner(*),
          compte:plan_comptable(*)
        `)
        .eq('tenant_id', tenantId)
        .gte('ecriture.date_ecriture', exercice.date_debut)
        .lte('ecriture.date_ecriture', exercice.date_fin);

      if (amortError) console.error('Error fetching amortissements:', amortError);

      const dotationsAmortissements = (amortData || [])
        .filter((ligne: any) => ligne.compte?.numero_compte?.startsWith('681'))
        .reduce((sum: number, ligne: any) => sum + (ligne.montant_debit || 0), 0);

      // Estimate BFR variation (simplified)
      const actifCirculant = balanceSheet.actif.circulant.reduce((sum, item) => sum + item.montant_n, 0);
      const dettesCT = balanceSheet.passif.dettes
        .filter(d => d.code.startsWith('4'))
        .reduce((sum, item) => sum + item.montant_n, 0);
      const variationBFR = -(actifCirculant - dettesCT) * 0.1; // Simplified estimate

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

      // Flux d'investissement (classe 2 - immobilisations)
      const acquisitionsImmobilisations = (amortData || [])
        .filter((ligne: any) => ligne.compte?.numero_compte?.charAt(0) === '2' && ligne.montant_debit > 0)
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

      // Flux de financement (emprunts et dividendes)
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

      // Amortissements (from classe 2 and 28)
      const { data: immobilisations, error: immobError } = await supabase
        .from('balances')
        .select(`
          *,
          compte:plan_comptable(*)
        `)
        .eq('tenant_id', tenantId)
        .eq('exercice_id', activeExerciceId)
        .or('compte.numero_compte.like.2%,compte.numero_compte.like.28%');

      if (immobError) console.error('Error fetching immobilisations:', immobError);

      const amortissementsItems: AmortissementItem[] = (immobilisations || [])
        .filter((b: any) => b.compte?.numero_compte?.charAt(0) === '2' && !b.compte?.numero_compte?.startsWith('28'))
        .map((b: any) => {
          const valeurBrute = b.solde_debit || 0;
          const amortCumule = (immobilisations || [])
            .filter((a: any) => a.compte?.numero_compte === `28${b.compte?.numero_compte?.substring(1)}`)
            .reduce((sum: number, a: any) => sum + (a.solde_credit || 0), 0);
          
          return {
            immobilisation: b.compte?.libelle_compte || '',
            valeurBrute,
            amortissementsCumules: amortCumule,
            valeurNette: valeurBrute - amortCumule,
            dotationExercice: amortCumule * 0.2, // Estimate 20% of cumulated
            tauxAmortissement: 20, // Simplified
          };
        });

      const totalValeurBrute = amortissementsItems.reduce((sum, item) => sum + item.valeurBrute, 0);
      const totalAmortissements = amortissementsItems.reduce((sum, item) => sum + item.amortissementsCumules, 0);

      // Créances clients (TODO: implémenter avec les vraies tables de facturation)
      const creancesItems: CreanceClientItem[] = [];
      const totalCreances = 0;
      const totalEchu = 0;

      // Dettes fournisseurs (TODO: implémenter avec les vraies tables de facturation)
      const dettesItems: DetteFournisseurItem[] = [];
      const totalDettes = 0;
      const totalDettesEchu = 0;

      return {
        amortissements: {
          items: amortissementsItems,
          totalValeurBrute,
          totalAmortissements,
          totalValeurNette: totalValeurBrute - totalAmortissements,
        },
        creancesClients: {
          items: creancesItems,
          totalCreances,
          totalEchu,
          totalNonEchu: totalCreances - totalEchu,
          tauxRecouvrement: totalCreances > 0 ? ((totalCreances - totalEchu) / totalCreances) * 100 : 0,
        },
        dettesFournisseurs: {
          items: dettesItems,
          totalDettes,
          totalEchu: totalDettesEchu,
          totalNonEchu: totalDettes - totalDettesEchu,
          delaiMoyenPaiement: dettesItems.length > 0 
            ? dettesItems.reduce((sum, item) => sum + item.joursRetard, 0) / dettesItems.length 
            : 0,
        },
      };
    },
    enabled: !!tenantId && !!activeExerciceId && !!exercices,
  });

  // Calculate Financial Ratios
  const financialRatios: FinancialRatios | null = (() => {
    if (!balanceSheet || !incomeStatement) return null;

    const actifCirculant = balanceSheet.actif.circulant.reduce((sum, item) => sum + item.montant_n, 0);
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
    };
  })();

  // Export Balance Sheet to PDF
  const exportBalanceSheetPDF = async () => {
    if (!balanceSheet || !regionalParams || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const doc = new jsPDF();
    
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
      ...balanceSheet.actif.immobilise.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ...balanceSheet.actif.circulant.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ...balanceSheet.actif.tresorerie.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ['', 'TOTAL ACTIF', formatAmount(balanceSheet.actif.total)],
    ];

    (doc as any).autoTable({
      startY: 50,
      head: [['Code', 'Libellé', 'Montant']],
      body: actifData,
      theme: 'striped',
    });

    // Passif table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('PASSIF', 14, finalY);
    
    const passifData = [
      ...balanceSheet.passif.capitauxPropres.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ...balanceSheet.passif.dettes.map(item => [item.code, item.libelle, formatAmount(item.montant_n)]),
      ['', 'TOTAL PASSIF', formatAmount(balanceSheet.passif.total)],
    ];

    (doc as any).autoTable({
      startY: finalY + 5,
      head: [['Code', 'Libellé', 'Montant']],
      body: passifData,
      theme: 'striped',
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(regionalParams.mention_legale_footer, 105, pageHeight - 20, { align: 'center' });
    doc.text(regionalParams.mention_signature, 105, pageHeight - 15, { align: 'center' });

    doc.save(`Bilan_${currentExercice.libelle}.pdf`);
    toast.success('PDF généré avec succès');
  };

  // Export Income Statement to Excel
  const exportIncomeStatementExcel = async () => {
    if (!incomeStatement || !currentExercice) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Produits sheet
    const produitsData = [
      ['Code', 'Libellé', 'Montant'],
      ['PRODUITS D\'EXPLOITATION'],
      ...incomeStatement.produits.exploitation.map(item => [item.code, item.libelle, item.montant_n]),
      [''],
      ['PRODUITS FINANCIERS'],
      ...incomeStatement.produits.financiers.map(item => [item.code, item.libelle, item.montant_n]),
      [''],
      ['PRODUITS EXCEPTIONNELS'],
      ...incomeStatement.produits.exceptionnels.map(item => [item.code, item.libelle, item.montant_n]),
      [''],
      ['', 'TOTAL PRODUITS', incomeStatement.produits.total],
    ];

    const wsProduitsData = XLSX.utils.aoa_to_sheet(produitsData);
    XLSX.utils.book_append_sheet(wb, wsProduitsData, 'Produits');

    // Charges sheet
    const chargesData = [
      ['Code', 'Libellé', 'Montant'],
      ['CHARGES D\'EXPLOITATION'],
      ...incomeStatement.charges.exploitation.map(item => [item.code, item.libelle, item.montant_n]),
      [''],
      ['CHARGES FINANCIÈRES'],
      ...incomeStatement.charges.financiers.map(item => [item.code, item.libelle, item.montant_n]),
      [''],
      ['CHARGES EXCEPTIONNELLES'],
      ...incomeStatement.charges.exceptionnels.map(item => [item.code, item.libelle, item.montant_n]),
      [''],
      ['', 'TOTAL CHARGES', incomeStatement.charges.total],
    ];

    const wsCharges = XLSX.utils.aoa_to_sheet(chargesData);
    XLSX.utils.book_append_sheet(wb, wsCharges, 'Charges');

    // Résultats sheet
    const resultatsData = [
      ['Type', 'Montant'],
      ['Résultat d\'Exploitation', incomeStatement.resultatExploitation],
      ['Résultat Financier', incomeStatement.resultatFinancier],
      ['Résultat Exceptionnel', incomeStatement.resultatExceptionnel],
      ['Résultat Net', incomeStatement.resultatNet],
    ];

    const wsResultats = XLSX.utils.aoa_to_sheet(resultatsData);
    XLSX.utils.book_append_sheet(wb, wsResultats, 'Résultats');

    XLSX.writeFile(wb, `Compte_Resultat_${currentExercice.libelle}.xlsx`);
    toast.success('Excel généré avec succès');
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
      queryClient.invalidateQueries({ queryKey: ['regional-params', tenantId] });
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
    
    // Formatters
    formatAmount,
    formatDate,

    // Exports
    exportBalanceSheetPDF,
    exportIncomeStatementExcel,

    // Mutations
    updateRegionalParams: updateRegionalParamsMutation.mutate,
    isUpdatingRegionalParams: updateRegionalParamsMutation.isPending,
  };
}
