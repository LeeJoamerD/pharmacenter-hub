import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface AllocationKey {
  id: string;
  code: string;
  libelle: string;
}

interface CostCenter {
  id: string;
  code: string;
  nom: string;
}

interface AllocationCoefficient {
  id: string;
  cle_repartition_id: string;
  centre_cout_id: string;
  valeur_base?: number;
  coefficient: number;
  date_debut: string;
  date_fin?: string;
  notes?: string;
}

interface CreateCoefficientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (coefficient: Partial<AllocationCoefficient>) => Promise<void>;
  editingCoefficient: AllocationCoefficient | null;
  allocationKeys: AllocationKey[];
  costCenters: CostCenter[];
  isSaving: boolean;
}

const CreateCoefficientDialog: React.FC<CreateCoefficientDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  editingCoefficient,
  allocationKeys,
  costCenters,
  isSaving,
}) => {
  const [cleRepartitionId, setCleRepartitionId] = useState('');
  const [centreCoutId, setCentreCoutId] = useState('');
  const [valeurBase, setValeurBase] = useState<number>(100);
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (editingCoefficient) {
        setCleRepartitionId(editingCoefficient.cle_repartition_id);
        setCentreCoutId(editingCoefficient.centre_cout_id);
        setValeurBase(editingCoefficient.valeur_base || editingCoefficient.coefficient * 100 || 100);
        setDateDebut(editingCoefficient.date_debut?.split('T')[0] || new Date().toISOString().split('T')[0]);
        setDateFin(editingCoefficient.date_fin?.split('T')[0] || '');
        setNotes(editingCoefficient.notes || '');
      } else {
        setCleRepartitionId(allocationKeys[0]?.id || '');
        setCentreCoutId(costCenters[0]?.id || '');
        setValeurBase(100);
        setDateDebut(new Date().toISOString().split('T')[0]);
        setDateFin('');
        setNotes('');
      }
    }
  }, [open, editingCoefficient, allocationKeys, costCenters]);

  const handleSubmit = async () => {
    if (!cleRepartitionId || !centreCoutId) return;

    await onSave({
      cle_repartition_id: cleRepartitionId,
      centre_cout_id: centreCoutId,
      valeur_base: valeurBase,
      coefficient: valeurBase / 100, // Coefficient normalisé pour compatibilité
      date_debut: dateDebut,
      date_fin: dateFin || undefined,
      notes: notes || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingCoefficient ? 'Modifier le Coefficient' : 'Nouveau Coefficient de Répartition'}</DialogTitle>
          <DialogDescription>
            Définissez le poids/valeur de base pour une combinaison clé + centre de coûts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cle">Clé de Répartition *</Label>
            <Select value={cleRepartitionId} onValueChange={setCleRepartitionId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une clé" />
              </SelectTrigger>
              <SelectContent>
                {allocationKeys.map((key) => (
                  <SelectItem key={key.id} value={key.id}>
                    {key.code} - {key.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="centre">Centre de Coûts *</Label>
            <Select value={centreCoutId} onValueChange={setCentreCoutId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un centre" />
              </SelectTrigger>
              <SelectContent>
                {costCenters.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.code} - {center.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valeur">Valeur de Base (poids) *</Label>
            <Input
              id="valeur"
              type="number"
              min="0"
              step="0.01"
              value={valeurBase}
              onChange={(e) => setValeurBase(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 5 (pour 5 employés)"
            />
            <p className="text-xs text-muted-foreground">
              Cette valeur sera utilisée pour calculer le pourcentage de répartition. 
              Ex: Si clé "Effectif", entrez le nombre d'employés du centre.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de Début *</Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFin">Date de Fin</Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Justification</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Basé sur l'audit du 01/01/2025"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || !cleRepartitionId || !centreCoutId}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingCoefficient ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCoefficientDialog;
