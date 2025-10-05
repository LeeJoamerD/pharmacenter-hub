import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Package, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import { useCurrentStock } from '@/hooks/useCurrentStock';
import { Progress } from '@/components/ui/progress';

const StockValuation = () => {
  const { allStockData, families, rayons, isLoading } = useCurrentStock();

  // Calculs de valorisation
  const totalStockValue = allStockData.reduce((sum, p) => sum + p.valeur_stock, 0);
  const availableStockValue = allStockData.filter(p => p.stock_actuel > 0).reduce((sum, p) => sum + p.valeur_stock, 0);
  const lowStockValue = allStockData.filter(p => p.statut_stock === 'faible' || p.statut_stock === 'critique').reduce((sum, p) => sum + p.valeur_stock, 0);

  // Valorisation par famille
  const valuationByFamily = families.map((family: any) => {
    const familyProducts = allStockData.filter(p => p.famille_id === family.id);
    const value = familyProducts.reduce((sum, p) => sum + p.valeur_stock, 0);
    const quantity = familyProducts.reduce((sum, p) => sum + p.stock_actuel, 0);
    const percentage = totalStockValue > 0 ? (value / totalStockValue) * 100 : 0;
    
    return {
      id: family.id,
      name: family.libelle_famille,
      value,
      quantity,
      percentage,
      productCount: familyProducts.length
    };
  }).filter(f => f.value > 0).sort((a, b) => b.value - a.value);

  // Valorisation par rayon
  const valuationByRayon = rayons.map((rayon: any) => {
    const rayonProducts = allStockData.filter(p => p.rayon_id === rayon.id);
    const value = rayonProducts.reduce((sum, p) => sum + p.valeur_stock, 0);
    const quantity = rayonProducts.reduce((sum, p) => sum + p.stock_actuel, 0);
    const percentage = totalStockValue > 0 ? (value / totalStockValue) * 100 : 0;
    
    return {
      id: rayon.id,
      name: rayon.libelle_rayon,
      value,
      quantity,
      percentage,
      productCount: rayonProducts.length
    };
  }).filter(r => r.value > 0).sort((a, b) => b.value - a.value);

  // Top 20 produits par valorisation
  const topValueProducts = allStockData
    .filter(p => p.valeur_stock > 0)
    .sort((a, b) => b.valeur_stock - a.valeur_stock)
    .slice(0, 20);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getValueCategory = (value: number) => {
    const totalValue = totalStockValue;
    const percentage = (value / totalValue) * 100;
    
    if (percentage >= 10) return { label: 'Très élevée', color: 'bg-red-100 text-red-800' };
    if (percentage >= 5) return { label: 'Élevée', color: 'bg-orange-100 text-orange-800' };
    if (percentage >= 2) return { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage >= 1) return { label: 'Faible', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Très faible', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="space-y-6">
      {/* Métriques globales de valorisation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Valorisation Totale</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalStockValue)}
            </div>
            <p className="text-xs text-muted-foreground">Stock complet</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Stock Disponible</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(availableStockValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((availableStockValue / totalStockValue) * 100).toFixed(1)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Stock Faible</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(lowStockValue)}
            </div>
            <p className="text-xs text-muted-foreground">À réapprovisionner</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Valeur Moyenne</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(allStockData.length > 0 ? totalStockValue / allStockData.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Par produit</p>
          </CardContent>
        </Card>
      </div>

      {/* Valorisation par famille */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Valorisation par Famille de Produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {valuationByFamily.slice(0, 10).map((family, index) => (
                <div key={family.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{family.name}</span>
                      <span className="text-sm font-mono">{formatCurrency(family.value)}</span>
                    </div>
                    <Progress value={family.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{family.productCount} produits • {family.quantity} unités</span>
                      <span>{family.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Valorisation par rayon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Valorisation par Rayon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {valuationByRayon.slice(0, 8).map((rayon, index) => (
              <div key={rayon.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{rayon.name}</span>
                    <span className="text-sm font-mono">{formatCurrency(rayon.value)}</span>
                  </div>
                  <Progress value={rayon.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{rayon.productCount} produits • {rayon.quantity} unités</span>
                    <span>{rayon.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <Badge variant="outline">#{index + 1}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top produits par valorisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top 20 - Produits par Valorisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rang</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Prix Unitaire</TableHead>
                  <TableHead>Valorisation</TableHead>
                  <TableHead>% du Total</TableHead>
                  <TableHead>Catégorie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topValueProducts.map((product, index) => {
                  const percentage = (product.valeur_stock / totalStockValue) * 100;
                  const category = getValueCategory(product.valeur_stock);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Badge variant={index < 3 ? 'default' : 'outline'}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
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
                        <div className="font-semibold">{product.stock_actuel}</div>
                        <div className="text-xs text-muted-foreground">unités</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.prix_achat.toLocaleString()} FCFA
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-lg">
                          {formatCurrency(product.valeur_stock)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{percentage.toFixed(2)}%</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={category.color}>
                          {category.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockValuation;