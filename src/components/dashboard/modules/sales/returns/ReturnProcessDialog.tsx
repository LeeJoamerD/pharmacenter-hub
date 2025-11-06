import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertTriangle } from 'lucide-react';

interface ReturnProcessDialogProps {
  returnId: string | null;
  returnNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (returnId: string) => Promise<void>;
}

const ReturnProcessDialog: React.FC<ReturnProcessDialogProps> = ({
  returnId,
  returnNumber,
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    if (!returnId) return;

    setIsProcessing(true);
    try {
      await onConfirm(returnId);
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing return:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Traiter le retour
          </DialogTitle>
          <DialogDescription>
            Traiter le retour {returnNumber} et réintégrer les produits en stock.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cette action va :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Réintégrer les produits en bon état dans le stock</li>
                <li>Effectuer le remboursement au client</li>
                <li>Marquer le retour comme terminé</li>
              </ul>
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            Le stock sera mis à jour automatiquement pour les produits en état "Parfait" ou "Endommagé".
            Les produits expirés ou non conformes ne seront pas réintégrés.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Annuler
          </Button>
          <Button onClick={handleProcess} disabled={isProcessing}>
            {isProcessing ? 'Traitement en cours...' : 'Traiter le retour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnProcessDialog;
