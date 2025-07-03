import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, DollarSign, User, FileText } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CashSessionFormProps {
  sessionId?: number;
  onClose: () => void;
  onSubmit: (cashRegisterId: number, agentId: number, amount: number, notes?: string) => Promise<any>;
  loading: boolean;
  isClosing?: boolean;
}

const CashSessionForm = ({ sessionId, onClose, onSubmit, loading, isClosing = false }: CashSessionFormProps) => {
  const [formData, setFormData] = useState({
    cashRegisterId: '',
    agentId: '',
    amount: '',
    notes: ''
  });
  const { formatPrice } = useCurrency();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isClosing && sessionId) {
        await onSubmit(sessionId, 0, parseFloat(formData.amount), formData.notes);
      } else {
        await onSubmit(
          parseInt(formData.cashRegisterId),
          parseInt(formData.agentId),
          parseFloat(formData.amount),
          formData.notes
        );
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {isClosing ? 'Fermer la Session de Caisse' : 'Ouvrir une Session de Caisse'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isClosing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cashRegister" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Caisse
                </Label>
                <Select value={formData.cashRegisterId} onValueChange={(value) => handleInputChange('cashRegisterId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une caisse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Caisse 1 - Principale</SelectItem>
                    <SelectItem value="2">Caisse 2 - Secondaire</SelectItem>
                    <SelectItem value="3">Caisse 3 - Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Agent
                </Label>
                <Select value={formData.agentId} onValueChange={(value) => handleInputChange('agentId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Marie Dupont</SelectItem>
                    <SelectItem value="2">Jean Martin</SelectItem>
                    <SelectItem value="3">Sophie Bernard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {isClosing ? 'Montant de Fermeture' : 'Montant d\'Ouverture'}
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                FCFA
              </span>
            </div>
            {isClosing && (
              <p className="text-xs text-muted-foreground">
                Entrez le montant comptabilisé en caisse
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes (optionnel)
            </Label>
            <Textarea
              id="notes"
              placeholder={isClosing ? "Observations sur la session..." : "Notes d'ouverture..."}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.amount || (!isClosing && (!formData.cashRegisterId || !formData.agentId))}
              variant={isClosing ? "destructive" : "default"}
            >
              {loading ? 'Traitement...' : (isClosing ? 'Fermer la Session' : 'Ouvrir la Session')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CashSessionForm;