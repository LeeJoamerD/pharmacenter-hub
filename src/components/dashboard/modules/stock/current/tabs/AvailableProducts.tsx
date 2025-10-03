import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Search, Filter, ShoppingCart, Eye } from 'lucide-react';
import { useCurrentStock } from '@/hooks/useCurrentStock';
import AvailableStockDashboard from '../dashboard/AvailableStockDashboard';
import ProductDetailsModal from '../modals/ProductDetailsModal';
import AddToCartModal from '../modals/AddToCartModal';
import { OrderLowStockModal } from '../modals/OrderLowStockModal';

const AvailableProducts = () => {
  const { 
    products, 
    families, 
    rayons, 
    filters, 
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

            <Button onClick={() => {
              filters.setSearchTerm('');
              filters.setSelectedFamily('');
              filters.setSelectedRayon('');
            }} variant="outline">
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produits Disponibles ({availableProducts.length})
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
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default AvailableProducts;