import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Package, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import { useStockValuationPaginated } from '@/hooks/useStockValuationPaginated';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const StockValuation = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rotationFilter, setRotationFilter] = useState('all');
  const [sortField, setSortField] = useState<'valeur_stock' | 'stock_actuel' | 'libelle_produit'>('valeur_stock');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    valuationItems,
    allItemsCount,
    totalPages,
    metrics,
    valuationByFamily,
    valuationByRayon,
    topValueProducts,
    isLoading,
    error
  } = useStockValuationPaginated({
    searchTerm,
    statusFilter,
    rotationFilter,
    sortField,
    sortDirection,
    currentPage,
    itemsPerPage
  });

  // Calculs de valorisation - utilisation des métriques du hook
  const totalStockValue = metrics.totalStockValue;
  const availableStockValue = metrics.availableStockValue;
  const lowStockValue = metrics.lowStockValue;

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

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Erreur lors du chargement des données: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres de Valorisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut du stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="faible">Stock faible</SelectItem>
                  <SelectItem value="critique">Stock critique</SelectItem>
                  <SelectItem value="rupture">Rupture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={rotationFilter} onValueChange={setRotationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rotation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les rotations</SelectItem>
                  <SelectItem value="rapide">Rotation rapide</SelectItem>
                  <SelectItem value="normale">Rotation normale</SelectItem>
                  <SelectItem value="lente">Rotation lente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
                const [field, direction] = value.split('-');
                setSortField(field as 'valeur_stock' | 'stock_actuel' | 'libelle_produit');
                setSortDirection(direction as 'asc' | 'desc');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valeur_stock-desc">Valorisation (décroissant)</SelectItem>
                  <SelectItem value="valeur_stock-asc">Valorisation (croissant)</SelectItem>
                  <SelectItem value="stock_actuel-desc">Stock (décroissant)</SelectItem>
                  <SelectItem value="stock_actuel-asc">Stock (croissant)</SelectItem>
                  <SelectItem value="libelle_produit-asc">Nom (A-Z)</SelectItem>
                  <SelectItem value="libelle_produit-desc">Nom (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {formatCurrency(allItemsCount > 0 ? totalStockValue / allItemsCount : 0)}
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {valuationByFamily.slice(0, 10).map((family) => (
                <div key={family.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{family.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatCurrency(family.value)}</div>
                      <div className="text-xs text-muted-foreground">{family.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <Progress value={family.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{family.productCount} produits</span>
                    <span>{family.quantity} unités</span>
                  </div>
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
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {valuationByRayon.slice(0, 8).map((rayon) => (
                <div key={rayon.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{rayon.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatCurrency(rayon.value)}</div>
                      <div className="text-xs text-muted-foreground">{rayon.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <Progress value={rayon.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{rayon.productCount} produits</span>
                    <span>{rayon.quantity} unités</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top produits par valorisation avec pagination */}
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

          {/* Pagination pour le tableau principal */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, allItemsCount)} sur {allItemsCount} produits
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockValuation;