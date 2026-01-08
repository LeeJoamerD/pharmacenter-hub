import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface StockRuptureProps {
  products: any[];
}

export const StockRupture: React.FC<StockRuptureProps> = ({ products }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const ruptureProducts = useMemo(() => 
    products
      .filter(p => p.statut_stock === 'rupture')
      .slice(0, 8),
    [products]
  );

  const totalRuptureProducts = useMemo(() => 
    products.filter(p => p.statut_stock === 'rupture').length,
    [products]
  );

  const handleViewAll = () => {
    navigate('/tableau-de-bord/stock/stock-actuel/rupture');
  };

  if (ruptureProducts.length === 0) {
    return (
      <Card className="h-full border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            {t('outOfStock')}
            <Badge variant="secondary">0</Badge>
          </CardTitle>
          <CardDescription>
            {t('noOutOfStockProducts')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-success/10 p-3 mb-3">
              <XCircle className="h-8 w-8 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('allProductsAvailable')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            {t('outOfStock')}
            {totalRuptureProducts > 0 && (
              <Badge variant="destructive">
                {totalRuptureProducts}
              </Badge>
            )}
          </CardTitle>
          {totalRuptureProducts > 8 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleViewAll}
              className="text-xs"
            >
              {t('viewAll')} ({totalRuptureProducts})
            </Button>
          )}
        </div>
        <CardDescription>
          {t('outOfStockDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ruptureProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-start justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="font-medium text-sm truncate text-foreground">
                    {product.libelle_produit}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {product.code_cip}
                </p>
              </div>
              <div className="flex flex-col items-end ml-3">
                <Badge variant="destructive" className="text-xs whitespace-nowrap">
                  {t('rupture')}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('stockLabel')}: 0
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {totalRuptureProducts > 8 && (
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={handleViewAll}
          >
            {t('viewAllOutOfStock')} ({totalRuptureProducts})
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
