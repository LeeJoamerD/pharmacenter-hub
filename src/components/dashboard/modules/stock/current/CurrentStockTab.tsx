import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Package, AlertTriangle, XCircle, DollarSign, Search, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AvailableProducts from './tabs/AvailableProducts';
import LowStockProducts from './tabs/LowStockProducts';
import OutOfStockProducts from './tabs/OutOfStockProducts';
import StockValuation from './tabs/StockValuation';
import QuickStockCheck from './tabs/QuickStockCheck';
import { useCurrentStockPaginated } from '@/hooks/useCurrentStockPaginated';
import { StockCacheManager } from '@/utils/stockCacheUtils';

const CurrentStockTab = () => {
  const { metrics, isLoading, error } = useCurrentStockPaginated();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await StockCacheManager.forceResetAllCache(queryClient);
      toast.success('Cache vidé avec succès', {
        description: 'Les données ont été rechargées'
      });
    } catch (error) {
      toast.error('Erreur lors du rafraîchissement', {
        description: 'Veuillez réessayer'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-destructive mb-2">Erreur de chargement du stock actuel</div>
              <div className="text-sm text-muted-foreground mb-4">{error?.message || 'Une erreur est survenue'}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Recharger la page
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Produits</span>
            </div>
            <div className="text-2xl font-bold text-primary">{metrics.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Disponibles</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{metrics.availableProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Stock Faible</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{metrics.lowStockProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Ruptures</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{metrics.outOfStockProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Valorisation</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'XAF',
                minimumFractionDigits: 0 
              }).format(metrics.totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface à onglets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Stock Actuel - Consultation Temps Réel
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="available" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="available" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Disponible
              </TabsTrigger>
              <TabsTrigger value="low-stock" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Stock Faible
              </TabsTrigger>
              <TabsTrigger value="out-of-stock" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Ruptures
              </TabsTrigger>
              <TabsTrigger value="valuation" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valorisation
              </TabsTrigger>
              <TabsTrigger value="quick-check" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Vérification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              <AvailableProducts />
            </TabsContent>

            <TabsContent value="low-stock">
              <LowStockProducts />
            </TabsContent>

            <TabsContent value="out-of-stock">
              <OutOfStockProducts />
            </TabsContent>

            <TabsContent value="valuation">
              <StockValuation />
            </TabsContent>

            <TabsContent value="quick-check">
              <QuickStockCheck />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentStockTab;