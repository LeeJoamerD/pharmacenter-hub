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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save } from 'lucide-react';
import { BIConfig } from '@/hooks/useBusinessIntelligence';

interface BIConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: BIConfig | null;
  onSave: (config: Partial<BIConfig>) => Promise<void>;
}

export const BIConfigDialog: React.FC<BIConfigDialogProps> = ({
  open,
  onOpenChange,
  config,
  onSave
}) => {
  const [formData, setFormData] = useState({
    auto_analysis_enabled: true,
    analysis_frequency: 'daily',
    enable_pattern_discovery: true,
    enable_auto_segmentation: true,
    data_retention_days: 365
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        auto_analysis_enabled: config.auto_analysis_enabled,
        analysis_frequency: config.analysis_frequency,
        enable_pattern_discovery: config.enable_pattern_discovery,
        enable_auto_segmentation: config.enable_auto_segmentation,
        data_retention_days: config.data_retention_days
      });
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Analytics BI
          </DialogTitle>
          <DialogDescription>
            Configurez les paramètres du module Business Intelligence
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analyse automatique</Label>
              <p className="text-sm text-muted-foreground">
                Exécuter les analyses automatiquement
              </p>
            </div>
            <Switch
              checked={formData.auto_analysis_enabled}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, auto_analysis_enabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Fréquence d'analyse</Label>
            <Select
              value={formData.analysis_frequency}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, analysis_frequency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="daily">Quotidienne</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuelle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Découverte de patterns</Label>
              <p className="text-sm text-muted-foreground">
                Identifier automatiquement les tendances
              </p>
            </div>
            <Switch
              checked={formData.enable_pattern_discovery}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, enable_pattern_discovery: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Segmentation automatique</Label>
              <p className="text-sm text-muted-foreground">
                Créer des segments clients automatiquement
              </p>
            </div>
            <Switch
              checked={formData.enable_auto_segmentation}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, enable_auto_segmentation: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Rétention des données (jours)</Label>
            <Input
              type="number"
              min={30}
              max={730}
              value={formData.data_retention_days}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, data_retention_days: parseInt(e.target.value) || 365 }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
