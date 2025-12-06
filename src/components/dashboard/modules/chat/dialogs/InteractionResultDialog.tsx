import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, Info, Zap, FileText } from 'lucide-react';
import type { DrugInteraction } from '@/hooks/useNetworkPharmaTools';

interface InteractionResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drug1Name: string;
  drug2Name: string;
  interactions: DrugInteraction[];
}

export const InteractionResultDialog: React.FC<InteractionResultDialogProps> = ({
  open,
  onOpenChange,
  drug1Name,
  drug2Name,
  interactions
}) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'contraindicated':
        return { 
          color: 'bg-red-600', 
          textColor: 'text-red-600',
          label: 'Contre-indiqué', 
          icon: AlertTriangle,
          bgLight: 'bg-red-50 dark:bg-red-950'
        };
      case 'major':
        return { 
          color: 'bg-red-500', 
          textColor: 'text-red-500',
          label: 'Majeure', 
          icon: AlertTriangle,
          bgLight: 'bg-red-50 dark:bg-red-950'
        };
      case 'moderate':
        return { 
          color: 'bg-orange-500', 
          textColor: 'text-orange-500',
          label: 'Modérée', 
          icon: AlertTriangle,
          bgLight: 'bg-orange-50 dark:bg-orange-950'
        };
      case 'minor':
        return { 
          color: 'bg-blue-500', 
          textColor: 'text-blue-500',
          label: 'Mineure', 
          icon: Info,
          bgLight: 'bg-blue-50 dark:bg-blue-950'
        };
      default:
        return { 
          color: 'bg-gray-500', 
          textColor: 'text-gray-500',
          label: severity, 
          icon: Info,
          bgLight: 'bg-gray-50 dark:bg-gray-950'
        };
    }
  };

  const hasInteractions = interactions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Résultat de la vérification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Médicaments vérifiés */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Médicaments analysés :</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{drug1Name}</Badge>
              <span className="text-muted-foreground">+</span>
              <Badge variant="outline">{drug2Name}</Badge>
            </div>
          </div>

          {!hasInteractions ? (
            <div className="p-6 text-center bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-medium text-green-700 dark:text-green-300">
                Aucune interaction connue
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Ces médicaments ne présentent pas d'interaction documentée dans notre base de données.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Cela ne garantit pas l'absence totale de risque. Consultez toujours les RCP et les sources officielles.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-4">
                {interactions.map((interaction) => {
                  const config = getSeverityConfig(interaction.severity);
                  const IconComponent = config.icon;
                  
                  return (
                    <div key={interaction.id} className={`p-4 rounded-lg border ${config.bgLight}`}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {interaction.drug1_name} + {interaction.drug2_name}
                            </h4>
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                          </div>
                          {interaction.is_network_shared && (
                            <span className="text-xs text-muted-foreground">
                              Partagé par le réseau
                            </span>
                          )}
                        </div>
                      </div>

                      {interaction.mechanism && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">Mécanisme :</p>
                          <p className="text-sm text-muted-foreground">{interaction.mechanism}</p>
                        </div>
                      )}

                      {interaction.clinical_effect && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">Effet clinique :</p>
                          <p className="text-sm text-muted-foreground">{interaction.clinical_effect}</p>
                        </div>
                      )}

                      {interaction.management && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">Conduite à tenir :</p>
                          <p className="text-sm text-muted-foreground">{interaction.management}</p>
                        </div>
                      )}

                      {interaction.source_references && interaction.source_references.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Sources : {interaction.source_references.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InteractionResultDialog;
