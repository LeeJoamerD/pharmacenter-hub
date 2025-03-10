
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

// Données fictives pour les mouvements de stock récents
const recentMovements = [
  { type: 'entry', product: 'Produit X', time: '2h' },
  { type: 'exit', product: 'Produit Y', time: '2h' },
  { type: 'entry', product: 'Produit Z', time: '2h' },
];

// Données fictives pour les produits à réapprovisionner
const lowStockProducts = [
  { name: 'Produit A', status: 'Stock faible' },
  { name: 'Produit B', status: 'Stock faible' },
  { name: 'Produit C', status: 'Stock faible' },
];

const StockDashboard = () => {
  const { formatPrice } = useCurrency();
  
  // Statistiques fictives pour le stock
  const stockStats = {
    totalProducts: 1234,
    monthlyEntries: 156,
    monthlyExits: 89,
    increase: '12%'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-green-500">↑ {stockStats.increase}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrées du mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.monthlyEntries}</div>
            <p className="text-xs text-green-500">↑ {stockStats.increase}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sorties du mois</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.monthlyExits}</div>
            <p className="text-xs text-red-500">↓ {stockStats.increase}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Produits à réapprovisionner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.map((product, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-6 h-6 mr-2 flex items-center justify-center">
                    <Package className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                  </div>
                  <div className="text-amber-500 text-sm">
                    {product.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Mouvements récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMovements.map((movement, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-6 h-6 mr-2 flex items-center justify-center">
                    {movement.type === 'entry' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {movement.type === 'entry' ? 'Entrée' : 'Sortie'} - {movement.product}
                    </p>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Il y a {movement.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Afficher les statistiques de stock existantes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-muted-foreground">Produits en inventaire</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Produits sous le seuil minimum</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proche expiration</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Expirent dans les 3 mois</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockDashboard;
