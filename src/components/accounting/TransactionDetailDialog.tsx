import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Calendar, 
  CreditCard, 
  Building2, 
  Tag, 
  FileText, 
  CheckCircle,
  XCircle,
  Edit,
  Link,
  Trash2,
  Calculator,
  Hash
} from 'lucide-react';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { isReconciled as checkIsReconciled, formatReconciliationStatus } from '@/constants/transactionStatus';

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
  onEdit?: () => void;
  onReconcile?: () => void;
  onDelete?: () => void;
}

const TransactionDetailDialog: React.FC<TransactionDetailDialogProps> = ({
  open,
  onOpenChange,
  transaction,
  onEdit,
  onReconcile,
  onDelete,
}) => {
  const { formatAmount } = useCurrencyFormatting();

  if (!transaction) return null;

  const isReconciled = checkIsReconciled(transaction.statut_rapprochement);
  const isCredit = transaction.type_transaction === 'credit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Détails de la Transaction
          </DialogTitle>
          <DialogDescription>
            Référence: {transaction.reference || 'N/A'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Montant principal */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Montant</p>
              <p className={`text-3xl font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                {isCredit ? '+' : '-'}{formatAmount(Math.abs(transaction.montant || 0))}
              </p>
            </div>
            <Badge variant={isCredit ? 'default' : 'destructive'} className="text-lg px-4 py-1">
              {isCredit ? 'Crédit' : 'Débit'}
            </Badge>
          </div>

          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                Date de transaction
              </div>
              <p className="font-medium">
                {transaction.date_transaction 
                  ? format(new Date(transaction.date_transaction), 'dd MMMM yyyy', { locale: fr })
                  : 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                Date de valeur
              </div>
              <p className="font-medium">
                {transaction.date_valeur 
                  ? format(new Date(transaction.date_valeur), 'dd MMMM yyyy', { locale: fr })
                  : 'Non définie'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Building2 className="h-4 w-4" />
                Compte bancaire
              </div>
              <p className="font-medium">
                {transaction.compte?.nom_compte || 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">
                {transaction.compte?.banque || ''}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Hash className="h-4 w-4" />
                Référence
              </div>
              <p className="font-medium">
                {transaction.reference || 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Libellé et Description */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <FileText className="h-4 w-4" />
                Libellé
              </div>
              <p className="font-medium">{transaction.libelle || 'N/A'}</p>
            </div>

            {transaction.description && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{transaction.description}</p>
              </div>
            )}

            {transaction.notes && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm bg-muted/50 p-2 rounded">{transaction.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Catégorie et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Tag className="h-4 w-4" />
                Catégorie
              </div>
              <Badge variant="outline">
                {transaction.categorie || 'Non catégorisé'}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                {isReconciled ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-orange-500" />}
                Statut de rapprochement
              </div>
              <Badge variant={isReconciled ? 'default' : 'destructive'}>
                {formatReconciliationStatus(transaction.statut_rapprochement)}
              </Badge>
            </div>
          </div>

          {/* Centime additionnel */}
          {transaction.montant_centime_additionnel && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Centime additionnel</span>
                </div>
                <Badge variant="secondary">
                  {formatAmount(transaction.montant_centime_additionnel)}
                </Badge>
              </div>
            </>
          )}

          {/* Métadonnées */}
          {transaction.created_at && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Créée le {format(new Date(transaction.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
              {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                <> • Modifiée le {format(new Date(transaction.updated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}
          {!isReconciled && onReconcile && (
            <Button variant="outline" onClick={onReconcile}>
              <Link className="h-4 w-4 mr-2" />
              Rapprocher
            </Button>
          )}
          {onEdit && (
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailDialog;
