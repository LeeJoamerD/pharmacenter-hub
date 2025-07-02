import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BackupSettings = () => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    compressionEnabled: true,
    encryptionEnabled: true,
    cloudBackup: false,
    localPath: '/backups/pharmasoft'
  });

  const handleSave = () => {
    toast({
      title: "Paramètres de sauvegarde mis à jour",
      description: "La configuration de sauvegarde a été sauvegardée.",
    });
  };

  const handleManualBackup = () => {
    toast({
      title: "Sauvegarde manuelle lancée",
      description: "Une sauvegarde complète est en cours.",
    });
  };

  return (
    <div className="space-y-6">
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
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="frequency">Fréquence</Label>
              <Select value={settings.backupFrequency} onValueChange={(value) => setSettings(prev => ({ ...prev, backupFrequency: value }))}>
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
                onChange={(e) => setSettings(prev => ({ ...prev, backupTime: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="retention">Rétention (jours)</Label>
            <Input
              id="retention"
              type="number"
              value={settings.retentionDays}
              onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: Number(e.target.value) }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="compression">Compression activée</Label>
            <Switch
              id="compression"
              checked={settings.compressionEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, compressionEnabled: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="encryption">Chiffrement activé</Label>
            <Switch
              id="encryption"
              checked={settings.encryptionEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, encryptionEnabled: checked }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="localPath">Chemin local</Label>
            <Input
              id="localPath"
              value={settings.localPath}
              onChange={(e) => setSettings(prev => ({ ...prev, localPath: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleManualBackup}>
          <Download className="h-4 w-4 mr-2" />
          Sauvegarde manuelle
        </Button>
        <Button onClick={handleSave}>Sauvegarder</Button>
      </div>
    </div>
  );
};

export default BackupSettings;