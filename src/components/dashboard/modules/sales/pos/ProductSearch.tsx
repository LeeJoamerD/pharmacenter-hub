import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Package, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Clock, Layers } from 'lucide-react';
import { POSProduct, LotInfo } from '@/types/pos';
import { usePOSProductsPaginated } from '@/hooks/usePOSProductsPaginated';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import LotSelectorModal from './LotSelectorModal';

interface ProductSearchProps {
  onAddToCart: (product: POSProduct, quantity?: number) => void;
}

const ProductSearch = ({ onAddToCart }: ProductSearchProps) => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const { formatAmount } = useCurrencyFormatting();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // État pour la sélection de lot
  const [lotSelectorOpen, setLotSelectorOpen] = useState(false);
  const [selectedProductForLot, setSelectedProductForLot] = useState<POSProduct | null>(null);
  const [availableLots, setAvailableLots] = useState<LotInfo[]>([]);
  
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
    // Bloquer l'ajout si tous les lots sont expirés
    if (product.all_lots_expired) {
      toast({
        title: t('expiredProduct') || 'Produit expiré',
        description: t('expiredProductMessage') || 'Impossible d\'ajouter ce produit au panier car tous ses lots sont expirés.',
        variant: 'destructive'
      });
      return;
    }

    // Récupérer les lots à la demande pour ce produit
    const lots = await getProductLots(product.id);
    
    // Si plusieurs lots disponibles, ouvrir le modal de sélection
    if (lots.length > 1) {
      setSelectedProductForLot({ ...product, lots });
      setAvailableLots(lots);
      setLotSelectorOpen(true);
      return;
    }
    
    // Si un seul lot ou aucun, ajouter directement avec FIFO
    onAddToCart({ ...product, lots });
    
    // Réinitialiser la recherche après ajout au panier
    setSearchInput('');
    setCurrentPage(1);
  };

  // Callback quand l'utilisateur sélectionne un lot spécifique
  const handleLotSelected = (product: POSProduct, selectedLot: LotInfo) => {
    // Réorganiser les lots pour mettre le lot sélectionné en premier
    const reorderedLots = [selectedLot, ...product.lots.filter(l => l.id !== selectedLot.id)];
    onAddToCart({ ...product, lots: reorderedLots });
    
    // Réinitialiser
    setSearchInput('');
    setCurrentPage(1);
    setLotSelectorOpen(false);
    setSelectedProductForLot(null);
    setAvailableLots([]);
    
    toast({
      title: 'Lot sélectionné',
      description: `Lot ${selectedLot.numero_lot} ajouté au panier`,
    });
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
            <Card 
              key={product.id} 
              className={cn(
                "hover:shadow-md transition-shadow",
                product.all_lots_expired && "border-destructive bg-destructive/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className={cn(
                        "font-medium truncate",
                        product.all_lots_expired && "text-destructive"
                      )}>
                        {product.name}
                      </h4>
                      {product.all_lots_expired && (
                        <Badge variant="destructive" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {t('allLotsExpired') || 'Tous lots expirés'}
                        </Badge>
                      )}
                      {product.requiresPrescription && (
                        <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
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
                        <span className={cn(
                          "font-bold",
                          product.all_lots_expired ? "text-destructive" : "text-primary"
                        )}>
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
                        disabled={product.stock === 0 || product.all_lots_expired}
                        className={cn(
                          "shrink-0",
                          product.all_lots_expired && "opacity-50 cursor-not-allowed"
                        )}
                        variant={product.all_lots_expired ? "outline" : "default"}
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

      {/* Modal de sélection de lot */}
      {selectedProductForLot && (
        <LotSelectorModal
          open={lotSelectorOpen}
          onOpenChange={setLotSelectorOpen}
          product={selectedProductForLot}
          lots={availableLots}
          onSelectLot={handleLotSelected}
        />
      )}
    </div>
  );
};

export default ProductSearch;