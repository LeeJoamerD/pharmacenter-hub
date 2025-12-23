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
import { useForm } from 'react-hook-form';
import { TVADeclaration, VATSummary } from '@/hooks/useFiscalManagement';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTenant } from '@/contexts/TenantContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface DeclarationTVADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<TVADeclaration, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => void;
  vatSummary?: VATSummary;
}

export const DeclarationTVADialog = ({ open, onOpenChange, onSave, vatSummary }: DeclarationTVADialogProps) => {
  const { currentCurrency } = useCurrency();
  const { tenantId } = useTenant();
  const devise = currentCurrency.code;
  
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

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      exercice_id: '',
      periode: new Date().toISOString().slice(0, 7),
      tva_collectee: vatSummary?.vatCollected || 0,
      tva_deductible: vatSummary?.vatDeductible || 0,
      tva_a_payer: vatSummary?.vatDue || 0,
      statut: 'En cours',
    },
  });

  // Mettre à jour exercice_id quand l'exercice actif est chargé
  useEffect(() => {
    if (activeExercice?.id) {
      setValue('exercice_id', activeExercice.id);
    }
  }, [activeExercice, setValue]);

  // Mettre à jour les valeurs TVA quand vatSummary change
  useEffect(() => {
    if (vatSummary) {
      setValue('tva_collectee', vatSummary.vatCollected || 0);
      setValue('tva_deductible', vatSummary.vatDeductible || 0);
      setValue('tva_a_payer', vatSummary.vatDue || 0);
    }
  }, [vatSummary, setValue]);

  const onSubmit = (data: any) => {
    // Convertir periode de YYYY-MM à YYYY-MM-01
    const formattedData = {
      ...data,
      periode: `${data.periode}-01`,
      exercice_id: activeExercice?.id || data.exercice_id,
    };
    onSave(formattedData);
    onOpenChange(false);
    reset();
  };

  const noActiveExercice = !loadingExercice && !activeExercice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Générer une déclaration TVA</DialogTitle>
          <DialogDescription>
            Créez une nouvelle déclaration fiscale
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
            <div className="grid gap-2">
              <Label htmlFor="tva_collectee">TVA Collectée ({devise})</Label>
              <Input
                id="tva_collectee"
                type="number"
                step="0.01"
                {...register('tva_collectee', { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tva_deductible">TVA Déductible ({devise})</Label>
              <Input
                id="tva_deductible"
                type="number"
                step="0.01"
                {...register('tva_deductible', { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tva_a_payer">TVA à Payer ({devise})</Label>
              <Input
                id="tva_a_payer"
                type="number"
                step="0.01"
                {...register('tva_a_payer', { required: true, valueAsNumber: true })}
              />
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