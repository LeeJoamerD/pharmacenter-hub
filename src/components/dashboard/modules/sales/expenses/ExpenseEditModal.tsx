import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import type { CashExpense } from '@/hooks/useCashExpenses';

interface ExpenseEditModalProps {
  expense: CashExpense | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { montant: number; description: string; motif: string }) => Promise<void>;
}

const EXPENSE_MOTIFS = [
  { value: 'fournitures', label: 'Fournitures de bureau' },
  { value: 'entretien', label: 'Entretien et réparations' },
  { value: 'transport', label: 'Transport et déplacement' },
  { value: 'charges', label: 'Charges diverses' },
  { value: 'salaires', label: 'Avances sur salaires' },
  { value: 'impots', label: 'Impôts et taxes' },
  { value: 'divers', label: 'Dépenses diverses' }
];

const ExpenseEditModal: React.FC<ExpenseEditModalProps> = ({
  expense,
  open,
  onClose,
  onSubmit
}) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<{
    montant: number;
    description: string;
    motif: string;
  }>();

  const selectedMotif = watch('motif');

  useEffect(() => {
    if (expense) {
      reset({
        montant: expense.montant,
        description: expense.description || '',
        motif: expense.motif || 'divers'
      });
    }
  }, [expense, reset]);

  const handleFormSubmit = async (data: { montant: number; description: string; motif: string }) => {
    await onSubmit(data);
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier la dépense</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la dépense. Les champs marqués * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (FCFA) *</Label>
            <Input
              id="montant"
              type="number"
              step="1"
              min="0"
              {...register('montant', { 
                required: 'Le montant est requis',
                min: { value: 1, message: 'Le montant doit être supérieur à 0' }
              })}
            />
            {errors.montant && (
              <p className="text-sm text-destructive">{errors.montant.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Motif *</Label>
            <Select
              value={selectedMotif}
              onValueChange={(value) => setValue('motif', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un motif" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_MOTIFS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Décrivez la dépense..."
              {...register('description')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseEditModal;
