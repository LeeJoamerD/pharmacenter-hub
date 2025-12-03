import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Package, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { POSProduct } from '@/types/pos';
import { usePOSProductsPaginated } from '@/hooks/usePOSProductsPaginated';
import { useDebouncedValue } from '@/hooks/use-debounce';

interface ProductSearchProps {
  onAddToCart: (product: POSProduct, quantity?: number) => void;
}

const ProductSearch = ({ onAddToCart }: ProductSearchProps) => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  
  const { 
    products, 
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    setCurrentPage,
    getProductLots
  } = usePOSProductsPaginated(debouncedSearch, 50);

  const handleAddToCart = async (product: POSProduct) => {
    // Récupérer les lots à la demande pour ce produit
    const lots = await getProductLots(product.id);
    onAddToCart({ ...product, lots });
  };

  // Afficher un message si pas assez de caractères
  const showSearchPrompt = debouncedSearch.length < 2;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, DCI ou code-barres..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Product count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{showSearchPrompt ? '0' : totalCount} produits disponibles</span>
        {totalPages > 1 && (
          <span>Page {currentPage} / {totalPages}</span>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {showSearchPrompt ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Tapez au moins 2 caractères pour rechercher</p>
            <p className="text-xs mt-1">ou scannez un code-barres</p>
          </div>
        ) : products.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          products.map(product => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{product.name}</h4>
                      {product.requiresPrescription && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Ordonnance
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      DCI: {product.dci}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-primary">
                          {product.price.toLocaleString()} FCFA
                        </span>
                        <Badge 
                          variant={product.stock > 10 ? 'default' : product.stock > 0 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          Stock: {product.stock}
                        </Badge>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination - seulement si recherche active et plusieurs pages */}
      {!showSearchPrompt && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground min-w-[100px] text-center">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || isLoading}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;