import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Key, AlertTriangle, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSecuritySettings } from '@/hooks/useSecuritySettings';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SecuritySettings = () => {
  const { toast } = useToast();
  const { settings, loading, saving, savePasswordPolicy, saveSecurityConfig, resolveAlert } = useSecuritySettings();
  
  const [localPasswordPolicy, setLocalPasswordPolicy] = useState(settings?.passwordPolicy);
  const [localSecurityConfig, setLocalSecurityConfig] = useState(settings?.securityConfig);
  const [hasPasswordChanges, setHasPasswordChanges] = useState(false);
  const [hasSecurityChanges, setHasSecurityChanges] = useState(false);

  // Mettre à jour les états locaux quand les settings se chargent
  React.useEffect(() => {
    if (settings) {
      setLocalPasswordPolicy(settings.passwordPolicy);
      setLocalSecurityConfig(settings.securityConfig);
    }
  }, [settings]);

  const handlePasswordPolicyChange = (key: string, value: any) => {
    if (!localPasswordPolicy) return;
    
    // Mettre à jour les paramètres localement
    const updatedPolicy = { ...localPasswordPolicy };
    switch (key) {
      case 'passwordMinLength':
        updatedPolicy.min_length = value;
        break;
      case 'passwordRequireSpecial':
        updatedPolicy.require_special_chars = value;
        break;
      case 'passwordRequireNumbers':
        updatedPolicy.require_numbers = value;
        break;
      case 'passwordRequireUppercase':
        updatedPolicy.require_uppercase = value;
        break;
      case 'sessionTimeout':
        updatedPolicy.session_timeout_minutes = value;
        break;
      case 'maxLoginAttempts':
        updatedPolicy.max_failed_attempts = value;
        break;
      case 'lockoutDuration':
        updatedPolicy.lockout_duration_minutes = value;
        break;
      case 'twoFactorAuth':
        updatedPolicy.force_2fa_for_roles = value ? ['Admin', 'Pharmacien'] : [];
        break;
    }
    
    setLocalPasswordPolicy(updatedPolicy);
    setHasPasswordChanges(true);
  };

  const handleSecurityConfigChange = (key: string, value: any) => {
    if (!localSecurityConfig) return;
    
    const updatedConfig = { ...localSecurityConfig };
    switch (key) {
      case 'encryptionLevel':
        updatedConfig.security_level = value.toLowerCase();
        break;
      case 'bruteForceProtection':
        updatedConfig.auto_block_violations = value;
        break;
      case 'ipWhitelist':
        updatedConfig.allowed_source_tenants = value;
        break;
    }
    
    setLocalSecurityConfig(updatedConfig);
    setHasSecurityChanges(true);
  };

  const handleSavePasswordPolicy = async () => {
    if (!localPasswordPolicy) return;
    
    await savePasswordPolicy(localPasswordPolicy);
    setHasPasswordChanges(false);
  };

  const handleSaveSecurityConfig = async () => {
    if (!localSecurityConfig) return;
    
    await saveSecurityConfig(localSecurityConfig);
    setHasSecurityChanges(false);
  };

  const getLogLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error': 
      case 'failed': 
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'warning': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'info': 
      case 'success':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': 
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'high': 
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'medium': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'low': 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Impossible de charger les paramètres de sécurité.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
                value={localPasswordPolicy?.min_length || 8}
                onChange={(e) => handlePasswordPolicyChange('passwordMinLength', Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="requireSpecial">Caractères spéciaux obligatoires</Label>
              <Switch
                id="requireSpecial"
                checked={localPasswordPolicy?.require_special_chars || false}
                onCheckedChange={(checked) => handlePasswordPolicyChange('passwordRequireSpecial', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="requireNumbers">Chiffres obligatoires</Label>
              <Switch
                id="requireNumbers"
                checked={localPasswordPolicy?.require_numbers || false}
                onCheckedChange={(checked) => handlePasswordPolicyChange('passwordRequireNumbers', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="requireUppercase">Majuscules obligatoires</Label>
              <Switch
                id="requireUppercase"
                checked={localPasswordPolicy?.require_uppercase || false}
                onCheckedChange={(checked) => handlePasswordPolicyChange('passwordRequireUppercase', checked)}
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
                value={localPasswordPolicy?.session_timeout_minutes || 30}
                onChange={(e) => handlePasswordPolicyChange('sessionTimeout', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Tentatives de connexion max</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min="1"
                max="10"
                value={localPasswordPolicy?.max_failed_attempts || 3}
                onChange={(e) => handlePasswordPolicyChange('maxLoginAttempts', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Durée de verrouillage (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                min="1"
                max="1440"
                value={localPasswordPolicy?.lockout_duration_minutes || 15}
                onChange={(e) => handlePasswordPolicyChange('lockoutDuration', Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="twoFactorAuth">Authentification à 2 facteurs</Label>
              <Switch
                id="twoFactorAuth"
                checked={localPasswordPolicy?.force_2fa_for_roles && localPasswordPolicy.force_2fa_for_roles.length > 0}
                onCheckedChange={(checked) => handlePasswordPolicyChange('twoFactorAuth', checked)}
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
                value={localSecurityConfig?.security_level || 'standard'} 
                onValueChange={(value) => handleSecurityConfigChange('encryptionLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="enhanced">Enhanced</SelectItem>
                  <SelectItem value="maximum">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ipWhitelist">Liste blanche IP (optionnel)</Label>
              <Input
                id="ipWhitelist"
                placeholder="192.168.1.0/24, 10.0.0.0/8"
                value={localSecurityConfig?.allowed_source_tenants?.join(', ') || ''}
                onChange={(e) => {
                  const tenants = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                  handleSecurityConfigChange('ipWhitelist', tenants);
                }}
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auditLogging">Journalisation d'audit</Label>
              <Switch
                id="auditLogging"
                checked={true}
                disabled={true}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="backupEncryption">Chiffrement des sauvegardes</Label>
              <Switch
                id="backupEncryption"
                checked={localSecurityConfig?.security_level !== 'basic'}
                disabled={true}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="apiAccessControl">Contrôle d'accès API</Label>
              <Switch
                id="apiAccessControl"
                checked={!localSecurityConfig?.allow_cross_tenant_read}
                disabled={true}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="bruteForceProtection">Protection force brute</Label>
              <Switch
                id="bruteForceProtection"
                checked={localSecurityConfig?.auto_block_violations || false}
                onCheckedChange={(checked) => handleSecurityConfigChange('bruteForceProtection', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boutons de sauvegarde */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Politique des mots de passe</h3>
                <p className="text-sm text-muted-foreground">
                  Sauvegarder les modifications de sécurité
                </p>
              </div>
              <Button 
                onClick={handleSavePasswordPolicy}
                disabled={!hasPasswordChanges || saving}
                variant={hasPasswordChanges ? "default" : "outline"}
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Configuration avancée</h3>
                <p className="text-sm text-muted-foreground">
                  Sauvegarder les paramètres de sécurité
                </p>
              </div>
              <Button 
                onClick={handleSaveSecurityConfig}
                disabled={!hasSecurityChanges || saving}
                variant={hasSecurityChanges ? "default" : "outline"}
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes de sécurité */}
      {settings.securityAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes de Sécurité
            </CardTitle>
            <CardDescription>
              Alertes de sécurité nécessitant votre attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settings.securityAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{alert.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {alert.alert_type} • 
                        {alert.ip_address && ` IP: ${alert.ip_address} • `}
                        {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveAlert(alert.id)}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Résoudre
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journaux d'audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Journaux d'Audit
          </CardTitle>
          <CardDescription>
            Activité récente du système (30 derniers jours)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {settings.securityLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Aucun journal d'audit récent
              </p>
            ) : (
              settings.securityLogs.slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getLogLevelColor(log.status || 'info')}>
                      {(log.status || 'INFO').toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.table_name && `Table: ${log.table_name} • `}
                        {log.ip_address && `IP: ${log.ip_address} • `}
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  {log.error_message && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;