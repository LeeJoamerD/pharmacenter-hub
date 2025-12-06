import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, AlertTriangle, CheckCircle, Pill, X } from 'lucide-react';
import type { NetworkProduct } from '@/hooks/useNetworkBusinessIntegrations';

interface ProductInteractionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: NetworkProduct[];
}

export function ProductInteractionsDialog({ open, onOpenChange, products }: ProductInteractionsDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<NetworkProduct[]>([]);
  const [analyzed, setAnalyzed] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProduct = (product: NetworkProduct) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
      setAnalyzed(false);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    setAnalyzed(false);
  };

  const analyzeInteractions = () => {
    setAnalyzed(true);
  };

  const detectInteractions = () => {
    const interactions: { product1: string; product2: string; severity: 'major' | 'moderate' | 'minor'; description: string }[] = [];
    
    // Simplified interaction detection (in production, this would use a drug interaction API)
    for (let i = 0; i < selectedProducts.length; i++) {
      for (let j = i + 1; j < selectedProducts.length; j++) {
        const p1 = selectedProducts[i];
        const p2 = selectedProducts[j];
        
        // Check if any interactions overlap
        const commonInteractions = p1.interactions.filter(int => 
          p2.name.toLowerCase().includes(int.toLowerCase()) ||
          p2.interactions.includes(int)
        );
        
        if (commonInteractions.length > 0) {
          interactions.push({
            product1: p1.name,
            product2: p2.name,
            severity: 'moderate',
            description: `Interaction potentielle via: ${commonInteractions.join(', ')}`
          });
        }
      }
    }
    
    return interactions;
  };

  const interactions = analyzed ? detectInteractions() : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Analyse des Interactions Médicamenteuses
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les médicaments pour vérifier les interactions potentielles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un médicament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Product list */}
          <ScrollArea className="h-40 border rounded-lg p-2">
            <div className="space-y-2">
              {filteredProducts.slice(0, 10).map(product => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                  onClick={() => addProduct(product)}
                >
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    <span className="text-sm">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.code}</span>
                  </div>
                  <Button variant="ghost" size="sm">Ajouter</Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Selected products */}
          {selectedProducts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Médicaments sélectionnés ({selectedProducts.length})</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map(product => (
                  <Badge key={product.id} variant="secondary" className="flex items-center gap-1">
                    {product.name}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeProduct(product.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Analyze button */}
          <Button 
            onClick={analyzeInteractions} 
            disabled={selectedProducts.length < 2}
            className="w-full"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Analyser les interactions
          </Button>

          {/* Results */}
          {analyzed && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Résultats de l'analyse</h4>
              {interactions.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span>Aucune interaction détectée entre les médicaments sélectionnés</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {interactions.map((interaction, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${
                        interaction.severity === 'major' 
                          ? 'bg-red-50 border-red-200' 
                          : interaction.severity === 'moderate'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`h-4 w-4 ${
                          interaction.severity === 'major' ? 'text-red-500' :
                          interaction.severity === 'moderate' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <span className="font-medium text-sm">
                          {interaction.product1} + {interaction.product2}
                        </span>
                        <Badge variant={interaction.severity === 'major' ? 'destructive' : 'secondary'}>
                          {interaction.severity === 'major' ? 'Majeure' : 
                           interaction.severity === 'moderate' ? 'Modérée' : 'Mineure'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{interaction.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
