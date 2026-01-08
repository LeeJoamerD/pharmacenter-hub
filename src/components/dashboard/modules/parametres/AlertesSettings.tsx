import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, Package, Calendar, TrendingDown, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';

const AlertesSettings = () => {
  const { t } = useLanguage();
  const alertTypes = [
    {
      id: 'stock-bas',
      title: t('lowStock'),
      description: t('lowStockDesc'),
      icon: Package,
      enabled: true,
    },
    {
      id: 'peremption',
      title: t('nearExpiration'),
      description: t('nearExpirationDesc'),
      icon: Calendar,
      enabled: true,
    },
    {
      id: 'rupture',
      title: t('outOfStockAlert'),
      description: t('outOfStockAlertDesc'),
      icon: AlertTriangle,
      enabled: true,
    },
    {
      id: 'ventes-faibles',
      title: t('lowSales'),
      description: t('lowSalesDesc'),
      icon: TrendingDown,
      enabled: false,
    },
  ];

  const notificationChannels = [
    {
      id: 'email',
      title: t('emailChannel'),
      description: t('emailChannelDesc'),
      icon: Mail,
      enabled: true,
    },
    {
      id: 'sms',
      title: t('smsChannel'),
      description: t('smsChannelDesc'),
      icon: Smartphone,
      enabled: false,
    },
    {
      id: 'in-app',
      title: t('inAppChannel'),
      description: t('inAppChannelDesc'),
      icon: MessageSquare,
      enabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Bell className="h-5 w-5" />
        <span>{t('configureAlertsDesc')}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('alertTypes')}</CardTitle>
          <CardDescription>
            {t('enableDisableAlerts')}
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
          <CardTitle className="text-lg">{t('notificationChannels')}</CardTitle>
          <CardDescription>
            {t('chooseAlertChannels')}
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
          <CardTitle className="text-lg">{t('thresholdSettings')}</CardTitle>
          <CardDescription>
            {t('defineThresholds')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jours-peremption">{t('daysBeforeExpiration')}</Label>
              <Input 
                id="jours-peremption" 
                type="number" 
                defaultValue={30}
                min={1}
              />
              <p className="text-xs text-muted-foreground">
                {t('daysBeforeExpirationDesc')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seuil-stock">{t('criticalStockThreshold')}</Label>
              <Input 
                id="seuil-stock" 
                type="number" 
                defaultValue={10}
                min={1}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                {t('criticalStockThresholdDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertesSettings;
