import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Tag, 
  Clipboard, 
  ChartBar, 
  TrendingUp, 
  Settings, 
  AlertTriangle, 
  Plus,
  Eye,
  BarChart3,
  ShoppingCart
} from 'lucide-react';
import ProductCatalog from './stock/ProductCatalog';
import LotTracker from './stock/LotTracker';
import LotDetails from './stock/LotDetails';
import ExpirationAlert from './stock/ExpirationAlert';
import FIFOConfig from './stock/FIFOConfig';
import OrderList from './stock/OrderList';
import OrderForm from './stock/OrderForm';
import ReceptionForm from './stock/ReceptionForm';
import SupplierManager from './stock/SupplierManager';
import OrderTracking from './stock/OrderTracking';
import StockMovementJournal from './stock/StockMovementJournal';
import StockAdjustments from './stock/StockAdjustments';
import StockTransfers from './stock/StockTransfers';
import StockAudit from './stock/StockAudit';

interface StockModuleProps {
  activeSubModule: string;
}

const StockModule = ({ activeSubModule }: StockModuleProps) => {
  // Dashboard métriques mockées (à remplacer par les vraies données)
  const stockMetrics = {
    totalProduits: 1250,
    stockFaible: 23,
    expirationProche: 15,
    commandesEnCours: 8,
    valeurStock: 456780,
    mouvementsJour: 45
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockMetrics.totalProduits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stockMetrics.stockFaible}</div>
            <p className="text-xs text-muted-foreground">
              Produits sous seuil critique
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiration Proche</CardTitle>
            <Tag className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stockMetrics.expirationProche}</div>
            <p className="text-xs text-muted-foreground">
              Dans les 30 prochains jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes en Cours</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockMetrics.commandesEnCours}</div>
            <p className="text-xs text-muted-foreground">
              Fournisseurs en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockMetrics.valeurStock.toLocaleString()} F CFA</div>
            <p className="text-xs text-muted-foreground">
              Valorisation totale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mouvements Jour</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockMetrics.mouvementsJour}</div>
            <p className="text-xs text-muted-foreground">
              Entrées/Sorties aujourd'hui
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>Opérations fréquentes du module stock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Produit
            </Button>
            <Button variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nouvelle Commande
            </Button>
            <Button variant="outline">
              <ChartBar className="mr-2 h-4 w-4" />
              Ajustement Stock
            </Button>
            <Button variant="outline">
              <Clipboard className="mr-2 h-4 w-4" />
              Nouvel Inventaire
            </Button>
            <Button variant="outline">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Voir Alertes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertes en cours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Alertes Actives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="destructive">Stock Faible</Badge>
                <span>Paracétamol 500mg - Stock: 5 unités</span>
              </div>
              <Button size="sm" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-yellow-600">Expiration</Badge>
                <span>Ibuprofène 200mg - Expire le 15/08/2025</span>
              </div>
              <Button size="sm" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProductsModule = () => (
    <ProductCatalog />
  );

  const renderLotsModule = () => (
    <Tabs value="tracker" defaultValue="tracker" className="space-y-6">
      <TabsList>
        <TabsTrigger value="tracker">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Suivi</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="details">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Détails</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="expiration">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Péremptions</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="fifo">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Configuration FIFO</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="tracker">
        <LotTracker />
      </TabsContent>
      
      <TabsContent value="details">
        <LotDetails />
      </TabsContent>
      
      <TabsContent value="expiration">
        <ExpirationAlert />
      </TabsContent>
      
      <TabsContent value="fifo">
        <FIFOConfig />
      </TabsContent>
    </Tabs>
  );

  const renderApprovisionnementModule = () => (
    <Tabs value="liste" defaultValue="liste" className="space-y-6">
      <TabsList>
        <TabsTrigger value="liste">
          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            <span>Liste commandes</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="commandes">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Commandes</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="receptions">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Réceptions</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="fournisseurs">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Fournisseurs</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="suivi">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Suivi</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="liste">
        <OrderList />
      </TabsContent>
      
      <TabsContent value="commandes">
        <OrderForm />
      </TabsContent>
      
      <TabsContent value="receptions">
        <ReceptionForm />
      </TabsContent>
      
      <TabsContent value="fournisseurs">
        <SupplierManager />
      </TabsContent>
      
      <TabsContent value="suivi">
        <OrderTracking />
      </TabsContent>
    </Tabs>
  );

  const renderMouvementsModule = () => (
    <Tabs defaultValue="journal" className="space-y-6">
      <TabsList>
        <TabsTrigger value="journal">
          <div className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            <span>Journal</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="ajustements">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Ajustements</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="transferts">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Transferts</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="audit">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Audit</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="journal">
        <StockMovementJournal />
      </TabsContent>
      
      <TabsContent value="ajustements">
        <StockAdjustments />
      </TabsContent>
      
      <TabsContent value="transferts">
        <StockTransfers />
      </TabsContent>
      
      <TabsContent value="audit">
        <StockAudit />
      </TabsContent>
    </Tabs>
  );

  const renderInventairesModule = () => (
    <Tabs defaultValue="sessions" className="space-y-6">
      <TabsList>
        <TabsTrigger value="sessions">
          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            <span>Sessions</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="saisie">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Saisie</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="reconciliation">
          <div className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            <span>Réconciliation</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="rapports">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Rapports</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="sessions">
        <div className="text-center py-12">
          <Clipboard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gestion Sessions</h3>
          <p className="text-muted-foreground">Sessions d'inventaire à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="saisie">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Saisie avec Scanner</h3>
          <p className="text-muted-foreground">Module saisie à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="reconciliation">
        <div className="text-center py-12">
          <ChartBar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Réconciliation</h3>
          <p className="text-muted-foreground">Comparaison avec écarts à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="rapports">
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Rapports Générés</h3>
          <p className="text-muted-foreground">Module rapports à implémenter</p>
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderAlertesModule = () => (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <TabsList>
        <TabsTrigger value="dashboard">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="stock-faible">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Stock Faible</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="peremption">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Péremption</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="configuration">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Configuration</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard">
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Vue d'Ensemble</h3>
          <p className="text-muted-foreground">Dashboard alertes à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="stock-faible">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Alertes Stock Faible</h3>
          <p className="text-muted-foreground">Module stock faible à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="peremption">
        <div className="text-center py-12">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Péremption Proche</h3>
          <p className="text-muted-foreground">Module péremption à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="configuration">
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Configuration Seuils</h3>
          <p className="text-muted-foreground">Paramétrage alertes à implémenter</p>
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderAnalysesModule = () => (
    <Tabs defaultValue="valorisation" className="space-y-6">
      <TabsList>
        <TabsTrigger value="valorisation">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Valorisation</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="abc">
          <div className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            <span>Analyse ABC</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="rotation">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Rotation</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="previsions">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Prévisions</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="conformite">
          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            <span>Conformité</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="valorisation">
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Valorisation Stocks</h3>
          <p className="text-muted-foreground">Module valorisation à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="abc">
        <div className="text-center py-12">
          <ChartBar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Classification ABC</h3>
          <p className="text-muted-foreground">Analyse ABC à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="rotation">
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Taux de Rotation</h3>
          <p className="text-muted-foreground">Analyse rotation à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="previsions">
        <div className="text-center py-12">
          <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Prévisions</h3>
          <p className="text-muted-foreground">Module prévisions à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="conformite">
        <div className="text-center py-12">
          <Clipboard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Rapports Conformité</h3>
          <p className="text-muted-foreground">Module conformité à implémenter</p>
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderConfigurationModule = () => (
    <div className="text-center py-12">
      <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Configuration Stock</h3>
      <p className="text-muted-foreground">Paramètres du module à implémenter</p>
    </div>
  );

  const renderContent = () => {
    switch (activeSubModule) {
      case 'produits':
        return renderProductsModule();
      case 'lots':
        return renderLotsModule();
      case 'approvisionnement':
        return renderApprovisionnementModule();
      case 'mouvements':
        return renderMouvementsModule();
      case 'inventaires':
        return renderInventairesModule();
      case 'alertes':
        return renderAlertesModule();
      case 'analyses':
        return renderAnalysesModule();
      case 'configuration':
        return renderConfigurationModule();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestion de Stock</h2>
        <p className="text-muted-foreground">
          Module complet de gestion des stocks, produits et approvisionnements
        </p>
      </div>

      {renderContent()}
    </div>
  );
};

export default StockModule;