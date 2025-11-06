import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, TrendingUp, Eye, ShoppingCart, Info } from 'lucide-react';
import ProductDetailsModal from '../modals/ProductDetailsModal';
import { OrderLowStockModal } from '../modals/OrderLowStockModal';
import { useCurrency } from '@/contexts/CurrencyContext';

interface FastMovingItemsProps {
  products: any[];
}

const FastMovingItems = React.memo(({ products }: FastMovingItemsProps) => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const { formatPrice } = useCurrency();

  const handleMonitor = useCallback((product: any) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  }, []);

  const handleReorder = useCallback((product: any) => {
    setSelectedProduct(product);
    setIsOrderModalOpen(true);
  }, []);

  const handleViewAll = useCallback(() => {
    setTimeout(() => {
      const table = document.querySelector('[data-component="available-products-table"]');
      if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  const fastMovingProducts = useMemo(() => 
    products
      .filter(p => p.rotation === 'rapide' && p.stock_actuel > 0)
      .sort((a, b) => b.valeur_stock - a.valeur_stock)
      .slice(0, 8),
    [products]
  );

  const totalFastMovingProducts = useMemo(() => 
    products.filter(p => p.rotation === 'rapide' && p.stock_actuel > 0).length,
    [products]
  );

  const getStockStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'normal': return 'bg-success/10 text-success border-success/20';
      case 'faible': return 'bg-warning/10 text-warning border-warning/20';
      case 'critique': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  }, []);

  return (
    <>
      {selectedProduct && (
        <>
          <ProductDetailsModal
            productId={selectedProduct.id}
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedProduct(null);
            }}
          />
          <OrderLowStockModal
            open={isOrderModalOpen}
            onOpenChange={(open) => {
              setIsOrderModalOpen(open);
              if (!open) setSelectedProduct(null);
            }}
            product={selectedProduct}
          />
        </>
      )}
      
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-info" />
            Produits à Rotation Rapide
            {totalFastMovingProducts > 0 && (
              <Badge className="bg-info/10 text-info border-info/20">
                {totalFastMovingProducts}
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Produits à forte rotation nécessitant un suivi attentif</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fastMovingProducts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="font-medium">Aucun produit à rotation rapide</p>
              <p className="text-sm">Les produits performants apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fastMovingProducts.map((product, index) => (
                <div key={product.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Badge variant="outline" className="bg-info/10 text-info border-info/20 flex-shrink-0">
                      #{index + 1}
                    </Badge>
                      
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" title={product.libelle_produit}>
                        {product.libelle_produit}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {product.code_cip}
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Badge className={getStockStatusColor(product.statut_stock)} variant="outline">
                          {product.statut_stock}
                        </Badge>
                        <Badge className="bg-success/10 text-success border-success/20" variant="outline">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Rapide
                        </Badge>
                      </div>
                    </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-lg">
                        {product.stock_actuel}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(product.valeur_stock)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-7 text-xs"
                      onClick={() => handleMonitor(product)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Surveiller
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-7 text-xs"
                      onClick={() => handleReorder(product)}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Réappro
                    </Button>
                  </div>
                </div>
              ))}
              
              {totalFastMovingProducts > 8 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" onClick={handleViewAll}>
                    Voir tous ({totalFastMovingProducts})
                  </Button>
                </div>
              )}
              
              <div className="pt-3 border-t">
                <div className="text-xs text-muted-foreground text-center">
                  💡 Ces produits se vendent rapidement et nécessitent un suivi attentif
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
});

FastMovingItems.displayName = 'FastMovingItems';

export default FastMovingItems;
