import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FiscalObligationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligation: any;
  onMarkPaid: (id: string) => Promise<boolean>;
  currency?: string;
}

const FiscalObligationDialog: React.FC<FiscalObligationDialogProps> = ({
  open,
  onOpenChange,
  obligation,
  onMarkPaid,
  currency = 'FCFA',
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  if (!obligation) return null;

  const dueDate = new Date(obligation.date_echeance);
  const today = new Date();
  const daysUntilDue = differenceInDays(dueDate, today);
  const isOverdue = daysUntilDue < 0 && obligation.statut === 'en_attente';
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7 && obligation.statut === 'en_attente';

  const statusConfig: Record<string, { color: string; label: string }> = {
    en_attente: { color: isOverdue ? 'bg-red-100 text-red-800' : isDueSoon ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800', label: isOverdue ? 'En retard' : 'En attente' },
    payee: { color: 'bg-green-100 text-green-800', label: 'Payée' },
    en_retard: { color: 'bg-red-100 text-red-800', label: 'En retard' },
  };

  const status = statusConfig[obligation.statut] || statusConfig.en_attente;

  const handleMarkPaid = async () => {
    setIsProcessing(true);
    const success = await onMarkPaid(obligation.id);
    setIsProcessing(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Obligation Fiscale
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type et statut */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-base px-3 py-1">
              {obligation.type_obligation}
            </Badge>
            <Badge className={status.color}>{status.label}</Badge>
          </div>

          {/* Description */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="font-medium mt-1">{obligation.description}</p>
          </div>

          {/* Montant */}
          {obligation.montant && (
            <div className="bg-primary/5 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Montant</p>
              <p className="text-2xl font-bold">
                {obligation.montant.toLocaleString('fr-FR')} {currency}
              </p>
            </div>
          )}

          {/* Échéance */}
          <div className={`rounded-lg p-4 ${isOverdue ? 'bg-red-50 border border-red-200' : isDueSoon ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted/50'}`}>
            <div className="flex items-center gap-2">
              {isOverdue ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Date d'échéance</p>
                <p className="font-medium">
                  {format(dueDate, 'dd MMMM yyyy', { locale: fr })}
                </p>
                {obligation.statut === 'en_attente' && (
                  <p className={`text-sm mt-1 ${isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-yellow-700' : 'text-muted-foreground'}`}>
                    {isOverdue
                      ? `En retard de ${Math.abs(daysUntilDue)} jour(s)`
                      : daysUntilDue === 0
                      ? 'À payer aujourd\'hui'
                      : `Dans ${daysUntilDue} jour(s)`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Période concernée */}
          {obligation.periode_concernee && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Période: {obligation.periode_concernee}</span>
            </div>
          )}

          {/* Date de paiement */}
          {obligation.date_paiement && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Payée le {format(new Date(obligation.date_paiement), 'dd/MM/yyyy', { locale: fr })}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {obligation.statut === 'en_attente' && (
            <Button onClick={handleMarkPaid} disabled={isProcessing}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marquer comme payée
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiscalObligationDialog;
