import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, DollarSign, AlertTriangle, Package, TrendingUp, TrendingDown } from 'lucide-react';

interface StatisticsCardsProps {
  statistics: {
    returnsToday: number;
    trendToday: number;
    montantRembourse: number;
    enAttente: number;
    tauxRetour: number;
  } | undefined;
  isLoading: boolean;
}

const ReturnStatisticsCards: React.FC<StatisticsCardsProps> = ({ statistics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2" />
              <div className="h-3 bg-muted rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  const getTrendText = (trend: number) => {
    if (trend > 0) return `+${trend} depuis hier`;
    if (trend < 0) return `${trend} depuis hier`;
    return 'Inchangé';
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Retours du Jour</CardTitle>
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {statistics?.returnsToday || 0}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {getTrendIcon(statistics?.trendToday || 0)}
            {getTrendText(statistics?.trendToday || 0)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Montant Remboursé</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {(statistics?.montantRembourse || 0).toLocaleString('fr-FR')} FCFA
          </div>
          <p className="text-xs text-muted-foreground">Aujourd'hui</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Attente</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {statistics?.enAttente || 0}
          </div>
          <p className="text-xs text-muted-foreground">À traiter</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taux de Retour</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {(statistics?.tauxRetour || 0).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Cette semaine</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReturnStatisticsCards;
