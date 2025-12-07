import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pill, AlertTriangle, Heart, Baby, Clock, Euro } from 'lucide-react';
import type { DrugInfo } from '@/hooks/usePharmaceuticalExpert';

interface DrugDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drug: DrugInfo | null;
}

const DrugDetailDialog: React.FC<DrugDetailDialogProps> = ({
  open,
  onOpenChange,
  drug
}) => {
  if (!drug) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            {drug.name}
          </DialogTitle>
          <DialogDescription>
            {drug.genericName} • {drug.therapeuticClass}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price and Reimbursement */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-green-600" />
              <span className="text-lg font-semibold">{drug.price.toFixed(2)} €</span>
            </div>
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              Remboursement {drug.reimbursement}%
            </Badge>
          </div>

          {/* Indications */}
          {drug.indications.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Indications</h4>
              <div className="flex flex-wrap gap-2">
                {drug.indications.map((indication, index) => (
                  <Badge key={index} variant="secondary">{indication}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Dosage */}
          {drug.dosage && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Posologie
              </h4>
              <p className="text-muted-foreground">{drug.dosage}</p>
            </div>
          )}

          {/* Contraindications */}
          {drug.contraindications.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Contre-indications
              </h4>
              <ul className="space-y-1">
                {drug.contraindications.map((ci, index) => (
                  <li key={index} className="text-sm text-red-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    {ci}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Side Effects */}
          {drug.sideEffects.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Effets Indésirables</h4>
              <ul className="space-y-1">
                {drug.sideEffects.map((effect, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    {effect}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactions */}
          {drug.interactions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Interactions</h4>
              <div className="flex flex-wrap gap-2">
                {drug.interactions.map((interaction, index) => (
                  <Badge key={index} variant="outline" className="border-orange-200 text-orange-700">
                    {interaction}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Pregnancy & Breastfeeding */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Grossesse
              </h4>
              <Badge 
                variant={drug.pregnancy === 'Autorisé' ? 'default' : 'secondary'}
                className={drug.pregnancy === 'Autorisé' ? 'bg-green-50 text-green-700' : ''}
              >
                {drug.pregnancy}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Baby className="h-4 w-4" />
                Allaitement
              </h4>
              <Badge 
                variant={drug.breastfeeding === 'Compatible' ? 'default' : 'secondary'}
                className={drug.breastfeeding === 'Compatible' ? 'bg-green-50 text-green-700' : ''}
              >
                {drug.breastfeeding}
              </Badge>
            </div>
          </div>

          {/* Age */}
          <div className="space-y-2">
            <h4 className="font-semibold">Population</h4>
            <p className="text-muted-foreground">{drug.age}</p>
          </div>

          {/* Prescription Required */}
          <div className="p-3 rounded-lg border">
            <Badge variant={drug.prescriptionRequired ? 'destructive' : 'secondary'}>
              {drug.prescriptionRequired ? 'Ordonnance obligatoire' : 'Médicament conseil'}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DrugDetailDialog;
