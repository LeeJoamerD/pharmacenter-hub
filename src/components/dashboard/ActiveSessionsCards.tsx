import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CreditCard, User, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('fr-CG', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('XAF', 'FCFA');
};

export const ActiveSessionsCards = ({ sessions, loading }: ActiveSessionsCardsProps) => {
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
          Sessions de Caisse Actives
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!sessions || sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune session de caisse ouverte
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
                        {format(new Date(session.created_at), 'HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-success text-success-foreground">
                    Ouverte
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ouverture:</span>
                    <span className="font-medium">
                      {formatPrice(session.solde_ouverture)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Montant actuel:</span>
                    <span className="font-semibold text-primary">
                      {formatPrice(session.currentAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ShoppingCart className="h-3 w-3" />
                      <span className="text-xs">Ventes:</span>
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
