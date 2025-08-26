import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Download, Upload, Play, Archive, X, Eye, MoreHorizontal, Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useBackupSettings } from '@/hooks/useBackupSettings';
import { useBackupRuns, BackupRun } from '@/hooks/useBackupRuns';
import { Loader2 } from 'lucide-react';

const BackupSettings = () => {
  const {
    settings,
    loading: settingsLoading,
    saving,
    hasChanges,
    updateSetting,
    saveSettings,
    createManualBackup
  } = useBackupSettings();

  const {
    runs,
    loading: runsLoading,
    filters,
    metrics,
    updateFilters,
    refresh: refreshRuns,
    archive,
    cancel,
    relaunch
  } = useBackupRuns();

  const handleSave = () => {
    saveSettings();
  };

  const handleManualBackup = () => {
    createManualBackup('database');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'En attente', className: '' },
      running: { variant: 'default' as const, label: 'En cours', className: '' },
      success: { variant: 'default' as const, label: 'Réussi', className: 'bg-green-500' },
      failed: { variant: 'destructive' as const, label: 'Échec', className: '' },
      canceled: { variant: 'secondary' as const, label: 'Annulé', className: '' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      database: { label: 'Base de données', className: 'bg-blue-500' },
      files: { label: 'Fichiers', className: 'bg-purple-500' },
      full: { label: 'Complète', className: 'bg-indigo-500' },
      incremental: { label: 'Incrémentale', className: 'bg-gray-500' }
    };
    
    const config = variants[type as keyof typeof variants] || variants.database;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDuration = (started: string, completed: string | null) => {
    if (!completed) return '-';
    const start = new Date(started);
    const end = new Date(completed);
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatSize = (sizeMb: number | null) => {
    if (!sizeMb) return '-';
    if (sizeMb < 1024) return `${sizeMb} MB`;
    return `${(sizeMb / 1024).toFixed(1)} GB`;
  };

  const RunDetailsDialog = ({ run }: { run: BackupRun }) => (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Détails de l'exécution</DialogTitle>
        <DialogDescription>
          Informations détaillées sur la sauvegarde #{run.id.slice(-8)}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Statut</Label>
            <div className="mt-1">{getStatusBadge(run.status)}</div>
          </div>
          <div>
            <Label>Type</Label>
            <div className="mt-1">{getTypeBadge(run.type)}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Début</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(run.started_at).toLocaleString()}
            </p>
          </div>
          <div>
            <Label>Fin</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {run.completed_at ? new Date(run.completed_at).toLocaleString() : 'En cours'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Taille</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {formatSize(run.size_mb)}
            </p>
          </div>
          <div>
            <Label>Cible</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {run.storage_target || '-'}
            </p>
          </div>
        </div>

        <div>
          <Label>Configuration</Label>
          <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
            {JSON.stringify(run.configuration, null, 2)}
          </pre>
        </div>
      </div>
    </DialogContent>
  );

  const FilterPopover = () => (
    <PopoverContent className="w-80">
      <div className="space-y-4">
        <div>
          <Label>Statut</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['pending', 'running', 'success', 'failed', 'canceled'].map(status => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={status}
                  checked={filters.status.includes(status)}
                  onCheckedChange={(checked) => {
                    const newStatus = checked
                      ? [...filters.status, status]
                      : filters.status.filter(s => s !== status);
                    updateFilters({ status: newStatus });
                  }}
                />
                <Label htmlFor={status} className="text-sm">
                  {getStatusBadge(status)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Type</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['database', 'files', 'full', 'incremental'].map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={filters.type.includes(type)}
                  onCheckedChange={(checked) => {
                    const newTypes = checked
                      ? [...filters.type, type]
                      : filters.type.filter(t => t !== type);
                    updateFilters({ type: newTypes });
                  }}
                />
                <Label htmlFor={type} className="text-sm">
                  {getTypeBadge(type)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="archived"
            checked={filters.showArchived}
            onCheckedChange={(checked) => updateFilters({ showArchived: !!checked })}
          />
          <Label htmlFor="archived">Afficher les archivés</Label>
        </div>
      </div>
    </PopoverContent>
  );

  if (settingsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList>
        <TabsTrigger value="settings">Paramètres</TabsTrigger>
        <TabsTrigger value="history">Historique des sauvegardes</TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Paramètres de Sauvegarde
            </CardTitle>
            <CardDescription>
              Configuration des sauvegardes automatiques et manuelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoBackup">Sauvegarde automatique</Label>
              <Switch
                id="autoBackup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => updateSetting('autoBackup', checked)}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence</Label>
                <Select 
                  value={settings.backupFrequency} 
                  onValueChange={(value) => updateSetting('backupFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Chaque heure</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backupTime">Heure de sauvegarde</Label>
                <Input
                  id="backupTime"
                  type="time"
                  value={settings.backupTime}
                  onChange={(e) => updateSetting('backupTime', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retention">Rétention (jours)</Label>
              <Input
                id="retention"
                type="number"
                value={settings.retentionDays}
                onChange={(e) => updateSetting('retentionDays', Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="compression">Compression activée</Label>
              <Switch
                id="compression"
                checked={settings.compressionEnabled}
                onCheckedChange={(checked) => updateSetting('compressionEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="encryption">Chiffrement activé</Label>
              <Switch
                id="encryption"
                checked={settings.encryptionEnabled}
                onCheckedChange={(checked) => updateSetting('encryptionEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cloudBackup">Sauvegarde cloud</Label>
              <Switch
                id="cloudBackup"
                checked={settings.cloudBackup}
                onCheckedChange={(checked) => updateSetting('cloudBackup', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="localPath">Chemin local</Label>
              <Input
                id="localPath"
                value={settings.localPath}
                onChange={(e) => updateSetting('localPath', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={handleManualBackup} disabled={saving}>
            <Download className="h-4 w-4 mr-2" />
            Sauvegarde manuelle
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sauvegarder
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Historique des sauvegardes
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtres
                    </Button>
                  </PopoverTrigger>
                  <FilterPopover />
                </Popover>
                <Button variant="outline" size="sm" onClick={refreshRuns}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Suivi des exécutions de sauvegarde avec métriques et actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Métriques */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{metrics.totalRuns}</div>
                  <p className="text-xs text-muted-foreground">Total exécutions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{metrics.recentSuccess}</div>
                  <p className="text-xs text-muted-foreground">Succès (7j)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{metrics.recentFailed}</div>
                  <p className="text-xs text-muted-foreground">Échecs (7j)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-bold">
                    {metrics.lastRun ? metrics.lastRun.toLocaleDateString() : '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">Dernière exécution</p>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            {runsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Début</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Déclenché par</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Aucune sauvegarde trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      runs.map((run) => (
                        <TableRow key={run.id}>
                          <TableCell>
                            {new Date(run.started_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {formatDuration(run.started_at, run.completed_at)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(run.status)}
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(run.type)}
                          </TableCell>
                          <TableCell>
                            {formatSize(run.size_mb)}
                          </TableCell>
                          <TableCell>
                            {run.personnel ? `${run.personnel.prenoms} ${run.personnel.noms}` : 'Système'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Voir détails
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  <RunDetailsDialog run={run} />
                                </Dialog>
                                <DropdownMenuItem onClick={() => relaunch(run)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Relancer
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => archive(run.id, !run.is_archived)}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  {run.is_archived ? 'Désarchiver' : 'Archiver'}
                                </DropdownMenuItem>
                                {run.status === 'running' && (
                                  <DropdownMenuItem onClick={() => cancel(run.id)}>
                                    <X className="h-4 w-4 mr-2" />
                                    Annuler
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default BackupSettings;