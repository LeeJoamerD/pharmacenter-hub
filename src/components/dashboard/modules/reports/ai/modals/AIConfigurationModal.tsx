import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIReportsConfig } from '@/services/AIReportsService';

interface AIConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: AIReportsConfig;
  onSave: (config: Partial<AIReportsConfig>) => void;
  isLoading?: boolean;
}

const AIConfigurationModal: React.FC<AIConfigurationModalProps> = ({
  open,
  onOpenChange,
  config,
  onSave,
  isLoading
}) => {
  const [formData, setFormData] = useState<AIReportsConfig>({
    autoTrainingEnabled: true,
    trainingFrequency: 'weekly',
    minAccuracyThreshold: 85,
    maxEpochs: 100,
    dataRetentionDays: 365,
    notificationEnabled: true
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuration IA</DialogTitle>
          <DialogDescription>
            Paramètres globaux pour l'intelligence artificielle et le machine learning
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto-training */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Entraînement automatique</Label>
              <p className="text-sm text-muted-foreground">
                Activer l'entraînement automatique des modèles
              </p>
            </div>
            <Switch
              checked={formData.autoTrainingEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, autoTrainingEnabled: checked })}
            />
          </div>

          {/* Fréquence d'entraînement */}
          <div className="space-y-2">
            <Label>Fréquence d'entraînement</Label>
            <Select
              value={formData.trainingFrequency}
              onValueChange={(value) => setFormData({ ...formData, trainingFrequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seuil de précision */}
          <div className="space-y-2">
            <Label>Seuil de précision minimum (%)</Label>
            <Input
              type="number"
              min={50}
              max={99}
              value={formData.minAccuracyThreshold}
              onChange={(e) => setFormData({ ...formData, minAccuracyThreshold: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Les modèles en dessous de ce seuil seront réentraînés automatiquement
            </p>
          </div>

          {/* Nombre max d'epochs */}
          <div className="space-y-2">
            <Label>Nombre maximum d'epochs</Label>
            <Input
              type="number"
              min={10}
              max={500}
              value={formData.maxEpochs}
              onChange={(e) => setFormData({ ...formData, maxEpochs: parseInt(e.target.value) })}
            />
          </div>

          {/* Rétention des données */}
          <div className="space-y-2">
            <Label>Rétention des données (jours)</Label>
            <Input
              type="number"
              min={30}
              max={730}
              value={formData.dataRetentionDays}
              onChange={(e) => setFormData({ ...formData, dataRetentionDays: parseInt(e.target.value) })}
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des alertes sur les modèles et prédictions
              </p>
            </div>
            <Switch
              checked={formData.notificationEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, notificationEnabled: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIConfigurationModal;
