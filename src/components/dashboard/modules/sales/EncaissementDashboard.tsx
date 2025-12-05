import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Smartphone,
  Building2,
  Calendar,
  Filter,
  Download,
  Eye,
  Search,
  Loader2,
  TrendingDown
} from 'lucide-react';

import { useEncaissements } from '@/hooks/useEncaissements';
import TransactionDetailsModal from './encaissements/TransactionDetailsModal';
import PaymentBreakdownChart from './encaissements/PaymentBreakdownChart';
import SalesEvolutionChart from './encaissements/SalesEvolutionChart';
import ReportGenerator from './encaissements/ReportGenerator';

const EncaissementDashboard = () => {
  const {
    stats,
    transactions,
    totalCount,
    totalPages,
    isLoading,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    getTransactionDetails,
    exportToCSV,
    exportToExcel,
    exportToPDF,
    generateRapportJournalier,
    generateRapportHebdomadaire,
    generateRapportMensuel,
    generateRapportFiscal,
  } = useEncaissements();

  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleViewDetails = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setDetailsModalOpen(true);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    switch (format) {
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
    }
  };

  const getPaymentMethodIcon = (method: string | null | undefined) => {
    if (!method) return <Receipt className="h-4 w-4 text-muted-foreground" />;
    
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes('espèce')) return <DollarSign className="h-4 w-4" />;
    if (lowerMethod.includes('carte')) return <CreditCard className="h-4 w-4" />;
    if (lowerMethod.includes('mobile')) return <Smartphone className="h-4 w-4" />;
    if (lowerMethod.includes('assurance')) return <Building2 className="h-4 w-4" />;
    return <Receipt className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Finalisée: 'default',
      Validée: 'default',
      'En cours': 'secondary',
      'En attente': 'secondary',
      Annulée: 'destructive',
      Remboursée: 'outline',
    };

    const labels: Record<string, string> = {
      Finalisée: 'Terminé',
      Validée: 'Validé',
      'En cours': 'En cours',
      'En attente': 'En attente',
      Annulée: 'Annulé',
      Remboursée: 'Remboursé',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-CG')} FCFA`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-CG', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      <TransactionDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        transactionId={selectedTransactionId}
        onFetchDetails={getTransactionDetails}
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aujourd'hui</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(stats?.totalAujourdhui || 0)}
                </div>
                <p className="text-xs flex items-center gap-1 text-muted-foreground">
                  {stats?.comparaisonHier && stats.comparaisonHier > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">
                        +{stats.comparaisonHier.toFixed(1)}%
                      </span>
                    </>
                  ) : stats?.comparaisonHier && stats.comparaisonHier < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">
                        {stats.comparaisonHier.toFixed(1)}%
                      </span>
                    </>
                  ) : null}
                  par rapport à hier
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Semaine</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(stats?.totalSemaine || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.transactionCountWeek || 0} transactions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mois</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(stats?.totalMois || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.transactionCountMonth || 0} transactions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(stats?.averageTransaction || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Moyenne du jour
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="summary">Résumé</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres et Recherche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="N° vente, client, référence..."
                      value={filters.search}
                      onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mode de Paiement</Label>
                  <Select
                    value={filters.paymentMethod}
                    onValueChange={(value) =>
                      setFilters({ ...filters, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="card">Carte Bancaire</SelectItem>
                      <SelectItem value="mobile">Mobile Money</SelectItem>
                      <SelectItem value="insurance">Assurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="completed">Finalisé</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                      <SelectItem value="refunded">Remboursé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Période</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, dateFrom: e.target.value })
                      }
                      placeholder="Du"
                    />
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters({ ...filters, dateTo: e.target.value })
                      }
                      placeholder="Au"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Liste des Transactions ({totalCount})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Afficher</Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune transaction trouvée
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(transaction.mode_paiement)}
                            <div>
                              <p className="font-medium">
                                {transaction.client?.nom_complet ||
                                  'Client Ordinaire'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(transaction.date_vente)} •{' '}
                                {transaction.numero_vente}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              {formatCurrency(transaction.montant_net)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.nombre_articles} article(s)
                            </p>
                          </div>

                          {getStatusBadge(transaction.statut)}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(transaction.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} sur {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          ) : (
            <PaymentBreakdownChart
              breakdown={stats?.paymentMethodBreakdown || {
                especes: 0,
                carte: 0,
                mobile: 0,
                assurance: 0,
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportGenerator
            onGenerateDaily={generateRapportJournalier}
            onGenerateWeekly={generateRapportHebdomadaire}
            onGenerateMonthly={generateRapportMensuel}
            onGenerateFiscal={generateRapportFiscal}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EncaissementDashboard;