import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SalesSettings {
  general: {
    autoSaveTransactions: boolean;
    enableBarcodeScan: boolean;
    showStockLevels: boolean;
    requireCustomerInfo: boolean;
    enableQuickSale: boolean;
    defaultDiscountType: string;
    maxDiscountPercent: number;
    enableNegativeStock: boolean;
  };
  tax: {
    defaultTaxRate: number;
    includeTaxInPrice: boolean;
    taxCalculationMethod: string;
    exemptProducts: boolean;
    taxRoundingMethod: string;
  };
  payment: {
    cash: { enabled: boolean; requireChange: boolean };
    card: { enabled: boolean; minAmount: number };
    mobile: { enabled: boolean; providers: string[] };
    check: { enabled: boolean; requireVerification: boolean };
    credit: { enabled: boolean; maxAmount: number };
    split: { enabled: boolean; maxMethods: number };
  };
  printing: {
    autoprint: boolean;
    receiptTemplate: string;
    includeBarcode: boolean;
    includeQRCode: boolean;
    printCustomerCopy: boolean;
    receiptFooter: string;
    printLogo: boolean;
    paperSize: string;
  };
  register: {
    requireOpeningAmount: boolean;
    defaultOpeningAmount: number;
    enableCashDrawer: boolean;
    alertLowCash: boolean;
    lowCashThreshold: number;
    enableMultipleUsers: boolean;
    sessionTimeout: number;
  };
  alerts: {
    lowStockAlert: boolean;
    expiredProductsAlert: boolean;
    dailyReportReminder: boolean;
    backupReminder: boolean;
    suspiciousActivityAlert: boolean;
    highValueTransactionAlert: boolean;
    highValueThreshold: number;
  };
}

const defaultSettings: SalesSettings = {
  general: {
    autoSaveTransactions: true,
    enableBarcodeScan: true,
    showStockLevels: true,
    requireCustomerInfo: false,
    enableQuickSale: true,
    defaultDiscountType: 'percentage',
    maxDiscountPercent: 20,
    enableNegativeStock: false
  },
  tax: {
    defaultTaxRate: 18,
    includeTaxInPrice: true,
    taxCalculationMethod: 'inclusive',
    exemptProducts: false,
    taxRoundingMethod: 'round'
  },
  payment: {
    cash: { enabled: true, requireChange: true },
    card: { enabled: true, minAmount: 0 },
    mobile: { enabled: true, providers: ['Orange Money', 'MTN Mobile Money', 'Moov Money'] },
    check: { enabled: false, requireVerification: true },
    credit: { enabled: true, maxAmount: 500000 },
    split: { enabled: true, maxMethods: 3 }
  },
  printing: {
    autoprint: true,
    receiptTemplate: 'standard',
    includeBarcode: true,
    includeQRCode: false,
    printCustomerCopy: false,
    receiptFooter: 'Merci de votre visite !',
    printLogo: true,
    paperSize: 'thermal_80mm'
  },
  register: {
    requireOpeningAmount: true,
    defaultOpeningAmount: 50000,
    enableCashDrawer: true,
    alertLowCash: true,
    lowCashThreshold: 20000,
    enableMultipleUsers: true,
    sessionTimeout: 480
  },
  alerts: {
    lowStockAlert: true,
    expiredProductsAlert: true,
    dailyReportReminder: true,
    backupReminder: true,
    suspiciousActivityAlert: true,
    highValueTransactionAlert: true,
    highValueThreshold: 100000
  }
};

