import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CreditCard, User, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';

interface ActiveSession {
  id: string;
  solde_ouverture: number;
  currentAmount: number;
  salesCount: number;
  created_at: string;
  personnel?: {
    noms: string;
    prenoms: string;
  };
}

interface ActiveSessionsCardsProps {
  sessions: ActiveSession[];
  loading?: boolean;
}

export const ActiveSessionsCards = ({ sessions, loading }: ActiveSessionsCardsProps) => {
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const { dateLocale } = useDateLocale();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t('activeSessions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!sessions || sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('noActiveSessions')}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 border rounded-lg space-y-3 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {session.personnel?.prenoms} {session.personnel?.noms}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.created_at), 'HH:mm', { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-success text-success-foreground">
                    {t('active')}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('openingBalance')}:</span>
                    <span className="font-medium">
                      {formatPrice(session.solde_ouverture)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('currentAmount')}:</span>
                    <span className="font-semibold text-primary">
                      {formatPrice(session.currentAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ShoppingCart className="h-3 w-3" />
                      <span className="text-xs">{t('salesCount')}:</span>
                    </div>
                    <Badge variant="secondary">{session.salesCount}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
