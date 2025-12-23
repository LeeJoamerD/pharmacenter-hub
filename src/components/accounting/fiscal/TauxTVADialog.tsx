import React, { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { TauxTVA } from '@/hooks/useFiscalManagement';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface TauxTVADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<TauxTVA, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => void;
  defaultValues?: TauxTVA;
}

export const TauxTVADialog = ({ open, onOpenChange, onSave, defaultValues }: TauxTVADialogProps) => {
  const { getInputStep } = useCurrencyFormatting();
  
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: defaultValues || {
      nom_taux: '',
      taux_pourcentage: 18,
      type_taux: 'Standard' as const,
      description: '',
      est_actif: true,
      est_par_defaut: false,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const onSubmit = (data: any) => {
    onSave(data);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Modifier' : 'Ajouter'} un taux TVA</DialogTitle>
          <DialogDescription>
            Configurez un taux de TVA pour vos produits
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nom_taux">Nom du taux</Label>
              <Input
                id="nom_taux"
                {...register('nom_taux', { required: true })}
                placeholder="Ex: Taux Normal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taux_pourcentage">Taux (%)</Label>
              <Input
                id="taux_pourcentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('taux_pourcentage', { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type_taux">Type</Label>
              <Select
                value={watch('type_taux')}
                onValueChange={(value) => setValue('type_taux', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Réduit">Réduit</SelectItem>
                  <SelectItem value="Exonéré">Exonéré</SelectItem>
                  <SelectItem value="Spécial">Spécial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Ex: Médicaments non essentiels"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="est_actif"
                checked={watch('est_actif')}
                onCheckedChange={(checked) => setValue('est_actif', checked as boolean)}
              />
              <Label htmlFor="est_actif" className="cursor-pointer">Actif</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="est_par_defaut"
                checked={watch('est_par_defaut')}
                onCheckedChange={(checked) => setValue('est_par_defaut', checked as boolean)}
              />
              <Label htmlFor="est_par_defaut" className="cursor-pointer">Par défaut</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
