/**
 * Hook pour gérer les encaissements et rapports de ventes
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== INTERFACES ====================

export interface EncaissementFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  paymentMethod: string;
  status: string;
  caisseId?: string;
  sessionId?: string;
}

export interface EncaissementStats {
  totalAujourdhui: number;
  totalSemaine: number;
  totalMois: number;
  totalAnnee: number;
  transactionCount: number;
  transactionCountToday: number;
  transactionCountWeek: number;
  transactionCountMonth: number;
  averageTransaction: number;
  paymentMethodBreakdown: {
    especes: number;
    carte: number;
    mobile: number;
    assurance: number;
  };
  comparaisonHier: number;
  comparaisonSemaineDerniere: number;
  comparaisonMoisDernier: number;
}

export interface Transaction {
  id: string;
  numero_vente: string;
  date_vente: string;
  client: {
    id: string;
    nom_complet: string;
    telephone: string;
    type_client: string;
  } | null;
  montant_net: number;
  montant_total_ttc: number;
  montant_total_ht: number;
  montant_tva: number;
  montant_remise: number;
  mode_paiement: string;
  statut: string;
  agent: {
    id: string;
    noms: string;
    prenoms: string;
  } | null;
  caisse: {
    id: string;
    nom: string;
  } | null;
  session_caisse: {
    id: string;
    numero_session: string;
  } | null;
  nombre_articles: number;
  lignes_ventes?: any[];
  montant_part_assurance?: number;
  montant_part_patient?: number;
  reference_paiement?: string;
}

export interface TransactionDetails extends Transaction {
  lignes_ventes: Array<{
    id: string;
    produit: {
      libelle_produit: string;
      code_cip: string;
    };
    quantite: number;
    prix_unitaire: number;
    montant_ligne: number;
    taux_remise: number;
    montant_remise: number;
  }>;
}

// ==================== HOOK PRINCIPAL ====================

export const useEncaissements = () => {
  const { tenantId, currentUser } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<EncaissementFilters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all',
    status: 'all',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ==================== REQUÊTE PRINCIPALE : STATISTIQUES ====================

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['encaissement-stats', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfToday = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      // Stats aujourd'hui
      const { data: todayData, error: todayError } = await supabase
        .from('ventes')
        .select('montant_net, mode_paiement, montant_part_assurance')
        .eq('tenant_id', tenantId)
        .gte('date_vente', startOfToday)
        .lte('date_vente', endOfToday)
        .in('statut', ['Validée', 'Finalisée']);

      if (todayError) throw todayError;

      // Stats semaine
      const { data: weekData, error: weekError } = await supabase
        .from('ventes')
        .select('montant_net')
        .eq('tenant_id', tenantId)
        .gte('date_vente', startOfWeek.toISOString())
        .in('statut', ['Validée', 'Finalisée']);

      if (weekError) throw weekError;

      // Stats mois
      const { data: monthData, error: monthError } = await supabase
        .from('ventes')
        .select('montant_net')
        .eq('tenant_id', tenantId)
        .gte('date_vente', startOfMonth.toISOString())
        .in('statut', ['Validée', 'Finalisée']);

      if (monthError) throw monthError;

      // Stats année
      const { data: yearData, error: yearError } = await supabase
        .from('ventes')
        .select('montant_net')
        .eq('tenant_id', tenantId)
        .gte('date_vente', startOfYear.toISOString())
        .in('statut', ['Validée', 'Finalisée']);

      if (yearError) throw yearError;

      // Stats hier (pour comparaison)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
      const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();

      const { data: yesterdayData } = await supabase
        .from('ventes')
        .select('montant_net')
        .eq('tenant_id', tenantId)
        .gte('date_vente', startOfYesterday)
        .lte('date_vente', endOfYesterday)
        .in('statut', ['Validée', 'Finalisée']);

      // Calculs
      const totalAujourdhui = todayData?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
      const totalSemaine = weekData?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
      const totalMois = monthData?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
      const totalAnnee = yearData?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;

      const totalHier = yesterdayData?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;

      // Répartition par mode de paiement (aujourd'hui)
      const breakdown = {
        especes: 0,
        carte: 0,
        mobile: 0,
        assurance: 0,
      };

      todayData?.forEach((vente) => {
        const montant = vente.montant_net || 0;
        switch (vente.mode_paiement) {
          case 'Espèces':
            breakdown.especes += montant;
            break;
          case 'Carte Bancaire':
            breakdown.carte += montant;
            break;
          case 'Mobile Money':
            breakdown.mobile += montant;
            break;
          default:
            if (vente.montant_part_assurance) {
              breakdown.assurance += (vente.montant_part_assurance || 0);
            }
            break;
        }
      });

      const comparaisonHier = totalHier > 0 
        ? ((totalAujourdhui - totalHier) / totalHier) * 100 
        : 0;

      return {
        totalAujourdhui,
        totalSemaine,
        totalMois,
        totalAnnee,
        transactionCount: monthData?.length || 0,
        transactionCountToday: todayData?.length || 0,
        transactionCountWeek: weekData?.length || 0,
        transactionCountMonth: monthData?.length || 0,
        averageTransaction: todayData?.length ? totalAujourdhui / todayData.length : 0,
        paymentMethodBreakdown: breakdown,
        comparaisonHier,
        comparaisonSemaineDerniere: 0,
        comparaisonMoisDernier: 0,
      } as EncaissementStats;
    },
    enabled: !!tenantId,
    staleTime: 30000, // 30 secondes
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });

  // ==================== REQUÊTE : LISTE DES TRANSACTIONS ====================

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['encaissement-transactions', tenantId, filters, currentPage, pageSize],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      let query = supabase
        .from('ventes')
        .select(
          `
          *,
          client:clients!ventes_client_id_fkey(id, nom_complet, telephone, type_client),
          agent:personnel!ventes_agent_id_fkey(id, noms, prenoms),
          session_caisse:sessions_caisse!ventes_session_caisse_id_fkey(id, numero_session),
          lignes_ventes!lignes_ventes_vente_id_fkey(id)
        `,
          { count: 'exact' }
        )
        .eq('tenant_id', tenantId)
        .order('date_vente', { ascending: false });

      // Filtres
      if (filters.search) {
        query = query.or(
          `numero_vente.ilike.%${filters.search}%,reference_paiement.ilike.%${filters.search}%`
        );
      }

      if (filters.dateFrom) {
        query = query.gte('date_vente', filters.dateFrom);
      }

      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('date_vente', endDate.toISOString());
      }

      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        const methodMap: Record<string, any> = {
          cash: 'Espèces',
          card: 'Carte Bancaire',
          mobile: 'Mobile Money',
        };
        const method = methodMap[filters.paymentMethod];
        if (method) {
          query = query.eq('mode_paiement', method as any);
        }
      }

      if (filters.status && filters.status !== 'all') {
        const statusMap: Record<string, any> = {
          completed: 'Finalisée',
          pending: 'En cours',
          cancelled: 'Annulée',
          refunded: 'Remboursée',
        };
        const status = statusMap[filters.status];
        if (status) {
          query = query.eq('statut', status as any);
        }
      }

      if (filters.caisseId) {
        query = query.eq('caisse_id', filters.caisseId);
      }

      if (filters.sessionId) {
        query = query.eq('session_caisse_id', filters.sessionId);
      }

      // Pagination
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transformer les données
      const transactions: Transaction[] =
        data?.map((vente) => ({
          id: vente.id,
          numero_vente: vente.numero_vente,
          date_vente: vente.date_vente,
          client: vente.client,
          montant_net: vente.montant_net || 0,
          montant_total_ttc: vente.montant_total_ttc || 0,
          montant_total_ht: vente.montant_total_ht || 0,
          montant_tva: vente.montant_tva || 0,
          montant_remise: 0,
          mode_paiement: vente.mode_paiement,
          statut: vente.statut,
          agent: vente.agent,
          caisse: null,
          session_caisse: vente.session_caisse,
          nombre_articles: vente.lignes_ventes?.length || 0,
          montant_part_assurance: vente.montant_part_assurance,
          montant_part_patient: vente.montant_part_patient,
          reference_paiement: vente.reference_paiement,
        })) || [];

      return {
        transactions,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!tenantId,
    staleTime: 10000,
  });

  // ==================== REQUÊTE : DÉTAILS D'UNE TRANSACTION ====================

  const getTransactionDetails = async (transactionId: string): Promise<TransactionDetails | null> => {
    if (!tenantId) return null;

    const { data, error } = await supabase
      .from('ventes')
      .select(
        `
        *,
        client:clients!ventes_client_id_fkey(id, nom_complet, telephone, type_client),
        agent:personnel!ventes_agent_id_fkey(id, noms, prenoms),
        session_caisse:sessions_caisse!ventes_session_caisse_id_fkey(id, numero_session),
        lignes_ventes!lignes_ventes_vente_id_fkey(
          id,
          quantite,
          prix_unitaire_ttc,
          montant_ligne_ttc,
          produit:produits!lignes_ventes_produit_id_fkey(libelle_produit, code_cip)
        )
      `
      )
      .eq('id', transactionId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Erreur détails transaction:', error);
      return null;
    }

    return {
      id: data.id,
      numero_vente: data.numero_vente,
      date_vente: data.date_vente,
      client: data.client,
      montant_net: data.montant_net || 0,
      montant_total_ttc: data.montant_total_ttc || 0,
      montant_total_ht: data.montant_total_ht || 0,
      montant_tva: data.montant_tva || 0,
      montant_remise: 0,
      mode_paiement: data.mode_paiement,
      statut: data.statut,
      agent: data.agent,
      caisse: null,
      session_caisse: data.session_caisse,
      nombre_articles: data.lignes_ventes?.length || 0,
      lignes_ventes: (data.lignes_ventes || []).map((l: any) => ({
        id: l.id,
        produit: l.produit,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire_ttc || 0,
        montant_ligne: l.montant_ligne_ttc || 0,
        taux_remise: 0,
        montant_remise: 0,
      })),
      montant_part_assurance: data.montant_part_assurance,
      montant_part_patient: data.montant_part_patient,
      reference_paiement: data.reference_paiement,
    };
  };

  // ==================== EXPORTS ====================

  const exportToCSV = (data: Transaction[], filename: string = 'encaissements') => {
    const csvData = data.map((t) => ({
      'Numéro Vente': t.numero_vente,
      Date: new Date(t.date_vente).toLocaleString('fr-CG'),
      Client: t.client?.nom_complet || 'Client Ordinaire',
      'Montant (FCFA)': t.montant_net,
      'Mode de Paiement': t.mode_paiement,
      Statut: t.statut,
      Caissier: t.agent ? `${t.agent.prenoms} ${t.agent.noms}` : 'N/A',
      Caisse: t.caisse?.nom || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Encaissements');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);

    toast({
      title: 'Export réussi',
      description: 'Le fichier CSV a été téléchargé.',
    });
  };

  const exportToExcel = (data: Transaction[], filename: string = 'encaissements') => {
    const excelData = data.map((t) => ({
      'Numéro Vente': t.numero_vente,
      Date: new Date(t.date_vente).toLocaleString('fr-CG'),
      Client: t.client?.nom_complet || 'Client Ordinaire',
      'Montant Net (FCFA)': t.montant_net,
      'Montant HT (FCFA)': t.montant_total_ht,
      'TVA (FCFA)': t.montant_tva,
      'Remise (FCFA)': t.montant_remise,
      'Mode de Paiement': t.mode_paiement,
      Statut: t.statut,
      Caissier: t.agent ? `${t.agent.prenoms} ${t.agent.noms}` : 'N/A',
      Caisse: t.caisse?.nom || 'N/A',
      'Nombre Articles': t.nombre_articles,
      Référence: t.reference_paiement || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Encaissements');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: 'Export réussi',
      description: 'Le fichier Excel a été téléchargé.',
    });
  };

  const exportToPDF = (
    data: Transaction[],
    title: string = 'Rapport des Encaissements',
    filename: string = 'encaissements'
  ) => {
    const doc = new jsPDF();

    // En-tête
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-CG')}`, 14, 30);

    // Tableau
    const tableData = data.map((t) => [
      t.numero_vente,
      new Date(t.date_vente).toLocaleDateString('fr-CG'),
      t.client?.nom_complet || 'Client Ordinaire',
      `${t.montant_net.toLocaleString()} FCFA`,
      t.mode_paiement,
      t.statut,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['N° Vente', 'Date', 'Client', 'Montant', 'Mode Paiement', 'Statut']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: 'Export réussi',
      description: 'Le fichier PDF a été téléchargé.',
    });
  };

  // ==================== RAPPORTS ====================

  const generateRapportJournalier = async (date: Date) => {
    if (!tenantId) return;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('ventes')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date_vente', startOfDay.toISOString())
      .lte('date_vente', endOfDay.toISOString())
      .in('statut', ['Validée', 'Finalisée']);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le rapport journalier.',
        variant: 'destructive',
      });
      return;
    }

    exportToPDF(
      data as unknown as Transaction[],
      `Rapport Journalier - ${date.toLocaleDateString('fr-CG')}`,
      'rapport_journalier'
    );
  };

  const generateRapportHebdomadaire = async (startDate: Date, endDate: Date) => {
    if (!tenantId) return;

    const { data, error } = await supabase
      .from('ventes')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date_vente', startDate.toISOString())
      .lte('date_vente', endDate.toISOString())
      .in('statut', ['Validée', 'Finalisée']);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le rapport hebdomadaire.',
        variant: 'destructive',
      });
      return;
    }

    exportToExcel(data as unknown as Transaction[], 'rapport_hebdomadaire');
  };

  const generateRapportMensuel = async (year: number, month: number) => {
    if (!tenantId) return;

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const { data, error } = await supabase
      .from('ventes')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date_vente', startOfMonth.toISOString())
      .lte('date_vente', endOfMonth.toISOString())
      .in('statut', ['Validée', 'Finalisée']);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le rapport mensuel.',
        variant: 'destructive',
      });
      return;
    }

    exportToExcel(data as unknown as Transaction[], 'rapport_mensuel');
  };

  const generateRapportFiscal = async (startDate: Date, endDate: Date) => {
    if (!tenantId) return;

    const { data, error } = await supabase
      .from('ventes')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date_vente', startDate.toISOString())
      .lte('date_vente', endDate.toISOString())
      .in('statut', ['Validée', 'Finalisée']);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le rapport fiscal.',
        variant: 'destructive',
      });
      return;
    }

    exportToPDF(
      data as unknown as Transaction[],
      `Rapport Fiscal - ${startDate.toLocaleDateString('fr-CG')} au ${endDate.toLocaleDateString(
        'fr-CG'
      )}`,
      'rapport_fiscal'
    );
  };

  // ==================== RETOUR DU HOOK ====================

  return {
    // Données
    stats,
    transactions: transactionsData?.transactions || [],
    totalCount: transactionsData?.totalCount || 0,
    totalPages: transactionsData?.totalPages || 0,

    // Loading states
    isLoading: statsLoading || transactionsLoading,
    statsLoading,
    transactionsLoading,

    // Filtres et pagination
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,

    // Actions
    getTransactionDetails,
    refetchTransactions,
    exportToCSV: () => exportToCSV(transactionsData?.transactions || []),
    exportToExcel: () => exportToExcel(transactionsData?.transactions || []),
    exportToPDF: () => exportToPDF(transactionsData?.transactions || []),

    // Rapports
    generateRapportJournalier,
    generateRapportHebdomadaire,
    generateRapportMensuel,
    generateRapportFiscal,
  };
};
