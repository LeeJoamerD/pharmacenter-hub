import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock, ShoppingCart, Package, Clipboard, CreditCard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Activity {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
  personnel?: {
    noms: string;
    prenoms: string;
  };
}

interface RecentActivitiesTimelineProps {
  activities: Activity[];
  loading?: boolean;
}

const getActivityIcon = (tableName: string) => {
  switch (tableName) {
    case 'ventes':
      return ShoppingCart;
    case 'receptions_fournisseurs':
      return Package;
    case 'inventaires':
      return Clipboard;
    case 'sessions_caisse':
      return CreditCard;
    default:
      return Clock;
  }
};

const getActivityLabel = (action: string, tableName: string) => {
  const labels: Record<string, Record<string, string>> = {
    INSERT: {
      ventes: 'Nouvelle vente',
      receptions_fournisseurs: 'Réception fournisseur',
      inventaires: 'Inventaire créé',
      sessions_caisse: 'Session caisse ouverte',
    },
    UPDATE: {
      ventes: 'Vente modifiée',
      receptions_fournisseurs: 'Réception mise à jour',
      inventaires: 'Inventaire mis à jour',
      sessions_caisse: 'Session caisse mise à jour',
    },
    DELETE: {
      ventes: 'Vente supprimée',
      receptions_fournisseurs: 'Réception supprimée',
      inventaires: 'Inventaire supprimé',
      sessions_caisse: 'Session caisse supprimée',
    },
  };

  return labels[action]?.[tableName] || `${action} sur ${tableName}`;
};

const getActionVariant = (action: string): 'default' | 'secondary' | 'destructive' => {
  switch (action) {
    case 'INSERT':
      return 'default';
    case 'UPDATE':
      return 'secondary';
    case 'DELETE':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const RecentActivitiesTimeline = ({ activities, loading }: RecentActivitiesTimelineProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activités Récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune activité récente
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.table_name);
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="p-2 rounded-full bg-primary/10 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">
                        {getActivityLabel(activity.action, activity.table_name)}
                      </p>
                      <Badge variant={getActionVariant(activity.action)} className="text-xs">
                        {activity.action}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.personnel && (
                        <>
                          <span>
                            {activity.personnel.prenoms} {activity.personnel.noms}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
