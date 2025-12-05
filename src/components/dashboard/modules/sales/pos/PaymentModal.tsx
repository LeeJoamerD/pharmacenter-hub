import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Building2, 
  Receipt,
  Calculator,
  CheckCircle,
  Printer
} from 'lucide-react';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface PaymentModalProps {
  transaction: {
    items: any[];
    customer: any;
    subtotal: number;
    discount: number;
    total: number;
    timestamp: Date;
  };
  onPaymentComplete: (paymentData: any) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

type PaymentMethod = 'cash' | 'card' | 'mobile' | 'insurance';

const PaymentModal = ({ transaction, onPaymentComplete, onClose, isSaving = false }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState<string>(transaction.total.toString());
  const [processing, setProcessing] = useState(false);
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const { formatAmount } = useCurrencyFormatting();

  const paymentMethods = [
    { 
      id: 'cash' as PaymentMethod, 
      label: 'Espèces', 
      icon: DollarSign, 
      color: 'bg-green-500' 
    },
    { 
      id: 'card' as PaymentMethod, 
      label: 'Carte Bancaire', 
      icon: CreditCard, 
      color: 'bg-blue-500' 
    },
    { 
      id: 'mobile' as PaymentMethod, 
      label: 'Mobile Money', 
      icon: Smartphone, 
      color: 'bg-purple-500' 
    },
    { 
      id: 'insurance' as PaymentMethod, 
      label: 'Assurance', 
      icon: Building2, 
      color: 'bg-orange-500' 
    }
  ];

  const change = parseFloat(amountReceived) - transaction.total;
  const isValidPayment = parseFloat(amountReceived) >= transaction.total;

  const handlePayment = async () => {
    if (!isValidPayment) return;
    
    setProcessing(true);
    
    const paymentData = {
      method: paymentMethod,
      amount: transaction.total,
      amountReceived: parseFloat(amountReceived),
      change: change > 0 ? change : 0,
      timestamp: new Date(),
      reference: `PAY-${Date.now()}`,
      autoPrint: autoPrintTicket
    };

    await onPaymentComplete(paymentData);
    setProcessing(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Finaliser la Transaction
          </DialogTitle>
          <DialogDescription>
            Sélectionnez le mode de paiement et validez la transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total:</span>
                  <span>{formatAmount(transaction.subtotal)}</span>
                </div>
                
                {transaction.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Remise:</span>
                    <span>-{formatAmount(transaction.discount)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total à payer:</span>
                  <span className="text-primary">{formatAmount(transaction.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Mode de Paiement</Label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Button
                    key={method.id}
                    variant={paymentMethod === method.id ? 'default' : 'outline'}
                    className="h-auto p-4 flex-col gap-2"
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <div className={`p-2 rounded-full ${method.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm">{method.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant Reçu</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="Montant en FCFA"
                />
              </div>
              
              {change > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-green-800 font-medium">Monnaie à rendre:</span>
                    <span className="text-green-800 font-bold text-lg">
                      {formatAmount(change)}
                    </span>
                  </div>
                </div>
              )}
              
              {!isValidPayment && amountReceived && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <span className="text-red-800 text-sm">
                    Le montant reçu est insuffisant
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm text-center">
                Insérez ou présentez la carte au terminal de paiement
              </p>
            </div>
          )}

          {paymentMethod === 'mobile' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
              <p className="text-purple-800 text-sm text-center">
                Le client peut procéder au paiement via Mobile Money
              </p>
            </div>
          )}

          {paymentMethod === 'insurance' && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-orange-800 text-sm text-center">
                Vérifiez la couverture et les informations d'assurance du client
              </p>
            </div>
          )}

          {/* Switch impression automatique */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <Label htmlFor="autoPrintTicket" className="flex items-center gap-2 cursor-pointer">
              <Printer className="h-4 w-4" />
              Impression automatique du ticket
            </Label>
            <Switch
              id="autoPrintTicket"
              checked={autoPrintTicket}
              onCheckedChange={setAutoPrintTicket}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={!isValidPayment || processing || isSaving}
              className="flex-1"
            >
              {(processing || isSaving) ? (
                <>
                  <Calculator className="h-4 w-4 mr-2 animate-spin" />
                  {isSaving ? 'Enregistrement...' : 'Traitement...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer le Paiement
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;