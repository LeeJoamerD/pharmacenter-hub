/**
 * Modal de sélection de lot pour un produit
 * Permet à l'utilisateur de choisir un lot spécifique au lieu du FIFO automatique
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { POSProduct, LotInfo } from '@/types/pos';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LotSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: POSProduct;
  lots: LotInfo[];
  onSelectLot: (product: POSProduct, lot: LotInfo) => void;
}

const LotSelectorModal = ({
  open,
  onOpenChange,
  product,
  lots,
  onSelectLot
}: LotSelectorModalProps) => {
  const { formatAmount } = useCurrencyFormatting();
  const { t } = useLanguage();

  // Trier les lots par date de péremption (FIFO)
  const sortedLots = [...lots].sort((a, b) => 
    new Date(a.date_peremption).getTime() - new Date(b.date_peremption).getTime()
  );

  const isExpiringSoon = (datePeremption: Date | string | null | undefined): boolean => {
    if (!datePeremption) return false; // NULL = pas d'alerte
    const expirationDate = new Date(datePeremption);
    if (isNaN(expirationDate.getTime())) return false; // Date invalide = pas d'alerte
    const warningDate = addDays(new Date(), 30);
    return isBefore(expirationDate, warningDate);
  };

  const isExpired = (datePeremption: Date | string | null | undefined): boolean => {
    if (!datePeremption) return false; // NULL = pas expiré
    const expirationDate = new Date(datePeremption);
    if (isNaN(expirationDate.getTime())) return false;
    return isBefore(expirationDate, new Date());
  };

  const handleSelectLot = (lot: LotInfo) => {
    onSelectLot(product, lot);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sélection du Lot
          </DialogTitle>
          <DialogDescription>
            Choisissez le lot à vendre pour <strong>{product.name || product.libelle_produit}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {sortedLots.map((lot, index) => {
            const expired = isExpired(lot.date_peremption);
            const expiringSoon = isExpiringSoon(lot.date_peremption);
            const isFifoRecommended = index === 0;

            return (
              <Card 
                key={lot.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  expired && "opacity-50 border-destructive",
                  isFifoRecommended && !expired && "border-primary border-2"
                )}
                onClick={() => !expired && handleSelectLot(lot)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono">
                          {lot.numero_lot}
                        </Badge>
                        {isFifoRecommended && !expired && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            FIFO Recommandé
                          </Badge>
                        )}
                        {expired && (
                          <Badge variant="destructive" className="text-xs">
                            Expiré
                          </Badge>
                        )}
                        {expiringSoon && !expired && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs border-orange-500 text-orange-600 bg-orange-50"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expire bientôt
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Péremption:</span>
                          <span className={cn(
                            "font-medium",
                            expired && "text-destructive",
                            expiringSoon && !expired && "text-orange-600"
                          )}>
                            {lot.date_peremption 
                              ? format(new Date(lot.date_peremption), 'dd/MM/yyyy', { locale: fr })
                              : 'Non définie'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>Stock:</span>
                          <span className="font-medium">{lot.quantite_restante} unités</span>
                        </div>
                      </div>

                      {lot.prix_vente_ttc && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Prix: </span>
                          <span className="font-bold text-primary">
                            {formatAmount(lot.prix_vente_ttc)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button 
                      variant={isFifoRecommended && !expired ? "default" : "outline"}
                      size="sm"
                      disabled={expired}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectLot(lot);
                      }}
                    >
                      Sélectionner
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Le système recommande le lot <strong>FIFO</strong> (premier expiré, premier sorti) pour optimiser la gestion du stock.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LotSelectorModal;
