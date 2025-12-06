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
  TrendingUp, 
  TrendingDown,
  Activity,
  Zap,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { NetworkInsight } from '@/hooks/useNetworkAdvancedAnalytics';

interface AnalyticsInsightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insight: NetworkInsight | null;
  pharmacies: { id: string; name: string }[];
  onApply: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

const AnalyticsInsightDialog = ({
  open,
  onOpenChange,
  insight,
  pharmacies,
  onApply,
  onDismiss,
}: AnalyticsInsightDialogProps) => {
  if (!insight) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Activity className="h-5 w-5 text-blue-500" />;
      case 'usage': return <Users className="h-5 w-5 text-green-500" />;
      case 'efficiency': return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'growth': return <TrendingUp className="h-5 w-5 text-purple-500" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'performance': return 'Performance';
      case 'usage': return 'Utilisation';
      case 'efficiency': return 'Efficacité';
      case 'growth': return 'Croissance';
      default: return type;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      case 'neutral': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'positive': return 'Positif';
      case 'negative': return 'Négatif';
      case 'neutral': return 'Neutre';
      default: return impact;
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'negative': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'neutral': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const affectedPharmacyNames = insight.pharmacies_involved
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
            Insight généré le{' '}
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </div>

          {/* Metric change */}
          {insight.metric_change !== null && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Variation de la métrique</span>
                <div className="flex items-center gap-2">
                  {insight.metric_change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-bold ${insight.metric_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {insight.metric_change > 0 ? '+' : ''}{insight.metric_change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

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
                <Users className="h-4 w-4" />
                Officines concernées ({affectedPharmacyNames.length})
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
                Cet insight n'a pas encore été traité. Appliquez-le pour améliorer vos performances réseau.
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

export default AnalyticsInsightDialog;
