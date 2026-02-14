import { DashboardKPICard } from './DashboardKPICard';
import { Package, PackageCheck, AlertTriangle, PackageX } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/contexts/NavigationContext';

interface StockMetrics {
  totalValue: number;
  availableProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

interface StockMetricsCardsProps {
  metrics?: StockMetrics | null;
  loading?: boolean;
}

export const StockMetricsCards = ({ metrics, loading }: StockMetricsCardsProps) => {
  const { navigateToModule } = useNavigation();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  return (
    <>
      <DashboardKPICard
        title={t('totalStockValue')}
        value={formatPrice(metrics?.totalValue || 0)}
        icon={Package}
        subtitle={t('totalInventory')}
        onClick={() => navigateToModule('stock', 'stock disponible')}
        loading={loading}
      />
      
      <DashboardKPICard
        title={t('availableProducts')}
        value={metrics?.availableProducts || 0}
        icon={PackageCheck}
        subtitle={t('sufficientStock')}
        onClick={() => navigateToModule('stock', 'stock disponible')}
        loading={loading}
      />
      
      <DashboardKPICard
        title={t('lowStockAlerts')}
        value={metrics?.lowStockProducts || 0}
        icon={AlertTriangle}
        subtitle={t('toReorder')}
        onClick={() => navigateToModule('stock', 'alertes')}
        loading={loading}
        className={metrics?.lowStockProducts ? 'border-warning' : ''}
      />
      
      <DashboardKPICard
        title={t('outOfStock')}
        value={metrics?.outOfStockProducts || 0}
        icon={PackageX}
        subtitle={t('stockDepleted')}
        onClick={() => navigateToModule('stock', 'alertes')}
        loading={loading}
        className={metrics?.outOfStockProducts ? 'border-destructive' : ''}
      />
    </>
  );
};
