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
import { Lightbulb, Zap, CheckCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BusinessPattern } from '@/hooks/useBusinessIntelligence';

interface PatternDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pattern: BusinessPattern | null;
  onExploit: (patternId: string) => Promise<void>;
  onDelete: (patternId: string) => Promise<void>;
}

export const PatternDetailDialog: React.FC<PatternDetailDialogProps> = ({
  open,
  onOpenChange,
  pattern,
  onExploit,
  onDelete
}) => {
  if (!pattern) return null;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Élevé': return 'bg-red-100 text-red-700';
      case 'Moyen': return 'bg-orange-100 text-orange-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const handleExploit = async () => {
    await onExploit(pattern.id);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await onDelete(pattern.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            {pattern.pattern_name}
          </DialogTitle>
          <DialogDescription>
            Découvert par: {pattern.discovery_method}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">{pattern.description || 'Aucune description disponible'}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{pattern.confidence}%</div>
              <div className="text-xs text-muted-foreground">Confiance</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Badge className={getImpactColor(pattern.impact)}>{pattern.impact}</Badge>
              <div className="text-xs text-muted-foreground mt-1">Impact</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-sm font-medium">{pattern.frequency}</div>
              <div className="text-xs text-muted-foreground">Fréquence</div>
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Niveau de confiance</span>
              <span className="font-medium">{pattern.confidence}%</span>
            </div>
            <Progress value={pattern.confidence} className="h-2" />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {pattern.is_exploited ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Zap className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                {pattern.is_exploited ? 'Pattern Exploité' : 'En attente d\'exploitation'}
              </span>
            </div>
            {pattern.exploited_at && (
              <span className="text-sm text-muted-foreground">
                {format(new Date(pattern.exploited_at), 'dd/MM/yyyy', { locale: fr })}
              </span>
            )}
          </div>

          {/* Actionable indicator */}
          {pattern.is_actionable && !pattern.is_exploited && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚡ Ce pattern est actionnable et peut être exploité pour améliorer les performances.
              </p>
            </div>
          )}

          {/* Created date */}
          <div className="text-sm text-muted-foreground">
            Découvert le {format(new Date(pattern.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
          {pattern.is_actionable && !pattern.is_exploited && (
            <Button onClick={handleExploit}>
              <Zap className="h-4 w-4 mr-2" />
              Exploiter ce Pattern
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
