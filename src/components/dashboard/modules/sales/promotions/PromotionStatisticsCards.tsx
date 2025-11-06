import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Users, Star, TrendingUp } from 'lucide-react';
import { usePromotions } from '@/hooks/usePromotions';
import { useLoyaltyProgram } from '@/hooks/useLoyaltyProgram';
import { useCurrency } from '@/contexts/CurrencyContext';

const PromotionStatisticsCards = () => {
  const { statistics } = usePromotions();
  const { statistics: loyaltyStats } = useLoyaltyProgram();
  const { formatPrice } = useCurrency();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promotions Actives</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics?.activePromotions || 0}</div>
          <p className="text-xs text-muted-foreground">
            Sur {statistics?.totalPromotions || 0} promotions totales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Membres Fidélité</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loyaltyStats?.actifs || 0}</div>
          <p className="text-xs text-muted-foreground">
            {loyaltyStats?.total || 0} membres totaux
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Points en Circulation</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(loyaltyStats?.pointsCirculation || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Points accumulés
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics?.conversionRate || 0}%</div>
          <p className="text-xs text-muted-foreground">
            {statistics?.monthlyUsages || 0} utilisations ce mois
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionStatisticsCards;
