import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Package,
  ClipboardList,
  Plus,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  List,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { useProductsPaginated } from '@/hooks/useProductsPaginated';
import { useProductDemands } from '@/hooks/useProductDemands';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useDateLocale } from '@/hooks/useDateLocale';
import { cn } from '@/lib/utils';

interface ProductDemandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDemandRecorded?: () => void;
}

interface SelectedProduct {
  id: string;
  libelle_produit: string;
  code_cip: string | null;
  dci: string | null;
  stock_actuel?: number;
}

const ProductDemandModal: React.FC<ProductDemandModalProps> = ({
  open,
  onOpenChange,
  onDemandRecorded
}) => {
  const [searchInput, setSearchInput] = useState('');
  const searchTerm = useDebouncedValue(searchInput, 400);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [existingDemandCount, setExistingDemandCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [showDemandsList, setShowDemandsList] = useState(false);

  const { dateLocale } = useDateLocale();
  const productsQuery = useProductsPaginated(20, searchTerm);
  const productsData = productsQuery.data;
  const isLoadingProducts = productsQuery.isLoading;
  const currentPage = productsQuery.currentPage;
  const totalPages = productsData?.totalPages || 1;
  const setCurrentPage = productsQuery.setCurrentPage;

  const {
    getProductDemandCount,
    recordDemand,
    isRecording,
    demands,
    totalDemandsCount,
    uniqueProductsCount,
    deleteDemand,
    isDeleting
  } = useProductDemands();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setSelectedProduct(null);
      setExistingDemandCount(0);
      setNotes('');
      setShowDemandsList(false);
    }
  }, [open]);

  const handleDeleteDemand = async (demandId: string) => {
    try {
      await deleteDemand(demandId);
    } catch (error) {
      console.error('Failed to delete demand:', error);
    }
  };

  // Fetch demand count when product is selected
  useEffect(() => {
    const fetchDemandCount = async () => {
      if (selectedProduct) {
        const count = await getProductDemandCount(selectedProduct.id);
        setExistingDemandCount(count);
      } else {
        setExistingDemandCount(0);
      }
    };
    fetchDemandCount();
  }, [selectedProduct, getProductDemandCount]);

  const handleSelectProduct = (product: SelectedProduct) => {
    setSelectedProduct(product);
    setSearchInput('');
  };

  const handleRecordDemand = async () => {
    if (!selectedProduct) return;

    try {
      await recordDemand({
        productId: selectedProduct.id,
        notes: notes || undefined
      });
      onDemandRecorded?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to record demand:', error);
    }
  };

  const products = productsData?.data || [];
  const shouldShowResults = searchTerm.length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Produit Demandé (Rupture de Stock)
          </DialogTitle>
          <DialogDescription>
            Enregistrez les produits demandés par les clients mais non disponibles en stock.
            {uniqueProductsCount > 0 && (
              <span className="ml-2 text-primary font-medium">
                ({uniqueProductsCount} produits en attente, {totalDemandsCount} demandes)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Vue Liste des demandes */}
          {showDemandsList ? (
            <div className="flex-1 overflow-hidden">
              {demands.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Package className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">Aucune demande en attente</p>
                  <p className="text-sm">Les demandes de produits apparaîtront ici</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-center">Demandes</TableHead>
                        <TableHead>Dernière demande</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demands.map((demand) => (
                        <TableRow key={demand.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{demand.produit?.libelle_produit}</p>
                              <p className="text-xs text-muted-foreground">
                                {demand.produit?.code_cip || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {demand.nombre_demandes}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(demand.derniere_demande), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            <span className="truncate block" title={demand.notes || undefined}>
                              {demand.notes || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDemand(demand.id)}
                              disabled={isDeleting}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          ) : (
            <>
              {/* Recherche produit */}
              {!selectedProduct && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit dans le catalogue (min. 2 caractères)..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>

                  {/* Résultats de recherche */}
                  {shouldShowResults && (
                    <ScrollArea className="h-[300px] border rounded-lg">
                      {isLoadingProducts ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <Package className="h-8 w-8 mb-2" />
                          <p>Aucun produit trouvé</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {products.map((product: any) => {
                            const existingDemand = demands.find(d => d.produit_id === product.id);
                            const isOutOfStock = (product.stock_actuel || 0) <= 0;
                            
                            return (
                              <div
                                key={product.id}
                                onClick={() => handleSelectProduct({
                                  id: product.id,
                                  libelle_produit: product.libelle_produit,
                                  code_cip: product.code_cip,
                                  dci: product.dci,
                                  stock_actuel: product.stock_actuel
                                })}
                                className={cn(
                                  "p-3 rounded-lg cursor-pointer transition-colors",
                                  "hover:bg-accent border border-transparent hover:border-border",
                                  isOutOfStock && "bg-red-50 dark:bg-red-950/20"
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{product.libelle_produit}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                      {product.code_cip && <span>CIP: {product.code_cip}</span>}
                                      {product.dci && <span>• {product.dci}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {existingDemand && (
                                      <Badge variant="secondary" className="gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {existingDemand.nombre_demandes}
                                      </Badge>
                                    )}
                                    <Badge variant={isOutOfStock ? "destructive" : "outline"}>
                                      Stock: {product.stock_actuel || 0}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  )}

                  {/* Pagination */}
                  {shouldShowResults && totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {!shouldShowResults && searchInput.length > 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Saisissez au moins 2 caractères pour rechercher
                    </p>
                  )}
                </div>
              )}

              {/* Produit sélectionné */}
              {selectedProduct && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <Label className="text-xs text-muted-foreground">Produit sélectionné</Label>
                        <p className="font-semibold text-lg">{selectedProduct.libelle_produit}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          {selectedProduct.code_cip && <span>CIP: {selectedProduct.code_cip}</span>}
                          {selectedProduct.dci && <span>• {selectedProduct.dci}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProduct(null)}
                      >
                        Changer
                      </Button>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={existingDemandCount > 0 ? "default" : "outline"}>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {existingDemandCount} demande{existingDemandCount !== 1 ? 's' : ''} existante{existingDemandCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      {existingDemandCount > 0 && (
                        <span className="text-sm text-muted-foreground">
                          La demande sera incrémentée
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes optionnelles */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ex: Client régulier, besoin urgent, quantité demandée..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Avertissement si produit en stock */}
                  {selectedProduct.stock_actuel && selectedProduct.stock_actuel > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Ce produit semble disponible en stock ({selectedProduct.stock_actuel} unités)
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          Êtes-vous sûr de vouloir l'ajouter à la liste des demandes?
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          {/* Bouton Voir la liste à gauche */}
          <Button
            variant="outline"
            onClick={() => {
              setShowDemandsList(!showDemandsList);
              setSelectedProduct(null);
              setSearchInput('');
            }}
            disabled={uniqueProductsCount === 0 && !showDemandsList}
          >
            <List className="h-4 w-4 mr-2" />
            {showDemandsList ? 'Rechercher' : 'Voir la liste'}
            {uniqueProductsCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {uniqueProductsCount}
              </Badge>
            )}
          </Button>

          {/* Boutons à droite */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            {!showDemandsList && (
              <Button
                onClick={handleRecordDemand}
                disabled={!selectedProduct || isRecording}
              >
                {isRecording ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {existingDemandCount > 0 ? 'Incrémenter la demande' : 'Enregistrer la demande'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDemandModal;
