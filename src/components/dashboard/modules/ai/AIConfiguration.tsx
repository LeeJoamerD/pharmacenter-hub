import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, Shield, Database, Zap, Brain, CheckCircle, Save, RotateCcw } from 'lucide-react';
import { useAISettings } from '@/hooks/useAISettings';

const AIConfiguration = () => {
  const {
    settings,
    hasUnsavedChanges,
    isLoading,
    updateLocalSetting,
    saveAllSettings,
    resetChanges
  } = useAISettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration IA</h2>
          <p className="text-muted-foreground">Paramètres et gouvernance de l'intelligence artificielle</p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetChanges}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
          <Button
            onClick={saveAllSettings}
            disabled={isLoading || !hasUnsavedChanges}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres Généraux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Apprentissage Automatique</label>
                <p className="text-sm text-muted-foreground">Formation continue des modèles</p>
              </div>
              <Switch 
                checked={settings.autoLearning} 
                onCheckedChange={(checked) => updateLocalSetting('autoLearning', checked)} 
              />
            </div>
            
            <div>
              <label className="font-medium mb-2 block">Seuil de Confiance: {settings.confidenceThreshold}%</label>
              <Slider
                value={[settings.confidenceThreshold]}
                onValueChange={(value) => updateLocalSetting('confidenceThreshold', value[0])}
                max={100}
                min={50}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité & Éthique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${settings.aiAuditEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <label className="font-medium text-sm">Audit IA</label>
                  <p className="text-xs text-muted-foreground">Surveillance des décisions IA</p>
                </div>
              </div>
              <Switch 
                checked={settings.aiAuditEnabled} 
                onCheckedChange={(checked) => updateLocalSetting('aiAuditEnabled', checked)} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${settings.gdprCompliance ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <label className="font-medium text-sm">Conformité RGPD</label>
                  <p className="text-xs text-muted-foreground">Respect des données personnelles</p>
                </div>
              </div>
              <Switch 
                checked={settings.gdprCompliance} 
                onCheckedChange={(checked) => updateLocalSetting('gdprCompliance', checked)} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${settings.explainabilityEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <label className="font-medium text-sm">Explicabilité IA</label>
                  <p className="text-xs text-muted-foreground">Justification des décisions</p>
                </div>
              </div>
              <Switch 
                checked={settings.explainabilityEnabled} 
                onCheckedChange={(checked) => updateLocalSetting('explainabilityEnabled', checked)} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gestion des Données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Surveillance des Performances</label>
                <p className="text-sm text-muted-foreground">Monitoring continu des modèles</p>
              </div>
              <Switch 
                checked={settings.performanceMonitoring} 
                onCheckedChange={(checked) => updateLocalSetting('performanceMonitoring', checked)} 
              />
            </div>
            
            <div>
              <label className="font-medium mb-2 block">Rétention des Données: {settings.dataRetentionDays} jours</label>
              <Slider
                value={[settings.dataRetentionDays]}
                onValueChange={(value) => updateLocalSetting('dataRetentionDays', value[0])}
                max={365}
                min={7}
                step={7}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Notifications & Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Notifications d'Alertes</label>
                <p className="text-sm text-muted-foreground">Alertes en temps réel</p>
              </div>
              <Switch 
                checked={settings.alertNotifications} 
                onCheckedChange={(checked) => updateLocalSetting('alertNotifications', checked)} 
              />
            </div>
            
            <div>
              <label className="font-medium mb-2 block">Fréquence des Mises à Jour</label>
              <select 
                value={settings.modelUpdateFrequency}
                onChange={(e) => updateLocalSetting('modelUpdateFrequency', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIConfiguration;