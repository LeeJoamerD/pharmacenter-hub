import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';

interface AddToCartModalProps {
  productId: string | null;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

const AddToCartModal = ({ productId, productName, isOpen, onClose }: AddToCartModalProps) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedLot, setSelectedLot] = useState<string>('');

  // Fetch available lots
  const { data: lots = [], isLoading } = useTenantQueryWithCache(
    ['product-lots-cart', productId],
    'lots',
    'id, numero_lot, quantite_restante, date_peremption, prix_achat_unitaire',
    { produit_id: productId, quantite_restante: { op: 'gt', value: 0 } },
    { enabled: !!productId, orderBy: { column: 'date_peremption', ascending: true } }
  );

  const handleAddToCart = () => {
    if (!selectedLot) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un lot",
        variant: "destructive"
      });
      return;
    }

    const lot = lots.find((l: any) => l.id === selectedLot);
    if (!lot) return;

    if (quantity > lot.quantite_restante) {
      toast({
        title: "Erreur",
        description: `Quantité demandée supérieure au stock disponible (${lot.quantite_restante})`,
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement cart integration when sales module is ready
    toast({
      title: "Produit ajouté",
      description: `${quantity} unité(s) de ${productName} ajoutée(s) au panier`,
    });

    onClose();
    setQuantity(1);
    setSelectedLot('');
  };

  if (!productId || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Ajouter au Panier
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Produit</Label>
            <p className="font-medium">{productName}</p>
          </div>

          <div>
            <Label htmlFor="lot">Sélectionner un Lot</Label>
            <Select value={selectedLot} onValueChange={setSelectedLot}>
              <SelectTrigger id="lot">
                <SelectValue placeholder="Choisir un lot" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Chargement...</SelectItem>
                ) : lots.length === 0 ? (
                  <SelectItem value="none" disabled>Aucun lot disponible</SelectItem>
                ) : (
                  lots.map((lot: any) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.numero_lot} - {lot.quantite_restante} unités
                      {lot.date_peremption && ` (Exp: ${new Date(lot.date_peremption).toLocaleDateString('fr-FR')})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantité</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={lots.find((l: any) => l.id === selectedLot)?.quantite_restante || 1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            {selectedLot && (
              <p className="text-xs text-muted-foreground mt-1">
                Stock disponible: {lots.find((l: any) => l.id === selectedLot)?.quantite_restante || 0} unités
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleAddToCart} disabled={!selectedLot || quantity < 1}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCartModal;
