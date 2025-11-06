import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, TrendingDown, AlertCircle, Percent, Tag, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CreditMetrics {
  totalCredit: number;
  activeAccounts: number;
  overdueAmount: number;
  utilizationRate: number;
}

interface PromotionMetrics {
  activeCount: number;
  totalUsages: number;
  savingsToday: number;
}

interface CreditPromotionsSummaryProps {
  creditMetrics?: CreditMetrics | null;
  promotionMetrics?: PromotionMetrics | null;
  loading?: boolean;
}

export const CreditPromotionsSummary = ({
  creditMetrics,
  promotionMetrics,
  loading,
}: CreditPromotionsSummaryProps) => {
  const { formatPrice } = useCurrency();
  if (loading) {
    return (
      <>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {/* Carte Crédit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" />
            Crédit Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total en cours</span>
              <span className="font-semibold text-lg">
                {formatPrice(creditMetrics?.totalCredit || 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Comptes actifs</span>
              <span className="font-medium">
                {creditMetrics?.activeAccounts || 0}
              </span>
            </div>

            {creditMetrics && creditMetrics.overdueAmount > 0 && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-destructive">
                    Retards de paiement
                  </p>
                  <p className="text-xs text-destructive/80">
                    {formatPrice(creditMetrics.overdueAmount)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Taux d'utilisation</span>
                <span className="font-medium">
                  {creditMetrics?.utilizationRate.toFixed(1) || 0}%
                </span>
              </div>
              <Progress value={creditMetrics?.utilizationRate || 0} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carte Promotions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-5 w-5" />
            Promotions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Actives</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                {promotionMetrics?.activeCount || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Utilisations</span>
              </div>
              <span className="text-lg font-semibold">
                {promotionMetrics?.totalUsages || 0}
              </span>
            </div>

            <div className="p-3 bg-success/10 rounded-lg space-y-1">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-success" />
                <span className="text-xs font-medium text-success">
                  Économies aujourd'hui
                </span>
              </div>
              <p className="text-lg font-bold text-success">
                {formatPrice(promotionMetrics?.savingsToday || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
