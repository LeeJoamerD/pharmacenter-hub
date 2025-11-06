import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Invoice } from '@/hooks/useInvoiceManager';

interface InvoicePaymentDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    montant: number;
    mode_paiement: string;
    reference_paiement: string;
    notes: string;
  }) => void;
}

export const InvoicePaymentDialog: React.FC<InvoicePaymentDialogProps> = ({
  invoice,
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [paymentData, setPaymentData] = useState({
    montant: 0,
    mode_paiement: 'Espèces',
    reference_paiement: '',
    notes: '',
  });

  React.useEffect(() => {
    if (invoice) {
      setPaymentData(prev => ({
        ...prev,
        montant: invoice.montant_restant || 0
      }));
    }
  }, [invoice]);

  const handleSubmit = () => {
    onSubmit(paymentData);
    setPaymentData({
      montant: 0,
      mode_paiement: 'Espèces',
      reference_paiement: '',
      notes: '',
    });
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Facture N° {invoice.numero} - Montant restant: {invoice.montant_restant.toFixed(2)} FCFA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="montant">Montant du paiement *</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              value={paymentData.montant}
              onChange={(e) => setPaymentData(prev => ({ ...prev, montant: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode_paiement">Mode de paiement *</Label>
            <Select
              value={paymentData.mode_paiement}
              onValueChange={(value) => setPaymentData(prev => ({ ...prev, mode_paiement: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Espèces">Espèces</SelectItem>
                <SelectItem value="Carte bancaire">Carte bancaire</SelectItem>
                <SelectItem value="Virement">Virement</SelectItem>
                <SelectItem value="Chèque">Chèque</SelectItem>
                <SelectItem value="Mobile Money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              value={paymentData.reference_paiement}
              onChange={(e) => setPaymentData(prev => ({ ...prev, reference_paiement: e.target.value }))}
              placeholder="Numéro de transaction, chèque, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={paymentData.notes}
              onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Informations complémentaires..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Enregistrer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
