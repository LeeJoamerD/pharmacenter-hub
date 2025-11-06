import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSplitPayment } from '@/hooks/useSplitPayment';
import { Plus, Trash2, CreditCard, Banknote } from 'lucide-react';
import { toast } from 'sonner';

interface SplitPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onPaymentComplete: (payments: any[]) => void;
}

export const SplitPaymentDialog: React.FC<SplitPaymentDialogProps> = ({
  open,
  onOpenChange,
  totalAmount,
  onPaymentComplete
}) => {
  const {
    payments,
    addPaymentMethod,
    removePaymentMethod,
    updatePaymentMethod,
    calculateSplit,
    validateSplit,
    processSplitPayment,
    distributeEvenly
  } = useSplitPayment();

  const { paid, remaining } = calculateSplit(totalAmount);

  const handleSubmit = async () => {
    const isValid = validateSplit(totalAmount);
    
    if (!isValid) {
      return;
    }

    await processSplitPayment(totalAmount, async (payments) => {
      onPaymentComplete(payments);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paiement Fractionné
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Montant Total</p>
              <p className="text-2xl font-bold">{totalAmount.toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payé</p>
              <p className="text-2xl font-bold text-green-600">{paid.toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Restant</p>
              <p className={`text-2xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {remaining.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          {/* Méthodes de paiement */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Méthodes de Paiement</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => distributeEvenly(totalAmount)}
                  variant="outline"
                  size="sm"
                  disabled={payments.length < 2}
                >
                  Répartir
                </Button>
                <Button
                  onClick={addPaymentMethod}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={payments.length >= 3}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </div>

            {payments.map((payment, index) => (
              <div key={payment.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Paiement #{index + 1}</span>
                  {payments.length > 1 && (
                    <Button
                      onClick={() => removePaymentMethod(payment.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Méthode</Label>
                    <Select
                      value={payment.method}
                      onValueChange={(value: any) => updatePaymentMethod(payment.id, { method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Espèces">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            Espèces
                          </div>
                        </SelectItem>
                        <SelectItem value="Carte">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Carte
                          </div>
                        </SelectItem>
                        <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                        <SelectItem value="Assurance">Assurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Montant (FCFA)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={totalAmount}
                      value={payment.amount || ''}
                      onChange={(e) => updatePaymentMethod(payment.id, { amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>

                {(payment.method === 'Carte' || 
                  payment.method === 'Mobile Money') && (
                  <div className="space-y-2">
                    <Label>Référence</Label>
                    <Input
                      value={payment.reference || ''}
                      onChange={(e) => updatePaymentMethod(payment.id, { reference: e.target.value })}
                      placeholder="Numéro de transaction..."
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={remaining !== 0}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Valider le Paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
