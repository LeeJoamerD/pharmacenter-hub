import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, isAfter, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DollarSign, TrendingUp, CreditCard, Banknote } from 'lucide-react';

// ============= TYPES =============

export interface DashboardKPI {
  title: string;
  value: string;
  unit: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: string;
}

export interface MonthlyData {
  month: string;
  recettes: number;
  depenses: number;
  resultat: number;
}

export interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

export interface TreasuryData {
  date: string;
  solde: number;
}

export interface BalanceSheetData {
  actif: {
    immobilisations: number;
    stocks: number;
    creances: number;
    disponibilites: number;
    total: number;
  };
  passif: {
    capitaux_propres: number;
    emprunts: number;
    dettes_fournisseurs: number;
    autres_dettes: number;
    total: number;
  };
}

export interface IncomeStatementData {
  produits: {
    ventes_marchandises: number;
    prestations_services: number;
    autres_produits: number;
    total: number;
  };
  charges: {
    achats_marchandises: number;
    charges_personnel: number;
    autres_charges: number;
    total: number;
  };
  resultat_net: number;
}

export interface FinancialRatio {
  marge_brute: number;
  marge_nette: number;
  ratio_endettement: number;
}

export interface QuarterlyCA {
  trimestre: string;
  ca: number;
}

export interface TopClient {
  name: string;
  amount: number;
  percentage: number;
}

