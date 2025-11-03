import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Settings, 
  Bell, 
  AlertTriangle, 
  Clock, 
  Package, 
  Mail, 
  MessageSquare, 
  Save,
  Plus,
  Trash2,
  Edit,
  Loader2
} from 'lucide-react';
import { useAlertConfiguration } from '@/hooks/useAlertConfiguration';
import { useAlertRules } from '@/hooks/useAlertRules';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useGlobalAlertSettings } from '@/hooks/useGlobalAlertSettings';
import AlertRuleDialog from './AlertRuleDialog';
import WhatsAppTemplateDialog from './WhatsAppTemplateDialog';

const AlertConfiguration = () => {
  const [activeTab, setActiveTab] = useState('regles');
  const [editingRule, setEditingRule] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Local state for forms
  const [localEmailSettings, setLocalEmailSettings] = useState<any>({});
  const [localSmsSettings, setLocalSmsSettings] = useState<any>({});
  const [localWhatsappSettings, setLocalWhatsappSettings] = useState<any>({});
  const [localGlobalSettings, setLocalGlobalSettings] = useState<any>({});
  
  // State for unsaved changes indicators
  const [hasEmailChanges, setHasEmailChanges] = useState(false);
  const [hasSmsChanges, setHasSmsChanges] = useState(false);
  const [hasWhatsappChanges, setHasWhatsappChanges] = useState(false);
  const [hasGlobalChanges, setHasGlobalChanges] = useState(false);
  
  // Real data hooks
  const { rules, loading: rulesLoading, createRule, updateRule, deleteRule, toggleRule, isUpdating: rulesUpdating } = useAlertRules();
  const { settings: notificationSettings, loading: notificationLoading, saveSettings: saveNotificationSettings, isUpdating: notificationUpdating, testEmailConnection, testSMSConnection, testWhatsAppConnection } = useNotificationSettings();
  const { settings: globalAlertSettings, loading: globalLoading, saveSettings: saveGlobalSettings2, testConfiguration, isUpdating: globalUpdating } = useGlobalAlertSettings();
  
  // Legacy hook (to be phased out)
  const { alertRules, globalSettings, isLoading, actions } = useAlertConfiguration();

  // Initialize local settings when data loads
  useEffect(() => {
    if (notificationSettings) {
      setLocalEmailSettings({
        email_enabled: notificationSettings.email_enabled || false,
        email_smtp_host: notificationSettings.email_smtp_host || '',
        email_smtp_port: notificationSettings.email_smtp_port || 587,
        email_smtp_user: notificationSettings.email_smtp_user || '',
        email_smtp_password: notificationSettings.email_smtp_password || '',
        email_from_name: notificationSettings.email_from_name || '',
        email_from_address: notificationSettings.email_from_address || '',
      });
      setLocalSmsSettings({
        sms_enabled: notificationSettings.sms_enabled || false,
        sms_provider: notificationSettings.sms_provider || '',
        sms_api_key: notificationSettings.sms_api_key || '',
        sms_sender_id: notificationSettings.sms_sender_id || '',
      });
      setLocalWhatsappSettings({
        whatsapp_enabled: notificationSettings.whatsapp_enabled || false,
        whatsapp_business_id: notificationSettings.whatsapp_business_id || '',
        whatsapp_api_key: notificationSettings.whatsapp_api_key || '',
        whatsapp_phone_number: notificationSettings.whatsapp_phone_number || '',
      });
    }
  }, [notificationSettings]);

  useEffect(() => {
    if (globalAlertSettings) {
      setLocalGlobalSettings({
        system_enabled: globalAlertSettings.system_enabled ?? true,
        check_frequency_minutes: globalAlertSettings.check_frequency_minutes ?? 60,
        business_hours_only: globalAlertSettings.business_hours_only ?? true,
        business_start_time: globalAlertSettings.business_start_time ?? '08:00',
        business_end_time: globalAlertSettings.business_end_time ?? '18:00',
        business_days: globalAlertSettings.business_days ?? [1, 2, 3, 4, 5],
        alert_retention_days: globalAlertSettings.alert_retention_days ?? 90,
        auto_cleanup_enabled: globalAlertSettings.auto_cleanup_enabled ?? true,
        escalation_enabled: globalAlertSettings.escalation_enabled ?? false,
        escalation_delay_minutes: globalAlertSettings.escalation_delay_minutes ?? 60,
        max_escalation_level: globalAlertSettings.max_escalation_level ?? 3,
        max_alerts_per_hour: globalAlertSettings.max_alerts_per_hour ?? 100,
        duplicate_alert_cooldown_minutes: globalAlertSettings.duplicate_alert_cooldown_minutes ?? 30,
      });
    }
  }, [globalAlertSettings]);

  // Configuration avec les hooks
  if (isLoading || rulesLoading || notificationLoading || globalLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock_faible':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'peremption':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'rupture':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'surstockage':
        return <Package className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      stock_faible: 'Stock Faible',
      peremption: 'Péremption',
      rupture: 'Rupture',
      surstockage: 'Surstockage'
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Save handlers
  const handleSaveEmailSettings = async () => {
    await saveNotificationSettings(localEmailSettings);
    setHasEmailChanges(false);
  };

  const handleSaveSmsSettings = async () => {
    await saveNotificationSettings(localSmsSettings);
    setHasSmsChanges(false);
  };

  const handleSaveWhatsappSettings = async () => {
    await saveNotificationSettings(localWhatsappSettings);
    setHasWhatsappChanges(false);
  };

  const handleSaveGlobalSettings = async () => {
    await saveGlobalSettings2(localGlobalSettings);
    setHasGlobalChanges(false);
  };

  // Test handlers with validation
  const handleTestEmail = () => {
    const { email_smtp_host, email_smtp_port, email_smtp_user, email_smtp_password } = localEmailSettings;
    if (!email_smtp_host || !email_smtp_user || !email_smtp_password) {
      return testEmailConnection({ 
        host: '', 
        port: 0, 
        user: '', 
        password: '', 
        use_tls: false 
      });
    }
    testEmailConnection({
      host: email_smtp_host,
      port: email_smtp_port,
      user: email_smtp_user,
      password: email_smtp_password,
      use_tls: true
    });
  };

  const handleTestSms = () => {
    const { sms_provider, sms_api_key, sms_sender_id } = localSmsSettings;
    if (!sms_provider || !sms_api_key) {
      return testSMSConnection({ provider: '', api_key: '', sender_name: '' });
    }
    testSMSConnection({
      provider: sms_provider,
      api_key: sms_api_key,
      sender_name: sms_sender_id || ''
    });
  };

  const handleTestWhatsapp = () => {
    const { whatsapp_business_id, whatsapp_api_key, whatsapp_phone_number } = localWhatsappSettings;
    if (!whatsapp_business_id || !whatsapp_api_key || !whatsapp_phone_number) {
      return testWhatsAppConnection({ business_account_id: '', access_token: '', phone_number_id: '' });
    }
    testWhatsAppConnection({
      business_account_id: whatsapp_business_id,
      access_token: whatsapp_api_key,
      phone_number_id: whatsapp_phone_number
    });
  };

  const handleToggleRule = async (ruleId: string) => {
    await toggleRule(ruleId);
  };

  const handleDeleteRule = async (ruleId: string) => {
    await deleteRule(ruleId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Configuration des Alertes</h3>
        <p className="text-muted-foreground">
          Paramétrage des seuils et notifications pour la surveillance automatique du stock
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="regles">
            <Bell className="h-4 w-4 mr-2" />
            Règles d'Alerte
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Mail className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres Généraux
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Règles d'Alerte Actives</CardTitle>
                  <CardDescription>
                    Configuration des conditions qui déclenchent les alertes automatiques
                  </CardDescription>
                </div>
                <AlertRuleDialog 
                  onSave={async (ruleData) => {
                    await createRule(ruleData as any);
                    setDialogOpen(false);
                  }}
                  isUpdating={rulesUpdating}
                />
                <AlertRuleDialog 
                  rule={editingRule}
                  isOpen={dialogOpen}
                  onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingRule(null);
                  }}
                  onSave={async (ruleData) => {
                    if (editingRule) {
                      await updateRule(editingRule.id, ruleData);
                    }
                    setDialogOpen(false);
                    setEditingRule(null);
                  }}
                  isUpdating={rulesUpdating}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Nom de la Règle</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Seuil</TableHead>
                      <TableHead>Notifications</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(rules || []).map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(rule.rule_type)}
                            <Badge variant="outline">
                              {getTypeLabel(rule.rule_type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell className="text-sm font-mono">{rule.threshold_operator} {rule.threshold_value}</TableCell>
                        <TableCell>
                          <div className="text-center">
                            <span className="font-medium">{rule.threshold_value}</span>
                            <div className="text-xs text-muted-foreground">unités</div>
                          </div>
                        </TableCell>
                         <TableCell>
                          <div className="flex gap-1">
                            {Array.isArray(rule.notification_channels) && rule.notification_channels.includes('email') && <Mail className="h-3 w-3 text-blue-500" />}
                            {Array.isArray(rule.notification_channels) && rule.notification_channels.includes('sms') && <MessageSquare className="h-3 w-3 text-green-500" />}
                            {Array.isArray(rule.notification_channels) && rule.notification_channels.includes('dashboard') && <Bell className="h-3 w-3 text-orange-500" />}
                            {Array.isArray(rule.notification_channels) && rule.notification_channels.includes('whatsapp') && <MessageSquare className="h-3 w-3 text-green-600" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => handleToggleRule(rule.id)}
                            disabled={rulesUpdating}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingRule(rule);
                                setDialogOpen(true);
                              }}
                              disabled={rulesUpdating}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                              disabled={rulesUpdating}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Email</CardTitle>
                <CardDescription>Paramètres du serveur de messagerie</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-enabled">Email activé</Label>
                  <Switch
                    id="email-enabled"
                    checked={localEmailSettings.email_enabled || false}
                    onCheckedChange={(checked) => {
                      setLocalEmailSettings(prev => ({ ...prev, email_enabled: checked }));
                      setHasEmailChanges(true);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="email-server">Serveur SMTP</Label>
                  <Input
                    id="email-server"
                    value={localEmailSettings.email_smtp_host || ''}
                    onChange={(e) => {
                      setLocalEmailSettings(prev => ({ ...prev, email_smtp_host: e.target.value }));
                      setHasEmailChanges(true);
                    }}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="email-port">Port</Label>
                  <Input 
                    id="email-port" 
                    type="number" 
                    value={localEmailSettings.email_smtp_port || 587}
                    onChange={(e) => {
                      setLocalEmailSettings(prev => ({ ...prev, email_smtp_port: parseInt(e.target.value) || 587 }));
                      setHasEmailChanges(true);
                    }}
                    placeholder="587" 
                  />
                </div>
                <div>
                  <Label htmlFor="email-user">Utilisateur</Label>
                  <Input 
                    id="email-user" 
                    type="email" 
                    value={localEmailSettings.email_smtp_user || ''}
                    onChange={(e) => {
                      setLocalEmailSettings(prev => ({ ...prev, email_smtp_user: e.target.value }));
                      setHasEmailChanges(true);
                    }}
                    placeholder="alerts@pharmacie.sn" 
                  />
                </div>
                <div>
                  <Label htmlFor="email-password">Mot de passe</Label>
                  <Input 
                    id="email-password" 
                    type="password" 
                    value={localEmailSettings.email_smtp_password || ''}
                    onChange={(e) => {
                      setLocalEmailSettings(prev => ({ ...prev, email_smtp_password: e.target.value }));
                      setHasEmailChanges(true);
                    }}
                    placeholder="••••••••••••" 
                  />
                </div>
                <div>
                  <Label htmlFor="email-template">Modèle d'Email</Label>
                  <Textarea 
                    id="email-template" 
                    value={localEmailSettings.email_template || ''}
                    onChange={(e) => {
                      setLocalEmailSettings(prev => ({ ...prev, email_template: e.target.value }));
                      setHasEmailChanges(true);
                    }}
                    placeholder="Bonjour,\n\nUne alerte a été déclenchée : {alerte}\n\nCordialement,\nSystème de gestion"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleTestEmail}
                    disabled={notificationUpdating}
                  >
                    Tester Connexion Email
                  </Button>
                  <Button 
                    onClick={handleSaveEmailSettings}
                    disabled={!hasEmailChanges || notificationUpdating}
                    variant={hasEmailChanges ? "default" : "secondary"}
                  >
                    {notificationUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {hasEmailChanges ? 'Sauvegarder' : 'Sauvegardé'}
                  </Button>
                </div>
                {hasEmailChanges && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    Modifications non sauvegardées
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration SMS</CardTitle>
                <CardDescription>Paramètres du service SMS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-enabled">SMS activé</Label>
                  <Switch
                    id="sms-enabled"
                    checked={localSmsSettings.sms_enabled || false}
                    onCheckedChange={(checked) => {
                      setLocalSmsSettings(prev => ({ ...prev, sms_enabled: checked }));
                      setHasSmsChanges(true);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="sms-provider">Fournisseur SMS</Label>
                  <Select 
                    value={localSmsSettings.sms_provider || ''} 
                    onValueChange={(value) => {
                      setLocalSmsSettings(prev => ({ ...prev, sms_provider: value }));
                      setHasSmsChanges(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orange">Orange SMS</SelectItem>
                      <SelectItem value="tigo">Tigo SMS</SelectItem>
                      <SelectItem value="expresso">Expresso SMS</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sms-api-key">Clé API</Label>
                  <Input 
                    id="sms-api-key" 
                    type="password" 
                    value={localSmsSettings.sms_api_key || ''}
                    onChange={(e) => {
                      setLocalSmsSettings(prev => ({ ...prev, sms_api_key: e.target.value }));
                      setHasSmsChanges(true);
                    }}
                    placeholder="••••••••••••" 
                  />
                </div>
                <div>
                  <Label htmlFor="sms-api-url">URL API</Label>
                  <Input 
                    id="sms-api-url" 
                    value={localSmsSettings.sms_api_url || ''}
                    onChange={(e) => {
                      setLocalSmsSettings(prev => ({ ...prev, sms_api_url: e.target.value }));
                      setHasSmsChanges(true);
                    }}
                    placeholder="https://api.sms-provider.com/send" 
                  />
                </div>
                <div>
                  <Label htmlFor="sms-sender">Expéditeur</Label>
                  <Input 
                    id="sms-sender" 
                    value={localSmsSettings.sms_sender_name || ''}
                    onChange={(e) => {
                      setLocalSmsSettings(prev => ({ ...prev, sms_sender_name: e.target.value }));
                      setHasSmsChanges(true);
                    }}
                    placeholder="PHARMACIE" 
                    maxLength={11} 
                  />
                </div>
                <div>
                  <Label htmlFor="sms-template">Modèle de SMS</Label>
                  <Textarea 
                    id="sms-template" 
                    value={localSmsSettings.sms_template || ''}
                    onChange={(e) => {
                      setLocalSmsSettings(prev => ({ ...prev, sms_template: e.target.value }));
                      setHasSmsChanges(true);
                    }}
                    placeholder="ALERTE STOCK: {produit} - {message}"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 160 caractères
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleTestSms}
                    disabled={notificationUpdating}
                  >
                    Tester Connexion SMS
                  </Button>
                  <Button 
                    onClick={handleSaveSmsSettings}
                    disabled={!hasSmsChanges || notificationUpdating}
                    variant={hasSmsChanges ? "default" : "secondary"}
                  >
                    {notificationUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {hasSmsChanges ? 'Sauvegarder' : 'Sauvegardé'}
                  </Button>
                </div>
                {hasSmsChanges && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    Modifications non sauvegardées
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration WhatsApp</CardTitle>
                <CardDescription>Paramètres WhatsApp Business API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="whatsapp-enabled">WhatsApp activé</Label>
                  <Switch
                    id="whatsapp-enabled"
                    checked={localWhatsappSettings.whatsapp_enabled || false}
                    onCheckedChange={(checked) => {
                      setLocalWhatsappSettings(prev => ({ ...prev, whatsapp_enabled: checked }));
                      setHasWhatsappChanges(true);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-business-id">Business Account ID</Label>
                  <Input 
                    id="whatsapp-business-id" 
                    value={localWhatsappSettings.whatsapp_business_account_id || ''}
                    onChange={(e) => {
                      setLocalWhatsappSettings(prev => ({ ...prev, whatsapp_business_account_id: e.target.value }));
                      setHasWhatsappChanges(true);
                    }}
                    placeholder="123456789012345" 
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-token">Access Token</Label>
                  <Input 
                    id="whatsapp-token" 
                    type="password" 
                    value={localWhatsappSettings.whatsapp_access_token || ''}
                    onChange={(e) => {
                      setLocalWhatsappSettings(prev => ({ ...prev, whatsapp_access_token: e.target.value }));
                      setHasWhatsappChanges(true);
                    }}
                    placeholder="••••••••••••" 
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-phone-id">Phone Number ID</Label>
                  <Input 
                    id="whatsapp-phone-id" 
                    value={localWhatsappSettings.whatsapp_phone_number_id || ''}
                    onChange={(e) => {
                      setLocalWhatsappSettings(prev => ({ ...prev, whatsapp_phone_number_id: e.target.value }));
                      setHasWhatsappChanges(true);
                    }}
                    placeholder="12345678901234567890" 
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleTestWhatsapp}
                    disabled={notificationUpdating}
                  >
                    Tester Connexion WhatsApp
                  </Button>
                  <WhatsAppTemplateDialog
                    templates={localWhatsappSettings.whatsapp_templates || []}
                    onTemplatesChange={(templates) => {
                      setLocalWhatsappSettings(prev => ({ ...prev, whatsapp_templates: templates }));
                      setHasWhatsappChanges(true);
                    }}
                  />
                </div>
                <Button 
                  onClick={handleSaveWhatsappSettings}
                  disabled={!hasWhatsappChanges || notificationUpdating}
                  variant={hasWhatsappChanges ? "default" : "secondary"}
                  className="w-full"
                >
                  {notificationUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {hasWhatsappChanges ? 'Sauvegarder' : 'Sauvegardé'}
                </Button>
                {hasWhatsappChanges && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    Modifications non sauvegardées
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>Configuration globale du système d'alertes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="alerts-enabled" className="text-base font-medium">
                    Système d'Alertes Activé
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Active ou désactive toutes les alertes automatiques
                  </p>
                </div>
                <Switch
                  id="alerts-enabled"
                  checked={localGlobalSettings.system_enabled ?? true}
                  onCheckedChange={(checked) => {
                    setLocalGlobalSettings(prev => ({ ...prev, system_enabled: checked }));
                    setHasGlobalChanges(true);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check-frequency">Fréquence de Vérification</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="check-frequency"
                      type="number"
                      value={localGlobalSettings.check_frequency_minutes ?? 60}
                      onChange={(e) => {
                        setLocalGlobalSettings(prev => ({ ...prev, check_frequency_minutes: parseInt(e.target.value) || 60 }));
                        setHasGlobalChanges(true);
                      }}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Intervalle entre les vérifications automatiques
                  </p>
                </div>

                <div>
                  <Label htmlFor="retention-period">Rétention Historique</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="retention-period"
                      type="number"
                      value={localGlobalSettings.alert_retention_days ?? 90}
                      onChange={(e) => {
                        setLocalGlobalSettings(prev => ({ ...prev, alert_retention_days: parseInt(e.target.value) || 90 }));
                        setHasGlobalChanges(true);
                      }}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">jours</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Durée de conservation de l'historique des alertes
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Horaires d'activité uniquement</Label>
                    <p className="text-sm text-muted-foreground">
                      Envoyer les alertes seulement pendant les heures d'ouverture
                    </p>
                  </div>
                  <Switch
                    checked={localGlobalSettings.business_hours_only ?? true}
                    onCheckedChange={(checked) => {
                      setLocalGlobalSettings(prev => ({ ...prev, business_hours_only: checked }));
                      setHasGlobalChanges(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Escalade des alertes</Label>
                    <p className="text-sm text-muted-foreground">
                      Escalader les alertes non traitées après un délai
                    </p>
                  </div>
                  <Switch
                    checked={localGlobalSettings.escalation_enabled ?? false}
                    onCheckedChange={(checked) => {
                      setLocalGlobalSettings(prev => ({ ...prev, escalation_enabled: checked }));
                      setHasGlobalChanges(true);
                    }}
                  />
                </div>
              </div>

              {localGlobalSettings.business_hours_only && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business-start">Heure d'ouverture</Label>
                    <Input
                      id="business-start"
                      type="time"
                      value={localGlobalSettings.business_start_time ?? '08:00'}
                      onChange={(e) => {
                        setLocalGlobalSettings(prev => ({ ...prev, business_start_time: e.target.value }));
                        setHasGlobalChanges(true);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-end">Heure de fermeture</Label>
                    <Input
                      id="business-end"
                      type="time"
                      value={localGlobalSettings.business_end_time ?? '18:00'}
                      onChange={(e) => {
                        setLocalGlobalSettings(prev => ({ ...prev, business_end_time: e.target.value }));
                        setHasGlobalChanges(true);
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => testConfiguration()}
                  disabled={globalUpdating}
                >
                  Tester Configuration
                </Button>
                <Button 
                  onClick={handleSaveGlobalSettings}
                  disabled={!hasGlobalChanges || globalUpdating}
                  variant={hasGlobalChanges ? "default" : "secondary"}
                >
                  {globalUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {hasGlobalChanges ? 'Sauvegarder' : 'Sauvegardé'}
                </Button>
              </div>
              
              {hasGlobalChanges && (
                <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  Modifications non sauvegardées
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertConfiguration;