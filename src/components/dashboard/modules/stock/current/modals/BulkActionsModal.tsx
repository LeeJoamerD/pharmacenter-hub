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
import { supabase } from '@/integrations/supabase/client';

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
      setIsSubmitting(true);
      
      // Import StockUpdateService
      const { StockUpdateService } = await import('@/services/stockUpdateService');
      const { getCurrentTenantId } = await import('@/utils/tenantValidation');
      
      const tenantId = await getCurrentTenantId();
      if (!tenantId) throw new Error('Utilisateur non autorisé');

      // Get current user as agent
      const { data: userData } = await supabase.auth.getUser();
      const { data: personnel } = await supabase
        .from('personnel')
        .select('id')
        .eq('auth_user_id', userData.user?.id)
        .eq('tenant_id', tenantId)
        .single();

      // Process each product
      for (const product of selectedProducts) {
        // Get the first available lot for this product
        const { data: lots } = await supabase
          .from('lots')
          .select('id, quantite_restante')
          .eq('produit_id', product.id)
          .eq('tenant_id', tenantId)
          .gt('quantite_restante', 0)
          .order('created_at', { ascending: true })
          .limit(1);

        if (!lots || lots.length === 0) {
          console.warn(`No lot found for product ${product.id}, skipping...`);
          continue;
        }

        const lot = lots[0];
        
        // Record stock movement
        await StockUpdateService.recordStockMovement({
          produit_id: product.id,
          lot_id: lot.id,
          quantite: adjustmentQuantity,
          type_mouvement: 'ajustement',
          motif: `Ajustement groupé: ${adjustmentType === 'increase' ? 'Augmentation' : 'Diminution'} de ${adjustmentQuantity} unités`,
          agent_id: personnel?.id,
          metadata: {
            bulk_action: true,
            adjustment_type: adjustmentType,
            original_quantity: lot.quantite_restante
          }
        });

        // Update lot quantity directly
        const newQuantity = adjustmentType === 'increase' 
          ? lot.quantite_restante + adjustmentQuantity
          : Math.max(0, lot.quantite_restante - adjustmentQuantity);

        await supabase
          .from('lots')
          .update({ quantite_restante: newQuantity })
          .eq('id', lot.id);
      }
      
      const action = adjustmentType === 'increase' ? 'augmenté' : 'diminué';
      
      toast({
        title: "Ajustement groupé effectué",
        description: `Le stock de ${selectedProducts.length} produit(s) a été ${action} de ${adjustmentQuantity} unité(s).`,
      });
      
      onActionComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Bulk adjustment error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajustement groupé.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

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
                disabled={adjustmentQuantity === 0 || isSubmitting}
              >
                {isSubmitting ? 'Traitement...' : 'Appliquer l\'ajustement'}
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
