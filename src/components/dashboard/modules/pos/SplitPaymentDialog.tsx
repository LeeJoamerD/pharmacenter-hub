import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSplitPayment } from '@/hooks/useSplitPayment';
import { usePOSCalculations } from '@/hooks/usePOSCalculations';
import { Plus, Trash2, CreditCard, Banknote, Wallet, Smartphone, Building2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerInfo } from '@/types/pos';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface SplitPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onPaymentComplete: (payments: any[]) => void;
  // Nouvelles props pour les calculs avancés
  cartItems?: any[];
  customer?: CustomerInfo;
}

export const SplitPaymentDialog: React.FC<SplitPaymentDialogProps> = ({
  open,
  onOpenChange,
  totalAmount,
  onPaymentComplete,
  cartItems = [],
  customer
}) => {
  const { formatAmount } = useCurrencyFormatting();
  
  // Calculs avancés si cartItems et customer sont fournis
  const defaultCustomer: CustomerInfo = { type: 'Ordinaire', discount_rate: 0 };
  const calculations = usePOSCalculations(cartItems, customer || defaultCustomer);
  
  // Utiliser le montant calculé si disponible, sinon le montant passé
  const effectiveTotal = cartItems.length > 0 ? calculations.totalAPayer : totalAmount;
  
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

  const { paid, remaining } = calculateSplit(effectiveTotal);

  // Déterminer les méthodes de paiement disponibles
  const availableMethods = useMemo(() => {
    const methods: Array<{ value: string; label: string; icon: React.ReactNode }> = [
      { value: 'Espèces', label: 'Espèces', icon: <Banknote className="h-4 w-4" /> },
      { value: 'Carte', label: 'Carte', icon: <CreditCard className="h-4 w-4" /> },
      { value: 'Mobile Money', label: 'Mobile Money', icon: <Smartphone className="h-4 w-4" /> },
    ];
    
    // Ajouter Assurance si client assuré
    if (customer && calculations.estAssure) {
      methods.push({ 
        value: 'Assurance', 
        label: 'Assurance', 
        icon: <Building2 className="h-4 w-4" /> 
      });
    }
    
    // Ajouter Caution si disponible et suffisante
    if (customer && calculations.cautionUtilisable && calculations.cautionDisponible > 0) {
      methods.push({ 
        value: 'Caution', 
        label: `Caution (${formatAmount(calculations.cautionDisponible)})`, 
        icon: <Wallet className="h-4 w-4" /> 
      });
    }
    
    return methods;
  }, [customer, calculations.estAssure, calculations.cautionUtilisable, calculations.cautionDisponible, formatAmount]);

  const handleSubmit = async () => {
    const isValid = validateSplit(effectiveTotal);
    
    if (!isValid) {
      return;
    }

    // Vérifier les paiements par caution
    const cautionPayment = payments.find(p => p.method === 'Caution' as any);
    if (cautionPayment) {
      if (!customer || calculations.cautionDisponible < cautionPayment.amount) {
        toast.error('Caution insuffisante pour ce montant');
        return;
      }
    }

    await processSplitPayment(effectiveTotal, async (payments) => {
      // Ajouter les informations de calcul
      const enrichedPayments = payments.map(p => ({
        ...p,
        isCaution: p.method === 'Caution'
      }));
      
      onPaymentComplete(enrichedPayments);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paiement Fractionné
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé des calculs si disponibles */}
          {cartItems.length > 0 && customer && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total TTC:</span>
                <span>{formatAmount(calculations.sousTotalTTC)}</span>
              </div>
              
              {calculations.estAssure && calculations.partAssurance > 0 && (
                <>
                  <div className="flex justify-between text-sm text-orange-600">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Couverture Assurance ({calculations.tauxCouverture}%):
                    </span>
                    <span>-{formatAmount(calculations.partAssurance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Part Client:</span>
                    <span>{formatAmount(calculations.partClient)}</span>
                  </div>
                </>
              )}
              
              {calculations.montantRemise > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise ({calculations.tauxRemise}%):</span>
                  <span>-{formatAmount(calculations.montantRemise)}</span>
                </div>
              )}
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-bold">
                <span>Total à payer:</span>
                <span className="text-primary">{formatAmount(effectiveTotal)}</span>
              </div>
            </div>
          )}

          {/* Résumé simple si pas de calculs avancés */}
          {(cartItems.length === 0 || !customer) && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Montant Total</p>
                <p className="text-2xl font-bold">{formatAmount(effectiveTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payé</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(paid)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Restant</p>
                <p className={`text-2xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatAmount(remaining)}
                </p>
              </div>
            </div>
          )}

          {/* Progression du paiement */}
          {cartItems.length > 0 && customer && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Payé</p>
                <p className="text-xl font-bold text-green-600">{formatAmount(paid)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Restant</p>
                <p className={`text-xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatAmount(remaining)}
                </p>
              </div>
            </div>
          )}

          {/* Méthodes de paiement */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Méthodes de Paiement</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => distributeEvenly(effectiveTotal)}
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
                        {availableMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center gap-2">
                              {method.icon}
                              {method.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Montant (FCFA)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={effectiveTotal}
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

                {/* Info pour paiement par caution */}
                {payment.method === ('Caution' as any) && customer && (
                  <div className="p-2 bg-teal-50 dark:bg-teal-950 rounded text-sm text-teal-700 dark:text-teal-300">
                    <div className="flex justify-between">
                      <span>Caution disponible:</span>
                      <span className="font-medium">{formatAmount(calculations.cautionDisponible)}</span>
                    </div>
                    {payment.amount > 0 && (
                      <div className="flex justify-between">
                        <span>Après débit:</span>
                        <span className="font-medium">
                          {formatAmount(Math.max(0, calculations.cautionDisponible - payment.amount))}
                        </span>
                      </div>
                    )}
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
