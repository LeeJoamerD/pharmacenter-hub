import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  paymentMethod: string;
  status: string;
  cashier: string;
  register: string;
  minAmount: string;
  maxAmount: string;
}

export interface Transaction {
  id: string;
  numero_vente: string;
  date_vente: string;
  montant_net: number;
  montant_total_ttc: number;
  montant_total_ht: number;
  montant_tva: number | null;
  remise_globale: number | null;
  mode_paiement: string | null;
  statut: string | null;
  client?: { nom_complet: string; telephone: string; email: string } | null;
  agent?: { noms: string; prenoms: string } | null;
  caisse?: { nom_caisse: string } | null;
  session_caisse?: { numero_session: string } | null;
  lignes_ventes?: Array<{
    produit: { libelle_produit: string };
    quantite: number;
    prix_unitaire_ttc: number;
    montant_ligne_ttc: number;
  }>;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  completedTransactions: number;
  pendingTransactions: number;
  averageTransaction: number;
  comparison: {
    transactionsChange: number;
    amountChange: number;
    averageChange: number;
  };
}

export const useTransactionHistory = (filters: TransactionFilters, currentPage: number, itemsPerPage: number, sortBy: string, sortOrder: 'asc' | 'desc') => {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les transactions avec filtres
  const { data: transactionsData, isLoading, refetch } = useQuery({
    queryKey: ['transaction-history', tenantId, filters, currentPage, sortBy, sortOrder],
    queryFn: async () => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage - 1;

      let query = supabase
        .from('ventes')
        .select(`
          *,
          client:client_id(nom_complet, telephone, email),
          agent:agent_id(noms, prenoms),
          caisse:caisse_id(nom_caisse),
          session_caisse:session_caisse_id(numero_session),
          lignes_ventes(
            quantite,
            prix_unitaire_ttc,
            montant_ligne_ttc,
            produit:produits!lignes_ventes_produit_id_fkey(libelle_produit)
          )
        `, { count: 'exact' })
        .eq('tenant_id', tenantId!)
        .range(startIndex, endIndex);

      // Filtres
      if (filters.search) {
        query = query.or(`numero_vente.ilike.%${filters.search}%,client.nom_complet.ilike.%${filters.search}%`);
      }
      if (filters.dateFrom) {
        query = query.gte('date_vente', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date_vente', `${filters.dateTo}T23:59:59`);
      }
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('mode_paiement', filters.paymentMethod as any);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('statut', filters.status as any);
      }
      if (filters.cashier && filters.cashier !== 'all') {
        query = query.eq('agent_id', filters.cashier);
      }
      if (filters.register && filters.register !== 'all') {
        query = query.eq('caisse_id', filters.register);
      }
      if (filters.minAmount) {
        query = query.gte('montant_net', parseFloat(filters.minAmount));
      }
      if (filters.maxAmount) {
        query = query.lte('montant_net', parseFloat(filters.maxAmount));
      }

      // Tri
      const sortColumn = sortBy === 'date' ? 'date_vente' : sortBy === 'amount' ? 'montant_net' : 'numero_vente';
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query;
      if (error) throw error;

      return { transactions: data || [], total: count || 0 };
    },
    enabled: !!tenantId,
  });

  // Statistiques globales avec comparaison période
  const { data: stats } = useQuery({
    queryKey: ['transaction-stats', tenantId, filters],
    queryFn: async () => {
      let currentQuery = supabase
        .from('ventes')
        .select('montant_net, statut, date_vente')
        .eq('tenant_id', tenantId!);

      if (filters.dateFrom) currentQuery = currentQuery.gte('date_vente', filters.dateFrom);
      if (filters.dateTo) currentQuery = currentQuery.lte('date_vente', `${filters.dateTo}T23:59:59`);

      const { data: currentData, error: currentError } = await currentQuery;
      if (currentError) throw currentError;

      // Période précédente pour comparaison
      let previousQuery = supabase
        .from('ventes')
        .select('montant_net, statut, date_vente')
        .eq('tenant_id', tenantId!);

      if (filters.dateFrom && filters.dateTo) {
        const daysDiff = Math.ceil((new Date(filters.dateTo).getTime() - new Date(filters.dateFrom).getTime()) / (1000 * 60 * 60 * 24));
        const previousEnd = new Date(filters.dateFrom);
        previousEnd.setDate(previousEnd.getDate() - 1);
        const previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - daysDiff);
        
        previousQuery = previousQuery
          .gte('date_vente', previousStart.toISOString().split('T')[0])
          .lte('date_vente', previousEnd.toISOString().split('T')[0] + 'T23:59:59');
      }

      const { data: previousData } = await previousQuery;

      const totalAmount = currentData?.reduce((sum, t) => sum + Number(t.montant_net), 0) || 0;
      const totalTransactions = currentData?.length || 0;
      const completed = currentData?.filter(t => t.statut === 'Validée' || t.statut === 'Finalisée').length || 0;
      const pending = currentData?.filter(t => t.statut === 'En cours').length || 0;
      const average = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

      const prevAmount = previousData?.reduce((sum, t) => sum + Number(t.montant_net), 0) || 0;
      const prevCount = previousData?.length || 0;
      const prevAverage = prevCount > 0 ? prevAmount / prevCount : 0;

      return {
        totalTransactions,
        totalAmount,
        completedTransactions: completed,
        pendingTransactions: pending,
        averageTransaction: average,
        comparison: {
          transactionsChange: prevCount > 0 ? ((totalTransactions - prevCount) / prevCount) * 100 : 0,
          amountChange: prevAmount > 0 ? ((totalAmount - prevAmount) / prevAmount) * 100 : 0,
          averageChange: prevAverage > 0 ? ((average - prevAverage) / prevAverage) * 100 : 0,
        }
      } as TransactionStats;
    },
    enabled: !!tenantId,
  });

  // Répartition des modes de paiement
  const { data: paymentBreakdown } = useQuery({
    queryKey: ['payment-breakdown', tenantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('ventes')
        .select('mode_paiement, montant_net')
        .eq('tenant_id', tenantId!);

      if (filters.dateFrom) query = query.gte('date_vente', filters.dateFrom);
      if (filters.dateTo) query = query.lte('date_vente', `${filters.dateTo}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;

      const breakdown: Record<string, { count: number; total: number }> = {};
      data?.forEach(t => {
        const method = t.mode_paiement || 'Non spécifié';
        if (!breakdown[method]) {
          breakdown[method] = { count: 0, total: 0 };
        }
        breakdown[method].count++;
        breakdown[method].total += Number(t.montant_net);
      });

      return Object.entries(breakdown).map(([name, value]) => ({
        name,
        value: value.total,
        count: value.count
      }));
    },
    enabled: !!tenantId,
  });

  // Performance des caissiers
  const { data: cashierPerformance } = useQuery({
    queryKey: ['cashier-performance', tenantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('ventes')
        .select(`
          agent_id,
          montant_net,
          agent:agent_id(noms, prenoms)
        `)
        .eq('tenant_id', tenantId!)
        .not('agent_id', 'is', null);

      if (filters.dateFrom) query = query.gte('date_vente', filters.dateFrom);
      if (filters.dateTo) query = query.lte('date_vente', `${filters.dateTo}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;

      const performance: Record<string, { name: string; sales: number; count: number }> = {};
      data?.forEach((t: any) => {
        const agentId = t.agent_id;
        if (!performance[agentId]) {
          performance[agentId] = {
            name: t.agent ? `${t.agent.noms} ${t.agent.prenoms}` : 'Inconnu',
            sales: 0,
            count: 0
          };
        }
        performance[agentId].sales += Number(t.montant_net);
        performance[agentId].count++;
      });

      return Object.values(performance).sort((a, b) => b.sales - a.sales).slice(0, 10);
    },
    enabled: !!tenantId,
  });

  // Performance des caisses
  const { data: registerPerformance } = useQuery({
    queryKey: ['register-performance', tenantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('ventes')
        .select(`
          caisse_id,
          montant_net,
          caisse:caisse_id(nom_caisse)
        `)
        .eq('tenant_id', tenantId!)
        .not('caisse_id', 'is', null);

      if (filters.dateFrom) query = query.gte('date_vente', filters.dateFrom);
      if (filters.dateTo) query = query.lte('date_vente', `${filters.dateTo}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;

      const performance: Record<string, { name: string; sales: number; count: number }> = {};
      data?.forEach((t: any) => {
        const caisseId = t.caisse_id;
        if (!performance[caisseId]) {
          performance[caisseId] = {
            name: t.caisse?.nom_caisse || 'Inconnu',
            sales: 0,
            count: 0
          };
        }
        performance[caisseId].sales += Number(t.montant_net);
        performance[caisseId].count++;
      });

      return Object.values(performance).sort((a, b) => b.sales - a.sales);
    },
    enabled: !!tenantId,
  });

  // Évolution des ventes (par jour)
  const { data: salesEvolution } = useQuery({
    queryKey: ['sales-evolution', tenantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('ventes')
        .select('date_vente, montant_net')
        .eq('tenant_id', tenantId!);

      if (filters.dateFrom) query = query.gte('date_vente', filters.dateFrom);
      if (filters.dateTo) query = query.lte('date_vente', `${filters.dateTo}T23:59:59`);
      
      query = query.order('date_vente', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      const evolution: Record<string, { sales: number; count: number }> = {};
      data?.forEach(t => {
        const date = t.date_vente?.split('T')[0] || '';
        if (!evolution[date]) {
          evolution[date] = { sales: 0, count: 0 };
        }
        evolution[date].sales += Number(t.montant_net);
        evolution[date].count++;
      });

      return Object.entries(evolution).map(([date, value]) => ({
        date,
        sales: value.sales,
        transactions: value.count
      }));
    },
    enabled: !!tenantId,
  });

  // Distribution horaire
  const { data: hourlyDistribution } = useQuery({
    queryKey: ['hourly-distribution', tenantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('ventes')
        .select('date_vente, montant_net')
        .eq('tenant_id', tenantId!);

      if (filters.dateFrom) query = query.gte('date_vente', filters.dateFrom);
      if (filters.dateTo) query = query.lte('date_vente', `${filters.dateTo}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;

      const distribution: Record<number, { sales: number; count: number }> = {};
      for (let i = 0; i < 24; i++) {
        distribution[i] = { sales: 0, count: 0 };
      }

      data?.forEach(t => {
        if (t.date_vente) {
          const hour = new Date(t.date_vente).getHours();
          distribution[hour].sales += Number(t.montant_net);
          distribution[hour].count++;
        }
      });

      return Object.entries(distribution).map(([hour, value]) => ({
        hour: `${hour}h`,
        sales: value.sales,
        transactions: value.count
      }));
    },
    enabled: !!tenantId,
  });

  // Annuler une transaction
  const cancelTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('ventes')
        .update({ statut: 'Annulée' as any })
        .eq('id', transactionId)
        .eq('tenant_id', tenantId!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-history'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      toast({
        title: 'Transaction annulée',
        description: 'La transaction a été annulée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Export Excel
  const exportToExcel = async () => {
    try {
      const { data, error } = await supabase
        .from('ventes')
        .select(`
          numero_vente,
          date_vente,
          montant_net,
          montant_total_ttc,
          montant_total_ht,
          remise_globale,
          mode_paiement,
          statut,
          client:client_id(nom_complet, telephone),
          agent:agent_id(noms, prenoms),
          caisse:caisse_id(nom_caisse)
        `)
        .eq('tenant_id', tenantId!);

      if (error) throw error;

      const exportData = data?.map((t: any) => ({
        'Numéro': t.numero_vente,
        'Date': new Date(t.date_vente).toLocaleString('fr-FR'),
        'Client': t.client?.nom_complet || 'Anonyme',
        'Téléphone': t.client?.telephone || '-',
        'Montant HT': t.montant_total_ht,
        'Montant TTC': t.montant_total_ttc,
        'Montant Net': t.montant_net,
        'Remise': t.remise_globale || 0,
        'Mode Paiement': t.mode_paiement,
        'Statut': t.statut,
        'Caissier': t.agent ? `${t.agent.noms} ${t.agent.prenoms}` : '-',
        'Caisse': t.caisse?.nom_caisse || '-'
      })) || [];

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Historique Transactions');
      XLSX.writeFile(wb, `historique-transactions-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Export réussi',
        description: 'Les transactions ont été exportées au format Excel',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur d\'export',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Export PDF
  const exportToPDF = async () => {
    try {
      const { data, error } = await supabase
        .from('ventes')
        .select(`
          numero_vente,
          date_vente,
          montant_net,
          mode_paiement,
          statut,
          client:client_id(nom_complet),
          agent:agent_id(noms, prenoms)
        `)
        .eq('tenant_id', tenantId!)
        .limit(100);

      if (error) throw error;

      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(18);
      doc.text('Historique des Transactions', 14, 20);
      doc.setFontSize(10);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);

      // Tableau
      autoTable(doc, {
        startY: 35,
        head: [['Numéro', 'Date', 'Client', 'Montant', 'Paiement', 'Statut', 'Caissier']],
        body: data?.map((t: any) => [
          t.numero_vente,
          new Date(t.date_vente).toLocaleDateString('fr-FR'),
          t.client?.nom_complet || 'Anonyme',
          `${t.montant_net} FCFA`,
          t.mode_paiement,
          t.statut,
          t.agent ? `${t.agent.noms} ${t.agent.prenoms}` : '-'
        ]) || [],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      doc.save(`historique-transactions-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'Export réussi',
        description: 'Les transactions ont été exportées au format PDF',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur d\'export',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    transactions: transactionsData?.transactions || [],
    total: transactionsData?.total || 0,
    stats,
    paymentBreakdown,
    cashierPerformance,
    registerPerformance,
    salesEvolution,
    hourlyDistribution,
    isLoading,
    refetch,
    cancelTransaction: cancelTransaction.mutate,
    exportToExcel,
    exportToPDF,
  };
};
