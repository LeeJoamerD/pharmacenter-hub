import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { unifiedPricingService } from '@/services/UnifiedPricingService';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { CartItem } from '../POSInterface';

interface PriceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItem: CartItem | null;
  onPriceUpdated: (productId: number, newUnitPrice: number) => void;
}

const PriceEditDialog = ({ open, onOpenChange, cartItem, onPriceUpdated }: PriceEditDialogProps) => {
  const { formatAmount } = useCurrencyFormatting();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [newTTC, setNewTTC] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset when dialog opens with new item
  React.useEffect(() => {
    if (open && cartItem) {
      setNewTTC(String(Math.round(cartItem.unitPrice)));
    }
  }, [open, cartItem]);

  const product = cartItem?.product;

  // Get pricing params from the product
  const tauxTVA = product?.taux_tva ?? product?.categorie_tarification?.taux_tva ?? 0;
  const tauxCentime = product?.taux_centime_additionnel ?? product?.categorie_tarification?.taux_centime_additionnel ?? 0;
  const coefficient = product?.coefficient_prix_vente ?? product?.categorie_tarification?.coefficient_prix_vente ?? 1;

  const reverseResult = useMemo(() => {
    const ttcValue = Number(newTTC) || 0;
    if (ttcValue <= 0) return null;
    return unifiedPricingService.reversePriceFromTTC({
      newTTC: ttcValue,
      tauxTVA,
      tauxCentimeAdditionnel: tauxCentime,
      coefficientPrixVente: coefficient,
    });
  }, [newTTC, tauxTVA, tauxCentime, coefficient]);

  const handleConfirm = async () => {
    if (!reverseResult || !product) return;
    setSaving(true);

    try {
      // 1. Update produits table
      const { error: prodError } = await supabase
        .from('produits')
        .update({
          prix_vente_ht: reverseResult.prixVenteHT,
          tva: reverseResult.montantTVA,
          centime_additionnel: reverseResult.montantCentimeAdditionnel,
          prix_vente_ttc: reverseResult.prixVenteTTC,
          prix_achat: reverseResult.prixAchat,
        })
        .eq('id', product.id);

      if (prodError) throw prodError;

      // 2. Update lot FIFO (first lot)
      const lot = product.lots?.[0];
      if (lot?.id) {
        const { error: lotError } = await supabase
          .from('lots')
          .update({
            prix_vente_ht: reverseResult.prixVenteHT,
            prix_vente_ttc: reverseResult.prixVenteTTC,
            montant_tva: reverseResult.montantTVA,
            montant_centime_additionnel: reverseResult.montantCentimeAdditionnel,
          })
          .eq('id', lot.id);

        if (lotError) throw lotError;
      }

      // 3. Update local cart
      onPriceUpdated(product.id, reverseResult.prixVenteTTC);

      // 4. Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['produits'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['product-lots'] });

      toast({
        title: t('success') || 'Succès',
        description: t('priceUpdatedSuccess') || 'Prix mis à jour avec succès',
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating price:', error);
      toast({
        title: t('error') || 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour du prix',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('editSalePrice') || 'Modifier le prix de vente'}</DialogTitle>
          <DialogDescription>{product?.name || product?.libelle_produit}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('currentPriceTTC') || 'Prix TTC actuel'}</Label>
            <div className="text-lg font-semibold text-muted-foreground">
              {cartItem ? formatAmount(cartItem.unitPrice) : '-'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newTTC">{t('newPriceTTC') || 'Nouveau prix TTC'}</Label>
            <Input
              id="newTTC"
              type="number"
              min="0"
              value={newTTC}
              onChange={(e) => setNewTTC(e.target.value)}
              autoFocus
            />
          </div>

          {reverseResult && (
            <>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('priceHT') || 'Prix HT'}:</span>
                  <span>{formatAmount(reverseResult.prixVenteHT)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('vatAmount') || 'TVA'} ({tauxTVA}%):</span>
                  <span>{formatAmount(reverseResult.montantTVA)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('additionalCentime') || 'Centime Add.'} ({tauxCentime}%):</span>
                  <span>{formatAmount(reverseResult.montantCentimeAdditionnel)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>{t('purchasePrice') || 'Prix Achat'}:</span>
                  <span>{formatAmount(reverseResult.prixAchat)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('cancel') || 'Annuler'}
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !reverseResult || Number(newTTC) <= 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t('confirm') || 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PriceEditDialog;
