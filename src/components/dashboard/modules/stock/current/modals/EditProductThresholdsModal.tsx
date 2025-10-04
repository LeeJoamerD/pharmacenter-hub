import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentTenantId } from '@/utils/tenantValidation';
import { AlertTriangle } from 'lucide-react';

interface EditProductThresholdsModalProps {
  productId: string | null;
  productName: string;
  currentStockLimit?: number;
  currentStockAlert?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditProductThresholdsModal = ({ 
  productId, 
  productName,
  currentStockLimit,
  currentStockAlert,
  isOpen, 
  onClose,
  onSuccess 
}: EditProductThresholdsModalProps) => {
  const { toast } = useToast();
  const [stockLimit, setStockLimit] = useState<number>(currentStockLimit || 0);
  const [stockAlert, setStockAlert] = useState<number>(currentStockAlert || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStockLimit(currentStockLimit || 0);
      setStockAlert(currentStockAlert || 0);
    }
  }, [isOpen, currentStockLimit, currentStockAlert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId) return;

    if (stockAlert > stockLimit) {
      toast({
        title: "Erreur",
        description: "Le seuil d'alerte doit être inférieur ou égal au stock limite",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tenantId = await getCurrentTenantId();
      if (!tenantId) throw new Error('Utilisateur non autorisé');

      const { error } = await supabase
        .from('produits')
        .update({
          stock_limite: stockLimit,
          stock_alerte: stockAlert,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Seuils mis à jour avec succès"
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error updating thresholds:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour les seuils",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!productId || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Modifier les Seuils de Stock
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label>Produit</Label>
            <p className="font-medium text-sm">{productName}</p>
          </div>

          <div>
            <Label htmlFor="stock_limite">Stock Limite (Stock Minimum) *</Label>
            <Input
              id="stock_limite"
              type="number"
              min={0}
              required
              value={stockLimit || ''}
              onChange={(e) => setStockLimit(parseInt(e.target.value) || 0)}
              placeholder="Ex: 50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Quantité en dessous de laquelle une alerte sera générée
            </p>
          </div>

          <div>
            <Label htmlFor="stock_alerte">Stock d'Alerte Critique *</Label>
            <Input
              id="stock_alerte"
              type="number"
              min={0}
              required
              value={stockAlert || ''}
              onChange={(e) => setStockAlert(parseInt(e.target.value) || 0)}
              placeholder="Ex: 20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Quantité en dessous de laquelle l'alerte devient critique
            </p>
          </div>

          {stockAlert > stockLimit && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">
                ⚠️ Le seuil d'alerte doit être inférieur ou égal au stock limite
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || stockAlert > stockLimit}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductThresholdsModal;
