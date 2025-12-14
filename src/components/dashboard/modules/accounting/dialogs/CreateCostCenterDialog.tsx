import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { CostCenter } from '@/hooks/useAnalyticalAccounting';

interface CreateCostCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (center: Partial<CostCenter>) => Promise<void>;
  editingCenter?: CostCenter | null;
  responsables: Array<{ id: string; nom_complet: string }>;
  costCenters: CostCenter[];
  isSaving: boolean;
}

const CreateCostCenterDialog = ({
  open,
  onOpenChange,
  onSave,
  editingCenter,
  responsables,
  costCenters,
  isSaving
}: CreateCostCenterDialogProps) => {
  const [form, setForm] = useState({
    nom: '',
    type_centre: '' as CostCenter['type_centre'],
    responsable_id: '',
    centre_parent_id: '',
    description: '',
    objectif_marge_min: '',
    objectif_rotation_stock: '',
  });

  useEffect(() => {
    if (editingCenter) {
      setForm({
        nom: editingCenter.nom || '',
        type_centre: editingCenter.type_centre,
        responsable_id: editingCenter.responsable_id || '',
        centre_parent_id: editingCenter.centre_parent_id || '',
        description: editingCenter.description || '',
        objectif_marge_min: editingCenter.objectif_marge_min?.toString() || '',
        objectif_rotation_stock: editingCenter.objectif_rotation_stock?.toString() || '',
      });
    } else {
      setForm({
        nom: '',
        type_centre: '' as CostCenter['type_centre'],
        responsable_id: '',
        centre_parent_id: '',
        description: '',
        objectif_marge_min: '',
        objectif_rotation_stock: '',
      });
    }
  }, [editingCenter, open]);

  const handleSubmit = async () => {
    if (!form.nom || !form.type_centre) return;
    
    await onSave({
      ...editingCenter,
      nom: form.nom,
      type_centre: form.type_centre,
      responsable_id: form.responsable_id || undefined,
      centre_parent_id: form.centre_parent_id || undefined,
      description: form.description || undefined,
      objectif_marge_min: form.objectif_marge_min ? parseFloat(form.objectif_marge_min) : undefined,
      objectif_rotation_stock: form.objectif_rotation_stock ? parseFloat(form.objectif_rotation_stock) : undefined,
    });
    onOpenChange(false);
  };

  const typeOptions = [
    { value: 'operationnel', label: 'Opérationnel' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'support', label: 'Support' },
    { value: 'profit', label: 'Centre de Profit' },
    { value: 'investissement', label: 'Investissement' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingCenter ? 'Modifier le Centre de Coûts' : 'Nouveau Centre de Coûts'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nom">Nom du Centre *</Label>
            <Input
              id="nom"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: Production Médicaments"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type de Centre *</Label>
            <Select value={form.type_centre} onValueChange={(v) => setForm({ ...form, type_centre: v as CostCenter['type_centre'] })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="responsable">Responsable</Label>
            <Select value={form.responsable_id} onValueChange={(v) => setForm({ ...form, responsable_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {responsables.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.nom_complet}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="parent">Centre Parent</Label>
            <Select value={form.centre_parent_id} onValueChange={(v) => setForm({ ...form, centre_parent_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Aucun (niveau racine)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {costCenters.filter(c => c.id !== editingCenter?.id).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code} - {c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="marge">Objectif Marge Min (%)</Label>
              <Input
                id="marge"
                type="number"
                step="0.1"
                value={form.objectif_marge_min}
                onChange={(e) => setForm({ ...form, objectif_marge_min: e.target.value })}
                placeholder="Ex: 25"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rotation">Objectif Rotation Stock</Label>
              <Input
                id="rotation"
                type="number"
                step="0.1"
                value={form.objectif_rotation_stock}
                onChange={(e) => setForm({ ...form, objectif_rotation_stock: e.target.value })}
                placeholder="Ex: 4"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description du centre de coûts..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.nom || !form.type_centre}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingCenter ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCostCenterDialog;
