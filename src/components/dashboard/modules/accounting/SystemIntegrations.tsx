import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Download, 
  RefreshCw, 
  AlertTriangle,
  Settings,
  Database,
  FileText,
  Link,
  Zap,
  ExternalLink,
  Trash2,
  Plus,
  Check
} from 'lucide-react';
import { useSystemIntegrations } from '@/hooks/useSystemIntegrations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SystemIntegrations = () => {
  const {
    moduleSyncConfigs,
    externalIntegrations,
    fecExports,
    webhooksConfig,
    apiTokens,
    regionalParameters,
    metrics,
    isLoading,
    syncModule,
    isSyncingModule,
    updateModuleSyncConfig,
    createExternalIntegration,
    testConnection,
    isTestingConnection,
    generateFEC,
    isGeneratingFEC,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    isTestingWebhook,
  } = useSystemIntegrations();

  const [selectedStartDate, setSelectedStartDate] = useState('2024-01-01');
  const [selectedEndDate, setSelectedEndDate] = useState('2024-12-31');
  const [selectedFormat, setSelectedFormat] = useState<'txt' | 'xlsx' | 'xml'>('txt');
  const [includeAnalytics, setIncludeAnalytics] = useState(false);
  
  const [newIntegrationType, setNewIntegrationType] = useState('');
  const [newIntegrationName, setNewIntegrationName] = useState('');

  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'pending': return 'bg-blue-500';
      case 'configured': return 'bg-purple-500';
      case 'error':
      case 'disconnected': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Réussi';
      case 'connected': return 'Connecté';
      case 'warning': return 'Attention';
      case 'pending': return 'En attente';
      case 'configured': return 'Configuré';
      case 'error': return 'Erreur';
      case 'disconnected': return 'Déconnecté';
      default: return status;
    }
  };

  const getModuleDescription = (moduleName: string) => {
    const descriptions: Record<string, string> = {
      stock: 'Synchronisation des mouvements de stock et valorisation',
      ventes: 'Import automatique des factures et encaissements',
      personnel: 'Synchronisation des charges sociales et salaires',
      partenaires: 'Mise à jour des données fournisseurs et clients',
    };
    return descriptions[moduleName] || '';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const handleGenerateFEC = () => {
    generateFEC({
      start_date: selectedStartDate,
      end_date: selectedEndDate,
      format: selectedFormat,
      include_analytics: includeAnalytics,
    });
  };

  const handleCreateIntegration = () => {
    if (!newIntegrationType || !newIntegrationName) return;
    
    createExternalIntegration({
      integration_type: newIntegrationType as 'bank' | 'accounting' | 'tax' | 'social' | 'erp',
      provider_name: newIntegrationName,
      status: 'configured',
      is_active: true,
    });
    
    setNewIntegrationType('');
    setNewIntegrationName('');
  };

  const handleCreateWebhook = () => {
    if (!newWebhookName || !newWebhookUrl) return;
    
    createWebhook({
      name: newWebhookName,
      url: newWebhookUrl,
      is_active: true,
      events: ['invoice.created', 'payment.received'],
      retry_count: 3,
      timeout_seconds: 30,
    });
    
    setNewWebhookName('');
    setNewWebhookUrl('');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Intégrations Système</h2>
        <p className="text-muted-foreground">
          Synchronisation modules et intégrations externes
        </p>
      </div>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Modules Internes</TabsTrigger>
          <TabsTrigger value="external">Intégrations Externes</TabsTrigger>
          <TabsTrigger value="fec">Export FEC</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
        </TabsList>

        {/* ONGLET MODULES INTERNES */}
        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Synchronisation des Modules
              </CardTitle>
              <CardDescription>
                Gestion de la synchronisation automatique entre les modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{metrics.totalModules}</div>
                    <p className="text-sm text-muted-foreground">Total Modules</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{metrics.connectedModules}</div>
                    <p className="text-sm text-muted-foreground">Actifs</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{metrics.autoSyncModules}</div>
                    <p className="text-sm text-muted-foreground">Auto Sync</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium">{formatDate(metrics.lastGlobalSync)}</div>
                    <p className="text-sm text-muted-foreground">Dernière Sync</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="grid gap-4">
                {moduleSyncConfigs?.map((module) => (
                  <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(module.last_sync_status || 'disconnected')}`} />
                      <div>
                        <h4 className="font-medium capitalize">{module.module_name}</h4>
                        <p className="text-sm text-muted-foreground">{getModuleDescription(module.module_name)}</p>
                        <p className="text-xs text-muted-foreground">
                          Dernière sync : {formatDate(module.last_sync_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`auto-${module.id}`} className="text-sm">Auto</Label>
                        <Switch 
                          id={`auto-${module.id}`}
                          checked={module.auto_sync}
                          onCheckedChange={(checked) => 
                            updateModuleSyncConfig({ ...module, auto_sync: checked })
                          }
                        />
                      </div>
                      <Badge variant="outline">
                        {getStatusText(module.last_sync_status || 'disconnected')}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => syncModule(module.module_name)}
                        disabled={isSyncingModule}
                      >
                        <RefreshCw className={`h-4 w-4 ${isSyncingModule ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET INTEGRATIONS EXTERNES */}
        <TabsContent value="external" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Intégrations Externes
              </CardTitle>
              <CardDescription>
                Connexions avec les services externes et partenaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{metrics.totalExternalIntegrations}</div>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{metrics.connectedExternals}</div>
                    <p className="text-sm text-muted-foreground">Connectées</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium">
                      {regionalParameters?.banking_api_available ? 'Oui' : 'Non'}
                    </div>
                    <p className="text-sm text-muted-foreground">API Bancaire</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="grid gap-4">
                {externalIntegrations?.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.status)}`} />
                      <div>
                        <h4 className="font-medium">{integration.provider_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {integration.metadata?.description || `Intégration ${integration.integration_type}`}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          {integration.integration_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getStatusText(integration.status)}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => testConnection(integration.id)}
                        disabled={isTestingConnection}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Ajouter une Nouvelle Intégration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="integration-type">Type d'intégration</Label>
                    <Select value={newIntegrationType} onValueChange={setNewIntegrationType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Banque</SelectItem>
                        <SelectItem value="accounting">Expert-Comptable</SelectItem>
                        <SelectItem value="tax">Administration Fiscale</SelectItem>
                        <SelectItem value="social">Organisme Social</SelectItem>
                        <SelectItem value="erp">ERP Externe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="integration-name">Nom du service</Label>
                    <Input 
                      id="integration-name" 
                      placeholder="Nom du service"
                      value={newIntegrationName}
                      onChange={(e) => setNewIntegrationName(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreateIntegration}>
                  <Plus className="h-4 w-4 mr-2" />
                  Configurer l'Intégration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET EXPORT FEC */}
        <TabsContent value="fec" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export FEC
              </CardTitle>
              <CardDescription>
                Fichier des Écritures Comptables pour l'administration fiscale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {regionalParameters?.fec_obligatoire && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Obligation FEC</AlertTitle>
                  <AlertDescription>
                    Le FEC est obligatoire en {regionalParameters.pays} pour les entreprises 
                    tenant une comptabilité informatisée. Conservation : {regionalParameters.data_retention_years} ans.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fec-start">Date de début</Label>
                  <Input 
                    type="date" 
                    id="fec-start" 
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fec-end">Date de fin</Label>
                  <Input 
                    type="date" 
                    id="fec-end" 
                    value={selectedEndDate}
                    onChange={(e) => setSelectedEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fec-format">Format d'export</Label>
                <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Format FEC" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt">FEC Standard (TXT)</SelectItem>
                    <SelectItem value="xlsx">FEC Excel (XLSX)</SelectItem>
                    {regionalParameters?.fec_format_defaut === 'xml' && (
                      <SelectItem value="xml">FEC XML</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="include-analytics" 
                  checked={includeAnalytics}
                  onCheckedChange={setIncludeAnalytics}
                />
                <Label htmlFor="include-analytics">Inclure la comptabilité analytique</Label>
              </div>

              <Button 
                onClick={handleGenerateFEC}
                disabled={isGeneratingFEC}
                className="w-full"
              >
                {isGeneratingFEC ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Générer et Télécharger le FEC
                  </>
                )}
              </Button>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Historique des Exports</h4>
                <div className="space-y-2">
                  {fecExports?.map((fecExport) => (
                    <div key={fecExport.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">
                          FEC {format(new Date(fecExport.start_date), 'yyyy')}
                          {fecExport.exercice_id && ` - Exercice ${fecExport.exercice_id.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(fecExport.created_at)} • 
                          {fecExport.format.toUpperCase()} • 
                          {fecExport.file_size_mb} MB • 
                          {fecExport.total_entries} écritures
                        </p>
                        {fecExport.validation_errors && (
                          <Badge variant="destructive">Erreurs de validation</Badge>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!fecExports || fecExports.length === 0) && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Aucun export disponible
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET API & WEBHOOKS */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                API & Webhooks
              </CardTitle>
              <CardDescription>
                Configuration des API et notifications automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">API REST</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Clé d'API</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={apiTokens?.[0]?.token_hash ? 
                            `sk_prod_${'•'.repeat(24)}${apiTokens[0].token_hash.slice(-4)}` : 
                            'Aucun token'
                          }
                          readOnly 
                        />
                        <Button size="sm" variant="outline">
                          Copier
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Documentation API
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Webhooks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold">{metrics.totalWebhooks}</div>
                    <p className="text-sm text-muted-foreground">
                      {metrics.activeWebhooks} actifs • 
                      {metrics.webhookSuccessRate.toFixed(1)}% succès
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Webhooks Configurés</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Appels</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooksConfig?.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell className="font-medium">{webhook.name}</TableCell>
                        <TableCell className="text-sm">{webhook.url}</TableCell>
                        <TableCell>
                          <Switch 
                            checked={webhook.is_active}
                            onCheckedChange={(checked) => 
                              updateWebhook({ id: webhook.id, updates: { is_active: checked } })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {webhook.success_calls}/{webhook.total_calls}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => testWebhook(webhook.id)}
                              disabled={isTestingWebhook}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteWebhook(webhook.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Nouveau Webhook</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-name">Nom du webhook</Label>
                    <Input 
                      id="webhook-name" 
                      placeholder="Nom du webhook"
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">URL de notification</Label>
                    <Input 
                      id="webhook-url" 
                      placeholder="https://votre-site.com/webhook"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreateWebhook}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemIntegrations;