export const useSalesSettings = () => {
  const [settings, setSettings] = useState<SalesSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parametres_systeme')
        .select('cle_parametre, valeur_parametre')
        .in('cle_parametre', [
          'sales_general',
          'sales_tax', 
          'sales_payment',
          'sales_printing',
          'sales_register',
          'sales_alerts'
        ]);

      if (error) {
        console.error('Error loading sales settings:', error);
        return;
      }

      if (data && data.length > 0) {
        const loadedSettings = { ...defaultSettings };
        
        data.forEach((param) => {
          try {
            const value = JSON.parse(param.valeur_parametre);
            switch (param.cle_parametre) {
              case 'sales_general':
                loadedSettings.general = { ...loadedSettings.general, ...value };
                break;
              case 'sales_tax':
                loadedSettings.tax = { ...loadedSettings.tax, ...value };
                break;
              case 'sales_payment':
                loadedSettings.payment = { ...loadedSettings.payment, ...value };
                break;
              case 'sales_printing':
                loadedSettings.printing = { ...loadedSettings.printing, ...value };
                break;
              case 'sales_register':
                loadedSettings.register = { ...loadedSettings.register, ...value };
                break;
              case 'sales_alerts':
                loadedSettings.alerts = { ...loadedSettings.alerts, ...value };
                break;
            }
          } catch (parseError) {
            console.error(`Error parsing ${param.cle_parametre}:`, parseError);
          }
        });
        
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des paramètres de vente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings?: SalesSettings) => {
    try {
      setSaving(true);
      const settingsToSave = newSettings || settings;

      // Get current tenant ID using the database function
      const { data: tenantData, error: tenantError } = await supabase
        .rpc('get_current_user_tenant_id');

      if (tenantError || !tenantData) {
        throw new Error('Impossible de récupérer l\'ID du tenant');
      }

      // Save each section individually using upsert
      const parametersData = [
        {
          tenant_id: tenantData,
          cle_parametre: 'sales_general',
          valeur_parametre: JSON.stringify(settingsToSave.general),
          type_parametre: 'json',
          description: 'Configuration générale des ventes',
          categorie: 'business',
          is_modifiable: true,
          is_visible: true
        },
        {
          tenant_id: tenantData,
          cle_parametre: 'sales_tax',
          valeur_parametre: JSON.stringify(settingsToSave.tax),
          type_parametre: 'json',
          description: 'Configuration TVA des ventes',
          categorie: 'business',
          is_modifiable: true,
          is_visible: true
        },
        {
          tenant_id: tenantData,
          cle_parametre: 'sales_payment',
          valeur_parametre: JSON.stringify(settingsToSave.payment),
          type_parametre: 'json',
          description: 'Configuration modes de paiement',
          categorie: 'business',
          is_modifiable: true,
          is_visible: true
        },
        {
          tenant_id: tenantData,
          cle_parametre: 'sales_printing',
          valeur_parametre: JSON.stringify(settingsToSave.printing),
          type_parametre: 'json',
          description: 'Configuration impression des reçus',
          categorie: 'print',
          is_modifiable: true,
          is_visible: true
        },
        {
          tenant_id: tenantData,
          cle_parametre: 'sales_register',
          valeur_parametre: JSON.stringify(settingsToSave.register),
          type_parametre: 'json',
          description: 'Configuration des caisses',
          categorie: 'business',
          is_modifiable: true,
          is_visible: true
        },
        {
          tenant_id: tenantData,
          cle_parametre: 'sales_alerts',
          valeur_parametre: JSON.stringify(settingsToSave.alerts),
          type_parametre: 'json',
          description: 'Configuration des alertes de vente',
          categorie: 'security',
          is_modifiable: true,
          is_visible: true
        }
      ];

      // Use single upsert operation with all parameters and proper conflict resolution
      const { error } = await supabase
        .from('parametres_systeme')
        .upsert(parametersData, { 
          onConflict: 'tenant_id,cle_parametre',
          ignoreDuplicates: false 
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres de vente ont été mis à jour.",
      });

      if (newSettings) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error saving sales settings:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde des paramètres.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    try {
      setSaving(true);
      await saveSettings(defaultSettings);
      toast({
        title: "Configuration réinitialisée",
        description: "Les paramètres ont été remis aux valeurs par défaut.",
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la réinitialisation des paramètres.",
        variant: "destructive",
      });
    }
  };

  const updateSettings = (section: keyof SalesSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updatePaymentMethod = (method: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        [method]: {
          ...prev.payment[method as keyof typeof prev.payment],
          [field]: value
        }
      }
    }));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    saving,
    saveSettings,
    resetSettings,
    updateSettings,
    updatePaymentMethod,
    refetch: loadSettings
  };
};