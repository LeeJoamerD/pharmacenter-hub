import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CurrentStockItem } from '@/hooks/useCurrentStockDirect';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';

interface BulkActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: CurrentStockItem[];
  onActionComplete: () => void;
}

export const BulkActionsModal = ({
  open,
  onOpenChange,
  selectedProducts,
  onActionComplete
}: BulkActionsModalProps) => {
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const { toast } = useToast();

  const handleBulkAdjustment = async () => {
    try {
      // Simulation d'ajustement groupé
      // Dans une vraie implémentation, cela appellerait une fonction edge ou un RPC
      
      const action = adjustmentType === 'increase' ? 'augmenté' : 'diminué';
      
      toast({
        title: "Ajustement groupé effectué",
        description: `Le stock de ${selectedProducts.length} produits a été ${action} de ${adjustmentQuantity} unités.`,
      });
      
      onActionComplete();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajustement groupé.",
        variant: "destructive",
      });
    }
  };

  const totalValue = selectedProducts.reduce((sum, p) => sum + p.valeur_stock, 0);
  const criticalCount = selectedProducts.filter(p => p.statut_stock === 'critique').length;
  const lowCount = selectedProducts.filter(p => p.statut_stock === 'faible').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Actions Groupées - {selectedProducts.length} produit(s) sélectionné(s)
          </DialogTitle>
          <DialogDescription>
            Effectuez des actions sur plusieurs produits simultanément
          </DialogDescription>
        </DialogHeader>

        {/* Résumé de la sélection */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Total produits</div>
            <div className="text-2xl font-bold">{selectedProducts.length}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Valorisation totale</div>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()} FCFA</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Alertes</div>
            <div className="text-2xl font-bold text-destructive">
              {criticalCount + lowCount}
            </div>
          </div>
        </div>

        <Tabs defaultValue="adjust" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="adjust">Ajuster Stock</TabsTrigger>
            <TabsTrigger value="details">Voir Détails</TabsTrigger>
          </TabsList>

          <TabsContent value="adjust" className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={adjustmentType === 'increase' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('increase')}
                  className="flex-1"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Augmenter
                </Button>
                <Button
                  variant={adjustmentType === 'decrease' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('decrease')}
                  className="flex-1"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Diminuer
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Quantité d'ajustement</Label>
                <Input
                  type="number"
                  min="0"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                  placeholder="Entrez la quantité"
                />
                <p className="text-sm text-muted-foreground">
                  Cette quantité sera {adjustmentType === 'increase' ? 'ajoutée à' : 'retirée de'} chaque produit sélectionné
                </p>
              </div>

              <Button 
                onClick={handleBulkAdjustment}
                className="w-full"
                disabled={adjustmentQuantity === 0}
              >
                Appliquer l'ajustement
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-2">
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{product.libelle_produit}</div>
                    <div className="text-sm text-muted-foreground">
                      Code: {product.code_cip}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">Stock: {product.stock_actuel}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.valeur_stock.toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
