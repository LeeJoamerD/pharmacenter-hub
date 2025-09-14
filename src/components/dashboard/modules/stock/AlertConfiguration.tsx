import React, { useState } from 'react';
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
  Edit
} from 'lucide-react';
import { useAlertConfiguration } from '@/hooks/useAlertConfiguration';
import { useAlertRules } from '@/hooks/useAlertRules';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useGlobalAlertSettings } from '@/hooks/useGlobalAlertSettings';
import AlertRuleDialog from './AlertRuleDialog';

const AlertConfiguration = () => {
  const [activeTab, setActiveTab] = useState('regles');
  const [editingRule, setEditingRule] = useState<any>(null);
  
  // Real data hooks
  const { rules, loading: rulesLoading, createRule, updateRule, deleteRule, toggleRule, isUpdating: rulesUpdating } = useAlertRules();
  const { settings: notificationSettings, loading: notificationLoading, saveSettings: saveNotificationSettings, isUpdating: notificationUpdating, testEmailConnection, testSMSConnection, testWhatsAppConnection } = useNotificationSettings();
  const { settings: globalAlertSettings, loading: globalLoading, saveSettings: saveGlobalSettings2, testConfiguration, isUpdating: globalUpdating } = useGlobalAlertSettings();
  
  // Legacy hook (to be phased out)
  const { alertRules, globalSettings, isLoading, actions } = useAlertConfiguration();

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

  const handleSaveGlobalSettings = async () => {
    if (globalAlertSettings) {
      await saveGlobalSettings2(globalAlertSettings);
    }
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
                            {rule.notification_channels.includes('email') && <Mail className="h-3 w-3 text-blue-500" />}
                            {rule.notification_channels.includes('sms') && <MessageSquare className="h-3 w-3 text-green-500" />}
                            {rule.notification_channels.includes('dashboard') && <Bell className="h-3 w-3 text-orange-500" />}
                            {rule.notification_channels.includes('whatsapp') && <MessageSquare className="h-3 w-3 text-green-600" />}
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
                            >
                              <AlertRuleDialog 
                                rule={rule}
                                onSave={async (ruleData) => {
                                  await updateRule(rule.id, ruleData);
                                }}
                                isUpdating={rulesUpdating}
                              />
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
                    checked={notificationSettings?.email_enabled || false}
                    onCheckedChange={async (checked) => {
                      await saveNotificationSettings({ email_enabled: checked });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="email-server">Serveur SMTP</Label>
                  <Input
                    id="email-server"
                    value={notificationSettings?.email_smtp_host || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ email_smtp_host: e.target.value });
                    }}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="email-port">Port</Label>
                  <Input 
                    id="email-port" 
                    type="number" 
                    value={notificationSettings?.email_smtp_port || 587}
                    onChange={async (e) => {
                      await saveNotificationSettings({ email_smtp_port: parseInt(e.target.value) });
                    }}
                    placeholder="587" 
                  />
                </div>
                <div>
                  <Label htmlFor="email-user">Utilisateur</Label>
                  <Input 
                    id="email-user" 
                    type="email" 
                    value={notificationSettings?.email_smtp_user || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ email_smtp_user: e.target.value });
                    }}
                    placeholder="alerts@pharmacie.sn" 
                  />
                </div>
                <div>
                  <Label htmlFor="email-password">Mot de passe</Label>
                  <Input 
                    id="email-password" 
                    type="password" 
                    value={notificationSettings?.email_smtp_password || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ email_smtp_password: e.target.value });
                    }}
                    placeholder="••••••••••••" 
                  />
                </div>
                <div>
                  <Label htmlFor="email-template">Modèle d'Email</Label>
                  <Textarea 
                    id="email-template" 
                    value={notificationSettings?.email_template || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ email_template: e.target.value });
                    }}
                    placeholder="Bonjour,\n\nUne alerte a été déclenchée : {alerte}\n\nCordialement,\nSystème de gestion"
                    rows={4}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => testEmailConnection({
                    host: notificationSettings?.email_smtp_host || '',
                    port: notificationSettings?.email_smtp_port || 587,
                    user: notificationSettings?.email_smtp_user || '',
                    password: notificationSettings?.email_smtp_password || '',
                    use_tls: notificationSettings?.email_use_tls || true
                  })}
                  disabled={notificationUpdating}
                >
                  Tester Connexion Email
                </Button>
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
                    checked={notificationSettings?.sms_enabled || false}
                    onCheckedChange={async (checked) => {
                      await saveNotificationSettings({ sms_enabled: checked });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="sms-provider">Fournisseur SMS</Label>
                  <Select 
                    value={notificationSettings?.sms_provider || ''} 
                    onValueChange={async (value) => {
                      await saveNotificationSettings({ sms_provider: value });
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
                    value={notificationSettings?.sms_api_key || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ sms_api_key: e.target.value });
                    }}
                    placeholder="••••••••••••" 
                  />
                </div>
                <div>
                  <Label htmlFor="sms-api-url">URL API</Label>
                  <Input 
                    id="sms-api-url" 
                    value={notificationSettings?.sms_api_url || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ sms_api_url: e.target.value });
                    }}
                    placeholder="https://api.sms-provider.com/send" 
                  />
                </div>
                <div>
                  <Label htmlFor="sms-sender">Expéditeur</Label>
                  <Input 
                    id="sms-sender" 
                    value={notificationSettings?.sms_sender_name || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ sms_sender_name: e.target.value });
                    }}
                    placeholder="PHARMACIE" 
                    maxLength={11} 
                  />
                </div>
                <div>
                  <Label htmlFor="sms-template">Modèle de SMS</Label>
                  <Textarea 
                    id="sms-template" 
                    value={notificationSettings?.sms_template || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ sms_template: e.target.value });
                    }}
                    placeholder="ALERTE STOCK: {produit} - {message}"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 160 caractères
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => testSMSConnection({
                    provider: notificationSettings?.sms_provider || '',
                    api_key: notificationSettings?.sms_api_key || '',
                    sender_name: notificationSettings?.sms_sender_name || ''
                  })}
                  disabled={notificationUpdating}
                >
                  Tester Connexion SMS
                </Button>
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
                    checked={notificationSettings?.whatsapp_enabled || false}
                    onCheckedChange={async (checked) => {
                      await saveNotificationSettings({ whatsapp_enabled: checked });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-business-id">Business Account ID</Label>
                  <Input
                    id="whatsapp-business-id"
                    value={notificationSettings?.whatsapp_business_account_id || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ whatsapp_business_account_id: e.target.value });
                    }}
                    placeholder="123456789012345"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-access-token">Access Token</Label>
                  <Input
                    id="whatsapp-access-token"
                    type="password"
                    value={notificationSettings?.whatsapp_access_token || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ whatsapp_access_token: e.target.value });
                    }}
                    placeholder="••••••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-phone-id">Phone Number ID</Label>
                  <Input
                    id="whatsapp-phone-id"
                    value={notificationSettings?.whatsapp_phone_number_id || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ whatsapp_phone_number_id: e.target.value });
                    }}
                    placeholder="123456789012345"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-webhook-token">Webhook Verify Token</Label>
                  <Input
                    id="whatsapp-webhook-token"
                    value={notificationSettings?.whatsapp_webhook_verify_token || ''}
                    onChange={async (e) => {
                      await saveNotificationSettings({ whatsapp_webhook_verify_token: e.target.value });
                    }}
                    placeholder="mon-token-secret"
                  />
                </div>
                <div>
                  <Label>Templates WhatsApp Approuvés</Label>
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      {Array.isArray(notificationSettings?.whatsapp_templates) ? notificationSettings.whatsapp_templates.length : 0} template(s) configuré(s)
                    </p>
                    <Button variant="outline" size="sm">
                      Gérer les Templates
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="whatsapp-test-number">Numéro de test</Label>
                  <Input
                    id="whatsapp-test-number"
                    placeholder="+221771234567"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => testWhatsAppConnection({
                    business_account_id: notificationSettings?.whatsapp_business_account_id || '',
                    access_token: notificationSettings?.whatsapp_access_token || '',
                    phone_number_id: notificationSettings?.whatsapp_phone_number_id || ''
                  })}
                  disabled={notificationUpdating}
                >
                  Tester Connexion WhatsApp
                </Button>
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
                  checked={globalAlertSettings?.system_enabled || false}
                  onCheckedChange={async (checked) => {
                    await saveGlobalSettings2({ system_enabled: checked });
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
                      value={globalAlertSettings?.check_frequency_minutes || 60}
                      onChange={async (e) => {
                        await saveGlobalSettings2({ check_frequency_minutes: parseInt(e.target.value) || 60 });
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
                      value={globalAlertSettings?.alert_retention_days || 90}
                      onChange={async (e) => {
                        await saveGlobalSettings2({ alert_retention_days: parseInt(e.target.value) || 90 });
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
                    checked={globalAlertSettings?.business_hours_only || false}
                    onCheckedChange={async (checked) => {
                      await saveGlobalSettings2({ business_hours_only: checked });
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
                    checked={globalAlertSettings?.escalation_enabled || false}
                    onCheckedChange={async (checked) => {
                      await saveGlobalSettings2({ escalation_enabled: checked });
                    }}
                  />
                </div>
              </div>

              {globalAlertSettings?.business_hours_only && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business-start">Heure d'ouverture</Label>
                    <Input
                      id="business-start"
                      type="time"
                      value={globalAlertSettings?.business_start_time || '08:00'}
                      onChange={async (e) => {
                        await saveGlobalSettings2({ business_start_time: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-end">Heure de fermeture</Label>
                    <Input
                      id="business-end"
                      type="time"
                      value={globalAlertSettings?.business_end_time || '18:00'}
                      onChange={async (e) => {
                        await saveGlobalSettings2({ business_end_time: e.target.value });
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveGlobalSettings} disabled={globalUpdating}>
                  <Save className="h-4 w-4 mr-2" />
                  {globalUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                <Button variant="outline" onClick={testConfiguration} disabled={globalUpdating}>
                  Tester Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertConfiguration;