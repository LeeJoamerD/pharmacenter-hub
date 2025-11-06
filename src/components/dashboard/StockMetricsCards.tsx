import { DashboardKPICard } from './DashboardKPICard';
import { Package, PackageCheck, AlertTriangle, PackageX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';

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

  return (
    <>
      <DashboardKPICard
        title="Valeur Stock Total"
        value={formatPrice(metrics?.totalValue || 0)}
        icon={Package}
        subtitle="Inventaire total"
        onClick={() => navigate('/stock')}
        loading={loading}
      />
      
      <DashboardKPICard
        title="Produits Disponibles"
        value={metrics?.availableProducts || 0}
        icon={PackageCheck}
        subtitle="En stock suffisant"
        onClick={() => navigate('/stock')}
        loading={loading}
      />
      
      <DashboardKPICard
        title="Alertes Stock Faible"
        value={metrics?.lowStockProducts || 0}
        icon={AlertTriangle}
        subtitle="À réapprovisionner"
        onClick={() => navigate('/stock/alertes')}
        loading={loading}
        className={metrics?.lowStockProducts ? 'border-warning' : ''}
      />
      
      <DashboardKPICard
        title="Produits en Rupture"
        value={metrics?.outOfStockProducts || 0}
        icon={PackageX}
        subtitle="Stock épuisé"
        onClick={() => navigate('/stock/alertes')}
        loading={loading}
        className={metrics?.outOfStockProducts ? 'border-destructive' : ''}
      />
    </>
  );
};
