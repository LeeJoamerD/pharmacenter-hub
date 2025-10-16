import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Search, Filter, ShoppingCart, Eye, ArrowUpDown, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, CheckSquare, AlertCircle, RefreshCw, PackagePlus, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentStockPaginated } from '@/hooks/useCurrentStockPaginated';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { NotificationBadge } from '../NotificationBadge';
import AvailableStockDashboard from '../dashboard/AvailableStockDashboard';
import ProductDetailsModal from '../modals/ProductDetailsModal';
import AddToCartModal from '../modals/AddToCartModal';
import { OrderLowStockModal } from '../modals/OrderLowStockModal';
import { BulkActionsModal } from '../modals/BulkActionsModal';
import QuickLotCreationModal from '../modals/QuickLotCreationModal';
import EditProductThresholdsModal from '../modals/EditProductThresholdsModal';

const AvailableProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedRayon, setSelectedRayon] = useState('');
  const [sortBy, setSortBy] = useState('libelle_produit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  
  const { 
    products, 
    allProductsCount,
    families, 
    rayons, 
    isLoading,
    metrics,
    totalPages,
    refreshData 
  } = useCurrentStockPaginated(
    debouncedSearchTerm,
    50,
    {
      famille_id: selectedFamily,
      rayon_id: selectedRayon,
    },
    {
      field: sortBy === 'libelle_produit' ? 'name' : 
             sortBy === 'stock_actuel' ? 'stock' : 
             sortBy === 'valorisation' ? 'value' : 'rotation',
      order: sortOrder
    }
  );

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isBulkActionsModalOpen, setIsBulkActionsModalOpen] = useState(false);
  const [isQuickLotModalOpen, setIsQuickLotModalOpen] = useState(false);
  const [isEditThresholdsModalOpen, setIsEditThresholdsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string | null;
    name: string;
    stockLimit?: number;
    stockAlert?: number;
  }>({ id: null, name: '', stockLimit: 0, stockAlert: 0 });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const { toast } = useToast();

  // Vérifier les alertes critiques
  useEffect(() => {
    if (metrics.criticalStockProducts > 0 && !showCriticalAlert) {
      setShowCriticalAlert(true);
      toast({
        title: "Alerte Stock Critique",
        description: `${metrics.criticalStockProducts} produit(s) en stock critique nécessitent une action immédiate.`,
        variant: "destructive",
      });
    }
  }, [metrics.criticalStockProducts]);

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleExportExcel = () => {
    const selectedData = selectedProducts.length > 0
      ? products.filter(p => selectedProducts.includes(p.id))
      : products;
    
    exportToExcel(selectedData);
    toast({
      title: "Export réussi",
      description: `${selectedData.length} produit(s) exporté(s) en Excel.`,
    });
  };

  const handleExportPDF = () => {
    const selectedData = selectedProducts.length > 0
      ? products.filter(p => selectedProducts.includes(p.id))
      : products;
    
    exportToPDF(selectedData);
    toast({
      title: "Export réussi",
      description: `${selectedData.length} produit(s) exporté(s) en PDF.`,
    });
  };

  const handleBulkActions = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Aucun produit sélectionné",
        description: "Veuillez sélectionner au moins un produit pour effectuer des actions groupées.",
        variant: "destructive",
      });
      return;
    }
    setIsBulkActionsModalOpen(true);
  };

  const handleViewDetails = (product: any) => {
    setSelectedProduct({ 
      id: product.id, 
      name: product.libelle_produit,
      stockLimit: product.stock_limite,
      stockAlert: product.stock_alerte
    });
    setIsDetailsModalOpen(true);
  };

  const handleAddToCart = (product: any) => {
    setSelectedProduct({ 
      id: product.id, 
      name: product.libelle_produit,
      stockLimit: product.stock_limite,
      stockAlert: product.stock_alerte
    });
    setIsCartModalOpen(true);
  };

  const handleOrder = (product: any) => {
    setSelectedProduct({ 
      id: product.id, 
      name: product.libelle_produit,
      stockLimit: product.stock_limite,
      stockAlert: product.stock_alerte
    });
    setIsOrderModalOpen(true);
  };

  const handleQuickLotCreation = (product: any) => {
    setSelectedProduct({ 
      id: product.id, 
      name: product.libelle_produit,
      stockLimit: product.stock_limite,
      stockAlert: product.stock_alerte
    });
    setIsQuickLotModalOpen(true);
  };

  const handleEditThresholds = (product: any) => {
    setSelectedProduct({ 
      id: product.id, 
      name: product.libelle_produit,
      stockLimit: product.stock_limite,
      stockAlert: product.stock_alerte
    });
    setIsEditThresholdsModalOpen(true);
  };

  const handleRefresh = () => {
    refreshData();
    toast({
      title: "Données actualisées",
      description: "Les données de stock ont été rechargées depuis la base de données."
    });
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
        productId={selectedProduct.id}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedProduct({ id: null, name: '', stockLimit: 0, stockAlert: 0 });
        }}
      />
      <AddToCartModal
        productId={selectedProduct.id}
        productName={selectedProduct.name}
        isOpen={isCartModalOpen}
        onClose={() => {
          setIsCartModalOpen(false);
          setSelectedProduct({ id: null, name: '', stockLimit: 0, stockAlert: 0 });
        }}
      />
      {selectedProduct.id && (
        <OrderLowStockModal
          open={isOrderModalOpen}
          onOpenChange={(open) => {
            setIsOrderModalOpen(open);
            if (!open) setSelectedProduct({ id: null, name: '', stockLimit: 0, stockAlert: 0 });
          }}
          product={products.find(p => p.id === selectedProduct.id)!}
        />
      )}
      <QuickLotCreationModal
        productId={selectedProduct.id}
        productName={selectedProduct.name}
        isOpen={isQuickLotModalOpen}
        onClose={() => {
          setIsQuickLotModalOpen(false);
          setSelectedProduct({ id: null, name: '', stockLimit: 0, stockAlert: 0 });
        }}
        onSuccess={handleRefresh}
      />
      <EditProductThresholdsModal
        productId={selectedProduct.id}
        productName={selectedProduct.name}
        currentStockLimit={selectedProduct.stockLimit}
        currentStockAlert={selectedProduct.stockAlert}
        isOpen={isEditThresholdsModalOpen}
        onClose={() => {
          setIsEditThresholdsModalOpen(false);
          setSelectedProduct({ id: null, name: '', stockLimit: 0, stockAlert: 0 });
        }}
        onSuccess={handleRefresh}
      />
      <BulkActionsModal
        open={isBulkActionsModalOpen}
        onOpenChange={setIsBulkActionsModalOpen}
        selectedProducts={products.filter(p => selectedProducts.includes(p.id))}
        onActionComplete={() => {
          setSelectedProducts([]);
          toast({
            title: "Actions groupées terminées",
            description: "Les modifications ont été appliquées avec succès.",
          });
        }}
      />
      
      <div className="space-y-6">
      {/* Dashboard rapide avec badge de notifications */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Stock Disponible</h2>
        <NotificationBadge 
          count={metrics.criticalStockProducts + metrics.lowStockProducts}
          onClick={() => {
            setSelectedFamily('');
            setSelectedRayon('');
            setSearchTerm('');
            setCurrentPage(1);
          }}
        />
      </div>
      
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedFamily} onValueChange={setSelectedFamily}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les familles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les familles</SelectItem>
                {families.map((family: any) => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.libelle_famille}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRayon} onValueChange={setSelectedRayon}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les rayons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les rayons</SelectItem>
                {rayons.map((rayon: any) => (
                  <SelectItem key={rayon.id} value={rayon.id}>
                    {rayon.libelle_rayon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select 
                value={sortBy} 
                onValueChange={(value) => setSortBy(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libelle_produit">Nom</SelectItem>
                  <SelectItem value="stock_actuel">Stock actuel</SelectItem>
                  <SelectItem value="valorisation">Valorisation</SelectItem>
                  <SelectItem value="rotation">Rotation</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            
            <Button onClick={() => {
              setSearchTerm('');
              setSelectedFamily('');
              setSelectedRayon('');
              setCurrentPage(1);
            }} variant="outline">
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerte stock critique */}
      {metrics.criticalStockProducts > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive">Stock Critique Détecté</h4>
                <p className="text-sm text-muted-foreground">
                  {metrics.criticalStockProducts} produit(s) nécessitent une action immédiate
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  setSelectedFamily('');
                  setSelectedRayon('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                Voir les produits
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions d'export et sélection */}
      <Card data-component="available-products-table">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produits Disponibles ({allProductsCount})
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedProducts.length > 0 && (
                <Badge variant="secondary" className="mr-2">
                  {selectedProducts.length} sélectionné(s)
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkActions}
                disabled={selectedProducts.length === 0}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Actions groupées
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
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
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4" />
              <p>Aucun produit disponible trouvé avec les filtres sélectionnés</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
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
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleSelectProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.libelle_produit}</div>
                          {product.derniere_sortie && (
                            <div className="text-sm text-muted-foreground">
                              Dernière sortie: {new Date(product.derniere_sortie).toLocaleDateString()}
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
                            onClick={() => handleViewDetails(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddToCart(product)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          {/* Bouton Commander visible uniquement pour stock faible/critique */}
                          {(product.statut_stock === 'faible' || product.statut_stock === 'critique') && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleOrder(product)}
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
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Affichage de {((currentPage - 1) * 50) + 1} à{' '}
                {Math.min(currentPage * 50, allProductsCount)} sur{' '}
                {allProductsCount} produits
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </Button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return <span key={pageNum} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
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