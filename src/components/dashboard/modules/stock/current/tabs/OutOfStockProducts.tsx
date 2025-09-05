import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { XCircle, AlertCircle, ShoppingCart, Clock, TrendingDown } from 'lucide-react';
import { useCurrentStock } from '@/hooks/useCurrentStock';

const OutOfStockProducts = () => {
  const { products, isLoading } = useCurrentStock();

  const outOfStockProducts = products.filter(p => p.statut_stock === 'rupture');

  const getDaysSinceLastStock = (lastExitDate: string | undefined) => {
    if (!lastExitDate) return null;
    const days = Math.floor((Date.now() - new Date(lastExitDate).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getUrgencyLevel = (lastExitDate: string | undefined, rotation: string) => {
    const days = getDaysSinceLastStock(lastExitDate);
    if (!days) return { level: 'unknown', color: 'bg-gray-100 text-gray-800', label: 'Inconnu' };
    
    if (rotation === 'rapide' && days > 3) {
      return { level: 'critical', color: 'bg-red-100 text-red-800', label: 'Critique' };
    } else if (rotation === 'normale' && days > 7) {
      return { level: 'high', color: 'bg-orange-100 text-orange-800', label: 'Élevée' };
    } else if (days > 14) {
      return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', label: 'Moyenne' };
    }
    
    return { level: 'low', color: 'bg-blue-100 text-blue-800', label: 'Faible' };
  };

  return (
    <div className="space-y-6">
      {/* Statistiques des ruptures */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Total Ruptures</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {outOfStockProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">Produits indisponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-700" />
              <span className="text-sm font-medium">Ruptures Critiques</span>
            </div>
            <div className="text-2xl font-bold text-red-700">
              {outOfStockProducts.filter(p => 
                getUrgencyLevel(p.date_derniere_sortie, p.rotation).level === 'critical'
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Forte rotation</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Rotation Rapide</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {outOfStockProducts.filter(p => p.rotation === 'rapide').length}
            </div>
            <p className="text-xs text-muted-foreground">Priorité haute</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Ruptures Récentes</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {outOfStockProducts.filter(p => {
                const days = getDaysSinceLastStock(p.date_derniere_sortie);
                return days && days <= 7;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Dernière semaine</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions d'urgence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Actions d'Urgence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" size="lg">
              <ShoppingCart className="h-4 w-4" />
              Commande Urgente Multiple
            </Button>
            <Button variant="outline" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Alerter Fournisseurs
            </Button>
            <Button variant="outline" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Produits de Substitution
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des ruptures de stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Produits en Rupture de Stock ({outOfStockProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : outOfStockProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <XCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium text-green-600">Parfait !</p>
              <p>Aucune rupture de stock détectée</p>
              <p className="text-sm mt-2">Tous vos produits sont disponibles</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Famille/Rayon</TableHead>
                    <TableHead>Rotation</TableHead>
                    <TableHead>Dernière Sortie</TableHead>
                    <TableHead>Durée Rupture</TableHead>
                    <TableHead>Urgence</TableHead>
                    <TableHead>Impact Ventes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outOfStockProducts
                    .sort((a, b) => {
                      // Trier par urgence puis par rotation
                      const aUrgency = getUrgencyLevel(a.date_derniere_sortie, a.rotation);
                      const bUrgency = getUrgencyLevel(b.date_derniere_sortie, b.rotation);
                      
                      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 };
                      return urgencyOrder[aUrgency.level as keyof typeof urgencyOrder] - 
                             urgencyOrder[bUrgency.level as keyof typeof urgencyOrder];
                    })
                    .map((product) => {
                      const urgency = getUrgencyLevel(product.date_derniere_sortie, product.rotation);
                      const daysSinceStock = getDaysSinceLastStock(product.date_derniere_sortie);
                      
                      return (
                        <TableRow key={product.id} className={urgency.level === 'critical' ? 'bg-red-50' : ''}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.libelle_produit}</div>
                              <div className="text-sm text-muted-foreground">
                                Limite: {product.stock_limite} • Alerte: {product.stock_alerte}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.code_cip}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{product.famille_libelle || 'N/A'}</div>
                              <div className="text-muted-foreground">{product.rayon_libelle || 'N/A'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              product.rotation === 'rapide' ? 'bg-red-100 text-red-800' :
                              product.rotation === 'normale' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {product.rotation}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {product.date_derniere_sortie 
                                ? new Date(product.date_derniere_sortie).toLocaleDateString()
                                : 'Inconnue'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {daysSinceStock 
                                ? `${daysSinceStock} jour${daysSinceStock > 1 ? 's' : ''}`
                                : 'Inconnue'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={urgency.color}>
                              {urgency.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {(product.prix_vente_ttc * product.stock_limite).toLocaleString()} FCFA
                              </div>
                              <div className="text-muted-foreground">potentiel perdu</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant={urgency.level === 'critical' ? 'default' : 'outline'}
                                className="gap-1"
                              >
                                <ShoppingCart className="h-3 w-3" />
                                Commander
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Substitut
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OutOfStockProducts;