import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Receipt, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCashExpenses } from '@/hooks/useCashExpenses';
import { useCashExpenseSearch } from '@/hooks/useCashExpenseSearch';
import { exportCashExpensesToExcel, exportCashExpensesToPDF } from '@/utils/cashExpenseExports';
import ExpensesFiltersPanel from './expenses/ExpensesFiltersPanel';
import ExpensesTable from './expenses/ExpensesTable';
import ExpenseEditModal from './expenses/ExpenseEditModal';
import ExpenseCancelConfirmDialog from './expenses/ExpenseCancelConfirmDialog';
import ExpenseStatisticsCards from './expenses/ExpenseStatisticsCards';
import ExpenseByCategoryChart from './expenses/ExpenseByCategoryChart';
import type { CashExpense } from '@/hooks/useCashExpenses';

const CashExpensesManager = () => {
  // Search hook for the list tab (server-side filtering + pagination)
  const searchHook = useCashExpenseSearch();

  // Original hook for statistics + mutations
  const statsHook = useCashExpenses();

  const [editingExpense, setEditingExpense] = useState<CashExpense | null>(null);
  const [cancellingExpense, setCancellingExpense] = useState<CashExpense | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([searchHook.refresh(), statsHook.refreshExpenses()]);
    setIsRefreshing(false);
  };

  const handleEdit = (expense: CashExpense) => setEditingExpense(expense);
  const handleCancel = (expense: CashExpense) => setCancellingExpense(expense);

  const handleEditSubmit = async (data: { montant: number; description: string; motif: string }) => {
    if (!editingExpense) return;
    const success = await statsHook.updateExpense(editingExpense.id, data);
    if (success) {
      setEditingExpense(null);
      searchHook.refresh();
    }
  };

  const handleCancelConfirm = async (motif: string) => {
    if (!cancellingExpense) return;
    const success = await statsHook.cancelExpense(cancellingExpense.id, motif);
    if (success) {
      setCancellingExpense(null);
      searchHook.refresh();
    }
  };

  const handleExportExcel = async () => {
    const data = await searchHook.fetchAllForExport();
    if (data.length > 0) exportCashExpensesToExcel(data);
  };

  const handleExportPDF = async () => {
    const data = await searchHook.fetchAllForExport();
    if (data.length > 0) exportCashExpensesToPDF(data);
  };

  const statistics = statsHook.getStatistics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Dépenses de Caisse</h3>
          <p className="text-muted-foreground">
            Gérez et suivez toutes les dépenses effectuées depuis les caisses
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || searchHook.loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Liste des dépenses
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <ExpensesFiltersPanel
            filters={searchHook.filters}
            onFiltersChange={searchHook.updateFilters}
            onReset={searchHook.resetFilters}
            currentUserRole={searchHook.currentUserRole}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            exportLoading={searchHook.exportLoading}
          />

          <Card>
            <CardHeader>
              <CardTitle>Liste des dépenses</CardTitle>
              <CardDescription>
                {searchHook.totalCount} dépense(s) trouvée(s)
                {searchHook.totalPages > 1 && ` — Page ${searchHook.page}/${searchHook.totalPages}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpensesTable
                expenses={searchHook.expenses}
                loading={searchHook.loading}
                sortField={searchHook.sortField}
                sortDirection={searchHook.sortDirection}
                onSortChange={(field) => {
                  if (field === searchHook.sortField) {
                    searchHook.setSortDirection(searchHook.sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    searchHook.setSortField(field);
                    searchHook.setSortDirection('desc');
                  }
                }}
                getPermissions={searchHook.getPermissions}
                onEdit={handleEdit}
                onCancel={handleCancel}
              />

              {/* Pagination */}
              {searchHook.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage {((searchHook.page - 1) * searchHook.pageSize) + 1} - {Math.min(searchHook.page * searchHook.pageSize, searchHook.totalCount)} sur {searchHook.totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => searchHook.setPage(searchHook.page - 1)}
                      disabled={searchHook.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {searchHook.page} / {searchHook.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => searchHook.setPage(searchHook.page + 1)}
                      disabled={searchHook.page >= searchHook.totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <ExpenseStatisticsCards statistics={statistics} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseByCategoryChart data={statistics.byMotif} />
          </div>
        </TabsContent>
      </Tabs>

      <ExpenseEditModal
        expense={editingExpense}
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onSubmit={handleEditSubmit}
      />

      <ExpenseCancelConfirmDialog
        expense={cancellingExpense}
        open={!!cancellingExpense}
        onClose={() => setCancellingExpense(null)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
};

export default CashExpensesManager;
