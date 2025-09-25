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
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  User,
  X
} from 'lucide-react';
import type { Transporter } from '@/hooks/useTransporters';

interface ContactTransporterModalProps {
  open: boolean;
  onClose: () => void;
  transporter: Transporter | null;
  orderNumber: string;
}

export const ContactTransporterModal: React.FC<ContactTransporterModalProps> = ({
  open,
  onClose,
  transporter,
  orderNumber
}) => {
  if (!transporter) return null;

  const handlePhoneCall = () => {
    if (transporter.telephone_appel) {
      window.open(`tel:${transporter.telephone_appel}`, '_self');
    }
  };

  const handleWhatsApp = () => {
    if (transporter.telephone_whatsapp) {
      // Format international pour WhatsApp (sans espaces ni tirets)
      const phoneNumber = transporter.telephone_whatsapp.replace(/[\s-]/g, '');
      window.open(`https://wa.me/${phoneNumber}?text=Bonjour, je vous contacte concernant la commande ${orderNumber}`, '_blank');
    }
  };

  const handleEmail = () => {
    if (transporter.email) {
      const subject = `Suivi commande ${orderNumber}`;
      const body = `Bonjour,\n\nJe vous contacte concernant la commande ${orderNumber}.\n\nCordialement,\n[Pharmacie]`;
      window.open(`mailto:${transporter.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Contacter le Transporteur</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Commande {orderNumber} - {transporter.nom}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du transporteur */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{transporter.nom}</p>
                {transporter.contact_principal && (
                  <p className="text-sm text-muted-foreground">
                    Contact: {transporter.contact_principal}
                  </p>
                )}
              </div>
            </div>

            {transporter.adresse && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">{transporter.adresse}</p>
              </div>
            )}

            {transporter.delai_livraison_standard && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">
                  Délai standard: {transporter.delai_livraison_standard} jours
                </p>
              </div>
            )}

            {transporter.zone_couverture && transporter.zone_couverture.length > 0 && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Zones de couverture:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {transporter.zone_couverture.map((zone, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Options de contact */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">CHOISIR UN MOYEN DE CONTACT</h3>
            
            {transporter.telephone_appel && (
              <Button
                onClick={handlePhoneCall}
                variant="outline"
                className="w-full justify-start gap-3"
              >
                <Phone className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Appeler</p>
                  <p className="text-xs text-muted-foreground">{transporter.telephone_appel}</p>
                </div>
              </Button>
            )}

            {transporter.telephone_whatsapp && (
              <Button
                onClick={handleWhatsApp}
                variant="outline"
                className="w-full justify-start gap-3"
              >
                <MessageCircle className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">{transporter.telephone_whatsapp}</p>
                </div>
              </Button>
            )}

            {transporter.email && (
              <Button
                onClick={handleEmail}
                variant="outline"
                className="w-full justify-start gap-3"
              >
                <Mail className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">{transporter.email}</p>
                </div>
              </Button>
            )}

            {!transporter.telephone_appel && !transporter.telephone_whatsapp && !transporter.email && (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune information de contact disponible</p>
                <p className="text-sm">Veuillez mettre à jour les informations du transporteur</p>
              </div>
            )}
          </div>

          {transporter.notes && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Notes:</span> {transporter.notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactTransporterModal;
