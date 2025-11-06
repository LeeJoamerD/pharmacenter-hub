import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, DollarSign, Receipt, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TransactionStats } from '@/hooks/useTransactionHistory';

interface TransactionStatisticsCardsProps {
  stats?: TransactionStats;
}

const TransactionStatisticsCards = ({ stats }: TransactionStatisticsCardsProps) => {
  const { formatPrice } = useCurrency();

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          <History className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats?.totalTransactions || 0}
          </div>
          {stats?.comparison.transactionsChange !== 0 && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${getTrendColor(stats?.comparison.transactionsChange || 0)}`}>
              {getTrendIcon(stats?.comparison.transactionsChange || 0)}
              <span>{Math.abs(stats?.comparison.transactionsChange || 0).toFixed(1)}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatPrice(stats?.totalAmount || 0)}
          </div>
          {stats?.comparison.amountChange !== 0 && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${getTrendColor(stats?.comparison.amountChange || 0)}`}>
              {getTrendIcon(stats?.comparison.amountChange || 0)}
              <span>{Math.abs(stats?.comparison.amountChange || 0).toFixed(1)}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Terminées</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats?.completedTransactions || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.totalTransactions ? Math.round((stats.completedTransactions / stats.totalTransactions) * 100) : 0}% du total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Attente</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats?.pendingTransactions || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.totalTransactions ? Math.round((stats.pendingTransactions / stats.totalTransactions) * 100) : 0}% du total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatPrice(stats?.averageTransaction || 0)}
          </div>
          {stats?.comparison.averageChange !== 0 && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${getTrendColor(stats?.comparison.averageChange || 0)}`}>
              {getTrendIcon(stats?.comparison.averageChange || 0)}
              <span>{Math.abs(stats?.comparison.averageChange || 0).toFixed(1)}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionStatisticsCards;
