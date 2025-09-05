import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ShoppingCart, Bell, Package } from 'lucide-react';
import { useCurrentStock } from '@/hooks/useCurrentStock';
import { Progress } from '@/components/ui/progress';

const LowStockProducts = () => {
  const { products, isLoading } = useCurrentStock();

  const lowStockProducts = products.filter(p => 
    p.statut_stock === 'faible' || p.statut_stock === 'critique'
  );

  const getSeverityColor = (status: string) => {
    switch (status) {
      case 'critique': return 'bg-red-100 text-red-800 border-red-200';
      case 'faible': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockPercentage = (current: number, minimum: number) => {
    if (minimum === 0) return 100;
    return Math.min((current / minimum) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 25) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Résumé des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Stock Critique</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => p.statut_stock === 'critique').length}
            </div>
            <p className="text-xs text-muted-foreground">Nécessite action immédiate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Stock Faible</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {products.filter(p => p.statut_stock === 'faible').length}
            </div>
            <p className="text-xs text-muted-foreground">À surveiller</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total à Réapprovisionner</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {lowStockProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">Produits concernés</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commande d'Urgence
            </Button>
            <Button variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              Configurer Alertes
            </Button>
            <Button variant="outline" className="gap-2">
              <Package className="h-4 w-4" />
              Voir Historique
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Produits en Stock Faible ({lowStockProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium text-green-600">Excellent !</p>
              <p>Aucun produit en stock faible détecté</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Stock Actuel</TableHead>
                    <TableHead>Stock Minimum</TableHead>
                    <TableHead>Niveau Stock</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Dernière Sortie</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts
                    .sort((a, b) => {
                      // Trier par criticité puis par pourcentage de stock
                      if (a.statut_stock === 'critique' && b.statut_stock !== 'critique') return -1;
                      if (b.statut_stock === 'critique' && a.statut_stock !== 'critique') return 1;
                      
                      const aPercentage = getStockPercentage(a.stock_actuel, a.stock_limite);
                      const bPercentage = getStockPercentage(b.stock_actuel, b.stock_limite);
                      return aPercentage - bPercentage;
                    })
                    .map((product) => {
                      const stockPercentage = getStockPercentage(product.stock_actuel, product.stock_limite);
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.libelle_produit}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.famille_libelle} • {product.rayon_libelle}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.code_cip}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-lg">{product.stock_actuel}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-muted-foreground">{product.stock_limite}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Progress 
                                value={stockPercentage} 
                                className="h-2"
                              />
                              <div className="text-xs text-muted-foreground">
                                {stockPercentage.toFixed(0)}% du minimum
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(product.statut_stock)}>
                              {product.statut_stock === 'critique' ? 'URGENT' : 'ATTENTION'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {product.date_derniere_sortie 
                                ? new Date(product.date_derniere_sortie).toLocaleDateString()
                                : 'N/A'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="default" className="gap-1">
                                <ShoppingCart className="h-3 w-3" />
                                Commander
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1">
                                <Bell className="h-3 w-3" />
                                Alerter
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockProducts;