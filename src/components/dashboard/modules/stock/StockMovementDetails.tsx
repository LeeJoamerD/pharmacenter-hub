import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface StockMovementDetailsProps {
  movement: any;
  onClose: () => void;
  isOpen: boolean;
}

const StockMovementDetails = ({ movement, onClose, isOpen }: StockMovementDetailsProps) => {
  if (!movement) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'entree':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entrée</Badge>;
      case 'sortie':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Sortie</Badge>;
      case 'ajustement':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Ajustement</Badge>;
      case 'transfert':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Transfert</Badge>;
      case 'retour':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Retour</Badge>;
      case 'destruction':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Destruction</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-[500px] bg-background shadow-xl border-l z-50 flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Détails du Mouvement</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date/Heure</Label>
              <p className="text-base font-medium">
                {format(new Date(movement.date_mouvement), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
            <div>
              {getTypeIcon(movement.type_mouvement)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Produit</Label>
              <p className="text-base font-medium">{movement.produit?.libelle_produit || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Lot</Label>
              <p className="text-base">
                <Badge variant="outline" className="font-mono">{movement.lot?.numero_lot || 'N/A'}</Badge>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Quantité avant</Label>
              <p className="text-base font-medium">{movement.quantite_avant || 0}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Mouvement</Label>
              <p className={`text-base font-medium ${movement.quantite_mouvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {movement.quantite_mouvement > 0 ? '+' : ''}{movement.quantite_mouvement || 0}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Quantité après</Label>
              <p className="text-base font-medium">{movement.quantite_apres || 0}</p>
            </div>
          </div>

          {movement.reference_document && (
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Référence</Label>
              <p className="text-base">{movement.reference_document}</p>
            </div>
          )}

          {movement.motif && (
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Motif</Label>
              <div className="bg-muted/30 p-3 rounded-md">
                <p className="text-base">{movement.motif}</p>
              </div>
            </div>
          )}

          {movement.metadata && Object.keys(movement.metadata).length > 0 && (
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Métadonnées</Label>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                {JSON.stringify(movement.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-4">
        <Button variant="outline" className="w-full" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
};

export default StockMovementDetails;