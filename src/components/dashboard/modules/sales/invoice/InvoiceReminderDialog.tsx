import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Invoice } from '@/hooks/useInvoiceManager';

interface InvoiceReminderDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    type_relance: 'email' | 'sms' | 'telephone' | 'courrier';
    message: string;
    destinataire: string;
  }) => void;
}

export const InvoiceReminderDialog: React.FC<InvoiceReminderDialogProps> = ({
  invoice,
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [reminderData, setReminderData] = useState({
    type_relance: 'email' as 'email' | 'sms' | 'telephone' | 'courrier',
    message: '',
    destinataire: '',
  });

  React.useEffect(() => {
    if (invoice) {
      const isClient = invoice.type === 'client';
      const defaultMessage = `Bonjour,\n\nNous vous rappelons que la facture N° ${invoice.numero} d'un montant de ${invoice.montant_restant.toFixed(2)} FCFA est en attente de règlement.\n\nDate d'émission: ${new Date(invoice.date_emission).toLocaleDateString('fr-FR')}\nDate d'échéance: ${new Date(invoice.date_echeance).toLocaleDateString('fr-FR')}\n\nMerci de procéder au règlement dans les meilleurs délais.\n\nCordialement.`;
      
      setReminderData(prev => ({
        ...prev,
        message: defaultMessage,
        destinataire: isClient ? (invoice.client_email || invoice.client_telephone || '') : ''
      }));
    }
  }, [invoice]);

  const handleSubmit = () => {
    onSubmit(reminderData);
    setReminderData({
      type_relance: 'email',
      message: '',
      destinataire: '',
    });
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Envoyer une relance</DialogTitle>
          <DialogDescription>
            Facture N° {invoice.numero} - Retard de {invoice.jours_retard || 0} jour(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type_relance">Type de relance *</Label>
            <Select
              value={reminderData.type_relance}
              onValueChange={(value: any) => setReminderData(prev => ({ ...prev, type_relance: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="telephone">Téléphone</SelectItem>
                <SelectItem value="courrier">Courrier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinataire">Destinataire *</Label>
            <Input
              id="destinataire"
              value={reminderData.destinataire}
              onChange={(e) => setReminderData(prev => ({ ...prev, destinataire: e.target.value }))}
              placeholder={reminderData.type_relance === 'email' ? 'Email' : 'Téléphone'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={reminderData.message}
              onChange={(e) => setReminderData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Contenu de la relance..."
              rows={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Envoyer la relance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
