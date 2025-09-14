import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, Clock, TrendingDown, Eye, Settings, Search, Filter, RefreshCw, Bell, Download } from 'lucide-react';
import AlertsWidget from '../../admin/AlertsWidget';
import AlertDetailDialog from './AlertDetailDialog';
import AlertActionDialog from './AlertActionDialog';
import { useLowStockData } from '@/hooks/useLowStockData';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';
import { toast } from 'sonner';

const AlertsDashboard = () => {
  const { metrics } = useLowStockData();
  const { alerts, stats, actions: { refetch } } = useStockAlerts();
  const { getAlertStats: getSystemStats } = useSystemAlerts();
  
  // États pour les modales et filtres
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedActionAlert, setSelectedActionAlert] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  
  const systemStats = getSystemStats();

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

  // Filtrer les alertes selon les critères de recherche
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !searchTerm || 
      alert.produit_libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesUrgency = filterUrgency === 'all' || alert.niveau_urgence === filterUrgency;
    
    return matchesSearch && matchesType && matchesUrgency;
  });

  // Prendre les 5 dernières alertes filtrées pour l'affichage principal
  const recentAlerts = filteredAlerts.slice(0, 5);

  // Gestionnaires d'événements
  const handleViewAlert = (alert: any) => {
    setSelectedAlert(alert);
    setShowDetailDialog(true);
  };

  const handleActionAlert = (alert: any) => {
    setSelectedActionAlert(alert);
    setShowActionDialog(true);
  };

  const handleRefreshAll = async () => {
    try {
      await refetch();
      toast.success('Alertes actualisées');
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    }
  };

  const handleExportAlerts = () => {
    const csvData = filteredAlerts.map(alert => ({
      'Type': getTypeLabel(alert.type),
      'Produit': alert.produit_libelle,
      'Message': alert.message,
      'Urgence': alert.niveau_urgence,
      'Quantité': alert.quantite_actuelle,
      'Jours Restants': alert.jours_restants || 'N/A',
      'Date': new Date(alert.date_alerte).toLocaleDateString(),
      'Statut': alert.statut
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertes-stock-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Export des alertes réussi');
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard des Alertes</h2>
          <p className="text-muted-foreground">
            Surveillance et gestion centralisée de toutes les alertes du système
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={handleExportAlerts}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <Bell className="h-4 w-4 mr-2" />
            Configurer
          </Button>
        </div>
      </div>

      {/* Métriques des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Alertes stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Système</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{systemStats.total}</div>
            <p className="text-xs text-muted-foreground">Alertes système</p>
          </CardContent>
        </Card>
      </div>

      {/* Widget des alertes système */}
      <AlertsWidget />

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
          <CardDescription>Affiner l'affichage des alertes selon vos critères</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par produit ou message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="stock_faible">Stock Faible</SelectItem>
                  <SelectItem value="peremption_proche">Péremption</SelectItem>
                  <SelectItem value="rupture">Rupture</SelectItem>
                  <SelectItem value="expire">Expiré</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                  <SelectItem value="eleve">Élevée</SelectItem>
                  <SelectItem value="moyen">Moyenne</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes récentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alertes Stock Actives</CardTitle>
              <CardDescription>
                {filteredAlerts.length} alerte{filteredAlerts.length > 1 ? 's' : ''} trouvée{filteredAlerts.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Badge variant="outline" className="px-3">
              {filteredAlerts.length} / {alerts.length}
            </Badge>
          </div>
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
                        <span className="font-medium">{alert.produit_libelle || 'Produit inconnu'}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alert.type === 'stock_faible' && (
                          <>Quantité concernée: {alert.quantite_actuelle} unités</>
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
                        {new Date(alert.date_alerte).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewAlert(alert)}
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleActionAlert(alert)}
                      title="Actions disponibles"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Aucune alerte trouvée</p>
                <p className="text-sm">
                  {searchTerm || filterType !== 'all' || filterUrgency !== 'all' 
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Aucune alerte active pour le moment'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modales pour les détails et actions */}
      <AlertDetailDialog
        alert={selectedAlert}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
      
      <AlertActionDialog
        alert={selectedActionAlert}
        open={showActionDialog}
        onOpenChange={setShowActionDialog}
      />
    </div>
  );
};

export default AlertsDashboard;