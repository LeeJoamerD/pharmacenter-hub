import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { LearningModel, TrainingSession } from '@/hooks/useContinuousLearning';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Brain, 
  Clock, 
  Database, 
  TrendingUp,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface LearningModelDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: LearningModel | null;
  sessions?: TrainingSession[];
  onStartTraining?: (modelId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'training': return 'bg-blue-100 text-blue-800';
    case 'active': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-orange-100 text-orange-800';
    case 'error': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    training: 'En formation',
    active: 'Actif',
    pending: 'En attente',
    error: 'Erreur',
    archived: 'Archivé'
  };
  return labels[status] || status;
};

export function LearningModelDetailDialog({
  open,
  onOpenChange,
  model,
  sessions = [],
  onStartTraining
}: LearningModelDetailDialogProps) {
  if (!model) return null;

  const modelSessions = sessions.filter(s => s.model_id === model.id).slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {model.name}
          </DialogTitle>
          <DialogDescription>
            Détails et historique du modèle d'apprentissage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Progress */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(model.status)}>
              {getStatusLabel(model.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">Version {model.version}</span>
          </div>

          {model.status === 'training' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{model.progress}%</span>
              </div>
              <Progress value={model.progress} />
              <p className="text-xs text-muted-foreground">
                Époque {model.current_epoch} / {model.epochs}
              </p>
            </div>
          )}

          <Separator />

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Précision
              </div>
              <p className="text-2xl font-bold">{model.accuracy}%</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                Points de données
              </div>
              <p className="text-2xl font-bold">{model.data_points.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Dernière formation
              </div>
              <p className="text-sm font-medium">
                {model.last_training_at 
                  ? format(new Date(model.last_training_at), 'dd MMM yyyy HH:mm', { locale: fr })
                  : 'Jamais'
                }
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Prochaine formation
              </div>
              <p className="text-sm font-medium">
                {model.next_training_at 
                  ? format(new Date(model.next_training_at), 'dd MMM yyyy', { locale: fr })
                  : 'Non planifiée'
                }
              </p>
            </div>
          </div>

          <Separator />

          {/* Configuration */}
          <div>
            <h4 className="font-medium mb-3">Configuration</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>Type</span>
                <span className="font-medium">{model.model_type}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>Fréquence</span>
                <span className="font-medium">{model.training_frequency}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>Epochs max</span>
                <span className="font-medium">{model.epochs}</span>
              </div>
            </div>
          </div>

          {/* Training History */}
          {modelSessions.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Historique des formations</h4>
                <div className="space-y-2">
                  {modelSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center gap-2">
                        {session.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : session.status === 'failed' ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <RefreshCw className="h-4 w-4 text-blue-500" />
                        )}
                        <span>
                          {session.started_at 
                            ? format(new Date(session.started_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                            : '-'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {session.accuracy_gain && (
                          <span className="text-green-600">+{session.accuracy_gain}%</span>
                        )}
                        <span className="text-muted-foreground">
                          {session.training_time_seconds 
                            ? `${Math.round(session.training_time_seconds / 60)}min`
                            : '-'
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            {model.status !== 'training' && onStartTraining && (
              <Button onClick={() => onStartTraining(model.id)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Lancer formation
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
