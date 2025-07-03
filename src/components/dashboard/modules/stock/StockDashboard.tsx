import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Clipboard, 
  ChartBar, 
  AlertTriangle, 
  Plus,
  Eye,
  BarChart3,
  ShoppingCart,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useStockMetrics } from '@/hooks/useStockMetrics';

const StockDashboard = () => {
  const stockMetrics = useStockMetrics();

  return (
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
};

export default StockDashboard;