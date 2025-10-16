import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart3, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface StockLevelsProps {
  products: any[];
  metrics: {
    totalProducts: number;
  };
  totalProducts: number;
}

const StockLevels = React.memo(({ products, metrics, totalProducts }: StockLevelsProps) => {

  // Optimisation avec useMemo pour le calcul des niveaux
  const stockLevels = useMemo(() => [
    {
      label: 'Normal',
      value: products.filter(p => p.statut_stock === 'normal').length,
      color: 'hsl(var(--success))',
      icon: TrendingUp,
      iconColor: 'text-success'
    },
    {
      label: 'Faible',
      value: products.filter(p => p.statut_stock === 'faible').length,
      color: 'hsl(var(--warning))',
      icon: Minus,
      iconColor: 'text-warning'
    },
    {
      label: 'Critique',
      value: products.filter(p => p.statut_stock === 'critique').length,
      color: 'hsl(38 92% 50%)',
      icon: TrendingDown,
      iconColor: 'text-[hsl(38_92%_50%)]'
    },
    {
      label: 'Rupture',
      value: products.filter(p => p.statut_stock === 'rupture').length,
      color: 'hsl(var(--destructive))',
      icon: TrendingDown,
      iconColor: 'text-destructive'
    },
    {
      label: 'Surstock',
      value: products.filter(p => p.statut_stock === 'surstock').length,
      color: 'hsl(var(--info))',
      icon: TrendingUp,
      iconColor: 'text-info'
    }
  ], [products]);

  const chartData = useMemo(() => 
    stockLevels.filter(level => level.value > 0), 
    [stockLevels]
  );

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Niveaux de Stock
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Répartition des produits par niveau de stock</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Graphique en camembert */}
        {chartData.length > 0 ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, value }) => `${label}: ${value}`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Aucune donnée disponible
          </div>
        )}

        {/* Légende détaillée */}
        <div className="space-y-2">
          {stockLevels.map((level) => (
            <div key={level.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-all duration-200">
              <div className="flex items-center gap-2">
                <level.icon className={`h-4 w-4 ${level.iconColor}`} />
                <span className="text-sm font-medium">{level.label}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">{level.value}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({totalProducts > 0 ? ((level.value / totalProducts) * 100).toFixed(1) : '0'}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total produits</span>
            <span className="font-semibold">{totalProducts}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StockLevels.displayName = 'StockLevels';

export default StockLevels;
