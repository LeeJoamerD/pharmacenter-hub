import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Building, Globe, MapPin, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GeneralSettings = () => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    companyName: 'PharmaSoft SARL',
    businessNumber: 'CI-ABJ-2024-001',
    address: 'Abidjan, Cocody Riviera',
    phone: '+225 0123456789',
    email: 'contact@pharmasoft.ci',
    website: 'www.pharmasoft.ci',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    language: 'fr',
    fiscalYear: '2024',
    taxRate: 18,
    enableMultiSite: false,
    enableNotifications: true,
    description: 'Logiciel de gestion pharmaceutique complet'
  });

  const handleSave = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Les paramètres généraux ont été mis à jour avec succès.",
    });
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
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
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessNumber">Numéro d'entreprise</Label>
              <Input
                id="businessNumber"
                value={settings.businessNumber}
                onChange={(e) => handleInputChange('businessNumber', e.target.value)}
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
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={settings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
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
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
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
              <Label htmlFor="currency">Devise</Label>
              <Select value={settings.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">Franc CFA (XOF)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="USD">Dollar US (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select value={settings.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Abidjan">Abidjan (GMT+0)</SelectItem>
                  <SelectItem value="Africa/Casablanca">Casablanca (GMT+1)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Select value={settings.language} onValueChange={(value) => handleInputChange('language', value)}>
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
              <Label htmlFor="fiscalYear">Année fiscale</Label>
              <Input
                id="fiscalYear"
                value={settings.fiscalYear}
                onChange={(e) => handleInputChange('fiscalYear', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taxRate">Taux de TVA (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={settings.taxRate}
                onChange={(e) => handleInputChange('taxRate', Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="multiSite">Multi-sites</Label>
              <Switch
                id="multiSite"
                checked={settings.enableMultiSite}
                onCheckedChange={(checked) => handleInputChange('enableMultiSite', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Notifications</Label>
              <Switch
                id="notifications"
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => handleInputChange('enableNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>
            Description de votre entreprise ou application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            placeholder="Décrivez votre entreprise..."
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettings;