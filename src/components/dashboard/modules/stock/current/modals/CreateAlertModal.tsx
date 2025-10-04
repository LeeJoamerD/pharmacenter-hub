import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertTriangle, Mail, Bell, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LowStockItem } from '@/hooks/useLowStockData';
import { LowStockActionService } from '@/services/LowStockActionService';

interface CreateAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: LowStockItem;
  onSuccess?: () => void;
}

export const CreateAlertModal = ({ open, onOpenChange, product, onSuccess }: CreateAlertModalProps) => {
  const { toast } = useToast();
  
  const [alertType, setAlertType] = useState<'stock_faible' | 'critique' | 'rupture'>(
    product.quantiteActuelle === 0 ? 'rupture' : 
    product.statut === 'critique' ? 'critique' : 'stock_faible'
  );
  const [urgencyLevel, setUrgencyLevel] = useState<'faible' | 'moyen' | 'eleve' | 'critique'>(
    product.quantiteActuelle === 0 ? 'critique' :
    product.statut === 'critique' ? 'critique' :
    product.statut === 'faible' ? 'eleve' : 'moyen'
  );
  const [notifications, setNotifications] = useState<('email' | 'dashboard' | 'sms')[]>(
    product.quantiteActuelle === 0 ? ['email', 'dashboard', 'sms'] :
    product.statut === 'critique' ? ['email', 'dashboard'] : ['dashboard']
  );
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotificationToggle = (channel: 'email' | 'dashboard' | 'sms') => {
    setNotifications(prev => 
      prev.includes(channel) 
        ? prev.filter(n => n !== channel)
        : [...prev, channel]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (notifications.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un canal de notification",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const result = await LowStockActionService.executeAlertAction(
        [product],
        [product.id],
        {
          custom_message: customMessage || undefined,
          force_notifications: notifications
        }
      );

      if (result.success) {
        toast({
          title: "Alerte créée",
          description: `Alerte créée avec succès pour ${product.nomProduit}`,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Erreur lors de la création de l\'alerte');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer l'alerte",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Créer une alerte de stock
          </DialogTitle>
          <DialogDescription>
            Créer une alerte pour le produit {product.nomProduit}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info produit */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Produit:</span>
              <span className="text-sm font-medium">{product.nomProduit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Code:</span>
              <span className="text-sm font-medium">{product.codeProduit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock actuel:</span>
              <span className="text-sm font-medium text-destructive">
                {product.quantiteActuelle} {product.unite}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Seuil minimum:</span>
              <span className="text-sm font-medium">{product.seuilMinimum} {product.unite}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Statut:</span>
              <span className="text-sm font-medium capitalize">{product.statut}</span>
            </div>
          </div>

          {/* Type d'alerte */}
          <div className="space-y-2">
            <Label htmlFor="alert-type">Type d'alerte *</Label>
            <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
              <SelectTrigger id="alert-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock_faible">Stock faible</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="rupture">Rupture de stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Niveau d'urgence */}
          <div className="space-y-2">
            <Label htmlFor="urgency-level">Niveau d'urgence *</Label>
            <Select value={urgencyLevel} onValueChange={(value: any) => setUrgencyLevel(value)}>
              <SelectTrigger id="urgency-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="faible">Faible</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="eleve">Élevé</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Canaux de notification */}
          <div className="space-y-3">
            <Label>Canaux de notification *</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notif-dashboard"
                  checked={notifications.includes('dashboard')}
                  onCheckedChange={() => handleNotificationToggle('dashboard')}
                />
                <Label htmlFor="notif-dashboard" className="flex items-center gap-2 cursor-pointer">
                  <Bell className="h-4 w-4" />
                  Tableau de bord
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notif-email"
                  checked={notifications.includes('email')}
                  onCheckedChange={() => handleNotificationToggle('email')}
                />
                <Label htmlFor="notif-email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notif-sms"
                  checked={notifications.includes('sms')}
                  onCheckedChange={() => handleNotificationToggle('sms')}
                />
                <Label htmlFor="notif-sms" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </Label>
              </div>
            </div>
          </div>

          {/* Message personnalisé */}
          <div className="space-y-2">
            <Label htmlFor="custom-message">Message personnalisé (optionnel)</Label>
            <Textarea
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Message supplémentaire pour l'alerte..."
              rows={3}
            />
          </div>

          {/* Actions recommandées (info) */}
          <div className="bg-primary/10 p-3 rounded-lg">
            <p className="text-sm font-medium mb-2">Actions recommandées:</p>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>Vérifier les niveaux de stock</li>
              <li>Contacter le fournisseur</li>
              <li>Planifier une commande de réapprovisionnement</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || notifications.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer l\'alerte'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
