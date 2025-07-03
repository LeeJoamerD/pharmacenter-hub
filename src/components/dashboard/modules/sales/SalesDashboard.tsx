import React from 'react';
import SalesMetrics from './widgets/SalesMetrics';
import CashRegisterStatus from './widgets/CashRegisterStatus';
import QuickActions from './widgets/QuickActions';
import RecentTransactions from './widgets/RecentTransactions';

const SalesDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <SalesMetrics />

      {/* État des caisses et actions rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CashRegisterStatus />
        <QuickActions />
      </div>

      {/* Transactions récentes */}
      <RecentTransactions />
    </div>
  );
};

export default SalesDashboard;