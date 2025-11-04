import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { TVADeclaration, VATSummary } from '@/hooks/useFiscalManagement';
import { useCurrency } from '@/contexts/CurrencyContext';

interface DeclarationTVADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<TVADeclaration, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => void;
  vatSummary?: VATSummary;
}

export const DeclarationTVADialog = ({ open, onOpenChange, onSave, vatSummary }: DeclarationTVADialogProps) => {
  const { currentCurrency } = useCurrency();
  const devise = currentCurrency.code;
  
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      exercice_id: '',
      periode: new Date().toISOString().slice(0, 7),
      tva_collectee: vatSummary?.vatCollected || 0,
      tva_deductible: vatSummary?.vatDeductible || 0,
      tva_a_payer: vatSummary?.vatDue || 0,
      statut: 'En cours',
    },
  });

  const onSubmit = (data: any) => {
    onSave(data);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Générer une déclaration TVA</DialogTitle>
          <DialogDescription>
            Créez une nouvelle déclaration fiscale
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="periode">Période (AAAA-MM)</Label>
              <Input
                id="periode"
                type="month"
                {...register('periode', { required: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tva_collectee">TVA Collectée ({devise})</Label>
              <Input
                id="tva_collectee"
                type="number"
                {...register('tva_collectee', { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tva_deductible">TVA Déductible ({devise})</Label>
              <Input
                id="tva_deductible"
                type="number"
                {...register('tva_deductible', { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tva_a_payer">TVA à Payer ({devise})</Label>
              <Input
                id="tva_a_payer"
                type="number"
                {...register('tva_a_payer', { required: true, valueAsNumber: true })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
