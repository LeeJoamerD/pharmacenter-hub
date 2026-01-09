import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, ShoppingCart, Eye, Info } from 'lucide-react';
import ProductDetailsModal from '../modals/ProductDetailsModal';
import { OrderLowStockModal } from '../modals/OrderLowStockModal';
import { getStockThresholds, calculateStockStatus, calculateRotation } from '@/utils/stockThresholds';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useLanguage } from '@/contexts/LanguageContext';
const CriticalStock = React.memo(() => {
  const { tenantId } = useTenant();
  const { t } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Requête autonome pour charger tous les produits avec stock > 0 et calculer le statut critique
  const { data: allCriticalProducts = [], isLoading } = useQuery({
    queryKey: ['critical-stock-component', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      // Charger tous les produits avec stock > 0 (pagination pour > 1000 produits)
      let allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('produits_with_stock')
          .select('id, libelle_produit, code_cip, prix_achat, stock_actuel, stock_critique, stock_faible, stock_limite')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .gt('stock_actuel', 0)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allProducts = [...allProducts, ...data];
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Calculer le statut avec les bons seuils (2, 5, 10) depuis stockThresholds.ts
      const productsWithStatus = allProducts.map(p => {
        const thresholds = getStockThresholds({
          stock_critique: p.stock_critique,
          stock_faible: p.stock_faible,
          stock_limite: p.stock_limite
        });
        return {
          ...p,
          produit_id: p.id,
          statut_stock: calculateStockStatus(p.stock_actuel, thresholds),
          rotation: calculateRotation(p.stock_actuel, thresholds),
        };
      });

      // Filtrer uniquement les produits critiques
      return productsWithStatus.filter(p => p.statut_stock === 'critique');
    },
    enabled: !!tenantId,
    staleTime: 30000,
  });

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
    allCriticalProducts
      .sort((a, b) => {
        const rotationOrder = { rapide: 0, normale: 1, lente: 2 };
        return rotationOrder[a.rotation as keyof typeof rotationOrder] - 
               rotationOrder[b.rotation as keyof typeof rotationOrder];
      })
      .slice(0, 8),
    [allCriticalProducts]
  );

  const totalCriticalProducts = allCriticalProducts.length;

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
            {t('criticalStock')}
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
                  <p>{t('criticalStockDescription')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criticalProducts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-success" />
              <p className="font-medium text-success">{t('excellent')}</p>
              <p className="text-sm">{t('noCriticalStock')}</p>
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
                          {product.statut_stock === 'rupture' ? t('outOfStock').toUpperCase() : t('critical').toUpperCase()}
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
                        {t('stockLimit')}: {product.stock_limite}
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
                      {t('order')}
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
                    {t('viewAll')} ({totalCriticalProducts})
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
