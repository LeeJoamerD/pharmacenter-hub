import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart3, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface StockLevelsProps {
  statusDistribution: {
    normal: number;
    faible: number;
    critique: number;
    rupture: number;
    surstock: number;
  };
  metrics: any;
  totalProducts: number;
}

const StockLevels = React.memo(({ statusDistribution, metrics, totalProducts }: StockLevelsProps) => {
  const { t } = useLanguage();

  // Optimisation avec useMemo pour le calcul des niveaux - utilise metrics avec les bons seuils
  const stockLevels = useMemo(() => [
    {
      label: t('normal'),
      value: metrics.normalStockProducts || 0,
      color: 'hsl(var(--success))',
      icon: TrendingUp,
      iconColor: 'text-success'
    },
    {
      label: t('low'),
      value: metrics.lowStockProducts || 0,
      color: 'hsl(var(--warning))',
      icon: Minus,
      iconColor: 'text-warning'
    },
    {
      label: t('critical'),
      value: metrics.criticalStockProducts || 0,
      color: 'hsl(38 92% 50%)',
      icon: TrendingDown,
      iconColor: 'text-[hsl(38_92%_50%)]'
    },
    {
      label: t('outOfStock'),
      value: metrics.outOfStockProducts || 0,
      color: 'hsl(var(--destructive))',
      icon: TrendingDown,
      iconColor: 'text-destructive'
    },
    {
      label: t('overstock'),
      value: metrics.overstockProducts || 0,
      color: 'hsl(var(--info))',
      icon: TrendingUp,
      iconColor: 'text-info'
    }
  ], [metrics, t]);

  const chartData = useMemo(() => 
    stockLevels.filter(level => level.value > 0), 
    [stockLevels]
  );

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('stockLevels')}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('stockLevelsTooltip')}</p>
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
            {t('noDataAvailable')}
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
            <span className="text-sm text-muted-foreground">{t('totalProducts')}</span>
            <span className="font-semibold">{totalProducts}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StockLevels.displayName = 'StockLevels';

export default StockLevels;
