import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  ShoppingBag, 
  Calendar, 
  User, 
  Package,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useSmartOrderSuggestions, SmartOrderSuggestion } from '@/hooks/useSmartOrderSuggestions';

interface SaleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportProducts: (products: SmartOrderSuggestion[]) => void;
  existingProductIds: string[];
}

const SaleSelectionDialog: React.FC<SaleSelectionDialogProps> = ({
  open,
  onOpenChange,
  onImportProducts,
  existingProductIds
}) => {
  const { formatAmount } = useCurrencyFormatting();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [saleProducts, setSaleProducts] = useState<SmartOrderSuggestion[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [step, setStep] = useState<'select-sale' | 'select-products'>('select-sale');

  const { 
    recentSales, 
    searchSales, 
    getProductsFromSale,
    salesLoading 
  } = useSmartOrderSuggestions(existingProductIds);

  const [filteredSales, setFilteredSales] = useState(recentSales);

  // Recherche des ventes
  useEffect(() => {
    const search = async () => {
      if (searchTerm.length >= 2) {
        const results = await searchSales(searchTerm);
        setFilteredSales(results);
      } else {
        setFilteredSales(recentSales);
      }
    };
    search();
  }, [searchTerm, recentSales, searchSales]);

  // Charger les produits d'une vente sélectionnée
  const handleSelectSale = async (saleId: string) => {
    setSelectedSaleId(saleId);
    setLoadingProducts(true);
    
    try {
      const products = await getProductsFromSale(saleId);
      setSaleProducts(products);
      setSelectedProducts(new Set(products.map(p => p.produit_id)));
      setStep('select-products');
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Toggle sélection d'un produit
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Sélectionner/Désélectionner tous
  const toggleSelectAll = () => {
    if (selectedProducts.size === saleProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(saleProducts.map(p => p.produit_id)));
    }
  };

  // Importer les produits sélectionnés
  const handleImport = () => {
    const productsToImport = saleProducts.filter(p => selectedProducts.has(p.produit_id));
    onImportProducts(productsToImport);
    handleClose();
  };

  // Réinitialiser et fermer
  const handleClose = () => {
    setSearchTerm('');
    setSelectedSaleId(null);
    setSaleProducts([]);
    setSelectedProducts(new Set());
    setStep('select-sale');
    onOpenChange(false);
  };

  // Retour à la liste des ventes
  const handleBack = () => {
    setSelectedSaleId(null);
    setSaleProducts([]);
    setSelectedProducts(new Set());
    setStep('select-sale');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {step === 'select-sale' ? 'Importer depuis une vente' : 'Sélectionner les produits'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-sale' 
              ? 'Recherchez et sélectionnez une vente pour importer ses produits dans la commande'
              : 'Choisissez les produits à ajouter à votre commande (seuls les produits de niveau 1 sont affichés)'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select-sale' ? (
          <>
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par numéro de vente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Liste des ventes */}
            <ScrollArea className="h-[400px] pr-4">
              {salesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mb-2 opacity-50" />
                  <p>Aucune vente trouvée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSales.map(sale => (
                    <Card 
                      key={sale.id} 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedSaleId === sale.id ? 'border-primary' : ''
                      }`}
                      onClick={() => handleSelectSale(sale.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{sale.numero_vente}</span>
                              <Badge variant="outline">
                                <Package className="h-3 w-3 mr-1" />
                                {sale.products_count} produit{sale.products_count > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(sale.date_vente), 'dd MMM yyyy', { locale: fr })}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {sale.client_name}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{formatAmount(sale.montant_ttc)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            {/* Entête avec sélection globale */}
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedProducts.size === saleProducts.length && saleProducts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedProducts.size} sur {saleProducts.length} sélectionné{selectedProducts.size > 1 ? 's' : ''}
                </span>
              </div>
              {saleProducts.length === 0 && !loadingProducts && (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Aucun produit de niveau 1 disponible
                </Badge>
              )}
            </div>

            {/* Liste des produits */}
            <ScrollArea className="h-[350px] pr-4">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : saleProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mb-2 opacity-50" />
                  <p>Aucun produit disponible pour l'import</p>
                  <p className="text-sm">Les produits de niveau 2 et 3 ne peuvent pas être commandés</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {saleProducts.map(product => (
                    <div 
                      key={product.produit_id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedProducts.has(product.produit_id) 
                          ? 'bg-primary/5 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleProductSelection(product.produit_id)}
                    >
                      <Checkbox
                        checked={selectedProducts.has(product.produit_id)}
                        onCheckedChange={() => toggleProductSelection(product.produit_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.libelle_produit}</p>
                        <p className="text-sm text-muted-foreground">{product.code_cip}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">Qté: {product.quantite_suggeree}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">{formatAmount(product.prix_achat)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        <DialogFooter className="gap-2">
          {step === 'select-products' && (
            <Button variant="outline" onClick={handleBack}>
              Retour
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          {step === 'select-products' && (
            <Button 
              onClick={handleImport}
              disabled={selectedProducts.size === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Importer {selectedProducts.size > 0 ? `(${selectedProducts.size})` : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaleSelectionDialog;
