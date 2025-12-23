import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import BankAccountSelector from './BankAccountSelector';

// Generic types to support both usePaymentManager and useBankingManager
interface GenericBankAccount {
  id: string;
  nom_compte: string;
  numero_compte: string;
  solde_actuel: number;
  devise: string;
  est_actif: boolean;
}

interface TransactionFormData {
  compte_bancaire_id?: string;
  reference?: string;
  reference_externe?: string;
  date_transaction?: string;
  date_valeur?: string;
  type_transaction?: string;
  montant?: number;
  libelle?: string;
  description?: string;
  categorie?: string;
  notes?: string;
  statut_rapprochement?: string;
}

interface BankTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransactionFormData) => void;
  transaction?: TransactionFormData | null;
  bankAccounts: GenericBankAccount[];
}

const BankTransactionDialog: React.FC<BankTransactionDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  transaction,
  bankAccounts,
}) => {
  const { register, handleSubmit, watch, setValue } = useForm<TransactionFormData>({
    defaultValues: transaction || {
      type_transaction: 'credit',
      statut_rapprochement: 'non_rapproche',
      date_transaction: new Date().toISOString().split('T')[0],
      montant: 0,
    },
  });

  const typeTransaction = watch('type_transaction');
  const compteBancaireId = watch('compte_bancaire_id');

  const handleFormSubmit = (data: TransactionFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Modifier la transaction' : 'Nouvelle transaction bancaire'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <BankAccountSelector
            accounts={bankAccounts}
            value={compteBancaireId}
            onChange={(value) => setValue('compte_bancaire_id', value)}
            showBalance
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Référence *</Label>
              <Input id="reference" {...register('reference', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_externe">Référence externe</Label>
              <Input id="reference_externe" {...register('reference_externe')} placeholder="Référence banque" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_transaction">Date transaction *</Label>
              <Input id="date_transaction" type="date" {...register('date_transaction', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_valeur">Date valeur</Label>
              <Input id="date_valeur" type="date" {...register('date_valeur')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_transaction">Type *</Label>
              <Select value={typeTransaction} onValueChange={(value) => setValue('type_transaction', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Crédit (+)</SelectItem>
                  <SelectItem value="debit">Débit (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant">Montant *</Label>
              <Input 
                id="montant" 
                type="number" 
                step="0.01"
                {...register('montant', { required: true, valueAsNumber: true })} 
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="libelle">Libellé *</Label>
              <Input id="libelle" {...register('libelle', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie</Label>
              <Input id="categorie" {...register('categorie')} placeholder="Ex: Vente, Achat, Frais..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {transaction ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BankTransactionDialog;
