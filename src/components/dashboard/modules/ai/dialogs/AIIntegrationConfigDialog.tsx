import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AIIntegrationConfig, AIProviderConnection } from '@/hooks/useAIIntegrations';

interface AIIntegrationConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AIIntegrationConfig;
  providers: AIProviderConnection[];
  onSave: (config: Partial<AIIntegrationConfig>) => void;
}

export function AIIntegrationConfigDialog({ 
  open, 
  onOpenChange, 
  config, 
  providers,
  onSave 
}: AIIntegrationConfigDialogProps) {
  const [formData, setFormData] = useState<AIIntegrationConfig>({
    auto_sync_enabled: true,
    default_provider_id: null,
    max_retries: 3,
    timeout_ms: 30000,
    log_retention_days: 30,
    enable_webhooks: true,
  });

  useEffect(() => {
    setFormData(config);
  }, [config, open]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configuration des Intégrations IA</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Paramètres généraux</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_sync">Synchronisation automatique</Label>
                <p className="text-xs text-muted-foreground">
                  Synchroniser automatiquement les sources de données
                </p>
              </div>
              <Switch
                id="auto_sync"
                checked={formData.auto_sync_enabled}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, auto_sync_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="webhooks">Activer les webhooks</Label>
                <p className="text-xs text-muted-foreground">
                  Recevoir des notifications en temps réel
                </p>
              </div>
              <Switch
                id="webhooks"
                checked={formData.enable_webhooks}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, enable_webhooks: checked })
                }
              />
            </div>
          </div>

          {/* Provider Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Fournisseur par défaut</h3>
            
            <div className="space-y-2">
              <Label>Connecteur IA par défaut</Label>
              <Select
                value={formData.default_provider_id || 'none'}
                onValueChange={(value) => 
                  setFormData({ ...formData, default_provider_id: value === 'none' ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {providers.filter(p => p.is_active).map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.provider_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Technical Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Paramètres techniques</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_retries">Tentatives max</Label>
                <Input
                  id="max_retries"
                  type="number"
                  value={formData.max_retries}
                  onChange={(e) => 
                    setFormData({ ...formData, max_retries: parseInt(e.target.value) || 3 })
                  }
                  min={1}
                  max={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.timeout_ms}
                  onChange={(e) => 
                    setFormData({ ...formData, timeout_ms: parseInt(e.target.value) || 30000 })
                  }
                  min={1000}
                  max={120000}
                  step={1000}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="log_retention">Rétention des logs (jours)</Label>
              <Input
                id="log_retention"
                type="number"
                value={formData.log_retention_days}
                onChange={(e) => 
                  setFormData({ ...formData, log_retention_days: parseInt(e.target.value) || 30 })
                }
                min={1}
                max={365}
              />
              <p className="text-xs text-muted-foreground">
                Les événements plus anciens seront automatiquement supprimés
              </p>
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
}
