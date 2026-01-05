import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Package, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { POSProduct } from '@/types/pos';
import { usePOSProductsPaginated } from '@/hooks/usePOSProductsPaginated';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useLanguage } from '@/contexts/LanguageContext';
interface ProductSearchProps {
  onAddToCart: (product: POSProduct, quantity?: number) => void;
}

const ProductSearch = ({ onAddToCart }: ProductSearchProps) => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const { formatAmount } = useCurrencyFormatting();
  const { t } = useLanguage();
  
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
    
    // Réinitialiser la recherche après ajout au panier
    setSearchInput('');
    setCurrentPage(1);
  };

  // Afficher un message si pas assez de caractères
  const showSearchPrompt = debouncedSearch.length < 2;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchByNameDciBarcode')}
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
        <span>{showSearchPrompt ? '0' : totalCount} {t('productsAvailable')}</span>
        {totalPages > 1 && (
          <span>{t('page')} {currentPage} / {totalPages}</span>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {showSearchPrompt ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('typeMinChars')}</p>
            <p className="text-xs mt-1">{t('orScanBarcode')}</p>
          </div>
        ) : products.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noProductsFoundSearch')}</p>
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
                          {t('prescriptionRequired')}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      DCI: {product.dci}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-primary">
                          {formatAmount(product.price)}
                        </span>
                        <Badge 
                          variant={product.stock > 10 ? 'default' : product.stock > 0 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {t('stockLabel')}: {product.stock}
                        </Badge>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t('addBtn')}
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
            {t('previousBtn')}
          </Button>
          <span className="text-sm text-muted-foreground min-w-[100px] text-center">
            {t('page')} {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || isLoading}
          >
            {t('nextBtn')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;