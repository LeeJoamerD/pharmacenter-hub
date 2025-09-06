import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Package, AlertTriangle, Clock } from 'lucide-react';
import { useStockSettings, StockSettings } from '@/hooks/useStockSettings';
import { useToast } from '@/hooks/use-toast';

interface StockSettingsDialogProps {
  children: React.ReactNode;
}

const StockSettingsDialog: React.FC<StockSettingsDialogProps> = ({ children }) => {
  const { settings, loading, updateSettings } = useStockSettings();
  const { toast } = useToast();

  const handleSettingChange = async (key: keyof StockSettings, value: any) => {
    try {
      await updateSettings({ [key]: value });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de Stock
          </DialogTitle>
          <DialogDescription>
            Configurez les paramètres avancés de gestion de stock et de réception
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reception Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Réceptions
              </CardTitle>
              <CardDescription>
                Paramètres de gestion des réceptions fournisseurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="oneLotPerReception" className="text-sm font-medium">
                    Un lot par réception
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Créer un lot distinct pour chaque réception même avec le même numéro de lot fabricant
                  </p>
                </div>
                <Switch
                  id="oneLotPerReception" 
                  checked={settings.oneLotPerReception}
                  onCheckedChange={(checked) => handleSettingChange('oneLotPerReception', checked)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="automaticValidation" className="text-sm font-medium">
                    Validation automatique
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Valider automatiquement les réceptions conformes sans écart
                  </p>
                </div>
                <Switch
                  id="automaticValidation"
                  checked={settings.automaticReceptionValidation}
                  onCheckedChange={(checked) => handleSettingChange('automaticReceptionValidation', checked)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="requireLotNumbers" className="text-sm font-medium">
                    Numéros de lot obligatoires
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Rendre obligatoire la saisie des numéros de lot pour tous les produits
                  </p>
                </div>
                <Switch
                  id="requireLotNumbers"
                  checked={settings.requireLotNumbers}
                  onCheckedChange={(checked) => handleSettingChange('requireLotNumbers', checked)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Expiration Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5" />
                Alertes d'Expiration
              </CardTitle>
              <CardDescription>
                Configuration des alertes de péremption des produits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alertDays" className="text-sm font-medium">
                    Alerte générale (jours)
                  </Label>
                  <Input
                    id="alertDays"
                    type="number"
                    value={settings.alertOnExpirationDays}
                    onChange={(e) => handleSettingChange('alertOnExpirationDays', parseInt(e.target.value) || 90)}
                    min="1"
                    max="999"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nombre de jours avant expiration pour déclencher une alerte
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criticalDays" className="text-sm font-medium">
                    Alerte critique (jours)
                  </Label>
                  <Input
                    id="criticalDays"
                    type="number"
                    value={settings.criticalExpirationDays}
                    onChange={(e) => handleSettingChange('criticalExpirationDays', parseInt(e.target.value) || 30)}
                    min="1"
                    max="365"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nombre de jours avant expiration pour déclencher une alerte critique
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Settings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Résumé des Paramètres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Politique de lots:</span> {settings.oneLotPerReception ? 'Un lot par réception' : 'Agrégation par numéro de lot'}</p>
                  <p><span className="font-medium">Validation:</span> {settings.automaticReceptionValidation ? 'Automatique' : 'Manuelle'}</p>
                </div>
                <div>
                  <p><span className="font-medium">Lots obligatoires:</span> {settings.requireLotNumbers ? 'Oui' : 'Non'}</p>
                  <p><span className="font-medium">Alertes:</span> {settings.alertOnExpirationDays}j / {settings.criticalExpirationDays}j</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockSettingsDialog;