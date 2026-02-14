import { DashboardKPICard } from './DashboardKPICard';
import { TrendingUp, ShoppingCart, DollarSign, ShoppingBag } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/contexts/NavigationContext';

interface SalesMetrics {
  todayTotal: number;
  variation: number;
  transactionsCount: number;
  monthlyTotal: number;
  averageBasket: number;
}

interface SalesMetricsCardsProps {
  metrics?: SalesMetrics | null;
  loading?: boolean;
}

export const SalesMetricsCards = ({ metrics, loading }: SalesMetricsCardsProps) => {
  const { navigateToModule } = useNavigation();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  return (
    <>
      <DashboardKPICard
        title={t('dailySalesTitle')}
        value={formatPrice(metrics?.todayTotal || 0)}
        icon={TrendingUp}
        trend={{
          value: metrics?.variation || 0,
          isPositive: (metrics?.variation || 0) >= 0,
        }}
        subtitle={t('vsYesterday')}
        onClick={() => navigateToModule('ventes')}
        loading={loading}
      />
      
      <DashboardKPICard
        title={t('monthlySalesTitle')}
        value={formatPrice(metrics?.monthlyTotal || 0)}
        icon={DollarSign}
        subtitle={t('thisMonth')}
        onClick={() => navigateToModule('ventes')}
        loading={loading}
      />
      
      <DashboardKPICard
        title={t('dailyTransactions')}
        value={metrics?.transactionsCount || 0}
        icon={ShoppingCart}
        subtitle={t('salesCompleted')}
        onClick={() => navigateToModule('ventes')}
        loading={loading}
      />
      
      <DashboardKPICard
        title={t('averageBasket')}
        value={formatPrice(metrics?.averageBasket || 0)}
        icon={ShoppingBag}
        subtitle={t('perTransaction')}
        onClick={() => navigateToModule('ventes')}
        loading={loading}
      />
    </>
  );
};
