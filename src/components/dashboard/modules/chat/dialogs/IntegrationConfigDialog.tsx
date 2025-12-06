import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Key, Globe, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { NetworkIntegration } from '@/hooks/useNetworkBusinessIntegrations';

interface IntegrationConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: NetworkIntegration | null;
  onSave: (data: { id?: string; name: string; type: string; config?: Record<string, unknown> }) => void;
  onTest: (integrationId: string) => void;
  isSaving?: boolean;
  isTesting?: boolean;
}

export function IntegrationConfigDialog({ 
  open, 
  onOpenChange, 
  integration, 
  onSave, 
  onTest,
  isSaving,
  isTesting 
}: IntegrationConfigDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('erp');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState('daily');

  useEffect(() => {
    if (integration) {
      setName(integration.name);
      setType(integration.type);
      setApiUrl((integration.config?.api_url as string) || '');
      setApiKey((integration.config?.api_key as string) || '');
      setAutoSync((integration.config?.auto_sync as boolean) ?? true);
      setSyncFrequency((integration.config?.sync_frequency as string) || 'daily');
    } else {
      setName('');
      setType('erp');
      setApiUrl('');
      setApiKey('');
      setAutoSync(true);
      setSyncFrequency('daily');
    }
  }, [integration, open]);

  const handleSave = () => {
    onSave({
      id: integration?.id,
      name,
      type,
      config: {
        api_url: apiUrl,
        api_key: apiKey,
        auto_sync: autoSync,
        sync_frequency: syncFrequency
      }
    });
  };

  const handleTest = () => {
    if (integration) {
      onTest(integration.id);
    }
  };

  const getStatusIcon = () => {
    if (!integration) return null;
    switch (integration.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            {integration ? 'Configurer l\'intégration' : 'Nouvelle intégration'}
          </DialogTitle>
          <DialogDescription>
            {integration 
              ? 'Modifiez les paramètres de connexion'
              : 'Configurez une nouvelle intégration externe'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="connection">Connexion</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de l'intégration</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: ERP Principal"
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="erp">ERP</SelectItem>
                  <SelectItem value="bank">Banque</SelectItem>
                  <SelectItem value="accounting">Comptabilité</SelectItem>
                  <SelectItem value="tax">Fiscalité</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {integration && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span>Statut de connexion</span>
                </div>
                <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                  {integration.status === 'connected' ? 'Connecté' :
                   integration.status === 'error' ? 'Erreur' : 'Déconnecté'}
                </Badge>
              </div>
            )}
          </TabsContent>

          <TabsContent value="connection" className="space-y-4">
            <div>
              <Label htmlFor="apiUrl" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                URL de l'API
              </Label>
              <Input
                id="apiUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>

            <div>
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Clé API
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoSync">Synchronisation automatique</Label>
              <Switch
                id="autoSync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>

            {autoSync && (
              <div>
                <Label htmlFor="syncFrequency">Fréquence de synchronisation</Label>
                <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Temps réel</SelectItem>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {integration && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Tester la connexion
              </Button>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={!name || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
