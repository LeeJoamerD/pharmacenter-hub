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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CheckCircle, 
  Eye, 
  Trash2, 
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Bell
} from 'lucide-react';
import type { AIInsightSummary } from '@/hooks/useAIDashboard';

interface AIDashboardInsightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insight: AIInsightSummary | null;
  onMarkAsRead: (id: string) => void;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
}

export const AIDashboardInsightDialog: React.FC<AIDashboardInsightDialogProps> = ({
  open,
  onOpenChange,
  insight,
  onMarkAsRead,
  onApply,
  onDismiss
}) => {
  if (!insight) return null;

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'prediction':
      case 'prédiction':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'recommendation':
      case 'recommandation':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'anomaly':
      case 'anomalie':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'alert':
      case 'alerte':
        return <Bell className="h-5 w-5 text-red-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-primary" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    const labels: Record<string, string> = {
      critical: 'Critique',
      high: 'Élevé',
      medium: 'Moyen',
      low: 'Faible'
    };
    return (
      <Badge className={colors[impact] || colors.medium}>
        {labels[impact] || impact}
      </Badge>
    );
  };

  const handleApply = () => {
    onApply(insight.id);
    onOpenChange(false);
  };

  const handleDismiss = () => {
    onDismiss(insight.id);
    onOpenChange(false);
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(insight.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getTypeIcon(insight.type)}
            <div>
              <DialogTitle>{insight.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {format(new Date(insight.timestamp), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{insight.type}</Badge>
            {getImpactBadge(insight.impact)}
            {insight.isApplied && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Appliqué
              </Badge>
            )}
            {insight.isRead && !insight.isApplied && (
              <Badge variant="secondary">
                <Eye className="h-3 w-3 mr-1" />
                Lu
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Description</h4>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Niveau de confiance</span>
              <span className="text-sm font-bold">{insight.confidence}%</span>
            </div>
            <Progress value={insight.confidence} className="h-2" />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!insight.isRead && (
            <Button variant="outline" onClick={handleMarkAsRead}>
              <Eye className="h-4 w-4 mr-2" />
              Marquer comme lu
            </Button>
          )}
          {!insight.isApplied && (
            <Button onClick={handleApply}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Appliquer
            </Button>
          )}
          <Button variant="destructive" onClick={handleDismiss}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIDashboardInsightDialog;
