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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, Eye, XCircle, Target, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Anomaly } from '@/hooks/useIntelligentDiagnostic';

interface InvestigateAnomalyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anomaly: Anomaly | null;
  onInvestigate: (id: string) => Promise<boolean>;
  onResolve: (id: string, notes: string) => Promise<boolean>;
  onDismiss: (id: string) => Promise<boolean>;
}

const InvestigateAnomalyDialog: React.FC<InvestigateAnomalyDialogProps> = ({
  open,
  onOpenChange,
  anomaly,
  onInvestigate,
  onResolve,
  onDismiss
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!anomaly) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critique': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detected': return <Eye className="h-4 w-4" />;
      case 'investigating': return <Target className="h-4 w-4 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'dismissed': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return null;
    }
  };

  const handleInvestigate = async () => {
    setLoading(true);
    await onInvestigate(anomaly.id);
    setLoading(false);
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) return;
    setLoading(true);
    const success = await onResolve(anomaly.id, resolutionNotes);
    if (success) {
      setResolutionNotes('');
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleDismiss = async () => {
    setLoading(true);
    const success = await onDismiss(anomaly.id);
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
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Investigation Anomalie
          </DialogTitle>
          <DialogDescription>
            Analysez l'anomalie détectée et prenez les mesures appropriées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className={getTypeColor(anomaly.type)}>
                  {anomaly.type === 'critique' ? 'Critique' : 
                   anomaly.type === 'warning' ? 'Attention' : 'Information'}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getStatusIcon(anomaly.status)}
                  {anomaly.status === 'detected' ? 'Détectée' : 
                   anomaly.status === 'investigating' ? 'En investigation' : 
                   anomaly.status === 'resolved' ? 'Résolue' : 'Ignorée'}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold">{anomaly.title}</h3>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(anomaly.detected_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </div>
              <div className="text-sm font-medium mt-1">
                Confiance: {anomaly.confidence}%
              </div>
              <Progress value={anomaly.confidence} className="w-24 h-2 mt-1" />
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="resolution">Résolution</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Description</Label>
                <p className="mt-1 text-sm">{anomaly.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">Impact</Label>
                  <Badge variant="outline" className={`mt-2 ${
                    anomaly.impact === 'high' ? 'border-red-500 text-red-600' :
                    anomaly.impact === 'medium' ? 'border-orange-500 text-orange-600' :
                    'border-green-500 text-green-600'
                  }`}>
                    {anomaly.impact === 'high' ? 'Élevé' : 
                     anomaly.impact === 'medium' ? 'Moyen' : 'Faible'}
                  </Badge>
                </div>

                {anomaly.investigated_at && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Investigation</Label>
                    <p className="mt-1 text-sm">
                      {format(new Date(anomaly.investigated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>

              {anomaly.resolution_notes && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Label className="text-sm font-medium text-green-800">Notes de Résolution</Label>
                  <p className="mt-1 text-sm text-green-700">{anomaly.resolution_notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="mt-4">
              <div className="space-y-3">
                {anomaly.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">{suggestion}</p>
                  </div>
                ))}
                {anomaly.suggestions.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Aucune suggestion disponible
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="resolution" className="mt-4 space-y-4">
              {anomaly.status !== 'resolved' && anomaly.status !== 'dismissed' && (
                <div className="space-y-3">
                  <Label htmlFor="resolution-notes">Notes de résolution</Label>
                  <Textarea
                    id="resolution-notes"
                    placeholder="Décrivez les actions prises pour résoudre cette anomalie..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {(anomaly.status === 'resolved' || anomaly.status === 'dismissed') && (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-muted-foreground">
                    Cette anomalie a été {anomaly.status === 'resolved' ? 'résolue' : 'ignorée'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {anomaly.status === 'detected' && (
            <>
              <Button
                variant="outline"
                onClick={handleDismiss}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Ignorer
              </Button>
              <Button
                variant="secondary"
                onClick={handleInvestigate}
                disabled={loading}
              >
                <Target className="h-4 w-4 mr-2" />
                Démarrer Investigation
              </Button>
            </>
          )}

          {anomaly.status === 'investigating' && (
            <>
              <Button
                variant="outline"
                onClick={handleDismiss}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Ignorer
              </Button>
              <Button
                onClick={handleResolve}
                disabled={loading || !resolutionNotes.trim()}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer Résolu
              </Button>
            </>
          )}

          {(anomaly.status === 'resolved' || anomaly.status === 'dismissed') && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvestigateAnomalyDialog;
