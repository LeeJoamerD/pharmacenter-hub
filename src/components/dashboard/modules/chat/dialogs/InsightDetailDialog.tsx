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
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  Target,
  Building2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AIInsight } from '@/hooks/useNetworkConversationalAI';

interface InsightDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insight: AIInsight | null;
  pharmacies: { id: string; name: string }[];
  onApply: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

const InsightDetailDialog = ({
  open,
  onOpenChange,
  insight,
  pharmacies,
  onApply,
  onDismiss,
}: InsightDetailDialogProps) => {
  if (!insight) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'alert': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'optimization': return <Target className="h-5 w-5 text-green-500" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recommendation': return 'Recommandation';
      case 'alert': return 'Alerte';
      case 'trend': return 'Tendance';
      case 'optimization': return 'Optimisation';
      default: return type;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'critical': return 'Critique';
      case 'high': return 'Élevé';
      case 'medium': return 'Moyen';
      case 'low': return 'Faible';
      default: return impact;
    }
  };

  const affectedPharmacyNames = insight.pharmacies_affected
    ?.map(id => pharmacies.find(p => p.id === id)?.name || 'Pharmacie inconnue')
    || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(insight.type)}
            {insight.title}
          </DialogTitle>
          <DialogDescription>
            Insight généré par l'IA le{' '}
            {format(new Date(insight.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{getTypeLabel(insight.type)}</Badge>
            <Badge className={getImpactColor(insight.impact)}>
              Impact: {getImpactLabel(insight.impact)}
            </Badge>
            {insight.is_applied && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Appliqué
              </Badge>
            )}
            {!insight.is_applied && insight.is_read && (
              <Badge variant="secondary">Lu</Badge>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </div>

          {/* Confidence score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Score de confiance</h4>
              <span className="text-sm font-medium">
                {Math.round(insight.confidence * 100)}%
              </span>
            </div>
            <Progress value={insight.confidence * 100} className="h-2" />
          </div>

          {/* Affected pharmacies */}
          {affectedPharmacyNames.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Pharmacies concernées ({affectedPharmacyNames.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {affectedPharmacyNames.map((name, idx) => (
                  <Badge key={idx} variant="outline">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Applied info */}
          {insight.is_applied && insight.applied_at && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Insight appliqué</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                Appliqué le {format(new Date(insight.applied_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
          )}

          {/* Action required */}
          {!insight.is_applied && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Action requise</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                Cet insight n'a pas encore été traité. Appliquez-le pour améliorer vos performances.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!insight.is_applied && (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  onDismiss(insight.id);
                  onOpenChange(false);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Ignorer
              </Button>
              <Button 
                onClick={() => {
                  onApply(insight.id);
                  onOpenChange(false);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
            </>
          )}
          {insight.is_applied && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InsightDetailDialog;
