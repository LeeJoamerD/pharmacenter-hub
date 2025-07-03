import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StockGeneralConfig = () => {
  const { toast } = useToast();
  
  const [config, setConfig] = useState({
    defaultUnits: 'unité',
    minimumStockDays: 7,
    maximumStockDays: 90,
    autoReorderEnabled: true,
    reorderPointDays: 15,
    safetyStockPercentage: 20,
    valuationMethod: 'FIFO',
    roundingPrecision: 2,
    allowNegativeStock: false,
    trackExpirationDates: true,
    requireLotNumbers: true,
    autoGenerateLots: true
  });

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres généraux du stock ont été mis à jour.",
    });
  };

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
                max="4"
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
        <Button onClick={handleSave}>
          Sauvegarder la configuration
        </Button>
      </div>
    </div>
  );
};

export default StockGeneralConfig;