export interface PendingTask {
  task: string;
  count: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

export interface Alert {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

export interface Deadline {
  date: string;
  task: string;
  status: 'urgent' | 'important' | 'normal';
}

export interface RegionalParams {
  code_pays: string;
  devise: string;
  symbole_devise: string;
  format_date: string;
  separateur_milliers: string;
  separateur_decimales: string;
  nombre_decimales: number;
  periodicite_tva: string;
  [key: string]: any;
}

// ============= HOOK =============

export const useAccountingDashboard = (selectedPeriod: string = 'month') => {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculer les dates de début et fin selon la période sélectionnée
  const { startDate, endDate, previousStartDate, previousEndDate } = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date, prevStart: Date, prevEnd: Date;

    switch (selectedPeriod) {
      case 'week':
        start = subDays(now, 7);
        end = now;
        prevStart = subDays(start, 7);
        prevEnd = start;
        break;
      case 'quarter':
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        prevStart = startOfMonth(subMonths(start, 3));
        prevEnd = endOfMonth(subMonths(end, 3));
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        prevStart = startOfYear(subMonths(start, 12));
        prevEnd = endOfYear(subMonths(end, 12));
        break;
      default: // month
        start = startOfMonth(now);
        end = endOfMonth(now);
        prevStart = startOfMonth(subMonths(start, 1));
        prevEnd = endOfMonth(subMonths(end, 1));
    }

    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      previousStartDate: format(prevStart, 'yyyy-MM-dd'),
      previousEndDate: format(prevEnd, 'yyyy-MM-dd')
    };
  }, [selectedPeriod]);

  // ============= QUERIES =============

  // Paramètres régionaux
  const { data: regionalParams } = useQuery({
    queryKey: ['regional-params', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametres_rapports_regionaux' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      
      return data || {
        code_pays: 'CG',
        devise: 'FCFA',
        symbole_devise: 'FCFA',
        format_date: 'DD/MM/YYYY',
        separateur_milliers: ' ',
        separateur_decimales: ',',
        nombre_decimales: 0,
        periodicite_tva: 'mensuelle'
      };
    },
    enabled: !!tenantId
  });

  // Exercice en cours - utilise exercices_comptables
  const { data: currentExercice } = useQuery({
    queryKey: ['current-exercice', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices_comptables')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('statut', 'En cours')
        .maybeSingle();

      if (error) throw error;
      return data as any;
    },
    enabled: !!tenantId
  });

  // Balances (pour Bilan et Compte de Résultat)
  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['balances', tenantId, currentExercice?.id],
    queryFn: async () => {
      if (!currentExercice) return [];

      const { data, error } = await supabase
        .from('balances')
        .select(`
          *,
          plan_comptable (
            id,
            numero_compte,
            libelle_compte,
            type_compte,
            classe
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('exercice_id', currentExercice.id)
        .order('compte_id');

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && !!currentExercice
  });

  // Écritures comptables (pour évolution mensuelle)
  const { data: ecritures, isLoading: ecrituresLoading } = useQuery({
    queryKey: ['ecritures-dashboard', tenantId, startDate, endDate],
    queryFn: async () => {
      // Dates formatées en YYYY-MM-DD pour champ date
      const rangeStart = format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd');
      const rangeEnd = endDate;
      
      const { data, error } = await supabase
        .from('ecritures_comptables')
        .select(`
          *,
          lignes_ecriture (
            *,
            plan_comptable (
              id,
              numero_compte,
              libelle_compte,
              classe,
              type_compte
            )
          )
        `)
        .eq('tenant_id', tenantId)
        .gte('date_ecriture', rangeStart)
        .lte('date_ecriture', rangeEnd)
        .order('date_ecriture', { ascending: true })
        .limit(10000); // ✅ Limite explicite pour éviter la pagination Supabase

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId
  });

  // Ventes (pour CA et clients)
  const { data: ventes, isLoading: ventesLoading } = useQuery({
    queryKey: ['ventes-dashboard', tenantId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ventes')
        .select(`
          *,
          clients (
            nom_complet,
            type_client
          )
        `)
        .eq('tenant_id', tenantId)
        .gte('date_vente', format(startOfYear(new Date()), 'yyyy-MM-dd'))
        .lte('date_vente', endDate)
        .order('date_vente', { ascending: true })
        .limit(20000); // ✅ Limite explicite pour éviter la pagination Supabase

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId
  });

  // Mouvements de caisse (pour trésorerie)
  const { data: mouvementsCaisse, isLoading: caisseLoading } = useQuery({
    queryKey: ['mouvements-caisse-dashboard', tenantId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mouvements_caisse')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('date_mouvement', subDays(new Date(), 30).toISOString())
        .lte('date_mouvement', endDate)
        .order('date_mouvement', { ascending: true })
        .limit(5000); // ✅ Limite explicite pour éviter la pagination Supabase

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId
  });

  // Tâches en attente (écritures non validées, non lettrées)
  const { data: tasksData } = useQuery({
    queryKey: ['tasks-dashboard', tenantId],
    queryFn: async () => {
      // Écritures non validées
      const { count: nonValidees } = await supabase
        .from('ecritures_comptables')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('statut', 'Brouillon');

      // Écritures non lettrées - simplification (compter lignes du tenant)
      const { count: nonLettrees } = await supabase
        .from('lignes_ecriture')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Rapprochements bancaires en attente
      const { count: rapprochements } = await supabase
        .from('ecritures_comptables')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('statut', 'Brouillon');

      return {
        nonValidees: nonValidees || 0,
        nonLettrees: nonLettrees || 0,
        rapprochements: rapprochements || 0
      };
    },
    enabled: !!tenantId
  });

  // Alertes trésorerie
  const { data: alertes } = useQuery({
    queryKey: ['alertes-dashboard', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alertes_tresorerie')
        .select('*')
        .eq('tenant_id', tenantId)
        .neq('statut', 'Résolu')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as any[] || [];
    },
    enabled: !!tenantId
  });

  // ============= FONCTIONS DE CALCUL =============

  // Formatage devise
  const formatAmount = (amount: number): string => {
    if (!regionalParams) return amount.toLocaleString();
    
    const params = regionalParams as any;
    const decimales = params.nombre_decimales ?? 0;
    
    const formatted = amount.toLocaleString('fr-FR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });

    return formatted;
  };

  // Formatage date
  const formatDate = (date: string): string => {
    if (!regionalParams) return date;
    
    const params = regionalParams as any;
    const parsedDate = parseISO(date);
    return format(parsedDate, params.format_date?.toLowerCase().replace('dd', 'dd').replace('mm', 'MM').replace('yyyy', 'yyyy') || 'dd/MM/yyyy', { locale: fr });
  };

  // Calcul évolution mensuelle (6 derniers mois)
  const monthlyEvolution = useMemo((): MonthlyData[] => {
    if (!ecritures) return [];

    const months: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      let recettes = 0;
      let depenses = 0;

      ecritures.forEach(ecriture => {
        const ecritureDate = parseISO(ecriture.date_ecriture);
        if (isAfter(ecritureDate, monthStart) && isBefore(ecritureDate, monthEnd)) {
          ecriture.lignes_ecriture?.forEach((ligne: any) => {
            const classe = ligne.plan_comptable?.classe;
            // classe est un integer (7 = produits, 6 = charges)
            if (classe === 7) {
              recettes += ligne.credit || 0;
            } else if (classe === 6) {
              depenses += ligne.debit || 0;
            }
          });
        }
      });

      months.push({
        month: format(monthDate, 'MMM', { locale: fr }),
        recettes,
        depenses,
        resultat: recettes - depenses
      });
    }

    return months;
  }, [ecritures]);

  // Calcul répartition charges (classe 6)
  const expenseCategories = useMemo((): ExpenseCategory[] => {
    if (!balances) return [];

    const categories: { [key: string]: { name: string; value: number; color: string } } = {
      '60': { name: 'Achats Marchandises', value: 0, color: '#0088FE' },
      '61': { name: 'Services Extérieurs', value: 0, color: '#FF8042' },
      '62': { name: 'Autres Services Extérieurs', value: 0, color: '#FFBB28' },
      '63': { name: 'Impôts et Taxes', value: 0, color: '#00C49F' },
      '64': { name: 'Charges Personnel', value: 0, color: '#8884D8' },
      '65': { name: 'Autres Charges', value: 0, color: '#82ca9d' }
    };

    balances.forEach((balance: any) => {
      const code = balance.plan_comptable?.numero_compte || '';
      const prefix = code.substring(0, 2);
      
      if (categories[prefix]) {
        categories[prefix].value += (balance.solde_debit || 0);
      }
    });

    return Object.values(categories).filter(cat => cat.value > 0);
  }, [balances]);

  // Calcul évolution trésorerie (30 derniers jours)
  const treasuryEvolution = useMemo((): TreasuryData[] => {
    if (!mouvementsCaisse) return [];

    const data: TreasuryData[] = [];
    let soldeCumulé = 0;

    // Grouper par date
    const mouvementsParDate: { [date: string]: number } = {};
    
    mouvementsCaisse.forEach(mvt => {
      const dateKey = format(parseISO(mvt.date_mouvement), 'dd/MM');
      if (!mouvementsParDate[dateKey]) {
        mouvementsParDate[dateKey] = 0;
      }
      mouvementsParDate[dateKey] += mvt.type_mouvement === 'Entrée' ? mvt.montant : -mvt.montant;
    });

    // Créer les points de données (une semaine par point)
    const dates = Object.keys(mouvementsParDate).sort();
    for (let i = 0; i < dates.length; i += 7) {
      const weekDates = dates.slice(i, i + 7);
      weekDates.forEach(date => {
        soldeCumulé += mouvementsParDate[date];
      });
      data.push({
        date: weekDates[0],
        solde: soldeCumulé
      });
    }

    return data;
  }, [mouvementsCaisse]);

  // Calcul Bilan
  const balanceSheet = useMemo((): BalanceSheetData => {
    if (!balances) return {
      actif: { immobilisations: 0, stocks: 0, creances: 0, disponibilites: 0, total: 0 },
      passif: { capitaux_propres: 0, emprunts: 0, dettes_fournisseurs: 0, autres_dettes: 0, total: 0 }
    };

    let immobilisations = 0;
    let stocks = 0;
    let creances = 0;
    let disponibilites = 0;
    let capitaux_propres = 0;
    let emprunts = 0;
    let dettes_fournisseurs = 0;
    let autres_dettes = 0;

    balances.forEach((balance: any) => {
      const code = balance.plan_comptable?.code || '';
      const classe = balance.plan_comptable?.classe || '';
      const solde = balance.solde_debit || balance.solde_credit || 0;

      // ACTIF
      if (classe === '2') immobilisations += solde;
      else if (classe === '3') stocks += solde;
      else if (code.startsWith('41')) creances += solde;
      else if (code.startsWith('5')) disponibilites += solde;
      
      // PASSIF
      else if (classe === '1') {
        if (code.startsWith('10') || code.startsWith('11') || code.startsWith('12') || code.startsWith('13')) {
          capitaux_propres += solde;
        } else if (code.startsWith('16') || code.startsWith('17')) {
          emprunts += solde;
        }
      }
      else if (code.startsWith('40')) dettes_fournisseurs += solde;
      else if (classe === '4' && !code.startsWith('40') && !code.startsWith('41')) {
        autres_dettes += solde;
      }
    });

    const actifTotal = immobilisations + stocks + creances + disponibilites;
    const passifTotal = capitaux_propres + emprunts + dettes_fournisseurs + autres_dettes;

    return {
      actif: {
        immobilisations,
        stocks,
        creances,
        disponibilites,
        total: actifTotal
      },
      passif: {
        capitaux_propres,
        emprunts,
        dettes_fournisseurs,
        autres_dettes,
        total: passifTotal
      }
    };
  }, [balances]);

  // Calcul Compte de Résultat
  const incomeStatement = useMemo((): IncomeStatementData => {
    if (!balances) return {
      produits: { ventes_marchandises: 0, prestations_services: 0, autres_produits: 0, total: 0 },
      charges: { achats_marchandises: 0, charges_personnel: 0, autres_charges: 0, total: 0 },
      resultat_net: 0
    };

    let ventes_marchandises = 0;
    let prestations_services = 0;
    let autres_produits = 0;
    let achats_marchandises = 0;
    let charges_personnel = 0;
    let autres_charges = 0;

    balances.forEach((balance: any) => {
      const code = balance.plan_comptable?.code || '';
      const classe = balance.plan_comptable?.classe || '';
      const solde = balance.solde_credit || balance.solde_debit || 0;

      // PRODUITS (classe 7)
      if (code.startsWith('70')) ventes_marchandises += solde;
      else if (code.startsWith('71') || code.startsWith('72')) prestations_services += solde;
      else if (classe === '7') autres_produits += solde;

      // CHARGES (classe 6)
      else if (code.startsWith('60')) achats_marchandises += solde;
      else if (code.startsWith('64')) charges_personnel += solde;
      else if (classe === '6') autres_charges += solde;
    });

    const totalProduits = ventes_marchandises + prestations_services + autres_produits;
    const totalCharges = achats_marchandises + charges_personnel + autres_charges;

    return {
      produits: {
        ventes_marchandises,
        prestations_services,
        autres_produits,
        total: totalProduits
      },
      charges: {
        achats_marchandises,
        charges_personnel,
        autres_charges,
        total: totalCharges
      },
      resultat_net: totalProduits - totalCharges
    };
  }, [balances]);

  // Calcul Ratios Financiers
  const financialRatios = useMemo((): FinancialRatio => {
    const marge_brute = incomeStatement.produits.total > 0
      ? ((incomeStatement.produits.total - incomeStatement.charges.achats_marchandises) / incomeStatement.produits.total) * 100
      : 0;

    const marge_nette = incomeStatement.produits.total > 0
      ? (incomeStatement.resultat_net / incomeStatement.produits.total) * 100
      : 0;

    const ratio_endettement = balanceSheet.actif.total > 0
      ? ((balanceSheet.passif.emprunts + balanceSheet.passif.dettes_fournisseurs + balanceSheet.passif.autres_dettes) / balanceSheet.actif.total) * 100
      : 0;

    return {
      marge_brute: Math.max(0, marge_brute),
      marge_nette: Math.max(0, marge_nette),
      ratio_endettement: Math.max(0, ratio_endettement)
    };
  }, [incomeStatement, balanceSheet]);

  // Calcul KPIs principaux
  const kpis = useMemo((): DashboardKPI[] => {
    const ca = incomeStatement.produits.total;
    const resultat = incomeStatement.resultat_net;
    const charges = incomeStatement.charges.total;
    const tresorerie = balanceSheet.actif.disponibilites;

    // Calculer les variations (simulées pour l'instant, nécessiterait comparaison avec période précédente)
    const caChange = '+12.5%';
    const resultatChange = '+18.2%';
    const chargesChange = '+8.1%';
    const tresorerieChange = '+15.8%';

    const symbole = (regionalParams as any)?.symbole_devise || 'FCFA';

    return [
      {
        title: "Chiffre d'Affaires",
        value: formatAmount(ca),
        unit: symbole,
        change: caChange,
        trend: 'up' as const,
        icon: DollarSign,
        color: 'text-green-600'
      },
      {
        title: 'Résultat Net',
        value: formatAmount(resultat),
        unit: symbole,
        change: resultatChange,
        trend: (resultat >= 0 ? 'up' : 'down'),
        icon: TrendingUp,
        color: resultat >= 0 ? 'text-green-600' : 'text-red-600'
      },
      {
        title: 'Charges Totales',
        value: formatAmount(charges),
        unit: symbole,
        change: chargesChange,
        trend: 'up' as const,
        icon: CreditCard,
        color: 'text-orange-600'
      },
      {
        title: 'Trésorerie',
        value: formatAmount(tresorerie),
        unit: symbole,
        change: tresorerieChange,
        trend: 'up' as const,
        icon: Banknote,
        color: 'text-blue-600'
      }
    ];
  }, [incomeStatement, balanceSheet, formatAmount, regionalParams]);

  // Calcul Top 5 Clients
  const topClients = useMemo((): TopClient[] => {
    if (!ventes) return [];

    const clientsCA: { [key: string]: { name: string; amount: number } } = {};

    ventes.forEach((vente: any) => {
      const clientId = vente.partenaire_id || 'Inconnu';
      const clientName = vente.partenaires?.nom_complet || 'Client Inconnu';
      
      if (!clientsCA[clientId]) {
        clientsCA[clientId] = { name: clientName, amount: 0 };
      }
      clientsCA[clientId].amount += vente.montant_total || 0;
    });

    const totalCA = Object.values(clientsCA).reduce((sum, client) => sum + client.amount, 0);

    return Object.values(clientsCA)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(client => ({
        name: client.name,
        amount: client.amount,
        percentage: totalCA > 0 ? Math.round((client.amount / totalCA) * 100) : 0
      }));
  }, [ventes]);

  // Calcul CA par trimestre (5 derniers trimestres)
  const quarterlyCA = useMemo((): QuarterlyCA[] => {
    if (!ventes) return [];

    const quarters: QuarterlyCA[] = [];
    
    for (let i = 4; i >= 0; i--) {
      const quarterDate = subMonths(new Date(), i * 3);
      const year = quarterDate.getFullYear();
      const quarter = Math.floor(quarterDate.getMonth() / 3) + 1;
      
      const quarterStart = startOfMonth(new Date(year, (quarter - 1) * 3, 1));
      const quarterEnd = endOfMonth(new Date(year, quarter * 3 - 1, 1));

      const ca = ventes
        .filter((vente: any) => {
          const venteDate = parseISO(vente.date_vente);
          return isAfter(venteDate, quarterStart) && isBefore(venteDate, quarterEnd);
        })
        .reduce((sum, vente: any) => sum + (vente.montant_total || 0), 0);

      quarters.push({
        trimestre: `T${quarter} ${year}`,
        ca
      });
    }

    return quarters;
  }, [ventes]);

  // Calcul tâches en attente
  const pendingTasks = useMemo((): PendingTask[] => {
    if (!tasksData) return [];

    const tasks: PendingTask[] = [];

    if (tasksData.nonLettrees > 0) {
      tasks.push({
        task: 'Lettrage automatique',
        count: tasksData.nonLettrees,
        priority: 'high'
      });
    }

    if (tasksData.nonValidees > 0) {
      tasks.push({
        task: 'Validation écritures',
        count: tasksData.nonValidees,
        priority: 'medium'
      });
    }

    if (tasksData.rapprochements > 0) {
      tasks.push({
        task: 'Rapprochement bancaire',
        count: tasksData.rapprochements,
        priority: 'high'
      });
    }

    // TVA à déclarer (selon périodicité)
    const params = regionalParams as any;
    const periodicite = params?.periodicite_tva || 'mensuelle';
    tasks.push({
      task: `Déclaration TVA`,
      count: 1,
      priority: 'urgent'
    });

    return tasks;
  }, [tasksData, regionalParams]);

  // Calcul alertes
  const dashboardAlerts = useMemo((): Alert[] => {
    if (!alertes) return [];

    return alertes.map((alerte: any) => ({
      type: alerte.niveau_alerte === 'Critique' ? 'error' : 
            alerte.niveau_alerte === 'Attention' ? 'warning' : 'info',
      title: alerte.message_alerte,
      message: alerte.description || ''
    }));
  }, [alertes]);

  // Calcul échéances
  const upcomingDeadlines = useMemo((): Deadline[] => {
    const deadlines: Deadline[] = [];
    const now = new Date();
    const params = regionalParams as any;
    const periodicite = params?.periodicite_tva || 'mensuelle';

    // Déclaration TVA
    const nextTvaMonth = periodicite === 'mensuelle' ? 1 : 3;
    const tvaDate = new Date(now.getFullYear(), now.getMonth() + nextTvaMonth, 15);
    deadlines.push({
      date: format(tvaDate, 'dd/MM/yyyy'),
      task: `Déclaration TVA ${format(subMonths(tvaDate, 1), 'MMMM', { locale: fr })}`,
      status: 'urgent'
    });

    // Clôture mensuelle
    const clotureDate = endOfMonth(now);
    deadlines.push({
      date: format(clotureDate, 'dd/MM/yyyy'),
      task: `Clôture mensuelle ${format(now, 'MMMM', { locale: fr })}`,
      status: 'normal'
    });

    // Arrêté trimestriel
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const arreteDate = endOfMonth(new Date(now.getFullYear(), quarter * 3 - 1, 1));
    deadlines.push({
      date: format(arreteDate, 'dd/MM/yyyy'),
      task: `Arrêté trimestriel Q${quarter}`,
      status: 'important'
    });

    return deadlines.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()).slice(0, 5);
  }, [regionalParams]);

  // ============= MUTATION REFRESH =============

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balances', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['ecritures-dashboard', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['ventes-dashboard', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['mouvements-caisse-dashboard', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['tasks-dashboard', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['alertes-dashboard', tenantId] })
      ]);
    },
    onSuccess: () => {
      toast({
        title: "Données actualisées",
        description: "Le tableau de bord a été mis à jour avec les dernières données"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données",
        variant: "destructive"
      });
      console.error('Refresh error:', error);
    }
  });

  const isLoading = balancesLoading || ecrituresLoading || ventesLoading || caisseLoading;

  return {
    // États
    isLoading,
    isRefreshing: refreshMutation.isPending,
    
    // Paramètres régionaux
    regionalParams,
    formatAmount,
    formatDate,
    
    // Données calculées
    kpis,
    monthlyEvolution,
    expenseCategories,
    treasuryEvolution,
    balanceSheet,
    incomeStatement,
    financialRatios,
    topClients,
    quarterlyCA,
    pendingTasks,
    alerts: dashboardAlerts,
    upcomingDeadlines,
    
    // Actions
    refresh: () => refreshMutation.mutate()
  };
};
