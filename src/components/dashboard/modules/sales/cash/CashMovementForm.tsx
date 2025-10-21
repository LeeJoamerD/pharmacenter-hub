import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownLeft, ArrowUpRight, DollarSign, FileText, Receipt, ShoppingCart, CreditCard } from 'lucide-react';
import { CashMovement } from '@/hooks/useCashRegister';

interface CashMovementFormProps {
  sessionId: string;
  onClose: () => void;
  onSubmit: (
    sessionId: string,
    type: CashMovement['type_mouvement'],
    amount: number,
    description: string,
    reference?: string
  ) => Promise<any>;
  loading: boolean;
}

const CashMovementForm = ({ sessionId, onClose, onSubmit, loading }: CashMovementFormProps) => {
  const [formData, setFormData] = useState({
    type: '' as CashMovement['type_mouvement'] | '',
    amount: '',
    description: '',
    reference: ''
  });

  const movementTypes = [
    { value: 'entree', label: 'Entrée d\'argent', icon: ArrowDownLeft, color: 'text-green-600', description: 'Ajout d\'argent en caisse' },
    { value: 'sortie', label: 'Sortie d\'argent', icon: ArrowUpRight, color: 'text-red-600', description: 'Retrait d\'argent de la caisse' },
    { value: 'vente', label: 'Vente', icon: ShoppingCart, color: 'text-blue-600', description: 'Encaissement d\'une vente' },
    { value: 'remboursement', label: 'Remboursement', icon: CreditCard, color: 'text-orange-600', description: 'Remboursement client' },
    { value: 'depense', label: 'Dépense', icon: Receipt, color: 'text-purple-600', description: 'Dépense opérationnelle' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type) return;

    try {
      const amount = parseFloat(formData.amount);
      // Pour les sorties, remboursements et dépenses, on inverse le signe
      const adjustedAmount = (['sortie', 'remboursement', 'depense'].includes(formData.type)) 
        ? -Math.abs(amount) 
        : Math.abs(amount);

      await onSubmit(
        sessionId,
        formData.type,
        adjustedAmount,
        formData.description,
        formData.reference || undefined
      );
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du mouvement:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedType = movementTypes.find(t => t.value === formData.type);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedType ? (
              <selectedType.icon className={`h-5 w-5 ${selectedType.color}`} />
            ) : (
              <DollarSign className="h-5 w-5" />
            )}
            Enregistrer un Mouvement de Caisse
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type de Mouvement</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                {movementTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className={`h-4 w-4 ${type.color}`} />
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-xs text-muted-foreground">
                {selectedType.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Montant
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
            {selectedType && ['sortie', 'remboursement', 'depense'].includes(formData.type) && (
              <p className="text-xs text-orange-600">
                Ce montant sera automatiquement déduit du solde de la caisse
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Description détaillée du mouvement..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Référence (optionnel)
            </Label>
            <Input
              id="reference"
              placeholder="Numéro de reçu, facture, bon de commande..."
              value={formData.reference}
              onChange={(e) => handleInputChange('reference', e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.type || !formData.amount || !formData.description}
              variant={selectedType && ['sortie', 'remboursement', 'depense'].includes(formData.type) ? "destructive" : "default"}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer le Mouvement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CashMovementForm;