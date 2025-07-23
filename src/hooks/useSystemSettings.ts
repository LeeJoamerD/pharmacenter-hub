import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  countries: string[];
}

export interface Timezone {
  code: string;
  name: string;
  offset: string;
  region: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  native_name: string;
  region: string;
}

export interface SystemSettings {
  // Informations Pharmacie
  name: string;
  code: string;
  address: string;
  quartier: string;
  arrondissement: string;
  city: string;
  region: string;
  pays: string;
  email: string;
  telephone_appel: string;
  telephone_whatsapp: string;
  departement: string;
  type: string;
  taux_centime_additionnel: number;
  
  // Paramètres Système
  default_currency: string;
  default_timezone: string;
  default_language: string;
  fiscal_year: string;
  taux_tva: number;
  
  // Options disponibles
  currencies_available: Currency[];
  timezones_available: Timezone[];
  languages_available: Language[];
}

export const useSystemSettings = () => {
  const { pharmacy } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const loadSettings = async () => {
    if (!pharmacy?.id) return;
    
    try {
      setLoading(true);
      
      // Charger les données de la pharmacie
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', pharmacy.id)
        .maybeSingle();

      if (pharmacyError) throw pharmacyError;
      
      if (!pharmacyData) {
        throw new Error('Pharmacie non trouvée');
      }

      // Charger les paramètres système
      const { data: parametres, error: parametresError } = await supabase
        .from('parametres_systeme')
        .select('*')
        .eq('tenant_id', pharmacy.id);

      if (parametresError) throw parametresError;

      // Construire l'objet settings
      const parametresMap = parametres.reduce((acc, param) => {
        acc[param.cle_parametre] = param.type_parametre === 'json' 
          ? JSON.parse(param.valeur_parametre || param.valeur_defaut)
          : param.valeur_parametre || param.valeur_defaut;
        return acc;
      }, {} as any);

      const systemSettings: SystemSettings = {
        // Données pharmacie
        name: pharmacyData.name || '',
        code: pharmacyData.code || '',
        address: pharmacyData.address || '',
        quartier: pharmacyData.quartier || '',
        arrondissement: pharmacyData.arrondissement || '',
        city: pharmacyData.city || '',
        region: pharmacyData.region || '',
        pays: pharmacyData.pays || '',
        email: pharmacyData.email || '',
        telephone_appel: pharmacyData.telephone_appel || '',
        telephone_whatsapp: pharmacyData.telephone_whatsapp || '',
        departement: pharmacyData.departement || '',
        type: pharmacyData.type || '',
        taux_centime_additionnel: Number((pharmacyData as any).taux_centime_additionnel) || 0,
        
        // Paramètres système
        default_currency: parametresMap.default_currency || 'XAF',
        default_timezone: parametresMap.default_timezone || 'Africa/Douala',
        default_language: parametresMap.default_language || 'fr',
        fiscal_year: parametresMap.fiscal_year || new Date().getFullYear().toString(),
        taux_tva: parseFloat(parametresMap.taux_tva || '19.25'),
        
        // Options disponibles
        currencies_available: parametresMap.currencies_available || [],
        timezones_available: parametresMap.timezones_available || [],
        languages_available: parametresMap.languages_available || [],
      };

      setSettings(systemSettings);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres système.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updatedSettings: Partial<SystemSettings>) => {
    if (!pharmacy?.id || !settings) return;

    try {
      setSaving(true);

      // Séparer les données pharmacie des paramètres système
      const pharmacyFields = {
        name: updatedSettings.name,
        code: updatedSettings.code,
        address: updatedSettings.address,
        quartier: updatedSettings.quartier,
        arrondissement: updatedSettings.arrondissement,
        city: updatedSettings.city,
        region: updatedSettings.region,
        pays: updatedSettings.pays,
        email: updatedSettings.email,
        telephone_appel: updatedSettings.telephone_appel,
        telephone_whatsapp: updatedSettings.telephone_whatsapp,
        departement: updatedSettings.departement,
        type: updatedSettings.type,
        taux_centime_additionnel: updatedSettings.taux_centime_additionnel,
      };

      const systemParams = {
        default_currency: updatedSettings.default_currency,
        default_timezone: updatedSettings.default_timezone,
        default_language: updatedSettings.default_language,
        fiscal_year: updatedSettings.fiscal_year,
        taux_tva: updatedSettings.taux_tva?.toString(),
      };

      // Mettre à jour la pharmacie
      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update(Object.fromEntries(
          Object.entries(pharmacyFields).filter(([_, value]) => value !== undefined)
        ))
        .eq('id', pharmacy.id);

      if (pharmacyError) throw pharmacyError;

      // Mettre à jour les paramètres système
      for (const [key, value] of Object.entries(systemParams)) {
        if (value !== undefined) {
          const { error } = await supabase
            .from('parametres_systeme')
            .update({ valeur_parametre: value })
            .eq('tenant_id', pharmacy.id)
            .eq('cle_parametre', key);

          if (error) throw error;
        }
      }

      // Mettre à jour l'état local
      setSettings(prev => prev ? { ...prev, ...updatedSettings } : null);

      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres généraux ont été mis à jour avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<SystemSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  useEffect(() => {
    loadSettings();
  }, [pharmacy?.id]);

  return {
    settings,
    loading,
    saving,
    saveSettings,
    updateSettings,
    refetch: loadSettings,
  };
};