import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, Clock, XCircle, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AccountingAnomalyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anomaly: any;
  onResolve: (id: string, notes: string) => Promise<boolean>;
  onDismiss: (id: string) => Promise<boolean>;
}

const AccountingAnomalyDetailDialog: React.FC<AccountingAnomalyDetailDialogProps> = ({
  open,
  onOpenChange,
  anomaly,
  onResolve,
  onDismiss,
}) => {
  const [resolutionNotes, setResolutionNotes] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  if (!anomaly) return null;

  const severityConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    low: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" />, label: 'Faible' },
    medium: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-4 w-4" />, label: 'Moyenne' },
    high: { color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-4 w-4" />, label: 'Élevée' },
    critical: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" />, label: 'Critique' },
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
    investigating: { color: 'bg-blue-100 text-blue-800', label: 'En cours d\'analyse' },
    resolved: { color: 'bg-green-100 text-green-800', label: 'Résolu' },
    dismissed: { color: 'bg-gray-100 text-gray-800', label: 'Ignoré' },
  };

  const typeLabels: Record<string, string> = {
    balance_error: 'Erreur d\'équilibre',
    duplicate_entry: 'Écriture en double',
    missing_document: 'Document manquant',
    unusual_amount: 'Montant inhabituel',
    sequence_gap: 'Rupture de séquence',
    tax_discrepancy: 'Écart fiscal',
    reconciliation_issue: 'Problème de rapprochement',
    period_mismatch: 'Décalage de période',
  };

  const severity = severityConfig[anomaly.severity] || severityConfig.medium;
  const status = statusConfig[anomaly.status] || statusConfig.pending;

  const handleResolve = async () => {
    setIsProcessing(true);
    const success = await onResolve(anomaly.id, resolutionNotes);
    setIsProcessing(false);
    if (success) {
      onOpenChange(false);
      setResolutionNotes('');
    }
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    const success = await onDismiss(anomaly.id);
    setIsProcessing(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const isPending = anomaly.status === 'pending' || anomaly.status === 'investigating';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Détails de l'anomalie comptable
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{anomaly.title}</h3>
            <div className="flex gap-2">
              <Badge className={severity.color}>
                {severity.icon}
                <span className="ml-1">{severity.label}</span>
              </Badge>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
          </div>

          {/* Type */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Type d'anomalie</p>
            <p className="font-medium">{typeLabels[anomaly.anomaly_type] || anomaly.anomaly_type}</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <p className="text-sm bg-muted/30 rounded-lg p-3">{anomaly.description}</p>
          </div>

          {/* Correction suggérée */}
          {anomaly.suggested_correction && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Correction suggérée</p>
                  <p className="text-sm text-green-700 mt-1">{anomaly.suggested_correction}</p>
                </div>
              </div>
            </div>
          )}

          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Détectée le</p>
              <p className="font-medium">
                {format(new Date(anomaly.detected_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </p>
            </div>
            {anomaly.resolved_at && (
              <div>
                <p className="text-muted-foreground">Résolue le</p>
                <p className="font-medium">
                  {format(new Date(anomaly.resolved_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              </div>
            )}
          </div>

          {/* Notes de résolution existantes */}
          {anomaly.resolution_notes && (
            <div className="space-y-2">
              <Label>Notes de résolution</Label>
              <p className="text-sm bg-green-50 rounded-lg p-3 text-green-800">
                {anomaly.resolution_notes}
              </p>
            </div>
          )}

          {/* Formulaire de résolution */}
          {isPending && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="resolution-notes">Notes de résolution</Label>
              <Textarea
                id="resolution-notes"
                placeholder="Décrivez les actions prises pour corriger cette anomalie..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {isPending ? (
            <>
              <Button variant="outline" onClick={handleDismiss} disabled={isProcessing}>
                Ignorer
              </Button>
              <Button onClick={handleResolve} disabled={isProcessing || !resolutionNotes.trim()}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marquer comme résolue
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountingAnomalyDetailDialog;
