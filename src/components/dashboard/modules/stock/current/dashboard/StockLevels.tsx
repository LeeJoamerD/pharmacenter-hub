import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCurrentStock } from '@/hooks/useCurrentStock';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const StockLevels = () => {
  const { allStockData, metrics } = useCurrentStock();

  // Calcul des niveaux de stock sur TOUTES les données
  const stockLevels = [
    {
      label: 'Normal',
      value: allStockData.filter(p => p.statut_stock === 'normal').length,
      color: 'hsl(var(--success))',
      icon: TrendingUp,
      iconColor: 'text-success'
    },
    {
      label: 'Faible',
      value: allStockData.filter(p => p.statut_stock === 'faible').length,
      color: 'hsl(var(--warning))',
      icon: Minus,
      iconColor: 'text-warning'
    },
    {
      label: 'Critique',
      value: allStockData.filter(p => p.statut_stock === 'critique').length,
      color: 'hsl(38 92% 50%)',
      icon: TrendingDown,
      iconColor: 'text-[hsl(38_92%_50%)]'
    },
    {
      label: 'Rupture',
      value: allStockData.filter(p => p.statut_stock === 'rupture').length,
      color: 'hsl(var(--destructive))',
      icon: TrendingDown,
      iconColor: 'text-destructive'
    }
  ];

  const chartData = stockLevels.filter(level => level.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Niveaux de Stock
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
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
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
            <div key={level.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <level.icon className={`h-4 w-4 ${level.iconColor}`} />
                <span className="text-sm font-medium">{level.label}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">{level.value}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({metrics.totalProducts > 0 ? ((level.value / metrics.totalProducts) * 100).toFixed(1) : '0'}%)
                </span>
              </div>
            </div>
          ))}
        </div>

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