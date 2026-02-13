import React from 'react';
import SalesMetrics from './widgets/SalesMetrics';
import CashRegisterStatus from './widgets/CashRegisterStatus';
import QuickActions from './widgets/QuickActions';
import RecentTransactions from './widgets/RecentTransactions';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useDashboardVisibility, DashboardVisibilityToggle } from '@/components/dashboard/DashboardVisibilityToggle';

const SalesDashboard = () => {
  const { isVisible, toggleVisibility, hasDashboardPermission } = useDashboardVisibility();

  return (
    <div className="space-y-6">
      {/* En-tête avec toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tableau de Bord Ventes</h2>
        {hasDashboardPermission && (
          <Button onClick={toggleVisibility} variant="ghost" size="sm" className="gap-2">
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isVisible ? 'Masquer' : 'Afficher'}
          </Button>
        )}
      </div>

      {!hasDashboardPermission || !isVisible ? (
        <DashboardVisibilityToggle>
          <div />
        </DashboardVisibilityToggle>
      ) : (
        <>
          {/* Métriques principales */}
          <SalesMetrics />

          {/* État des caisses et actions rapides */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CashRegisterStatus />
            <QuickActions />
          </div>

          {/* Transactions récentes */}
          <RecentTransactions />
        </>
      )}
    </div>
  );
};

export default SalesDashboard;
