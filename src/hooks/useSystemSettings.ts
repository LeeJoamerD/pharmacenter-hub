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
  
  // Paramètres d'interface normalisés (clés DB)
  interface_theme?: string;
  interface_primary_color?: string;
  interface_font_size?: string;
  interface_sidebar_collapsed?: string;
  interface_show_tooltips?: string;
  interface_animations_activées?: string;
  interface_compact_mode?: string;
  interface_grid_density?: string;
  default_lingual?: string;
  interface_date_format?: string;
  interface_number_format?: string;
  interface_auto_save?: string;
  
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

      console.log('Paramètres chargés depuis la DB:', parametres);

      // Construire l'objet settings
      const parametresMap = parametres.reduce((acc, param) => {
        const value = param.type_parametre === 'json' 
          ? JSON.parse(param.valeur_parametre || param.valeur_defaut || '{}')
          : param.valeur_parametre || param.valeur_defaut;
        acc[param.cle_parametre] = value;
        return acc;
      }, {} as any);

      console.log('Paramètres mappés:', parametresMap);

      // Données par défaut pour les options disponibles (Congo Brazzaville)
      const defaultCurrencies: Currency[] = [
        { code: 'XAF', name: 'Franc CFA BEAC', symbol: 'FCFA', rate: 1, countries: ['Congo Brazzaville', 'Gabon'] },
        { code: 'XOF', name: 'Franc CFA BCEAO', symbol: 'CFA', rate: 1, countries: ['Côte d\'Ivoire', 'Bénin'] },
        { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.0015, countries: ['France', 'Belgique'] },
        { code: 'USD', name: 'Dollar américain', symbol: '$', rate: 0.0016, countries: ['États-Unis', 'Canada'] },
        { code: 'GBP', name: 'Livre sterling', symbol: '£', rate: 0.0013, countries: ['Royaume-Uni'] }
      ];

      const defaultTimezones: Timezone[] = [
        { code: 'Africa/Brazzaville', name: 'Heure du Congo Brazzaville', offset: 'UTC+1', region: 'Afrique Centrale Ouest' },
        { code: 'Africa/Douala', name: 'Heure du Cameroun', offset: 'UTC+1', region: 'Afrique Centrale' },
        { code: 'Europe/Paris', name: 'Heure de Paris', offset: 'UTC+1', region: 'Europe' },
        { code: 'America/New_York', name: 'Heure de New York', offset: 'UTC-5', region: 'Amérique du Nord' },
        { code: 'Asia/Tokyo', name: 'Heure de Tokyo', offset: 'UTC+9', region: 'Asie' }
      ];

      const defaultLanguages: Language[] = [
        { code: 'fr', name: 'Français', flag: '🇫🇷', native_name: 'Français', region: 'Congo Brazzaville' },
        { code: 'ln', name: 'Lingala', flag: '🇨🇬', native_name: 'Lingála', region: 'Congo Brazzaville' },
        { code: 'en', name: 'English', flag: '🇺🇸', native_name: 'English', region: 'United States' },
        { code: 'es', name: 'Español', flag: '🇪🇸', native_name: 'Español', region: 'España' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪', native_name: 'Deutsch', region: 'Deutschland' }
      ];

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
        taux_centime_additionnel: parseFloat(parametresMap.taux_centime_additionnel || '0'),
        
        // Paramètres système (par défaut Congo Brazzaville)
        default_currency: parametresMap.default_currency || 'XAF',
        default_timezone: parametresMap.default_timezone || 'Africa/Brazzaville',
        default_language: parametresMap.default_language || 'fr',
        fiscal_year: parametresMap.fiscal_year || new Date().getFullYear().toString(),
        taux_tva: parseFloat(parametresMap.taux_tva || '19.25'),
        
        // Paramètres d'interface normalisés
        interface_theme: parametresMap.interface_theme,
        interface_primary_color: parametresMap.interface_primary_color,
        interface_font_size: parametresMap.interface_font_size,
        interface_sidebar_collapsed: parametresMap.interface_sidebar_collapsed,
        interface_show_tooltips: parametresMap.interface_show_tooltips,
        interface_animations_activées: parametresMap.interface_animations_activées,
        interface_compact_mode: parametresMap.interface_compact_mode,
        interface_grid_density: parametresMap.interface_grid_density,
        default_lingual: parametresMap.default_lingual,
        interface_date_format: parametresMap.interface_date_format,
        interface_number_format: parametresMap.interface_number_format,
        interface_auto_save: parametresMap.interface_auto_save,
        
        // Options disponibles - utiliser les données de la base ou les données par défaut
        currencies_available: parametresMap.currencies_available && parametresMap.currencies_available.length > 0 
          ? parametresMap.currencies_available 
          : defaultCurrencies,
        timezones_available: parametresMap.timezones_available && parametresMap.timezones_available.length > 0 
          ? parametresMap.timezones_available 
          : defaultTimezones,
        languages_available: parametresMap.languages_available && parametresMap.languages_available.length > 0 
          ? parametresMap.languages_available 
          : defaultLanguages,
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
      };

      // Préparer tous les paramètres système avec conversion stable
      const systemParams: Record<string, string> = {};
      
      // Paramètres spécifiques à sauvegarder dans parametres_systeme
      const systemKeys = [
        'default_currency', 'default_timezone', 'default_language', 'fiscal_year', 
        'taux_tva', 'taux_centime_additionnel',
        // Paramètres d'interface (clés normalisées)
        'interface_theme', 'interface_primary_color', 'interface_font_size', 
        'interface_sidebar_collapsed', 'interface_show_tooltips', 'interface_animations_activées',
        'interface_compact_mode', 'interface_grid_density', 'default_lingual',
        'interface_date_format', 'interface_number_format', 'interface_auto_save'
      ];
      
      // Conversion stable vers string pour tous les paramètres
      systemKeys.forEach(key => {
        const value = (updatedSettings as any)[key];
        if (value !== undefined && value !== null) {
          // Conversion robuste vers string
          if (typeof value === 'object') {
            systemParams[key] = JSON.stringify(value);
          } else if (typeof value === 'boolean') {
            systemParams[key] = value ? 'vrai' : 'faux';
          } else {
            systemParams[key] = value.toString();
          }
        }
      });

      // Mettre à jour la pharmacie (seulement les champs définis)
      const pharmacyFieldsToUpdate = Object.fromEntries(
        Object.entries(pharmacyFields).filter(([_, value]) => value !== undefined)
      );
      
      if (Object.keys(pharmacyFieldsToUpdate).length > 0) {
        const { error: pharmacyError } = await supabase
          .from('pharmacies')
          .update(pharmacyFieldsToUpdate)
          .eq('id', pharmacy.id);

        if (pharmacyError) {
          console.error('Erreur mise à jour pharmacie:', pharmacyError);
          throw new Error(`Erreur pharmacie: ${pharmacyError.message}`);
        }
      }

      // Traitement robuste des paramètres système avec upserts
      const parameterErrors: string[] = [];
      
      for (const [key, value] of Object.entries(systemParams)) {
        try {
          // Utiliser upsert pour optimiser les opérations (insert ou update)
          const { error } = await supabase
            .from('parametres_systeme')
            .upsert({
              tenant_id: pharmacy.id,
              cle_parametre: key,
              valeur_parametre: value,
              type_parametre: 'string',
              description: `Paramètre ${key}`,
              valeur_defaut: value,
              categorie: key.startsWith('interface_') ? 'interface' : 'general',
              is_modifiable: true,
              is_visible: true
            }, {
              onConflict: 'tenant_id,cle_parametre'
            });

          if (error) {
            console.error(`Erreur paramètre ${key}:`, error);
            parameterErrors.push(`${key}: ${error.message}`);
          }
        } catch (paramError) {
          console.error(`Erreur critique paramètre ${key}:`, paramError);
          parameterErrors.push(`${key}: erreur critique`);
        }
      }

      // Si des erreurs de paramètres mais pas toutes, continuer avec avertissement
      if (parameterErrors.length > 0 && parameterErrors.length < Object.keys(systemParams).length) {
        console.warn('Certains paramètres non sauvegardés:', parameterErrors);
        toast({
          title: "Sauvegarde partielle",
          description: `${Object.keys(systemParams).length - parameterErrors.length} paramètres sauvegardés, ${parameterErrors.length} erreurs.`,
          variant: "destructive"
        });
      } else if (parameterErrors.length === Object.keys(systemParams).length && parameterErrors.length > 0) {
        throw new Error(`Aucun paramètre sauvegardé: ${parameterErrors.join(', ')}`);
      }

      // Application immédiate des changements de langue si modifiés
      if (updatedSettings.default_language || updatedSettings.default_lingual) {
        try {
          // Déclencher l'application des paramètres de langue
          // Via le contexte SystemSettings
          window.dispatchEvent(new CustomEvent('systemSettingsLanguageChanged', {
            detail: { 
              languageCode: updatedSettings.default_language || updatedSettings.default_lingual 
            }
          }));
        } catch (langError) {
          console.warn('Erreur application langue:', langError);
        }
      }

      // Mettre à jour l'état local de manière sûre
      setSettings(prev => {
        if (!prev) return null;
        return { ...prev, ...updatedSettings };
      });

      // Toast de succès seulement si tout s'est bien passé
      if (parameterErrors.length === 0) {
        toast({
          title: "Paramètres sauvegardés",
          description: "Les paramètres système ont été mis à jour avec succès.",
        });
      }

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      // Message d'erreur plus informatif
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur de sauvegarde",
        description: `Impossible de sauvegarder les paramètres: ${errorMessage}`,
        variant: "destructive",
      });
      
      // Ne pas mettre à jour l'état local en cas d'erreur
      throw error;
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