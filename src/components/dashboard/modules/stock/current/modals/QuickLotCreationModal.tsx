import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentTenantId } from '@/utils/tenantValidation';
import { Package } from 'lucide-react';

interface QuickLotCreationModalProps {
  productId: string | null;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const QuickLotCreationModal = ({ 
  productId, 
  productName, 
  isOpen, 
  onClose,
  onSuccess 
}: QuickLotCreationModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    numero_lot: '',
    quantite_initiale: 0,
    date_fabrication: '',
    date_peremption: '',
    prix_achat: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId || !formData.numero_lot || formData.quantite_initiale <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tenantId = await getCurrentTenantId();
      if (!tenantId) throw new Error('Utilisateur non autorisé');

      // 1. Create the lot
      const { data: lot, error: lotError } = await supabase
        .from('lots')
        .insert({
          tenant_id: tenantId,
          produit_id: productId,
          numero_lot: formData.numero_lot,
          quantite_initiale: formData.quantite_initiale,
          quantite_restante: formData.quantite_initiale,
          date_fabrication: formData.date_fabrication || null,
          date_peremption: formData.date_peremption || null,
          prix_achat: formData.prix_achat || 0
        })
        .select()
        .single();

      if (lotError) throw lotError;

      // 2. Create stock movement
      const { error: movementError } = await supabase
        .from('stock_mouvements')
        .insert({
          tenant_id: tenantId,
          produit_id: productId,
          lot_id: lot.id,
          type_mouvement: 'entree',
          quantite: formData.quantite_initiale,
          date_mouvement: new Date().toISOString(),
          reference_type: 'ajustement',
          motif: 'Création rapide de lot'
        });

      if (movementError) throw movementError;

      toast({
        title: "Succès",
        description: `Lot ${formData.numero_lot} créé avec succès`
      });

      // Reset form
      setFormData({
        numero_lot: '',
        quantite_initiale: 0,
        date_fabrication: '',
        date_peremption: '',
        prix_achat: 0
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating lot:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le lot",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!productId || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Créer un Lot Rapidement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label>Produit</Label>
            <p className="font-medium text-sm">{productName}</p>
          </div>

          <div>
            <Label htmlFor="numero_lot">Numéro de Lot *</Label>
            <Input
              id="numero_lot"
              required
              value={formData.numero_lot}
              onChange={(e) => setFormData({ ...formData, numero_lot: e.target.value })}
              placeholder="Ex: LOT-2025-001"
            />
          </div>

          <div>
            <Label htmlFor="quantite">Quantité Initiale *</Label>
            <Input
              id="quantite"
              type="number"
              min={1}
              required
              value={formData.quantite_initiale || ''}
              onChange={(e) => setFormData({ ...formData, quantite_initiale: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label htmlFor="date_fabrication">Date de Fabrication</Label>
            <Input
              id="date_fabrication"
              type="date"
              value={formData.date_fabrication}
              onChange={(e) => setFormData({ ...formData, date_fabrication: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="date_peremption">Date de Péremption</Label>
            <Input
              id="date_peremption"
              type="date"
              value={formData.date_peremption}
              onChange={(e) => setFormData({ ...formData, date_peremption: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="prix_achat">Prix d'Achat Unitaire</Label>
            <Input
              id="prix_achat"
              type="number"
              min={0}
              step="0.01"
              value={formData.prix_achat || ''}
              onChange={(e) => setFormData({ ...formData, prix_achat: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Créer le Lot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickLotCreationModal;
