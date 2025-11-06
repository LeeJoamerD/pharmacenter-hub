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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';

interface ReturnApprovalDialogProps {
  returnId: string | null;
  returnNumber: string;
  action: 'approve' | 'reject' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (returnId: string, decision: 'Approuvé' | 'Rejeté', notes?: string) => Promise<void>;
}

const ReturnApprovalDialog: React.FC<ReturnApprovalDialogProps> = ({
  returnId,
  returnNumber,
  action,
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!returnId || !action) return;

    setIsSubmitting(true);
    try {
      await onConfirm(
        returnId,
        action === 'approve' ? 'Approuvé' : 'Rejeté',
        notes || undefined
      );
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApproval = action === 'approve';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApproval ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approuver le retour
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Rejeter le retour
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isApproval
              ? `Vous êtes sur le point d'approuver le retour ${returnNumber}. Cette action permettra le traitement et le remboursement.`
              : `Vous êtes sur le point de rejeter le retour ${returnNumber}. Le client sera notifié du refus.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">
              {isApproval ? 'Notes (optionnel)' : 'Motif du rejet (recommandé)'}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                isApproval
                  ? 'Ajouter des notes sur cette approbation...'
                  : 'Expliquer la raison du rejet...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            variant={isApproval ? 'default' : 'destructive'}
          >
            {isSubmitting
              ? 'Traitement...'
              : isApproval
              ? 'Approuver'
              : 'Rejeter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnApprovalDialog;
