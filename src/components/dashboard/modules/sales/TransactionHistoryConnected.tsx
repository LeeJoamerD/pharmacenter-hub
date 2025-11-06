import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  History, 
  Download, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  BarChart3,
  Clock,
  FileText
} from 'lucide-react';
import { useTransactionHistory, Transaction } from '@/hooks/useTransactionHistory';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

// Composants auxiliaires
import TransactionDetailsModal from './history/TransactionDetailsModal';
import TransactionFiltersPanel from './history/TransactionFiltersPanel';
import TransactionStatisticsCards from './history/TransactionStatisticsCards';
import SalesEvolutionChart from './history/SalesEvolutionChart';
import PaymentMethodChart from './history/PaymentMethodChart';
import CashierPerformanceChart from './history/CashierPerformanceChart';
import RegisterPerformanceChart from './history/RegisterPerformanceChart';
import HourlyDistributionChart from './history/HourlyDistributionChart';
import TransactionTimeline from './history/TransactionTimeline';

const TransactionHistoryConnected = () => {
  const { tenantId } = useTenant();
  const { formatPrice } = useCurrency();

  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all',
    status: 'all',
    cashier: 'all',
    register: 'all',
    minAmount: '',
    maxAmount: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'reference'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Hook principal
  const {
    transactions,
    total,
    stats,
    paymentBreakdown,
    cashierPerformance,
    registerPerformance,
    salesEvolution,
    hourlyDistribution,
    isLoading,
    refetch,
    cancelTransaction,
    exportToExcel,
    exportToPDF,
  } = useTransactionHistory(filters, currentPage, itemsPerPage, sortBy, sortOrder);

  // Récupérer les caissiers pour les filtres
  const { data: cashiers } = useQuery({
    queryKey: ['cashiers', tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('personnel')
        .select('id, noms, prenoms')
        .eq('tenant_id', tenantId!)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Récupérer les caisses pour les filtres
  const { data: registers } = useQuery({
    queryKey: ['registers', tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('caisses')
        .select('id, nom')
        .eq('tenant_id', tenantId!);
      return data || [];
    },
    enabled: !!tenantId,
  });

  const handleSort = (field: 'date' | 'amount' | 'reference') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsModalOpen(true);
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    
    const variants = {
      'Validée': 'default',
      'Finalisée': 'default',
      'En cours': 'secondary',
      'Annulée': 'destructive',
      'Remboursée': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <TransactionStatisticsCards stats={stats} />

      {/* Onglets principaux */}
      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analyses
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Rapports
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Onglet Liste */}
        <TabsContent value="list" className="space-y-6">
          {/* Filtres */}
          <TransactionFiltersPanel 
            filters={filters}
            onFilterChange={setFilters}
            cashiers={cashiers}
            registers={registers}
          />

          {/* Tableau */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transactions</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <Download className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF}>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('reference')}>
                        <div className="flex items-center gap-1">
                          Référence
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                        <div className="flex items-center gap-1">
                          Date
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                        <div className="flex items-center gap-1">
                          Montant
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Caissier</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Aucune transaction trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.numero_vente}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(transaction.date_vente).toLocaleDateString('fr-FR')}</div>
                              <div className="text-muted-foreground text-xs">
                                {new Date(transaction.date_vente).toLocaleTimeString('fr-FR')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.client?.nom_complet || 'Anonyme'}
                          </TableCell>
                          <TableCell>{transaction.mode_paiement}</TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(transaction.montant_net)}
                          </TableCell>
                          <TableCell>
                            {transaction.agent ? `${transaction.agent.noms} ${transaction.agent.prenoms}` : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.statut)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewDetails(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages} ({total} transactions au total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Analyses */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <SalesEvolutionChart data={salesEvolution} />
            <PaymentMethodChart data={paymentBreakdown} />
            <CashierPerformanceChart data={cashierPerformance} />
            <RegisterPerformanceChart data={registerPerformance} />
            <HourlyDistributionChart data={hourlyDistribution} />
          </div>
        </TabsContent>

        {/* Onglet Timeline */}
        <TabsContent value="timeline">
          <TransactionTimeline 
            transactions={transactions}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        {/* Onglet Rapports */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Générateur de rapports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Utilisez les filtres ci-dessus pour personnaliser votre rapport, puis exportez-le dans le format souhaité.
              </p>
              <div className="flex gap-4">
                <Button onClick={exportToExcel} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter en Excel
                </Button>
                <Button onClick={exportToPDF} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter en PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal détails */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onCancel={cancelTransaction}
      />
    </div>
  );
};

export default TransactionHistoryConnected;
