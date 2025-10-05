import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Package, Check, TrendingUp } from "lucide-react";
import { useProductSubstitutes, SubstituteSuggestion } from "@/hooks/useProductSubstitutes";
import { CurrentStockItem } from "@/hooks/useCurrentStock";

interface SubstituteIndividualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: CurrentStockItem | null;
}

export function SubstituteIndividualModal({ open, onOpenChange, product }: SubstituteIndividualModalProps) {
  const { toast } = useToast();
  const { searchSubstituteSuggestions, getSubstitutesForProduct, createSubstitute, recordSubstituteUsage } = useProductSubstitutes();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SubstituteSuggestion[]>([]);
  const [existingSubstitutes, setExistingSubstitutes] = useState<any[]>([]);
  const [selectedSubstitute, setSelectedSubstitute] = useState<string>("");

  useEffect(() => {
    if (open && product) {
      loadData();
    }
  }, [open, product]);

  const loadData = async () => {
    if (!product) return;
    
    setLoading(true);
    try {
      // Charger les substituts existants
      const existing = await getSubstitutesForProduct(product.id);
      setExistingSubstitutes(existing);

      // Rechercher des suggestions
      const newSuggestions = await searchSubstituteSuggestions(
        product.id,
        product.famille_id,
        undefined
      );
      setSuggestions(newSuggestions);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubstitute = (substituteId: string) => {
    setSelectedSubstitute(selectedSubstitute === substituteId ? '' : substituteId);
  };

  const handleSaveSubstitute = async () => {
    if (!product || !selectedSubstitute) {
      toast({
        title: "Substitut requis",
        description: "Veuillez sélectionner un substitut",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const success = await createSubstitute(
        product.id,
        selectedSubstitute,
        existingSubstitutes.length + 1,
        "Substitut sélectionné manuellement"
      );

      if (success) {
        toast({
          title: "Substitut enregistré",
          description: "Le produit de substitution a été enregistré avec succès",
        });
        onOpenChange(false);
        setSelectedSubstitute("");
      } else {
        throw new Error("Échec de l'enregistrement");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement du substitut",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseExistingSubstitute = async (substituteId: string) => {
    setLoading(true);
    try {
      await recordSubstituteUsage(substituteId);
      toast({
        title: "Utilisation enregistrée",
        description: "L'utilisation du substitut a été enregistrée",
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement de l'utilisation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSuggestions = suggestions.filter(s =>
    s.libelle_produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code_cip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Trouver un Substitut
          </DialogTitle>
          <DialogDescription>
            Rechercher un produit de substitution pour {product.libelle_produit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Produit en rupture */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{product.libelle_produit}</h3>
                <p className="text-sm text-muted-foreground">
                  Code: {product.code_cip} • Famille: {product.famille_libelle || 'N/A'}
                </p>
              </div>
              <Badge variant="destructive">Rupture</Badge>
            </div>
          </div>

          {/* Substituts existants */}
          {existingSubstitutes.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Substituts déjà configurés ({existingSubstitutes.length})
              </Label>
              <div className="space-y-2">
                {existingSubstitutes.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 border rounded-md bg-blue-50 border-blue-200"
                  >
                    <div>
                      <p className="text-sm font-medium">{sub.substitut_info?.libelle_produit}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.substitut_info?.code_cip} • Stock: {sub.substitut_info?.stock_actuel}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Utilisé {sub.nombre_utilisations} fois • Priorité: {sub.priorite}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUseExistingSubstitute(sub.id)}
                      disabled={loading}
                    >
                      Utiliser
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recherche de nouveaux substituts */}
          <div className="space-y-2">
            <Label>Rechercher un nouveau substitut</Label>
            <Input
              placeholder="Rechercher par nom ou code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Liste des suggestions */}
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSuggestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun substitut disponible trouvé</p>
                </div>
              ) : (
                filteredSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedSubstitute === suggestion.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => handleSelectSubstitute(suggestion.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {selectedSubstitute === suggestion.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{suggestion.libelle_produit}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{suggestion.code_cip}</span>
                          <span>•</span>
                          <span>{suggestion.prix_vente_ttc.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={suggestion.stock_actuel > 10 ? "default" : "secondary"}>
                        Stock: {suggestion.stock_actuel}
                      </Badge>
                      {suggestion.similarity_score > 70 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {suggestion.similarity_score}% similaire
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSaveSubstitute} disabled={loading || !selectedSubstitute}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer le substitut
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}