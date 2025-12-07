import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Plug, Database, Activity, Settings, Plus, RefreshCw, Search, 
  MoreVertical, Trash2, Edit, Play, Download, CheckCircle, XCircle, 
  Clock, Zap, FileText, ArrowUpRight, ArrowDownLeft, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAIIntegrations, type AIProviderConnection, type AIDataSource, type AIWebhookEvent } from '@/hooks/useAIIntegrations';
import { AIProviderConfigDialog } from './dialogs/AIProviderConfigDialog';
import { AIDataSourceDialog } from './dialogs/AIDataSourceDialog';
import { AIWebhookEventDetailDialog } from './dialogs/AIWebhookEventDetailDialog';
import { AIIntegrationConfigDialog } from './dialogs/AIIntegrationConfigDialog';
import { 
  exportProvidersToPDF, exportProvidersToExcel,
  exportDataSourcesToPDF, exportDataSourcesToExcel,
  exportEventsToPDF, exportEventsToExcel,
  exportFullReportToPDF, exportFullReportToExcel
} from '@/utils/aiIntegrationExportUtils';

const AIIntegrations = () => {
  const {
    metrics, providers, dataSources, webhookEvents, config, isLoading,
    createProvider, updateProvider, deleteProvider, testProviderConnection,
    createDataSource, updateDataSource, deleteDataSource, syncDataSource,
    deleteWebhookEvent, clearOldEvents, updateConfig, refreshAll
  } = useAIIntegrations();

  // Dialog states
  const [providerDialog, setProviderDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; provider: AIProviderConnection | null }>({ open: false, mode: 'create', provider: null });
  const [sourceDialog, setSourceDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; source: AIDataSource | null }>({ open: false, mode: 'create', source: null });
  const [eventDetailDialog, setEventDetailDialog] = useState<{ open: boolean; event: AIWebhookEvent | null }>({ open: false, event: null });
  const [configDialog, setConfigDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'provider' | 'source' | 'event'; id: string; name: string }>({ open: false, type: 'provider', id: '', name: '' });

  // Filter states
  const [providerSearch, setProviderSearch] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');

  // Filtered data
  const filteredProviders = providers.filter(p => 
    p.provider_name.toLowerCase().includes(providerSearch.toLowerCase()) ||
    p.provider_type.toLowerCase().includes(providerSearch.toLowerCase())
  );

  const filteredSources = dataSources.filter(s => 
    s.source_name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
    s.source_type.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  const filteredEvents = webhookEvents.filter(e => 
    eventFilter === 'all' || e.status === eventFilter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'synced':
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Connecté</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erreur</Badge>;
      case 'pending':
      case 'syncing':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">Déconnecté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDeleteConfirm = () => {
    switch (deleteDialog.type) {
      case 'provider':
        deleteProvider(deleteDialog.id);
        break;
      case 'source':
        deleteDataSource(deleteDialog.id);
        break;
      case 'event':
        deleteWebhookEvent(deleteDialog.id);
        break;
    }
    setDeleteDialog({ open: false, type: 'provider', id: '', name: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Intégrations IA</h2>
          <p className="text-muted-foreground">Gérez vos connecteurs IA, sources de données et webhooks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => setConfigDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportFullReportToPDF(metrics, providers, dataSources, webhookEvents)}>
                Rapport complet (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportFullReportToExcel(metrics, providers, dataSources, webhookEvents)}>
                Rapport complet (Excel)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connecteurs actifs</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.active_providers || 0}/{metrics?.total_providers || 0}</div>
            <p className="text-xs text-muted-foreground">fournisseurs IA configurés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sources de données</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.active_sources || 0}</div>
            <p className="text-xs text-muted-foreground">{metrics?.total_records?.toLocaleString() || 0} enregistrements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appels API (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.api_calls_24h || 0}</div>
            <p className="text-xs text-muted-foreground">{metrics?.errors_24h || 0} erreurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.success_rate || 100}%</div>
            <p className="text-xs text-muted-foreground">latence moy: {metrics?.avg_latency_ms?.toFixed(0) || 0}ms</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers"><Plug className="h-4 w-4 mr-2" />Connecteurs IA</TabsTrigger>
          <TabsTrigger value="sources"><Database className="h-4 w-4 mr-2" />Sources de Données</TabsTrigger>
          <TabsTrigger value="webhooks"><Activity className="h-4 w-4 mr-2" />Webhooks</TabsTrigger>
          <TabsTrigger value="logs"><FileText className="h-4 w-4 mr-2" />Logs & Monitoring</TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-8"
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportProvidersToPDF(providers)}>PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportProvidersToExcel(providers)}>Excel</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setProviderDialog({ open: true, mode: 'create', provider: null })}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Modèle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Appels</TableHead>
                  <TableHead>Latence</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucun connecteur configuré
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">
                        {provider.provider_name}
                        {provider.is_default && <Badge variant="outline" className="ml-2">Par défaut</Badge>}
                      </TableCell>
                      <TableCell>{provider.provider_type}</TableCell>
                      <TableCell>{provider.model_name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(provider.status)}</TableCell>
                      <TableCell>{provider.total_calls}</TableCell>
                      <TableCell>{provider.avg_latency_ms?.toFixed(0) || 0}ms</TableCell>
                      <TableCell>
                        {provider.last_connection_at 
                          ? format(new Date(provider.last_connection_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => testProviderConnection(provider)}>
                              <Play className="h-4 w-4 mr-2" />Tester
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setProviderDialog({ open: true, mode: 'edit', provider })}>
                              <Edit className="h-4 w-4 mr-2" />Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteDialog({ open: true, type: 'provider', id: provider.id, name: provider.provider_name })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-8"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportDataSourcesToPDF(dataSources)}>PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportDataSourcesToExcel(dataSources)}>Excel</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setSourceDialog({ open: true, mode: 'create', source: null })}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Enregistrements</TableHead>
                  <TableHead>Dernière sync</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Aucune source de données configurée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="font-medium">{source.source_name}</TableCell>
                      <TableCell>{source.source_type}</TableCell>
                      <TableCell>{source.sync_frequency}</TableCell>
                      <TableCell>{getStatusBadge(source.sync_status)}</TableCell>
                      <TableCell>{source.records_count.toLocaleString()}</TableCell>
                      <TableCell>
                        {source.last_sync_at 
                          ? format(new Date(source.last_sync_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => syncDataSource(source)}>
                              <RefreshCw className="h-4 w-4 mr-2" />Synchroniser
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSourceDialog({ open: true, mode: 'edit', source })}>
                              <Edit className="h-4 w-4 mr-2" />Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteDialog({ open: true, type: 'source', id: source.id, name: source.source_name })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Webhooks</CardTitle>
              <CardDescription>Configurez les webhooks pour recevoir des notifications en temps réel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Types d'événements</h4>
                  <div className="space-y-2">
                    {['provider_call', 'data_sync', 'model_update', 'error', 'alert'].map((type) => (
                      <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <Badge variant="outline">{webhookEvents.filter(e => e.event_type === type).length}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Statistiques</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 border rounded-lg">
                      <span>Total événements</span>
                      <span className="font-medium">{webhookEvents.length}</span>
                    </div>
                    <div className="flex justify-between p-3 border rounded-lg">
                      <span>Succès</span>
                      <span className="font-medium text-green-500">
                        {webhookEvents.filter(e => e.status === 'success').length}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 border rounded-lg">
                      <span>Erreurs</span>
                      <span className="font-medium text-red-500">
                        {webhookEvents.filter(e => e.status === 'error').length}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 border rounded-lg">
                      <span>En attente</span>
                      <span className="font-medium text-yellow-500">
                        {webhookEvents.filter(e => e.status === 'pending').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant={eventFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setEventFilter('all')}
              >
                Tous
              </Button>
              <Button 
                variant={eventFilter === 'success' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setEventFilter('success')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />Succès
              </Button>
              <Button 
                variant={eventFilter === 'error' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setEventFilter('error')}
              >
                <XCircle className="h-4 w-4 mr-1" />Erreurs
              </Button>
              <Button 
                variant={eventFilter === 'pending' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setEventFilter('pending')}
              >
                <Clock className="h-4 w-4 mr-1" />En attente
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => clearOldEvents(30)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Nettoyer (+30j)
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportEventsToPDF(webhookEvents)}>PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportEventsToExcel(webhookEvents)}>Excel</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Latence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Aucun événement
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.slice(0, 50).map((event) => (
                    <TableRow key={event.id} className="cursor-pointer" onClick={() => setEventDetailDialog({ open: true, event })}>
                      <TableCell>{event.event_type}</TableCell>
                      <TableCell>{event.source}</TableCell>
                      <TableCell>
                        {event.direction === 'inbound' ? (
                          <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell>{event.latency_ms ? `${event.latency_ms}ms` : '-'}</TableCell>
                      <TableCell>
                        {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({ open: true, type: 'event', id: event.id, name: event.event_type });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AIProviderConfigDialog
        open={providerDialog.open}
        onOpenChange={(open) => setProviderDialog({ ...providerDialog, open })}
        provider={providerDialog.provider}
        mode={providerDialog.mode}
        onSave={(data) => {
          if (providerDialog.mode === 'create') {
            createProvider(data);
          } else if (providerDialog.provider) {
            updateProvider(providerDialog.provider.id, data);
          }
        }}
      />

      <AIDataSourceDialog
        open={sourceDialog.open}
        onOpenChange={(open) => setSourceDialog({ ...sourceDialog, open })}
        source={sourceDialog.source}
        mode={sourceDialog.mode}
        onSave={(data) => {
          if (sourceDialog.mode === 'create') {
            createDataSource(data);
          } else if (sourceDialog.source) {
            updateDataSource(sourceDialog.source.id, data);
          }
        }}
      />

      <AIWebhookEventDetailDialog
        open={eventDetailDialog.open}
        onOpenChange={(open) => setEventDetailDialog({ ...eventDetailDialog, open })}
        event={eventDetailDialog.event}
      />

      <AIIntegrationConfigDialog
        open={configDialog}
        onOpenChange={setConfigDialog}
        config={config}
        providers={providers}
        onSave={updateConfig}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deleteDialog.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIIntegrations;
