import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pill, AlertTriangle, Share2, Download, Package, 
  Barcode, DollarSign, Percent, FileText, Thermometer 
} from 'lucide-react';
import type { DrugInfo } from '@/hooks/useNetworkPharmaTools';

interface DrugDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drug: DrugInfo | null;
  onShare?: (drug: DrugInfo) => void;
}

export const DrugDetailDialog: React.FC<DrugDetailDialogProps> = ({
  open,
  onOpenChange,
  drug,
  onShare
}) => {
  if (!drug) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            {drug.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="space-y-6 pr-4">
            {/* Informations principales */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">DCI:</span>
                  <span className="text-muted-foreground">{drug.dci}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Classe thérapeutique:</span>
                  <span className="text-muted-foreground">{drug.therapeutic_class}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Forme:</span>
                  <span className="text-muted-foreground">{drug.form}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Dosage:</span>
                  <span className="text-muted-foreground">{drug.dosage}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Fabricant:</span>
                  <span className="text-muted-foreground">{drug.manufacturer}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Barcode className="h-4 w-4" />
                  <span className="font-medium">Code CIP:</span>
                  <span className="text-muted-foreground font-mono">{drug.cip_code}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Code ATC:</span>
                  <span className="text-muted-foreground font-mono">{drug.atc_code}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tarification */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Tarification
              </h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{drug.price.toLocaleString()} FCFA</p>
                  <p className="text-xs text-muted-foreground">Prix de vente</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{drug.reimbursement_rate}%</p>
                  <p className="text-xs text-muted-foreground">Taux de remboursement</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <Badge variant={drug.prescription_required ? 'destructive' : 'secondary'}>
                    {drug.prescription_required ? 'Ordonnance requise' : 'Libre accès'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contre-indications */}
            {drug.contraindications && drug.contraindications.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Contre-indications
                </h4>
                <ul className="space-y-1">
                  {drug.contraindications.map((ci, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      {ci}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactions */}
            {drug.interactions && drug.interactions.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2 text-orange-500">
                  <AlertTriangle className="h-4 w-4" />
                  Interactions connues
                </h4>
                <ul className="space-y-1">
                  {drug.interactions.map((interaction, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-orange-500">•</span>
                      {interaction}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Effets indésirables */}
            {drug.side_effects && drug.side_effects.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Effets indésirables</h4>
                <ul className="space-y-1">
                  {drug.side_effects.map((effect, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span>•</span>
                      {effect}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Conditions de stockage */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Conditions de stockage
              </h4>
              <p className="text-sm text-muted-foreground">{drug.storage_conditions}</p>
            </div>

            {/* Stock */}
            {drug.stock_quantity !== undefined && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Stock disponible
                </h4>
                <Badge variant={drug.stock_quantity > 10 ? 'default' : drug.stock_quantity > 0 ? 'secondary' : 'destructive'}>
                  {drug.stock_quantity} unités
                </Badge>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {onShare && (
            <Button variant="outline" onClick={() => onShare(drug)}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DrugDetailDialog;
