
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

interface BusinessSettings {
  businessType: string;
  licenseNumber: string;
  licenseExpiry: string;
  regulatoryBody: string;
  taxNumber: string;
  socialSecurityNumber: string;
  businessHours: BusinessHours;
  invoicePrefix: string;
  quotationPrefix: string;
  nextInvoiceNumber: number;
  nextQuotationNumber: number;
  defaultPaymentTerms: string;
  acceptedPaymentMethods: string[];
  emergencyContact: string;
  emergencyService: boolean;
  deliveryService: boolean;
  onlineOrdering: boolean;
}

const DEFAULT_SETTINGS: BusinessSettings = {
  businessType: 'pharmacy',
  licenseNumber: '',
  licenseExpiry: '',
  regulatoryBody: 'Ordre des Pharmaciens de Côte d\'Ivoire',
  taxNumber: '',
  socialSecurityNumber: '',
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
  emergencyContact: '',
  emergencyService: true,
  deliveryService: false,
  onlineOrdering: false
};

export const useBusinessSettings = () => {
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { pharmacy } = useAuth();
  const { toast } = useToast();

  const loadSettings = async () => {
    if (!pharmacy?.id) {
      console.log('useBusinessSettings: Waiting for pharmacy.id...', { pharmacy });
      return;
    }

    console.log('useBusinessSettings: Loading settings for tenant:', pharmacy.id);
    setLoading(true);

    try {
      // Load from parametres_systeme table
      const { data: systemParams, error: systemError } = await supabase
        .from('parametres_systeme')
        .select('*')
        .eq('tenant_id', pharmacy.id)
        .eq('categorie', 'business');

      if (systemError) {
        console.error('Error loading business system parameters:', systemError);
        throw systemError;
      }

      // Load pharmacy-specific data (tax number from niu field)
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('niu, telephone_appel')
        .eq('id', pharmacy.id)
        .single();

      if (pharmacyError) {
        console.error('Error loading pharmacy data:', pharmacyError);
        throw pharmacyError;
      }

      console.log('useBusinessSettings: Loaded data:', { systemParams, pharmacyData });

      // Parse system parameters into settings
      const loadedSettings = { ...DEFAULT_SETTINGS };
      
      if (pharmacyData) {
        loadedSettings.taxNumber = pharmacyData.niu || '';
        loadedSettings.emergencyContact = pharmacyData.telephone_appel || '';
      }

      systemParams?.forEach((param) => {
        const key = param.cle_parametre;
        let value = param.valeur_parametre;

        // Parse JSON values
        if (key === 'business_hours' || key === 'accepted_payment_methods') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.warn(`Failed to parse JSON for ${key}:`, value);
          }
        }

        // Map database keys to settings keys
        switch (key) {
          case 'business_type':
            loadedSettings.businessType = value;
            break;
          case 'license_number':
            loadedSettings.licenseNumber = value;
            break;
          case 'license_expiry':
            loadedSettings.licenseExpiry = value;
            break;
          case 'regulatory_body':
            loadedSettings.regulatoryBody = value;
            break;
          case 'social_security_number':
            loadedSettings.socialSecurityNumber = value;
            break;
          case 'business_hours':
            if (value && typeof value === 'object') {
              loadedSettings.businessHours = value;
            }
            break;
          case 'invoice_prefix':
            loadedSettings.invoicePrefix = value;
            break;
          case 'quotation_prefix':
            loadedSettings.quotationPrefix = value;
            break;
          case 'next_invoice_number':
            loadedSettings.nextInvoiceNumber = parseInt(value) || DEFAULT_SETTINGS.nextInvoiceNumber;
            break;
          case 'next_quotation_number':
            loadedSettings.nextQuotationNumber = parseInt(value) || DEFAULT_SETTINGS.nextQuotationNumber;
            break;
          case 'default_payment_terms':
            loadedSettings.defaultPaymentTerms = value;
            break;
          case 'accepted_payment_methods':
            if (Array.isArray(value)) {
              loadedSettings.acceptedPaymentMethods = value;
            }
            break;
          case 'emergency_service':
            loadedSettings.emergencyService = value === 'true';
            break;
          case 'delivery_service':
            loadedSettings.deliveryService = value === 'true';
            break;
          case 'online_ordering':
            loadedSettings.onlineOrdering = value === 'true';
            break;
        }
      });

      setSettings(loadedSettings);
      console.log('useBusinessSettings: Settings loaded successfully:', loadedSettings);

    } catch (error) {
      console.error('Error loading business settings:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les paramètres métiers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsToSave: BusinessSettings) => {
    if (!pharmacy?.id) {
      console.error('useBusinessSettings: No pharmacy.id for saving');
      return;
    }

    console.log('useBusinessSettings: Saving settings for tenant:', pharmacy.id, settingsToSave);
    setSaving(true);

    try {
      // Prepare system parameters to upsert
      const systemParams = [
        { cle_parametre: 'business_type', valeur_parametre: settingsToSave.businessType },
        { cle_parametre: 'license_number', valeur_parametre: settingsToSave.licenseNumber },
        { cle_parametre: 'license_expiry', valeur_parametre: settingsToSave.licenseExpiry },
        { cle_parametre: 'regulatory_body', valeur_parametre: settingsToSave.regulatoryBody },
        { cle_parametre: 'social_security_number', valeur_parametre: settingsToSave.socialSecurityNumber },
        { cle_parametre: 'business_hours', valeur_parametre: JSON.stringify(settingsToSave.businessHours) },
        { cle_parametre: 'invoice_prefix', valeur_parametre: settingsToSave.invoicePrefix },
        { cle_parametre: 'quotation_prefix', valeur_parametre: settingsToSave.quotationPrefix },
        { cle_parametre: 'next_invoice_number', valeur_parametre: settingsToSave.nextInvoiceNumber.toString() },
        { cle_parametre: 'next_quotation_number', valeur_parametre: settingsToSave.nextQuotationNumber.toString() },
        { cle_parametre: 'default_payment_terms', valeur_parametre: settingsToSave.defaultPaymentTerms },
        { cle_parametre: 'accepted_payment_methods', valeur_parametre: JSON.stringify(settingsToSave.acceptedPaymentMethods) },
        { cle_parametre: 'emergency_service', valeur_parametre: settingsToSave.emergencyService.toString() },
        { cle_parametre: 'delivery_service', valeur_parametre: settingsToSave.deliveryService.toString() },
        { cle_parametre: 'online_ordering', valeur_parametre: settingsToSave.onlineOrdering.toString() },
      ];

      // Upsert system parameters using the specific constraint name
      for (const param of systemParams) {
        const { error } = await supabase
          .from('parametres_systeme')
          .upsert({
            tenant_id: pharmacy.id,
            categorie: 'business',
            type_parametre: 'string',
            ...param,
          }, {
            onConflict: 'unique_tenant_cle_parametre'
          });

        if (error) {
          console.error(`Error upserting parameter ${param.cle_parametre}:`, error);
          throw error;
        }
      }

      // Update pharmacy table for tax number and emergency contact
      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update({
          niu: settingsToSave.taxNumber,
          telephone_appel: settingsToSave.emergencyContact,
        })
        .eq('id', pharmacy.id);

      if (pharmacyError) {
        console.error('Error updating pharmacy data:', pharmacyError);
        throw pharmacyError;
      }

      setSettings(settingsToSave);
      console.log('useBusinessSettings: Settings saved successfully');

      toast({
        title: "Paramètres sauvegardés",
        description: "La configuration métier a été mise à jour avec succès.",
      });

    } catch (error) {
      console.error('Error saving business settings:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les paramètres métiers.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [pharmacy?.id]);

  return {
    settings,
    loading,
    saving,
    loadSettings,
    saveSettings,
    updateSetting: (key: keyof BusinessSettings, value: any) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    },
    updateBusinessHours: (day: string, field: string, value: string | boolean) => {
      setSettings(prev => ({
        ...prev,
        businessHours: {
          ...prev.businessHours,
          [day]: {
            ...prev.businessHours[day],
            [field]: value
          }
        }
      }));
    }
  };
};
