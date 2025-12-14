import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Budget, CostCenter } from '@/hooks/useAnalyticalAccounting';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface CreateBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (budget: Partial<Budget>) => Promise<void>;
  onGenerate?: (params: { centreId: string; annee: number; typePeriode: 'mensuel' | 'trimestriel' | 'annuel'; montantTotal: number }) => Promise<unknown>;
  editingBudget?: Budget | null;
  costCenters: CostCenter[];
  exercices: Array<{ id: string; libelle: string }>;
  isSaving: boolean;
}

const CreateBudgetDialog = ({
  open,
  onOpenChange,
  onSave,
  onGenerate,
  editingBudget,
  costCenters,
  exercices,
  isSaving
}: CreateBudgetDialogProps) => {
  const { getInputStep, getCurrencySymbol } = useCurrencyFormatting();
  const [mode, setMode] = useState<'single' | 'generate'>('single');
  const [form, setForm] = useState({
    libelle: '',
    centre_cout_id: '',
    exercice_comptable_id: '',
    type_periode: 'mensuel' as Budget['type_periode'],
    montant_prevu: '',
    annee: new Date().getFullYear().toString(),
    notes: '',
  });

  useEffect(() => {
    if (editingBudget) {
      setForm({
        libelle: editingBudget.libelle || '',
        centre_cout_id: editingBudget.centre_cout_id || '',
        exercice_comptable_id: editingBudget.exercice_comptable_id || '',
        type_periode: editingBudget.type_periode,
        montant_prevu: editingBudget.montant_prevu?.toString() || '',
        annee: editingBudget.annee?.toString() || new Date().getFullYear().toString(),
        notes: editingBudget.notes || '',
      });
      setMode('single');
    } else {
      setForm({
        libelle: '',
        centre_cout_id: '',
        exercice_comptable_id: '',
        type_periode: 'mensuel',
        montant_prevu: '',
        annee: new Date().getFullYear().toString(),
        notes: '',
      });
    }
  }, [editingBudget, open]);

  const handleSubmit = async () => {
    if (!form.centre_cout_id || !form.montant_prevu) return;
    
    if (mode === 'generate' && onGenerate) {
      await onGenerate({
        centreId: form.centre_cout_id,
        annee: parseInt(form.annee),
        typePeriode: form.type_periode,
        montantTotal: parseFloat(form.montant_prevu),
      });
    } else {
      const annee = parseInt(form.annee);
      const dateDebut = `${annee}-01-01`;
      const dateFin = `${annee}-12-31`;
      
      await onSave({
        ...editingBudget,
        libelle: form.libelle || `Budget ${form.type_periode} ${annee}`,
        centre_cout_id: form.centre_cout_id,
        exercice_comptable_id: form.exercice_comptable_id || undefined,
        type_periode: form.type_periode,
        date_debut: dateDebut,
        date_fin: dateFin,
        annee,
        montant_prevu: parseFloat(form.montant_prevu),
        notes: form.notes || undefined,
      });
    }
    onOpenChange(false);
  };

  const periodeOptions = [
    { value: 'mensuel', label: 'Mensuel' },
    { value: 'trimestriel', label: 'Trimestriel' },
    { value: 'annuel', label: 'Annuel' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingBudget ? 'Modifier le Budget' : 'Nouveau Budget'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!editingBudget && (
            <div className="flex gap-2">
              <Button
                variant={mode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('single')}
              >
                Budget unique
              </Button>
              <Button
                variant={mode === 'generate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('generate')}
              >
                Générer période
              </Button>
            </div>
          )}

          {mode === 'single' && (
            <div className="grid gap-2">
              <Label htmlFor="libelle">Libellé</Label>
              <Input
                id="libelle"
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                placeholder="Ex: Budget Janvier 2025"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="centre">Centre de Coûts *</Label>
            <Select value={form.centre_cout_id} onValueChange={(v) => setForm({ ...form, centre_cout_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un centre" />
              </SelectTrigger>
              <SelectContent>
                {costCenters.filter(c => c.est_actif).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code} - {c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {exercices.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="exercice">Exercice Comptable</Label>
              <Select value={form.exercice_comptable_id} onValueChange={(v) => setForm({ ...form, exercice_comptable_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un exercice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {exercices.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type de Période</Label>
              <Select value={form.type_periode} onValueChange={(v) => setForm({ ...form, type_periode: v as Budget['type_periode'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="annee">Année</Label>
              <Input
                id="annee"
                type="number"
                value={form.annee}
                onChange={(e) => setForm({ ...form, annee: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="montant">
              {mode === 'generate' ? 'Montant Total Annuel' : 'Montant Prévu'} ({getCurrencySymbol()}) *
            </Label>
            <Input
              id="montant"
              type="number"
              step={getInputStep()}
              value={form.montant_prevu}
              onChange={(e) => setForm({ ...form, montant_prevu: e.target.value })}
              placeholder="0"
            />
            {mode === 'generate' && (
              <p className="text-xs text-muted-foreground">
                Ce montant sera réparti automatiquement sur {form.type_periode === 'mensuel' ? '12 mois' : form.type_periode === 'trimestriel' ? '4 trimestres' : "l'année"}
              </p>
            )}
          </div>

          {mode === 'single' && (
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Remarques ou justifications..."
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.centre_cout_id || !form.montant_prevu}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === 'generate' ? 'Générer' : editingBudget ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBudgetDialog;
