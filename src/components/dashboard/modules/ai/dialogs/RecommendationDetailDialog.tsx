import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Lightbulb,
  Calendar,
  TrendingUp,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { StrategicRecommendation } from '@/hooks/useStrategicRecommendations';

interface RecommendationDetailDialogProps {
  recommendation: StrategicRecommendation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImplement: (id: string) => void;
  onReject: (id: string) => void;
  onSchedule: (id: string) => void;
}

const RecommendationDetailDialog: React.FC<RecommendationDetailDialogProps> = ({
  recommendation,
  open,
  onOpenChange,
  onImplement,
  onReject,
  onSchedule
}) => {
  if (!recommendation) return null;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'bg-red-50 text-red-600';
      case 'medium': return 'bg-orange-50 text-orange-600';
      case 'low': return 'bg-green-50 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Lightbulb className="h-5 w-5 text-blue-600" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-orange-600" />;
      case 'scheduled': return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'implemented': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Target className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nouvelle';
      case 'in-progress': return 'En cours';
      case 'scheduled': return 'Programmée';
      case 'implemented': return 'Implémentée';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(recommendation.status)}
            <div>
              <DialogTitle className="text-xl">{recommendation.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{recommendation.category}</Badge>
                <Badge className={getImpactColor(recommendation.impact)}>
                  Impact {recommendation.impact === 'high' ? 'Élevé' : 
                          recommendation.impact === 'medium' ? 'Moyen' : 'Faible'}
                </Badge>
                <Badge className={getEffortColor(recommendation.effort)}>
                  Effort {recommendation.effort === 'high' ? 'Élevé' : 
                         recommendation.effort === 'medium' ? 'Moyen' : 'Faible'}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          <div>
            <p className="text-muted-foreground">{recommendation.description}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{recommendation.estimated_roi || '-'}</div>
              <div className="text-xs text-muted-foreground">ROI Estimé</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">#{recommendation.priority}</div>
              <div className="text-xs text-muted-foreground">Priorité</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Progress value={recommendation.confidence} className="w-16 h-2" />
                <span className="font-bold">{recommendation.confidence}%</span>
              </div>
              <div className="text-xs text-muted-foreground">Confiance IA</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-medium">{recommendation.timeframe || '-'}</div>
              <div className="text-xs text-muted-foreground">Délai estimé</div>
            </div>
          </div>

          {/* Status info */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(recommendation.status)}
              <span className="font-medium">Statut: {getStatusLabel(recommendation.status)}</span>
            </div>
            {recommendation.scheduled_date && (
              <p className="text-sm text-muted-foreground">
                Programmée pour le: {format(new Date(recommendation.scheduled_date), 'dd MMMM yyyy', { locale: fr })}
              </p>
            )}
            {recommendation.implemented_at && (
              <p className="text-sm text-muted-foreground">
                Implémentée le: {format(new Date(recommendation.implemented_at), 'dd MMMM yyyy', { locale: fr })}
              </p>
            )}
            {recommendation.rejection_reason && (
              <p className="text-sm text-red-600">
                Motif de rejet: {recommendation.rejection_reason}
              </p>
            )}
          </div>

          {/* Tabs for factors and actions */}
          <Tabs defaultValue="factors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="factors">Facteurs Clés</TabsTrigger>
              <TabsTrigger value="actions">Plan d'Action</TabsTrigger>
            </TabsList>
            
            <TabsContent value="factors" className="space-y-2">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analyse IA - Facteurs déterminants
                </h4>
                <ul className="space-y-2">
                  {recommendation.factors.map((factor, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-2">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Étapes recommandées
                </h4>
                <ul className="space-y-2">
                  {recommendation.actions.map((action, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                        {index + 1}
                      </div>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions - only show for non-terminal statuses */}
          {!['implemented', 'rejected'].includes(recommendation.status) && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => {
                    onImplement(recommendation.id);
                    onOpenChange(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Implémenter
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    onReject(recommendation.id);
                    onOpenChange(false);
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </div>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => {
                  onSchedule(recommendation.id);
                  onOpenChange(false);
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Programmer
              </Button>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p>Générée par: {recommendation.ai_model_used || 'PharmaSoft AI'}</p>
            <p>Date de création: {format(new Date(recommendation.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
            {recommendation.expires_at && (
              <p>Expire le: {format(new Date(recommendation.expires_at), 'dd/MM/yyyy', { locale: fr })}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecommendationDetailDialog;
