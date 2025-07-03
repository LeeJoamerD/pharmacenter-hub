import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, Clock, TrendingDown, Eye, Settings } from 'lucide-react';
import AlertsWidget from '../../admin/AlertsWidget';

const AlertsDashboard = () => {
  const alertsSummary = {
    stockFaible: 23,
    peremptionProche: 15,
    ruptures: 5,
    alertesActives: 43
  };

  const recentAlerts = [
    {
      id: 1,
      type: 'stock_faible',
      produit: 'Paracétamol 500mg',
      seuil: 10,
      quantiteActuelle: 5,
      urgence: 'high',
      dateCreation: new Date('2024-01-15T10:30:00')
    },
    {
      id: 2,
      type: 'peremption',
      produit: 'Ibuprofène 200mg',
      lot: 'LOT2024-001',
      dateExpiration: new Date('2024-02-15'),
      urgence: 'medium',
      dateCreation: new Date('2024-01-15T09:15:00')
    },
    {
      id: 3,
      type: 'rupture',
      produit: 'Aspirine 100mg',
      derniereVente: new Date('2024-01-14'),
      urgence: 'high',
      dateCreation: new Date('2024-01-15T08:45:00')
    }
  ];

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock_faible':
        return <Package className="h-4 w-4" />;
      case 'peremption':
        return <Clock className="h-4 w-4" />;
      case 'rupture':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stock_faible':
        return 'Stock Faible';
      case 'peremption':
        return 'Péremption';
      case 'rupture':
        return 'Rupture';
      default:
        return type;
    }
  };

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
            <div className="text-2xl font-bold text-destructive">{alertsSummary.stockFaible}</div>
            <p className="text-xs text-muted-foreground">Produits sous seuil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Péremption Proche</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertsSummary.peremptionProche}</div>
            <p className="text-xs text-muted-foreground">Dans 30 jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{alertsSummary.ruptures}</div>
            <p className="text-xs text-muted-foreground">Stock épuisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertsSummary.alertesActives}</div>
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
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getTypeIcon(alert.type)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getUrgencyColor(alert.urgence) as any}>
                        {getTypeLabel(alert.type)}
                      </Badge>
                      <span className="font-medium">{alert.produit}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {alert.type === 'stock_faible' && (
                        <>Stock actuel: {alert.quantiteActuelle} (seuil: {alert.seuil})</>
                      )}
                      {alert.type === 'peremption' && (
                        <>Lot: {alert.lot} - Expire le {alert.dateExpiration.toLocaleDateString()}</>
                      )}
                      {alert.type === 'rupture' && (
                        <>Dernière vente: {alert.derniereVente?.toLocaleDateString()}</>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {alert.dateCreation.toLocaleString()}
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsDashboard;