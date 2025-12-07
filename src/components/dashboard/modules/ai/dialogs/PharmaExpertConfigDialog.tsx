import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Bell, Brain } from 'lucide-react';
import type { PharmaExpertConfig } from '@/hooks/usePharmaceuticalExpert';

interface PharmaExpertConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: PharmaExpertConfig;
  onSave: (config: Partial<PharmaExpertConfig>) => Promise<void>;
}

const PharmaExpertConfigDialog: React.FC<PharmaExpertConfigDialogProps> = ({
  open,
  onOpenChange,
  config,
  onSave
}) => {
  const [localConfig, setLocalConfig] = useState<PharmaExpertConfig>(config);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localConfig);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const pharmacovigilanceSources = ['ANSM', 'EMA', 'FDA', 'OMS', 'HAS'];

  const toggleSource = (source: string) => {
    const sources = localConfig.pharmacovigilance_sources || [];
    if (sources.includes(source)) {
      setLocalConfig({
        ...localConfig,
        pharmacovigilance_sources: sources.filter(s => s !== source)
      });
    } else {
      setLocalConfig({
        ...localConfig,
        pharmacovigilance_sources: [...sources, source]
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Expert Pharma
          </DialogTitle>
          <DialogDescription>
            Personnalisez les paramètres du système expert pharmaceutique
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Interactions */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Interactions Médicamenteuses
            </h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-interaction">Vérification automatique</Label>
              <Switch
                id="auto-interaction"
                checked={localConfig.auto_interaction_check}
                onCheckedChange={(checked) => 
                  setLocalConfig({ ...localConfig, auto_interaction_check: checked })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Niveau d'alerte minimum</Label>
              <Select
                value={localConfig.interaction_alert_level}
                onValueChange={(value) => 
                  setLocalConfig({ ...localConfig, interaction_alert_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Mineure</SelectItem>
                  <SelectItem value="moderate">Modérée</SelectItem>
                  <SelectItem value="major">Majeure</SelectItem>
                  <SelectItem value="contraindicated">Contre-indiquée uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Consultation */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Consultation IA
            </h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-ai">Activer les consultations IA</Label>
              <Switch
                id="enable-ai"
                checked={localConfig.enable_ai_consultation}
                onCheckedChange={(checked) => 
                  setLocalConfig({ ...localConfig, enable_ai_consultation: checked })
                }
              />
            </div>
          </div>

          {/* Compliance */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Conformité & Alertes
            </h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="compliance-alerts">Alertes de conformité</Label>
              <Switch
                id="compliance-alerts"
                checked={localConfig.enable_compliance_alerts}
                onCheckedChange={(checked) => 
                  setLocalConfig({ ...localConfig, enable_compliance_alerts: checked })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Fréquence des contrôles</Label>
              <Select
                value={localConfig.compliance_check_frequency}
                onValueChange={(value) => 
                  setLocalConfig({ ...localConfig, compliance_check_frequency: value })
                }
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
          </div>

          {/* Pharmacovigilance Sources */}
          <div className="space-y-4">
            <Label>Sources de Pharmacovigilance</Label>
            <div className="flex flex-wrap gap-2">
              {pharmacovigilanceSources.map(source => (
                <Badge
                  key={source}
                  variant={localConfig.pharmacovigilance_sources?.includes(source) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleSource(source)}
                >
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PharmaExpertConfigDialog;
