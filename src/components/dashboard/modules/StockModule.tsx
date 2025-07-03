import React, { useState } from 'react';
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

interface StockModuleProps {
  activeSubModule: string;
}

const StockModule = ({ activeSubModule }: StockModuleProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');

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
            <Button onClick={() => setActiveTab('produits')}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Produit
            </Button>
            <Button variant="outline" onClick={() => setActiveTab('approvisionnement')}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nouvelle Commande
            </Button>
            <Button variant="outline" onClick={() => setActiveTab('mouvements')}>
              <ChartBar className="mr-2 h-4 w-4" />
              Ajustement Stock
            </Button>
            <Button variant="outline" onClick={() => setActiveTab('inventaires')}>
              <Clipboard className="mr-2 h-4 w-4" />
              Nouvel Inventaire
            </Button>
            <Button variant="outline" onClick={() => setActiveTab('alertes')}>
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'produits':
        return <ProductCatalog />;
      case 'lots':
        return (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Module Lots</h3>
            <p className="text-muted-foreground">Gestion des lots et traçabilité à implémenter</p>
          </div>
        );
      case 'approvisionnement':
        return (
          <div className="text-center py-12">
            <Clipboard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Module Approvisionnement</h3>
            <p className="text-muted-foreground">Commandes fournisseurs et réceptions à implémenter</p>
          </div>
        );
      case 'mouvements':
        return (
          <div className="text-center py-12">
            <ChartBar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Module Mouvements</h3>
            <p className="text-muted-foreground">Journal des mouvements de stock à implémenter</p>
          </div>
        );
      case 'inventaires':
        return (
          <div className="text-center py-12">
            <Clipboard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Module Inventaires</h3>
            <p className="text-muted-foreground">Sessions d'inventaire à implémenter</p>
          </div>
        );
      case 'alertes':
        return (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Module Alertes</h3>
            <p className="text-muted-foreground">Monitoring et alertes à implémenter</p>
          </div>
        );
      case 'analyses':
        return (
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Module Analyses</h3>
            <p className="text-muted-foreground">Rapports et analyses à implémenter</p>
          </div>
        );
      case 'configuration':
        return (
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configuration Stock</h3>
            <p className="text-muted-foreground">Paramètres du module à implémenter</p>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  // Si un sous-module est actif via la sidebar, utiliser celui-ci
  React.useEffect(() => {
    if (activeSubModule) {
      setActiveTab(activeSubModule);
    }
  }, [activeSubModule]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestion de Stock</h2>
        <p className="text-muted-foreground">
          Module complet de gestion des stocks, produits et approvisionnements
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="dashboard">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="produits">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Produits</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="lots">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Lots</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="approvisionnement">
            <div className="flex items-center gap-2">
              <Clipboard className="h-4 w-4" />
              <span className="hidden sm:inline">Appro.</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="mouvements">
            <div className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" />
              <span className="hidden sm:inline">Mouvements</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="inventaires">
            <div className="flex items-center gap-2">
              <Clipboard className="h-4 w-4" />
              <span className="hidden sm:inline">Inventaires</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="alertes">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Alertes</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="analyses">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analyses</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockModule;