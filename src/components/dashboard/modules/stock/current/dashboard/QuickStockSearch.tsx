import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Package, Clock, Info } from 'lucide-react';

interface QuickStockSearchProps {
  products: any[];
}

const QuickStockSearch = React.memo(({ products }: QuickStockSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Optimisation avec useMemo pour la recherche
  const quickResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    return products
      .filter(product => 
        product.libelle_produit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code_cip?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5);
  }, [searchTerm, products]);

  // Optimisation avec useCallback
  const handleQuickSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const getStockStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'normal': return 'bg-success/10 text-success border-success/20';
      case 'faible': return 'bg-warning/10 text-warning border-warning/20';
      case 'critique': return 'bg-[hsl(38_92%_50%)]/10 text-[hsl(38_92%_50%)] border-[hsl(38_92%_50%)]/20';
      case 'rupture': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  }, []);

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Recherche Rapide
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Recherchez un produit par nom ou code CIP</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => handleQuickSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {quickResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {quickResults.map((product) => (
              <div key={product.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{product.libelle_produit}</div>
                    <div className="text-xs text-muted-foreground font-mono">{product.code_cip}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{product.stock_actuel}</div>
                    <Badge className={getStockStatusColor(product.statut_stock)} variant="outline">
                      {product.statut_stock}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchTerm && quickResults.length === 0 && (
          <div className="text-center py-4 text-muted-foreground animate-fade-in">
            <Package className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Aucun produit trouvé</p>
          </div>
        )}

        {!searchTerm && (
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Tapez pour rechercher un produit</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

QuickStockSearch.displayName = 'QuickStockSearch';

export default QuickStockSearch;
