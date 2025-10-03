import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSupplierOrders } from '@/hooks/useSupplierOrders';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CurrentStockItem } from '@/hooks/useCurrentStockDirect';

interface OrderLowStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: CurrentStockItem;
}

export const OrderLowStockModal = ({ open, onOpenChange, product }: OrderLowStockModalProps) => {
  const { suppliers, loading: loadingSuppliers } = useSuppliers();
  const { createOrder } = useSupplierOrders();
  const { toast } = useToast();
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(
    Math.max(product.stock_alerte - product.stock_actuel, 10)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupplierId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fournisseur",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Erreur",
        description: "La quantité doit être supérieure à 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await createOrder({
        fournisseur_id: selectedSupplierId,
        statut: 'En cours',
        lignes: [{
          produit_id: product.id,
          quantite_commandee: quantity,
          prix_achat_unitaire_attendu: product.prix_achat || 0
        }]
      });

      toast({
        title: "Commande créée",
        description: `Commande de ${quantity} ${product.libelle_produit} créée avec succès`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedQuantity = Math.max(product.stock_alerte - product.stock_actuel, 10);
  const totalEstimated = quantity * (product.prix_achat || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Commander un produit
          </DialogTitle>
          <DialogDescription>
            Créer une commande rapide pour {product.libelle_produit}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info produit */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Produit:</span>
              <span className="text-sm font-medium">{product.libelle_produit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock actuel:</span>
              <span className="text-sm font-medium">{product.stock_actuel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock alerte:</span>
              <span className="text-sm font-medium">{product.stock_alerte}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Quantité suggérée:</span>
              <span className="text-sm font-medium text-primary">{suggestedQuantity}</span>
            </div>
          </div>

          {/* Sélection fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Fournisseur *</Label>
            <Select
              value={selectedSupplierId}
              onValueChange={setSelectedSupplierId}
              disabled={loadingSuppliers}
            >
              <SelectTrigger id="supplier">
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {suppliers.length === 0 && !loadingSuppliers && (
              <p className="text-sm text-muted-foreground">
                Aucun fournisseur disponible. Veuillez en créer un dans la section Approvisionnement.
              </p>
            )}
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité à commander *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="Quantité"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity(suggestedQuantity)}
              >
                Quantité suggérée ({suggestedQuantity})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity(product.stock_alerte * 2)}
              >
                Stock optimal ({product.stock_alerte * 2})
              </Button>
            </div>
          </div>

          {/* Estimation */}
          {product.prix_achat && (
            <div className="bg-primary/10 p-4 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Prix unitaire:</span>
                <span className="text-sm font-medium">{product.prix_achat.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Total estimé:</span>
                <span className="text-sm font-bold text-primary">{totalEstimated.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedSupplierId}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer la commande'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
