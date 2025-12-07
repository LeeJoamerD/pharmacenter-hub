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
import { TrendingUp, CheckCircle2, XCircle, Calendar, Target, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaxOptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optimization: any;
  onImplement: (id: string) => Promise<boolean>;
  onReject: (id: string, reason: string) => Promise<boolean>;
  currency?: string;
}

const TaxOptimizationDialog: React.FC<TaxOptimizationDialogProps> = ({
  open,
  onOpenChange,
  optimization,
  onImplement,
  onReject,
  currency = 'FCFA',
}) => {
  const [rejectReason, setRejectReason] = React.useState('');
  const [showRejectForm, setShowRejectForm] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  if (!optimization) return null;

  const statusConfig: Record<string, { color: string; label: string }> = {
    suggested: { color: 'bg-blue-100 text-blue-800', label: 'Suggéré' },
    under_review: { color: 'bg-yellow-100 text-yellow-800', label: 'En examen' },
    approved: { color: 'bg-purple-100 text-purple-800', label: 'Approuvé' },
    implemented: { color: 'bg-green-100 text-green-800', label: 'Implémenté' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejeté' },
  };

  const categoryLabels: Record<string, string> = {
    general: 'Général',
    tva: 'TVA',
    is: 'Impôt sur les Sociétés',
    patente: 'Patente',
    charges: 'Charges déductibles',
    amortissement: 'Amortissement',
    provisions: 'Provisions',
  };

  const typeLabels: Record<string, string> = {
    deduction: 'Déduction fiscale',
    credit: 'Crédit d\'impôt',
    timing: 'Optimisation temporelle',
    structure: 'Restructuration',
    investment: 'Investissement',
    provision: 'Provision',
    depreciation: 'Amortissement',
    loss_carryforward: 'Report de déficit',
  };

  const status = statusConfig[optimization.status] || statusConfig.suggested;
  const isPending = optimization.status === 'suggested' || optimization.status === 'under_review';

  const handleImplement = async () => {
    setIsProcessing(true);
    const success = await onImplement(optimization.id);
    setIsProcessing(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsProcessing(true);
    const success = await onReject(optimization.id, rejectReason);
    setIsProcessing(false);
    if (success) {
      onOpenChange(false);
      setRejectReason('');
      setShowRejectForm(false);
    }
  };

  const priorityStars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < optimization.priority ? 'text-yellow-500' : 'text-gray-300'}>
      ★
    </span>
  ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Optimisation Fiscale
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{optimization.title}</h3>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{categoryLabels[optimization.category] || optimization.category}</Badge>
                <Badge variant="outline">{typeLabels[optimization.optimization_type] || optimization.optimization_type}</Badge>
                <Badge className={status.color}>{status.label}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Priorité</div>
              <div>{priorityStars}</div>
            </div>
          </div>

          {/* Économies estimées */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700">
              <Target className="h-5 w-5" />
              <span className="font-medium">Économies estimées</span>
            </div>
            <p className="text-2xl font-bold text-green-800 mt-1">
              {(optimization.estimated_savings || 0).toLocaleString('fr-FR')} {currency}
            </p>
            <p className="text-sm text-green-600 mt-1">
              Confiance: {((optimization.confidence || 0) * 100).toFixed(0)}%
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <p className="text-sm bg-muted/30 rounded-lg p-3">{optimization.description}</p>
          </div>

          {/* Étapes d'implémentation */}
          {optimization.implementation_steps && (
            <div className="space-y-2">
              <Label>Étapes d'implémentation</Label>
              <div className="bg-muted/30 rounded-lg p-3">
                {Array.isArray(optimization.implementation_steps) ? (
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {optimization.implementation_steps.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm">{JSON.stringify(optimization.implementation_steps)}</p>
                )}
              </div>
            </div>
          )}

          {/* Références légales */}
          {optimization.legal_references && optimization.legal_references.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Références légales
              </Label>
              <ul className="list-disc list-inside text-sm bg-muted/30 rounded-lg p-3 space-y-1">
                {optimization.legal_references.map((ref: string, i: number) => (
                  <li key={i}>{ref}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Période et échéance */}
          <div className="grid grid-cols-2 gap-4">
            {optimization.applicable_period && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Période: {optimization.applicable_period}</span>
              </div>
            )}
            {optimization.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Échéance: {format(new Date(optimization.deadline), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
            )}
          </div>

          {/* Raison du rejet */}
          {optimization.rejected_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800">Raison du rejet:</p>
              <p className="text-sm text-red-700 mt-1">{optimization.rejected_reason}</p>
            </div>
          )}

          {/* Formulaire de rejet */}
          {showRejectForm && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="reject-reason">Raison du rejet</Label>
              <Textarea
                id="reject-reason"
                placeholder="Expliquez pourquoi cette optimisation n'est pas applicable..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {isPending ? (
            showRejectForm ? (
              <>
                <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectReason.trim()}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirmer le rejet
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowRejectForm(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button onClick={handleImplement} disabled={isProcessing}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Implémenter
                </Button>
              </>
            )
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

export default TaxOptimizationDialog;
