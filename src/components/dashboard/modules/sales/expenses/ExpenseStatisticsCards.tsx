import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Ban, TrendingDown, Layers } from 'lucide-react';

interface ExpenseStatisticsCardsProps {
  statistics: {
    totalCount: number;
    cancelledCount: number;
    totalAmount: number;
    cancelledAmount: number;
    byMotif: Record<string, number>;
  };
}

const ExpenseStatisticsCards: React.FC<ExpenseStatisticsCardsProps> = ({ statistics }) => {
  const motifCount = Object.keys(statistics.byMotif).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total des dépenses</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.totalAmount.toLocaleString('fr-FR')} FCFA
          </div>
          <p className="text-xs text-muted-foreground">
            {statistics.totalCount} dépense(s) active(s)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dépenses annulées</CardTitle>
          <Ban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {statistics.cancelledAmount.toLocaleString('fr-FR')} FCFA
          </div>
          <p className="text-xs text-muted-foreground">
            {statistics.cancelledCount} dépense(s) annulée(s)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Moyenne par dépense</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.totalCount > 0 
              ? Math.round(statistics.totalAmount / statistics.totalCount).toLocaleString('fr-FR')
              : 0
            } FCFA
          </div>
          <p className="text-xs text-muted-foreground">
            Par dépense active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Motifs utilisés</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{motifCount}</div>
          <p className="text-xs text-muted-foreground">
            Motifs différents
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseStatisticsCards;
