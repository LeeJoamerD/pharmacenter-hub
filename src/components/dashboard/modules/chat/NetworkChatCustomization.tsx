import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Palette,
  Layout,
  Bell,
  Eye,
  Settings,
  Save,
  RotateCcw,
  Upload,
  Download,
  Monitor,
  Smartphone,
  Tablet,
  Type,
  Network,
  Database,
  Plus,
  RefreshCw,
  Users,
  Zap,
  Globe
} from 'lucide-react';
import { useNetworkChatCustomization } from '@/hooks/useNetworkChatCustomization';
import { CreateThemeDialog } from './dialogs/CreateThemeDialog';
import { ExportSettingsDialog } from './dialogs/ExportSettingsDialog';
import { ImportSettingsDialog } from './dialogs/ImportSettingsDialog';
import { toast } from 'sonner';

const NetworkChatCustomization = () => {
  const {
    loading,
    saving,
    preferences,
    notificationSettings,
    themes,
    metrics,
    savePreferences,
    updateNotificationSetting,
    createTheme,
    resetAllSettings,
    exportSettings,
    importSettings,
    clearLocalCache,
    refreshAllData
  } = useNetworkChatCustomization();

  // Local state for form
  const [currentTheme, setCurrentTheme] = useState('default');
  const [fontSize, setFontSize] = useState([14]);
  const [language, setLanguage] = useState('fr');
  const [layoutCompact, setLayoutCompact] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [displayQuality, setDisplayQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [highContrast, setHighContrast] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(true);
  const [screenReader, setScreenReader] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState('30');
  const [autoRetry, setAutoRetry] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  // Dialogs
  const [createThemeOpen, setCreateThemeOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Sync local state with database preferences
  useEffect(() => {
    if (preferences) {
      setCurrentTheme(preferences.theme_id);
      setFontSize([preferences.font_size]);
      setLanguage(preferences.language);
      setLayoutCompact(preferences.layout_compact);
      setAnimationsEnabled(preferences.animations_enabled);
      setAutoSave(preferences.auto_save);
      setDisplayQuality(preferences.display_quality as any);
      setDeviceMode(preferences.device_mode as any);
      setHighContrast(preferences.high_contrast);
      setKeyboardFocus(preferences.keyboard_focus);
      setScreenReader(preferences.screen_reader);
      setReducedMotion(preferences.reduced_motion);
      setConnectionTimeout(String(preferences.connection_timeout));
      setAutoRetry(preferences.auto_retry);
      setOfflineMode(preferences.offline_mode);
    }
  }, [preferences]);

  const handleSaveSettings = () => {
    savePreferences({
      theme_id: currentTheme,
      font_size: fontSize[0],
      language,
      layout_compact: layoutCompact,
      animations_enabled: animationsEnabled,
      auto_save: autoSave,
      display_quality: displayQuality,
      device_mode: deviceMode,
      high_contrast: highContrast,
      keyboard_focus: keyboardFocus,
      screen_reader: screenReader,
      reduced_motion: reducedMotion,
      connection_timeout: parseInt(connectionTimeout),
      auto_retry: autoRetry,
      offline_mode: offlineMode
    });
  };

  const handleResetSettings = async () => {
    await resetAllSettings();
    // Reset local state to defaults
    setCurrentTheme('default');
    setFontSize([14]);
    setLanguage('fr');
    setLayoutCompact(false);
    setAnimationsEnabled(true);
    setAutoSave(true);
    setDisplayQuality('high');
    setDeviceMode('desktop');
    setHighContrast(false);
    setKeyboardFocus(true);
    setScreenReader(false);
    setReducedMotion(false);
    setConnectionTimeout('30');
    setAutoRetry(true);
    setOfflineMode(false);
  };

  const handleCreateTheme = (theme: any) => {
    createTheme(theme);
  };

  const getExportData = () => ({
    preferences: preferences ? {
      theme_id: currentTheme,
      font_size: fontSize[0],
      language,
      layout_compact: layoutCompact,
      animations_enabled: animationsEnabled,
      auto_save: autoSave,
      display_quality: displayQuality,
      device_mode: deviceMode,
      high_contrast: highContrast,
      keyboard_focus: keyboardFocus,
      screen_reader: screenReader,
      reduced_motion: reducedMotion,
      connection_timeout: parseInt(connectionTimeout),
      auto_retry: autoRetry,
      offline_mode: offlineMode
    } : null,
    notifications: notificationSettings.map(n => ({
      name: n.name,
      notification_type: n.notification_type,
      enabled: n.enabled,
      sound: n.sound,
      popup: n.popup,
      email: n.email
    })),
    exportedAt: new Date().toISOString()
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="h-8 w-8 text-primary" />
            Personnalisation Réseau
          </h1>
          <p className="text-muted-foreground">
            Personnalisez l'interface et l'expérience utilisateur du réseau multi-officines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refreshAllData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleResetSettings} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs configurés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_users_with_preferences || 0}</div>
            <p className="text-xs text-muted-foreground">Avec préférences personnalisées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thème populaire</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{metrics?.most_used_theme || 'Défaut'}</div>
            <p className="text-xs text-muted-foreground">Le plus utilisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications actives</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.notifications_enabled_count || 0}</div>
            <p className="text-xs text-muted-foreground">Paramètres activés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thèmes disponibles</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{themes.length}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.accessibility_features_active || 0} a11y actifs
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="interface">Interface</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibilité</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
        </TabsList>

        {/* Apparence */}
        <TabsContent value="appearance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Thèmes
                    </CardTitle>
                    <CardDescription>
                      Choisissez le thème de couleur pour l'interface
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCreateThemeOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {themes.map((theme) => (
                    <div 
                      key={theme.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        currentTheme === theme.theme_id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setCurrentTheme(theme.theme_id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: theme.primary_color }}
                        />
                        <span className="font-medium">{theme.name}</span>
                        {theme.is_network_shared && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            Réseau
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary_color }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondary_color }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent_color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Typographie
                </CardTitle>
                <CardDescription>
                  Ajustez la taille et le style du texte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Taille de police</Label>
                  <div className="mt-2">
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      max={20}
                      min={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Petit (10px)</span>
                      <span>Actuel: {fontSize[0]}px</span>
                      <span>Grand (20px)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Langue</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Paramètres de Notifications
              </CardTitle>
              <CardDescription>
                Configurez comment et quand recevoir les notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {notificationSettings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Chargement des paramètres de notifications...
                  </p>
                ) : (
                  notificationSettings.map((setting) => (
                    <div key={setting.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{setting.name}</h4>
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        </div>
                        <Switch
                          checked={setting.enabled}
                          onCheckedChange={(checked) => updateNotificationSetting(setting.id, 'enabled', checked)}
                        />
                      </div>
                      
                      {setting.enabled && (
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Son</Label>
                            <Switch
                              checked={setting.sound}
                              onCheckedChange={(checked) => updateNotificationSetting(setting.id, 'sound', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Pop-up</Label>
                            <Switch
                              checked={setting.popup}
                              onCheckedChange={(checked) => updateNotificationSetting(setting.id, 'popup', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Email</Label>
                            <Switch
                              checked={setting.email}
                              onCheckedChange={(checked) => updateNotificationSetting(setting.id, 'email', checked)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interface */}
        <TabsContent value="interface" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Disposition
                </CardTitle>
                <CardDescription>
                  Personnalisez la disposition de l'interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mode compact</Label>
                    <p className="text-sm text-muted-foreground">Réduire l'espacement entre les éléments</p>
                  </div>
                  <Switch checked={layoutCompact} onCheckedChange={setLayoutCompact} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Animations</Label>
                    <p className="text-sm text-muted-foreground">Activer les transitions animées</p>
                  </div>
                  <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sauvegarde automatique</Label>
                    <p className="text-sm text-muted-foreground">Sauvegarder automatiquement les paramètres</p>
                  </div>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Affichage
                </CardTitle>
                <CardDescription>
                  Paramètres d'affichage et de performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Qualité d'affichage</Label>
                  <Select value={displayQuality} onValueChange={(v) => setDisplayQuality(v as any)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse (Performance)</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute (Qualité)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Adaptation écran</Label>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant={deviceMode === 'desktop' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDeviceMode('desktop')}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Bureau
                    </Button>
                    <Button 
                      variant={deviceMode === 'tablet' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDeviceMode('tablet')}
                    >
                      <Tablet className="h-4 w-4 mr-2" />
                      Tablette
                    </Button>
                    <Button 
                      variant={deviceMode === 'mobile' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDeviceMode('mobile')}
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Mobile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accessibilité */}
        <TabsContent value="accessibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Accessibilité
              </CardTitle>
              <CardDescription>
                Options pour améliorer l'accessibilité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Contraste élevé</Label>
                    <p className="text-sm text-muted-foreground">Améliorer la lisibilité</p>
                  </div>
                  <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Focus clavier</Label>
                    <p className="text-sm text-muted-foreground">Afficher les indicateurs de focus</p>
                  </div>
                  <Switch checked={keyboardFocus} onCheckedChange={setKeyboardFocus} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Lecteur d'écran</Label>
                    <p className="text-sm text-muted-foreground">Optimiser pour les lecteurs d'écran</p>
                  </div>
                  <Switch checked={screenReader} onCheckedChange={setScreenReader} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Réduction mouvement</Label>
                    <p className="text-sm text-muted-foreground">Réduire les animations</p>
                  </div>
                  <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avancé */}
        <TabsContent value="advanced" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres Avancés
                </CardTitle>
                <CardDescription>
                  Configuration technique et personnalisation avancée
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cache local</Label>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={clearLocalCache}>
                      <Download className="h-4 w-4 mr-2" />
                      Vider cache
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleResetSettings}>
                      <Database className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Import/Export</Label>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Réseau
                </CardTitle>
                <CardDescription>
                  Paramètres de connexion réseau
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Délai de connexion</Label>
                  <Select value={connectionTimeout} onValueChange={setConnectionTimeout}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 secondes</SelectItem>
                      <SelectItem value="30">30 secondes</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Retry automatique</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch checked={autoRetry} onCheckedChange={setAutoRetry} />
                    <span className="text-sm text-muted-foreground">3 tentatives max</span>
                  </div>
                </div>

                <div>
                  <Label>Mode hors ligne</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch checked={offlineMode} onCheckedChange={setOfflineMode} />
                    <span className="text-sm text-muted-foreground">Fonctionnement en local</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateThemeDialog
        open={createThemeOpen}
        onOpenChange={setCreateThemeOpen}
        onCreateTheme={handleCreateTheme}
      />

      <ExportSettingsDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        exportData={getExportData()}
      />

      <ImportSettingsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportSettings={importSettings}
      />
    </div>
  );
};

export default NetworkChatCustomization;
