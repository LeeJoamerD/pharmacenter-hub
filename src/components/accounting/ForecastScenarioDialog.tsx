import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface ForecastScenarioData {
  nom_scenario: string;
  type_scenario: string;
  description?: string;
  coefficient_ajustement: number;
  periode_debut?: string;
  periode_fin?: string;
  solde_initial: number;
  entrees_prevues: number;
  sorties_prevues: number;
  solde_prevu: number;
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
      nom_scenario: '',
      type_scenario: 'Réaliste',
      description: '',
      coefficient_ajustement: 1,
      periode_debut: '',
      periode_fin: '',
      solde_initial: 0,
      entrees_prevues: 0,
      sorties_prevues: 0,
      solde_prevu: 0,
      notes: ''
    }
  });

  // Watch values to calculate solde_prevu
  const soldeInitial = watch('solde_initial') || 0;
  const entreesPrevues = watch('entrees_prevues') || 0;
  const sortiesPrevues = watch('sorties_prevues') || 0;
  const coefficient = watch('coefficient_ajustement') || 1;

  // Auto-calculate solde_prevu
  useEffect(() => {
    const soldePrevu = (soldeInitial + entreesPrevues - sortiesPrevues) * coefficient;
    setValue('solde_prevu', Math.round(soldePrevu));
  }, [soldeInitial, entreesPrevues, sortiesPrevues, coefficient, setValue]);

  // Reset form when dialog opens/closes or scenario changes
  useEffect(() => {
    if (open) {
      if (scenario) {
        reset({
          nom_scenario: scenario.nom_scenario || '',
          type_scenario: scenario.type_scenario || 'Réaliste',
          description: scenario.description || '',
          coefficient_ajustement: scenario.coefficient_ajustement || 1,
          periode_debut: scenario.periode_debut || '',
          periode_fin: scenario.periode_fin || '',
          solde_initial: scenario.solde_initial || 0,
          entrees_prevues: scenario.entrees_prevues || 0,
          sorties_prevues: scenario.sorties_prevues || 0,
          solde_prevu: scenario.solde_prevu || 0,
          notes: scenario.notes || ''
        });
      } else {
        reset({
          nom_scenario: '',
          type_scenario: 'Réaliste',
          description: '',
          coefficient_ajustement: 1,
          periode_debut: '',
          periode_fin: '',
          solde_initial: 0,
          entrees_prevues: 0,
          sorties_prevues: 0,
          solde_prevu: 0,
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
      <DialogContent className="sm:max-w-[550px]">
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
              <Label htmlFor="nom_scenario">Nom du scénario *</Label>
              <Input
                id="nom_scenario"
                {...register('nom_scenario', { required: 'Nom requis' })}
                placeholder="Ex: Prévision Q1 2025"
              />
              {errors.nom_scenario && (
                <p className="text-sm text-destructive">{errors.nom_scenario.message}</p>
              )}
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Décrivez les hypothèses de ce scénario..."
              rows={2}
            />
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
              <Label htmlFor="solde_initial">Solde initial ({currencyCode})</Label>
              <Input
                id="solde_initial"
                type="number"
                {...register('solde_initial', { valueAsNumber: true })}
                placeholder="0"
              />
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
              <Label htmlFor="entrees_prevues">Entrées prévues ({currencyCode})</Label>
              <Input
                id="entrees_prevues"
                type="number"
                {...register('entrees_prevues', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sorties_prevues">Sorties prévues ({currencyCode})</Label>
              <Input
                id="sorties_prevues"
                type="number"
                {...register('sorties_prevues', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <Label>Solde prévisionnel calculé</Label>
              <span className={`text-lg font-bold ${
                watch('solde_prevu') >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {new Intl.NumberFormat('fr-FR').format(watch('solde_prevu'))} {currencyCode}
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
