import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Settings, 
  Search, 
  Filter,
  Eye,
  EyeOff,
  Archive,
  Trash2,
  Plus,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  channels: string[];
  roles: string[];
  isActive: boolean;
}

interface SecurityNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  channels: string[];
  createdAt: string;
  recipients: string[];
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  alertTypes: {
    loginFailures: boolean;
    crossTenantAttempts: boolean;
    passwordChanges: boolean;
    roleChanges: boolean;
    dataExport: boolean;
    systemErrors: boolean;
  };
  channels: {
    email: {
      enabled: boolean;
      recipients: string[];
      template: string;
    };
    sms: {
      enabled: boolean;
      recipients: string[];
      template: string;
    };
    inApp: {
      enabled: boolean;
      roles: string[];
    };
  };
}

const SecurityNotifications = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [notifications, setNotifications] = useState<SecurityNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    alertTypes: {
      loginFailures: true,
      crossTenantAttempts: true,
      passwordChanges: true,
      roleChanges: true,
      dataExport: false,
      systemErrors: true,
    },
    channels: {
      email: {
        enabled: true,
        recipients: [],
        template: 'default'
      },
      sms: {
        enabled: false,
        recipients: [],
        template: 'simple'
      },
      inApp: {
        enabled: true,
        roles: ['Admin', 'Pharmacien']
      }
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadNotificationSettings();
    loadNotifications();
    loadTemplates();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('parametres_systeme')
        .select('*')
        .eq('categorie', 'notifications_security');
      
      if (error) throw error;
      
      // Charger les paramètres depuis la base
      if (data && data.length > 0) {
        const savedSettings = data.reduce((acc, param) => {
          acc[param.cle_parametre] = JSON.parse(param.valeur_parametre || '{}');
          return acc;
        }, {});
        
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      const formattedNotifications: SecurityNotification[] = data?.map(alert => ({
        id: alert.id,
        type: alert.alert_type,
        title: alert.alert_type.replace(/_/g, ' ').toUpperCase(),
        message: alert.description,
        severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
        isRead: (typeof alert.metadata === 'object' && alert.metadata !== null && 'isRead' in alert.metadata) ? Boolean(alert.metadata.isRead) : false,
        channels: ['in-app'],
        createdAt: alert.created_at,
        recipients: []
      })) || [];
      
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const loadTemplates = () => {
    // Templates par défaut pour les notifications de sécurité
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: '1',
        name: 'Tentative de connexion échouée',
        type: 'login_failure',
        subject: 'Alerte Sécurité: Tentative de connexion échouée',
        content: 'Une tentative de connexion échouée a été détectée sur votre compte à {{timestamp}}. IP: {{ip_address}}',
        channels: ['email', 'in-app'],
        roles: ['Admin', 'Pharmacien'],
        isActive: true
      },
      {
        id: '2',
        name: 'Accès cross-tenant bloqué',
        type: 'cross_tenant_attempt',
        subject: 'SÉCURITÉ CRITIQUE: Tentative d\'accès non autorisé',
        content: 'Une tentative d\'accès cross-tenant a été bloquée. Utilisateur: {{user_email}}, Tenant cible: {{target_tenant}}',
        channels: ['email', 'sms', 'in-app'],
        roles: ['Admin'],
        isActive: true
      },
      {
        id: '3',
        name: 'Modification de mot de passe',
        type: 'password_change',
        subject: 'Modification de mot de passe effectuée',
        content: 'Votre mot de passe a été modifié le {{timestamp}}. Si ce n\'était pas vous, contactez l\'administrateur.',
        channels: ['email'],
        roles: ['Admin', 'Pharmacien', 'Vendeur'],
        isActive: true
      }
    ];
    
    setTemplates(defaultTemplates);
  };

  const saveSettings = async () => {
    try {
      // Sauvegarder les paramètres dans la base
      await supabase
        .from('parametres_systeme')
        .upsert({
          tenant_id: (await supabase.auth.getUser()).data.user?.user_metadata?.tenant_id,
          cle_parametre: 'notification_settings',
          valeur_parametre: JSON.stringify(settings),
          categorie: 'notifications_security',
          type_parametre: 'json',
          description: 'Configuration des notifications de sécurité'
        });

      toast({
        title: "Paramètres sauvegardés",
        description: "La configuration des notifications a été mise à jour.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('security_alerts')
        .update({ 
          metadata: { isRead: true }
        })
        .eq('id', notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || notif.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Gestion des Notifications de Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="settings">Configuration</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="notifications">Centre de Notifications</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuration des Alertes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Canaux de Notification</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <Label>Email</Label>
                          </div>
                          <Switch 
                            checked={settings.emailEnabled}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, emailEnabled: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            <Label>SMS</Label>
                          </div>
                          <Switch 
                            checked={settings.smsEnabled}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, smsEnabled: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <Label>In-App</Label>
                          </div>
                          <Switch 
                            checked={settings.inAppEnabled}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, inAppEnabled: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Types d'Alertes</h4>
                      <div className="space-y-3">
                        {Object.entries(settings.alertTypes).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <Label className="text-sm">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Label>
                            <Switch 
                              checked={value}
                              onCheckedChange={(checked) => 
                                setSettings(prev => ({ 
                                  ...prev, 
                                  alertTypes: { ...prev.alertTypes, [key]: checked }
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Configuration Email</h4>
                      <div className="space-y-3">
                        <div>
                          <Label>Destinataires (séparés par ,)</Label>
                          <Textarea 
                            placeholder="admin@pharmacy.com, security@pharmacy.com"
                            value={settings.channels.email.recipients.join(', ')}
                            onChange={(e) => 
                              setSettings(prev => ({
                                ...prev,
                                channels: {
                                  ...prev.channels,
                                  email: {
                                    ...prev.channels.email,
                                    recipients: e.target.value.split(', ').filter(email => email.trim())
                                  }
                                }
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-end">
                    <Button onClick={saveSettings}>
                      Sauvegarder la Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Templates de Notification</h3>
                <Button onClick={() => setShowTemplateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Template
                </Button>
              </div>
              
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant={template.isActive ? "default" : "secondary"}>
                              {template.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{template.subject}</p>
                          <p className="text-sm">{template.content}</p>
                          <div className="flex gap-2">
                            {template.channels.map(channel => (
                              <Badge key={channel} variant="outline">{channel}</Badge>
                            ))}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher dans les notifications..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card key={notification.id} className={!notification.isRead ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge className={getSeverityColor(notification.severity)}>
                              {notification.severity}
                            </Badge>
                            {!notification.isRead && (
                              <Badge variant="secondary">Non lu</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historique des Notifications Envoyées</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Destinataire</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Aucun historique disponible
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityNotifications;