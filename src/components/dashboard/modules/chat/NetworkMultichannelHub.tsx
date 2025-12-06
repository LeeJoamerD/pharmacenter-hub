import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Globe,
  MessageSquare,
  Mail,
  Phone,
  Smartphone,
  Video,
  Zap,
  Settings,
  Activity,
  BarChart,
  Send,
  Plus,
  RefreshCw,
  Download,
  Trash2,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Share2,
  AlertTriangle
} from 'lucide-react';
import { useNetworkMultichannel, type MultichannelConnector, type AutomationRule } from '@/hooks/useNetworkMultichannel';
import CreateConnectorDialog from './dialogs/CreateConnectorDialog';
import ConnectorConfigDialog from './dialogs/ConnectorConfigDialog';
import CreateAutomationRuleDialog from './dialogs/CreateAutomationRuleDialog';
import ChannelAnalyticsDialog from './dialogs/ChannelAnalyticsDialog';
import { exportConnectorsToExcel, exportConnectorsToPDF, exportFullMultichannelReport } from '@/utils/multichannelExportUtils';
import { toast } from 'sonner';

const NetworkMultichannelHub = () => {
  const {
    loading,
    connectors,
    automationRules,
    analytics,
    metrics,
    globalConfig,
    createConnector,
    updateConnector,
    deleteConnector,
    toggleConnectorStatus,
    testConnector,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
    updateGlobalConfig,
    updateChannelPriorities,
    refreshAllData
  } = useNetworkMultichannel();

  // Dialog states
  const [createConnectorOpen, setCreateConnectorOpen] = useState(false);
  const [configConnectorOpen, setConfigConnectorOpen] = useState(false);
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<MultichannelConnector | null>(null);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'sms': return <Smartphone className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'whatsapp': return <MessageSquare className="h-5 w-5" />;
      case 'teams': return <Video className="h-5 w-5" />;
      case 'slack': return <Zap className="h-5 w-5" />;
      case 'webhook': return <Globe className="h-5 w-5" />;
      case 'telegram': return <Send className="h-5 w-5" />;
      case 'messenger': return <MessageSquare className="h-5 w-5" />;
      default: return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const handleOpenConfig = (connector: MultichannelConnector) => {
    setSelectedConnector(connector);
    setConfigConnectorOpen(true);
  };

  const handleOpenAnalytics = (connector: MultichannelConnector) => {
    setSelectedConnector(connector);
    setAnalyticsOpen(true);
  };

  const handleTestConnector = async (connector: MultichannelConnector) => {
    const result = await testConnector(connector.id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      exportConnectorsToExcel(connectors);
    } else {
      exportConnectorsToPDF(connectors);
    }
  };

  const handleMoveChannel = async (index: number, direction: 'up' | 'down') => {
    const newConnectors = [...connectors];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newConnectors.length) return;
    
    [newConnectors[index], newConnectors[newIndex]] = [newConnectors[newIndex], newConnectors[index]];
    
    const priorities = newConnectors.map((c, i) => ({
      channelType: c.channel_type,
      order: i
    }));
    
    await updateChannelPriorities(priorities);
  };

  // Get routing rules
  const routingRules = automationRules.filter(r => r.rule_type === 'routing');
  const autoResponseRules = automationRules.filter(r => r.rule_type === 'auto_response');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            Hub Multi-Canaux Réseau
          </h1>
          <p className="text-muted-foreground">
            Centre de communication multi-canaux unifié pour le réseau multi-officines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" onClick={refreshAllData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setCreateConnectorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau canal
          </Button>
        </div>
      </div>

      {/* Métriques multi-canaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canaux Actifs</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeChannels}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalChannels} total configurés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Envoyés</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMessagesSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Réponse</CardTitle>
            <BarChart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseRate}%</div>
            <p className="text-xs text-muted-foreground">
              Moyenne réseau
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uptimePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              Uptime global
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Canaux</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        {/* Gestion des canaux */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Canaux de Communication
              </CardTitle>
              <CardDescription>
                Gestion centralisée de tous les canaux de communication
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun canal configuré</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setCreateConnectorOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un canal
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {connectors.map((connector) => (
                    <div key={connector.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            {getChannelIcon(connector.channel_type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{connector.name}</h4>
                              {connector.is_network_shared && (
                                <Share2 className="h-3 w-3 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">{connector.channel_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(connector.status)}`}></div>
                          <Badge variant={connector.status === 'active' ? 'default' : 'secondary'}>
                            {connector.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {connector.last_error && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-destructive/10 rounded text-sm text-destructive">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{connector.last_error}</span>
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Messages envoyés:</span>
                          <span className="font-medium">{connector.messages_sent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taux de réponse:</span>
                          <span className="font-medium">{connector.response_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dernière utilisation:</span>
                          <span className="font-medium">
                            {connector.last_used_at 
                              ? new Date(connector.last_used_at).toLocaleDateString('fr-FR')
                              : 'Jamais'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenConfig(connector)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configurer
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenAnalytics(connector)}
                        >
                          <BarChart className="h-4 w-4 mr-2" />
                          Stats
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnector(connector)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleConnectorStatus(connector.id)}
                        >
                          {connector.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automatisation */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Règles d'Automatisation
                </CardTitle>
                <CardDescription>
                  Configuration des règles de routage et d'automatisation
                </CardDescription>
              </div>
              <Button onClick={() => setCreateRuleOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle règle
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Routage Intelligent</h4>
                    <div className="space-y-3">
                      {routingRules.length > 0 ? (
                        routingRules.map(rule => (
                          <div key={rule.id} className="flex items-center justify-between">
                            <Label>{rule.name}</Label>
                            <Switch 
                              checked={rule.is_active}
                              onCheckedChange={() => toggleRuleStatus(rule.id)}
                            />
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <Label>Messages urgents → SMS</Label>
                            <Switch 
                              checked={globalConfig.fallbackEnabled}
                              onCheckedChange={(checked) => updateGlobalConfig({ fallbackEnabled: checked })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Rapports → Email</Label>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Discussions → WhatsApp</Label>
                            <Switch />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Réponses Automatiques</h4>
                    <div className="space-y-3">
                      {autoResponseRules.length > 0 ? (
                        autoResponseRules.map(rule => (
                          <div key={rule.id} className="flex items-center justify-between">
                            <Label>{rule.name}</Label>
                            <Switch 
                              checked={rule.is_active}
                              onCheckedChange={() => toggleRuleStatus(rule.id)}
                            />
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <Label>Accusé de réception</Label>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Réponse hors horaires</Label>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Escalade automatique</Label>
                            <Switch />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {automationRules.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Toutes les règles ({automationRules.length})</h4>
                    <div className="space-y-2">
                      {automationRules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                              {rule.rule_type}
                            </Badge>
                            <span>{rule.name}</span>
                            {rule.is_network_rule && (
                              <Share2 className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {rule.execution_count} exécutions
                            </span>
                            <Switch 
                              checked={rule.is_active}
                              onCheckedChange={() => toggleRuleStatus(rule.id)}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteRule(rule.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics multi-canaux */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Analytics Multi-Canaux
              </CardTitle>
              <CardDescription>
                Performance et métriques des communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Performance par Canal</h4>
                  <div className="space-y-3">
                    {connectors.length > 0 ? (
                      connectors.slice(0, 5).map((connector) => (
                        <div 
                          key={connector.id} 
                          className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded"
                          onClick={() => handleOpenAnalytics(connector)}
                        >
                          <div className="flex items-center gap-2">
                            {getChannelIcon(connector.channel_type)}
                            <span className="text-sm">{connector.name}</span>
                          </div>
                          <span className="font-medium">{connector.response_rate}%</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun canal configuré</p>
                    )}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Tendances Temporelles</h4>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        +{Math.round((metrics.avgResponseRate / 100) * 18)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Engagement ce mois</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">2.3s</div>
                      <div className="text-sm text-muted-foreground">Temps de réponse moyen</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration Multi-Canaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Priorité des canaux</Label>
                    <div className="space-y-2 mt-2">
                      {connectors.length > 0 ? (
                        connectors.map((connector, index) => (
                          <div key={connector.id} className="p-2 border rounded flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{index + 1}.</span>
                              {getChannelIcon(connector.channel_type)}
                              <span className="text-sm">{connector.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMoveChannel(index, 'up')}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMoveChannel(index, 'down')}
                                disabled={index === connectors.length - 1}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="p-2 border rounded flex items-center justify-between">
                            <span className="text-sm">1. SMS</span>
                            <Button variant="ghost" size="sm">↕</Button>
                          </div>
                          <div className="p-2 border rounded flex items-center justify-between">
                            <span className="text-sm">2. WhatsApp</span>
                            <Button variant="ghost" size="sm">↕</Button>
                          </div>
                          <div className="p-2 border rounded flex items-center justify-between">
                            <span className="text-sm">3. Email</span>
                            <Button variant="ghost" size="sm">↕</Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Paramètres globaux</Label>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center justify-between">
                        <Label>Fallback automatique</Label>
                        <Switch 
                          checked={globalConfig.fallbackEnabled}
                          onCheckedChange={(checked) => updateGlobalConfig({ fallbackEnabled: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Logs détaillés</Label>
                        <Switch 
                          checked={globalConfig.detailedLogs}
                          onCheckedChange={(checked) => updateGlobalConfig({ detailedLogs: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Notifications temps réel</Label>
                        <Switch 
                          checked={globalConfig.realtimeNotifications}
                          onCheckedChange={(checked) => updateGlobalConfig({ realtimeNotifications: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => toast.success('Configuration sauvegardée')}>
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateConnectorDialog
        open={createConnectorOpen}
        onOpenChange={setCreateConnectorOpen}
        onSubmit={createConnector}
      />

      <ConnectorConfigDialog
        open={configConnectorOpen}
        onOpenChange={setConfigConnectorOpen}
        connector={selectedConnector}
        onSave={updateConnector}
        onTest={testConnector}
      />

      <CreateAutomationRuleDialog
        open={createRuleOpen}
        onOpenChange={setCreateRuleOpen}
        onSubmit={createRule}
        connectors={connectors}
      />

      <ChannelAnalyticsDialog
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
        connector={selectedConnector}
        analytics={analytics}
      />
    </div>
  );
};

export default NetworkMultichannelHub;
