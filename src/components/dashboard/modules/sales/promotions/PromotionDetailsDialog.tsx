import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PromotionDetailsDialogProps {
  promotion: any;
  onClose: () => void;
}

const PromotionDetailsDialog = ({ promotion, onClose }: PromotionDetailsDialogProps) => {
  const { formatPrice } = useCurrency();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails de la Promotion</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nom</p>
              <p className="text-base font-semibold">{promotion.nom}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Statut</p>
              <Badge variant={promotion.est_actif ? "default" : "secondary"}>
                {promotion.est_actif ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base">{promotion.description || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p className="text-base">{promotion.type_promotion}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur</p>
              <p className="text-base font-semibold">
                {promotion.type_promotion === 'Pourcentage' ? `${promotion.valeur_promotion}%` :
                 promotion.type_promotion === 'Montant fixe' ? formatPrice(promotion.valeur_promotion) :
                 `${promotion.valeur_promotion}`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Montant minimum</p>
              <p className="text-base">{formatPrice(promotion.montant_minimum)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clients ciblés</p>
              <p className="text-base">{promotion.cible_clients}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date de début</p>
              <p className="text-base">{new Date(promotion.date_debut).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date de fin</p>
              <p className="text-base">{new Date(promotion.date_fin).toLocaleDateString('fr-FR')}</p>
            </div>
            {promotion.heure_debut && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Heure de début</p>
                <p className="text-base">{promotion.heure_debut}</p>
              </div>
            )}
            {promotion.heure_fin && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Heure de fin</p>
                <p className="text-base">{promotion.heure_fin}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Utilisations</p>
              <p className="text-base">
                {promotion.nombre_utilisations} / {promotion.limite_utilisations || '∞'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Limite par client</p>
              <p className="text-base">{promotion.limite_par_client}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Priorité</p>
              <p className="text-base">{promotion.priorite}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Combinable</p>
              <Badge variant={promotion.combinable ? "default" : "secondary"}>
                {promotion.combinable ? 'Oui' : 'Non'}
              </Badge>
            </div>
            {promotion.code_promo && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Code promo</p>
                <p className="text-base font-mono">{promotion.code_promo}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDetailsDialog;
