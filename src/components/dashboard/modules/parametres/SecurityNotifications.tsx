import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SecurityNotifications = () => {
  const { toast } = useToast();
  const { tenantId, useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_alerts: true,
    desktop_notifications: true,
    sound_enabled: true,
    failed_login_threshold: 3,
    security_incident_notify: true,
    password_expiry_days: 7,
    suspicious_activity_notify: true
  });

  // Charger les notifications
  const { data: notifications = [], isLoading } = useTenantQueryWithCache(
    ['security-notifications'],
    'audit_logs',
    '*',
    { action: { like: '%SECURITY%' } },
    { orderBy: { column: 'created_at', ascending: false }, limit: 50 }
  );

  const handleSaveSettings = async () => {
    if (!tenantId) return;
    
    toast({
      title: "Paramètres sauvegardés",
      description: "Les paramètres de notification ont été mis à jour.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><Bell className="h-8 w-8 text-blue-500" /><div><p className="text-sm font-medium">Total</p><p className="text-2xl font-bold">{notifications.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><XCircle className="h-8 w-8 text-orange-500" /><div><p className="text-sm font-medium">Non lues</p><p className="text-2xl font-bold text-orange-500">5</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><AlertTriangle className="h-8 w-8 text-red-500" /><div><p className="text-sm font-medium">Critiques</p><p className="text-2xl font-bold text-red-500">2</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><Clock className="h-8 w-8 text-green-500" /><div><p className="text-sm font-medium">Aujourd'hui</p><p className="text-2xl font-bold text-green-500">8</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Centre de Notifications</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <p>Chargement...</p> : 
                <Table>
                  <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Message</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {notifications.map((notification: any) => (
                      <TableRow key={notification.id}>
                        <TableCell><Bell className="h-4 w-4" /></TableCell>
                        <TableCell>{notification.action}</TableCell>
                        <TableCell>{format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>Paramètres de Notification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Alertes par email</Label>
                <Switch checked={notificationSettings.email_alerts} onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_alerts: checked }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Notifications bureau</Label>
                <Switch checked={notificationSettings.desktop_notifications} onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, desktop_notifications: checked }))} />
              </div>
              <Button onClick={handleSaveSettings} className="w-full">Sauvegarder</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityNotifications;