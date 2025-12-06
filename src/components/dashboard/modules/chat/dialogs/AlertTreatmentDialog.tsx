import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, ShoppingCart, TrendingDown, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { NetworkStockAlert } from '@/hooks/useNetworkBusinessIntegrations';

interface AlertTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: NetworkStockAlert | null;
  onTreatAlert: (alertId: string, action: string, notes?: string) => void;
  isTreating?: boolean;
}

export function AlertTreatmentDialog({ open, onOpenChange, alert, onTreatAlert, isTreating }: AlertTreatmentDialogProps) {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [notes, setNotes] = useState('');

  if (!alert) return null;

  const handleTreat = () => {
    if (selectedAction) {
      onTreatAlert(alert.id, selectedAction, notes);
      onOpenChange(false);
      setSelectedAction('');
      setNotes('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'low_stock': return 'Stock faible';
      case 'expiry': return 'Péremption proche';
      case 'rupture': return 'Rupture de stock';
      default: return type;
    }
  };

  const getSuggestedActions = () => {
    switch (alert.type) {
      case 'rupture':
        return [
          { value: 'order', label: 'Commander en urgence', icon: ShoppingCart, description: 'Créer une commande fournisseur urgente' },
          { value: 'substitute', label: 'Proposer un substitut', icon: TrendingDown, description: 'Identifier et proposer des produits de substitution' }
        ];
      case 'expiry':
        return [
          { value: 'accelerate', label: 'Écoulement prioritaire', icon: TrendingDown, description: 'Mettre en avant pour vente rapide' },
          { value: 'return', label: 'Retour fournisseur', icon: Trash2, description: 'Préparer un retour au fournisseur' },
          { value: 'destroy', label: 'Destruction', icon: Trash2, description: 'Planifier la destruction réglementaire' }
        ];
      case 'low_stock':
      default:
        return [
          { value: 'order', label: 'Réapprovisionner', icon: ShoppingCart, description: 'Créer une commande de réapprovisionnement' },
          { value: 'monitor', label: 'Surveiller', icon: AlertTriangle, description: 'Continuer à surveiller le niveau' }
        ];
    }
  };

  const actions = getSuggestedActions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${getPriorityColor(alert.priority)}`} />
            Traiter l'alerte
          </DialogTitle>
          <DialogDescription>
            Sélectionnez l'action à entreprendre pour cette alerte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alert Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{alert.product}</h4>
              <Badge variant={alert.priority === 'urgent' ? 'destructive' : 'secondary'}>
                {alert.priority}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type: </span>
                <span className="font-medium">{getTypeLabel(alert.type)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Stock: </span>
                <span className="font-medium">{alert.currentStock} / {alert.minThreshold}</span>
              </div>
              {alert.jours_restants !== undefined && (
                <div>
                  <span className="text-muted-foreground">Jours restants: </span>
                  <span className="font-medium">{alert.jours_restants}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Créée: </span>
                <span className="font-medium">{format(new Date(alert.created_at), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <Label className="mb-3 block">Action recommandée</Label>
            <RadioGroup value={selectedAction} onValueChange={setSelectedAction}>
              {actions.map(action => (
                <div key={action.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={action.value} id={action.value} className="mt-1" />
                  <label htmlFor={action.value} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <action.icon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{action.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajouter des notes sur le traitement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleTreat} disabled={!selectedAction || isTreating}>
            {isTreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Traiter l'alerte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
