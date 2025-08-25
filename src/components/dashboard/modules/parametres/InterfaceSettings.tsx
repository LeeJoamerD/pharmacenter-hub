import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Palette, Monitor, Type, Layout, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';

const InterfaceSettings = () => {
  const { toast } = useToast();
  const { settings: systemSettings, loading, saving, saveSettings, updateSettings } = useGlobalSystemSettings();
  
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

  const [hasChanges, setHasChanges] = useState(false);

  // Mapping des valeurs normalisées DB vers UI
  const mapDbToUi = (settings_any: any) => ({
    theme: mapDbValueToUi(settings_any.interface_theme, 'clair', 'light', { clair: 'light', foncé: 'dark', auto: 'auto' }),
    primaryColor: mapDbValueToUi(settings_any.interface_primary_color, 'bleu', 'blue', { 
      bleu: 'blue', vert: 'green', violet: 'purple', orange: 'orange', 
      rouge: 'red', sarcelle: 'teal', indigo: 'indigo' 
    }),
    fontSize: parseInt(settings_any.interface_font_size || '14'),
    sidebarCollapsed: settings_any.interface_sidebar_collapsed === 'vrai',
    showTooltips: settings_any.interface_show_tooltips !== 'faux',
    animationsEnabled: settings_any.interface_animations_activées !== 'faux',
    compactMode: settings_any.interface_compact_mode === 'vrai',
    gridDensity: mapDbValueToUi(settings_any.interface_grid_density, 'confortable', 'comfortable', {
      compact: 'compact', confortable: 'comfortable', spacieux: 'spacious'
    }),
    language: settings_any.default_lingual || systemSettings.default_language || 'fr',
    dateFormat: mapDbValueToUi(settings_any.interface_date_format, 'jj/mm/aaaa', 'dd/mm/yyyy', {
      'jj/mm/aaaa': 'dd/mm/yyyy', 'mm/jj/aaaa': 'mm/dd/yyyy', 'aaaa-mm-jj': 'yyyy-mm-dd', 'jj-mm-aaaa': 'dd-mm-yyyy'
    }),
    numberFormat: mapDbValueToUi(settings_any.interface_number_format, 'français', 'french', {
      français: 'french', anglais: 'english', espace: 'space'
    }),
    autoSave: settings_any.interface_auto_save !== 'faux'
  });

  // Fonction helper pour mapper les valeurs DB vers UI
  const mapDbValueToUi = (dbValue: string, dbDefault: string, uiDefault: string, mapping: Record<string, string>) => {
    const value = dbValue || dbDefault;
    return mapping[value] || uiDefault;
  };

  // Charger les paramètres depuis la base de données
  useEffect(() => {
    if (systemSettings) {
      const settings_any = systemSettings as any;
      setSettings(mapDbToUi(settings_any));
      setHasChanges(false);
    }
  }, [systemSettings]);

  // Mapping des valeurs UI vers DB normalisées
  const mapUiToDb = (settings: any) => ({
    interface_theme: mapUiValueToDb(settings.theme, { light: 'clair', dark: 'foncé', auto: 'auto' }),
    interface_primary_color: mapUiValueToDb(settings.primaryColor, {
      blue: 'bleu', green: 'vert', purple: 'violet', orange: 'orange',
      red: 'rouge', teal: 'sarcelle', indigo: 'indigo'
    }),
    interface_font_size: settings.fontSize.toString(),
    interface_sidebar_collapsed: settings.sidebarCollapsed ? 'vrai' : 'faux',
    interface_show_tooltips: settings.showTooltips ? 'vrai' : 'faux',
    interface_animations_activées: settings.animationsEnabled ? 'vrai' : 'faux',
    interface_compact_mode: settings.compactMode ? 'vrai' : 'faux',
    interface_grid_density: mapUiValueToDb(settings.gridDensity, {
      compact: 'compact', comfortable: 'confortable', spacious: 'spacieux'
    }),
    default_lingual: settings.language,
    interface_date_format: mapUiValueToDb(settings.dateFormat, {
      'dd/mm/yyyy': 'jj/mm/aaaa', 'mm/dd/yyyy': 'mm/jj/aaaa', 'yyyy-mm-dd': 'aaaa-mm-jj', 'dd-mm-yyyy': 'jj-mm-aaaa'
    }),
    interface_number_format: mapUiValueToDb(settings.numberFormat, {
      french: 'français', english: 'anglais', space: 'espace'
    }),
    interface_auto_save: settings.autoSave ? 'vrai' : 'faux'
  });

  // Fonction helper pour mapper les valeurs UI vers DB
  const mapUiValueToDb = (uiValue: string, mapping: Record<string, string>) => {
    return mapping[uiValue] || uiValue;
  };

  const handleSave = async () => {
    try {
      const interfaceParams = mapUiToDb(settings);

      await saveSettings(interfaceParams);
      setHasChanges(false);
      
      toast({
        title: "Interface mise à jour",
        description: "Les paramètres d'interface ont été sauvegardés avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres d'interface.",
        variant: "destructive"
      });
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des paramètres d'interface...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasChanges && (
        <Alert>
          <AlertDescription>
            Vous avez des modifications non sauvegardées. N'oubliez pas de cliquer sur "Appliquer les changements".
          </AlertDescription>
        </Alert>
      )}
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
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Foncé</SelectItem>
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
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
                  <SelectItem value="blue">Bleu</SelectItem>
                  <SelectItem value="green">Vert</SelectItem>
                  <SelectItem value="purple">Violet</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="red">Rouge</SelectItem>
                  <SelectItem value="teal">Sarcelle</SelectItem>
                  <SelectItem value="indigo">Indigo</SelectItem>
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
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
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
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ln">Lingala</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Format de date</Label>
              <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numberFormat">Format numérique</Label>
              <Select value={settings.numberFormat} onValueChange={(value) => handleSettingChange('numberFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
                  <SelectItem value="french">Français (1 234,56)</SelectItem>
                  <SelectItem value="english">Anglais (1,234.56)</SelectItem>
                  <SelectItem value="space">Espace (1 234.56)</SelectItem>
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
        <Button 
          onClick={handleSave} 
          disabled={saving || !hasChanges}
          className="min-w-[200px]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Appliquer les changements'
          )}
        </Button>
      </div>
    </div>
  );
};

export default InterfaceSettings;