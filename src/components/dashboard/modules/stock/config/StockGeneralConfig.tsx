import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStockSettings } from '@/hooks/useStockSettings';
import { useTenant } from '@/contexts/TenantContext';

const StockGeneralConfig = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { settings, loading, updateSettings } = useStockSettings();
  
  const [config, setConfig] = useState({
    defaultUnits: 'Unité',
    minimumStockDays: 30,
    maximumStockDays: 365,
    autoReorderEnabled: false,
    reorderPointDays: 15,
    safetyStockPercentage: 10,
    valuationMethod: 'FIFO',
    roundingPrecision: 2,
    allowNegativeStock: false,
    trackExpirationDates: true,
    requireLotNumbers: false,
    autoGenerateLots: false
  });

  // Load settings from database when available
  useEffect(() => {
    if (settings) {
      setConfig({
        defaultUnits: settings.default_units || 'Unité',
        minimumStockDays: settings.minimum_stock_days || 30,
        maximumStockDays: settings.maximum_stock_days || 365,
        autoReorderEnabled: settings.auto_reorder_enabled || false,
        reorderPointDays: settings.reorder_point_days || 15,
        safetyStockPercentage: settings.safety_stock_percentage || 10,
        valuationMethod: settings.valuation_method || 'FIFO',
        roundingPrecision: settings.rounding_precision || 2,
        allowNegativeStock: settings.allow_negative_stock || false,
        trackExpirationDates: settings.track_expiration_dates || true,
        requireLotNumbers: settings.requireLotNumbers || false,
        autoGenerateLots: settings.auto_generate_lots || false
      });
    }
  }, [settings]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
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
      await updateSettings({
        default_units: config.defaultUnits,
        minimum_stock_days: config.minimumStockDays,
        maximum_stock_days: config.maximumStockDays,
        auto_reorder_enabled: config.autoReorderEnabled,
        reorder_point_days: config.reorderPointDays,
        safety_stock_percentage: config.safetyStockPercentage,
        valuation_method: config.valuationMethod as 'FIFO' | 'LIFO' | 'PMP' | 'CUMP',
        rounding_precision: config.roundingPrecision,
        allow_negative_stock: config.allowNegativeStock,
        track_expiration_dates: config.trackExpirationDates,
        requireLotNumbers: config.requireLotNumbers,
        auto_generate_lots: config.autoGenerateLots,
      });
    } catch (error) {
      console.error('Error saving stock settings:', error);
    }
  };

  if (loading) {
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
              <Package className="h-5 w-5" />
              Paramètres Généraux
            </CardTitle>
            <CardDescription>
              Configuration de base du module stock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultUnits">Unité par défaut</Label>
              <Select 
                value={config.defaultUnits} 
                onValueChange={(value) => handleConfigChange('defaultUnits', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unité">Unité</SelectItem>
                  <SelectItem value="boîte">Boîte</SelectItem>
                  <SelectItem value="flacon">Flacon</SelectItem>
                  <SelectItem value="tube">Tube</SelectItem>
                  <SelectItem value="ampoule">Ampoule</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valuationMethod">Méthode de valorisation</Label>
              <Select 
                value={config.valuationMethod} 
                onValueChange={(value) => handleConfigChange('valuationMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIFO">FIFO (Premier entré, premier sorti)</SelectItem>
                  <SelectItem value="LIFO">LIFO (Dernier entré, premier sorti)</SelectItem>
                  <SelectItem value="PMP">Prix Moyen Pondéré</SelectItem>
                  <SelectItem value="CUMP">Coût Unitaire Moyen Pondéré</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roundingPrecision">Précision d'arrondi</Label>
              <Input
                id="roundingPrecision"
                type="number"
                min="0"
                max="100"
                value={config.roundingPrecision}
                onChange={(e) => handleConfigChange('roundingPrecision', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestion des Stocks</CardTitle>
            <CardDescription>
              Paramètres de gestion automatique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minimumStockDays">Stock minimum (jours)</Label>
              <Input
                id="minimumStockDays"
                type="number"
                min="1"
                max="365"
                value={config.minimumStockDays}
                onChange={(e) => handleConfigChange('minimumStockDays', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maximumStockDays">Stock maximum (jours)</Label>
              <Input
                id="maximumStockDays"
                type="number"
                min="1"
                max="365"
                value={config.maximumStockDays}
                onChange={(e) => handleConfigChange('maximumStockDays', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reorderPointDays">Point de commande (jours)</Label>
              <Input
                id="reorderPointDays"
                type="number"
                min="1"
                max="90"
                value={config.reorderPointDays}
                onChange={(e) => handleConfigChange('reorderPointDays', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="safetyStockPercentage">Stock de sécurité (%)</Label>
              <Input
                id="safetyStockPercentage"
                type="number"
                min="0"
                max="100"
                value={config.safetyStockPercentage}
                onChange={(e) => handleConfigChange('safetyStockPercentage', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Options Avancées</CardTitle>
          <CardDescription>
            Configuration des fonctionnalités avancées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoReorderEnabled">Commande automatique</Label>
              <Switch
                id="autoReorderEnabled"
                checked={config.autoReorderEnabled}
                onCheckedChange={(checked) => handleConfigChange('autoReorderEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="allowNegativeStock">Autoriser stock négatif</Label>
              <Switch
                id="allowNegativeStock"
                checked={config.allowNegativeStock}
                onCheckedChange={(checked) => handleConfigChange('allowNegativeStock', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="trackExpirationDates">Suivi dates d'expiration</Label>
              <Switch
                id="trackExpirationDates"
                checked={config.trackExpirationDates}
                onCheckedChange={(checked) => handleConfigChange('trackExpirationDates', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="requireLotNumbers">Numéros de lot obligatoires</Label>
              <Switch
                id="requireLotNumbers"
                checked={config.requireLotNumbers}
                onCheckedChange={(checked) => handleConfigChange('requireLotNumbers', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoGenerateLots">Génération automatique des lots</Label>
              <Switch
                id="autoGenerateLots"
                checked={config.autoGenerateLots}
                onCheckedChange={(checked) => handleConfigChange('autoGenerateLots', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </Button>
      </div>
    </div>
  );
};

export default StockGeneralConfig;