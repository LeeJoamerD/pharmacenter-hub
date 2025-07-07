import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Palette,
  Layout,
  Bell,
  Globe,
  User,
  Shield,
  Zap,
  Eye,
  Volume2,
  Settings,
  Save,
  RotateCcw,
  Upload,
  Download,
  Monitor,
  Smartphone,
  Tablet,
  Sun,
  Moon,
  Contrast,
  Type,
  Languages,
  Clock,
  MessageSquare,
  Users,
  Network,
  Database
} from 'lucide-react';

interface CustomizationTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  preview: string;
}

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  sound: boolean;
  popup: boolean;
  email: boolean;
}

const NetworkChatCustomization = () => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [fontSize, setFontSize] = useState([14]);
  const [language, setLanguage] = useState('fr');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([]);
  const [layoutCompact, setLayoutCompact] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Paramètres de notifications
    const mockNotifications: NotificationSetting[] = [
      {
        id: '1',
        name: 'Messages directs',
        description: 'Notifications pour les messages privés',
        enabled: true,
        sound: true,
        popup: true,
        email: false
      },
      {
        id: '2',
        name: 'Mentions réseau',
        description: 'Quand vous êtes mentionné dans une conversation',
        enabled: true,
        sound: true,
        popup: true,
        email: true
      },
      {
        id: '3',
        name: 'Alertes système',
        description: 'Notifications système importantes',
        enabled: true,
        sound: false,
        popup: true,
        email: true
      },
      {
        id: '4',
        name: 'Collaborations',
        description: 'Invitations et mises à jour de projets',
        enabled: true,
        sound: false,
        popup: true,
        email: false
      }
    ];
    setNotificationSettings(mockNotifications);
  };

  const themes: CustomizationTheme[] = [
    {
      id: 'default',
      name: 'Défaut',
      primary: '#0ea5e9',
      secondary: '#64748b',
      accent: '#8b5cf6',
      background: '#ffffff',
      preview: 'bg-blue-500'
    },
    {
      id: 'dark',
      name: 'Sombre',
      primary: '#3b82f6',
      secondary: '#94a3b8',
      accent: '#a855f7',
      background: '#0f172a',
      preview: 'bg-gray-900'
    },
    {
      id: 'green',
      name: 'Vert Pharmacie',
      primary: '#10b981',
      secondary: '#6b7280',
      accent: '#f59e0b',
      background: '#f9fafb',
      preview: 'bg-green-500'
    },
    {
      id: 'purple',
      name: 'Violet Moderne',
      primary: '#8b5cf6',
      secondary: '#6b7280',
      accent: '#06b6d4',
      background: '#fafafa',
      preview: 'bg-purple-500'
    }
  ];

  const updateNotificationSetting = (id: string, field: string, value: boolean) => {
    setNotificationSettings(prev => 
      prev.map(setting => 
        setting.id === id 
          ? { ...setting, [field]: value }
          : setting
      )
    );
  };

  const saveSettings = () => {
    // Sauvegarder les paramètres
    console.log('Paramètres sauvegardés:', {
      theme: currentTheme,
      fontSize: fontSize[0],
      language,
      notifications: notificationSettings,
      layoutCompact,
      animationsEnabled,
      autoSave
    });
  };

  const resetSettings = () => {
    setCurrentTheme('default');
    setFontSize([14]);
    setLanguage('fr');
    setLayoutCompact(false);
    setAnimationsEnabled(true);
    setAutoSave(true);
    loadSettings();
  };

  return (
    <div className="space-y-6">
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
          <Button variant="outline" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={saveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
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
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Thèmes
                </CardTitle>
                <CardDescription>
                  Choisissez le thème de couleur pour l'interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {themes.map((theme) => (
                    <div 
                      key={theme.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        currentTheme === theme.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setCurrentTheme(theme.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-6 h-6 rounded-full ${theme.preview}`}></div>
                        <span className="font-medium">{theme.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondary }}></div>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }}></div>
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
                {notificationSettings.map((setting) => (
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
                ))}
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
                  <Select defaultValue="high">
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
                    <Button variant="outline" size="sm">
                      <Monitor className="h-4 w-4 mr-2" />
                      Bureau
                    </Button>
                    <Button variant="outline" size="sm">
                      <Tablet className="h-4 w-4 mr-2" />
                      Tablette
                    </Button>
                    <Button variant="outline" size="sm">
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
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Focus clavier</Label>
                    <p className="text-sm text-muted-foreground">Afficher les indicateurs de focus</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Lecteur d'écran</Label>
                    <p className="text-sm text-muted-foreground">Optimiser pour les lecteurs d'écran</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Réduction mouvement</Label>
                    <p className="text-sm text-muted-foreground">Réduire les animations</p>
                  </div>
                  <Switch />
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
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Vider cache
                    </Button>
                    <Button variant="outline" size="sm">
                      <Database className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Import/Export</Label>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                    <Button variant="outline" size="sm">
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
                  <Select defaultValue="30">
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
                    <Switch defaultChecked />
                    <span className="text-sm text-muted-foreground">3 tentatives max</span>
                  </div>
                </div>

                <div>
                  <Label>Mode hors ligne</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch />
                    <span className="text-sm text-muted-foreground">Fonctionnement en local</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkChatCustomization;