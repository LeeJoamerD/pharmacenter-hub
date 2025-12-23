import React, { useEffect, useMemo } from 'react';
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
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useTenant } from '@/contexts/TenantContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface DeclarationTVADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<TVADeclaration, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => void;
  vatSummary?: VATSummary;
}

export const DeclarationTVADialog = ({ open, onOpenChange, onSave, vatSummary }: DeclarationTVADialogProps) => {
  const { formatNumber, getInputStep, getCurrencySymbol, isNoDecimalCurrency } = useCurrencyFormatting();
  const { tenantId } = useTenant();
  const devise = getCurrencySymbol();
  
  // Récupérer l'exercice actif (statut = 'Ouvert')
  const { data: activeExercice, isLoading: loadingExercice } = useQuery({
    queryKey: ['active_exercice', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices_comptables')
        .select('id, libelle_exercice, date_debut, date_fin, statut')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Ouvert')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && open,
  });

  // Récupérer le taux de centime additionnel depuis les paramètres régionaux
  const { data: regionalParams } = useQuery({
    queryKey: ['parametres_regionaux_fiscaux', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametres_regionaux_fiscaux')
        .select('taux_centime_additionnel, pays')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && open,
  });

  const centimeRate = regionalParams?.taux_centime_additionnel || 5.0;

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      exercice_id: '',
      periode: new Date().toISOString().slice(0, 7),
      tva_collectee: vatSummary?.vatCollected || 0,
      tva_deductible: vatSummary?.vatDeductible || 0,
      tva_a_payer: vatSummary?.vatDue || 0,
      centime_additionnel_collecte: vatSummary?.centimeCollected || 0,
      centime_additionnel_deductible: vatSummary?.centimeDeductible || 0,
      centime_additionnel_a_payer: vatSummary?.centimeDue || 0,
      statut: 'Brouillon',
    },
  });

  const tvaCollectee = watch('tva_collectee');
  const tvaDeductible = watch('tva_deductible');

  // Calcul automatique du centime additionnel basé sur la TVA
  const calculatedCentime = useMemo(() => {
    const collecte = (Number(tvaCollectee) || 0) * (centimeRate / 100);
    const deductible = (Number(tvaDeductible) || 0) * (centimeRate / 100);
    const aPayer = collecte - deductible;
    return {
      collecte: isNoDecimalCurrency() ? Math.round(collecte) : collecte,
      deductible: isNoDecimalCurrency() ? Math.round(deductible) : deductible,
      aPayer: isNoDecimalCurrency() ? Math.round(aPayer) : aPayer,
    };
  }, [tvaCollectee, tvaDeductible, centimeRate, isNoDecimalCurrency]);

  // Mettre à jour exercice_id quand l'exercice actif est chargé
  useEffect(() => {
    if (activeExercice?.id) {
      setValue('exercice_id', activeExercice.id);
    }
  }, [activeExercice, setValue]);

  // Mettre à jour les valeurs TVA quand vatSummary change
  useEffect(() => {
    if (vatSummary) {
      const roundValue = (val: number) => isNoDecimalCurrency() ? Math.round(val) : val;
      setValue('tva_collectee', roundValue(vatSummary.vatCollected || 0));
      setValue('tva_deductible', roundValue(vatSummary.vatDeductible || 0));
      setValue('tva_a_payer', roundValue(vatSummary.vatDue || 0));
      setValue('centime_additionnel_collecte', roundValue(vatSummary.centimeCollected || 0));
      setValue('centime_additionnel_deductible', roundValue(vatSummary.centimeDeductible || 0));
      setValue('centime_additionnel_a_payer', roundValue(vatSummary.centimeDue || 0));
    }
  }, [vatSummary, setValue, isNoDecimalCurrency]);

  // Mettre à jour les centimes calculés automatiquement
  useEffect(() => {
    setValue('centime_additionnel_collecte', calculatedCentime.collecte);
    setValue('centime_additionnel_deductible', calculatedCentime.deductible);
    setValue('centime_additionnel_a_payer', calculatedCentime.aPayer);
  }, [calculatedCentime, setValue]);

  const onSubmit = (data: any) => {
    const roundValue = (val: number) => isNoDecimalCurrency() ? Math.round(val) : val;
    
    const formattedData = {
      ...data,
      periode: `${data.periode}-01`,
      exercice_id: activeExercice?.id || data.exercice_id,
      tva_collectee: roundValue(data.tva_collectee),
      tva_deductible: roundValue(data.tva_deductible),
      tva_a_payer: roundValue(data.tva_a_payer),
      centime_additionnel_collecte: roundValue(calculatedCentime.collecte),
      centime_additionnel_deductible: roundValue(calculatedCentime.deductible),
      centime_additionnel_a_payer: roundValue(calculatedCentime.aPayer),
    };
    onSave(formattedData);
    onOpenChange(false);
    reset();
  };

  const noActiveExercice = !loadingExercice && !activeExercice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Générer une déclaration TVA</DialogTitle>
          <DialogDescription>
            Créez une nouvelle déclaration fiscale incluant le Centime Additionnel
            {activeExercice && (
              <span className="block mt-1 text-primary">
                Exercice: {activeExercice.libelle_exercice}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {noActiveExercice && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Aucun exercice comptable ouvert. Veuillez créer ou ouvrir un exercice avant de générer une déclaration.
            </AlertDescription>
          </Alert>
        )}

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

            {/* Section TVA */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">TVA</h4>
                <Badge variant="outline">Taux standard</Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="tva_collectee" className="text-xs">TVA Collectée ({devise})</Label>
                  <Input
                    id="tva_collectee"
                    type="number"
                    step={getInputStep()}
                    className="h-9"
                    {...register('tva_collectee', { required: true, valueAsNumber: true })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tva_deductible" className="text-xs">TVA Déductible ({devise})</Label>
                  <Input
                    id="tva_deductible"
                    type="number"
                    step={getInputStep()}
                    className="h-9"
                    {...register('tva_deductible', { required: true, valueAsNumber: true })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tva_a_payer" className="text-xs">TVA à Payer ({devise})</Label>
                  <Input
                    id="tva_a_payer"
                    type="number"
                    step={getInputStep()}
                    className="h-9"
                    {...register('tva_a_payer', { required: true, valueAsNumber: true })}
                  />
                </div>
              </div>
              
              {vatSummary && (
                <p className="text-xs text-muted-foreground">
                  Valeurs calculées : Collectée {formatNumber(vatSummary.vatCollected || 0)} | 
                  Déductible {formatNumber(vatSummary.vatDeductible || 0)} | 
                  À payer {formatNumber(vatSummary.vatDue || 0)} {devise}
                </p>
              )}
            </div>

            <Separator />

            {/* Section Centime Additionnel */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Centime Additionnel</h4>
                <Badge variant="secondary">{centimeRate}% sur TVA</Badge>
              </div>
              
              <Alert className="py-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Calculé automatiquement à {centimeRate}% sur la TVA 
                  {regionalParams?.pays && ` (${regionalParams.pays})`}
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label className="text-xs text-muted-foreground">Centime Collecté ({devise})</Label>
                  <Input
                    type="text"
                    value={formatNumber(calculatedCentime.collecte)}
                    readOnly
                    className="h-9 bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs text-muted-foreground">Centime Déductible ({devise})</Label>
                  <Input
                    type="text"
                    value={formatNumber(calculatedCentime.deductible)}
                    readOnly
                    className="h-9 bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs text-muted-foreground">Centime à Payer ({devise})</Label>
                  <Input
                    type="text"
                    value={formatNumber(calculatedCentime.aPayer)}
                    readOnly
                    className="h-9 bg-muted"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Total général */}
            <div className="bg-primary/5 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total à Payer (TVA + Centime)</span>
                <span className="text-xl font-bold text-primary">
                  {formatNumber((Number(watch('tva_a_payer')) || 0) + calculatedCentime.aPayer)} {devise}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={noActiveExercice || loadingExercice}>
              {loadingExercice ? 'Chargement...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};