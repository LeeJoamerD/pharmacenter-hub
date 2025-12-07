import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, TrendingUp, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProcessOptimization } from '@/hooks/useBusinessIntelligence';

interface OptimizationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optimization: ProcessOptimization | null;
  onImplement: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export const OptimizationDetailDialog: React.FC<OptimizationDetailDialogProps> = ({
  open,
  onOpenChange,
  optimization,
  onImplement,
  onReject
}) => {
  const [notes, setNotes] = useState('');
  const [implementing, setImplementing] = useState(false);

  if (!optimization) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Facile': return 'bg-green-100 text-green-700';
      case 'Moyen': return 'bg-orange-100 text-orange-700';
      default: return 'bg-red-100 text-red-700';
    }
  };

  const getROIColor = (roi: string) => {
    switch (roi) {
      case 'Élevé': return 'text-green-600';
      case 'Moyen': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented':
        return <Badge className="bg-green-100 text-green-700">Implémenté</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Rejeté</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">En cours</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">En attente</Badge>;
    }
  };

  const handleImplement = async () => {
    setImplementing(true);
    try {
      await onImplement(optimization.id, notes);
      onOpenChange(false);
    } finally {
      setImplementing(false);
    }
  };

  const handleReject = async () => {
    await onReject(optimization.id);
    onOpenChange(false);
  };

  const timeSaved = optimization.current_time_minutes - optimization.optimized_time_minutes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            {optimization.process_name}
          </DialogTitle>
          <DialogDescription>
            Opportunité d'optimisation de processus
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Statut</span>
            {getStatusBadge(optimization.status)}
          </div>

          {/* Time Comparison */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-1 text-red-500" />
                <div className="text-2xl font-bold">{optimization.current_time_minutes}</div>
                <div className="text-xs text-muted-foreground">min actuelles</div>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-1 text-green-500" />
                <div className="text-2xl font-bold">{optimization.optimized_time_minutes}</div>
                <div className="text-xs text-muted-foreground">min optimisées</div>
              </div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <span className="text-green-700 font-medium">
                -{timeSaved} minutes ({optimization.improvement_percentage}% d'amélioration)
              </span>
            </div>
          </div>

          {/* Improvement Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Potentiel d'amélioration</span>
              <span className="font-medium">{optimization.improvement_percentage}%</span>
            </div>
            <Progress value={optimization.improvement_percentage} className="h-2" />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <Badge className={getDifficultyColor(optimization.difficulty)}>
                {optimization.difficulty}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Difficulté</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <TrendingUp className={`h-5 w-5 mx-auto ${getROIColor(optimization.roi)}`} />
              <div className={`font-medium ${getROIColor(optimization.roi)}`}>
                ROI {optimization.roi}
              </div>
            </div>
          </div>

          {/* Implementation Notes */}
          {optimization.status === 'pending' && (
            <div className="space-y-2">
              <Label>Notes d'implémentation (optionnel)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Décrivez comment vous prévoyez d'implémenter cette optimisation..."
                rows={3}
              />
            </div>
          )}

          {/* Existing Notes */}
          {optimization.implementation_notes && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Label className="text-blue-700">Notes d'implémentation</Label>
              <p className="text-sm text-blue-800 mt-1">{optimization.implementation_notes}</p>
            </div>
          )}

          {/* Implementation Date */}
          {optimization.implemented_at && (
            <div className="text-sm text-muted-foreground">
              Implémenté le {format(new Date(optimization.implemented_at), 'dd MMMM yyyy', { locale: fr })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {optimization.status === 'pending' && (
            <>
              <Button variant="outline" onClick={handleReject}>
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
              <Button onClick={handleImplement} disabled={implementing}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {implementing ? 'Implémentation...' : 'Implémenter'}
              </Button>
            </>
          )}
          {optimization.status !== 'pending' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
