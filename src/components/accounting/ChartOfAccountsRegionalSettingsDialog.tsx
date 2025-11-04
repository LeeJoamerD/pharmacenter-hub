import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen, Coins, BarChart3, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ChartOfAccountsRegionalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCountry?: string;
}

const countryConfigs = {
  CG: { 
    name: 'Congo-Brazzaville', 
    flag: '🇨🇬', 
    system: 'OHADA', 
    version: 'OHADA 2017',
    classes: 7,
    currency: 'XAF',
    description: 'Système OHADA - CEMAC'
  },
  CM: { 
    name: 'Cameroun', 
    flag: '🇨🇲', 
    system: 'SYSCOHADA', 
    version: 'SYSCOHADA Révisé 2017',
    classes: 7,
    currency: 'XAF',
    description: 'Système SYSCOHADA - CEMAC'
  },
  SN: { 
    name: 'Sénégal', 
    flag: '🇸🇳', 
    system: 'SYSCOHADA', 
    version: 'SYSCOHADA Révisé 2017',
    classes: 7,
    currency: 'XOF',
    description: 'Système SYSCOHADA - UEMOA'
  },
  CI: { 
    name: 'Côte d\'Ivoire', 
    flag: '🇨🇮', 
    system: 'SYSCOHADA', 
    version: 'SYSCOHADA Révisé 2017',
    classes: 7,
    currency: 'XOF',
    description: 'Système SYSCOHADA - UEMOA'
  },
  FR: { 
    name: 'France', 
    flag: '🇫🇷', 
    system: 'PCG', 
    version: 'PCG 2014 (ANC)',
    classes: 8,
    currency: 'EUR',
    description: 'Plan Comptable Général'
  },
  BE: { 
    name: 'Belgique', 
    flag: '🇧🇪', 
    system: 'PCMN', 
    version: 'PCMN 2019',
    classes: 8,
    currency: 'EUR',
    description: 'Plan Comptable Minimum Normalisé'
  },
};

export function ChartOfAccountsRegionalSettingsDialog({ 
  open, 
  onOpenChange, 
  currentCountry 
}: ChartOfAccountsRegionalSettingsDialogProps) {
  const [selectedCountry, setSelectedCountry] = useState(currentCountry || 'CG');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const onSubmit = async () => {
    if (!tenantId) {
      toast({
        title: 'Erreur',
        description: 'Tenant non identifié',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase.rpc('init_coa_params_for_tenant', {
        p_tenant_id: tenantId,
        p_country_code: selectedCountry,
      });
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['coa-regional-params'] });
      
      toast({ 
        title: 'Succès',
        description: `Configuration du plan comptable ${countryConfigs[selectedCountry as keyof typeof countryConfigs].system} appliquée` 
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erreur configuration régionale:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour de la configuration',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedConfig = countryConfigs[selectedCountry as keyof typeof countryConfigs];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paramètres Régionaux - Plan Comptable</DialogTitle>
          <DialogDescription>
            Sélectionnez le pays pour adapter automatiquement le système comptable, 
            la structure des classes et les règles de validation
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {Object.entries(countryConfigs).map(([code, config]) => (
            <Card 
              key={code}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedCountry === code ? 'ring-2 ring-primary shadow-md' : ''
              }`}
              onClick={() => setSelectedCountry(code)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <span className="text-5xl">{config.flag}</span>
                  <div>
                    <h3 className="font-bold text-base mb-1">{config.name}</h3>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>{config.system}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Coins className="h-3 w-3" />
                        <span>{config.currency}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        <span>{config.classes} classes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedConfig && (
          <Card className="mt-4 bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-2xl">{selectedConfig.flag}</span>
                Configuration pour {selectedConfig.name}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Système comptable:</span>
                  <span className="font-medium">{selectedConfig.system}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="font-medium">{selectedConfig.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Devise:</span>
                  <span className="font-medium">{selectedConfig.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre de classes:</span>
                  <span className="font-medium">{selectedConfig.classes} classes comptables</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-medium">{selectedConfig.description}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription>
            Le changement de système comptable peut nécessiter une réorganisation 
            de votre plan de comptes existant. Cette action est recommandée lors 
            de l'initialisation uniquement.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Application...' : `Appliquer la configuration ${selectedConfig.system}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
