import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, TrendingDown, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAlertSettings } from '@/hooks/useAlertSettings';
import { useAlertThresholds } from '@/hooks/useAlertThresholds';
import { useTenant } from '@/contexts/TenantContext';

const AlertsConfig = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { settings, loading: settingsLoading, saveSettings, isUpdating: settingsUpdating } = useAlertSettings();
  const { thresholds, loading: thresholdsLoading, updateThreshold, isUpdating: thresholdsUpdating } = useAlertThresholds();
  
  const [alertConfig, setAlertConfig] = useState({
    lowStockEnabled: true,
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    expirationAlertDays: 30,
    nearExpirationDays: 7,
    overdueInventoryDays: 365,
    slowMovingDays: 90,
    emailNotifications: true,
    smsNotifications: false,
    dashboardNotifications: true,
    alertFrequency: 'daily',
    businessDaysOnly: true,
    alertStartTime: '08:00',
    alertEndTime: '18:00'
  });

  // Load settings from database when available
  useEffect(() => {
    if (settings) {
      setAlertConfig({
        lowStockEnabled: settings.low_stock_enabled || true,
        lowStockThreshold: settings.low_stock_threshold || 10,
        criticalStockThreshold: settings.critical_stock_threshold || 5,
        expirationAlertDays: settings.expiration_alert_days || 30,
        nearExpirationDays: settings.near_expiration_days || 7,
        overdueInventoryDays: settings.overdue_inventory_days || 365,
        slowMovingDays: settings.slow_moving_days || 90,
        emailNotifications: settings.email_notifications || true,
        smsNotifications: settings.sms_notifications || false,
        dashboardNotifications: settings.dashboard_notifications || true,
        alertFrequency: settings.alert_frequency || 'daily',
        businessDaysOnly: settings.business_days_only || true,
        alertStartTime: settings.alert_start_time || '08:00',
        alertEndTime: settings.alert_end_time || '18:00'
      });
    }
  }, [settings]);

  const handleConfigChange = (key: string, value: any) => {
    setAlertConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleThresholdChange = async (id: string, field: string, value: any) => {
    try {
      await updateThreshold({ id, [field]: value });
    } catch (error) {
      console.error('Error updating threshold:', error);
    }
  };

  const handleSave = async () => {
    if (!tenantId) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder sans tenant ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveSettings({
        tenant_id: tenantId,
        low_stock_enabled: alertConfig.lowStockEnabled,
        low_stock_threshold: alertConfig.lowStockThreshold,
        critical_stock_threshold: alertConfig.criticalStockThreshold,
        expiration_alert_days: alertConfig.expirationAlertDays,
        near_expiration_days: alertConfig.nearExpirationDays,
        overdue_inventory_days: alertConfig.overdueInventoryDays,
        slow_moving_days: alertConfig.slowMovingDays,
        email_notifications: alertConfig.emailNotifications,
        sms_notifications: alertConfig.smsNotifications,
        dashboard_notifications: alertConfig.dashboardNotifications,
        alert_frequency: alertConfig.alertFrequency,
        business_days_only: alertConfig.businessDaysOnly,
        alert_start_time: alertConfig.alertStartTime,
        alert_end_time: alertConfig.alertEndTime,
      });
    } catch (error) {
      console.error('Error saving alert settings:', error);
    }
  };

  if (settingsLoading || thresholdsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Alertes de Stock
            </CardTitle>
            <CardDescription>
              Configuration des seuils d'alerte stock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="lowStockEnabled">Alertes stock faible</Label>
              <Switch
                id="lowStockEnabled"
                checked={alertConfig.lowStockEnabled}
                onCheckedChange={(checked) => handleConfigChange('lowStockEnabled', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Seuil stock faible (unités)</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="1"
                max="1000"
                value={alertConfig.lowStockThreshold}
                onChange={(e) => handleConfigChange('lowStockThreshold', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="criticalStockThreshold">Seuil stock critique (unités)</Label>
              <Input
                id="criticalStockThreshold"
                type="number"
                min="0"
                max="100"
                value={alertConfig.criticalStockThreshold}
                onChange={(e) => handleConfigChange('criticalStockThreshold', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slowMovingDays">Produits à rotation lente (jours)</Label>
              <Input
                id="slowMovingDays"
                type="number"
                min="30"
                max="365"
                value={alertConfig.slowMovingDays}
                onChange={(e) => handleConfigChange('slowMovingDays', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Alertes d'Expiration
            </CardTitle>
            <CardDescription>
              Configuration des alertes de péremption
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expirationAlertDays">Alerte expiration (jours avant)</Label>
              <Input
                id="expirationAlertDays"
                type="number"
                min="1"
                max="365"
                value={alertConfig.expirationAlertDays}
                onChange={(e) => handleConfigChange('expirationAlertDays', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nearExpirationDays">Expiration proche (jours)</Label>
              <Input
                id="nearExpirationDays"
                type="number"
                min="1"
                max="30"
                value={alertConfig.nearExpirationDays}
                onChange={(e) => handleConfigChange('nearExpirationDays', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="overdueInventoryDays">Inventaire en retard (jours)</Label>
              <Input
                id="overdueInventoryDays"
                type="number"
                min="30"
                max="365"
                value={alertConfig.overdueInventoryDays}
                onChange={(e) => handleConfigChange('overdueInventoryDays', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Méthodes et horaires de notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Notifications par email</Label>
              <Switch
                id="emailNotifications"
                checked={alertConfig.emailNotifications}
                onCheckedChange={(checked) => handleConfigChange('emailNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="smsNotifications">Notifications par SMS</Label>
              <Switch
                id="smsNotifications"
                checked={alertConfig.smsNotifications}
                onCheckedChange={(checked) => handleConfigChange('smsNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="dashboardNotifications">Notifications tableau de bord</Label>
              <Switch
                id="dashboardNotifications"
                checked={alertConfig.dashboardNotifications}
                onCheckedChange={(checked) => handleConfigChange('dashboardNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="businessDaysOnly">Jours ouvrés uniquement</Label>
              <Switch
                id="businessDaysOnly"
                checked={alertConfig.businessDaysOnly}
                onCheckedChange={(checked) => handleConfigChange('businessDaysOnly', checked)}
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="alertFrequency">Fréquence des alertes</Label>
              <Select 
                value={alertConfig.alertFrequency} 
                onValueChange={(value) => handleConfigChange('alertFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immédiate</SelectItem>
                  <SelectItem value="hourly">Toutes les heures</SelectItem>
                  <SelectItem value="daily">Quotidienne</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alertStartTime">Heure de début</Label>
              <Input
                id="alertStartTime"
                type="time"
                value={alertConfig.alertStartTime}
                onChange={(e) => handleConfigChange('alertStartTime', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alertEndTime">Heure de fin</Label>
              <Input
                id="alertEndTime"
                type="time"
                value={alertConfig.alertEndTime}
                onChange={(e) => handleConfigChange('alertEndTime', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seuils par Catégorie</CardTitle>
          <CardDescription>
            Configuration des seuils spécifiques par catégorie de produits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {thresholds?.map((threshold, index) => (
              <div key={threshold.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{threshold.category}</p>
                    <p className="text-sm text-muted-foreground">
                      Seuil: {threshold.threshold} unités
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="1000"
                    value={threshold.threshold}
                    onChange={(e) => handleThresholdChange(threshold.id, 'threshold', Number(e.target.value))}
                    className="w-20"
                  />
                  <Switch
                    checked={threshold.enabled}
                    onCheckedChange={(checked) => handleThresholdChange(threshold.id, 'enabled', checked)}
                  />
                  <Badge variant={threshold.enabled ? "default" : "secondary"}>
                    {threshold.enabled ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={settingsUpdating}>
          {settingsUpdating ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </Button>
      </div>
    </div>
  );
};

export default AlertsConfig;