import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSupplierOrders } from '@/hooks/useSupplierOrders';
import { Loader2, ShoppingCart, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LowStockItem } from '@/hooks/useLowStockData';

interface OrderProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: LowStockItem;
}

export const OrderProductModal = ({ open, onOpenChange, product }: OrderProductModalProps) => {
  const { suppliers, loading: loadingSuppliers } = useSuppliers();
  const { createOrder } = useSupplierOrders();
  const { toast } = useToast();
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(
    Math.max(product.seuilOptimal - product.quantiteActuelle, 10)
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
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
        date_commande: new Date().toISOString().split('T')[0],
        lignes: [{
          produit_id: product.id,
          quantite_commandee: quantity,
          prix_achat_unitaire_attendu: product.prixUnitaire || 0
        }]
      });

      toast({
        title: "Commande créée",
        description: `Commande de ${quantity} ${product.nomProduit} créée avec succès`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedQuantity = Math.max(product.seuilOptimal - product.quantiteActuelle, 10);
  const optimalQuantity = product.seuilOptimal * 2;
  const totalEstimated = quantity * (product.prixUnitaire || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Commander un produit
          </DialogTitle>
          <DialogDescription>
            Créer une commande de réapprovisionnement pour {product.nomProduit}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info produit */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Produit:</span>
              <span className="text-sm font-medium">{product.nomProduit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Code:</span>
              <span className="text-sm font-medium">{product.codeProduit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock actuel:</span>
              <span className="text-sm font-medium">{product.quantiteActuelle} {product.unite}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Seuil minimum:</span>
              <span className="text-sm font-medium">{product.seuilMinimum} {product.unite}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock optimal:</span>
              <span className="text-sm font-medium">{product.seuilOptimal} {product.unite}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Quantité suggérée:</span>
              <span className="text-sm font-medium text-primary">{suggestedQuantity} {product.unite}</span>
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
              <p className="text-sm text-destructive">
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
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity(suggestedQuantity)}
              >
                Suggérée ({suggestedQuantity})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity(optimalQuantity)}
              >
                Optimale ({optimalQuantity})
              </Button>
            </div>
          </div>

          {/* Date de livraison souhaitée */}
          <div className="space-y-2">
            <Label htmlFor="delivery-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date de livraison souhaitée
            </Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Notes complémentaires */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes complémentaires (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations supplémentaires pour le fournisseur..."
              rows={3}
            />
          </div>

          {/* Estimation */}
          {product.prixUnitaire > 0 && (
            <div className="bg-primary/10 p-4 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Prix unitaire:</span>
                <span className="text-sm font-medium">{product.prixUnitaire.toLocaleString()} FCFA</span>
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
