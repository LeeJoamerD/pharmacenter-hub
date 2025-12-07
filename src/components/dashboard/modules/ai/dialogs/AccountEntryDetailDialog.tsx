import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Hash, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AccountEntryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: any;
}

const AccountEntryDetailDialog: React.FC<AccountEntryDetailDialogProps> = ({
  open,
  onOpenChange,
  entry,
}) => {
  if (!entry) return null;

  const statusColors: Record<string, string> = {
    brouillon: 'bg-yellow-100 text-yellow-800',
    validee: 'bg-green-100 text-green-800',
    annulee: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    brouillon: 'Brouillon',
    validee: 'Validée',
    annulee: 'Annulée',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Détails de l'écriture comptable
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{entry.numero_piece}</span>
            </div>
            <Badge className={statusColors[entry.statut] || 'bg-gray-100'}>
              {statusLabels[entry.statut] || entry.statut}
            </Badge>
          </div>

          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date de l'écriture</p>
                <p className="font-medium">
                  {entry.date_ecriture
                    ? format(new Date(entry.date_ecriture), 'dd MMMM yyyy', { locale: fr })
                    : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Libellé</p>
                <p className="font-medium">{entry.libelle || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {entry.piece_justificative ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Pièce justificative</p>
                <p className="font-medium">
                  {entry.piece_justificative || 'Non attachée'}
                </p>
              </div>
            </div>
          </div>

          {entry.montant_total && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="text-xl font-bold">
                {entry.montant_total.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountEntryDetailDialog;
