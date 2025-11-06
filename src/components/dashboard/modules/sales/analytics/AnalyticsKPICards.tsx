import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Target, Users, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { AnalyticsKPI } from '@/hooks/useSalesAnalytics';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface AnalyticsKPICardsProps {
  kpis: AnalyticsKPI | undefined;
  isLoading: boolean;
}

const AnalyticsKPICards: React.FC<AnalyticsKPICardsProps> = ({ kpis, isLoading }) => {
  const { formatPrice } = useCurrency();

  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'CA Total',
      value: formatPrice(kpis.caTotal),
      variation: kpis.caVariation,
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      title: 'Transactions',
      value: kpis.transactions.toLocaleString('fr-FR'),
      variation: kpis.transactionsVariation,
      icon: ShoppingCart,
      color: 'text-green-600',
    },
    {
      title: 'Panier Moyen',
      value: formatPrice(kpis.panierMoyen),
      variation: kpis.panierMoyenVariation,
      icon: Target,
      color: 'text-orange-600',
    },
    {
      title: 'Clients Uniques',
      value: kpis.clientsUniques.toLocaleString('fr-FR'),
      variation: kpis.clientsUniquesVariation,
      icon: Users,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.variation >= 0;

        return (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(card.variation).toFixed(1)}%
                </span>
                <span className="ml-1">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AnalyticsKPICards;
