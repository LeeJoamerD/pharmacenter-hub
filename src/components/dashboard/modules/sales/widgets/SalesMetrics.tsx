import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Target,
  RefreshCw
} from 'lucide-react';
import useSalesMetrics from '@/hooks/useSalesMetrics';
import { useCurrency } from '@/contexts/CurrencyContext';

const SalesMetrics = () => {
  const { metrics, loading, refreshMetrics } = useSalesMetrics();
  const { formatPrice } = useCurrency();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Métriques de Ventes</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshMetrics}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Journalier</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(metrics.dailyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.dailyRevenue > 40000 ? '+' : ''}
              {((metrics.dailyRevenue - 40000) / 40000 * 100).toFixed(1)}% par rapport à hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dailyTransactions}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(Math.random() * 10)} depuis ce matin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(metrics.averageBasket)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.averageBasket > 3000 ? '+' : ''}
              {((metrics.averageBasket - 3000) / 3000 * 100).toFixed(1)}% par rapport à la moyenne
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectif Mensuel</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.monthlyProgress}%</div>
            <p className="text-xs text-muted-foreground">
              {formatPrice(metrics.monthlyRevenue)} / {formatPrice(metrics.monthlyTarget)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesMetrics;