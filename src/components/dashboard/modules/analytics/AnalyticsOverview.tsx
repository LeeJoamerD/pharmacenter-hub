import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import type { SalesEvolutionData, CategoryDistribution, KeyIndicator } from '@/hooks/useAdminAnalytics';

interface AnalyticsOverviewProps {
  salesEvolution: SalesEvolutionData[];
  salesEvolutionLoading: boolean;
  categoryDistribution: CategoryDistribution[];
  categoryDistributionLoading: boolean;
  keyIndicators: KeyIndicator[];
  keyIndicatorsLoading: boolean;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  salesEvolution,
  salesEvolutionLoading,
  categoryDistribution,
  categoryDistributionLoading,
  keyIndicators,
  keyIndicatorsLoading,
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Graphique des ventes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Évolution des Ventes
            </CardTitle>
            <CardDescription>Ventes, coûts et profits sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            {salesEvolutionLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : salesEvolution.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible pour cette période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesEvolution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ventes" fill="hsl(var(--primary))" name="Ventes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="couts" fill="hsl(var(--muted-foreground))" name="Coûts" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Répartition par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="mr-2 h-4 w-4" />
              Répartition des Ventes
            </CardTitle>
            <CardDescription>Ventes par catégorie de produits</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryDistributionLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryDistribution.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible pour cette période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value}% (${props.payload.count} articles)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Indicateurs Clés */}
      <Card>
        <CardHeader>
          <CardTitle>Indicateurs Clés</CardTitle>
          <CardDescription>Suivi des métriques importantes</CardDescription>
        </CardHeader>
        <CardContent>
          {keyIndicatorsLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {keyIndicators.map((indicator, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{indicator.label}</span>
                    <span className="text-sm font-semibold">
                      {indicator.label.includes('Taux') 
                        ? `${indicator.value.toFixed(1)}x/an`
                        : `${indicator.value.toFixed(1)}%`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${indicator.color}`}
                      style={{ width: `${Math.min(indicator.percentage, 100)}%` }}
                    />
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

export default AnalyticsOverview;
