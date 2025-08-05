import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, CheckCircle, XCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { useCurrentStock } from '@/hooks/useCurrentStock';

const QuickStockCheck = () => {
  const { products, isLoading } = useCurrentStock();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulation d'une recherche avec délai
    setTimeout(() => {
      const results = products.filter(product => 
        product.libelle_produit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code_produit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.famille_libelle && product.famille_libelle.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 10); // Limiter à 10 résultats pour une consultation rapide
      
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'faible': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critique': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'rupture': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'surstock': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'normal': return 'Disponible';
      case 'faible': return 'Stock faible';
      case 'critique': return 'Stock critique';
      case 'rupture': return 'Rupture';
      case 'surstock': return 'Surstock';
      default: return 'Inconnu';
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'faible': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critique': return 'bg-red-100 text-red-800 border-red-200';
      case 'rupture': return 'bg-red-100 text-red-800 border-red-200';
      case 'surstock': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Vérification Rapide de Disponibilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Comment utiliser cette fonction :</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Tapez le nom du produit, son code ou sa famille</li>
                <li>• Obtenez instantanément l'état du stock</li>
                <li>• Vérifiez la disponibilité avant une vente</li>
                <li>• Consultez les informations essentielles en un coup d'œil</li>
              </ul>
            </div>

            {/* Barre de recherche */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit (nom, code, famille)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 text-lg"
                  disabled={isLoading}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isLoading || isSearching || !searchQuery.trim()}
                size="lg"
              >
                {isSearching ? 'Recherche...' : 'Vérifier'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raccourcis rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Vérifications Fréquentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              variant="outline" 
              className="h-auto p-3 flex flex-col gap-1"
              onClick={() => {
                setSearchQuery('paracétamol');
                handleSearch();
              }}
            >
              <Package className="h-4 w-4" />
              <span className="text-xs">Paracétamol</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-3 flex flex-col gap-1"
              onClick={() => {
                setSearchQuery('amoxicilline');
                handleSearch();
              }}
            >
              <Package className="h-4 w-4" />
              <span className="text-xs">Amoxicilline</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-3 flex flex-col gap-1"
              onClick={() => {
                setSearchQuery('vitamine');
                handleSearch();
              }}
            >
              <Package className="h-4 w-4" />
              <span className="text-xs">Vitamines</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-3 flex flex-col gap-1"
              onClick={() => {
                setSearchQuery('sirop');
                handleSearch();
              }}
            >
              <Package className="h-4 w-4" />
              <span className="text-xs">Sirops</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats de recherche */}
      {(searchResults.length > 0 || (searchQuery && !isSearching)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Résultats de Vérification
              {searchResults.length > 0 && (
                <Badge variant="outline">
                  {searchResults.length} trouvé{searchResults.length > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 && searchQuery && !isSearching ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg font-medium">Aucun produit trouvé</p>
                <p>Essayez avec un autre terme de recherche</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStockIcon(product.statut_stock)}
                          <h4 className="font-semibold text-lg">{product.libelle_produit}</h4>
                          <Badge className={getStockStatusColor(product.statut_stock)}>
                            {getStockStatusText(product.statut_stock)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Code:</span>
                            <div className="font-mono font-medium">{product.code_produit}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stock Actuel:</span>
                            <div className="font-semibold text-lg">{product.stock_actuel}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stock Minimum:</span>
                            <div>{product.stock_minimum}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Prix de Vente:</span>
                            <div className="font-medium">{product.prix_vente_ttc.toLocaleString()} FCFA</div>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                          <span>Famille: {product.famille_libelle || 'N/A'}</span>
                          <span>Rayon: {product.rayon_libelle || 'N/A'}</span>
                          <span>Rotation: {product.rotation}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {product.stock_actuel > 0 ? (
                            <span className="text-green-600">{product.stock_actuel}</span>
                          ) : (
                            <span className="text-red-600">0</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">unités</div>
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button size="sm" disabled={product.stock_actuel === 0}>
                        Vendre
                      </Button>
                      {product.statut_stock === 'faible' || product.statut_stock === 'critique' && (
                        <Button size="sm" variant="outline">
                          Commander
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        Détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickStockCheck;