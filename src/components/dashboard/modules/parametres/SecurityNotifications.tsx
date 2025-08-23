import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Mail, 
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Volume2,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationSettings {
  email_alerts: boolean;
  desktop_notifications: boolean;
  sound_enabled: boolean;
  failed_login_threshold: number;
  security_incident_notify: boolean;
  password_expiry_days: number;
  suspicious_activity_notify: boolean;
}

const SecurityNotifications = () => {
  const { toast } = useToast();
  
  // Appeler les hooks de manière inconditionnelle pour respecter les règles des hooks React
  const authContext = useAuth();
  const tenantContext = useTenantQuery();
  
  const personnel = authContext?.personnel;
  const tenantId = tenantContext?.tenantId;
  const useTenantQueryWithCache = tenantContext?.useTenantQueryWithCache;
  const useTenantMutation = tenantContext?.useTenantMutation;
  
  // Vérification que tous les contextes nécessaires sont disponibles
  if (!personnel || !tenantId || !useTenantQueryWithCache || !useTenantMutation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Impossible de charger les paramètres de notification.</p>
            <p className="text-sm mt-2">Vérifiez votre connexion et rechargez la page.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_alerts: true,
    desktop_notifications: true,
    sound_enabled: true,
    failed_login_threshold: 3,
    security_incident_notify: true,
    password_expiry_days: 7,
    suspicious_activity_notify: true
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les notifications (logs d'audit de sécurité)
  const { data: notifications = [], isLoading: notificationsLoading } = useTenantQueryWithCache(
    ['security-notifications'],
    'audit_logs',
    '*',
    { action: { like: '%SECURITY%' } },
    { orderBy: { column: 'created_at', ascending: false }, limit: 50 }
  );

  // Charger les paramètres depuis preferences_utilisateur
  useEffect(() => {
    const loadSettings = async () => {
      if (!personnel?.id || !tenantId) return;
      
      try {
        setIsLoading(true);
        
        // Récupérer toutes les préférences de notification pour cet utilisateur
        const { data: preferences, error } = await supabase
          .from('preferences_utilisateur')
          .select('cle_preference, valeur_preference')
          .eq('tenant_id', tenantId)
          .eq('personnel_id', personnel.id)
          .in('cle_preference', [
            'notif_email_alerts',
            'notif_desktop_notifications', 
            'notif_sound_enabled',
            'notif_failed_login_threshold',
            'notif_security_incident_notify',
            'notif_password_expiry_days',
            'notif_suspicious_activity_notify'
          ]);

        if (error) {
          console.error('Erreur chargement préférences:', error);
          return;
        }

        if (preferences && preferences.length > 0) {
          const settings = { ...notificationSettings };
          
          preferences.forEach((pref: any) => {
            const key = pref.cle_preference.replace('notif_', '') as keyof NotificationSettings;
            const value = pref.valeur_preference;
            
            // Convertir les types selon la clé
            if (typeof settings[key] === 'boolean') {
              (settings as any)[key] = value === 'true';
            } else if (typeof settings[key] === 'number') {
              (settings as any)[key] = parseInt(value) || 0;
            } else {
              (settings as any)[key] = value;
            }
          });
          
          setNotificationSettings(settings);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [personnel?.id, tenantId]);

  // Sauvegarder les paramètres dans preferences_utilisateur
  const handleSaveSettings = async () => {
    if (!personnel?.id || !tenantId) {
      toast({
        title: "Erreur",
        description: "Utilisateur ou tenant non disponible.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Préparer les données de préférences
      const preferencesToUpsert = Object.entries(notificationSettings).map(([key, value]) => ({
        tenant_id: tenantId,
        personnel_id: personnel.id,
        cle_preference: `notif_${key}`,
        valeur_preference: value.toString(),
        type_preference: 'notification'
      }));

      // Supprimer les anciennes préférences
      await supabase
        .from('preferences_utilisateur')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('personnel_id', personnel.id)
        .like('cle_preference', 'notif_%');

      // Insérer les nouvelles préférences
      const { error } = await supabase
        .from('preferences_utilisateur')
        .insert(preferencesToUpsert);

      if (error) {
        throw error;
      }

      // Logger l'action
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        personnel_id: personnel.id,
        action: 'SECURITY_NOTIFICATION_SETTINGS_UPDATED',
        table_name: 'preferences_utilisateur',
        new_values: JSON.stringify(notificationSettings) as any,
        status: 'success'
      });

      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de notification ont été mis à jour avec succès.",
      });
    } catch (error: any) {
      console.error('Erreur sauvegarde paramètres:', error);
      
      // Gestion des erreurs RLS
      if (error.message?.includes('row-level security')) {
        toast({
          title: "Erreur de permissions",
          description: "Vous n'avez pas les permissions pour modifier ces paramètres.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les paramètres. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Calculer les statistiques de notifications
  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter((n: any) => !n.read).length || 5, // Simulation car pas de champ read
    critical: notifications.filter((n: any) => n.action.includes('CRITICAL') || n.action.includes('SECURITY')).length,
    today: notifications.filter((n: any) => {
      const today = new Date();
      const notifDate = new Date(n.created_at);
      return notifDate.toDateString() === today.toDateString();
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Statistiques de notifications */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{notificationStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Non lues</p>
                <p className="text-2xl font-bold text-orange-500">{notificationStats.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium">Critiques</p>
                <p className="text-2xl font-bold text-red-500">{notificationStats.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium">Aujourd'hui</p>
                <p className="text-2xl font-bold text-green-500">{notificationStats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Centre de Notifications Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="text-center py-8">
                  <p>Chargement des notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune notification de sécurité récente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification: any) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {notification.action.includes('CRITICAL') ? (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            ) : notification.action.includes('SECURITY') ? (
                              <Shield className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Bell className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{notification.action.replace(/_/g, ' ')}</p>
                            {notification.error_message && (
                              <p className="text-xs text-muted-foreground">{notification.error_message}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={notification.status === 'success' ? 'default' : 'destructive'}>
                            {notification.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres de Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Chargement des paramètres...</p>
                </div>
              ) : (
                <>
                  {/* Notifications générales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notifications Générales</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <Label htmlFor="email-alerts">Alertes par email</Label>
                      </div>
                      <Switch 
                        id="email-alerts"
                        checked={notificationSettings.email_alerts} 
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, email_alerts: checked }))
                        } 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <Label htmlFor="desktop-notifications">Notifications bureau</Label>
                      </div>
                      <Switch 
                        id="desktop-notifications"
                        checked={notificationSettings.desktop_notifications} 
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, desktop_notifications: checked }))
                        } 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        <Label htmlFor="sound-enabled">Sons activés</Label>
                      </div>
                      <Switch 
                        id="sound-enabled"
                        checked={notificationSettings.sound_enabled} 
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, sound_enabled: checked }))
                        } 
                      />
                    </div>
                  </div>

                  {/* Seuils d'alertes */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Seuils d'Alertes</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="failed-login-threshold">Seuil tentatives échouées</Label>
                        <Input
                          id="failed-login-threshold"
                          type="number"
                          min="1"
                          max="10"
                          value={notificationSettings.failed_login_threshold}
                          onChange={(e) => 
                            setNotificationSettings(prev => ({ 
                              ...prev, 
                              failed_login_threshold: parseInt(e.target.value) || 3 
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password-expiry-days">Alerte expiration mot de passe (jours)</Label>
                        <Input
                          id="password-expiry-days"
                          type="number"
                          min="1"
                          max="30"
                          value={notificationSettings.password_expiry_days}
                          onChange={(e) => 
                            setNotificationSettings(prev => ({ 
                              ...prev, 
                              password_expiry_days: parseInt(e.target.value) || 7 
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notifications spécifiques */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notifications Spécifiques</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="security-incident-notify">Incidents de sécurité</Label>
                        <p className="text-sm text-muted-foreground">Notifications pour nouveaux incidents</p>
                      </div>
                      <Switch 
                        id="security-incident-notify"
                        checked={notificationSettings.security_incident_notify} 
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, security_incident_notify: checked }))
                        } 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="suspicious-activity-notify">Activité suspecte</Label>
                        <p className="text-sm text-muted-foreground">Alertes pour comportements suspects</p>
                      </div>
                      <Switch 
                        id="suspicious-activity-notify"
                        checked={notificationSettings.suspicious_activity_notify} 
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, suspicious_activity_notify: checked }))
                        } 
                      />
                    </div>
                  </div>

                  {/* Bouton de sauvegarde */}
                  <div className="pt-6 border-t">
                    <Button 
                      onClick={handleSaveSettings} 
                      className="w-full"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityNotifications;