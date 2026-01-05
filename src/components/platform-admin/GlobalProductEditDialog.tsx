import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GlobalProduct } from './GlobalCatalogTable';

interface GlobalProductEditDialogProps {
  product: GlobalProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const GlobalProductEditDialog: React.FC<GlobalProductEditDialogProps> = ({
  product,
  open,
  onOpenChange,
  onSuccess
}) => {
  const { platformAdmin } = usePlatformAdmin();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    libelle_produit: product.libelle_produit,
    ancien_code_cip: product.ancien_code_cip || '',
    prix_achat_reference: product.prix_achat_reference || 0,
    prix_vente_reference: product.prix_vente_reference || 0,
    tva: product.tva,
    libelle_classe_therapeutique: product.libelle_classe_therapeutique || '',
    libelle_famille: product.libelle_famille || '',
    libelle_forme: product.libelle_forme || '',
    libelle_laboratoire: product.libelle_laboratoire || '',
    libelle_rayon: product.libelle_rayon || '',
    libelle_dci: product.libelle_dci || '',
    libelle_categorie_tarification: product.libelle_categorie_tarification || '',
    libelle_statut: product.libelle_statut || '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.libelle_produit.trim()) {
      toast.error('Le libellé produit est requis');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('catalogue_global_produits')
        .update({
          libelle_produit: formData.libelle_produit.trim(),
          ancien_code_cip: formData.ancien_code_cip.trim() || null,
          prix_achat_reference: formData.prix_achat_reference,
          prix_vente_reference: formData.prix_vente_reference,
          tva: formData.tva,
          libelle_classe_therapeutique: formData.libelle_classe_therapeutique.trim() || null,
          libelle_famille: formData.libelle_famille.trim() || null,
          libelle_forme: formData.libelle_forme.trim() || null,
          libelle_laboratoire: formData.libelle_laboratoire.trim() || null,
          libelle_rayon: formData.libelle_rayon.trim() || null,
          libelle_dci: formData.libelle_dci.trim() || null,
          libelle_categorie_tarification: formData.libelle_categorie_tarification.trim() || null,
          libelle_statut: formData.libelle_statut.trim() || null,
          updated_by: platformAdmin?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;

      toast.success('Produit mis à jour avec succès');
      onSuccess();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erreur lors de la mise à jour du produit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
          <DialogDescription>
            Code CIP: <span className="font-mono">{product.code_cip}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="libelle_produit">Libellé produit *</Label>
              <Input
                id="libelle_produit"
                value={formData.libelle_produit}
                onChange={(e) => handleChange('libelle_produit', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ancien_code_cip">Ancien code CIP</Label>
              <Input
                id="ancien_code_cip"
                value={formData.ancien_code_cip}
                onChange={(e) => handleChange('ancien_code_cip', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prix_achat_reference">Prix achat réf.</Label>
              <Input
                id="prix_achat_reference"
                type="number"
                value={formData.prix_achat_reference}
                onChange={(e) => handleChange('prix_achat_reference', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prix_vente_reference">Prix vente réf.</Label>
              <Input
                id="prix_vente_reference"
                type="number"
                value={formData.prix_vente_reference}
                onChange={(e) => handleChange('prix_vente_reference', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="tva"
                checked={formData.tva}
                onCheckedChange={(checked) => handleChange('tva', !!checked)}
              />
              <Label htmlFor="tva">Soumis à TVA</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="libelle_forme">Forme</Label>
              <Input
                id="libelle_forme"
                value={formData.libelle_forme}
                onChange={(e) => handleChange('libelle_forme', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="libelle_famille">Famille</Label>
              <Input
                id="libelle_famille"
                value={formData.libelle_famille}
                onChange={(e) => handleChange('libelle_famille', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="libelle_rayon">Rayon</Label>
              <Input
                id="libelle_rayon"
                value={formData.libelle_rayon}
                onChange={(e) => handleChange('libelle_rayon', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="libelle_laboratoire">Laboratoire</Label>
              <Input
                id="libelle_laboratoire"
                value={formData.libelle_laboratoire}
                onChange={(e) => handleChange('libelle_laboratoire', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="libelle_dci">DCI</Label>
              <Input
                id="libelle_dci"
                value={formData.libelle_dci}
                onChange={(e) => handleChange('libelle_dci', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="libelle_classe_therapeutique">Classe thérapeutique</Label>
              <Input
                id="libelle_classe_therapeutique"
                value={formData.libelle_classe_therapeutique}
                onChange={(e) => handleChange('libelle_classe_therapeutique', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="libelle_categorie_tarification">Catégorie tarification</Label>
              <Input
                id="libelle_categorie_tarification"
                value={formData.libelle_categorie_tarification}
                onChange={(e) => handleChange('libelle_categorie_tarification', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="libelle_statut">Statut</Label>
              <Input
                id="libelle_statut"
                value={formData.libelle_statut}
                onChange={(e) => handleChange('libelle_statut', e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalProductEditDialog;
