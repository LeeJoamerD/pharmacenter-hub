import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wrench, Database, Server, HardDrive, Activity, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MaintenanceSettings = () => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'Système en maintenance. Retour prévu dans 30 minutes.',
    autoMaintenance: true,
    maintenanceSchedule: '02:00',
    maintenanceDays: ['sunday'],
    diskCleanup: true,
    logRetention: 30,
    tempFileCleanup: true,
    databaseOptimization: true,
    cacheCleanup: true,
    sessionCleanup: true,
    emailNotifications: true,
    adminEmail: 'admin@pharmasoft.ci'
  });

  const [systemStats] = useState({
    diskUsage: 65,
    memoryUsage: 72,
    cpuUsage: 45,
    databaseSize: '2.4 GB',
    logSize: '156 MB',
    tempFiles: '89 MB',
    lastMaintenance: '2024-12-19 02:00:00',
    nextMaintenance: '2024-12-22 02:00:00',
    uptime: '15 jours 8 heures'
  });

  const [maintenanceTasks] = useState([
    { id: 1, name: 'Nettoyage des logs', status: 'completed', lastRun: '2024-12-19 02:05', duration: '2min' },
    { id: 2, name: 'Optimisation base de données', status: 'completed', lastRun: '2024-12-19 02:10', duration: '5min' },
    { id: 3, name: 'Nettoyage cache', status: 'completed', lastRun: '2024-12-19 02:15', duration: '1min' },
    { id: 4, name: 'Vérification disque', status: 'pending', lastRun: '2024-12-12 02:20', duration: '3min' },
    { id: 5, name: 'Sauvegarde automatique', status: 'running', lastRun: '2024-12-20 02:00', duration: '10min' }
  ]);

  const handleSave = () => {
    toast({
      title: "Paramètres de maintenance sauvegardés",
      description: "La configuration de maintenance a été mise à jour.",
    });
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleMaintenanceNow = () => {
    toast({
      title: "Maintenance lancée",
      description: "Les tâches de maintenance ont été démarrées.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'running': return 'En cours';
      case 'pending': return 'En attente';
      case 'error': return 'Erreur';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="space-y-6">
      {settings.maintenanceMode && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Le mode maintenance est activé. Les utilisateurs ne peuvent pas accéder au système.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Mode Maintenance
            </CardTitle>
            <CardDescription>
              Contrôle du mode maintenance système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenanceMode">Mode maintenance</Label>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maintenanceMessage">Message d'affichage</Label>
              <Input
                id="maintenanceMessage"
                value={settings.maintenanceMessage}
                onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoMaintenance">Maintenance automatique</Label>
              <Switch
                id="autoMaintenance"
                checked={settings.autoMaintenance}
                onCheckedChange={(checked) => handleSettingChange('autoMaintenance', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maintenanceSchedule">Heure de maintenance</Label>
              <Input
                id="maintenanceSchedule"
                type="time"
                value={settings.maintenanceSchedule}
                onChange={(e) => handleSettingChange('maintenanceSchedule', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email administrateur</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleSettingChange('adminEmail', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Statistiques Système
            </CardTitle>
            <CardDescription>
              État actuel du système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Utilisation disque</Label>
                <span className="text-sm text-muted-foreground">{systemStats.diskUsage}%</span>
              </div>
              <Progress value={systemStats.diskUsage} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Utilisation mémoire</Label>
                <span className="text-sm text-muted-foreground">{systemStats.memoryUsage}%</span>
              </div>
              <Progress value={systemStats.memoryUsage} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Utilisation CPU</Label>
                <span className="text-sm text-muted-foreground">{systemStats.cpuUsage}%</span>
              </div>
              <Progress value={systemStats.cpuUsage} className="h-2" />
            </div>
            
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Taille base de données:</span>
                <span>{systemStats.databaseSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Taille des logs:</span>
                <span>{systemStats.logSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Fichiers temporaires:</span>
                <span>{systemStats.tempFiles}</span>
              </div>
              <div className="flex justify-between">
                <span>Temps de fonctionnement:</span>
                <span>{systemStats.uptime}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Tâches de Maintenance
          </CardTitle>
          <CardDescription>
            Configuration et statut des tâches automatiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="diskCleanup">Nettoyage disque</Label>
              <Switch
                id="diskCleanup"
                checked={settings.diskCleanup}
                onCheckedChange={(checked) => handleSettingChange('diskCleanup', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="logRetentionLabel">Rétention logs (jours)</Label>
              <Input
                className="w-20"
                type="number"
                value={settings.logRetention}
                onChange={(e) => handleSettingChange('logRetention', Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="tempFileCleanup">Nettoyage fichiers temp</Label>
              <Switch
                id="tempFileCleanup"
                checked={settings.tempFileCleanup}
                onCheckedChange={(checked) => handleSettingChange('tempFileCleanup', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="databaseOptimization">Optimisation BDD</Label>
              <Switch
                id="databaseOptimization"
                checked={settings.databaseOptimization}
                onCheckedChange={(checked) => handleSettingChange('databaseOptimization', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="cacheCleanup">Nettoyage cache</Label>
              <Switch
                id="cacheCleanup"
                checked={settings.cacheCleanup}
                onCheckedChange={(checked) => handleSettingChange('cacheCleanup', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sessionCleanup">Nettoyage sessions</Label>
              <Switch
                id="sessionCleanup"
                checked={settings.sessionCleanup}
                onCheckedChange={(checked) => handleSettingChange('sessionCleanup', checked)}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-3">Historique des tâches</h4>
            <div className="space-y-2">
              {maintenanceTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                    <span className="font-medium">{task.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {task.lastRun} ({task.duration})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleMaintenanceNow} variant="outline">
          <Wrench className="h-4 w-4 mr-2" />
          Lancer maintenance maintenant
        </Button>
        <Button onClick={handleSave}>
          Sauvegarder la configuration
        </Button>
      </div>
    </div>
  );
};

export default MaintenanceSettings;