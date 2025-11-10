import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { XCircle, AlertCircle, ShoppingCart, Clock, TrendingDown, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RefreshCw, RotateCcw } from 'lucide-react';
import { useOutOfStockDataPaginated } from '@/hooks/useOutOfStockDataPaginated';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { OutOfStockEmergencyOrderModal } from '../modals/OutOfStockEmergencyOrderModal';
import { SupplierAlertModal } from '../modals/SupplierAlertModal';
import { SubstituteProductSearchModal } from '../modals/SubstituteProductSearchModal';
import { OrderOutOfStockProductModal } from '../modals/OrderOutOfStockProductModal';
import { SubstituteIndividualModal } from '../modals/SubstituteIndividualModal';
import type { OutOfStockItem } from '@/hooks/useOutOfStockDataPaginated';

type SortField = 'libelle_produit' | 'date_derniere_sortie' | 'rotation' | 'potential_loss' | 'days_out_of_stock';
type SortDirection = 'asc' | 'desc';

const OutOfStockProducts = () => {
  const { toast } = useToast();
  
  // Local state for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [rotationFilter, setRotationFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('date_derniere_sortie');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  
  const {
    outOfStockItems,
    allItemsCount,
    metrics,
    totalPages,
    isLoading,
    refetch,
  } = useOutOfStockDataPaginated({
    search: debouncedSearchTerm,
    rotation: rotationFilter,
    urgency: urgencyFilter,
    sortBy: sortField,
    sortOrder: sortDirection,
    page: currentPage,
    limit: pageSize
  });

  // Fonction pour réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchTerm('');
    setRotationFilter('');
    setUrgencyFilter('');
    setSortField('date_derniere_sortie');
    setSortDirection('desc');
    setCurrentPage(1);
    toast({
      title: "Filtres réinitialisés",
      description: "Tous les filtres ont été effacés"
    });
  };
  
  // États pour les modals
  const [emergencyOrderOpen, setEmergencyOrderOpen] = useState(false);
  const [supplierAlertOpen, setSupplierAlertOpen] = useState(false);
  const [substituteSearchOpen, setSubstituteSearchOpen] = useState(false);
  const [orderProductOpen, setOrderProductOpen] = useState(false);
  const [substituteIndividualOpen, setSubstituteIndividualOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OutOfStockItem | null>(null);

  const handleUrgentMultipleOrder = () => {
    setEmergencyOrderOpen(true);
  };

  const handleAlertSuppliers = () => {
    setSupplierAlertOpen(true);
  };

  const handleSubstitutes = () => {
    setSubstituteSearchOpen(true);
  };

  const handleOrder = (product: OutOfStockItem) => {
    setSelectedProduct(product);
    setOrderProductOpen(true);
  };

  const handleSubstitute = (product: OutOfStockItem) => {
    setSelectedProduct(product);
    setSubstituteIndividualOpen(true);
  };

  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getDaysSinceLastStock = (lastExitDate: string | undefined) => {
    if (!lastExitDate) return null;
    const days = Math.floor((Date.now() - new Date(lastExitDate).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getUrgencyLevel = (lastExitDate: string | undefined, rotation: string) => {
    const days = getDaysSinceLastStock(lastExitDate);
    if (!days) return { level: 'unknown', color: 'bg-gray-100 text-gray-800', label: 'Inconnu' };
    
    if (rotation === 'rapide' && days > 3) {
      return { level: 'critical', color: 'bg-red-100 text-red-800', label: 'Critique' };
    } else if (rotation === 'normale' && days > 7) {
      return { level: 'high', color: 'bg-orange-100 text-orange-800', label: 'Élevée' };
    } else if (days > 14) {
      return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', label: 'Moyenne' };
    }
    
    return { level: 'low', color: 'bg-blue-100 text-blue-800', label: 'Faible' };
  };

  // Sort icon helper
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-3 w-3 ml-1" /> : 
      <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="space-y-6">
      {/* Statistiques des ruptures */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Total Ruptures</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {metrics.totalItems}
            </div>
            <p className="text-xs text-muted-foreground">Produits indisponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-700" />
              <span className="text-sm font-medium">Ruptures Critiques</span>
            </div>
            <div className="text-2xl font-bold text-red-700">
              {metrics.criticalItems}
            </div>
            <p className="text-xs text-muted-foreground">Forte rotation</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Rotation Rapide</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.rapidRotationItems}
            </div>
            <p className="text-xs text-muted-foreground">Priorité haute</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Ruptures Récentes</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.recentOutOfStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Dernière semaine</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Filtres</h3>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={rotationFilter || 'all'}
              onValueChange={(value) => setRotationFilter(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Rotation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="rapide">Rapide</SelectItem>
                <SelectItem value="normale">Normale</SelectItem>
                <SelectItem value="lente">Lente</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={urgencyFilter || 'all'}
              onValueChange={(value) => setUrgencyFilter(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Urgence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {outOfStockItems.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <strong>{allItemsCount}</strong> produit{allItemsCount > 1 ? 's' : ''} au total, 
              <strong> {outOfStockItems.length}</strong> affiché{outOfStockItems.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </Card>

      {/* Contrôles de pagination et actualisation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Afficher</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">résultats</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Actions d'urgence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Actions d'Urgence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" size="lg" onClick={handleUrgentMultipleOrder}>
              <ShoppingCart className="h-4 w-4" />
              Commande Urgente Multiple
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleAlertSuppliers}>
              <AlertCircle className="h-4 w-4" />
              Alerter Fournisseurs
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleSubstitutes}>
              <TrendingDown className="h-4 w-4" />
              Produits de Substitution
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des ruptures de stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Produits en Rupture de Stock ({allItemsCount})
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
          ) : allItemsCount === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <XCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium text-green-600">Parfait !</p>
              <p>Aucune rupture de stock détectée</p>
              <p className="text-sm mt-2">Tous vos produits sont disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('libelle_produit')}
                      >
                        <div className="flex items-center">
                          Produit
                          <SortIcon field="libelle_produit" />
                        </div>
                      </TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Famille/Rayon</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('rotation')}
                      >
                        <div className="flex items-center">
                          Rotation
                          <SortIcon field="rotation" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('date_derniere_sortie')}
                      >
                        <div className="flex items-center">
                          Dernière Sortie
                          <SortIcon field="date_derniere_sortie" />
                        </div>
                      </TableHead>
                      <TableHead>Durée Rupture</TableHead>
                      <TableHead>Urgence</TableHead>
                      <TableHead>Impact Ventes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outOfStockItems.map((product) => {
                      const urgency = getUrgencyLevel(product.date_derniere_sortie, product.rotation);
                      const daysSinceStock = getDaysSinceLastStock(product.date_derniere_sortie);
                      
                      return (
                        <TableRow key={product.id} className={urgency.level === 'critical' ? 'bg-red-50' : ''}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.libelle_produit}</div>
                              <div className="text-sm text-muted-foreground">
                                Critique: {product.stock_critique} • Faible: {product.stock_faible} • Max: {product.stock_limite}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.code_cip}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{product.famille_libelle || 'N/A'}</div>
                              <div className="text-muted-foreground">{product.rayon_libelle || 'N/A'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              product.rotation === 'rapide' ? 'bg-red-100 text-red-800' :
                              product.rotation === 'normale' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {product.rotation}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {product.date_derniere_sortie 
                                ? new Date(product.date_derniere_sortie).toLocaleDateString()
                                : 'Inconnue'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {daysSinceStock 
                                ? `${daysSinceStock} jour${daysSinceStock > 1 ? 's' : ''}`
                                : 'Inconnue'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={urgency.color}>
                              {urgency.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {(product.prix_vente_ttc * product.stock_limite).toLocaleString()} FCFA
                              </div>
                              <div className="text-muted-foreground">potentiel perdu</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant={urgency.level === 'critical' ? 'default' : 'outline'}
                                className="gap-1"
                                onClick={() => handleOrder(product)}
                              >
                                <ShoppingCart className="h-3 w-3" />
                                Commander
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1"
                                onClick={() => handleSubstitute(product)}
                              >
                                <AlertCircle className="h-3 w-3" />
                                Substitut
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, allItemsCount)} sur {allItemsCount} produits
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <OutOfStockEmergencyOrderModal
        open={emergencyOrderOpen}
        onOpenChange={setEmergencyOrderOpen}
        criticalItems={outOfStockItems.filter(item => 
          getUrgencyLevel(item.date_derniere_sortie, item.rotation).level === 'critical'
        )}
      />
      
      <SupplierAlertModal
        open={supplierAlertOpen}
        onOpenChange={setSupplierAlertOpen}
        products={outOfStockItems}
      />
      
      <SubstituteProductSearchModal
        open={substituteSearchOpen}
        onOpenChange={setSubstituteSearchOpen}
        products={outOfStockItems}
      />
      
      <OrderOutOfStockProductModal
        open={orderProductOpen}
        onOpenChange={setOrderProductOpen}
        product={selectedProduct}
      />
      
      <SubstituteIndividualModal
        open={substituteIndividualOpen}
        onOpenChange={setSubstituteIndividualOpen}
        product={selectedProduct}
      />
    </div>
  );
};

export default OutOfStockProducts;