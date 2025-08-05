import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, AlertTriangle, Zap } from 'lucide-react';
import { useCurrentStock } from '@/hooks/useCurrentStock';
import QuickStockSearch from './QuickStockSearch';
import StockLevels from './StockLevels';
import CriticalStock from './CriticalStock';
import FastMovingItems from './FastMovingItems';

const AvailableStockDashboard = () => {
  const { metrics, alerts } = useCurrentStock();

  const criticalAlerts = alerts.filter(a => a.niveau_alerte === 'critical').length;
  const warningAlerts = alerts.filter(a => a.niveau_alerte === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Métriques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Produits Disponibles</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{metrics.availableProducts}</div>
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
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Rotation Rapide</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{metrics.fastMovingProducts}</div>
            <p className="text-xs text-muted-foreground">Produits performants</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Alertes Critiques</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Action immédiate requise</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Valorisation</span>
            </div>
            <div className="text-xl font-bold text-purple-600">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'XAF',
                notation: 'compact',
                minimumFractionDigits: 0 
              }).format(metrics.totalStockValue)}
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Alertes Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {criticalAlerts > 0 && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  {criticalAlerts} alerte{criticalAlerts > 1 ? 's' : ''} critique{criticalAlerts > 1 ? 's' : ''}
                </Badge>
              )}
              {warningAlerts > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  {warningAlerts} avertissement{warningAlerts > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Composants spécialisés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickStockSearch />
        <StockLevels />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CriticalStock />
        <FastMovingItems />
      </div>
    </div>
  );
};

export default AvailableStockDashboard;