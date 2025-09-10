import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, Clock, TrendingDown, Eye, Settings } from 'lucide-react';
import AlertsWidget from '../../admin/AlertsWidget';
import { useLowStockData } from '@/hooks/useLowStockData';
import { useStockAlerts } from '@/hooks/useStockAlerts';

const AlertsDashboard = () => {
  const { metrics } = useLowStockData();
  const { alerts, stats } = useStockAlerts();

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'critique':
      case 'eleve':
        return 'destructive';
      case 'moyen':
        return 'default';
      case 'faible':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock_faible':
        return <Package className="h-4 w-4" />;
      case 'peremption_proche':
      case 'expire':
        return <Clock className="h-4 w-4" />;
      case 'rupture':
      case 'critique':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stock_faible':
        return 'Stock Faible';
      case 'peremption_proche':
        return 'Péremption Proche';
      case 'expire':
        return 'Expiré';
      case 'rupture':
        return 'Rupture';
      case 'critique':
        return 'Critique';
      default:
        return type;
    }
  };

  // Prendre les 5 dernières alertes
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Métriques des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.byType.stock_faible}</div>
            <p className="text-xs text-muted-foreground">Produits sous seuil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Péremption Proche</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.byType.peremption_proche}</div>
            <p className="text-xs text-muted-foreground">Dans 30 jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.byType.rupture}</div>
            <p className="text-xs text-muted-foreground">Stock épuisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Alertes actives</p>
          </CardContent>
        </Card>
      </div>

      {/* Widget des alertes système */}
      <AlertsWidget />

      {/* Alertes récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes Stock Récentes</CardTitle>
          <CardDescription>Dernières alertes générées par le système de surveillance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(alert.type)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getUrgencyColor(alert.niveau_urgence) as any}>
                          {getTypeLabel(alert.type)}
                        </Badge>
                        <span className="font-medium">{alert.produit?.libelle_produit || 'Produit inconnu'}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alert.type === 'stock_faible' && (
                          <>Quantité concernée: {alert.quantite_concernee} unités</>
                        )}
                        {alert.type === 'peremption_proche' && alert.jours_restants && (
                          <>Expire dans {alert.jours_restants} jours</>
                        )}
                        {alert.type === 'expire' && (
                          <>Produit expiré</>
                        )}
                        {alert.type === 'rupture' && (
                          <>Stock épuisé</>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.date_alerte || alert.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune alerte récente
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsDashboard;