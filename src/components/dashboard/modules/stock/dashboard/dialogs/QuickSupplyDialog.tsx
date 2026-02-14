import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigation } from '@/contexts/NavigationContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickSupplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
}

interface Supplier {
  id: string;
  nom: string;
}

export const QuickSupplyDialog = ({ open, onOpenChange, productId }: QuickSupplyDialogProps) => {
  const { toast } = useToast();
  const { navigateToModule } = useNavigation();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    fournisseur: '',
    quantite: ''
  });

  useEffect(() => {
    if (open) {
      fetchSuppliers();
    }
  }, [open]);

  const fetchSuppliers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!personnel) return;

      const { data, error } = await supabase
        .from('fournisseurs')
        .select('id, nom')
        .eq('tenant_id', personnel.tenant_id)
        .order('nom');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { data: personnelData } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (!personnelData) throw new Error('Personnel non trouvé');

      const { data: commande, error: commandeError } = await supabase
        .from('commandes_fournisseurs')
        .insert({
          tenant_id: personnelData.tenant_id,
          fournisseur_id: formData.fournisseur,
          statut: 'Brouillon'
        })
        .select()
        .single();

      if (commandeError) throw commandeError;

      if (productId) {
        const quantite = parseInt(formData.quantite) || 1;
        const { error: ligneError } = await supabase
          .from('lignes_commande_fournisseur')
          .insert({
            tenant_id: personnelData.tenant_id,
            commande_id: commande.id,
            produit_id: productId,
            quantite_commandee: quantite
          });

        if (ligneError) throw ligneError;
      }

      toast({
        title: t('orderCreated'),
        description: t('orderCreatedSuccess'),
      });

      onOpenChange(false);
      navigateToModule('stock', 'approvisionnement');
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      toast({
        title: t('error'),
        description: t('orderCreationError'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigate = () => {
    onOpenChange(false);
    navigateToModule('stock', 'approvisionnement');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('quickResupply')}
          </DialogTitle>
          <DialogDescription>
            {t('createQuickOrder')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fournisseur">{t('supplier')}</Label>
            <Select
              value={formData.fournisseur}
              onValueChange={(value) => setFormData({ ...formData, fournisseur: value })}
            >
              <SelectTrigger id="fournisseur">
                <SelectValue placeholder={t('dialogSelectSupplier')} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productId && (
            <div className="space-y-2">
              <Label htmlFor="quantite">{t('quantity')}</Label>
              <Input
                id="quantite"
                type="number"
                min="1"
                placeholder={t('quantityToOrder')}
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !formData.fournisseur}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createQuickOrderBtn')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleNavigate}
            >
              {t('fullPage')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
