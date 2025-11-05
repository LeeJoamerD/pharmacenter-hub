import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { PaymentMethod } from '@/hooks/usePaymentManager';

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<PaymentMethod>) => void;
  method?: PaymentMethod | null;
}

const PaymentMethodDialog: React.FC<PaymentMethodDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  method,
}) => {
  const { register, handleSubmit, watch, setValue } = useForm<Partial<PaymentMethod>>({
    defaultValues: method || {
      est_actif: true,
      ordre_affichage: 0,
      exige_reference: false,
      exige_validation: false,
      delai_encaissement: 0,
      frais_pourcentage: 0,
      frais_fixes: 0,
    },
  });

  const estActif = watch('est_actif');
  const exigeReference = watch('exige_reference');
  const exigeValidation = watch('exige_validation');

  const handleFormSubmit = (data: Partial<PaymentMethod>) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{method ? 'Modifier le mode' : 'Nouveau mode de paiement'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input 
                id="code" 
                {...register('code', { required: true })} 
                placeholder="Ex: CARTE, ESPECES" 
                disabled={!!method}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="libelle">Libellé *</Label>
              <Input id="libelle" {...register('libelle', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordre_affichage">Ordre d'affichage</Label>
              <Input 
                id="ordre_affichage" 
                type="number" 
                {...register('ordre_affichage', { valueAsNumber: true })} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delai_encaissement">Délai encaissement (jours)</Label>
              <Input 
                id="delai_encaissement" 
                type="number" 
                {...register('delai_encaissement', { valueAsNumber: true })} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frais_pourcentage">Frais (%)</Label>
              <Input 
                id="frais_pourcentage" 
                type="number" 
                step="0.01"
                {...register('frais_pourcentage', { valueAsNumber: true })} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frais_fixes">Frais fixes</Label>
              <Input 
                id="frais_fixes" 
                type="number" 
                step="0.01"
                {...register('frais_fixes', { valueAsNumber: true })} 
              />
            </div>

            {/* Montant minimum et maximum removed - not in DB schema */}

            <div className="space-y-2">
              <Label htmlFor="icone">Icône</Label>
              <Input id="icone" {...register('icone')} placeholder="Ex: credit-card" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couleur">Couleur</Label>
              <Input id="couleur" type="color" {...register('couleur')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={2} />
          </div>

          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <Switch 
                id="est_actif" 
                checked={estActif}
                onCheckedChange={(checked) => setValue('est_actif', checked)}
              />
              <Label htmlFor="est_actif">Mode actif</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="exige_reference" 
                checked={exigeReference}
                onCheckedChange={(checked) => setValue('exige_reference', checked)}
              />
              <Label htmlFor="exige_reference">Exiger une référence</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="exige_validation" 
                checked={exigeValidation}
                onCheckedChange={(checked) => setValue('exige_validation', checked)}
              />
              <Label htmlFor="exige_validation">Exiger validation</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {method ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodDialog;
