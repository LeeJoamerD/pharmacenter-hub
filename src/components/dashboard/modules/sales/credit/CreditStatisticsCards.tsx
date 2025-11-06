import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditStatsProps {
  stats?: {
    total_credits_outstanding: number;
    total_credit_limit: number;
    active_accounts: number;
    total_accounts: number;
    utilization_rate: number;
    total_overdue: number;
    available_credit: number;
  };
  loading?: boolean;
}

export const CreditStatisticsCards = ({ stats, loading }: CreditStatsProps) => {
  const { formatPrice } = useCurrency();

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-3 w-[80px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Crédits en Cours",
      value: formatPrice(stats.total_credits_outstanding),
      description: `Sur ${formatPrice(stats.total_credit_limit)} disponible`,
      icon: CreditCard,
      color: "text-blue-600"
    },
    {
      title: "Comptes Actifs",
      value: stats.active_accounts.toString(),
      description: `Sur ${stats.total_accounts} comptes total`,
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Taux d'Utilisation",
      value: `${stats.utilization_rate.toFixed(1)}%`,
      description: `Crédit disponible: ${formatPrice(stats.available_credit)}`,
      icon: TrendingUp,
      color: stats.utilization_rate > 80 ? "text-orange-600" : "text-purple-600"
    },
    {
      title: "Crédits en Retard",
      value: formatPrice(stats.total_overdue),
      description: stats.total_overdue > 0 ? "Nécessite attention" : "Aucun retard",
      icon: AlertTriangle,
      color: stats.total_overdue > 0 ? "text-red-600" : "text-gray-600"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
