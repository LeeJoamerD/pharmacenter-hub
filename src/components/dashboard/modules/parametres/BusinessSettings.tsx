import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Building2, FileText } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

const BusinessSettings = () => {
  const { 
    settings, 
    loading, 
    saving, 
    saveSettings, 
    updateSetting, 
    updateBusinessHours 
  } = useBusinessSettings();

  const handleSave = async () => {
    await saveSettings(settings);
  };

  const handleSettingChange = (key: string, value: any) => {
    updateSetting(key as keyof typeof settings, value);
  };

  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    updateBusinessHours(day, field, value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const days = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations Légales
            </CardTitle>
            <CardDescription>
              Licences et informations réglementaires
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessType">Type d'activité</Label>
              <Select value={settings.businessType} onValueChange={(value) => handleSettingChange('businessType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pharmacy">Pharmacie</SelectItem>
                  <SelectItem value="clinic">Clinique</SelectItem>
                  <SelectItem value="hospital">Hôpital</SelectItem>
                  <SelectItem value="distributor">Distributeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Numéro de licence</Label>
              <Input
                id="licenseNumber"
                value={settings.licenseNumber}
                onChange={(e) => handleSettingChange('licenseNumber', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="licenseExpiry">Expiration licence</Label>
              <Input
                id="licenseExpiry"
                type="date"
                value={settings.licenseExpiry}
                onChange={(e) => handleSettingChange('licenseExpiry', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="regulatoryBody">Organisme de tutelle</Label>
              <Input
                id="regulatoryBody"
                value={settings.regulatoryBody}
                onChange={(e) => handleSettingChange('regulatoryBody', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taxNumber">Numéro fiscal</Label>
              <Input
                id="taxNumber"
                value={settings.taxNumber}
                onChange={(e) => handleSettingChange('taxNumber', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Facturation
            </CardTitle>
            <CardDescription>
              Configuration des documents commerciaux
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Préfixe factures</Label>
                <Input
                  id="invoicePrefix"
                  value={settings.invoicePrefix}
                  onChange={(e) => handleSettingChange('invoicePrefix', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nextInvoiceNumber">Prochain numéro</Label>
                <Input
                  id="nextInvoiceNumber"
                  type="number"
                  value={settings.nextInvoiceNumber}
                  onChange={(e) => handleSettingChange('nextInvoiceNumber', Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quotationPrefix">Préfixe devis</Label>
                <Input
                  id="quotationPrefix"
                  value={settings.quotationPrefix}
                  onChange={(e) => handleSettingChange('quotationPrefix', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nextQuotationNumber">Prochain numéro</Label>
                <Input
                  id="nextQuotationNumber"
                  type="number"
                  value={settings.nextQuotationNumber}
                  onChange={(e) => handleSettingChange('nextQuotationNumber', Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Délai de paiement (jours)</Label>
              <Input
                id="paymentTerms"
                type="number"
                value={settings.defaultPaymentTerms}
                onChange={(e) => handleSettingChange('defaultPaymentTerms', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Horaires d'Ouverture
          </CardTitle>
          <CardDescription>
            Configuration des heures de travail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {days.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4">
                <div className="w-20">
                  <Label>{label}</Label>
                </div>
                <Switch
                  checked={!settings.businessHours[key as keyof typeof settings.businessHours].closed}
                  onCheckedChange={(checked) => handleHoursChange(key, 'closed', !checked)}
                />
                {!settings.businessHours[key as keyof typeof settings.businessHours].closed && (
                  <>
                    <Input
                      type="time"
                      value={settings.businessHours[key as keyof typeof settings.businessHours].open}
                      onChange={(e) => handleHoursChange(key, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span>à</span>
                    <Input
                      type="time"
                      value={settings.businessHours[key as keyof typeof settings.businessHours].close}
                      onChange={(e) => handleHoursChange(key, 'close', e.target.value)}
                      className="w-32"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </Button>
      </div>
    </div>
  );
};

export default BusinessSettings;