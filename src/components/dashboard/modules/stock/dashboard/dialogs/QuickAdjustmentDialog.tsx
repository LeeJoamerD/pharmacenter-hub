import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface QuickAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
}

export const QuickAdjustmentDialog = ({ open, onOpenChange, productId }: QuickAdjustmentDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type_mouvement: '',
    quantite: '',
    motif: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Récupérer tenant_id
      const { data: personnelData } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (!personnelData) throw new Error('Personnel non trouvé');

      if (!productId) {
        toast({
          title: "Erreur",
          description: "Aucun produit sélectionné pour l'ajustement.",
          variant: "destructive",
        });
        return;
      }

      // Créer le mouvement de stock
      const { error: mouvementError } = await supabase
        .from('stock_mouvements')
        .insert({
          tenant_id: personnelData.tenant_id,
          produit_id: productId,
          type_mouvement: formData.type_mouvement,
          quantite: parseInt(formData.quantite),
          motif: formData.motif,
          date_mouvement: new Date().toISOString(),
          utilisateur_id: userData.user.id
        });

      if (mouvementError) throw mouvementError;

      toast({
        title: "Ajustement effectué",
        description: "L'ajustement de stock a été enregistré avec succès.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajustement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'ajustement de stock.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigate = () => {
    onOpenChange(false);
    navigate('/stock/mouvements');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Ajustement de Stock
          </DialogTitle>
          <DialogDescription>
            Ajustez rapidement le stock d'un produit
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type_mouvement">Type d'ajustement *</Label>
            <Select
              value={formData.type_mouvement}
              onValueChange={(value) => setFormData({ ...formData, type_mouvement: value })}
              required
            >
              <SelectTrigger id="type_mouvement">
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Entrée">Entrée (Ajout)</SelectItem>
                <SelectItem value="Sortie">Sortie (Retrait)</SelectItem>
                <SelectItem value="Ajustement">Ajustement</SelectItem>
                <SelectItem value="Correction">Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantite">Quantité *</Label>
            <Input
              id="quantite"
              type="number"
              min="1"
              placeholder="Quantité à ajuster"
              value={formData.quantite}
              onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Motif *</Label>
            <Textarea
              id="motif"
              placeholder="Raison de l'ajustement..."
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !formData.type_mouvement || !formData.quantite || !formData.motif}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Effectuer Ajustement
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleNavigate}
            >
              Page Complète
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
