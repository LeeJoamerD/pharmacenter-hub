import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, AlertTriangle, Zap } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import QuickStockSearch from './QuickStockSearch';
import StockLevels from './StockLevels';
import CriticalStock from './CriticalStock';
import { StockRupture } from './StockRupture';
import FastMovingItems from './FastMovingItems';

interface AvailableStockDashboardProps {
  metrics: {
    totalProducts: number;
    availableProducts: number;
    lowStockProducts: number;
    criticalStockProducts: number;
    outOfStockProducts: number;
    overstockProducts: number;
    normalStockProducts: number;
    fastMovingProducts: number;
    totalValue: number;
  };
  totalProducts: number;
  criticalProducts: any[];
  ruptureProducts: any[];
  fastMovingProducts: any[];
  statusDistribution: {
    normal: number;
    faible: number;
    critique: number;
    rupture: number;
    surstock: number;
  };
}

const AvailableStockDashboard = ({ metrics, totalProducts, criticalProducts, ruptureProducts, fastMovingProducts, statusDistribution }: AvailableStockDashboardProps) => {
  const criticalAlerts = metrics.criticalStockProducts;
  const warningAlerts = metrics.lowStockProducts;
  const fastMovingCount = metrics.fastMovingProducts || 0;
  const { formatPrice } = useCurrency();

  return (
    <div className="space-y-6">
      {/* Métriques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Produits Disponibles</span>
            </div>
            <div className="text-2xl font-bold text-success">{metrics.availableProducts}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalProducts > 0 
                ? `${((metrics.availableProducts / metrics.totalProducts) * 100).toFixed(1)}% du catalogue`
                : '0% du catalogue'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-info" />
              <span className="text-sm font-medium">Rotation Rapide</span>
            </div>
            <div className="text-2xl font-bold text-info">{fastMovingCount}</div>
            <p className="text-xs text-muted-foreground">Produits performants</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Alertes Critiques</span>
            </div>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Action immédiate requise</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Valorisation</span>
            </div>
            <div className="text-xl font-bold text-primary">
              {formatPrice(metrics.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">Stock total</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes importantes */}
      {(criticalAlerts > 0 || warningAlerts > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertes Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {criticalAlerts > 0 && (
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                  {criticalAlerts} alerte{criticalAlerts > 1 ? 's' : ''} critique{criticalAlerts > 1 ? 's' : ''}
                </Badge>
              )}
              {warningAlerts > 0 && (
                <Badge className="bg-warning/10 text-warning border-warning/20">
                  {warningAlerts} avertissement{warningAlerts > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Composants spécialisés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickStockSearch products={criticalProducts.concat(fastMovingProducts)} />
        <StockLevels statusDistribution={statusDistribution} totalProducts={totalProducts} metrics={metrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CriticalStock products={criticalProducts} />
        <StockRupture products={ruptureProducts} />
        <FastMovingItems products={fastMovingProducts} />
      </div>
    </div>
  );
};

export default AvailableStockDashboard;