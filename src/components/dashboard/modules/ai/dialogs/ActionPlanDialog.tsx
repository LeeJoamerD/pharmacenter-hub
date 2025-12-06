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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Download, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import type { Bottleneck } from '@/hooks/useIntelligentDiagnostic';
import { generateActionPlanPDF } from '@/utils/diagnosticExportUtils';

interface ActionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bottlenecks: Bottleneck[];
  pharmacyName: string;
}

const ActionPlanDialog: React.FC<ActionPlanDialogProps> = ({
  open,
  onOpenChange,
  bottlenecks,
  pharmacyName
}) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-50/50';
      case 'medium': return 'border-l-orange-500 bg-orange-50/50';
      default: return 'border-l-green-500 bg-green-50/50';
    }
  };

  const handleExport = () => {
    generateActionPlanPDF(bottlenecks, pharmacyName);
  };

  // Sort by priority and filter those with actions
  const sortedBottlenecks = [...bottlenecks].sort((a, b) => a.priority - b.priority);
  const actionableCount = bottlenecks.filter(b => b.action_plan || b.recommended_solution).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Plan d'Action Global
          </DialogTitle>
          <DialogDescription>
            {actionableCount} actions planifiées sur {bottlenecks.length} goulots identifiés
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {sortedBottlenecks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun goulot d'étranglement identifié</p>
                <p className="text-sm">Lancez un diagnostic pour détecter les problèmes</p>
              </div>
            ) : (
              sortedBottlenecks.map((bottleneck, index) => (
                <div 
                  key={bottleneck.id} 
                  className={`p-4 border-l-4 rounded-r-lg ${getSeverityColor(bottleneck.severity)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(bottleneck.severity)}
                      <span className="font-semibold">{index + 1}. {bottleneck.area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Priorité {bottleneck.priority}
                      </Badge>
                      <Badge variant={bottleneck.status === 'resolved' ? 'default' : 'secondary'}>
                        {bottleneck.status === 'identified' ? 'Identifié' :
                         bottleneck.status === 'analyzing' ? 'En analyse' :
                         bottleneck.status === 'action_planned' ? 'Planifié' : 'Résolu'}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {bottleneck.description}
                  </p>

                  <div className="text-sm text-orange-700 mb-3">
                    <strong>Impact:</strong> {bottleneck.impact}
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-2">
                    {bottleneck.action_plan ? (
                      <div className="flex items-start gap-2 p-3 bg-green-100/50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-green-700 block mb-1">
                            Action Planifiée
                          </span>
                          <p className="text-sm text-green-800">{bottleneck.action_plan}</p>
                        </div>
                      </div>
                    ) : bottleneck.recommended_solution ? (
                      <div className="flex items-start gap-2 p-3 bg-blue-100/50 rounded-lg">
                        <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-blue-700 block mb-1">
                            Solution Recommandée
                          </span>
                          <p className="text-sm text-blue-800">{bottleneck.recommended_solution}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Aucune action planifiée - Analyse requise
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={handleExport} disabled={bottlenecks.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActionPlanDialog;
