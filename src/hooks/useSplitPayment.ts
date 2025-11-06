import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface PaymentMethod {
  id: string;
  method: 'Espèces' | 'Carte' | 'Mobile Money' | 'Assurance';
  amount: number;
  reference?: string;
}

/**
 * Hook pour gérer les paiements multiples (split payment)
 * Supporte jusqu'à 3 modes de paiement simultanés
 */
export const useSplitPayment = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentMethod[]>([
    { id: '1', method: 'Espèces', amount: 0 }
  ]);

  // Méthodes de paiement disponibles
  const availableMethods: Array<'Espèces' | 'Carte' | 'Mobile Money' | 'Assurance'> = [
    'Espèces',
    'Carte',
    'Mobile Money',
    'Assurance',
  ];

  // Ajouter un mode de paiement
  const addPaymentMethod = () => {
    if (payments.length >= 3) {
      toast({
        title: 'Limite atteinte',
        description: 'Maximum 3 modes de paiement autorisés',
        variant: 'destructive',
      });
      return;
    }

    const newPayment: PaymentMethod = {
      id: Date.now().toString(),
      method: 'Espèces',
      amount: 0,
    };

    setPayments([...payments, newPayment]);
  };

  // Retirer un mode de paiement
  const removePaymentMethod = (id: string) => {
    if (payments.length === 1) {
      toast({
        title: 'Impossible',
        description: 'Au moins un mode de paiement est requis',
        variant: 'destructive',
      });
      return;
    }

    setPayments(payments.filter(p => p.id !== id));
  };

  // Mettre à jour un mode de paiement
  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
    setPayments(payments.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  // Calculer la répartition des paiements
  const calculateSplit = (total: number): { valid: boolean; remaining: number; paid: number } => {
    const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = total - paid;
    const valid = Math.abs(remaining) < 0.01; // Tolérance de 1 centime

    return { valid, remaining, paid };
  };

  // Valider la répartition
  const validateSplit = (total: number): boolean => {
    const { valid, remaining } = calculateSplit(total);

    if (!valid) {
      toast({
        title: 'Montant incorrect',
        description: remaining > 0 
          ? `Il manque ${remaining.toFixed(2)} FCFA`
          : `Excédent de ${Math.abs(remaining).toFixed(2)} FCFA`,
        variant: 'destructive',
      });
      return false;
    }

    // Vérifier que chaque paiement a un montant > 0
    const invalidPayments = payments.filter(p => p.amount <= 0);
    if (invalidPayments.length > 0) {
      toast({
        title: 'Montants invalides',
        description: 'Tous les modes de paiement doivent avoir un montant supérieur à 0',
        variant: 'destructive',
      });
      return false;
    }

    // Vérifier les références pour carte et mobile money
    const missingReferences = payments.filter(p => 
      (p.method === 'Carte' || p.method === 'Mobile Money') && !p.reference
    );

    if (missingReferences.length > 0) {
      toast({
        title: 'Références manquantes',
        description: 'Les paiements par Carte et Mobile Money nécessitent une référence',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Traiter le paiement multiple
  const processSplitPayment = async (
    total: number,
    onPaymentComplete: (payments: PaymentMethod[]) => void
  ) => {
    if (!validateSplit(total)) {
      return;
    }

    try {
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 500));

      onPaymentComplete(payments);

      toast({
        title: 'Paiement réussi',
        description: `Paiement de ${total.toFixed(2)} FCFA effectué avec succès`,
      });
    } catch (error) {
      toast({
        title: 'Erreur de paiement',
        description: 'Une erreur est survenue lors du traitement du paiement',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Enregistrer le paiement dans la DB
  const recordPayment = (
    method: string,
    amount: number,
    reference?: string
  ): Record<string, any> => {
    return {
      mode_paiement: method,
      montant: amount,
      reference_paiement: reference,
      date_paiement: new Date().toISOString(),
    };
  };

  // Réinitialiser les paiements
  const resetPayments = () => {
    setPayments([{ id: '1', method: 'Espèces', amount: 0 }]);
  };

  // Auto-distribution (répartir équitablement le montant)
  const distributeEvenly = (total: number) => {
    const amountPerMethod = total / payments.length;
    setPayments(payments.map(p => ({ ...p, amount: amountPerMethod })));
  };

  return {
    payments,
    availableMethods,
    addPaymentMethod,
    removePaymentMethod,
    updatePaymentMethod,
    calculateSplit,
    validateSplit,
    processSplitPayment,
    recordPayment,
    resetPayments,
    distributeEvenly,
  };
};
