import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { LineChart as LineChartIcon, TrendingUp } from 'lucide-react';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import type { TopProduct, ProfitTrendData } from '@/hooks/useAdminAnalytics';

interface AnalyticsSalesProps {
  topProducts: TopProduct[];
  topProductsLoading: boolean;
  profitTrend: ProfitTrendData[];
  profitTrendLoading: boolean;
}

const AnalyticsSales: React.FC<AnalyticsSalesProps> = ({
  topProducts,
  topProductsLoading,
  profitTrend,
  profitTrendLoading,
}) => {
  const { formatAmount } = useCurrencyFormatting();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatAmount(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getMarginBadgeColor = (margin: number) => {
    if (margin >= 40) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (margin >= 25) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (margin >= 15) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  return (
    <div className="grid gap-4">
      {/* Tendance des Profits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChartIcon className="mr-2 h-4 w-4" />
            Tendance des Profits
          </CardTitle>
          <CardDescription>Évolution des profits sur la période sélectionnée</CardDescription>
        </CardHeader>
        <CardContent>
          {profitTrendLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : profitTrend.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible pour cette période
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={profitTrend}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="objectifGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                {profitTrend[0]?.objectif && (
                  <Area 
                    type="monotone" 
                    dataKey="objectif" 
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    fill="url(#objectifGradient)"
                    name="Objectif"
                  />
                )}
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#profitGradient)"
                  strokeWidth={2}
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Produits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Top Produits
          </CardTitle>
          <CardDescription>Produits les plus vendus sur la période</CardDescription>
        </CardHeader>
        <CardContent>
          {topProductsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Aucune vente enregistrée pour cette période
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium line-clamp-1">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.sales} unités vendues
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-semibold">{formatAmount(product.revenue)}</div>
                      <div className="text-sm text-muted-foreground">Revenu</div>
                    </div>
                    <Badge className={getMarginBadgeColor(product.margin)}>
                      {product.margin}% marge
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsSales;
