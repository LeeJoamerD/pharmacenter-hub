import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, ShoppingCart, Eye, Info } from 'lucide-react';
import ProductDetailsModal from '../modals/ProductDetailsModal';
import { OrderLowStockModal } from '../modals/OrderLowStockModal';

interface CriticalStockProps {
  products: any[];
}

const CriticalStock = React.memo(({ products }: CriticalStockProps) => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const handleOrder = useCallback((product: any) => {
    setSelectedProduct(product);
    setIsOrderModalOpen(true);
  }, []);

  const handleDetails = useCallback((product: any) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  }, []);

  const handleViewAll = useCallback(() => {
    setTimeout(() => {
      const table = document.querySelector('[data-component="available-products-table"]');
      if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  const criticalProducts = useMemo(() => 
    products
      .filter(p => p.statut_stock === 'critique')
      .sort((a, b) => {
        const rotationOrder = { rapide: 0, normale: 1, lente: 2 };
        return rotationOrder[a.rotation as keyof typeof rotationOrder] - 
               rotationOrder[b.rotation as keyof typeof rotationOrder];
      })
      .slice(0, 8),
    [products]
  );

  const totalCriticalProducts = useMemo(() => 
    products.filter(p => p.statut_stock === 'critique').length,
    [products]
  );

  // Debug: Afficher les informations de produits critiques
  useEffect(() => {
    console.log('[CriticalStock Component Debug]', {
      total_products_received: products.length,
      products_with_critique_status: products.filter(p => p.statut_stock === 'critique').length,
      displayed_critical_products: criticalProducts.length,
      all_statuses: [...new Set(products.map(p => p.statut_stock))],
      sample_products: products.slice(0, 3).map(p => ({
        name: p.libelle_produit,
        stock: p.stock_actuel,
        statut: p.statut_stock,
      }))
    });
  }, [products, criticalProducts]);

  const getSeverityColor = useCallback((status: string) => {
    switch (status) {
      case 'rupture': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'critique': return 'bg-[hsl(38_92%_50%)]/10 text-[hsl(38_92%_50%)] border-[hsl(38_92%_50%)]/20';
      default: return 'bg-muted text-muted-foreground';
    }
  }, []);

  const getRotationColor = useCallback((rotation: string) => {
    switch (rotation) {
      case 'rapide': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'normale': return 'bg-warning/10 text-warning border-warning/20';
      case 'lente': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground';
    }
  }, []);

  return (
    <>
      {selectedProduct && (
        <>
          <ProductDetailsModal
            productId={selectedProduct.produit_id}
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
      
      <Card className="transition-all duration-300 hover:shadow-lg border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Stock Critique
            {totalCriticalProducts > 0 && (
              <Badge variant="destructive">
                {totalCriticalProducts}
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Produits nécessitant un réapprovisionnement urgent (stock très faible mais &gt; 0)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criticalProducts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-success" />
              <p className="font-medium text-success">Excellent !</p>
              <p className="text-sm">Aucun stock critique détecté</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalProducts.map((product) => (
                <div key={product.produit_id} className="p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" title={product.libelle_produit}>
                        {product.libelle_produit}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {product.code_cip}
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Badge className={getSeverityColor(product.statut_stock)} variant="outline">
                          {product.statut_stock === 'rupture' ? 'RUPTURE' : 'CRITIQUE'}
                        </Badge>
                        <Badge className={getRotationColor(product.rotation)} variant="outline">
                          {product.rotation}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-lg">
                        {product.stock_actuel}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Limite: {product.stock_limite}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mt-2">
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="flex-1 h-7 text-xs"
                      onClick={() => handleOrder(product)}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Commander
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 w-7 p-0"
                      onClick={() => handleDetails(product)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {totalCriticalProducts > 8 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" onClick={handleViewAll}>
                    Voir tous ({totalCriticalProducts})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
});

CriticalStock.displayName = 'CriticalStock';

export default CriticalStock;
