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
import { useLanguage } from '@/contexts/LanguageContext';

const InterfaceSettings = () => {
  const { t } = useLanguage();
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
        title: t('interfaceUpdated'),
        description: t('interfaceSettingsSaved'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('unableToSaveInterfaceSettings'),
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
        <span className="ml-2">{t('loadingInterfaceSettings')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasChanges && (
        <Alert>
          <AlertDescription>
            {t('unsavedChangesReminder')}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('appearance')}
            </CardTitle>
            <CardDescription>
              {t('customizeInterfaceAppearance')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">{t('theme')}</Label>
              <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
                  <SelectItem value="light">{t('themeLight')}</SelectItem>
                  <SelectItem value="dark">{t('themeDark')}</SelectItem>
                  <SelectItem value="auto">{t('themeAuto')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primaryColor">{t('primaryColor')}</Label>
              <Select value={settings.primaryColor} onValueChange={(value) => handleSettingChange('primaryColor', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
                  <SelectItem value="blue">{t('colorBlue')}</SelectItem>
                  <SelectItem value="green">{t('colorGreen')}</SelectItem>
                  <SelectItem value="purple">{t('colorPurple')}</SelectItem>
                  <SelectItem value="orange">{t('colorOrange')}</SelectItem>
                  <SelectItem value="red">{t('colorRed')}</SelectItem>
                  <SelectItem value="teal">{t('colorTeal')}</SelectItem>
                  <SelectItem value="indigo">{t('colorIndigo')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fontSize">{t('fontSize')}: {settings.fontSize}px</Label>
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
              <Label htmlFor="animations">{t('animations')}</Label>
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
              {t('layout')}
            </CardTitle>
            <CardDescription>
              {t('layoutConfiguration')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gridDensity">{t('gridDensity')}</Label>
              <Select value={settings.gridDensity} onValueChange={(value) => handleSettingChange('gridDensity', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
                  <SelectItem value="compact">{t('densityCompact')}</SelectItem>
                  <SelectItem value="comfortable">{t('densityComfortable')}</SelectItem>
                  <SelectItem value="spacious">{t('densitySpacious')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sidebarCollapsed">{t('sidebarCollapsed')}</Label>
              <Switch
                id="sidebarCollapsed"
                checked={settings.sidebarCollapsed}
                onCheckedChange={(checked) => handleSettingChange('sidebarCollapsed', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="compactMode">{t('compactMode')}</Label>
              <Switch
                id="compactMode"
                checked={settings.compactMode}
                onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="tooltips">{t('showTooltips')}</Label>
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
              {t('formatsAndLocalization')}
            </CardTitle>
            <CardDescription>
              {t('displayFormatsConfiguration')}
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="language">{t('language')}</Label>
              <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
                  <SelectItem value="fr">{t('langFrench')}</SelectItem>
                  <SelectItem value="ln">{t('langLingala')}</SelectItem>
                  <SelectItem value="en">{t('langEnglish')}</SelectItem>
                  <SelectItem value="es">{t('langSpanish')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFormat">{t('dateFormat')}</Label>
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
              <Label htmlFor="numberFormat">{t('numberFormat')}</Label>
              <Select value={settings.numberFormat} onValueChange={(value) => handleSettingChange('numberFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white dark:bg-gray-800 border shadow-lg">
                  <SelectItem value="french">{t('numberFormatFrench')}</SelectItem>
                  <SelectItem value="english">{t('numberFormatEnglish')}</SelectItem>
                  <SelectItem value="space">{t('numberFormatSpace')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="autoSave">{t('autoSave')}</Label>
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
              {t('savingInProgress')}
            </>
          ) : (
            t('applyChanges')
          )}
        </Button>
      </div>
    </div>
  );
};

export default InterfaceSettings;