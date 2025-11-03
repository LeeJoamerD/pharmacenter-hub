import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { PaymentSchedule } from '@/hooks/usePaymentManager';
import ClientSelector from './ClientSelector';
import FournisseurSelector from './FournisseurSelector';

interface PaymentScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<PaymentSchedule>) => void;
  schedule?: PaymentSchedule | null;
}

const PaymentScheduleDialog: React.FC<PaymentScheduleDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  schedule,
}) => {
  const { register, handleSubmit, watch, setValue } = useForm<Partial<PaymentSchedule>>({
    defaultValues: schedule || {
      type_echeancier: 'client',
      periodicite: 'mensuel',
      nombre_echeances: 1,
      alerte_avant_echeance: 7,
      date_emission: new Date().toISOString().split('T')[0],
      montant_total: 0,
      montant_restant: 0,
    },
  });

  const typeEcheancier = watch('type_echeancier');
  const clientId = watch('client_id');
  const fournisseurId = watch('fournisseur_id');
  const montantTotal = watch('montant_total');
  const nombreEcheances = watch('nombre_echeances');

  React.useEffect(() => {
    if (montantTotal) {
      setValue('montant_restant', montantTotal);
    }
  }, [montantTotal, setValue]);

  const handleFormSubmit = (data: Partial<PaymentSchedule>) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{schedule ? 'Modifier l\'échéancier' : 'Nouvel échéancier de paiement'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type_echeancier">Type d'échéancier *</Label>
            <Select value={typeEcheancier} onValueChange={(value) => setValue('type_echeancier', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client (À recevoir)</SelectItem>
                <SelectItem value="fournisseur">Fournisseur (À payer)</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {typeEcheancier === 'client' && (
            <ClientSelector
              value={clientId}
              onChange={(value) => setValue('client_id', value)}
            />
          )}

          {typeEcheancier === 'fournisseur' && (
            <FournisseurSelector
              value={fournisseurId}
              onChange={(value) => setValue('fournisseur_id', value)}
            />
          )}

          {typeEcheancier === 'autre' && (
            <div className="space-y-2">
              <Label htmlFor="tiers_nom">Nom du tiers *</Label>
              <Input id="tiers_nom" {...register('tiers_nom')} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="libelle">Libellé *</Label>
              <Input id="libelle" {...register('libelle', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant_total">Montant total *</Label>
              <Input 
                id="montant_total" 
                type="number" 
                step="0.01"
                {...register('montant_total', { required: true, valueAsNumber: true })} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre_echeances">Nombre d'échéances *</Label>
              <Input 
                id="nombre_echeances" 
                type="number" 
                min="1"
                {...register('nombre_echeances', { required: true, valueAsNumber: true })} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodicite">Périodicité *</Label>
              <Select 
                value={watch('periodicite')} 
                onValueChange={(value) => setValue('periodicite', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unique">Paiement unique</SelectItem>
                  <SelectItem value="mensuel">Mensuel</SelectItem>
                  <SelectItem value="trimestriel">Trimestriel</SelectItem>
                  <SelectItem value="semestriel">Semestriel</SelectItem>
                  <SelectItem value="annuel">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_premiere_echeance">Date première échéance *</Label>
              <Input 
                id="date_premiere_echeance" 
                type="date" 
                {...register('date_premiere_echeance', { required: true })} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_emission">Date d'émission *</Label>
              <Input 
                id="date_emission" 
                type="date" 
                {...register('date_emission', { required: true })} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alerte_avant_echeance">Alerte avant (jours)</Label>
              <Input 
                id="alerte_avant_echeance" 
                type="number" 
                {...register('alerte_avant_echeance', { valueAsNumber: true })} 
              />
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
              {schedule ? 'Mettre à jour' : 'Créer l\'échéancier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentScheduleDialog;
