import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Building, Mail, Calendar, Activity, CheckCircle, XCircle, 
  MessageSquare, Settings, Trash2 
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { PartnerAccount } from '@/hooks/useNetworkChannelManagement';

interface PartnerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: PartnerAccount | null;
  onToggleActive: (partnerId: string, isActive: boolean) => Promise<boolean>;
}

const PartnerDetailModal = ({
  open,
  onOpenChange,
  partner,
  onToggleActive
}: PartnerDetailModalProps) => {
  if (!partner) return null;

  const handleToggle = async () => {
    await onToggleActive(partner.id, !partner.is_active);
  };

  const getPartnerTypeLabel = (type: string) => {
    switch (type) {
      case 'supplier': return 'Fournisseur';
      case 'laboratory': return 'Laboratoire';
      case 'distributor': return 'Distributeur';
      case 'transporter': return 'Transporteur';
      default: return type;
    }
  };

  const getPartnerTypeColor = (type: string) => {
    switch (type) {
      case 'supplier': return 'bg-blue-500';
      case 'laboratory': return 'bg-purple-500';
      case 'distributor': return 'bg-green-500';
      case 'transporter': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Détails du Partenaire
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{partner.display_name}</h3>
              <Badge className={`${getPartnerTypeColor(partner.partner_type)} mt-2`}>
                {getPartnerTypeLabel(partner.partner_type)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {partner.is_active ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Email</span>
                </div>
                <p className="font-medium">
                  {partner.contact_email || 'Non renseigné'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Inscrit le</span>
                </div>
                <p className="font-medium">
                  {format(new Date(partner.created_at), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Dernière activité</span>
                </div>
                <p className="font-medium">
                  {partner.last_activity 
                    ? format(new Date(partner.last_activity), 'dd/MM/yyyy HH:mm', { locale: fr })
                    : 'Aucune activité'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Statut Chat</span>
                </div>
                <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                  {partner.is_active ? 'Chat actif' : 'Chat désactivé'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Toggle Active */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium">Activer l'accès chat</Label>
              <p className="text-sm text-muted-foreground">
                Permet à ce partenaire d'envoyer et recevoir des messages
              </p>
            </div>
            <Switch 
              checked={partner.is_active} 
              onCheckedChange={handleToggle}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Configurer
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Envoyer un message
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerDetailModal;
