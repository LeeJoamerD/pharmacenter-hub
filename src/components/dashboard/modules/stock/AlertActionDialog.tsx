import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, X, Settings, AlertTriangle, Package, Clock, ShoppingCart, Bell, FileText } from 'lucide-react';
import { StockAlert } from '@/hooks/useStockAlerts';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { toast } from 'sonner';

interface AlertActionDialogProps {
  alert: StockAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertActionDialog = ({ alert, open, onOpenChange }: AlertActionDialogProps) => {
  const [action, setAction] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { actions: { markAlertAsTreated, markAlertAsIgnored, createAlert } } = useStockAlerts();

  if (!alert) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock_faible':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'peremption_proche':
      case 'expire':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'rupture':
      case 'critique':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAvailableActions = () => {
    switch (alert.type) {
      case 'stock_faible':
        return [
          { value: 'reorder', label: 'Créer une commande de réapprovisionnement', icon: ShoppingCart },
          { value: 'adjust_threshold', label: 'Ajuster le seuil d\'alerte', icon: Settings },
          { value: 'transfer', label: 'Demander un transfert inter-sites', icon: Package },
          { value: 'ignore', label: 'Ignorer temporairement', icon: X }
        ];
      case 'peremption_proche':
        return [
          { value: 'promotion', label: 'Lancer une promotion', icon: Bell },
          { value: 'transfer', label: 'Transférer vers un autre site', icon: Package },
          { value: 'return', label: 'Retourner au fournisseur', icon: FileText },
          { value: 'monitor', label: 'Surveiller de près', icon: AlertTriangle }
        ];
      case 'expire':
        return [
          { value: 'remove', label: 'Retirer du stock immédiatement', icon: X },
          { value: 'destroy', label: 'Programmer la destruction', icon: AlertTriangle },
          { value: 'return', label: 'Retourner au fournisseur', icon: FileText }
        ];
      case 'rupture':
        return [
          { value: 'urgent_order', label: 'Commande urgente', icon: ShoppingCart },
          { value: 'substitute', label: 'Proposer un produit de substitution', icon: Package },
          { value: 'notify_customers', label: 'Notifier les clients', icon: Bell }
        ];
      default:
        return [
          { value: 'investigate', label: 'Enquêter sur le problème', icon: AlertTriangle },
          { value: 'escalate', label: 'Escalader vers la hiérarchie', icon: Bell },
          { value: 'document', label: 'Documenter l\'incident', icon: FileText }
        ];
    }
  };

  const handleExecuteAction = async () => {
    if (!action) {
      toast.error('Veuillez sélectionner une action');
      return;
    }

    setIsProcessing(true);
    
    try {
      switch (action) {
        case 'reorder':
          // Simuler la création d'une commande
          toast.success('Commande de réapprovisionnement créée avec succès');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: Commande créée. ${notes}`);
          break;
        
        case 'promotion':
          // Simuler le lancement d'une promotion
          toast.success('Promotion lancée pour le produit');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: Promotion lancée. ${notes}`);
          break;
        
        case 'remove':
        case 'destroy':
          // Simuler le retrait/destruction
          toast.success('Produit retiré du stock');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: Produit retiré. ${notes}`);
          break;
        
        case 'urgent_order':
          // Simuler une commande urgente
          toast.success('Commande urgente créée');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: Commande urgente. ${notes}`);
          break;
        
        case 'ignore':
          await markAlertAsIgnored(alert.id, `Action: Ignoré temporairement. ${notes}`);
          break;
        
        case 'adjust_threshold':
          toast.success('Seuil d\'alerte ajusté');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: Seuil ajusté. ${notes}`);
          break;
        
        case 'transfer':
          toast.success('Transfert demandé');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: Transfert demandé. ${notes}`);
          break;
        
        case 'substitute':
          toast.success('Produit de substitution proposé');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: Substitution proposée. ${notes}`);
          break;
        
        case 'notify_customers':
          toast.success('Clients notifiés');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: Clients notifiés. ${notes}`);
          break;
        
        case 'return':
          toast.success('Retour fournisseur programmé');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: Retour fournisseur. ${notes}`);
          break;
        
        case 'monitor':
          toast.success('Surveillance renforcée activée');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: Surveillance activée. ${notes}`);
          break;
        
        default:
          toast.success('Action exécutée avec succès');
          await markAlertAsTreated(alert.id, alert.traite_par, `Action: ${action}. ${notes}`);
      }

      // Réinitialiser le formulaire
      setAction('');
      setNotes('');
      onOpenChange(false);
      
    } catch (error) {
      toast.error('Erreur lors de l\'exécution de l\'action');
    } finally {
      setIsProcessing(false);
    }
  };

  const availableActions = getAvailableActions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Actions pour l'Alerte
          </DialogTitle>
          <DialogDescription>
            Sélectionnez et exécutez une action pour traiter cette alerte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé de l'alerte */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Alerte Concernée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {getTypeIcon(alert.type)}
                <div className="flex-1">
                  <div className="font-medium">{alert.produit_libelle}</div>
                  <div className="text-sm text-muted-foreground">{alert.message}</div>
                </div>
                <Badge variant={alert.niveau_urgence === 'critique' ? 'destructive' : 'secondary'}>
                  {alert.niveau_urgence}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Sélection de l'action */}
          <div className="space-y-3">
            <Label htmlFor="action-select">Action à Exécuter</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une action..." />
              </SelectTrigger>
              <SelectContent>
                {availableActions.map((actionOption) => {
                  const IconComponent = actionOption.icon;
                  return (
                    <SelectItem key={actionOption.value} value={actionOption.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {actionOption.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="action-notes">Notes et Commentaires</Label>
            <Textarea
              id="action-notes"
              placeholder="Ajouter des détails sur l'action (optionnel)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleExecuteAction}
              disabled={!action || isProcessing}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {isProcessing ? 'Traitement...' : 'Exécuter l\'Action'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertActionDialog;