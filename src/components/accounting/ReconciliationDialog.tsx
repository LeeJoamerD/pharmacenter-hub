import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface ReconciliationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  reconciliation?: any;
  bankAccounts: any[];
}

const ReconciliationDialog = ({ open, onOpenChange, onSubmit, reconciliation, bankAccounts }: ReconciliationDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: reconciliation || {
      compte_bancaire_id: '',
      date_rapprochement: new Date().toISOString().split('T')[0],
      periode_debut: '',
      periode_fin: '',
      solde_releve: 0,
      solde_comptable: 0,
      ecart: 0,
      statut: 'En cours',
      notes: ''
    }
  });

  const { getInputStep } = useCurrencyFormatting();

  React.useEffect(() => {
    if (reconciliation) {
      Object.keys(reconciliation).forEach(key => {
        setValue(key as any, reconciliation[key]);
      });
    } else {
      reset({
        compte_bancaire_id: '',
        date_rapprochement: new Date().toISOString().split('T')[0],
        periode_debut: '',
        periode_fin: '',
        solde_releve: 0,
        solde_comptable: 0,
        ecart: 0,
        statut: 'En cours',
        notes: ''
      });
    }
  }, [reconciliation, setValue, reset]);

  const handleFormSubmit = (data: any) => {
    data.ecart = (data.solde_releve || 0) - (data.solde_comptable || 0);
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{reconciliation ? 'Modifier le Rapprochement' : 'Nouveau Rapprochement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label>Compte Bancaire</Label>
            <Select onValueChange={(value) => setValue('compte_bancaire_id', value)} defaultValue={watch('compte_bancaire_id')}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un compte" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account: any) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.banque} - {account.nom_compte}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Période Début</Label>
              <Input type="date" {...register('periode_debut')} />
            </div>
            <div>
              <Label>Période Fin</Label>
              <Input type="date" {...register('periode_fin')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Solde Relevé Bancaire</Label>
              <Input type="number" step={getInputStep()} {...register('solde_releve', { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Solde Comptable</Label>
              <Input type="number" step={getInputStep()} {...register('solde_comptable', { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea {...register('notes')} placeholder="Observations..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{reconciliation ? 'Mettre à jour' : 'Créer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReconciliationDialog;
