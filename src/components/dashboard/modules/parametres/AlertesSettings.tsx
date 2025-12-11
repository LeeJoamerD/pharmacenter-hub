import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, Package, Calendar, TrendingDown, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const AlertesSettings = () => {
  const alertTypes = [
    {
      id: 'stock-bas',
      title: 'Stock bas',
      description: 'Alerter quand le stock descend sous le seuil critique',
      icon: Package,
      enabled: true,
    },
    {
      id: 'peremption',
      title: 'Péremption proche',
      description: 'Alerter X jours avant la date de péremption',
      icon: Calendar,
      enabled: true,
    },
    {
      id: 'rupture',
      title: 'Rupture de stock',
      description: 'Alerter immédiatement en cas de rupture',
      icon: AlertTriangle,
      enabled: true,
    },
    {
      id: 'ventes-faibles',
      title: 'Ventes faibles',
      description: 'Alerter si les ventes sont inhabituellement basses',
      icon: TrendingDown,
      enabled: false,
    },
  ];

  const notificationChannels = [
    {
      id: 'email',
      title: 'Email',
      description: 'Recevoir les alertes par email',
      icon: Mail,
      enabled: true,
    },
    {
      id: 'sms',
      title: 'SMS',
      description: 'Recevoir les alertes par SMS',
      icon: Smartphone,
      enabled: false,
    },
    {
      id: 'in-app',
      title: 'Notification in-app',
      description: 'Afficher les alertes dans l\'application',
      icon: MessageSquare,
      enabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Bell className="h-5 w-5" />
        <span>Configurez les alertes et notifications automatiques du système.</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Types d'alertes</CardTitle>
          <CardDescription>
            Activez ou désactivez les différents types d'alertes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alertTypes.map((alert, index) => (
            <React.Fragment key={alert.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <alert.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor={alert.id} className="font-medium">
                      {alert.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {alert.description}
                    </p>
                  </div>
                </div>
                <Switch id={alert.id} defaultChecked={alert.enabled} />
              </div>
              {index < alertTypes.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Canaux de notification</CardTitle>
          <CardDescription>
            Choisissez comment recevoir vos alertes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationChannels.map((channel, index) => (
            <React.Fragment key={channel.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <channel.icon className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div>
                    <Label htmlFor={channel.id} className="font-medium">
                      {channel.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {channel.description}
                    </p>
                  </div>
                </div>
                <Switch id={channel.id} defaultChecked={channel.enabled} />
              </div>
              {index < notificationChannels.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paramètres des seuils</CardTitle>
          <CardDescription>
            Définissez les seuils pour déclencher les alertes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jours-peremption">Jours avant péremption</Label>
              <Input 
                id="jours-peremption" 
                type="number" 
                defaultValue={30}
                min={1}
              />
              <p className="text-xs text-muted-foreground">
                Nombre de jours avant la date de péremption pour alerter
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seuil-stock">Seuil stock critique (%)</Label>
              <Input 
                id="seuil-stock" 
                type="number" 
                defaultValue={10}
                min={1}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Pourcentage du stock optimal pour déclencher l'alerte
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertesSettings;
