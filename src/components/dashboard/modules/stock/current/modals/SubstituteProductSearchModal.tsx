import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Package, Check } from "lucide-react";
import { useProductSubstitutes, SubstituteSuggestion } from "@/hooks/useProductSubstitutes";
import { CurrentStockItem } from "@/hooks/useCurrentStock";
import { useCurrencyFormatting } from "@/hooks/useCurrencyFormatting";

interface SubstituteProductSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: CurrentStockItem[];
}

export function SubstituteProductSearchModal({ open, onOpenChange, products }: SubstituteProductSearchModalProps) {
  const { toast } = useToast();
  const { formatAmount } = useCurrencyFormatting();
  const { searchSubstituteSuggestions, createSubstitute } = useProductSubstitutes();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, SubstituteSuggestion[]>>({});
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && products.length > 0) {
      searchForSubstitutes();
    }
  }, [open, products]);

  const searchForSubstitutes = async () => {
    setLoading(true);
    try {
      const results: Record<string, SubstituteSuggestion[]> = {};
      
      for (const product of products) {
        const suggestions = await searchSubstituteSuggestions(
          product.id,
          product.famille_id,
          undefined // classe_therapeutique_id n'est pas dans CurrentStockItem
        );
        results[product.id] = suggestions;
      }
      
      setSearchResults(results);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche de substituts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubstitute = (productId: string, substituteId: string) => {
    setSelectedSubstitutes(prev => ({
      ...prev,
      [productId]: prev[productId] === substituteId ? '' : substituteId
    }));
  };

  const handleSaveSubstitutes = async () => {
    const substitutesToCreate = Object.entries(selectedSubstitutes).filter(([_, subId]) => subId);
    
    if (substitutesToCreate.length === 0) {
      toast({
        title: "Aucun substitut sélectionné",
        description: "Veuillez sélectionner au moins un substitut",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let failedCount = 0;

      for (const [productId, substituteId] of substitutesToCreate) {
        const success = await createSubstitute(
          productId,
          substituteId,
          1,
          "Substitut recommandé pour rupture de stock"
        );
        
        if (success) successCount++;
        else failedCount++;
      }

      toast({
        title: "Substituts enregistrés",
        description: `${successCount} substitut(s) enregistré(s)${failedCount > 0 ? `, ${failedCount} échec(s)` : ''}`,
      });

      onOpenChange(false);
      setSelectedSubstitutes({});
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement des substituts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche de Produits de Substitution
          </DialogTitle>
          <DialogDescription>
            Trouver des produits de substitution disponibles pour les articles en rupture
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6 py-4">
            {products.map((product) => {
              const suggestions = searchResults[product.id] || [];
              const selectedSubId = selectedSubstitutes[product.id];
              
              return (
                <div key={product.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{product.libelle_produit}</h3>
                      <p className="text-sm text-muted-foreground">
                        Code: {product.code_cip} • Famille: {product.famille_libelle || 'N/A'}
                      </p>
                    </div>
                    <Badge variant="destructive">Rupture</Badge>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun substitut disponible trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">
                        Substituts suggérés ({suggestions.length})
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {suggestions.slice(0, 3).map((suggestion) => (
                          <div
                            key={suggestion.id}
                            className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                              selectedSubId === suggestion.id
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-accent'
                            }`}
                            onClick={() => toggleSubstitute(product.id, suggestion.id)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {selectedSubId === suggestion.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{suggestion.libelle_produit}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{suggestion.code_cip}</span>
                                  <span>•</span>
                                  <span>{formatAmount(suggestion.prix_vente_ttc)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={suggestion.stock_actuel > 10 ? "default" : "secondary"}>
                                Stock: {suggestion.stock_actuel}
                              </Badge>
                              <Badge variant="outline">
                                {suggestion.similarity_score}% similaire
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSaveSubstitutes} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les substituts ({Object.values(selectedSubstitutes).filter(v => v).length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}