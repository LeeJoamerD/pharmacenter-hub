import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, TrendingDown, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AlertsConfig = () => {
  const { toast } = useToast();
  
  const [alertConfig, setAlertConfig] = useState({
    lowStockEnabled: true,
    lowStockThreshold: 10,
    criticalStockThreshold: 3,
    expirationAlertDays: 30,
    nearExpirationDays: 7,
    overdueInventoryDays: 90,
    slowMovingDays: 180,
    emailNotifications: true,
    smsNotifications: false,
    dashboardNotifications: true,
    alertFrequency: 'daily',
    businessDaysOnly: true,
    alertStartTime: '08:00',
    alertEndTime: '18:00'
  });

  const [alertThresholds, setAlertThresholds] = useState([
    { category: 'Médicaments', threshold: 5, enabled: true },
    { category: 'Produits de beauté', threshold: 10, enabled: true },
    { category: 'Matériel médical', threshold: 3, enabled: true },
    { category: 'Compléments', threshold: 15, enabled: false }
  ]);

  const handleConfigChange = (key: string, value: any) => {
    setAlertConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleThresholdChange = (index: number, field: string, value: any) => {
    setAlertThresholds(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = () => {
    toast({
      title: "Configuration des alertes sauvegardée",
      description: "Les paramètres d'alertes ont été mis à jour.",
    });
  };

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
            {alertThresholds.map((threshold, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
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
                    onChange={(e) => handleThresholdChange(index, 'threshold', Number(e.target.value))}
                    className="w-20"
                  />
                  <Switch
                    checked={threshold.enabled}
                    onCheckedChange={(checked) => handleThresholdChange(index, 'enabled', checked)}
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
        <Button onClick={handleSave}>
          Sauvegarder la configuration
        </Button>
      </div>
    </div>
  );
};

export default AlertsConfig;