import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Package, Layers, ArrowRight } from 'lucide-react';
import { useDetailBreakdown } from '@/hooks/useDetailBreakdown';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DetailBreakdownDialogProps {
  lotId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DetailBreakdownDialog: React.FC<DetailBreakdownDialogProps> = ({
  lotId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { getLotInfo, getDetailProduct, processDetailBreakdown, isProcessing } = useDetailBreakdown();
  
  const [loading, setLoading] = useState(false);
  const [lotSource, setLotSource] = useState<any>(null);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [prixVenteTTC, setPrixVenteTTC] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Charger les données quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen && lotId) {
      loadData();
    } else {
      // Réinitialiser quand le dialog se ferme
      setLotSource(null);
      setDetailProduct(null);
      setPrixVenteTTC(0);
      setError(null);
    }
  }, [isOpen, lotId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer les infos du lot source
      const lot = await getLotInfo(lotId!);
      if (!lot) {
        setError('Lot non trouvé');
        return;
      }
      setLotSource(lot);

      // Récupérer le produit détail
      const detail = await getDetailProduct(lot.produit_id);
      if (!detail) {
        setError('Aucun produit détail configuré pour ce produit');
        return;
      }
      setDetailProduct(detail);

      // Calculer le prix de vente TTC
      let calculatedPrice = detail.prix_vente_ttc;
      if (!calculatedPrice && lot.produit.prix_vente_ttc && detail.quantite_unites_details_source > 0) {
        calculatedPrice = lot.produit.prix_vente_ttc / detail.quantite_unites_details_source;
      }
      setPrixVenteTTC(calculatedPrice || 0);

    } catch (err: any) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!lotId || !detailProduct) return;

    const result = await processDetailBreakdown(lotId, prixVenteTTC);
    
    if (result.success) {
      onSuccess?.();
      onClose();
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Mise en détail du produit
          </DialogTitle>
          <DialogDescription>
            Détailler une unité du produit source en plusieurs unités de vente détail
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        ) : lotSource && detailProduct ? (
          <div className="space-y-6">
            {/* Stock disponible */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stock disponible :</span>
                <Badge variant={lotSource.quantite_restante > 0 ? 'default' : 'destructive'}>
                  {lotSource.quantite_restante} {lotSource.quantite_restante > 1 ? 'unités' : 'unité'}
                </Badge>
              </div>
            </div>

            {/* Produit source */}
            <div className="space-y-2">
              <Label htmlFor="produit-source">Nom du produit Source</Label>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="produit-source"
                  value={lotSource.produit.libelle_produit}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Lot : {lotSource.numero_lot}
              </p>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Produit détail */}
            <div className="space-y-2">
              <Label htmlFor="produit-detail">Nom du produit Détail</Label>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="produit-detail"
                  value={detailProduct.libelle_produit}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Quantité unités détails */}
            <div className="space-y-2">
              <Label htmlFor="quantite-details">Quantité des articles Détails</Label>
              <Input
                id="quantite-details"
                type="number"
                value={detailProduct.quantite_unites_details_source}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                1 unité source = {detailProduct.quantite_unites_details_source} unités détail
              </p>
            </div>

            <Separator />

            {/* Prix de vente TTC */}
            <div className="space-y-2">
              <Label htmlFor="prix-vente">Prix de vente TTC (par unité détail)</Label>
              <Input
                id="prix-vente"
                type="number"
                step="0.01"
                min="0"
                value={prixVenteTTC}
                onChange={(e) => setPrixVenteTTC(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Total pour {detailProduct.quantite_unites_details_source} unités : {formatCurrency(prixVenteTTC * detailProduct.quantite_unites_details_source)}
              </p>
            </div>

            {/* Validation */}
            {lotSource.quantite_restante < 1 && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                ⚠️ Stock insuffisant pour effectuer la mise en détail
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={
              isProcessing || 
              loading || 
              !!error || 
              !lotSource || 
              !detailProduct || 
              lotSource.quantite_restante < 1
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              'Détailler le produit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
