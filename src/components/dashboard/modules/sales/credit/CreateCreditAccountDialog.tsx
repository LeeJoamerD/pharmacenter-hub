import { useState } from "react";
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

interface CreateCreditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

export const CreateCreditAccountDialog = ({
  open,
  onOpenChange,
  onSubmit
}: CreateCreditAccountDialogProps) => {
  const { formatPrice } = useCurrency();
  const [formData, setFormData] = useState({
    nom_complet: '',
    telephone: '',
    email: '',
    limite_credit: 0,
    type_client: 'Particulier',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom_complet || formData.limite_credit <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    onSubmit(formData);
    setFormData({
      nom_complet: '',
      telephone: '',
      email: '',
      limite_credit: 0,
      type_client: 'Particulier',
      notes: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau Compte Crédit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom_complet">Nom Complet *</Label>
            <Input
              id="nom_complet"
              value={formData.nom_complet}
              onChange={(e) => setFormData({ ...formData, nom_complet: e.target.value })}
              placeholder="Nom du client"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="+242..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type_client">Type de Client</Label>
            <Select
              value={formData.type_client}
              onValueChange={(value) => setFormData({ ...formData, type_client: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Particulier">Particulier</SelectItem>
                <SelectItem value="Entreprise">Entreprise</SelectItem>
                <SelectItem value="Assuré">Assuré</SelectItem>
                <SelectItem value="Personnel">Personnel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limite_credit">Limite de Crédit * (FCFA)</Label>
            <Input
              id="limite_credit"
              type="number"
              min="0"
              step="1000"
              value={formData.limite_credit}
              onChange={(e) => setFormData({ ...formData, limite_credit: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              required
            />
            <p className="text-xs text-muted-foreground">
              Crédit disponible au démarrage: {formatPrice(formData.limite_credit)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations complémentaires..."
              rows={3}
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
              Créer le Compte
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
