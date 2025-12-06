import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DrugInfo, DrugInteraction } from '@/hooks/useNetworkPharmaTools';

interface CreateInteractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (interaction: Partial<DrugInteraction>) => Promise<void>;
  drugs: DrugInfo[];
  editingInteraction?: DrugInteraction | null;
}

export const CreateInteractionDialog: React.FC<CreateInteractionDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  drugs,
  editingInteraction
}) => {
  const [drug1Name, setDrug1Name] = useState(editingInteraction?.drug1_name || '');
  const [drug2Name, setDrug2Name] = useState(editingInteraction?.drug2_name || '');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major' | 'contraindicated'>(
    editingInteraction?.severity || 'minor'
  );
  const [mechanism, setMechanism] = useState(editingInteraction?.mechanism || '');
  const [clinicalEffect, setClinicalEffect] = useState(editingInteraction?.clinical_effect || '');
  const [management, setManagement] = useState(editingInteraction?.management || '');
  const [references, setReferences] = useState<string[]>(editingInteraction?.source_references || []);
  const [newReference, setNewReference] = useState('');
  const [isNetworkShared, setIsNetworkShared] = useState(editingInteraction?.is_network_shared || false);
  const [loading, setLoading] = useState(false);

  const handleAddReference = () => {
    if (newReference.trim()) {
      setReferences([...references, newReference.trim()]);
      setNewReference('');
    }
  };

  const handleRemoveReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!drug1Name || !drug2Name) return;

    setLoading(true);
    try {
      await onSubmit({
        drug1_name: drug1Name,
        drug2_name: drug2Name,
        severity,
        mechanism,
        clinical_effect: clinicalEffect,
        management,
        source_references: references,
        is_network_shared: isNetworkShared
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDrug1Name('');
    setDrug2Name('');
    setSeverity('minor');
    setMechanism('');
    setClinicalEffect('');
    setManagement('');
    setReferences([]);
    setIsNetworkShared(false);
  };

  const getSeverityLabel = (sev: string) => {
    switch (sev) {
      case 'contraindicated': return 'Contre-indiqué';
      case 'major': return 'Majeure';
      case 'moderate': return 'Modérée';
      case 'minor': return 'Mineure';
      default: return sev;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {editingInteraction ? 'Modifier l\'interaction' : 'Nouvelle interaction médicamenteuse'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Premier médicament *</Label>
              <Input
                value={drug1Name}
                onChange={(e) => setDrug1Name(e.target.value)}
                placeholder="Nom du médicament"
                list="drugs-list-1"
              />
              <datalist id="drugs-list-1">
                {drugs.map(drug => (
                  <option key={drug.id} value={drug.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Deuxième médicament *</Label>
              <Input
                value={drug2Name}
                onChange={(e) => setDrug2Name(e.target.value)}
                placeholder="Nom du médicament"
                list="drugs-list-2"
              />
              <datalist id="drugs-list-2">
                {drugs.map(drug => (
                  <option key={drug.id} value={drug.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Niveau de sévérité</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Mineure</SelectItem>
                <SelectItem value="moderate">Modérée</SelectItem>
                <SelectItem value="major">Majeure</SelectItem>
                <SelectItem value="contraindicated">Contre-indiqué</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mécanisme</Label>
            <Textarea
              value={mechanism}
              onChange={(e) => setMechanism(e.target.value)}
              placeholder="Décrivez le mécanisme de l'interaction..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Effet clinique</Label>
            <Textarea
              value={clinicalEffect}
              onChange={(e) => setClinicalEffect(e.target.value)}
              placeholder="Décrivez les effets cliniques potentiels..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Conduite à tenir</Label>
            <Textarea
              value={management}
              onChange={(e) => setManagement(e.target.value)}
              placeholder="Recommandations pour la gestion de cette interaction..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Références bibliographiques</Label>
            <div className="flex gap-2">
              <Input
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                placeholder="Ajouter une référence"
                onKeyDown={(e) => e.key === 'Enter' && handleAddReference()}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddReference}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {references.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {references.map((ref, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {ref}
                    <button onClick={() => handleRemoveReference(idx)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label>Partager avec le réseau</Label>
              <p className="text-xs text-muted-foreground">
                Rendre cette interaction visible à toutes les pharmacies du réseau
              </p>
            </div>
            <Switch checked={isNetworkShared} onCheckedChange={setIsNetworkShared} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!drug1Name || !drug2Name || loading}>
            {loading ? 'Enregistrement...' : editingInteraction ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInteractionDialog;
