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
import { Progress } from '@/components/ui/progress';
import { AIPredictionDisplay } from '@/services/AIReportsService';
import { CheckCircle, XCircle, AlertTriangle, Clock, Lightbulb } from 'lucide-react';

interface PredictionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prediction?: AIPredictionDisplay;
  onApply: (predictionId: string, source: string) => void;
  onDismiss: (predictionId: string, source: string) => void;
}

const PredictionDetailModal: React.FC<PredictionDetailModalProps> = ({
  open,
  onOpenChange,
  prediction,
  onApply,
  onDismiss
}) => {
  if (!prediction) return null;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'medium':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'low':
        return 'bg-info/10 text-info border-info/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'medium':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Lightbulb className="h-5 w-5 text-info" />;
    }
  };

  const handleApply = () => {
    onApply(prediction.id, prediction.source || '');
    onOpenChange(false);
  };

  const handleDismiss = () => {
    onDismiss(prediction.id, prediction.source || '');
    onOpenChange(false);
  };

  const isActionable = prediction.status !== 'applied' && prediction.status !== 'dismissed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getImpactIcon(prediction.impact)}
            {prediction.title}
          </DialogTitle>
          <DialogDescription>
            Détails de la prédiction et recommandations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* En-tête avec badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{prediction.type}</Badge>
            <Badge className={getImpactColor(prediction.impact)}>
              Impact: {prediction.impact}
            </Badge>
            {prediction.status && (
              <Badge variant="secondary">
                {prediction.status === 'applied' ? 'Appliquée' : 
                 prediction.status === 'dismissed' ? 'Ignorée' : 'En attente'}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">{prediction.description}</p>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Niveau de confiance</span>
              <div className="flex items-center gap-2">
                <Progress value={prediction.confidence} className="flex-1 h-2" />
                <span className="text-sm font-medium">{prediction.confidence}%</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Échéance</span>
              <p className="font-medium">{prediction.timeframe}</p>
            </div>
          </div>

          {/* Recommandation */}
          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Recommandation</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {prediction.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Source */}
          {prediction.source && (
            <div className="text-xs text-muted-foreground">
              Source: {prediction.source.replace('ai_', '').replace(/_/g, ' ')}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {isActionable && (
            <>
              <Button variant="outline" onClick={handleDismiss}>
                <XCircle className="h-4 w-4 mr-2" />
                Ignorer
              </Button>
              <Button onClick={handleApply}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PredictionDetailModal;
