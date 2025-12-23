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
      numero_rapprochement: '',
      date_debut: '',
      date_fin: new Date().toISOString().split('T')[0],
      solde_releve_debut: 0,
      solde_releve_fin: 0,
      solde_comptable_debut: 0,
      solde_comptable_fin: 0,
        statut: 'en_cours',
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
        numero_rapprochement: '',
        date_debut: '',
        date_fin: new Date().toISOString().split('T')[0],
        solde_releve_debut: 0,
        solde_releve_fin: 0,
        solde_comptable_debut: 0,
        solde_comptable_fin: 0,
        statut: 'en_cours',
        notes: ''
      });
    }
  }, [reconciliation, setValue, reset]);

  const handleFormSubmit = (data: any) => {
    // Generate numero_rapprochement if not provided
    if (!data.numero_rapprochement) {
      data.numero_rapprochement = `RAP-${Date.now()}`;
    }
    
    // Calculate ecart
    data.ecart = (data.solde_releve_fin || 0) - (data.solde_comptable_fin || 0);
    data.ecart_non_justifie = data.ecart;
    data.ecart_justifie = 0;
    
    // Initialize transaction counters
    data.nb_transactions_rapprochees = 0;
    data.nb_transactions_non_rapprochees = 0;
    data.nb_transactions_suspectes = 0;
    
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{reconciliation ? 'Modifier le Rapprochement' : 'Nouveau Rapprochement Bancaire'}</DialogTitle>
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
          
          <div>
            <Label>Numéro de Rapprochement</Label>
            <Input {...register('numero_rapprochement')} placeholder="RAP-2024-001 (auto-généré si vide)" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date Début</Label>
              <Input type="date" {...register('date_debut')} />
            </div>
            <div>
              <Label>Date Fin</Label>
              <Input type="date" {...register('date_fin')} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Soldes de Début</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Relevé Bancaire</Label>
                <Input type="number" step={getInputStep()} {...register('solde_releve_debut', { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Comptable</Label>
                <Input type="number" step={getInputStep()} {...register('solde_comptable_debut', { valueAsNumber: true })} />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Soldes de Fin</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Relevé Bancaire</Label>
                <Input type="number" step={getInputStep()} {...register('solde_releve_fin', { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Comptable</Label>
                <Input type="number" step={getInputStep()} {...register('solde_comptable_fin', { valueAsNumber: true })} />
              </div>
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
