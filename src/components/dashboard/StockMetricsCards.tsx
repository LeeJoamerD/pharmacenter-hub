import { DashboardKPICard } from './DashboardKPICard';
import { Package, PackageCheck, AlertTriangle, PackageX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  return (
    <>
      <DashboardKPICard
        title={t('totalStockValue')}
        value={formatPrice(metrics?.totalValue || 0)}
        icon={Package}
        subtitle={t('totalInventory')}
        onClick={() => navigate('/stock')}
        loading={loading}
      />
      
      <DashboardKPICard
        title={t('availableProducts')}
        value={metrics?.availableProducts || 0}
        icon={PackageCheck}
        subtitle={t('sufficientStock')}
        onClick={() => navigate('/stock')}
        loading={loading}
      />
      
      <DashboardKPICard
        title={t('lowStockAlerts')}
        value={metrics?.lowStockProducts || 0}
        icon={AlertTriangle}
        subtitle={t('toReorder')}
        onClick={() => navigate('/stock/alertes')}
        loading={loading}
        className={metrics?.lowStockProducts ? 'border-warning' : ''}
      />
      
      <DashboardKPICard
        title={t('outOfStock')}
        value={metrics?.outOfStockProducts || 0}
        icon={PackageX}
        subtitle={t('stockDepleted')}
        onClick={() => navigate('/stock/alertes')}
        loading={loading}
        className={metrics?.outOfStockProducts ? 'border-destructive' : ''}
      />
    </>
  );
};
