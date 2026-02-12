import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Key, 
  Mail, 
  Phone, 
  Save, 
  Loader2, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Pill
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  is_secret: boolean;
}

export function PlatformConfiguration() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      setSettings(data || []);
      const initialValues: Record<string, string> = {};
      data?.forEach(s => {
        initialValues[s.setting_key] = s.setting_value || '';
      });
      setEditedValues(initialValues);
    } catch (error: any) {
      console.error('Erreur chargement paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(editedValues).map(([key, value]) => {
        const setting = settings.find(s => s.setting_key === key);
        if (setting) {
          return supabase
            .from('platform_settings')
            .update({ setting_value: value || null })
            .eq('id', setting.id);
        }
        return null;
      }).filter(Boolean);

      await Promise.all(updates);

      toast({
        title: "Paramètres enregistrés",
        description: "Les modifications ont été sauvegardées",
      });

      fetchSettings();
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    return settings.some(s => 
      (s.setting_value || '') !== (editedValues[s.setting_key] || '')
    );
  };

  const getSettingIcon = (key: string) => {
    if (key.includes('RESEND')) return <Mail className="h-5 w-5" />;
    if (key.includes('TWILIO')) return <Phone className="h-5 w-5" />;
    return <Key className="h-5 w-5" />;
  };

  const isConfigured = (key: string) => {
    return Boolean(editedValues[key]);
  };

  const handleClearField = (key: string) => {
    setEditedValues(prev => ({ ...prev, [key]: '' }));
  };

  // Grouper les paramètres
  const emailSettings = settings.filter(s => s.setting_key.includes('RESEND'));
  const smsSettings = settings.filter(s => s.setting_key.includes('TWILIO'));
  const vidalSettings = settings.filter(s => s.setting_key.startsWith('VIDAL_'));
  const otherSettings = settings.filter(s => 
    !s.setting_key.includes('RESEND') && !s.setting_key.includes('TWILIO') && !s.setting_key.startsWith('VIDAL_')
  );

  const isVidalConfigured = vidalSettings.length > 0 && vidalSettings.every(s => isConfigured(s.setting_key));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderSettingInput = (setting: PlatformSetting) => {
    const isSecret = setting.is_secret;
    const showValue = showSecrets[setting.setting_key];

    return (
      <div key={setting.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
            {setting.setting_key}
            {isSecret && (
              <Badge variant="outline" className="text-xs">
                Secret
              </Badge>
            )}
          </Label>
          {isConfigured(setting.setting_key) ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <div className="relative">
          <Input
            id={setting.setting_key}
            type={isSecret && !showValue ? 'password' : 'text'}
            value={editedValues[setting.setting_key] || ''}
            onChange={e => setEditedValues(prev => ({
              ...prev,
              [setting.setting_key]: e.target.value
            }))}
            placeholder={setting.description || ''}
            className="pr-10"
          />
          {isSecret && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowSecrets(prev => ({
                ...prev,
                [setting.setting_key]: !prev[setting.setting_key]
              }))}
            >
              {showValue ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>
      {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
      </div>
    );
  };

  const renderSettingInputWithDelete = (setting: PlatformSetting) => {
    const isSecret = setting.is_secret;
    const showValue = showSecrets[setting.setting_key];

    return (
      <div key={setting.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
            {setting.setting_key}
            {isSecret && (
              <Badge variant="outline" className="text-xs">
                Secret
              </Badge>
            )}
          </Label>
          <div className="flex items-center gap-2">
            {isConfigured(setting.setting_key) ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleClearField(setting.setting_key)}
              title="Supprimer la valeur"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Input
            id={setting.setting_key}
            type={isSecret && !showValue ? 'password' : 'text'}
            value={editedValues[setting.setting_key] || ''}
            onChange={e => setEditedValues(prev => ({
              ...prev,
              [setting.setting_key]: e.target.value
            }))}
            placeholder={setting.description || ''}
            className="pr-10"
          />
          {isSecret && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowSecrets(prev => ({
                ...prev,
                [setting.setting_key]: !prev[setting.setting_key]
              }))}
            >
              {showValue ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuration de la Plateforme
          </h1>
          <p className="text-muted-foreground">
            Gérez les clés API et les paramètres système
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges() || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="communications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="vidal" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Base VIDAL
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="communications" className="space-y-6">
          {/* Configuration Email (Resend) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Configuration Email (Resend)</CardTitle>
                    <CardDescription>
                      API pour l'envoi des codes de vérification par email
                    </CardDescription>
                  </div>
                </div>
                <a 
                  href="https://resend.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Obtenir une clé <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailSettings.map(renderSettingInput)}
            </CardContent>
          </Card>

          {/* Configuration SMS (Twilio) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Phone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Configuration SMS (Twilio)</CardTitle>
                    <CardDescription>
                      API pour l'envoi des codes de vérification par SMS
                    </CardDescription>
                  </div>
                </div>
                <a 
                  href="https://console.twilio.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Console Twilio <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {smsSettings.map(renderSettingInput)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vidal" className="space-y-6">
          {vidalSettings.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <Pill className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Base Médicamenteuse VIDAL</CardTitle>
                      <CardDescription>
                        Clés API et identifiants pour l'accès à la base VIDAL
                      </CardDescription>
                    </div>
                  </div>
                  <a 
                    href="https://support-editeur.vidal.fr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Documentation VIDAL <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vidalSettings.map(renderSettingInputWithDelete)}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          {otherSettings.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Paramètres Généraux</CardTitle>
                    <CardDescription>
                      Configuration des codes de vérification
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {otherSettings.map(renderSettingInput)}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Status global */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">État de la Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5" />
              <div>
                <p className="font-medium">Vérification Email</p>
                <p className="text-sm text-muted-foreground">
                  {isConfigured('RESEND_API_KEY') ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Configuré
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Non configuré
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Phone className="h-5 w-5" />
              <div>
                <p className="font-medium">Vérification SMS</p>
                <p className="text-sm text-muted-foreground">
                  {isConfigured('TWILIO_ACCOUNT_SID') && 
                   isConfigured('TWILIO_AUTH_TOKEN') && 
                   isConfigured('TWILIO_PHONE_NUMBER') ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Configuré
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Configuration incomplète
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Pill className="h-5 w-5" />
              <div>
                <p className="font-medium">Base VIDAL</p>
                <p className="text-sm text-muted-foreground">
                  {isVidalConfigured ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Configuré
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Configuration incomplète
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
