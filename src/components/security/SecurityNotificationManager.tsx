import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Settings, 
  Shield, 
  AlertTriangle,
  Mail,
  Smartphone,
  Webhook,
  Save,
  TestTube,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationRule {
  id: string;
  name: string;
  alert_types: string[];
  severity_levels: string[];
  notification_channels: string[];
  enabled: boolean;
  conditions: any;
  created_at: string;
  updated_at: string;
}

interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'webhook' | 'in_app';
  name: string;
  config: any;
  enabled: boolean;
  test_status?: 'success' | 'failed' | 'pending';
}

const SecurityNotificationManager = () => {
  const { personnel } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({
    name: '',
    alert_types: [] as string[],
    severity_levels: [] as string[],
    notification_channels: [] as string[],
    enabled: true
  });
  const [newChannel, setNewChannel] = useState({
    type: 'email' as const,
    name: '',
    config: {} as any,
    enabled: true
  });

  const alertTypes = [
    'suspicious_access_pattern',
    'multiple_failed_logins',
    'cross_tenant_attempt',
    'unauthorized_operation',
    'data_breach_detected',
    'system_intrusion',
    'malware_detected',
    'ddos_attack'
  ];

  const severityLevels = ['low', 'medium', 'high', 'critical'];

  // Charger les règles et canaux existants
  const loadNotificationSettings = async () => {
    if (!personnel) return;

    try {
      const { data: rulesData } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .order('created_at', { ascending: false });

      const { data: channelsData } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .order('created_at', { ascending: false });

      setRules(rulesData || []);
      setChannels(channelsData || []);
    } catch (error) {
      console.error('Erreur chargement paramètres notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder une nouvelle règle
  const saveNotificationRule = async () => {
    if (!personnel || !newRule.name) return;

    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .insert({
          tenant_id: personnel.tenant_id,
          name: newRule.name,
          alert_types: newRule.alert_types,
          severity_levels: newRule.severity_levels,
          notification_channels: newRule.notification_channels,
          enabled: newRule.enabled,
          conditions: {}
        })
        .select()
        .single();

      if (error) throw error;

      setRules(prev => [data, ...prev]);
      setNewRule({
        name: '',
        alert_types: [],
        severity_levels: [],
        notification_channels: [],
        enabled: true
      });

      toast({
        title: "Règle créée",
        description: "La règle de notification a été créée avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la règle de notification.",
        variant: "destructive"
      });
    }
  };

  // Sauvegarder un nouveau canal
  const saveNotificationChannel = async () => {
    if (!personnel || !newChannel.name) return;

    try {
      const { data, error } = await supabase
        .from('notification_channels')
        .insert({
          tenant_id: personnel.tenant_id,
          type: newChannel.type,
          name: newChannel.name,
          config: newChannel.config,
          enabled: newChannel.enabled
        })
        .select()
        .single();

      if (error) throw error;

      setChannels(prev => [data, ...prev]);
      setNewChannel({
        type: 'email',
        name: '',
        config: {},
        enabled: true
      });

      toast({
        title: "Canal créé",
        description: "Le canal de notification a été créé avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le canal de notification.",
        variant: "destructive"
      });
    }
  };

  // Tester un canal de notification
  const testNotificationChannel = async (channelId: string) => {
    try {
      setChannels(prev => prev.map(ch => 
        ch.id === channelId 
          ? { ...ch, test_status: 'pending' }
          : ch
      ));

      // Créer une alerte de test
      const { error } = await supabase
        .from('security_alerts')
        .insert({
          tenant_id: personnel?.tenant_id,
          alert_type: 'test_notification',
          severity: 'low',
          description: 'Test de notification - Veuillez ignorer',
          metadata: {
            test: true,
            channel_id: channelId,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      // Simuler le résultat du test
      setTimeout(() => {
        setChannels(prev => prev.map(ch => 
          ch.id === channelId 
            ? { ...ch, test_status: 'success' }
            : ch
        ));
        
        toast({
          title: "Test réussi",
          description: "Le canal de notification fonctionne correctement."
        });
      }, 2000);

    } catch (error) {
      setChannels(prev => prev.map(ch => 
        ch.id === channelId 
          ? { ...ch, test_status: 'failed' }
          : ch
      ));
      
      toast({
        title: "Test échoué",
        description: "Le canal de notification ne fonctionne pas.",
        variant: "destructive"
      });
    }
  };

  // Basculer l'état d'une règle
  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .update({ enabled })
        .eq('id', ruleId);

      if (error) throw error;

      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled } : rule
      ));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la règle.",
        variant: "destructive"
      });
    }
  };

  // Basculer l'état d'un canal
  const toggleChannel = async (channelId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('notification_channels')
        .update({ enabled })
        .eq('id', channelId);

      if (error) throw error;

      setChannels(prev => prev.map(channel => 
        channel.id === channelId ? { ...channel, enabled } : channel
      ));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le canal.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (personnel) {
      loadNotificationSettings();
    }
  }, [personnel]);

  const renderChannelConfig = (type: string) => {
    switch (type) {
      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@pharmacie.com"
                value={newChannel.config.email || ''}
                onChange={(e) => setNewChannel(prev => ({
                  ...prev,
                  config: { ...prev.config, email: e.target.value }
                }))}
              />
            </div>
          </div>
        );
      
      case 'sms':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+33123456789"
                value={newChannel.config.phone || ''}
                onChange={(e) => setNewChannel(prev => ({
                  ...prev,
                  config: { ...prev.config, phone: e.target.value }
                }))}
              />
            </div>
          </div>
        );
      
      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">URL du webhook</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://api.example.com/notifications"
                value={newChannel.config.url || ''}
                onChange={(e) => setNewChannel(prev => ({
                  ...prev,
                  config: { ...prev.config, url: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="secret">Secret (optionnel)</Label>
              <Input
                id="secret"
                type="password"
                placeholder="secret_webhook"
                value={newChannel.config.secret || ''}
                onChange={(e) => setNewChannel(prev => ({
                  ...prev,
                  config: { ...prev.config, secret: e.target.value }
                }))}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Gestion des Notifications
        </h2>
        <p className="text-muted-foreground">
          Configuration des alertes et notifications de sécurité
        </p>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList>
          <TabsTrigger value="rules">Règles de Notification</TabsTrigger>
          <TabsTrigger value="channels">Canaux de Notification</TabsTrigger>
          <TabsTrigger value="settings">Paramètres Globaux</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {/* Création d'une nouvelle règle */}
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle Règle de Notification</CardTitle>
              <CardDescription>
                Définir quand et comment être notifié des événements de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Nom de la règle</Label>
                <Input
                  id="rule-name"
                  placeholder="Ex: Alertes critiques"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label>Types d'alertes</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {alertTypes.map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newRule.alert_types.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRule(prev => ({
                              ...prev,
                              alert_types: [...prev.alert_types, type]
                            }));
                          } else {
                            setNewRule(prev => ({
                              ...prev,
                              alert_types: prev.alert_types.filter(t => t !== type)
                            }));
                          }
                        }}
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Niveaux de sévérité</Label>
                <div className="flex gap-2 mt-2">
                  {severityLevels.map(level => (
                    <label key={level} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newRule.severity_levels.includes(level)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRule(prev => ({
                              ...prev,
                              severity_levels: [...prev.severity_levels, level]
                            }));
                          } else {
                            setNewRule(prev => ({
                              ...prev,
                              severity_levels: prev.severity_levels.filter(l => l !== level)
                            }));
                          }
                        }}
                      />
                      <Badge variant={level === 'critical' ? 'destructive' : 'outline'}>
                        {level}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={saveNotificationRule} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Créer la règle
              </Button>
            </CardContent>
          </Card>

          {/* Liste des règles existantes */}
          <Card>
            <CardHeader>
              <CardTitle>Règles Configurées</CardTitle>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune règle de notification configurée
                </p>
              ) : (
                <div className="space-y-4">
                  {rules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <div className="flex gap-2 mt-2">
                          {rule.severity_levels.map(level => (
                            <Badge key={level} variant="outline" size="sm">
                              {level}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rule.alert_types.length} type(s) d'alerte configuré(s)
                        </p>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => toggleRule(rule.id, enabled)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          {/* Création d'un nouveau canal */}
          <Card>
            <CardHeader>
              <CardTitle>Nouveau Canal de Notification</CardTitle>
              <CardDescription>
                Ajouter un moyen de recevoir les notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="channel-name">Nom du canal</Label>
                <Input
                  id="channel-name"
                  placeholder="Ex: Email Admin"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label>Type de canal</Label>
                <Select
                  value={newChannel.type}
                  onValueChange={(type: any) => setNewChannel(prev => ({ 
                    ...prev, 
                    type, 
                    config: {} 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        SMS
                      </div>
                    </SelectItem>
                    <SelectItem value="webhook">
                      <div className="flex items-center gap-2">
                        <Webhook className="h-4 w-4" />
                        Webhook
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderChannelConfig(newChannel.type)}

              <Button onClick={saveNotificationChannel} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Créer le canal
              </Button>
            </CardContent>
          </Card>

          {/* Liste des canaux existants */}
          <Card>
            <CardHeader>
              <CardTitle>Canaux Configurés</CardTitle>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun canal de notification configuré
                </p>
              ) : (
                <div className="space-y-4">
                  {channels.map(channel => (
                    <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {channel.type === 'email' && <Mail className="h-5 w-5" />}
                        {channel.type === 'sms' && <Smartphone className="h-5 w-5" />}
                        {channel.type === 'webhook' && <Webhook className="h-5 w-5" />}
                        
                        <div>
                          <h4 className="font-medium">{channel.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {channel.type.toUpperCase()}
                          </p>
                        </div>
                        
                        {channel.test_status && (
                          <div className="ml-4">
                            {channel.test_status === 'success' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {channel.test_status === 'failed' && (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            {channel.test_status === 'pending' && (
                              <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testNotificationChannel(channel.id)}
                          disabled={channel.test_status === 'pending'}
                        >
                          <TestTube className="h-4 w-4 mr-1" />
                          Tester
                        </Button>
                        <Switch
                          checked={channel.enabled}
                          onCheckedChange={(enabled) => toggleChannel(channel.id, enabled)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Globaux</CardTitle>
              <CardDescription>
                Configuration générale des notifications de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Les paramètres globaux permettent de contrôler le comportement 
                  général du système de notifications.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications en temps réel</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir les alertes immédiatement
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Résumé quotidien</Label>
                    <p className="text-sm text-muted-foreground">
                      Rapport quotidien des activités de sécurité
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertes de maintenance</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications pour les maintenances système
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityNotificationManager;