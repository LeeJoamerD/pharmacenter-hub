import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Receipt, BarChart3 } from 'lucide-react';
import { useCashExpenses } from '@/hooks/useCashExpenses';
import ExpensesFiltersPanel from './expenses/ExpensesFiltersPanel';
import ExpensesTable from './expenses/ExpensesTable';
import ExpenseEditModal from './expenses/ExpenseEditModal';
import ExpenseCancelConfirmDialog from './expenses/ExpenseCancelConfirmDialog';
import ExpenseStatisticsCards from './expenses/ExpenseStatisticsCards';
import ExpenseByCategoryChart from './expenses/ExpenseByCategoryChart';
import type { CashExpense } from '@/hooks/useCashExpenses';

const CashExpensesManager = () => {
  const {
    expenses,
    loading,
    filters,
    setFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    currentUserRole,
    getPermissions,
    updateExpense,
    cancelExpense,
    getStatistics,
    refreshExpenses
  } = useCashExpenses();

  const [editingExpense, setEditingExpense] = useState<CashExpense | null>(null);
  const [cancellingExpense, setCancellingExpense] = useState<CashExpense | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshExpenses();
    setIsRefreshing(false);
  };

  const handleEdit = (expense: CashExpense) => {
    setEditingExpense(expense);
  };

  const handleCancel = (expense: CashExpense) => {
    setCancellingExpense(expense);
  };

  const handleEditSubmit = async (data: { montant: number; description: string; motif: string }) => {
    if (!editingExpense) return;
    const success = await updateExpense(editingExpense.id, data);
    if (success) {
      setEditingExpense(null);
    }
  };

  const handleCancelConfirm = async (motif: string) => {
    if (!cancellingExpense) return;
    const success = await cancelExpense(cancellingExpense.id, motif);
    if (success) {
      setCancellingExpense(null);
    }
  };

  const statistics = getStatistics();

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
          disabled={isRefreshing || loading}
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
            filters={filters}
            onFiltersChange={setFilters}
            currentUserRole={currentUserRole}
          />

          <Card>
            <CardHeader>
              <CardTitle>Liste des dépenses</CardTitle>
              <CardDescription>
                {expenses.length} dépense(s) trouvée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpensesTable
                expenses={expenses}
                loading={loading}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={(field) => {
                  if (field === sortField) {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField(field);
                    setSortDirection('desc');
                  }
                }}
                getPermissions={getPermissions}
                onEdit={handleEdit}
                onCancel={handleCancel}
              />
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

      {/* Modal de modification */}
      <ExpenseEditModal
        expense={editingExpense}
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onSubmit={handleEditSubmit}
      />

      {/* Dialog de confirmation d'annulation */}
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
