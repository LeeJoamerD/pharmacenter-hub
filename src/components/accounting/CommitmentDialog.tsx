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
      type_engagement: 'Dépense',
      montant_xaf: 0,
      date_echeance: '',
      compte_bancaire_id: '',
      statut: 'En attente',
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
        type_engagement: 'Dépense',
        montant_xaf: 0,
        date_echeance: '',
        compte_bancaire_id: '',
        statut: 'En attente',
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
              <Label>Type</Label>
              <Select onValueChange={(value) => setValue('type_engagement', value)} defaultValue={watch('type_engagement')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recette">Recette (Entrée)</SelectItem>
                  <SelectItem value="Dépense">Dépense (Sortie)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Montant</Label>
              <Input type="number" step={getInputStep()} {...register('montant_xaf', { valueAsNumber: true, required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date d'Échéance</Label>
              <Input type="date" {...register('date_echeance', { required: true })} />
            </div>
            <div>
              <Label>Compte Bancaire</Label>
              <Select onValueChange={(value) => setValue('compte_bancaire_id', value)} defaultValue={watch('compte_bancaire_id')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
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
