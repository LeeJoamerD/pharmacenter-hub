import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface CommitmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  commitment?: any;
  bankAccounts: any[];
}

const CommitmentDialog = ({ open, onOpenChange, onSubmit, commitment, bankAccounts }: CommitmentDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: commitment || {
      libelle: '',
      type_engagement: 'Autres',
      montant_xaf: 0,
      date_echeance: '',
      compte_bancaire_id: '',
      statut: 'Prévu',
      notes: ''
    }
  });

  const { getInputStep } = useCurrencyFormatting();

  React.useEffect(() => {
    if (commitment) {
      Object.keys(commitment).forEach(key => {
        setValue(key as any, commitment[key]);
      });
    } else {
      reset({
        libelle: '',
        type_engagement: 'Autres',
        montant_xaf: 0,
        date_echeance: '',
        compte_bancaire_id: '',
        statut: 'Prévu',
        notes: ''
      });
    }
  }, [commitment, setValue, reset]);

  const handleFormSubmit = (data: any) => {
    // Remove any fields that shouldn't be sent to the database
    delete data.compte;
    delete data.created_at;
    delete data.updated_at;
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{commitment ? 'Modifier l\'Engagement' : 'Nouvel Engagement'}</DialogTitle>
          <DialogDescription>
            {commitment ? 'Modifiez les détails de l\'engagement' : 'Créez un nouvel engagement de trésorerie'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label>Libellé</Label>
            <Input {...register('libelle', { required: true })} placeholder="Ex: Salaires Décembre" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type d'engagement</Label>
              <Select onValueChange={(value) => setValue('type_engagement', value)} defaultValue={watch('type_engagement')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Salaires">Salaires</SelectItem>
                  <SelectItem value="Fournisseurs">Fournisseurs</SelectItem>
                  <SelectItem value="Charges sociales">Charges sociales</SelectItem>
                  <SelectItem value="Impôts BEAC">Impôts BEAC</SelectItem>
                  <SelectItem value="Loyers">Loyers</SelectItem>
                  <SelectItem value="Autres">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Montant (XAF)</Label>
              <Input type="number" step={getInputStep()} {...register('montant_xaf', { valueAsNumber: true, required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Statut</Label>
              <Select onValueChange={(value) => setValue('statut', value)} defaultValue={watch('statut')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prévu">Prévu</SelectItem>
                  <SelectItem value="Confirmé">Confirmé</SelectItem>
                  <SelectItem value="Payé">Payé</SelectItem>
                  <SelectItem value="Annulé">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date d'Échéance</Label>
              <Input type="date" {...register('date_echeance', { required: true })} />
            </div>
          </div>
          <div>
            <Label>Compte Bancaire</Label>
            <Select onValueChange={(value) => setValue('compte_bancaire_id', value)} defaultValue={watch('compte_bancaire_id')}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un compte" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account: any) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.nom_compte}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea {...register('notes')} placeholder="Détails..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{commitment ? 'Mettre à jour' : 'Créer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommitmentDialog;
