import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategorizationRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  rule?: any;
}

const CategorizationRuleDialog = ({ open, onOpenChange, onSubmit, rule }: CategorizationRuleDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: rule || {
      nom_regle: '',
      champ_condition: 'libelle',
      operateur: 'contient',
      valeur_condition: '',
      categorie_cible: '',
      priorite: 1,
      est_actif: true
    }
  });

  React.useEffect(() => {
    if (rule) {
      Object.keys(rule).forEach(key => {
        setValue(key as any, rule[key]);
      });
    } else {
      reset({
        nom_regle: '',
        champ_condition: 'libelle',
        operateur: 'contient',
        valeur_condition: '',
        categorie_cible: '',
        priorite: 1,
        est_actif: true
      });
    }
  }, [rule, setValue, reset]);

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
    onOpenChange(false);
  };

  const categories = [
    'Ventes', 'Achats', 'Frais bancaires', 'Salaires', 'Loyer', 
    'Impôts', 'TVA', 'Centime Additionnel', 'Fournisseurs', 'Clients', 'Divers'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? 'Modifier la Règle' : 'Nouvelle Règle de Catégorisation'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label>Nom de la règle</Label>
            <Input {...register('nom_regle', { required: true })} placeholder="Ex: Virements fournisseurs" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Champ à vérifier</Label>
              <Select onValueChange={(value) => setValue('champ_condition', value)} defaultValue={watch('champ_condition')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libelle">Libellé</SelectItem>
                  <SelectItem value="reference">Référence</SelectItem>
                  <SelectItem value="montant">Montant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Opérateur</Label>
              <Select onValueChange={(value) => setValue('operateur', value)} defaultValue={watch('operateur')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contient">Contient</SelectItem>
                  <SelectItem value="commence_par">Commence par</SelectItem>
                  <SelectItem value="egal">Égal à</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Valeur à rechercher</Label>
            <Input {...register('valeur_condition', { required: true })} placeholder="Ex: COPHARMED" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Catégorie cible</Label>
              <Select onValueChange={(value) => setValue('categorie_cible', value)} defaultValue={watch('categorie_cible')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorité</Label>
              <Input type="number" min={1} max={100} {...register('priorite', { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{rule ? 'Mettre à jour' : 'Créer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategorizationRuleDialog;
