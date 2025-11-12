import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Package, Clock, Info, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAlertSettings } from '@/hooks/useAlertSettings';
import { getStockThreshold } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounce';

interface QuickStockSearchProps {
  products: any[];
}

const QuickStockSearch = React.memo(({ products }: QuickStockSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { tenantId } = useTenant();
  const { settings } = useAlertSettings();
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Recherche dynamique dans la base de données
  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useQuery({
    queryKey: ['quick-stock-search', debouncedSearchTerm, tenantId],
    queryFn: async () => {
      console.log('[QuickStockSearch] Starting search:', debouncedSearchTerm);
      
      if (!debouncedSearchTerm.trim() || !tenantId) return [];
      
      try {
        // Charger les produits avec une requête plus simple
        const { data: productsData, error: productsError } = await supabase
          .from('produits')
          .select('id, libelle_produit, code_cip, prix_achat, stock_critique, stock_faible, stock_limite')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .or(`libelle_produit.ilike.%${debouncedSearchTerm.trim()}%,code_cip.ilike.%${debouncedSearchTerm.trim()}%`)
          .limit(50);

        if (productsError) {
          console.error('[QuickStockSearch] Error loading products:', productsError);
          throw productsError;
        }

        console.log('[QuickStockSearch] Products found:', productsData?.length || 0);

        // Charger les lots séparément pour chaque produit
        const productsWithStock = await Promise.all(
          (productsData || []).map(async (product) => {
            const { data: lots } = await supabase
              .from('lots')
              .select('quantite_restante, prix_achat_unitaire')
              .eq('produit_id', product.id)
              .gt('quantite_restante', 0);

            const stock_actuel = (lots || []).reduce((sum, lot) => sum + (lot.quantite_restante || 0), 0);

            if (stock_actuel === 0) return null; // Exclure produits sans stock

            const seuil_critique = getStockThreshold('critical', product.stock_critique, settings?.critical_stock_threshold);
            const seuil_faible = getStockThreshold('low', product.stock_faible, settings?.low_stock_threshold);

            let statut_stock = 'normal';
            if (stock_actuel === 0) statut_stock = 'rupture';
            else if (stock_actuel > 0 && stock_actuel <= seuil_critique) statut_stock = 'critique';
            else if (stock_actuel <= seuil_faible) statut_stock = 'faible';

            return { ...product, stock_actuel, statut_stock };
          })
        );

        const filtered = productsWithStock.filter(p => p !== null);
        console.log('[QuickStockSearch] Products with stock:', filtered.length);

        return filtered.slice(0, 5);
      } catch (error) {
        console.error('[QuickStockSearch] Search error:', error);
        throw error;
      }
    },
    enabled: debouncedSearchTerm.trim().length > 0,
    staleTime: 10000,
  });

  // Afficher l'erreur si présente
  React.useEffect(() => {
    if (searchError) {
      console.error('[QuickStockSearch] Query error:', searchError);
    }
  }, [searchError]);

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

        {isSearching && (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <p className="text-sm">Recherche en cours...</p>
          </div>
        )}

        {!isSearching && searchResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((product) => (
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

        {!isSearching && searchTerm && searchResults.length === 0 && (
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
