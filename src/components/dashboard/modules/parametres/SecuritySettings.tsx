import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Key, AlertTriangle, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SecuritySettings = () => {
  const { toast } = useToast();
  
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    sessionTimeout: 30,
    maxLoginAttempts: 3,
    lockoutDuration: 15,
    twoFactorAuth: false,
    ipWhitelist: '',
    auditLogging: true,
    encryptionLevel: 'AES256',
    backupEncryption: true,
    apiAccessControl: true,
    bruteForceProtection: true
  });

  const [securityLogs] = useState([
    { id: 1, event: 'Connexion réussie', user: 'admin', ip: '192.168.1.100', time: '2024-12-20 10:30:45', level: 'info' },
    { id: 2, event: 'Tentative de connexion échouée', user: 'unknown', ip: '192.168.1.105', time: '2024-12-20 10:25:12', level: 'warning' },
    { id: 3, event: 'Modification des paramètres', user: 'admin', ip: '192.168.1.100', time: '2024-12-20 09:15:30', level: 'info' },
    { id: 4, event: 'Accès API refusé', user: 'api_user', ip: '10.0.0.50', time: '2024-12-20 08:45:22', level: 'error' }
  ]);

  const handleSave = () => {
    toast({
      title: "Paramètres de sécurité sauvegardés",
      description: "La configuration de sécurité a été mise à jour.",
    });
  };

  const handleSettingChange = (key: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Les modifications des paramètres de sécurité affectent tous les utilisateurs. Assurez-vous de bien comprendre les implications avant de sauvegarder.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Politique des Mots de Passe
            </CardTitle>
            <CardDescription>
              Configuration des exigences de mots de passe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">Longueur minimale</Label>
              <Input
                id="passwordMinLength"
                type="number"
                min="6"
                max="20"
                value={securitySettings.passwordMinLength}
                onChange={(e) => handleSettingChange('passwordMinLength', Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="requireSpecial">Caractères spéciaux obligatoires</Label>
              <Switch
                id="requireSpecial"
                checked={securitySettings.passwordRequireSpecial}
                onCheckedChange={(checked) => handleSettingChange('passwordRequireSpecial', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="requireNumbers">Chiffres obligatoires</Label>
              <Switch
                id="requireNumbers"
                checked={securitySettings.passwordRequireNumbers}
                onCheckedChange={(checked) => handleSettingChange('passwordRequireNumbers', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="requireUppercase">Majuscules obligatoires</Label>
              <Switch
                id="requireUppercase"
                checked={securitySettings.passwordRequireUppercase}
                onCheckedChange={(checked) => handleSettingChange('passwordRequireUppercase', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Gestion des Sessions
            </CardTitle>
            <CardDescription>
              Paramètres de timeout et de connexion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout session (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="5"
                max="480"
                value={securitySettings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Tentatives de connexion max</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min="1"
                max="10"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Durée de verrouillage (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                min="1"
                max="1440"
                value={securitySettings.lockoutDuration}
                onChange={(e) => handleSettingChange('lockoutDuration', Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="twoFactorAuth">Authentification à 2 facteurs</Label>
              <Switch
                id="twoFactorAuth"
                checked={securitySettings.twoFactorAuth}
                onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité Avancée
          </CardTitle>
          <CardDescription>
            Configuration de sécurité avancée du système
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="encryptionLevel">Niveau de chiffrement</Label>
              <Select 
                value={securitySettings.encryptionLevel} 
                onValueChange={(value) => handleSettingChange('encryptionLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AES128">AES-128</SelectItem>
                  <SelectItem value="AES256">AES-256</SelectItem>
                  <SelectItem value="AES512">AES-512</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ipWhitelist">Liste blanche IP (optionnel)</Label>
              <Input
                id="ipWhitelist"
                placeholder="192.168.1.0/24, 10.0.0.0/8"
                value={securitySettings.ipWhitelist}
                onChange={(e) => handleSettingChange('ipWhitelist', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auditLogging">Journalisation d'audit</Label>
              <Switch
                id="auditLogging"
                checked={securitySettings.auditLogging}
                onCheckedChange={(checked) => handleSettingChange('auditLogging', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="backupEncryption">Chiffrement des sauvegardes</Label>
              <Switch
                id="backupEncryption"
                checked={securitySettings.backupEncryption}
                onCheckedChange={(checked) => handleSettingChange('backupEncryption', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="apiAccessControl">Contrôle d'accès API</Label>
              <Switch
                id="apiAccessControl"
                checked={securitySettings.apiAccessControl}
                onCheckedChange={(checked) => handleSettingChange('apiAccessControl', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="bruteForceProtection">Protection force brute</Label>
              <Switch
                id="bruteForceProtection"
                checked={securitySettings.bruteForceProtection}
                onCheckedChange={(checked) => handleSettingChange('bruteForceProtection', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Journaux de Sécurité
          </CardTitle>
          <CardDescription>
            Activité de sécurité récente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {securityLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={getLogLevelColor(log.level)}>
                    {log.level.toUpperCase()}
                  </Badge>
                  <div>
                    <p className="font-medium">{log.event}</p>
                    <p className="text-sm text-muted-foreground">
                      Utilisateur: {log.user} • IP: {log.ip}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {log.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Sauvegarder la configuration
        </Button>
      </div>
    </div>
  );
};

export default SecuritySettings;