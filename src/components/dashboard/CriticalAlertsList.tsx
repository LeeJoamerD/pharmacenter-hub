import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';

interface ExpirationAlert {
  id: string;
  niveau_urgence: string;
  type_alerte: string;
  jours_restants: number;
  quantite_concernee: number;
  lots: {
    id: string;
    date_peremption: string;
    quantite_restante: number;
    produits: {
      id: string;
      libelle_produit: string;
      code_cip: string;
    };
  };
}

interface CriticalAlertsListProps {
  alerts: ExpirationAlert[];
  loading?: boolean;
}

export const CriticalAlertsList = ({ alerts, loading }: CriticalAlertsListProps) => {
  const { t } = useLanguage();
  const { dateLocale } = useDateLocale();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {t('criticalAlerts')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!alerts || alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('noCriticalAlerts')}
          </p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm line-clamp-2">
                      {alert.lots.produits.libelle_produit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.lots.produits.code_cip}
                    </p>
                  </div>
                  <Badge
                    variant={alert.niveau_urgence === 'critique' || alert.niveau_urgence === 'urgent' 
                      ? 'destructive' 
                      : 'secondary'}
                    className="shrink-0"
                  >
                    {alert.niveau_urgence}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {alert.lots?.date_peremption 
                      ? format(new Date(alert.lots.date_peremption), 'dd MMM yyyy', { locale: dateLocale })
                      : t('unknownDate')
                    }
                  </div>
                  <span className="text-muted-foreground">
                    {alert.lots.quantite_restante} {t('units')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
