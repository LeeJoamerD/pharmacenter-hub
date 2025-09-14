import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, X, MessageSquare, AlertTriangle, Clock, Package, Calendar, Tag, User } from 'lucide-react';
import { StockAlert } from '@/hooks/useStockAlerts';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AlertDetailDialogProps {
  alert: StockAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDetailDialog = ({ alert, open, onOpenChange }: AlertDetailDialogProps) => {
  const [notes, setNotes] = useState('');
  const { actions: { markAlertAsTreated, markAlertAsIgnored } } = useStockAlerts();

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

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'critique':
        return 'destructive';
      case 'eleve':
        return 'destructive';
      case 'moyen':
        return 'default';
      case 'faible':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stock_faible':
        return 'Stock Faible';
      case 'peremption_proche':
        return 'Péremption Proche';
      case 'expire':
        return 'Expiré';
      case 'rupture':
        return 'Rupture';
      case 'critique':
        return 'Critique';
      default:
        return type;
    }
  };

  const handleMarkAsTreated = async () => {
    await markAlertAsTreated(alert.id, alert.traite_par, notes);
    setNotes('');
    onOpenChange(false);
  };

  const handleMarkAsIgnored = async () => {
    await markAlertAsIgnored(alert.id, notes);
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(alert.type)}
            Détails de l'Alerte
          </DialogTitle>
          <DialogDescription>
            Informations détaillées et actions recommandées pour cette alerte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type d'Alerte</Label>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(alert.type)}
                    <Badge variant={getUrgencyColor(alert.niveau_urgence) as any}>
                      {getTypeLabel(alert.type)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Niveau d'Urgence</Label>
                  <Badge variant={getUrgencyColor(alert.niveau_urgence) as any} className="w-fit">
                    {alert.niveau_urgence.charAt(0).toUpperCase() + alert.niveau_urgence.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Produit Concerné</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">{alert.produit_libelle}</div>
                  <div className="text-sm text-muted-foreground">ID: {alert.produit_id}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantité Actuelle</Label>
                  <div className="text-lg font-semibold">{alert.quantite_actuelle} unités</div>
                </div>
                {alert.jours_restants !== undefined && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Jours Restants</Label>
                    <div className={`text-lg font-semibold ${
                      alert.jours_restants <= 0 ? 'text-red-600' :
                      alert.jours_restants <= 7 ? 'text-orange-600' : 'text-yellow-600'
                    }`}>
                      {alert.jours_restants <= 0 ? 'Expiré' : `${alert.jours_restants} jour${alert.jours_restants > 1 ? 's' : ''}`}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date d'Alerte</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(alert.date_alerte), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Statut</Label>
                  <Badge variant={alert.statut === 'active' ? 'destructive' : 'secondary'}>
                    {alert.statut}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions recommandées */}
          {alert.actions_recommandees && alert.actions_recommandees.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Actions Recommandées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alert.actions_recommandees.map((action, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message détaillé */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm bg-muted p-3 rounded-lg">{alert.message}</p>
            </CardContent>
          </Card>

          <Separator />

          {/* Section de traitement */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="treatment-notes" className="text-sm font-medium">
                Notes de Traitement
              </Label>
              <Textarea
                id="treatment-notes"
                placeholder="Ajouter des notes sur l'action prise (optionnel)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleMarkAsTreated}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Marquer comme Traitée
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleMarkAsIgnored}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Ignorer l'Alerte
              </Button>
              
              <Button 
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="ml-auto"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertDetailDialog;