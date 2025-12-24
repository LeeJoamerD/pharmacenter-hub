import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  Banknote, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Upload, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Plus,
  Eye,
  Link,
  Unlink,
  Settings,
  FileText,
  Trash2,
  Edit,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useBankingManager } from '@/hooks/useBankingManager';
import { useTransactionsPaginated, TransactionFilters } from '@/hooks/useTransactionsPaginated';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useRegionalSettings } from '@/hooks/useRegionalSettings';
import BankAccountDialog from '@/components/accounting/BankAccountDialog';
import BankTransactionDialog from '@/components/accounting/BankTransactionDialog';
import ReconciliationDialog from '@/components/accounting/ReconciliationDialog';
import CommitmentDialog from '@/components/accounting/CommitmentDialog';
import CategorizationRuleDialog from '@/components/accounting/CategorizationRuleDialog';
import TransactionDetailDialog from '@/components/accounting/TransactionDetailDialog';
import { isReconciled, formatReconciliationStatus, TRANSACTION_STATUS } from '@/constants/transactionStatus';
import TransactionCategoryDialog from '@/components/accounting/TransactionCategoryDialog';
import BankStatementImportDialog from '@/components/accounting/BankStatementImportDialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';

const BankingIntegration = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('comptes');
  const [syncInProgress, setSyncInProgress] = useState(false);
  
  // Filters
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState('date_transaction');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Debounce search
  const debouncedSearch = useDebounce(transactionSearch, 300);
  
  // Dialogs
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [reconciliationDialogOpen, setReconciliationDialogOpen] = useState(false);
  const [commitmentDialogOpen, setCommitmentDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedReconciliation, setSelectedReconciliation] = useState<any>(null);
  const [selectedCommitment, setSelectedCommitment] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [transactionForCategory, setTransactionForCategory] = useState<any>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [autoReconcileInProgress, setAutoReconcileInProgress] = useState(false);

  // Hooks
  const {
    bankAccounts,
    loadingAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    transactions,
    loadingTransactions,
    createTransaction,
    updateTransaction,
    reconciliations,
    loadingReconciliations,
    createReconciliation,
    updateReconciliation,
    categorizationRules,
    createCategorizationRule,
    updateCategorizationRule,
    deleteCategorizationRule,
    forecasts,
    createForecast,
    commitments,
    createCommitment,
    updateCommitment,
    alerts,
    createAlert,
    resolveAlert,
    parameters,
    updateParameters,
    regionalParams,
    getTotalBalance,
    calculateAccountBalance,
    getReconciliationRate,
    exportTransactionsExcel,
    generateBankJournalPDF,
    getBanksList
  } = useBankingManager();

  // Paginated transactions hook
  const transactionFilters: TransactionFilters = useMemo(() => ({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
    accountId: accountFilter,
    status: statusFilter,
    sortColumn,
    sortDirection,
    dateFrom,
    dateTo
  }), [currentPage, pageSize, debouncedSearch, accountFilter, statusFilter, sortColumn, sortDirection, dateFrom, dateTo]);

  const {
    transactions: paginatedTransactions,
    totalCount,
    totalPages,
    isLoading: loadingPaginatedTransactions,
    deleteTransaction,
    reconcileTransaction,
    categorizeTransaction
  } = useTransactionsPaginated(transactionFilters);

  const { formatAmount, getCurrencySymbol, getCurrencyCode } = useCurrencyFormatting();
  const { currency } = useRegionalSettings();

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter((t: any) => 
      t.date_transaction?.startsWith(today)
    );
    
    const totalCredits = transactions
      .filter((t: any) => t.type_transaction === 'credit')
      .reduce((sum: number, t: any) => sum + (t.montant || 0), 0);
    
    const totalDebits = transactions
      .filter((t: any) => t.type_transaction === 'debit')
      .reduce((sum: number, t: any) => sum + Math.abs(t.montant || 0), 0);
    
    const pendingReconciliations = transactions.filter(
      (t: any) => !isReconciled(t.statut_rapprochement)
    ).length;

    const connectedAccounts = bankAccounts.filter((a: any) => a.est_actif).length;
    const errorAccounts = bankAccounts.filter((a: any) => !a.est_actif).length;

    // Centime additionnel calculations
    const totalCentimeAdditionnel = transactions
      .filter((t: any) => t.montant_centime_additionnel)
      .reduce((sum: number, t: any) => sum + (t.montant_centime_additionnel || 0), 0);

    return {
      totalBalance: getTotalBalance(),
      connectedAccounts,
      errorAccounts,
      todayTransactions: todayTransactions.length,
      totalCredits,
      totalDebits,
      netFlow: totalCredits - totalDebits,
      pendingReconciliations,
      reconciliationRate: getReconciliationRate(),
      totalCentimeAdditionnel
    };
  }, [bankAccounts, transactions, getTotalBalance, getReconciliationRate]);

  // Cash flow data for charts
  const cashFlowData = useMemo(() => {
    const months: { [key: string]: { entrees: number; sorties: number; solde: number } } = {};
    
    transactions.forEach((t: any) => {
      if (!t.date_transaction) return;
      const monthKey = format(new Date(t.date_transaction), 'MMM', { locale: fr });
      if (!months[monthKey]) {
        months[monthKey] = { entrees: 0, sorties: 0, solde: 0 };
      }
      if (t.type_transaction === 'credit') {
        months[monthKey].entrees += t.montant || 0;
      } else {
        months[monthKey].sorties += Math.abs(t.montant || 0);
      }
      months[monthKey].solde = months[monthKey].entrees - months[monthKey].sorties;
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      ...data
    }));
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      if (accountFilter !== 'all' && t.compte_bancaire_id !== accountFilter) return false;
      if (statusFilter === 'matched' && !isReconciled(t.statut_rapprochement)) return false;
      if (statusFilter === 'unmatched' && isReconciled(t.statut_rapprochement)) return false;
      if (transactionSearch && !t.libelle?.toLowerCase().includes(transactionSearch.toLowerCase())) return false;
      return true;
    });
  }, [transactions, accountFilter, statusFilter, transactionSearch]);

  // Handlers
  const handleSyncAccounts = async () => {
    setSyncInProgress(true);
    // Simulate sync - in real implementation, would call bank API
    setTimeout(() => {
      setSyncInProgress(false);
    }, 2000);
  };

  const handleCreateAccount = () => {
    setSelectedAccount(null);
    setAccountDialogOpen(true);
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setAccountDialogOpen(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compte bancaire ?')) {
      await deleteBankAccount.mutateAsync(accountId);
    }
  };

  const handleAccountSubmit = async (data: any) => {
    if (selectedAccount) {
      await updateBankAccount.mutateAsync({ id: selectedAccount.id, ...data });
    } else {
      await createBankAccount.mutateAsync(data);
    }
    setAccountDialogOpen(false);
  };

  const handleCreateTransaction = () => {
    setSelectedTransaction(null);
    setTransactionDialogOpen(true);
  };

  const handleTransactionSubmit = async (data: any) => {
    if (selectedTransaction) {
      await updateTransaction.mutateAsync({ id: selectedTransaction.id, ...data });
    } else {
      await createTransaction.mutateAsync(data);
    }
    setTransactionDialogOpen(false);
    setTransactionDetailOpen(false);
  };

  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setTransactionDetailOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setTransactionDialogOpen(true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      await deleteTransaction.mutateAsync(transactionId);
      setTransactionDetailOpen(false);
    }
  };

  const handleReconcileTransaction = async (transactionId: string, categorie?: string) => {
    await reconcileTransaction.mutateAsync({ id: transactionId, generateAccounting: true, categorie });
    setTransactionDetailOpen(false);
  };

  const handleCategorizeTransaction = (transaction: any) => {
    setTransactionForCategory(transaction);
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = async (data: { categorie: string; generateAccounting: boolean }) => {
    if (transactionForCategory) {
      await categorizeTransaction.mutateAsync({
        id: transactionForCategory.id,
        categorie: data.categorie,
        generateAccounting: data.generateAccounting
      });
    }
    setCategoryDialogOpen(false);
    setTransactionForCategory(null);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    setCurrentPage(0); // Reset to first page on sort change
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleCreateReconciliation = () => {
    setSelectedReconciliation(null);
    setReconciliationDialogOpen(true);
  };

  const handleReconciliationSubmit = async (data: any) => {
    if (data.id) {
      // Update existing reconciliation
      await updateReconciliation.mutateAsync(data);
    } else {
      // Create new reconciliation
      await createReconciliation.mutateAsync(data);
    }
    setReconciliationDialogOpen(false);
    setSelectedReconciliation(null);
  };

  const handleAutoReconcile = async () => {
    const unmatched = transactions.filter((t: any) => !isReconciled(t.statut_rapprochement));
    
    if (unmatched.length === 0) {
      toast({ 
        title: "Rapprochement terminé", 
        description: "Toutes les transactions sont déjà rapprochées" 
      });
      return;
    }
    
    const confirmed = window.confirm(
      `Voulez-vous rapprocher automatiquement ${unmatched.length} transaction(s) ?\n\nUne écriture comptable sera générée pour chaque transaction.`
    );
    
    if (!confirmed) return;
    
    setAutoReconcileInProgress(true);
    let successCount = 0;
    let errorCount = 0;
    
    for (const transaction of unmatched) {
      try {
        await reconcileTransaction.mutateAsync({ 
          id: transaction.id, 
          generateAccounting: true 
        });
        successCount++;
      } catch (error) {
        errorCount++;
        console.error('Erreur rapprochement:', transaction.id, error);
      }
    }
    
    setAutoReconcileInProgress(false);
    
    toast({ 
      title: "Rapprochement automatique terminé", 
      description: `${successCount} transaction(s) rapprochée(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}` 
    });
  };

  const handleImportStatement = () => {
    setImportDialogOpen(true);
  };

  const handleImportTransactions = async (transactionsToImport: any[]) => {
    for (const transaction of transactionsToImport) {
      await createTransaction.mutateAsync(transaction);
    }
  };

  const handleViewReconciliation = (reconciliation: any) => {
    setSelectedReconciliation(reconciliation);
    setReconciliationDialogOpen(true);
  };

  const handleCreateCommitment = () => {
    setSelectedCommitment(null);
    setCommitmentDialogOpen(true);
  };

  const handleEditCommitment = (commitment: any) => {
    setSelectedCommitment(commitment);
    setCommitmentDialogOpen(true);
  };

  const handleCommitmentSubmit = async (data: any) => {
    if (selectedCommitment) {
      await updateCommitment.mutateAsync({ id: selectedCommitment.id, ...data });
    } else {
      await createCommitment.mutateAsync(data);
    }
    setCommitmentDialogOpen(false);
  };

  const handleCreateRule = () => {
    setSelectedRule(null);
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: any) => {
    setSelectedRule(rule);
    setRuleDialogOpen(true);
  };

  const handleRuleSubmit = async (data: any) => {
    if (selectedRule) {
      await updateCategorizationRule.mutateAsync({ id: selectedRule.id, ...data });
    } else {
      await createCategorizationRule.mutateAsync(data);
    }
    setRuleDialogOpen(false);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      await deleteCategorizationRule.mutateAsync(ruleId);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    await resolveAlert.mutateAsync(alertId);
  };

  const handleExportExcel = () => {
    exportTransactionsExcel(filteredTransactions);
  };

  const handleUpdateParameters = async (key: string, value: any) => {
    await updateParameters.mutateAsync({ [key]: value });
  };

  const getStatusBadge = (status: string | boolean) => {
    if (status === true || status === 'Connecté' || status === 'Rapproché') {
      return <Badge variant="default">Actif</Badge>;
    }
    if (status === false || status === 'Erreur') {
      return <Badge variant="destructive">Erreur</Badge>;
    }
    return <Badge variant="secondary">{String(status)}</Badge>;
  };

  const centimeRate = regionalParams?.seuil_alerte_bas ? 1 : 1; // Get from fiscal params if available

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Intégration Bancaire</h3>
          <p className="text-muted-foreground">
            Synchronisation bancaire et gestion de trésorerie • {regionalParams?.pays || 'Multi-localités'}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {getCurrencyCode()}
          </Badge>
          <Button onClick={handleSyncAccounts} disabled={syncInProgress} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
            {syncInProgress ? 'Synchronisation...' : 'Synchroniser'}
          </Button>
          <Button onClick={handleCreateAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Connecter Banque
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="comptes">Comptes</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="rapprochement">Rapprochement bancaire</TabsTrigger>
          <TabsTrigger value="tresorerie">Trésorerie</TabsTrigger>
          <TabsTrigger value="previsions">Prévisions</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* ==================== COMPTES TAB ==================== */}
        <TabsContent value="comptes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solde Total</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(stats.totalBalance)}</div>
                <p className="text-xs text-muted-foreground">{getCurrencyCode()} (équivalent)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comptes Connectés</CardTitle>
                <Link className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bankAccounts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.connectedAccounts} actif{stats.connectedAccounts > 1 ? 's' : ''}, {stats.errorAccounts} erreur{stats.errorAccounts > 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions Aujourd'hui</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayTransactions}</div>
                <p className="text-xs text-muted-foreground">opérations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rapprochement</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reconciliationRate}%</div>
                <p className="text-xs text-muted-foreground">Taux de rapprochement</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comptes Bancaires</CardTitle>
              <CardDescription>État de la synchronisation avec vos banques</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAccounts ? (
                <div className="text-center py-8 text-muted-foreground">Chargement des comptes...</div>
              ) : bankAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun compte bancaire configuré</p>
                  <Button className="mt-4" onClick={handleCreateAccount}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un compte
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Compte</TableHead>
                      <TableHead>Banque</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Solde</TableHead>
                      <TableHead>Dernière Sync</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{account.nom_compte}</p>
                            <p className="text-sm text-muted-foreground">{account.numero_compte}</p>
                          </div>
                        </TableCell>
                        <TableCell>{account.banque}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.type_compte || 'Courant'}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatAmount(calculateAccountBalance(account.id))}
                        </TableCell>
                        <TableCell className="text-sm">
                          {account.derniere_sync 
                            ? format(new Date(account.derniere_sync), 'dd/MM/yyyy HH:mm', { locale: fr })
                            : 'Jamais'
                          }
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(account.est_actif)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditAccount(account)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditAccount(account)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAccount(account.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TRANSACTIONS TAB ==================== */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Cartes de statistiques de rapprochement */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Éléments Rapprochés</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {transactions.filter((t: any) => isReconciled(t.statut_rapprochement)).length}
                </div>
                <Progress value={stats.reconciliationRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">{stats.reconciliationRate}% du total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">À Rapprocher</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{stats.pendingReconciliations}</div>
                <p className="text-xs text-destructive">Éléments en attente</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Écart Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(0)}</div>
                <p className="text-xs text-muted-foreground">À justifier</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transactions Récentes</CardTitle>
                <CardDescription>
                  {totalCount > 0 
                    ? `${totalCount} transaction${totalCount > 1 ? 's' : ''} au total`
                    : 'Dernières opérations synchronisées'
                  }
                </CardDescription>
              </div>
              <Button onClick={handleCreateTransaction}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Transaction
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filtres */}
                <div className="flex gap-4 flex-wrap">
                  <Input 
                    placeholder="Rechercher par libellé..." 
                    className="w-64"
                    value={transactionSearch}
                    onChange={(e) => {
                      setTransactionSearch(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                  <Input 
                    type="date" 
                    className="w-40"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setCurrentPage(0);
                    }}
                    placeholder="Date début"
                  />
                  <Input 
                    type="date" 
                    className="w-40"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setCurrentPage(0);
                    }}
                    placeholder="Date fin"
                  />
                  <Select value={accountFilter} onValueChange={(v) => { setAccountFilter(v); setCurrentPage(0); }}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par compte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les comptes</SelectItem>
                      {bankAccounts.map((account: any) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.banque} - {account.nom_compte}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as 'all' | 'matched' | 'unmatched'); setCurrentPage(0); }}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="matched">Rapprochées</SelectItem>
                      <SelectItem value="unmatched">Non rapprochées</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleExportExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter Excel
                  </Button>
                </div>

                {loadingPaginatedTransactions ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement des transactions...</div>
                ) : paginatedTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune transaction trouvée</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('date_transaction')}
                          >
                            <div className="flex items-center">
                              Date {getSortIcon('date_transaction')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('libelle')}
                          >
                            <div className="flex items-center">
                              Description {getSortIcon('libelle')}
                            </div>
                          </TableHead>
                          <TableHead>Compte</TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('montant')}
                          >
                            <div className="flex items-center">
                              Montant {getSortIcon('montant')}
                            </div>
                          </TableHead>
                          <TableHead>Centime Add.</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('statut_rapprochement')}
                          >
                            <div className="flex items-center">
                              Statut {getSortIcon('statut_rapprochement')}
                            </div>
                          </TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTransactions.map((transaction: any) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {transaction.date_transaction 
                                ? format(new Date(transaction.date_transaction), 'dd/MM/yyyy', { locale: fr })
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={transaction.libelle}>
                              {transaction.libelle}
                            </TableCell>
                            <TableCell className="text-sm">
                              {transaction.compte?.nom_compte || '-'}
                            </TableCell>
                            <TableCell className={`font-semibold ${
                              transaction.type_transaction === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type_transaction === 'credit' ? '+' : '-'}
                              {formatAmount(Math.abs(transaction.montant || 0))}
                            </TableCell>
                            <TableCell>
                              {transaction.montant_centime_additionnel ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Calculator className="h-3 w-3 mr-1" />
                                  {formatAmount(transaction.montant_centime_additionnel)}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.categorie || 'Non catégorisé'}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={isReconciled(transaction.statut_rapprochement) ? 'default' : 'destructive'}>
                                {formatReconciliationStatus(transaction.statut_rapprochement)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewTransaction(transaction)}
                                  title="Voir les détails"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditTransaction(transaction)}
                                  title="Modifier"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {!isReconciled(transaction.statut_rapprochement) && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleReconcileTransaction(transaction.id)}
                                    title="Rapprocher"
                                  >
                                    <Link className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Affichage de {currentPage * pageSize + 1} à {Math.min((currentPage + 1) * pageSize, totalCount)} sur {totalCount} transaction{totalCount > 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(0); }}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={currentPage === 0}
                          onClick={() => setCurrentPage(p => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Précédent
                        </Button>
                        <span className="text-sm px-2">
                          Page {currentPage + 1} sur {totalPages || 1}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={currentPage + 1 >= totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== RAPPROCHEMENT BANCAIRE TAB ==================== */}
        <TabsContent value="rapprochement" className="space-y-4">
          {/* Statistiques des sessions de rapprochement */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions Totales</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reconciliations.length}</div>
                <p className="text-xs text-muted-foreground">Sessions de rapprochement</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions Validées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reconciliations.filter((r: any) => r.statut === 'Validé').length}
                </div>
                <p className="text-xs text-muted-foreground">Rapprochements confirmés</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {reconciliations.filter((r: any) => r.statut !== 'Validé').length}
                </div>
                <p className="text-xs text-muted-foreground">À valider</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dernier Rapprochement</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reconciliations.length > 0 && reconciliations[0]?.date_fin
                    ? format(new Date(reconciliations[0].date_fin), 'dd/MM/yyyy', { locale: fr })
                    : '-'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Date de la dernière session</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rapprochement Bancaire</CardTitle>
                <CardDescription>Correspondance entre relevés bancaires et écritures comptables</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAutoReconcile}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rapprochement Auto
                </Button>
                <Button variant="outline" onClick={handleImportStatement}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer Relevé
                </Button>
                <Button variant="outline" onClick={handleCreateReconciliation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReconciliations ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : reconciliations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun rapprochement enregistré</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Utilisez le rapprochement automatique ou importez un relevé bancaire
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Compte</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Solde Banque</TableHead>
                      <TableHead>Solde Comptable</TableHead>
                      <TableHead>Écart</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliations.map((recon: any) => (
                      <TableRow key={recon.id}>
                        <TableCell>
                          {recon.date_rapprochement 
                            ? format(new Date(recon.date_rapprochement), 'dd/MM/yyyy', { locale: fr })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{recon.compte?.nom_compte || '-'}</TableCell>
                        <TableCell>
                          {recon.periode_debut && recon.periode_fin 
                            ? `${format(new Date(recon.periode_debut), 'dd/MM', { locale: fr })} - ${format(new Date(recon.periode_fin), 'dd/MM', { locale: fr })}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{formatAmount(recon.solde_releve || 0)}</TableCell>
                        <TableCell>{formatAmount(recon.solde_comptable || 0)}</TableCell>
                        <TableCell className={`font-semibold ${(recon.ecart || 0) !== 0 ? 'text-destructive' : ''}`}>
                          {(recon.ecart || 0) === 0 ? '-' : formatAmount(recon.ecart)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={recon.statut === 'Validé' ? 'default' : 'secondary'}>
                            {recon.statut || 'En cours'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewReconciliation(recon)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TRESORERIE TAB ==================== */}
        <TabsContent value="tresorerie" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trésorerie Actuelle</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(stats.totalBalance)}</div>
                <p className="text-xs text-muted-foreground">Solde consolidé</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entrées</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+{formatAmount(stats.totalCredits)}</div>
                <p className="text-xs text-muted-foreground">Ce mois</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sorties</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">-{formatAmount(stats.totalDebits)}</div>
                <p className="text-xs text-muted-foreground">Ce mois</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Centime Add. Perçu</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(stats.totalCentimeAdditionnel)}</div>
                <p className="text-xs text-muted-foreground">Total collecté</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Position de Trésorerie</CardTitle>
              <CardDescription>Vue consolidée des flux de trésorerie</CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlowData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number) => formatAmount(value)}
                      labelFormatter={(label) => `Mois: ${label}`}
                    />
                    <Area type="monotone" dataKey="entrees" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Entrées" />
                    <Area type="monotone" dataKey="sorties" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Sorties" />
                    <Line type="monotone" dataKey="solde" stroke="hsl(var(--accent))" strokeWidth={3} name="Solde Net" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Aucune donnée de trésorerie disponible</p>
                  <p className="text-sm mt-2">Les graphiques s'afficheront une fois les transactions enregistrées</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Flux de Trésorerie</CardTitle>
                <CardDescription>Analyse des mouvements mensuels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Entrées de Trésorerie</p>
                        <p className="text-sm text-muted-foreground">Ce mois</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">+{formatAmount(stats.totalCredits)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">Sorties de Trésorerie</p>
                        <p className="text-sm text-muted-foreground">Ce mois</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-red-600">-{formatAmount(stats.totalDebits)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                    <div>
                      <p className="font-bold">Flux Net</p>
                      <p className="text-sm text-muted-foreground">Résultat mensuel</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-xl ${stats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.netFlow >= 0 ? '+' : ''}{formatAmount(stats.netFlow)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes de Trésorerie</CardTitle>
                <CardDescription>Surveillance des seuils critiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Position Saine:</strong> Aucune alerte active
                      </AlertDescription>
                    </Alert>
                  ) : (
                    alerts.map((alert: any) => (
                      <Alert key={alert.id} variant={alert.niveau === 'Critique' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="flex justify-between items-center">
                          <div>
                            <strong>{alert.type_alerte}:</strong> {alert.message}
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => handleResolveAlert(alert.id)}>
                            Résoudre
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ))
                  )}
                  
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Seuils Configurés</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Seuil d'alerte bas:</span>
                        <span className="font-medium">{formatAmount(regionalParams?.seuil_alerte_bas || 1000000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seuil critique:</span>
                        <span className="font-medium">{formatAmount(regionalParams?.seuil_alerte_critique || 500000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trésorerie actuelle:</span>
                        <span className={`font-bold ${stats.totalBalance >= (regionalParams?.seuil_alerte_bas || 1000000) ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(stats.totalBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== PREVISIONS TAB ==================== */}
        <TabsContent value="previsions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prévisions de Trésorerie</CardTitle>
              <CardDescription>Projections basées sur l'historique et les engagements</CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlowData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number) => formatAmount(value)}
                      labelFormatter={(label) => `Mois: ${label}`}
                    />
                    <Line type="monotone" dataKey="solde" stroke="hsl(var(--primary))" strokeWidth={2} name="Solde Réel" />
                    <Line type="monotone" dataKey="entrees" stroke="hsl(var(--secondary))" strokeWidth={2} strokeDasharray="5 5" name="Prévision" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Aucune donnée de prévision disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Scénarios Prévisionnels</CardTitle>
                  <CardDescription>Analyse de différents scénarios</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => createForecast.mutate({
                  periode_debut: new Date().toISOString().split('T')[0],
                  periode_fin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  solde_initial_xaf: stats.totalBalance,
                  solde_final_previsionnel_xaf: stats.totalBalance * 1.05
                })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forecasts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun scénario configuré</p>
                      <p className="text-sm">Cliquez sur "Nouveau" pour créer un scénario</p>
                    </div>
                  ) : (
                    forecasts.map((forecast: any) => (
                      <div key={forecast.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className={`font-medium ${
                            forecast.type_scenario === 'Optimiste' ? 'text-green-600' :
                            forecast.type_scenario === 'Pessimiste' ? 'text-red-600' : ''
                          }`}>
                            {forecast.nom_scenario}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              forecast.type_scenario === 'Optimiste' ? 'default' :
                              forecast.type_scenario === 'Pessimiste' ? 'destructive' : 'secondary'
                            }>
                              {forecast.type_scenario}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              toast({ description: "Fonctionnalité de modification à venir" });
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              if (confirm("Supprimer ce scénario ?")) {
                                toast({ description: "Fonctionnalité de suppression à venir" });
                              }
                            }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{forecast.description || 'Aucune description'}</p>
                        <div className="flex justify-between">
                          <span>Trésorerie prévue:</span>
                          <span className="font-bold">{formatAmount(forecast.solde_prevu || 0)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Engagements à Venir</CardTitle>
                  <CardDescription>Échéances et flux prévisibles</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleCreateCommitment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {commitments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Aucun engagement enregistré</p>
                    </div>
                  ) : (
                    commitments.slice(0, 5).map((commitment: any) => (
                      <div key={commitment.id} className="flex justify-between items-center p-2 border rounded cursor-pointer hover:bg-muted/50" onClick={() => handleEditCommitment(commitment)}>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{commitment.libelle}</p>
                            <Badge variant={
                              commitment.statut === 'Payé' ? 'default' :
                              commitment.statut === 'Confirmé' ? 'secondary' :
                              commitment.statut === 'Annulé' ? 'destructive' : 'outline'
                            }>
                              {commitment.statut || 'Prévu'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {commitment.date_echeance 
                              ? format(new Date(commitment.date_echeance), 'dd/MM/yyyy', { locale: fr })
                              : '-'
                            }
                          </p>
                        </div>
                        <span className="font-bold text-foreground">
                          {formatAmount(commitment.montant_xaf || 0)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== CONFIGURATION TAB ==================== */}
        <TabsContent value="configuration" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Bancaire</CardTitle>
                <CardDescription>Paramètres de connexion aux banques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    La connexion bancaire nécessite l'activation d'APIs bancaires spécialisées
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Synchronisation automatique</Label>
                    <Switch 
                      checked={parameters?.synchronisation_auto || false}
                      onCheckedChange={(checked) => handleUpdateParameters('synchronisation_auto', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rapprochement auto</Label>
                    <Switch 
                      checked={parameters?.rapprochement_auto || false}
                      onCheckedChange={(checked) => handleUpdateParameters('rapprochement_auto', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Alertes trésorerie</Label>
                    <Switch 
                      checked={parameters?.alertes_actives || false}
                      onCheckedChange={(checked) => handleUpdateParameters('alertes_actives', checked)}
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="sync-frequency">Fréquence de synchronisation</Label>
                  <Select 
                    value={parameters?.frequence_sync || 'daily'}
                    onValueChange={(value) => handleUpdateParameters('frequence_sync', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Temps réel</SelectItem>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="manual">Manuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Règles de Catégorisation</CardTitle>
                  <CardDescription>Automatisation du classement des transactions</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleCreateRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {categorizationRules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Aucune règle configurée</p>
                    </div>
                  ) : (
                    categorizationRules.map((rule: any) => (
                      <div key={rule.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium">{rule.nom_regle}</p>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Si {rule.champ_condition} contient "{rule.valeur_condition}" → Catégorie "{rule.categorie_cible}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seuils et Alertes</CardTitle>
              <CardDescription>Configuration des alertes de trésorerie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="threshold-low">Seuil d'alerte bas ({getCurrencyCode()})</Label>
                  <Input 
                    id="threshold-low" 
                    type="number"
                    defaultValue={parameters?.seuil_alerte_bas_xaf || regionalParams?.seuil_alerte_bas || 1000000}
                    onBlur={(e) => handleUpdateParameters('seuil_alerte_bas_xaf', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="threshold-critical">Seuil critique ({getCurrencyCode()})</Label>
                  <Input 
                    id="threshold-critical" 
                    type="number"
                    defaultValue={parameters?.seuil_alerte_critique_xaf || regionalParams?.seuil_alerte_critique || 500000}
                    onBlur={(e) => handleUpdateParameters('seuil_alerte_critique_xaf', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="alert-email">Email d'alerte</Label>
                  <Input 
                    id="alert-email" 
                    type="email" 
                    defaultValue={parameters?.emails_alertes?.[0] || ''}
                    placeholder="tresorier@pharmacie.com"
                    onBlur={(e) => handleUpdateParameters('emails_alertes', [e.target.value])}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== DIALOGS ==================== */}
      <BankAccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        onSubmit={handleAccountSubmit}
        account={selectedAccount}
      />

      <BankTransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        onSubmit={handleTransactionSubmit}
        transaction={selectedTransaction}
        bankAccounts={bankAccounts}
      />

      <ReconciliationDialog
        open={reconciliationDialogOpen}
        onOpenChange={setReconciliationDialogOpen}
        onSubmit={handleReconciliationSubmit}
        reconciliation={selectedReconciliation}
        bankAccounts={bankAccounts}
      />

      <CommitmentDialog
        open={commitmentDialogOpen}
        onOpenChange={setCommitmentDialogOpen}
        onSubmit={handleCommitmentSubmit}
        commitment={selectedCommitment}
        bankAccounts={bankAccounts}
      />

      <CategorizationRuleDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        onSubmit={handleRuleSubmit}
        rule={selectedRule}
      />

      <TransactionDetailDialog
        open={transactionDetailOpen}
        onOpenChange={setTransactionDetailOpen}
        transaction={selectedTransaction}
        onEdit={() => {
          setTransactionDetailOpen(false);
          handleEditTransaction(selectedTransaction);
        }}
        onReconcile={() => selectedTransaction && handleReconcileTransaction(selectedTransaction.id)}
        onDelete={() => selectedTransaction && handleDeleteTransaction(selectedTransaction.id)}
      />

      <TransactionCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSubmit={handleCategorySubmit}
        transaction={transactionForCategory}
      />

      <BankStatementImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        bankAccounts={bankAccounts}
        onImport={handleImportTransactions}
      />
    </div>
  );
};

export default BankingIntegration;
