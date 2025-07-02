import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Building2, FileText, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BusinessSettings = () => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    businessType: 'pharmacy',
    licenseNumber: 'PHARM-CI-2024-001',
    licenseExpiry: '2025-12-31',
    regulatoryBody: 'Ordre des Pharmaciens de Côte d\'Ivoire',
    taxNumber: 'CI-TAX-123456789',
    socialSecurityNumber: 'CNPS-987654321',
    businessHours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '14:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    },
    invoicePrefix: 'FACT',
    quotationPrefix: 'DEVIS',
    nextInvoiceNumber: 1001,
    nextQuotationNumber: 501,
    defaultPaymentTerms: '30',
    acceptedPaymentMethods: ['cash', 'card', 'mobile', 'check'],
    emergencyContact: '+225 0789123456',
    emergencyService: true,
    deliveryService: false,
    onlineOrdering: false
  });

  const handleSave = () => {
    toast({
      title: "Paramètres métiers sauvegardés",
      description: "La configuration métier a été mise à jour.",
    });
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day as keyof typeof prev.businessHours],
          [field]: value
        }
      }
    }));
  };

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
        <Button onClick={handleSave}>
          Sauvegarder la configuration
        </Button>
      </div>
    </div>
  );
};

export default BusinessSettings;