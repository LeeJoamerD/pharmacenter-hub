import React, { useState, useMemo } from 'react';
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
  Printer,
  Wallet,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { usePOSCalculations } from '@/hooks/usePOSCalculations';
import { useClientDebt, useCanAddDebt } from '@/hooks/useClientDebt';
import { CustomerInfo } from '@/types/pos';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentModalProps {
  transaction: {
    items: any[];
    customer: CustomerInfo;
    subtotal: number;
    discount: number;
    total: number;
    timestamp: Date;
  };
  onPaymentComplete: (paymentData: any) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

type PaymentMethod = 'cash' | 'card' | 'mobile' | 'insurance' | 'caution';

const PaymentModal = ({ transaction, onPaymentComplete, onClose, isSaving = false }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const { formatAmount, roundForCurrency } = useCurrencyFormatting();
  const { t } = useLanguage();

  // Utiliser le hook de calcul centralisé
  const calculations = usePOSCalculations(transaction.items, transaction.customer);
  
  // Vérifier la dette du client si paiement partiel
  const { totalDette, isLoading: debtLoading } = useClientDebt(
    transaction.customer.id,
    transaction.customer.limite_credit ?? 0
  );

  // Déterminer le montant final à payer
  const totalAPayer = calculations.totalAPayer;

  // Modes de paiement de base
  const basePaymentMethods = [
    { 
      id: 'cash' as PaymentMethod, 
      label: t('cash'), 
      icon: DollarSign, 
      color: 'bg-green-500',
      always: true
    },
    { 
      id: 'card' as PaymentMethod, 
      label: t('bankCard'), 
      icon: CreditCard, 
      color: 'bg-blue-500',
      always: true
    },
    { 
      id: 'mobile' as PaymentMethod, 
      label: t('mobileMoney'), 
      icon: Smartphone, 
      color: 'bg-purple-500',
      always: true
    },
    { 
      id: 'insurance' as PaymentMethod, 
      label: t('insurance'), 
      icon: Building2, 
      color: 'bg-orange-500',
      always: false,
      condition: calculations.estAssure
    },
    { 
      id: 'caution' as PaymentMethod, 
      label: t('caution'), 
      icon: Wallet, 
      color: 'bg-teal-500',
      always: false,
      condition: calculations.peutPayerParCaution
    }
  ];

  // Filtrer les modes de paiement disponibles
  const availablePaymentMethods = useMemo(() => {
    return basePaymentMethods.filter(m => m.always || m.condition);
  }, [calculations.estAssure, calculations.peutPayerParCaution]);

  // Calcul de la monnaie à rendre
  const amountReceivedNum = parseFloat(amountReceived) || 0;
  const change = paymentMethod === 'cash' ? Math.max(0, amountReceivedNum - totalAPayer) : 0;
  
  // Validation du paiement
  const isValidPayment = useMemo(() => {
    if (paymentMethod === 'cash') {
      return amountReceivedNum >= totalAPayer;
    }
    if (paymentMethod === 'caution') {
      return calculations.peutPayerParCaution;
    }
    return true; // Autres modes: pas de validation montant
  }, [paymentMethod, amountReceivedNum, totalAPayer, calculations.peutPayerParCaution]);

  // Vérification limite crédit si reste à payer
  const resteAPayer = paymentMethod === 'cash' && amountReceivedNum < totalAPayer
    ? totalAPayer - amountReceivedNum
    : 0;

  const { canAddDebt } = useCanAddDebt(
    transaction.customer.id,
    transaction.customer.limite_credit ?? 0,
    resteAPayer
  );

  // Validation avant paiement
  const canProceed = useMemo(() => {
    // Si reste à payer, vérifier peut_prendre_bon et limite crédit
    if (resteAPayer > 0) {
      if (!transaction.customer.peut_prendre_bon) {
        return false;
      }
      if (!canAddDebt) {
        return false;
      }
    }
    return isValidPayment;
  }, [resteAPayer, transaction.customer.peut_prendre_bon, canAddDebt, isValidPayment]);

  const handlePayment = async () => {
    if (!canProceed) return;
    
    setProcessing(true);
    
    const paymentData = {
      method: paymentMethod,
      amount: totalAPayer,
      amountReceived: paymentMethod === 'cash' ? amountReceivedNum : totalAPayer,
      change: change,
      timestamp: new Date(),
      reference: `PAY-${Date.now()}`,
      autoPrint: autoPrintTicket,
      // Données de calcul enrichies
      calculations: {
        sousTotalTTC: calculations.sousTotalTTC,
        partAssurance: calculations.partAssurance,
        partClient: calculations.partClient,
        montantTicketModerateur: calculations.montantTicketModerateur,
        montantRemise: calculations.montantRemise,
        totalAPayer: calculations.totalAPayer,
        cautionUtilisee: paymentMethod === 'caution',
        montantCautionUtilisee: paymentMethod === 'caution' ? totalAPayer : 0
      }
    };

    await onPaymentComplete(paymentData);
    setProcessing(false);
  };

  // Auto-fill le montant reçu au total quand on change de mode
  React.useEffect(() => {
    if (paymentMethod === 'cash') {
      const roundedAmount = roundForCurrency(totalAPayer);
      setAmountReceived(roundedAmount.toString());
    }
  }, [paymentMethod, totalAPayer, roundForCurrency]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('finalizeTransaction')}
          </DialogTitle>
          <DialogDescription>
            {t('selectPaymentMode')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Summary - Enrichi */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {/* Total HT */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('totalHT')}:</span>
                  <span>{formatAmount(calculations.totalHT)}</span>
                </div>
                
                {/* TVA */}
                {calculations.montantTVA > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('tvaTax')}:</span>
                    <span>{formatAmount(calculations.montantTVA)}</span>
                  </div>
                )}
                
                {/* Centime Additionnel */}
                {calculations.montantCentime > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('additionalCentime')}:</span>
                    <span>{formatAmount(calculations.montantCentime)}</span>
                  </div>
                )}
                
                <Separator />
                
                {/* Sous-total TTC */}
                <div className="flex justify-between text-sm font-medium">
                  <span>{t('subtotalTTC')}:</span>
                  <span>{formatAmount(calculations.sousTotalTTC)}</span>
                </div>
                
                {/* Couverture Assurance */}
                {calculations.estAssure && calculations.partAssurance > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-orange-600">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {t('insuranceCoverage')} ({calculations.tauxCouverture}%):
                      </span>
                      <span>-{formatAmount(calculations.partAssurance)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>{t('clientPart')}:</span>
                      <span>{formatAmount(calculations.partClient)}</span>
                    </div>
                  </>
                )}
                
                {/* Ticket Modérateur (si non assuré) */}
                {!calculations.estAssure && calculations.montantTicketModerateur > 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>{t('moderatorTicketRate')} ({calculations.tauxTicketModerateur}%):</span>
                    <span>-{formatAmount(calculations.montantTicketModerateur)}</span>
                  </div>
                )}
                
                {/* Remise automatique */}
                {calculations.montantRemise > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('autoDiscount')} ({calculations.tauxRemise}%):</span>
                    <span>-{formatAmount(calculations.montantRemise)}</span>
                  </div>
                )}
                
                <Separator />
                
                {/* Total à payer */}
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('totalToPay')}:</span>
                  <span className="text-primary">{formatAmount(totalAPayer)}</span>
                </div>

                {/* Indicateur Caution disponible */}
                {calculations.cautionUtilisable && (
                  <div className="flex items-center justify-between p-2 bg-teal-50 dark:bg-teal-950 rounded-md text-sm">
                    <span className="flex items-center gap-1 text-teal-700 dark:text-teal-300">
                      <Wallet className="h-4 w-4" />
                      {t('cautionAvailable')}:
                    </span>
                    <span className="font-medium text-teal-700 dark:text-teal-300">
                      {formatAmount(calculations.cautionDisponible)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">{t('paymentMethod')}</Label>
            <div className="grid grid-cols-2 gap-3">
              {availablePaymentMethods.map((method) => {
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
                <Label htmlFor="amount">{t('amountReceived')}</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder={t('amountInFCFA')}
                />
              </div>
              
              {change > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-green-800 dark:text-green-200 font-medium">{t('changeToReturn')}:</span>
                    <span className="text-green-800 dark:text-green-200 font-bold text-lg">
                      {formatAmount(change)}
                    </span>
                  </div>
                </div>
              )}
              
              {!isValidPayment && amountReceived && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                  <span className="text-red-800 dark:text-red-200 text-sm">
                    {t('amountInsufficient')}
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-blue-800 dark:text-blue-200 text-sm text-center">
                {t('insertCard')}
              </p>
            </div>
          )}

          {paymentMethod === 'mobile' && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md">
              <p className="text-purple-800 dark:text-purple-200 text-sm text-center">
                {t('proceedMobile')}
              </p>
            </div>
          )}

          {paymentMethod === 'insurance' && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md">
              <div className="text-center space-y-2">
                <p className="text-orange-800 dark:text-orange-200 text-sm">
                  {t('insurancePayment')}
                </p>
                {transaction.customer.assureur_libelle && (
                  <Badge variant="outline" className="text-orange-700 dark:text-orange-300">
                    {transaction.customer.assureur_libelle}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {paymentMethod === 'caution' && (
            <div className="p-4 bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 rounded-md">
              <div className="text-center space-y-2">
                <p className="text-teal-800 dark:text-teal-200 text-sm">
                  {t('cautionPayment')}
                </p>
                <div className="flex justify-center gap-4 text-sm">
                  <span className="text-muted-foreground">{t('currentCaution')}:</span>
                  <span className="font-medium text-teal-700 dark:text-teal-300">
                    {formatAmount(calculations.cautionDisponible)}
                  </span>
                </div>
                <div className="flex justify-center gap-4 text-sm">
                  <span className="text-muted-foreground">{t('afterTransaction')}:</span>
                  <span className="font-medium text-teal-700 dark:text-teal-300">
                    {formatAmount(calculations.cautionDisponible - totalAPayer)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Alertes et validations */}
          {resteAPayer > 0 && (
            <div className="space-y-2">
              {!transaction.customer.peut_prendre_bon && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800 dark:text-red-200 text-sm">
                    {t('clientCannotCredit')}
                  </span>
                </div>
              )}
              
              {transaction.customer.peut_prendre_bon && !canAddDebt && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800 dark:text-red-200 text-sm">
                    {t('creditLimitReached')} ({formatAmount(transaction.customer.limite_credit ?? 0)}). 
                    {t('currentDebt')}: {formatAmount(totalDette)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Switch impression automatique */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <Label htmlFor="autoPrintTicket" className="flex items-center gap-2 cursor-pointer">
              <Printer className="h-4 w-4" />
              {t('autoPrintTicket')}
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
              {t('cancel')}
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={!canProceed || processing || isSaving}
              className="flex-1"
            >
              {(processing || isSaving) ? (
                <>
                  <Calculator className="h-4 w-4 mr-2 animate-spin" />
                  {isSaving ? t('loading') : t('processingPayment')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('validatePayment')}
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
