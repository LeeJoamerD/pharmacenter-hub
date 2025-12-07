import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { LearningFeedback } from '@/hooks/useContinuousLearning';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface FeedbackImpactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: LearningFeedback | null;
  onApply?: (feedbackId: string) => void;
}

export function FeedbackImpactDialog({
  open,
  onOpenChange,
  feedback,
  onApply
}: FeedbackImpactDialogProps) {
  if (!feedback) return null;

  const getFeedbackColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'mixed': return 'bg-orange-100 text-orange-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeedbackLabel = (type: string) => {
    const labels: Record<string, string> = {
      positive: 'Positif',
      mixed: 'Mitigé',
      negative: 'Négatif'
    };
    return labels[type] || type;
  };

  // Simulated impact analysis
  const impactAnalysis = {
    estimatedAccuracyChange: feedback.feedback_type === 'positive' ? 0.5 : 
                              feedback.feedback_type === 'negative' ? -0.3 : 0.1,
    affectedDataPoints: Math.floor(Math.random() * 1000) + 500,
    confidence: Math.floor(Math.random() * 20) + 75,
    recommendations: [
      feedback.feedback_type === 'positive' 
        ? 'Renforcer les poids des features similaires'
        : 'Ajuster les seuils de décision',
      'Ajouter des exemples similaires au dataset',
      'Recalibrer le modèle avec les nouvelles données'
    ]
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analyse d'Impact
          </DialogTitle>
          <DialogDescription>
            Impact estimé du feedback sur le modèle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feedback Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium">{feedback.model_name || 'Modèle général'}</h4>
                <p className="text-sm text-muted-foreground">
                  Par {feedback.user_name} • {format(new Date(feedback.created_at), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
              <Badge className={getFeedbackColor(feedback.feedback_type)}>
                {getFeedbackLabel(feedback.feedback_type)}
              </Badge>
            </div>
            <p className="text-sm italic">"{feedback.comment}"</p>
          </div>

          <Separator />

          {/* Impact Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {impactAnalysis.estimatedAccuracyChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">Changement estimé</span>
              </div>
              <p className={`text-xl font-bold ${impactAnalysis.estimatedAccuracyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {impactAnalysis.estimatedAccuracyChange >= 0 ? '+' : ''}{impactAnalysis.estimatedAccuracyChange}%
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Données affectées</span>
              </div>
              <p className="text-xl font-bold">{impactAnalysis.affectedDataPoints.toLocaleString()}</p>
            </div>
          </div>

          {/* Confidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confiance de l'analyse</span>
              <span className="font-medium">{impactAnalysis.confidence}%</span>
            </div>
            <Progress value={impactAnalysis.confidence} />
          </div>

          <Separator />

          {/* Recommendations */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Recommandations
            </h4>
            <ul className="space-y-2">
              {impactAnalysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          {feedback.impact_applied && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Feedback intégré le {feedback.impact_applied_at 
                    ? format(new Date(feedback.impact_applied_at), 'dd/MM/yyyy', { locale: fr })
                    : '-'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {!feedback.impact_applied && onApply && (
            <Button onClick={() => onApply(feedback.id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Appliquer le feedback
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
