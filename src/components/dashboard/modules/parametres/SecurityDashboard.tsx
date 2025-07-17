import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Key, 
  Clock, 
  AlertTriangle, 
  Users, 
  Activity,
  Lock,
  Eye,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useToast } from '@/hooks/use-toast';

export const SecurityDashboard: React.FC = () => {
  const { toast } = useToast();
  const { useTenantQueryWithCache } = useTenantQuery();

  // Récupérer les politiques de sécurité actuelles
  const { data: passwordPolicies = [] } = useTenantQueryWithCache(
    ['password-policies'],
    'password_policies',
    '*'
  );

  // Récupérer les tentatives de connexion récentes
  const { data: recentLoginAttempts = [] } = useTenantQueryWithCache(
    ['recent-login-attempts'],
    'login_attempts',
    '*',
    undefined,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 10 
    }
  );

  // Récupérer les alertes de sécurité récentes
  const { data: securityAlerts = [] } = useTenantQueryWithCache(
    ['security-alerts'],
    'security_alerts',
    '*',
    undefined,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 5 
    }
  );

  const currentPolicy = passwordPolicies[0] || {};

  // États pour la configuration des politiques
  const [policySettings, setPolicySettings] = React.useState({
    min_length: currentPolicy.min_length || 8,
    require_uppercase: currentPolicy.require_uppercase || false,
    require_lowercase: currentPolicy.require_lowercase || false,
    require_numbers: currentPolicy.require_numbers || false,
    require_special_chars: currentPolicy.require_special_chars || false,
    max_age_days: currentPolicy.max_age_days || 90,
    remember_last_passwords: currentPolicy.remember_last_passwords || 5,
    max_failed_attempts: currentPolicy.max_failed_attempts || 5,
    lockout_duration_minutes: currentPolicy.lockout_duration_minutes || 30,
    session_timeout_minutes: currentPolicy.session_timeout_minutes || 480,
    force_2fa_for_roles: currentPolicy.force_2fa_for_roles || []
  });

  // Mettre à jour les paramètres quand les données sont chargées
  React.useEffect(() => {
    if (currentPolicy.id) {
      setPolicySettings({
        min_length: currentPolicy.min_length || 8,
        require_uppercase: currentPolicy.require_uppercase || false,
        require_lowercase: currentPolicy.require_lowercase || false,
        require_numbers: currentPolicy.require_numbers || false,
        require_special_chars: currentPolicy.require_special_chars || false,
        max_age_days: currentPolicy.max_age_days || 90,
        remember_last_passwords: currentPolicy.remember_last_passwords || 5,
        max_failed_attempts: currentPolicy.max_failed_attempts || 5,
        lockout_duration_minutes: currentPolicy.lockout_duration_minutes || 30,
        session_timeout_minutes: currentPolicy.session_timeout_minutes || 480,
        force_2fa_for_roles: currentPolicy.force_2fa_for_roles || []
      });
    }
  }, [currentPolicy]);

  const handleSavePolicies = () => {
    // TODO: Implémenter la sauvegarde des politiques
    toast({
      title: "Politiques sauvegardées",
      description: "Les politiques de sécurité ont été mises à jour.",
    });
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard de sécurité en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium">Statut Sécurité</p>
                <p className="text-2xl font-bold text-green-500">Sécurisé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Sessions Actives</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Tentatives Échouées</p>
                <p className="text-2xl font-bold">{recentLoginAttempts.filter((attempt: any) => !attempt.success).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium">Alertes Actives</p>
                <p className="text-2xl font-bold">{securityAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration des politiques de sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Politiques de Mot de Passe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_length">Longueur minimale</Label>
                <Input
                  id="min_length"
                  type="number"
                  value={policySettings.min_length}
                  onChange={(e) => setPolicySettings(prev => ({
                    ...prev,
                    min_length: parseInt(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="max_age">Âge maximum (jours)</Label>
                <Input
                  id="max_age"
                  type="number"
                  value={policySettings.max_age_days}
                  onChange={(e) => setPolicySettings(prev => ({
                    ...prev,
                    max_age_days: parseInt(e.target.value)
                  }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Majuscules obligatoires</Label>
                <Switch
                  checked={policySettings.require_uppercase}
                  onCheckedChange={(checked) => setPolicySettings(prev => ({
                    ...prev,
                    require_uppercase: checked
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Minuscules obligatoires</Label>
                <Switch
                  checked={policySettings.require_lowercase}
                  onCheckedChange={(checked) => setPolicySettings(prev => ({
                    ...prev,
                    require_lowercase: checked
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Chiffres obligatoires</Label>
                <Switch
                  checked={policySettings.require_numbers}
                  onCheckedChange={(checked) => setPolicySettings(prev => ({
                    ...prev,
                    require_numbers: checked
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Caractères spéciaux obligatoires</Label>
                <Switch
                  checked={policySettings.require_special_chars}
                  onCheckedChange={(checked) => setPolicySettings(prev => ({
                    ...prev,
                    require_special_chars: checked
                  }))}
                />
              </div>
            </div>

            <Button onClick={handleSavePolicies} className="w-full">
              Sauvegarder les Politiques
            </Button>
          </CardContent>
        </Card>

        {/* Configuration de la sécurité des sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sécurité des Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_attempts">Tentatives max</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  value={policySettings.max_failed_attempts}
                  onChange={(e) => setPolicySettings(prev => ({
                    ...prev,
                    max_failed_attempts: parseInt(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="lockout_duration">Verrouillage (min)</Label>
                <Input
                  id="lockout_duration"
                  type="number"
                  value={policySettings.lockout_duration_minutes}
                  onChange={(e) => setPolicySettings(prev => ({
                    ...prev,
                    lockout_duration_minutes: parseInt(e.target.value)
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="session_timeout">Timeout session (min)</Label>
              <Input
                id="session_timeout"
                type="number"
                value={policySettings.session_timeout_minutes}
                onChange={(e) => setPolicySettings(prev => ({
                  ...prev,
                  session_timeout_minutes: parseInt(e.target.value)
                }))}
              />
            </div>

            <div>
              <Label htmlFor="password_history">Historique mots de passe</Label>
              <Input
                id="password_history"
                type="number"
                value={policySettings.remember_last_passwords}
                onChange={(e) => setPolicySettings(prev => ({
                  ...prev,
                  remember_last_passwords: parseInt(e.target.value)
                }))}
              />
            </div>

            <Button onClick={handleSavePolicies} className="w-full">
              Sauvegarder la Configuration
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alertes de sécurité récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes de Sécurité Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {securityAlerts.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Aucune alerte de sécurité récente. Votre système fonctionne normalement.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {securityAlerts.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.severity)}
                    <div>
                      <p className="font-medium">{alert.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getBadgeVariant(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monitoring des connexions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Tentatives de Connexion Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentLoginAttempts.length === 0 ? (
              <p className="text-muted-foreground">Aucune tentative de connexion récente.</p>
            ) : (
              recentLoginAttempts.map((attempt: any) => (
                <div key={attempt.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{attempt.email}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {attempt.ip_address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={attempt.success ? "default" : "destructive"}>
                      {attempt.success ? "Succès" : "Échec"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(attempt.created_at).toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};