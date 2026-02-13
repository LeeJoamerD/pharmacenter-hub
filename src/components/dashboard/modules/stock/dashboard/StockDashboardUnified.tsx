import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  RefreshCcw,
  FileBarChart,
  PackageX,
  Clock,
  DollarSign,
  Lightbulb,
  MoreVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useStockDashboardUnified } from '@/hooks/useStockDashboardUnified';
import { useNavigate } from 'react-router-dom';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import StockDistributionChart from './charts/StockDistributionChart';
import ValorizationByFamilyChart from './charts/ValorizationByFamilyChart';
import MovementsEvolutionChart from './charts/MovementsEvolutionChart';
import StockRotationChart from './charts/StockRotationChart';
import AnalyticsDateFilter from './filters/AnalyticsDateFilter';
import AnalyticsExportButton from './AnalyticsExportButton';
import { StockRotationService } from '@/services/StockRotationService';
import { subDays, subMonths, subYears } from 'date-fns';
import { QuickSupplyDialog } from './dialogs/QuickSupplyDialog';
import { QuickInventoryDialog } from './dialogs/QuickInventoryDialog';
import { QuickAdjustmentDialog } from './dialogs/QuickAdjustmentDialog';
import { useDashboardVisibility, DashboardVisibilityToggle } from '@/components/dashboard/DashboardVisibilityToggle';

/**
 * Dashboard Stock Unifié - Version Moderne et Complète
 * Utilise le hook unifié pour afficher données réelles depuis RPC optimisées
 */
