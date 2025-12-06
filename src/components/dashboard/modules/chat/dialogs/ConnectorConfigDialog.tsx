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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Key, Shield, Share2, AlertTriangle, CheckCircle } from 'lucide-react';
import type { MultichannelConnector } from '@/hooks/useNetworkMultichannel';

interface ConnectorConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connector: MultichannelConnector | null;
  onSave: (id: string, updates: Partial<MultichannelConnector>) => void;
  onTest: (id: string) => Promise<{ success: boolean; message: string }>;
}

const ConnectorConfigDialog: React.FC<ConnectorConfigDialogProps> = ({
  open,
  onOpenChange,
  connector,
  onSave,
  onTest
}) => {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [configJson, setConfigJson] = useState('{}');
  const [isNetworkShared, setIsNetworkShared] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (connector) {
      setName(connector.name);
      setProvider(connector.provider);
      setConfigJson(JSON.stringify(connector.config, null, 2));
      setIsNetworkShared(connector.is_network_shared);
      setTestResult(null);
    }
  }, [connector]);

  const handleSave = () => {
    if (!connector) return;
    
    try {
      const config = JSON.parse(configJson);
      onSave(connector.id, {
        name,
        provider,
        config,
        is_network_shared: isNetworkShared
      });
      onOpenChange(false);
    } catch {
      // Invalid JSON
    }
  };

  const handleTest = async () => {
    if (!connector) return;
    
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await onTest(connector.id);
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  if (!connector) return null;

  const getStatusBadge = () => {
    switch (connector.status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configuration - {connector.name}
            <span className="ml-2">{getStatusBadge()}</span>
          </DialogTitle>
          <DialogDescription>
            Configurez les paramètres du canal {connector.channel_type.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="credentials">Identifiants</TabsTrigger>
            <TabsTrigger value="sharing">Partage</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du canal</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Fournisseur</Label>
              <Input
                id="provider"
                value={provider}
                onChange={e => setProvider(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Messages envoyés</p>
                <p className="text-2xl font-bold">{connector.messages_sent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de réponse</p>
                <p className="text-2xl font-bold">{connector.response_rate}%</p>
              </div>
            </div>

            {connector.last_error && (
              <div className="flex items-start gap-2 p-3 border border-destructive/50 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Dernière erreur</p>
                  <p className="text-sm text-muted-foreground">{connector.last_error}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="credentials" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-amber-500/10">
              <Key className="h-5 w-5 text-amber-500" />
              <p className="text-sm">Les identifiants sont stockés de manière sécurisée</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={configJson}
                onChange={e => setConfigJson(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? 'Test en cours...' : 'Tester la connexion'}
              </Button>
              
              {testResult && (
                <div className={`flex items-center gap-2 ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sharing" className="space-y-4 mt-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Share2 className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Partager avec le réseau</p>
                    <p className="text-sm text-muted-foreground">
                      Permettre aux autres pharmacies d'utiliser ce canal
                    </p>
                  </div>
                  <Switch
                    checked={isNetworkShared}
                    onCheckedChange={setIsNetworkShared}
                  />
                </div>
              </div>
            </div>

            {isNetworkShared && (
              <div className="flex items-start gap-2 p-3 border rounded-lg bg-blue-500/10">
                <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Canal partagé</p>
                  <p className="text-xs text-muted-foreground">
                    Ce canal sera visible par toutes les pharmacies du réseau. 
                    Les identifiants restent protégés.
                  </p>
                </div>
              </div>
            )}

            {connector.shared_with_pharmacies.length > 0 && (
              <div className="space-y-2">
                <Label>Pharmacies ayant accès</Label>
                <div className="flex flex-wrap gap-2">
                  {connector.shared_with_pharmacies.map((id, index) => (
                    <Badge key={id} variant="outline">
                      Pharmacie {index + 1}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

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

export default ConnectorConfigDialog;
