import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface QuickSupplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
}

export const QuickSupplyDialog = ({ open, onOpenChange, productId }: QuickSupplyDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fournisseur: '',
    quantite: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Créer une commande rapide
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Récupérer tenant_id
      const { data: personnelData } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (!personnelData) throw new Error('Personnel non trouvé');

      // Créer la commande fournisseur
      const { data: commande, error: commandeError } = await supabase
        .from('commandes_fournisseurs')
        .insert({
          tenant_id: personnelData.tenant_id,
          fournisseur_id: formData.fournisseur,
          statut_commande: 'En attente',
          notes: formData.notes
        })
        .select()
        .single();

      if (commandeError) throw commandeError;

      // Si un produit spécifique est sélectionné
      if (productId) {
        const { error: ligneError } = await supabase
          .from('lignes_commande_fournisseur')
          .insert({
            tenant_id: personnelData.tenant_id,
            commande_id: commande.id,
            produit_id: productId,
            quantite_commandee: parseInt(formData.quantite)
          });

        if (ligneError) throw ligneError;
      }

      toast({
        title: "Commande créée",
        description: "La commande de réapprovisionnement a été créée avec succès.",
      });

      onOpenChange(false);
      
      // Option: naviguer vers la page de détails
      if (commande.id) {
        navigate(`/stock/approvisionnement`);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande de réapprovisionnement.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigate = () => {
    onOpenChange(false);
    navigate('/stock/approvisionnement');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Réapprovisionnement Rapide
          </DialogTitle>
          <DialogDescription>
            Créez une commande fournisseur simple ou accédez à la page complète
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fournisseur">Fournisseur</Label>
            <Select
              value={formData.fournisseur}
              onValueChange={(value) => setFormData({ ...formData, fournisseur: value })}
            >
              <SelectTrigger id="fournisseur">
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fournisseur-1">Fournisseur A</SelectItem>
                <SelectItem value="fournisseur-2">Fournisseur B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {productId && (
            <div className="space-y-2">
              <Label htmlFor="quantite">Quantité</Label>
              <Input
                id="quantite"
                type="number"
                min="1"
                placeholder="Quantité à commander"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Notes supplémentaires..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !formData.fournisseur}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer Commande Rapide
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