const StockDashboardUnified = () => {
  const navigate = useNavigate();
  const { settings } = useSystemSettings();
  const { isVisible, toggleVisibility, hasDashboardPermission } = useDashboardVisibility();

  // États pour les dialogues
  const [supplyDialogOpen, setSupplyDialogOpen] = useState(false);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();

  // État pour le filtre de date
  const [dateFilter, setDateFilter] = useState<{
    period: '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';
    start: Date;
    end: Date;
  }>({
    period: '30d',
    start: subDays(new Date(), 30),
    end: new Date()
  });

  const {
    metrics,
    criticalProducts,
    ruptureProducts,
    fastMovingProducts,
    activeAlerts,
    valorisationByFamily,
    movementsEvolution,
    rotationByFamily,
    isLoading,
    error,
    refetchAll
  } = useStockDashboardUnified(dateFilter);

  // Gestionnaire de changement de filtre
  const handleDateFilterChange = (
    period: '7d' | '30d' | '90d' | '6m' | '1y' | 'custom',
    customRange?: { start: Date; end: Date }
  ) => {
    let start: Date, end: Date = new Date();

    if (period === 'custom' && customRange) {
      start = customRange.start;
      end = customRange.end;
    } else {
      switch (period) {
        case '7d':
          start = subDays(new Date(), 7);
          break;
        case '90d':
          start = subDays(new Date(), 90);
          break;
        case '6m':
          start = subMonths(new Date(), 6);
          break;
        case '1y':
          start = subYears(new Date(), 1);
          break;
        default: // '30d'
          start = subDays(new Date(), 30);
      }
    }

    setDateFilter({ period, start, end });
  };

  // Générer les insights de rotation
  const rotationInsights = rotationByFamily.length > 0 
    ? StockRotationService.generateRotationInsights(rotationByFamily)
    : [];

  // Format prix selon paramètres système
  const formatPrice = (amount: number): string => {
    const currency = settings?.default_currency || 'XAF';
    try {
      return new Intl.NumberFormat('fr-CG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch {
      return `${amount.toLocaleString()} F CFA`;
    }
  };

  // Gestion du chargement
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetchAll()} variant="outline">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusDist = metrics.statusDistribution;
  const totalProducts = statusDist?.total || metrics.totalProduits || 0;
  // ✅ Utiliser la valeur correcte de la base de données (tous produits avec stock > 0)
  const availableCount = metrics.disponibles || 0;
  const availablePercent = totalProducts > 0 
    ? Math.round((availableCount / totalProducts) * 100) 
    : 0;

  // Gestionnaires d'actions
  const handleQuickOrder = (productId: string) => {
    setSelectedProductId(productId);
    setSupplyDialogOpen(true);
  };

  const handleQuickAdjustment = (productId: string) => {
    setSelectedProductId(productId);
    setAdjustmentDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vue d'Ensemble Stock</h2>
          <p className="text-muted-foreground">
            Suivi en temps réel de votre inventaire et alertes
          </p>
        </div>
        <div className="flex gap-2">
          {hasDashboardPermission && (
            <Button onClick={toggleVisibility} variant="ghost" size="sm" className="gap-2">
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isVisible ? 'Masquer' : 'Afficher'}
            </Button>
          )}
          <AnalyticsExportButton
            dashboardData={{
              metrics,
              statusDistribution: metrics.statusDistribution,
              valorisationByFamily,
              movementsEvolution,
              rotationByFamily
            }}
            dateFilter={dateFilter}
            disabled={isLoading}
          />
          <Button variant="outline" size="sm" onClick={() => refetchAll()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button variant="default" size="sm" onClick={() => navigate('/stock/rapports')}>
            <FileBarChart className="mr-2 h-4 w-4" />
            Rapports
          </Button>
        </div>
      </div>

      {!hasDashboardPermission || !isVisible ? (
        <DashboardVisibilityToggle>
          <div />
        </DashboardVisibilityToggle>
      ) : (
        <>

      {/* Métriques principales - 4 cartes KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valeur Stock Total */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/stock/stock actuel')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <DollarSign className="h-4 w-4 text-primary cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Valeur totale du stock basée sur les prix d'achat</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(metrics.valeurStock || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalProducts.toLocaleString()} produits
            </p>
          </CardContent>
        </Card>

        {/* Stock Disponible */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/stock/stock actuel')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Package className="h-4 w-4 text-green-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Tous les produits avec stock {">"} 0 (incluant critiques et faibles)</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {availablePercent}%
            </div>
            <Progress value={availablePercent} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {availableCount.toLocaleString()} disponibles
            </p>
          </CardContent>
        </Card>

        {/* Alertes Critiques */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-amber-200" onClick={() => navigate('/stock/alertes')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {(statusDist?.critique || 0) + (statusDist?.faible || 0)}
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <Badge variant="destructive" className="text-xs">
                {statusDist?.critique || 0} critique
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {statusDist?.faible || 0} faible
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Ruptures */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-200" onClick={() => navigate('/stock/alertes')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <PackageX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusDist?.rupture || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Action immédiate requise
            </p>
          </CardContent>
        </Card>

        {/* Surstock */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200" onClick={() => navigate('/stock/alertes')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surstock</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statusDist?.surstock || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Stock excédentaire
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métriques secondaires - 3 cartes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expiration Proche */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiration &lt; 30j</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.expirationProche || 0}</div>
            <p className="text-xs text-orange-600 mt-1">
              Lots à surveiller
            </p>
          </CardContent>
        </Card>

        {/* Commandes en Cours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes en Cours</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.commandesEnCours || 0}</div>
            <p className="text-xs text-blue-600 mt-1">
              En attente de réception
            </p>
          </CardContent>
        </Card>

        {/* Mouvements Récents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mouvements (24h)</CardTitle>
            <TrendingDown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.mouvementsRecents || 0}</div>
            <p className="text-xs text-purple-600 mt-1">
              Entrées/Sorties récentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section Alertes et Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alertes Actives */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alertes Actives</CardTitle>
            <CardDescription>Actions requises sur {activeAlerts.length} produits</CardDescription>
          </CardHeader>
          <CardContent>
            {activeAlerts.length > 0 ? (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => navigate(`/stock/produit/${alert.produit_id}`)}
                    >
                      <Badge
                        variant={
                          alert.alert_level === 'error' ? 'destructive' : 
                          alert.alert_level === 'warning' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {alert.alert_type.replace('_', ' ')}
                      </Badge>
                      <div>
                        <p className="font-medium">{alert.produit_nom}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold">{alert.stock_actuel}</p>
                        <p className="text-xs text-muted-foreground">en stock</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleQuickOrder(alert.produit_id)}>
                            <Package className="mr-2 h-4 w-4" />
                            Commander
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/stock/produit/${alert.produit_id}`)}>
                            <FileBarChart className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQuickAdjustment(alert.produit_id)}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Ajuster stock
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                ✓ Aucune alerte active
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions Rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setSupplyDialogOpen(true)}
            >
              <Package className="mr-2 h-4 w-4" />
              Nouveau Réapprovisionnement
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setInventoryDialogOpen(true)}
            >
              <FileBarChart className="mr-2 h-4 w-4" />
              Lancer Inventaire
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/stock/mouvements')}
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              Voir Mouvements
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/stock/alertes')}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Voir Alertes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Produits Critiques et En Rupture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Produits Critiques */}
        <Card>
          <CardHeader>
            <CardTitle>Produits Critiques</CardTitle>
            <CardDescription>Stock très faible - Action requise</CardDescription>
          </CardHeader>
          <CardContent>
            {criticalProducts.length > 0 ? (
              <div className="space-y-2">
                {criticalProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.produit_id}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors"
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/stock/produit/${product.produit_id}`)}
                    >
                      <p className="font-medium text-sm">{product.libelle_produit}</p>
                      <p className="text-xs text-muted-foreground">{product.famille_libelle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold text-red-600">{product.stock_actuel}</p>
                        <p className="text-xs text-muted-foreground">/ {product.stock_limite}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuickOrder(product.produit_id)}
                      >
                        Commander
                      </Button>
                    </div>
                  </div>
                ))}
                {criticalProducts.length > 5 && (
                  <Button
                    variant="link"
                    className="w-full"
                    onClick={() => navigate('/stock/alertes')}
                  >
                    Voir tous ({criticalProducts.length})
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Aucun produit critique
              </p>
            )}
          </CardContent>
        </Card>

        {/* Produits en Rupture */}
        <Card>
          <CardHeader>
            <CardTitle>Produits en Rupture</CardTitle>
            <CardDescription>Stock épuisé - Réappro urgent</CardDescription>
          </CardHeader>
          <CardContent>
            {ruptureProducts.length > 0 ? (
              <div className="space-y-2">
                {ruptureProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.produit_id}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors"
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/stock/produit/${product.produit_id}`)}
                    >
                      <p className="font-medium text-sm">{product.libelle_produit}</p>
                      <p className="text-xs text-muted-foreground">{product.famille_libelle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Rupture</Badge>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleQuickOrder(product.produit_id)}
                      >
                        Urgence
                      </Button>
                    </div>
                  </div>
                ))}
                {ruptureProducts.length > 5 && (
                  <Button
                    variant="link"
                    className="w-full"
                    onClick={() => navigate('/stock/alertes')}
                  >
                    Voir tous ({ruptureProducts.length})
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Aucune rupture de stock ✓
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Produits à Rotation Rapide */}
      {fastMovingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produits à Rotation Rapide</CardTitle>
            <CardDescription>Ventes élevées sur les 30 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {fastMovingProducts.slice(0, 6).map((product) => (
                <div
                  key={product.produit_id}
                  className="flex items-center justify-between p-3 rounded border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/stock/produit/${product.produit_id}`)}
                >
                  <div>
                    <p className="font-medium text-sm">{product.libelle_produit}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.quantite_vendue} vendus
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{product.stock_actuel}</p>
                    <p className="text-xs text-muted-foreground">en stock</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Analytics - Graphiques */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold tracking-tight">Analytics Stock</h3>
        </div>

        {/* Graphique Distribution */}
        <StockDistributionChart statusDistribution={metrics.statusDistribution} />

        {/* Graphiques Valorisation et Mouvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ValorizationByFamilyChart data={valorisationByFamily} />
          <MovementsEvolutionChart data={movementsEvolution} />
        </div>

        {/* Graphique de rotation et insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StockRotationChart data={rotationByFamily} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Insights Rotation
              </CardTitle>
              <CardDescription>Recommandations basées sur les données</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rotationInsights.map((insight, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${
                  insight.type === 'success' ? 'bg-green-50 border-green-200' :
                  insight.type === 'error' ? 'bg-red-50 border-red-200' :
                  insight.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <p className="font-semibold text-sm">{insight.title}</p>
                  <p className="text-xs mt-1 text-muted-foreground">{insight.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogues d'actions rapides */}
      <QuickSupplyDialog
        open={supplyDialogOpen}
        onOpenChange={setSupplyDialogOpen}
        productId={selectedProductId}
      />
      <QuickInventoryDialog
        open={inventoryDialogOpen}
        onOpenChange={setInventoryDialogOpen}
      />
      <QuickAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        productId={selectedProductId}
      />
      </>
      )}
    </div>
    </TooltipProvider>
  );
};

export default StockDashboardUnified;