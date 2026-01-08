import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Building, Globe, MapPin, Phone, Mail, Loader2, Save, AlertCircle, CheckCircle2, Settings, DollarSign } from 'lucide-react';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const GeneralSettings = () => {
  const { t } = useLanguage();
  const { settings, loading, saving, saveSettings, getCurrentCurrency, getCurrentTimezone, getCurrentLanguage } = useGlobalSystemSettings();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<any>(null);

  // Initialiser les données du formulaire quand les settings sont chargés
  useEffect(() => {
    if (settings && !formData) {
      setFormData({ ...settings });
      setHasChanges(false);
    }
  }, [settings, formData]);

  // Validation des champs
  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'name':
        return !value || value.trim().length < 2 ? t('nameMinChars') : null;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return value && !emailRegex.test(value) ? t('invalidEmailFormat') : null;
      case 'taux_tva':
        return value < 0 || value > 100 ? t('vatRateRange') : null;
      case 'taux_centime_additionnel':
        return value < 0 || value > 100 ? t('additionalCentRateRange') : null;
      case 'telephone_appel':
        return value && value.length > 0 && value.length < 8 ? t('phoneTooShort') : null;
      default:
        return null;
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    if (!formData) return;
    
    // Validation en temps réel
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));

    // Mettre à jour seulement l'état local du formulaire
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!formData || !settings) return;

    // Validation complète avant sauvegarde
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, (formData as any)[field]);
      if (error) errors[field] = error;
    });

    if (Object.keys(errors).some(key => errors[key])) {
      setValidationErrors(errors);
      toast({
        title: t('validationErrors'),
        description: t('pleaseCorrectErrors'),
        variant: "destructive",
      });
      return;
    }

    try {
      // Sauvegarder les données du formulaire
      await saveSettings(formData);
      setHasChanges(false);
      setValidationErrors({});
      toast({
        title: t('settingsSaved'),
        description: t('settingsUpdatedSuccess'),
      });
    } catch (error: any) {
      const errorMessage = error?.message || t('saveError');
      
      if (errorMessage.includes('pharmacy') || errorMessage.includes('RLS')) {
        toast({
          title: t('partialSave'),
          description: t('pharmacyInfoNotUpdated'),
          variant: "default",
        });
        setHasChanges(false);
      } else {
        toast({
          title: t('saveError'),
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('loadingSystemSettings')}</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">{t('unableToLoadSettings')}</p>
        <p className="text-sm text-muted-foreground">{t('refreshPageOrContact')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* État actuel des paramètres */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          {t('pharmacyConfiguration')} <strong>{settings.name}</strong>. 
          {hasChanges && (
            <span className="block mt-2 text-orange-600 font-medium">
              ⚠️ {t('unsavedChanges')}
            </span>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informations Pharmacie */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              {t('pharmacyInfo')}
            </CardTitle>
            <CardDescription>
              {t('pharmacyMainData')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                {t('pharmacyName')} *
              </Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Pharmacie du Centre"
                className={validationErrors.name ? 'border-red-500' : ''}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500">{validationErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('pharmacyCode')}
              </Label>
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Ex: PH001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('fullAddress')}
              </Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                placeholder="Adresse détaillée de la pharmacie..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t('city')}</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Ex: Douala"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">{t('region')}</Label>
                <Input
                  id="region"
                  value={formData.region || ''}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  placeholder="Ex: Littoral"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="telephone_appel" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('mainPhone')}
              </Label>
              <Input
                id="telephone_appel"
                type="tel"
                value={formData.telephone_appel || ''}
                onChange={(e) => handleInputChange('telephone_appel', e.target.value)}
                placeholder="+237 XXX XXX XXX"
                className={validationErrors.telephone_appel ? 'border-red-500' : ''}
              />
              {validationErrors.telephone_appel && (
                <p className="text-sm text-red-500">{validationErrors.telephone_appel}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('professionalEmail')}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@pharmacie.com"
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Paramètres Système */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t('systemSettings')}
            </CardTitle>
            <CardDescription>
              {t('regionalConfiguration')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default_currency" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t('defaultCurrency')}
              </Label>
              <Select 
                value={formData.default_currency || ''} 
                onValueChange={(value) => handleInputChange('default_currency', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectCurrency')} />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-[300px] overflow-y-auto bg-popover text-popover-foreground border shadow-lg">
                  {settings.currencies_available.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.symbol}</span>
                        <span>{currency.name} ({currency.code})</span>
                        <span className="text-xs text-muted-foreground">
                          {currency.countries.slice(0, 2).join(', ')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('currentCurrency')}: <strong>{getCurrentCurrency()?.name || t('notDefined')}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default_timezone" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t('timezone')}
              </Label>
              <Select 
                value={formData.default_timezone || ''} 
                onValueChange={(value) => handleInputChange('default_timezone', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectTimezone')} />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-[300px] overflow-y-auto bg-popover text-popover-foreground border shadow-lg">
                  {settings.timezones_available.map((timezone) => (
                    <SelectItem key={timezone.code} value={timezone.code}>
                      <div className="flex flex-col">
                        <span>{timezone.name}</span>
                        <span className="text-xs text-muted-foreground">{timezone.region} • {timezone.offset}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('currentTimezone')}: <strong>{getCurrentTimezone()?.name || t('notDefined')}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default_language">{t('interfaceLanguage')}</Label>
              <Select 
                value={formData.default_language || ''} 
                onValueChange={(value) => {
                  handleInputChange('default_language', value);
                  handleInputChange('default_lingual', value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-[300px] overflow-y-auto bg-popover text-popover-foreground border shadow-lg">
                  {settings.languages_available.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      <div className="flex items-center gap-2">
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                        <span className="text-xs text-muted-foreground">({language.native_name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('currentLanguage')}: <strong>{getCurrentLanguage()?.name || t('notDefined')}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Fiscale et Comptable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {t('fiscalAccountingConfig')}
          </CardTitle>
          <CardDescription>
            {t('taxationSettings')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fiscal_year">{t('fiscalYear')}</Label>
              <Input
                id="fiscal_year"
                value={formData.fiscal_year || ''}
                onChange={(e) => handleInputChange('fiscal_year', e.target.value)}
                placeholder="2024"
              />
              <p className="text-xs text-muted-foreground">
                {t('fiscalYearRef')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taux_tva">{t('vatRate')} (%)</Label>
              <Input
                id="taux_tva"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.taux_tva || 0}
                onChange={(e) => handleInputChange('taux_tva', Number(e.target.value))}
                className={validationErrors.taux_tva ? 'border-red-500' : ''}
              />
              {validationErrors.taux_tva && (
                <p className="text-sm text-red-500">{validationErrors.taux_tva}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('standardRate')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taux_centime_additionnel">{t('additionalCentRate')} (%)</Label>
              <Input
                id="taux_centime_additionnel"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.taux_centime_additionnel || 0}
                onChange={(e) => handleInputChange('taux_centime_additionnel', Number(e.target.value))}
                className={validationErrors.taux_centime_additionnel ? 'border-red-500' : ''}
              />
              {validationErrors.taux_centime_additionnel && (
                <p className="text-sm text-red-500">{validationErrors.taux_centime_additionnel}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('additionalTaxRate')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {!hasChanges && (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{t('allSettingsSaved')}</span>
            </>
          )}
          {hasChanges && (
            <>
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span>{t('pendingChanges')}</span>
            </>
          )}
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={saving || !hasChanges || Object.values(validationErrors).some(error => error)}
          size="lg"
          className="min-w-[200px]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('savingInProgress')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('saveSettings')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettings;
