import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, X } from 'lucide-react';
import type { ClinicalAlert } from '@/hooks/useNetworkPharmaTools';

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (alert: Partial<ClinicalAlert>) => Promise<void>;
}

export const CreateAlertDialog: React.FC<CreateAlertDialogProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [alertType, setAlertType] = useState<'drug_alert' | 'interaction' | 'recall' | 'shortage' | 'regulatory'>('drug_alert');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [source, setSource] = useState('');
  const [affectedDrugs, setAffectedDrugs] = useState<string[]>([]);
  const [newDrug, setNewDrug] = useState('');
  const [actionsRequired, setActionsRequired] = useState<string[]>([]);
  const [newAction, setNewAction] = useState('');
  const [isNetworkAlert, setIsNetworkAlert] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddDrug = () => {
    if (newDrug.trim()) {
      setAffectedDrugs([...affectedDrugs, newDrug.trim()]);
      setNewDrug('');
    }
  };

  const handleRemoveDrug = (index: number) => {
    setAffectedDrugs(affectedDrugs.filter((_, i) => i !== index));
  };

  const handleAddAction = () => {
    if (newAction.trim()) {
      setActionsRequired([...actionsRequired, newAction.trim()]);
      setNewAction('');
    }
  };

  const handleRemoveAction = (index: number) => {
    setActionsRequired(actionsRequired.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title) return;

    setLoading(true);
    try {
      await onSubmit({
        title,
        description,
        alert_type: alertType,
        severity,
        source,
        affected_drugs: affectedDrugs,
        actions_required: actionsRequired,
        is_network_alert: isNetworkAlert
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAlertType('drug_alert');
    setSeverity('info');
    setSource('');
    setAffectedDrugs([]);
    setActionsRequired([]);
    setIsNetworkAlert(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'drug_alert': return 'Alerte médicament';
      case 'interaction': return 'Interaction';
      case 'recall': return 'Rappel de lot';
      case 'shortage': return 'Rupture de stock';
      case 'regulatory': return 'Réglementaire';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Nouvelle alerte clinique
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titre de l'alerte *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Rappel de lot - Valsartan contaminé"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type d'alerte</Label>
              <Select value={alertType} onValueChange={(v) => setAlertType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drug_alert">Alerte médicament</SelectItem>
                  <SelectItem value="interaction">Interaction</SelectItem>
                  <SelectItem value="recall">Rappel de lot</SelectItem>
                  <SelectItem value="shortage">Rupture de stock</SelectItem>
                  <SelectItem value="regulatory">Réglementaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Niveau de sévérité</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Attention</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'alerte en détail..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Source</Label>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Ex: ANSM, Laboratoire, EMA..."
            />
          </div>

          <div className="space-y-2">
            <Label>Médicaments concernés</Label>
            <div className="flex gap-2">
              <Input
                value={newDrug}
                onChange={(e) => setNewDrug(e.target.value)}
                placeholder="Nom du médicament"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDrug()}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddDrug}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {affectedDrugs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {affectedDrugs.map((drug, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {drug}
                    <button onClick={() => handleRemoveDrug(idx)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Actions requises</Label>
            <div className="flex gap-2">
              <Input
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="Action à entreprendre"
                onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddAction}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {actionsRequired.length > 0 && (
              <ul className="mt-2 space-y-1">
                {actionsRequired.map((action, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span>•</span>
                    <span className="flex-1">{action}</span>
                    <button onClick={() => handleRemoveAction(idx)} className="text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label>Alerte réseau</Label>
              <p className="text-xs text-muted-foreground">
                Diffuser cette alerte à toutes les pharmacies du réseau
              </p>
            </div>
            <Switch checked={isNetworkAlert} onCheckedChange={setIsNetworkAlert} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!title || loading}>
            {loading ? 'Création...' : 'Créer l\'alerte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAlertDialog;
