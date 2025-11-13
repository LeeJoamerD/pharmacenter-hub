import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, TrendingDown, Eye, Search, RefreshCw, Bell, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import AlertsWidget from '../../admin/AlertsWidget';
import AlertDetailDialog from './AlertDetailDialog';
import AlertActionDialog from './AlertActionDialog';
import { useStockAlertsWithProducts } from '@/hooks/useStockAlertsWithProducts';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';
import { toast } from 'sonner';

const AlertsDashboard = () => {
  // États pour les filtres et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedActionAlert, setSelectedActionAlert] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);

  // Utiliser le nouveau hook avec pagination serveur
  const { 
    alertProducts, 
    totalCount, 
    totalPages, 
    metrics, 
    isLoading, 
    refetch 
  } = useStockAlertsWithProducts({
    search: searchTerm,
    category: filterCategory,
    status: filterStatus,
    page: currentPage,
    limit: 50
  });

  const { getAlertStats: getSystemStats } = useSystemAlerts();
  const systemStats = getSystemStats();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rupture':
        return 'destructive';
      case 'critique':
        return 'destructive';
      case 'faible':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rupture':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critique':
        return <TrendingDown className="h-4 w-4" />;
      case 'faible':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rupture':
        return 'Rupture';
      case 'critique':
        return 'Critique';
      case 'faible':
        return 'Stock Faible';
      default:
        return status;
    }
  };

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
      toast.success('Alertes actualisées - ' + totalCount + ' produits en alerte');
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    }
  };

  const handleExportAlerts = () => {
    const headers = ['Code', 'Produit', 'Statut', 'Stock Actuel', 'Seuil Critique', 'Seuil Faible', 'Valeur'];
    const rows = alertProducts.map(product => [
      product.code_produit,
      product.nom_produit,
      product.stock_status,
      product.stock_actuel,
      product.seuil_critique,
      product.seuil_faible,
      product.valeur_stock.toFixed(2)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertes_stock_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('Export réalisé avec succès - ' + alertProducts.length + ' produits');
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Dashboard des Alertes</h3>
          <p className="text-muted-foreground">
            Surveillance et gestion des alertes de stock avec pagination serveur
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAlerts}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques des alertes */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertes</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Produits en alerte sur 6523 total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptures de Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.ruptureItems}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une action immédiate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Critique</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.criticalItems}</div>
            <p className="text-xs text-muted-foreground">
              Entre 0 et seuil critique
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{metrics.lowItems}</div>
            <p className="text-xs text-muted-foreground">
              À surveiller de près
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Widget des alertes système */}
      <AlertsWidget />

      {/* Barre de recherche et filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtres et Recherche</CardTitle>
              <CardDescription>Affiner les {totalCount} alertes ({alertProducts.length} affichées)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={filterStatus} onValueChange={(v) => {
                setFilterStatus(v);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="rupture">Rupture</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                  <SelectItem value="faible">Stock Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Select value={filterCategory} onValueChange={(v) => {
                setFilterCategory(v);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les catégories</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des alertes avec pagination */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produits en Alerte</CardTitle>
              <CardDescription>
                Page {currentPage} sur {totalPages} - {totalCount} produits total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chargement des alertes...</p>
              </div>
            ) : alertProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun produit en alerte trouvé</p>
              </div>
            ) : (
              <>
                {alertProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-muted">
                        {getStatusIcon(product.stock_status)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{product.nom_produit}</p>
                          <Badge variant={getStatusColor(product.stock_status) as any}>
                            {getStatusLabel(product.stock_status)}
                          </Badge>
                          {product.dci && (
                            <Badge variant="outline">{product.dci}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Code: {product.code_produit} | {product.categorie || 'Sans catégorie'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Stock: {product.stock_actuel} {product.unite}</span>
                          <span>Seuil critique: {product.seuil_critique}</span>
                          <span>Seuil faible: {product.seuil_faible}</span>
                          <span>Valeur: {product.valeur_stock.toFixed(2)} DH</span>
                          <span>Rotation: {product.rotation}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewAlert(product)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActionAlert(product)}
                      >
                        Actions
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Précédent
                          </Button>
                        </PaginationItem>
                        <PaginationItem>
                          <span className="text-sm text-muted-foreground px-4">
                            Page {currentPage} / {totalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Suivant
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AlertDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        alert={selectedAlert}
      />

      <AlertActionDialog
        open={showActionDialog}
        onOpenChange={setShowActionDialog}
        alert={selectedActionAlert}
      />
    </div>
  );
};

export default AlertsDashboard;
