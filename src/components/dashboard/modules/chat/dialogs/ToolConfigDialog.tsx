import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Globe, Database, BookOpen, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ToolConfig {
  thesaurus_ansm_url: string;
  claude_bernard_url: string;
  ansm_portal_url: string;
  auto_sync: boolean;
  sync_frequency: string;
  enable_notifications: boolean;
}

interface ToolConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: ToolConfig) => void;
  initialConfig?: Partial<ToolConfig>;
}

export const ToolConfigDialog: React.FC<ToolConfigDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<ToolConfig>({
    thesaurus_ansm_url: initialConfig?.thesaurus_ansm_url || 'https://ansm.sante.fr/documents/reference/thesaurus-des-interactions-medicamenteuses',
    claude_bernard_url: initialConfig?.claude_bernard_url || 'https://www.bcbdexther.fr',
    ansm_portal_url: initialConfig?.ansm_portal_url || 'https://signalement.social-sante.gouv.fr',
    auto_sync: initialConfig?.auto_sync ?? false,
    sync_frequency: initialConfig?.sync_frequency || 'daily',
    enable_notifications: initialConfig?.enable_notifications ?? true
  });

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configuration des outils pharmaceutiques
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* URLs des ressources externes */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Ressources externes
            </h4>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Thesaurus ANSM
              </Label>
              <Input
                value={config.thesaurus_ansm_url}
                onChange={(e) => setConfig({ ...config, thesaurus_ansm_url: e.target.value })}
                placeholder="URL du thesaurus ANSM"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Base Claude Bernard
              </Label>
              <Input
                value={config.claude_bernard_url}
                onChange={(e) => setConfig({ ...config, claude_bernard_url: e.target.value })}
                placeholder="URL de la base Claude Bernard"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Portail de signalement ANSM
              </Label>
              <Input
                value={config.ansm_portal_url}
                onChange={(e) => setConfig({ ...config, ansm_portal_url: e.target.value })}
                placeholder="URL du portail de signalement"
              />
            </div>
          </div>

          <Separator />

          {/* Synchronisation */}
          <div className="space-y-4">
            <h4 className="font-medium">Synchronisation automatique</h4>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Activer la synchronisation automatique</Label>
                <p className="text-xs text-muted-foreground">
                  Mettre à jour automatiquement les données depuis les sources externes
                </p>
              </div>
              <Switch 
                checked={config.auto_sync} 
                onCheckedChange={(checked) => setConfig({ ...config, auto_sync: checked })}
              />
            </div>

            {config.auto_sync && (
              <div className="space-y-2">
                <Label>Fréquence de synchronisation</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={config.sync_frequency}
                  onChange={(e) => setConfig({ ...config, sync_frequency: e.target.value })}
                >
                  <option value="hourly">Toutes les heures</option>
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                </select>
              </div>
            )}
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium">Notifications</h4>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Activer les notifications d'alertes</Label>
                <p className="text-xs text-muted-foreground">
                  Recevoir des notifications pour les nouvelles alertes cliniques
                </p>
              </div>
              <Switch 
                checked={config.enable_notifications} 
                onCheckedChange={(checked) => setConfig({ ...config, enable_notifications: checked })}
              />
            </div>
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
};

export default ToolConfigDialog;
