import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAccount?: any;
  onSubmit: (data: any) => void;
}

export const RecordPaymentDialog = ({
  open,
  onOpenChange,
  selectedAccount,
  onSubmit
}: RecordPaymentDialogProps) => {
  const { formatPrice } = useCurrency();
  const [formData, setFormData] = useState({
    montant: 0,
    mode_paiement: 'especes',
    reference_paiement: '',
    notes: ''
  });

  useEffect(() => {
    if (selectedAccount) {
      setFormData(prev => ({
        ...prev,
        montant: Math.min(selectedAccount.credit_actuel || 0, prev.montant)
      }));
    }
  }, [selectedAccount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || formData.montant <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }
    if (formData.montant > (selectedAccount.credit_actuel || 0)) {
      alert('Le montant ne peut pas dépasser le crédit actuel');
      return;
    }
    onSubmit({
      client_id: selectedAccount.id,
      ...formData
    });
    setFormData({
      montant: 0,
      mode_paiement: 'especes',
      reference_paiement: '',
      notes: ''
    });
    onOpenChange(false);
  };

  const nouveauCredit = (selectedAccount?.credit_actuel || 0) - formData.montant;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un Paiement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedAccount && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Client:</span>
                <span className="text-sm">{selectedAccount.nom_complet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Crédit Actuel:</span>
                <span className="text-sm font-semibold text-orange-600">
                  {formatPrice(selectedAccount.credit_actuel || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Limite:</span>
                <span className="text-sm">{formatPrice(selectedAccount.limite_credit || 0)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="montant">Montant du Paiement * (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              min="0"
              max={selectedAccount?.credit_actuel || 0}
              step="100"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              required
            />
            {formData.montant > 0 && (
              <p className="text-xs text-green-600">
                Nouveau crédit: {formatPrice(nouveauCredit)} / Disponible: {formatPrice((selectedAccount?.limite_credit || 0) - nouveauCredit)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode_paiement">Mode de Paiement</Label>
            <Select
              value={formData.mode_paiement}
              onValueChange={(value) => setFormData({ ...formData, mode_paiement: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="carte">Carte Bancaire</SelectItem>
                <SelectItem value="mobile">Mobile Money</SelectItem>
                <SelectItem value="virement">Virement Bancaire</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_paiement">Référence (optionnel)</Label>
            <Input
              id="reference_paiement"
              value={formData.reference_paiement}
              onChange={(e) => setFormData({ ...formData, reference_paiement: e.target.value })}
              placeholder="Numéro de transaction..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations complémentaires..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer le Paiement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
