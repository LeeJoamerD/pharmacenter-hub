import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePromotions } from '@/hooks/usePromotions';

interface EditPromotionDialogProps {
  promotion: any;
  onClose: () => void;
}

const EditPromotionDialog = ({ promotion, onClose }: EditPromotionDialogProps) => {
  const { updatePromotion } = usePromotions();
  const [formData, setFormData] = useState({
    nom: promotion.nom,
    description: promotion.description || '',
    type_promotion: promotion.type_promotion,
    valeur_promotion: promotion.valeur_promotion,
    montant_minimum: promotion.montant_minimum,
    date_debut: promotion.date_debut,
    date_fin: promotion.date_fin,
    heure_debut: promotion.heure_debut || '',
    heure_fin: promotion.heure_fin || '',
    est_actif: promotion.est_actif,
    cible_clients: promotion.cible_clients,
    limite_utilisations: promotion.limite_utilisations,
    limite_par_client: promotion.limite_par_client,
    priorite: promotion.priorite,
    combinable: promotion.combinable,
    code_promo: promotion.code_promo || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePromotion({ id: promotion.id, updates: formData });
      onClose();
    } catch (error) {
      console.error('Error updating promotion:', error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la Promotion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nom">Nom de la promotion *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="type_promotion">Type de promotion *</Label>
              <Select
                value={formData.type_promotion}
                onValueChange={(value: any) => setFormData({ ...formData, type_promotion: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pourcentage">Pourcentage</SelectItem>
                  <SelectItem value="Montant fixe">Montant fixe</SelectItem>
                  <SelectItem value="Achetez-Obtenez">Achetez-Obtenez</SelectItem>
                  <SelectItem value="Quantité">Quantité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="valeur_promotion">
                Valeur *
                {formData.type_promotion === 'Pourcentage' && ' (%)'}
                {formData.type_promotion === 'Montant fixe' && ' (FCFA)'}
              </Label>
              <Input
                id="valeur_promotion"
                type="number"
                value={formData.valeur_promotion}
                onChange={(e) => setFormData({ ...formData, valeur_promotion: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <Label htmlFor="montant_minimum">Montant minimum (FCFA)</Label>
              <Input
                id="montant_minimum"
                type="number"
                value={formData.montant_minimum}
                onChange={(e) => setFormData({ ...formData, montant_minimum: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="cible_clients">Clients ciblés *</Label>
              <Select
                value={formData.cible_clients}
                onValueChange={(value: any) => setFormData({ ...formData, cible_clients: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous">Tous</SelectItem>
                  <SelectItem value="Fidélité">Programme Fidélité</SelectItem>
                  <SelectItem value="Nouveaux">Nouveaux clients</SelectItem>
                  <SelectItem value="VIP">Clients VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date_debut">Date de début *</Label>
              <Input
                id="date_debut"
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="date_fin">Date de fin *</Label>
              <Input
                id="date_fin"
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="heure_debut">Heure de début</Label>
              <Input
                id="heure_debut"
                type="time"
                value={formData.heure_debut}
                onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="heure_fin">Heure de fin</Label>
              <Input
                id="heure_fin"
                type="time"
                value={formData.heure_fin}
                onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="limite_utilisations">Limite d'utilisations</Label>
              <Input
                id="limite_utilisations"
                type="number"
                value={formData.limite_utilisations || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  limite_utilisations: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="Illimité"
              />
            </div>

            <div>
              <Label htmlFor="limite_par_client">Limite par client</Label>
              <Input
                id="limite_par_client"
                type="number"
                value={formData.limite_par_client}
                onChange={(e) => setFormData({ ...formData, limite_par_client: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="priorite">Priorité</Label>
              <Input
                id="priorite"
                type="number"
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="code_promo">Code promo (optionnel)</Label>
              <Input
                id="code_promo"
                value={formData.code_promo}
                onChange={(e) => setFormData({ ...formData, code_promo: e.target.value })}
                placeholder="Ex: PROMO2024"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="est_actif"
                checked={formData.est_actif}
                onCheckedChange={(checked) => setFormData({ ...formData, est_actif: checked })}
              />
              <Label htmlFor="est_actif">Promotion active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="combinable"
                checked={formData.combinable}
                onCheckedChange={(checked) => setFormData({ ...formData, combinable: checked })}
              />
              <Label htmlFor="combinable">Combinable avec d'autres promotions</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPromotionDialog;
