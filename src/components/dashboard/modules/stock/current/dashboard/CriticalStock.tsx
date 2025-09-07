import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShoppingCart, Eye } from 'lucide-react';
import { useCurrentStock } from '@/hooks/useCurrentStock';
import { useToast } from '@/hooks/use-toast';

const CriticalStock = () => {
  const { products } = useCurrentStock();
  const { toast } = useToast();

  const handleOrder = (product: any) => {
    toast({
      title: "Commande initiée",
      description: `Commande pour ${product.libelle_produit} ajoutée à la liste`,
    });
  };

  const handleView = (product: any) => {
    toast({
      title: "Détails du produit",
      description: `Affichage des détails pour ${product.libelle_produit}`,
    });
  };

  const criticalProducts = products
    .filter(p => p.statut_stock === 'critique' || p.statut_stock === 'rupture')
    .sort((a, b) => {
      // Prioriser les ruptures, puis par rotation
      if (a.statut_stock === 'rupture' && b.statut_stock !== 'rupture') return -1;
      if (b.statut_stock === 'rupture' && a.statut_stock !== 'rupture') return 1;
      
      // Puis par rotation
      const rotationOrder = { rapide: 0, normale: 1, lente: 2 };
      return rotationOrder[a.rotation as keyof typeof rotationOrder] - 
             rotationOrder[b.rotation as keyof typeof rotationOrder];
    })
    .slice(0, 8); // Limiter à 8 pour l'affichage

  const getSeverityColor = (status: string) => {
    switch (status) {
      case 'rupture': return 'bg-red-100 text-red-800 border-red-200';
      case 'critique': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRotationColor = (rotation: string) => {
    switch (rotation) {
      case 'rapide': return 'bg-red-100 text-red-800';
      case 'normale': return 'bg-yellow-100 text-yellow-800';
      case 'lente': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Stock Critique
          {criticalProducts.length > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {criticalProducts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {criticalProducts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="font-medium text-green-600">Excellent !</p>
            <p className="text-sm">Aucun stock critique détecté</p>
          </div>
        ) : (
          <div className="space-y-3">
            {criticalProducts.map((product) => (
              <div key={product.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
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
                    onClick={() => handleView(product)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {products.filter(p => p.statut_stock === 'critique' || p.statut_stock === 'rupture').length > 8 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  Voir tous ({products.filter(p => p.statut_stock === 'critique' || p.statut_stock === 'rupture').length})
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CriticalStock;