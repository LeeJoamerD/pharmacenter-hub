import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardHeader } from './DashboardHeader';
import { SalesMetricsCards } from './SalesMetricsCards';
import { StockMetricsCards } from './StockMetricsCards';
import { SalesTrendChart } from './charts/SalesTrendChart';
import { PaymentMethodsChart } from './charts/PaymentMethodsChart';
import { TopProductsList } from './TopProductsList';
import { CriticalAlertsList } from './CriticalAlertsList';
import { ActiveSessionsCards } from './ActiveSessionsCards';
import { QuickActionsPanel } from './QuickActionsPanel';
import { RecentActivitiesTimeline } from './RecentActivitiesTimeline';
import { CreditPromotionsSummary } from './CreditPromotionsSummary';
import { useState } from 'react';

const DashboardHome = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    salesMetrics,
    salesTrend,
    topProducts,
    stockMetrics,
    expirationAlerts,
    activeSessions,
    creditMetrics,
    activePromotions,
    paymentMethods,
    recentActivities,
    isLoading,
    refreshAll,
  } = useDashboardData();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
      {/* En-tête */}
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      
      {/* Row 1: KPIs Ventes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SalesMetricsCards metrics={salesMetrics} loading={isLoading} />
      </div>
      
      {/* Row 2: KPIs Stock */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StockMetricsCards metrics={stockMetrics} loading={isLoading} />
      </div>
      
      {/* Row 3: Graphique Principal + Alertes */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <SalesTrendChart data={salesTrend} loading={isLoading} />
        </div>
        <CriticalAlertsList alerts={expirationAlerts} loading={isLoading} />
      </div>
      
      {/* Row 4: Top Produits + Modes Paiement */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopProductsList products={topProducts} loading={isLoading} />
        <PaymentMethodsChart data={paymentMethods} loading={isLoading} />
      </div>
      
      {/* Row 5: Sessions Actives */}
      <ActiveSessionsCards sessions={activeSessions} loading={isLoading} />
      
      {/* Row 6: Crédits + Promotions */}
      <div className="grid gap-6 md:grid-cols-2">
        <CreditPromotionsSummary
          creditMetrics={creditMetrics}
          promotionMetrics={activePromotions}
          loading={isLoading}
        />
      </div>
      
      {/* Row 7: Activités Récentes */}
      <RecentActivitiesTimeline activities={recentActivities} loading={isLoading} />
      
      {/* Actions Rapides */}
      <QuickActionsPanel />
    </div>
  );
};

export default DashboardHome;
