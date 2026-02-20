/**
 * Modal pour l'enregistrement des dépenses de caisse
 * Avec génération automatique d'écriture comptable
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  BookOpen,
  Wallet
} from 'lucide-react';
import { useCashExpenseWithAccounting, EXPENSE_CATEGORIES } from '@/hooks/useCashExpenseWithAccounting';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useToast } from '@/hooks/use-toast';

interface CashExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  currentBalance?: number;
  onExpenseRecorded?: () => void;
}

export const CashExpenseModal: React.FC<CashExpenseModalProps> = ({
  open,
  onOpenChange,
  sessionId,
  currentBalance = 0,
  onExpenseRecorded
}) => {
  const { toast } = useToast();
  const { formatAmount } = useCurrencyFormatting();
  const { submitExpense, isSubmitting, expenseCategories } = useCashExpenseWithAccounting();

  // États du formulaire
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (open) {
      setCategoryId('');
      setAmount('');
      setDescription('');
      setReference('');
      setError(null);
    }
  }, [open]);

  // Trouver la catégorie sélectionnée
  const selectedCategory = expenseCategories.find(c => c.id === categoryId);
  const amountValue = parseFloat(amount) || 0;
  const isValidAmount = amountValue > 0 && amountValue <= currentBalance;

  const handleSubmit = async () => {
    setError(null);

    // Validations
    if (!categoryId) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }

    if (!amount || amountValue <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    if (amountValue > currentBalance) {
      setError(`Le montant dépasse le solde de caisse (${formatAmount(currentBalance)})`);
      return;
    }

    if (!description.trim()) {
      setError('Veuillez saisir une description');
      return;
    }

    // Soumettre la dépense
    const result = await submitExpense({
      categoryId,
      amount: amountValue,
      description: description.trim(),
      reference: reference.trim() || undefined,
      sessionId
    });

    if (result.success) {
      toast({
        title: 'Dépense enregistrée',
        description: result.ecritureId 
          ? 'Mouvement de caisse et écriture comptable créés'
          : result.error || 'Mouvement de caisse enregistré'
      });

      if (result.error) {
        // Avertissement si l'écriture comptable n'a pas pu être créée
        toast({
          title: 'Attention',
          description: result.error,
          variant: 'default'
        });
      }

      onExpenseRecorded?.();
      onOpenChange(false);
    } else {
      setError(result.error || 'Erreur lors de l\'enregistrement');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-destructive" />
            Enregistrer une dépense de caisse
          </DialogTitle>
          <DialogDescription>
            Cette dépense sera déduite de la caisse et une écriture comptable sera générée automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {/* Solde actuel */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Solde de caisse actuel
            </span>
            <Badge variant="outline" className="text-lg font-bold">
              {formatAmount(currentBalance)}
            </Badge>
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie de dépense *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex flex-col">
                      <span>{cat.label}</span>
                      <span className="text-xs text-muted-foreground">
                        Compte {cat.accountNumber}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compte comptable correspondant */}
          {selectedCategory && (
            <div className="flex items-center gap-2 p-2 bg-accent rounded text-sm">
              <BookOpen className="h-4 w-4 text-accent-foreground" />
              <span className="text-muted-foreground">Écriture sur compte:</span>
              <Badge variant="secondary">
                {selectedCategory.accountNumber} - {selectedCategory.accountLabel}
              </Badge>
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={!isValidAmount && amount ? 'border-destructive' : ''}
            />
            {amountValue > currentBalance && (
              <p className="text-xs text-destructive">
                Le montant dépasse le solde de caisse
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Décrivez la dépense..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Référence / Justificatif */}
          <div className="space-y-2">
            <Label htmlFor="reference">N° Justificatif (optionnel)</Label>
            <Input
              id="reference"
              placeholder="N° facture, reçu, etc."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Récapitulatif */}
          {amountValue > 0 && selectedCategory && (
            <div className="p-3 border rounded-lg space-y-2 bg-muted/30">
              <p className="text-sm font-medium">Récapitulatif de l'opération</p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Catégorie:</span>
                  <span>{selectedCategory.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant:</span>
                  <span className="font-bold text-destructive">-{formatAmount(amountValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nouveau solde:</span>
                  <span className="font-medium">{formatAmount(currentBalance - amountValue)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 mt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button 
            variant="destructive"
            onClick={handleSubmit} 
            disabled={isSubmitting || !categoryId || !isValidAmount || !description.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Enregistrer la dépense
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
