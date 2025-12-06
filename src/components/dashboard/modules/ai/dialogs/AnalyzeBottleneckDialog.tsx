import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  Target,
  ArrowRight,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Bottleneck } from '@/hooks/useIntelligentDiagnostic';

interface AnalyzeBottleneckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bottleneck: Bottleneck | null;
  onAnalyze: (id: string) => Promise<boolean>;
  onPlanAction: (id: string, actionPlan: string) => Promise<boolean>;
  onResolve: (id: string) => Promise<boolean>;
}

const AnalyzeBottleneckDialog: React.FC<AnalyzeBottleneckDialogProps> = ({
  open,
  onOpenChange,
  bottleneck,
  onAnalyze,
  onPlanAction,
  onResolve
}) => {
  const [actionPlan, setActionPlan] = useState('');
  const [loading, setLoading] = useState(false);

  if (!bottleneck) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium': return <Eye className="h-4 w-4 text-orange-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'identified': return 'Identifié';
      case 'analyzing': return 'En analyse';
      case 'action_planned': return 'Action planifiée';
      case 'resolved': return 'Résolu';
      default: return status;
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    await onAnalyze(bottleneck.id);
    setLoading(false);
  };

  const handlePlanAction = async () => {
    if (!actionPlan.trim()) return;
    setLoading(true);
    const success = await onPlanAction(bottleneck.id, actionPlan);
    if (success) {
      setActionPlan('');
    }
    setLoading(false);
  };

  const handleResolve = async () => {
    setLoading(true);
    const success = await onResolve(bottleneck.id);
    if (success) {
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Analyse du Goulot d'Étranglement
          </DialogTitle>
          <DialogDescription>
            Analysez le goulot et planifiez les actions correctives
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getSeverityIcon(bottleneck.severity)}
                <h3 className="text-lg font-semibold">{bottleneck.area}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getSeverityColor(bottleneck.severity)}>
                  {bottleneck.severity === 'high' ? 'Sévérité Élevée' : 
                   bottleneck.severity === 'medium' ? 'Sévérité Moyenne' : 'Sévérité Faible'}
                </Badge>
                <Badge variant="outline">Priorité {bottleneck.priority}</Badge>
                <Badge variant="secondary">{getStatusLabel(bottleneck.status)}</Badge>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(bottleneck.created_at), 'dd/MM/yyyy', { locale: fr })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description du problème</Label>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{bottleneck.description}</p>
            </div>
          </div>

          {/* Impact */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Impact</Label>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">{bottleneck.impact}</p>
            </div>
          </div>

          {/* Recommended Solution */}
          {bottleneck.recommended_solution && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Solution Recommandée par l'IA</Label>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">{bottleneck.recommended_solution}</p>
                </div>
              </div>
            </div>
          )}

          {/* Existing Action Plan */}
          {bottleneck.action_plan && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Plan d'Action Défini
              </Label>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{bottleneck.action_plan}</p>
                {bottleneck.action_planned_at && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                    <User className="h-3 w-3" />
                    Planifié le {format(new Date(bottleneck.action_planned_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Plan Input */}
          {bottleneck.status !== 'resolved' && (
            <div className="space-y-2">
              <Label htmlFor="action-plan">
                {bottleneck.action_plan ? 'Modifier le plan d\'action' : 'Définir un plan d\'action'}
              </Label>
              <Textarea
                id="action-plan"
                placeholder="Décrivez les actions à entreprendre pour résoudre ce goulot..."
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Status Flow */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium mb-3 block">Progression</Label>
            <div className="flex items-center justify-between">
              {['identified', 'analyzing', 'action_planned', 'resolved'].map((status, index) => (
                <React.Fragment key={status}>
                  <div className={`flex flex-col items-center ${
                    bottleneck.status === status ? 'text-primary' : 
                    ['identified', 'analyzing', 'action_planned', 'resolved'].indexOf(bottleneck.status) > index ? 
                    'text-green-600' : 'text-muted-foreground'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      bottleneck.status === status ? 'bg-primary text-primary-foreground' :
                      ['identified', 'analyzing', 'action_planned', 'resolved'].indexOf(bottleneck.status) > index ?
                      'bg-green-100' : 'bg-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-xs mt-1">{getStatusLabel(status)}</span>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>

          {bottleneck.status === 'identified' && (
            <Button
              variant="secondary"
              onClick={handleAnalyze}
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-2" />
              Démarrer Analyse
            </Button>
          )}

          {(bottleneck.status === 'analyzing' || bottleneck.status === 'action_planned') && (
            <>
              <Button
                variant="secondary"
                onClick={handlePlanAction}
                disabled={loading || !actionPlan.trim()}
              >
                <Target className="h-4 w-4 mr-2" />
                {bottleneck.action_plan ? 'Mettre à jour' : 'Planifier Action'}
              </Button>
              {bottleneck.status === 'action_planned' && (
                <Button
                  onClick={handleResolve}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer Résolu
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnalyzeBottleneckDialog;
