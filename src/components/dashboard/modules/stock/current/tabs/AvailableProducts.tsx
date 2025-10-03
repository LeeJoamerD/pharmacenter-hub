import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Search, Filter, ShoppingCart, Eye, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentStock } from '@/hooks/useCurrentStock';
import AvailableStockDashboard from '../dashboard/AvailableStockDashboard';
import ProductDetailsModal from '../modals/ProductDetailsModal';
import AddToCartModal from '../modals/AddToCartModal';
import { OrderLowStockModal } from '../modals/OrderLowStockModal';

const AvailableProducts = () => {
  const { 
    products, 
    allProductsCount,
    families, 
    rayons, 
    filters,
    sorting,
    pagination,
    isLoading 
  } = useCurrentStock();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [cartProductName, setCartProductName] = useState('');

  const availableProducts = products.filter(p => p.stock_actuel > 0);

  const handleViewDetails = (productId: string) => {
    setSelectedProductId(productId);
    setIsDetailsModalOpen(true);
  };

  const handleAddToCart = (productId: string, productName: string) => {
    setSelectedProductId(productId);
    setCartProductName(productName);
    setIsCartModalOpen(true);
  };

  const handleOrder = (productId: string) => {
    setSelectedProductId(productId);
    setIsOrderModalOpen(true);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'faible': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critique': return 'bg-red-100 text-red-800 border-red-200';
      case 'surstock': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRotationColor = (rotation: string) => {
    switch (rotation) {
      case 'rapide': return 'bg-green-100 text-green-800';
      case 'normale': return 'bg-blue-100 text-blue-800';
      case 'lente': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <ProductDetailsModal
        productId={selectedProductId}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedProductId(null);
        }}
      />
      <AddToCartModal
        productId={selectedProductId}
        productName={cartProductName}
        isOpen={isCartModalOpen}
        onClose={() => {
          setIsCartModalOpen(false);
          setSelectedProductId(null);
          setCartProductName('');
        }}
      />
      {selectedProductId && (
        <OrderLowStockModal
          open={isOrderModalOpen}
          onOpenChange={(open) => {
            setIsOrderModalOpen(open);
            if (!open) setSelectedProductId(null);
          }}
          product={availableProducts.find(p => p.id === selectedProductId)!}
        />
      )}
      
      <div className="space-y-6">
      {/* Dashboard rapide */}
      <AvailableStockDashboard />

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={filters.searchTerm}
                onChange={(e) => filters.setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filters.selectedFamily} onValueChange={filters.setSelectedFamily}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les familles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les familles</SelectItem>
                {families.map((family: any) => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.libelle_famille}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.selectedRayon} onValueChange={filters.setSelectedRayon}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les rayons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rayons</SelectItem>
                {rayons.map((rayon: any) => (
                  <SelectItem key={rayon.id} value={rayon.id}>
                    {rayon.libelle_rayon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.stockFilter} onValueChange={filters.setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut du stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="available">Disponibles</SelectItem>
                <SelectItem value="low">Stock faible</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="out">Rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Select 
              value={sorting.sortBy} 
              onValueChange={(value) => sorting.setSortBy(value as 'name' | 'stock' | 'value' | 'rotation')}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="stock">Stock actuel</SelectItem>
                <SelectItem value="value">Valorisation</SelectItem>
                <SelectItem value="rotation">Rotation</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => sorting.setSortOrder(sorting.sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            
            <Button onClick={() => {
              filters.setSearchTerm('');
              filters.setSelectedFamily('');
              filters.setSelectedRayon('');
              filters.setStockFilter('all');
              pagination.setCurrentPage(1);
            }} variant="outline">
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produits Disponibles ({allProductsCount})
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Page {pagination.currentPage} sur {pagination.totalPages}</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-8 w-[80px]" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              ))}
            </div>
          ) : availableProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4" />
              <p>Aucun produit disponible trouvé avec les filtres sélectionnés</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Famille/Rayon</TableHead>
                    <TableHead>Stock Actuel</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Rotation</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Valorisation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.libelle_produit}</div>
                          {product.date_derniere_sortie && (
                            <div className="text-sm text-muted-foreground">
                              Dernière sortie: {new Date(product.date_derniere_sortie).toLocaleDateString()}
                            </div>
                          )}
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
                        <div className="font-semibold">{product.stock_actuel}</div>
                        <div className="text-sm text-muted-foreground">
                          Limite: {product.stock_limite}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStockStatusColor(product.statut_stock)}>
                          {product.statut_stock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRotationColor(product.rotation)}>
                          {product.rotation}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Achat: {product.prix_achat.toLocaleString()} FCFA</div>
                          <div>Vente: {product.prix_vente_ttc.toLocaleString()} FCFA</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {product.valeur_stock.toLocaleString()} FCFA
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(product.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddToCart(product.id, product.libelle_produit)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          {/* Bouton Commander visible uniquement pour stock faible/critique */}
                          {(product.statut_stock === 'faible' || product.statut_stock === 'critique') && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleOrder(product.id)}
                              className="bg-primary"
                            >
                              Commander
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Affichage de {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} à{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, allProductsCount)} sur{' '}
                {allProductsCount} produits
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.setCurrentPage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => pagination.setCurrentPage(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </Button>
                      );
                    } else if (
                      pageNum === pagination.currentPage - 2 ||
                      pageNum === pagination.currentPage + 2
                    ) {
                      return <span key={pageNum} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.setCurrentPage(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default AvailableProducts;