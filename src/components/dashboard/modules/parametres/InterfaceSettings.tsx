import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Palette, Monitor, Type, Layout } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InterfaceSettings = () => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    theme: 'light',
    primaryColor: 'blue',
    fontSize: 14,
    sidebarCollapsed: false,
    showTooltips: true,
    animationsEnabled: true,
    compactMode: false,
    gridDensity: 'comfortable',
    language: 'fr',
    dateFormat: 'dd/mm/yyyy',
    numberFormat: 'french',
    autoSave: true
  });

  const handleSave = () => {
    toast({
      title: "Interface mise à jour",
      description: "Les paramètres d'interface ont été sauvegardés.",
    });
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apparence
            </CardTitle>
            <CardDescription>
              Personnalisez l'apparence de l'interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Thème</Label>
              <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="auto">Automatique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Couleur principale</Label>
              <Select value={settings.primaryColor} onValueChange={(value) => handleSettingChange('primaryColor', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Bleu</SelectItem>
                  <SelectItem value="green">Vert</SelectItem>
                  <SelectItem value="purple">Violet</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="red">Rouge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fontSize">Taille de police: {settings.fontSize}px</Label>
              <Slider
                id="fontSize"
                min={12}
                max={20}
                step={1}
                value={[settings.fontSize]}
                onValueChange={(value) => handleSettingChange('fontSize', value[0])}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="animations">Animations</Label>
              <Switch
                id="animations"
                checked={settings.animationsEnabled}
                onCheckedChange={(checked) => handleSettingChange('animationsEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Disposition
            </CardTitle>
            <CardDescription>
              Configuration de la mise en page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gridDensity">Densité des grilles</Label>
              <Select value={settings.gridDensity} onValueChange={(value) => handleSettingChange('gridDensity', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacte</SelectItem>
                  <SelectItem value="comfortable">Confortable</SelectItem>
                  <SelectItem value="spacious">Spacieuse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sidebarCollapsed">Barre latérale réduite</Label>
              <Switch
                id="sidebarCollapsed"
                checked={settings.sidebarCollapsed}
                onCheckedChange={(checked) => handleSettingChange('sidebarCollapsed', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="compactMode">Mode compact</Label>
              <Switch
                id="compactMode"
                checked={settings.compactMode}
                onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="tooltips">Afficher les info-bulles</Label>
              <Switch
                id="tooltips"
                checked={settings.showTooltips}
                onCheckedChange={(checked) => handleSettingChange('showTooltips', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Formats et Localisation
          </CardTitle>
          <CardDescription>
            Configuration des formats d'affichage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Format de date</Label>
              <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numberFormat">Format numérique</Label>
              <Select value={settings.numberFormat} onValueChange={(value) => handleSettingChange('numberFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="french">Français (1 234,56)</SelectItem>
                  <SelectItem value="english">Anglais (1,234.56)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="autoSave">Sauvegarde automatique</Label>
            <Switch
              id="autoSave"
              checked={settings.autoSave}
              onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Appliquer les changements
        </Button>
      </div>
    </div>
  );
};

export default InterfaceSettings;