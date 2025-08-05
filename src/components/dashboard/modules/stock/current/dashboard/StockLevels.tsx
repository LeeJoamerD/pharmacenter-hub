import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCurrentStock } from '@/hooks/useCurrentStock';

const StockLevels = () => {
  const { products, metrics } = useCurrentStock();

  // Calcul des niveaux de stock
  const stockLevels = [
    {
      label: 'Normal',
      count: products.filter(p => p.statut_stock === 'normal').length,
      percentage: metrics.totalProducts > 0 ? (products.filter(p => p.statut_stock === 'normal').length / metrics.totalProducts) * 100 : 0,
      color: 'bg-green-500',
      icon: TrendingUp,
      iconColor: 'text-green-600'
    },
    {
      label: 'Faible',
      count: products.filter(p => p.statut_stock === 'faible').length,
      percentage: metrics.totalProducts > 0 ? (products.filter(p => p.statut_stock === 'faible').length / metrics.totalProducts) * 100 : 0,
      color: 'bg-yellow-500',
      icon: Minus,
      iconColor: 'text-yellow-600'
    },
    {
      label: 'Critique',
      count: products.filter(p => p.statut_stock === 'critique').length,
      percentage: metrics.totalProducts > 0 ? (products.filter(p => p.statut_stock === 'critique').length / metrics.totalProducts) * 100 : 0,
      color: 'bg-orange-500',
      icon: TrendingDown,
      iconColor: 'text-orange-600'
    },
    {
      label: 'Rupture',
      count: products.filter(p => p.statut_stock === 'rupture').length,
      percentage: metrics.totalProducts > 0 ? (products.filter(p => p.statut_stock === 'rupture').length / metrics.totalProducts) * 100 : 0,
      color: 'bg-red-500',
      icon: TrendingDown,
      iconColor: 'text-red-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Niveaux de Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stockLevels.map((level) => (
          <div key={level.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <level.icon className={`h-4 w-4 ${level.iconColor}`} />
                <span className="text-sm font-medium">{level.label}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">{level.count}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({level.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <Progress 
              value={level.percentage} 
              className="h-2"
            />
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total produits</span>
            <span className="font-semibold">{metrics.totalProducts}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockLevels;