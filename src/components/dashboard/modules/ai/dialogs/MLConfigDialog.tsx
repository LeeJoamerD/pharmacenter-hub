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
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MLConfig } from '@/hooks/useContinuousLearning';
import { Settings, Bell, Clock, Target, Database } from 'lucide-react';

interface MLConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: MLConfig;
  onSave: (config: MLConfig) => void;
}

export function MLConfigDialog({
  open,
  onOpenChange,
  config,
  onSave
}: MLConfigDialogProps) {
  const [localConfig, setLocalConfig] = useState<MLConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, open]);

  const handleSave = () => {
    onSave(localConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Machine Learning
          </DialogTitle>
          <DialogDescription>
            Paramètres globaux pour l'apprentissage automatique
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto Training */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="cursor-pointer">Formation automatique</Label>
                <p className="text-xs text-muted-foreground">
                  Entraîner automatiquement les modèles selon le planning
                </p>
              </div>
            </div>
            <Switch
              checked={localConfig.auto_training_enabled}
              onCheckedChange={(checked) => 
                setLocalConfig(prev => ({ ...prev, auto_training_enabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Planning d'entraînement</Label>
            <Select 
              value={localConfig.training_schedule} 
              onValueChange={(value) => 
                setLocalConfig(prev => ({ ...prev, training_schedule: value }))
              }
              disabled={!localConfig.auto_training_enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien (02:00)</SelectItem>
                <SelectItem value="weekly">Hebdomadaire (Dimanche 02:00)</SelectItem>
                <SelectItem value="monthly">Mensuel (1er du mois)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Performance Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-medium">Performance</Label>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Seuil de précision minimum</Label>
                <span className="text-sm font-medium">{localConfig.min_accuracy_threshold}%</span>
              </div>
              <Slider
                value={[localConfig.min_accuracy_threshold]}
                onValueChange={([value]) => 
                  setLocalConfig(prev => ({ ...prev, min_accuracy_threshold: value }))
                }
                min={50}
                max={99}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Alerte si la précision descend en-dessous de ce seuil
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Epochs maximum par session</Label>
                <span className="text-sm font-medium">{localConfig.max_epochs}</span>
              </div>
              <Slider
                value={[localConfig.max_epochs]}
                onValueChange={([value]) => 
                  setLocalConfig(prev => ({ ...prev, max_epochs: value }))
                }
                min={10}
                max={500}
                step={10}
              />
            </div>
          </div>

          <Separator />

          {/* Data Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-medium">Données</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Rétention des données (jours)</Label>
              <Input
                id="retention"
                type="number"
                value={localConfig.data_retention_days}
                onChange={(e) => 
                  setLocalConfig(prev => ({ 
                    ...prev, 
                    data_retention_days: parseInt(e.target.value) || 365 
                  }))
                }
                min={30}
                max={3650}
              />
              <p className="text-xs text-muted-foreground">
                Durée de conservation des données d'entraînement
              </p>
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="cursor-pointer">Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Recevoir des alertes sur les performances des modèles
                </p>
              </div>
            </div>
            <Switch
              checked={localConfig.notification_enabled}
              onCheckedChange={(checked) => 
                setLocalConfig(prev => ({ ...prev, notification_enabled: checked }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
