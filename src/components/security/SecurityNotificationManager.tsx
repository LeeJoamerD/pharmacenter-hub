import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, MessageSquare, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from "@/integrations/supabase/types";

type SecurityAlert = Database['public']['Tables']['security_alerts']['Row'];

interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  alertThreshold: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
}

const SecurityNotificationManager = () => {
  const { personnel } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    pushEnabled: true,
    alertThreshold: 'medium',
    channels: ['email', 'dashboard']
  });
  const [loading, setLoading] = useState(true);

  // Charger les alertes récentes
  const loadRecentAlerts = async () => {
    if (!personnel) return;

    try {
      const { data } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .order('created_at', { ascending: false })
        .limit(20);

      setAlerts(data || []);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les paramètres de notification
  const saveSettings = async () => {
    try {
      // Ici on pourrait sauvegarder dans une table de paramètres
      // Pour l'instant, on sauvegarde en localStorage
      localStorage.setItem(
        `notification_settings_${personnel?.tenant_id}`, 
        JSON.stringify(settings)
      );
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences de notification ont été mises à jour."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive"
      });
    }
  };

  // Charger les paramètres depuis localStorage
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(`notification_settings_${personnel?.tenant_id}`);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  useEffect(() => {
    if (personnel) {
      loadRecentAlerts();
      loadSettings();
    }
  }, [personnel]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications de Sécurité
        </h2>
        <p className="text-muted-foreground">
          Configuration des alertes et notifications de sécurité
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paramètres de notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres de Notification
            </CardTitle>
            <CardDescription>
              Configurez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les alertes par email
                </p>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, emailEnabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notifications push</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les notifications en temps réel
                </p>
              </div>
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, pushEnabled: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Seuil d'alerte minimum</Label>
              <Select
                value={settings.alertThreshold}
                onValueChange={(value: any) => 
                  setSettings(prev => ({ ...prev, alertThreshold: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Niveau minimum de sévérité pour recevoir des notifications
              </p>
            </div>

            <Button onClick={saveSettings} className="w-full">
              Sauvegarder les paramètres
            </Button>
          </CardContent>
        </Card>

        {/* Alertes récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Alertes Récentes</CardTitle>
            <CardDescription>
              Dernières notifications de sécurité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune alerte récente
                </p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(alert.created_at)}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {alert.alert_type}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityNotificationManager;