import { DashboardKPICard } from './DashboardKPICard';
import { TrendingUp, ShoppingCart, DollarSign, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';

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
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  return (
    <>
      <DashboardKPICard
        title="Ventes du Jour"
        value={formatPrice(metrics?.todayTotal || 0)}
        icon={TrendingUp}
        trend={{
          value: metrics?.variation || 0,
          isPositive: (metrics?.variation || 0) >= 0,
        }}
        subtitle="vs hier"
        onClick={() => navigate('/ventes')}
        loading={loading}
      />
      
      <DashboardKPICard
        title="CA Mensuel"
        value={formatPrice(metrics?.monthlyTotal || 0)}
        icon={DollarSign}
        subtitle="Ce mois"
        onClick={() => navigate('/ventes')}
        loading={loading}
      />
      
      <DashboardKPICard
        title="Transactions Jour"
        value={metrics?.transactionsCount || 0}
        icon={ShoppingCart}
        subtitle="Ventes réalisées"
        onClick={() => navigate('/ventes')}
        loading={loading}
      />
      
      <DashboardKPICard
        title="Panier Moyen"
        value={formatPrice(metrics?.averageBasket || 0)}
        icon={ShoppingBag}
        subtitle="Par transaction"
        onClick={() => navigate('/ventes')}
        loading={loading}
      />
    </>
  );
};
