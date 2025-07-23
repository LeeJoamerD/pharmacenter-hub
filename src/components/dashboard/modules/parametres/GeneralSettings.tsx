import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Building, Globe, MapPin, Phone, Mail, Loader2 } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const GeneralSettings = () => {
  const { settings, loading, saving, saveSettings, updateSettings } = useSystemSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des paramètres...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8">
        <p>Impossible de charger les paramètres système.</p>
      </div>
    );
  }

  const handleSave = () => {
    saveSettings(settings);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    updateSettings({ [field]: value } as any);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informations Entreprise
            </CardTitle>
            <CardDescription>
              Paramètres de base de votre entreprise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la pharmacie</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Code pharmacie</Label>
              <Input
                id="code"
                value={settings.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telephone_appel">Téléphone</Label>
              <Input
                id="telephone_appel"
                type="tel"
                value={settings.telephone_appel}
                onChange={(e) => handleInputChange('telephone_appel', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={settings.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Paramètres Système
            </CardTitle>
            <CardDescription>
              Configuration générale du système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default_currency">Devise</Label>
              <Select value={settings.default_currency} onValueChange={(value) => handleInputChange('default_currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.currencies_available.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.name} ({currency.code}) - {currency.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default_timezone">Fuseau horaire</Label>
              <Select value={settings.default_timezone} onValueChange={(value) => handleInputChange('default_timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.timezones_available.map((timezone) => (
                    <SelectItem key={timezone.code} value={timezone.code}>
                      {timezone.name} - {timezone.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default_language">Langue</Label>
              <Select value={settings.default_language} onValueChange={(value) => handleInputChange('default_language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.languages_available.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.flag} {language.name} ({language.native_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fiscal_year">Année fiscale</Label>
              <Input
                id="fiscal_year"
                value={settings.fiscal_year}
                onChange={(e) => handleInputChange('fiscal_year', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taux_tva">Taux de TVA (%)</Label>
              <Input
                id="taux_tva"
                type="number"
                step="0.01"
                value={settings.taux_tva}
                onChange={(e) => handleInputChange('taux_tva', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taux_centime_additionnel">Taux de Centime additionnel (%)</Label>
              <Input
                id="taux_centime_additionnel"
                type="number"
                step="0.01"
                value={settings.taux_centime_additionnel}
                onChange={(e) => handleInputChange('taux_centime_additionnel', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Sauvegarder les paramètres'
          )}
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettings;