import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrainingDataset } from '@/hooks/useContinuousLearning';
import { Database, Lock } from 'lucide-react';

interface DatasetConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataset: TrainingDataset | null;
  onSave: (data: { id: string; updates: Partial<TrainingDataset> }) => void;
  onCreate?: (data: Partial<TrainingDataset>) => void;
  isCreating?: boolean;
}

export function DatasetConfigDialog({
  open,
  onOpenChange,
  dataset,
  onSave,
  onCreate,
  isCreating = false
}: DatasetConfigDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('internal');
  const [sourceName, setSourceName] = useState('');
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const [retentionDays, setRetentionDays] = useState(365);
  const [isEncrypted, setIsEncrypted] = useState(false);

  useEffect(() => {
    if (dataset && !isCreating) {
      setName(dataset.name);
      setDescription(dataset.description || '');
      setSourceType(dataset.source_type);
      setSourceName(dataset.source_name || '');
      setSyncFrequency(dataset.sync_frequency);
      setRetentionDays(dataset.retention_days);
      setIsEncrypted(dataset.is_encrypted);
    } else {
      setName('');
      setDescription('');
      setSourceType('internal');
      setSourceName('');
      setSyncFrequency('daily');
      setRetentionDays(365);
      setIsEncrypted(false);
    }
  }, [dataset, isCreating, open]);

  const handleSubmit = () => {
    const data = {
      name,
      description,
      source_type: sourceType,
      source_name: sourceName,
      sync_frequency: syncFrequency,
      retention_days: retentionDays,
      is_encrypted: isEncrypted
    };

    if (isCreating && onCreate) {
      onCreate(data);
    } else if (dataset) {
      onSave({ id: dataset.id, updates: data });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {isCreating ? 'Nouvelle Source de Données' : 'Configuration du Dataset'}
          </DialogTitle>
          <DialogDescription>
            {isCreating 
              ? 'Configurez une nouvelle source de données pour l\'entraînement'
              : 'Modifiez les paramètres de la source de données'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du dataset</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Historique des ventes"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la source de données..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de source</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interne (Base de données)</SelectItem>
                  <SelectItem value="api">API externe</SelectItem>
                  <SelectItem value="file">Fichier</SelectItem>
                  <SelectItem value="database">Base de données externe</SelectItem>
                  <SelectItem value="stream">Flux temps réel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fréquence de synchronisation</Label>
              <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Temps réel</SelectItem>
                  <SelectItem value="hourly">Horaire</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="manual">Manuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceName">Nom de la source</Label>
            <Input
              id="sourceName"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="Ex: Système POS, API Météo..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="retention">Rétention des données (jours)</Label>
            <Input
              id="retention"
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value) || 365)}
              min={30}
              max={3650}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="encrypted" className="cursor-pointer">Chiffrement des données</Label>
                <p className="text-xs text-muted-foreground">Chiffrer les données sensibles</p>
              </div>
            </div>
            <Switch
              id="encrypted"
              checked={isEncrypted}
              onCheckedChange={setIsEncrypted}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            {isCreating ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
