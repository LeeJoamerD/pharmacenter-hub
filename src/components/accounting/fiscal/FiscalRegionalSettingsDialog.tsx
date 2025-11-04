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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Globe, Coins, Calendar, BookOpen } from 'lucide-react';

interface FiscalRegionalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCountry?: string;
}

const countryConfigs = {
  CG: {
    name: 'Congo-Brazzaville',
    flag: '🇨🇬',
    currency: 'XAF',
    vat: '18%',
    frequency: 'Mensuelle',
    system: 'OHADA',
  },
  CM: {
    name: 'Cameroun',
    flag: '🇨🇲',
    currency: 'XAF',
    vat: '19.25%',
    frequency: 'Mensuelle',
    system: 'OHADA',
  },
  SN: {
    name: 'Sénégal',
    flag: '🇸🇳',
    currency: 'XOF',
    vat: '18%',
    frequency: 'Mensuelle',
    system: 'OHADA',
  },
  CI: {
    name: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    currency: 'XOF',
    vat: '18%',
    frequency: 'Mensuelle',
    system: 'OHADA',
  },
  FR: {
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    vat: '20%',
    frequency: 'Trimestrielle',
    system: 'PCG',
  },
  BE: {
    name: 'Belgique',
    flag: '🇧🇪',
    currency: 'EUR',
    vat: '21%',
    frequency: 'Mensuelle',
    system: 'PCMN',
  },
};

export const FiscalRegionalSettingsDialog = ({ open, onOpenChange, currentCountry }: FiscalRegionalSettingsDialogProps) => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const { control, watch, handleSubmit } = useForm({
    defaultValues: {
      code_pays: currentCountry || 'CG',
    },
  });

  const selectedCountry = watch('code_pays');
  const config = countryConfigs[selectedCountry as keyof typeof countryConfigs];

  const onSubmit = async (data: { code_pays: string }) => {
    try {
      const { error } = await supabase.rpc('init_fiscal_params_for_tenant', {
        p_tenant_id: tenantId,
        p_country_code: data.code_pays,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['parametres_regionaux_fiscaux', tenantId] });
      toast.success('Configuration régionale mise à jour');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating regional settings:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configuration Régionale Fiscale</DialogTitle>
          <DialogDescription>
            Sélectionnez le pays pour adapter automatiquement les paramètres fiscaux (TVA, devise, système comptable)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code_pays">Pays</Label>
              <Controller
                name="code_pays"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(countryConfigs).map(([code, config]) => (
                        <SelectItem key={code} value={code}>
                          {config.flag} {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {config && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">{config.flag}</span>
                    {config.name}
                  </CardTitle>
                  <CardDescription>Aperçu de la configuration</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Devise</span>
                    </div>
                    <Badge variant="outline">{config.currency}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">TVA Standard</span>
                    </div>
                    <Badge variant="outline">{config.vat}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Fréquence Déclaration</span>
                    </div>
                    <Badge variant="outline">{config.frequency}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Système Comptable</span>
                    </div>
                    <Badge variant="outline">{config.system}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
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
