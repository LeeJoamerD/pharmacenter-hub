import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

export interface ForecastScenarioData {
  type_scenario: string;
  coefficient_ajustement: number;
  periode_debut?: string;
  periode_fin?: string;
  solde_initial_xaf: number;
  entrees_prevues_xaf: number;
  sorties_prevues_xaf: number;
  solde_final_previsionnel_xaf: number;
  notes?: string;
}

interface ForecastScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario?: any;
  onSave: (data: ForecastScenarioData) => void;
  isLoading?: boolean;
}

const ForecastScenarioDialog: React.FC<ForecastScenarioDialogProps> = ({
  open,
  onOpenChange,
  scenario,
  onSave,
  isLoading = false
}) => {
  const { getCurrencyCode } = useCurrencyFormatting();
  const currencyCode = getCurrencyCode();
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ForecastScenarioData>({
    defaultValues: {
      type_scenario: 'Réaliste',
      coefficient_ajustement: 1,
      periode_debut: '',
      periode_fin: '',
      solde_initial_xaf: 0,
      entrees_prevues_xaf: 0,
      sorties_prevues_xaf: 0,
      solde_final_previsionnel_xaf: 0,
      notes: ''
    }
  });

  // Watch values to calculate solde_final_previsionnel_xaf
  const soldeInitial = watch('solde_initial_xaf') || 0;
  const entreesPrevues = watch('entrees_prevues_xaf') || 0;
  const sortiesPrevues = watch('sorties_prevues_xaf') || 0;
  const coefficient = watch('coefficient_ajustement') || 1;

  // Auto-calculate solde_final_previsionnel_xaf
  useEffect(() => {
    const soldePrevu = (soldeInitial + entreesPrevues - sortiesPrevues) * coefficient;
    setValue('solde_final_previsionnel_xaf', Math.round(soldePrevu));
  }, [soldeInitial, entreesPrevues, sortiesPrevues, coefficient, setValue]);

  // Reset form when dialog opens/closes or scenario changes
  useEffect(() => {
    if (open) {
      if (scenario) {
        reset({
          type_scenario: scenario.type_scenario || 'Réaliste',
          coefficient_ajustement: scenario.coefficient_ajustement || 1,
          periode_debut: scenario.periode_debut || '',
          periode_fin: scenario.periode_fin || '',
          solde_initial_xaf: scenario.solde_initial_xaf || 0,
          entrees_prevues_xaf: scenario.entrees_prevues_xaf || 0,
          sorties_prevues_xaf: scenario.sorties_prevues_xaf || 0,
          solde_final_previsionnel_xaf: scenario.solde_final_previsionnel_xaf || 0,
          notes: scenario.notes || ''
        });
      } else {
        reset({
          type_scenario: 'Réaliste',
          coefficient_ajustement: 1,
          periode_debut: '',
          periode_fin: '',
          solde_initial_xaf: 0,
          entrees_prevues_xaf: 0,
          sorties_prevues_xaf: 0,
          solde_final_previsionnel_xaf: 0,
          notes: ''
        });
      }
    }
  }, [open, scenario, reset]);

  const onSubmit = (data: ForecastScenarioData) => {
    onSave(data);
  };

  const isEditMode = !!scenario;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier le scénario' : 'Nouveau scénario prévisionnel'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Modifiez les paramètres du scénario de prévision de trésorerie.'
              : 'Créez un nouveau scénario pour prévoir votre trésorerie future.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type_scenario">Type de scénario *</Label>
              <Select
                value={watch('type_scenario')}
                onValueChange={(value) => setValue('type_scenario', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Réaliste">Réaliste</SelectItem>
                  <SelectItem value="Optimiste">Optimiste</SelectItem>
                  <SelectItem value="Pessimiste">Pessimiste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coefficient_ajustement">Coefficient d'ajustement</Label>
              <Input
                id="coefficient_ajustement"
                type="number"
                step="0.01"
                {...register('coefficient_ajustement', { valueAsNumber: true })}
                placeholder="1.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periode_debut">Période de début</Label>
              <Input
                id="periode_debut"
                type="date"
                {...register('periode_debut')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periode_fin">Période de fin</Label>
              <Input
                id="periode_fin"
                type="date"
                {...register('periode_fin')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="solde_initial_xaf">Solde initial ({currencyCode})</Label>
              <Input
                id="solde_initial_xaf"
                type="number"
                {...register('solde_initial_xaf', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entrees_prevues_xaf">Entrées prévues ({currencyCode})</Label>
              <Input
                id="entrees_prevues_xaf"
                type="number"
                {...register('entrees_prevues_xaf', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sorties_prevues_xaf">Sorties prévues ({currencyCode})</Label>
            <Input
              id="sorties_prevues_xaf"
              type="number"
              {...register('sorties_prevues_xaf', { valueAsNumber: true })}
              placeholder="0"
            />
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <Label>Solde prévisionnel calculé</Label>
              <span className={`text-lg font-bold ${
                watch('solde_final_previsionnel_xaf') >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {new Intl.NumberFormat('fr-FR').format(watch('solde_final_previsionnel_xaf'))} {currencyCode}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              = (Solde initial + Entrées - Sorties) × Coefficient
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes additionnelles</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Notes ou remarques..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForecastScenarioDialog;
