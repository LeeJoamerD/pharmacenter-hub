import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CashExpense } from '@/hooks/useCashExpenses';

interface ExpenseCancelConfirmDialogProps {
  expense: CashExpense | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (motif: string) => Promise<void>;
}

const ExpenseCancelConfirmDialog: React.FC<ExpenseCancelConfirmDialogProps> = ({
  expense,
  open,
  onClose,
  onConfirm
}) => {
  const [motif, setMotif] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!motif.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(motif);
      setMotif('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMotif('');
    onClose();
  };

  if (!expense) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmer l'annulation
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Êtes-vous sûr de vouloir annuler cette dépense ? Cette action est irréversible.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant:</span>
                  <span className="font-medium">{expense.montant.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{format(new Date(expense.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                </div>
                {expense.description && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="text-right max-w-[200px] truncate">{expense.description}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="motif" className="text-foreground">
                  Motif d'annulation *
                </Label>
                <Textarea
                  id="motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Indiquez le motif de l'annulation..."
                  rows={3}
                  className="resize-none"
                />
                {!motif.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Le motif est obligatoire pour annuler une dépense
                  </p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            Retour
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!motif.trim() || isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? 'Annulation...' : 'Confirmer l\'annulation'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExpenseCancelConfirmDialog;
