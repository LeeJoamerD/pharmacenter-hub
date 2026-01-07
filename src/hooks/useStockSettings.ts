import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';

export interface StockSettings {
  oneLotPerReception: boolean;
  automaticReceptionValidation: boolean;
  requireLotNumbers: boolean;
  alertOnExpirationDays: number;
  criticalExpirationDays: number;
  // Stock management settings
  default_units: string;
  minimum_stock_days: number;
  maximum_stock_days: number;
  auto_reorder_enabled: boolean;
  reorder_point_days: number;
  safety_stock_percentage: number;
  valuation_method: 'FIFO' | 'LIFO' | 'PMP' | 'CUMP';
  rounding_precision: number;
  allow_negative_stock: boolean;
  track_expiration_dates: boolean;
  auto_generate_lots: boolean;
}

export const useStockSettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<StockSettings>({
    oneLotPerReception: false,
    automaticReceptionValidation: false,
    requireLotNumbers: true,
    alertOnExpirationDays: DEFAULT_SETTINGS.stock.alertExpirationDays,
    criticalExpirationDays: DEFAULT_SETTINGS.stock.criticalExpirationDays,
    // Default values for additional settings - utilise la config centralisée
    default_units: DEFAULT_SETTINGS.stock.defaultUnits,
    minimum_stock_days: DEFAULT_SETTINGS.stock.minimumStockDays,
    maximum_stock_days: DEFAULT_SETTINGS.stock.maximumStockDays,
    auto_reorder_enabled: false,
    reorder_point_days: DEFAULT_SETTINGS.stock.reorderPointDays,
    safety_stock_percentage: DEFAULT_SETTINGS.stock.safetyStockPercentage,
    valuation_method: DEFAULT_SETTINGS.stock.valuationMethod,
    rounding_precision: DEFAULT_SETTINGS.rounding.precision,
    allow_negative_stock: false,
    track_expiration_dates: true,
    auto_generate_lots: false,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('parametres_systeme')
        .select('cle_parametre, valeur_parametre')
        .eq('categorie', 'general')
        .in('cle_parametre', [
          'stock_one_lot_per_reception',
          'stock_automatic_reception_validation',
          'stock_require_lot_numbers',
          'stock_alert_expiration_days',
          'stock_critical_expiration_days',
          'stock_default_units',
          'stock_minimum_stock_days',
          'stock_maximum_stock_days',
          'stock_auto_reorder_enabled',
          'stock_reorder_point_days',
          'stock_safety_stock_percentage',
          'stock_valuation_method',
          'stock_rounding_precision',
          'stock_allow_negative_stock',
          'stock_track_expiration_dates',
          'stock_auto_generate_lots'
        ]);

      if (error) throw error;

      const paramMap = data?.reduce((acc, param) => {
        acc[param.cle_parametre] = param.valeur_parametre;
        return acc;
      }, {} as Record<string, string>) || {};

      setSettings({
        oneLotPerReception: paramMap.stock_one_lot_per_reception === 'true',
        automaticReceptionValidation: paramMap.stock_automatic_reception_validation === 'true',
        requireLotNumbers: paramMap.stock_require_lot_numbers !== 'false',
        alertOnExpirationDays: parseInt(paramMap.stock_alert_expiration_days) || DEFAULT_SETTINGS.stock.alertExpirationDays,
        criticalExpirationDays: parseInt(paramMap.stock_critical_expiration_days) || DEFAULT_SETTINGS.stock.criticalExpirationDays,
        default_units: paramMap.stock_default_units || DEFAULT_SETTINGS.stock.defaultUnits,
        minimum_stock_days: parseInt(paramMap.stock_minimum_stock_days) || DEFAULT_SETTINGS.stock.minimumStockDays,
        maximum_stock_days: parseInt(paramMap.stock_maximum_stock_days) || DEFAULT_SETTINGS.stock.maximumStockDays,
        auto_reorder_enabled: paramMap.stock_auto_reorder_enabled === 'true',
        reorder_point_days: parseInt(paramMap.stock_reorder_point_days) || DEFAULT_SETTINGS.stock.reorderPointDays,
        safety_stock_percentage: parseInt(paramMap.stock_safety_stock_percentage) || DEFAULT_SETTINGS.stock.safetyStockPercentage,
        valuation_method: (paramMap.stock_valuation_method as any) || DEFAULT_SETTINGS.stock.valuationMethod,
        rounding_precision: parseInt(paramMap.stock_rounding_precision) || DEFAULT_SETTINGS.rounding.precision,
        allow_negative_stock: paramMap.stock_allow_negative_stock === 'true',
        track_expiration_dates: paramMap.stock_track_expiration_dates !== 'false',
        auto_generate_lots: paramMap.stock_auto_generate_lots === 'true',
      });
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres stock:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de stock",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<StockSettings>) => {
    try {
      setLoading(true);

      // Prepare parameters for upsert
      const upsertData = [];
      
      // Get current user's tenant_id
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.tenant_id) throw new Error('Tenant non trouvé');
      
      if (newSettings.oneLotPerReception !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_one_lot_per_reception',
          valeur_parametre: newSettings.oneLotPerReception.toString(),
          type_parametre: 'boolean',
          categorie: 'general',
          description: 'Créer un lot distinct pour chaque réception même avec le même numéro de lot fabricant'
        });
      }

      if (newSettings.automaticReceptionValidation !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_automatic_reception_validation',
          valeur_parametre: newSettings.automaticReceptionValidation.toString(),
          type_parametre: 'boolean',
          categorie: 'general',
          description: 'Valider automatiquement les réceptions conformes'
        });
      }

      if (newSettings.requireLotNumbers !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_require_lot_numbers',
          valeur_parametre: newSettings.requireLotNumbers.toString(),
          type_parametre: 'boolean',
          categorie: 'general',
          description: 'Rendre obligatoire la saisie des numéros de lot'
        });
      }

      if (newSettings.alertOnExpirationDays !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_alert_expiration_days',
          valeur_parametre: newSettings.alertOnExpirationDays.toString(),
          type_parametre: 'number',
          categorie: 'general',
          description: 'Nombre de jours avant expiration pour déclencher une alerte'
        });
      }

      if (newSettings.criticalExpirationDays !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_critical_expiration_days',
          valeur_parametre: newSettings.criticalExpirationDays.toString(),
          type_parametre: 'number',
          categorie: 'general',
          description: 'Nombre de jours avant expiration pour déclencher une alerte critique'
        });
      }

      // Additional settings
      if (newSettings.default_units !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_default_units',
          valeur_parametre: newSettings.default_units.toString(),
          type_parametre: 'string',
          categorie: 'general',
          description: 'Unité par défaut pour les produits'
        });
      }

      if (newSettings.minimum_stock_days !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_minimum_stock_days',
          valeur_parametre: newSettings.minimum_stock_days.toString(),
          type_parametre: 'number',
          categorie: 'general',
          description: 'Nombre minimum de jours de stock'
        });
      }

      if (newSettings.maximum_stock_days !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_maximum_stock_days',
          valeur_parametre: newSettings.maximum_stock_days.toString(),
          type_parametre: 'number',
          categorie: 'general',
          description: 'Nombre maximum de jours de stock'
        });
      }

      if (newSettings.auto_reorder_enabled !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_auto_reorder_enabled',
          valeur_parametre: newSettings.auto_reorder_enabled.toString(),
          type_parametre: 'boolean',
          categorie: 'general',
          description: 'Activer les commandes automatiques'
        });
      }

      if (newSettings.reorder_point_days !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_reorder_point_days',
          valeur_parametre: newSettings.reorder_point_days.toString(),
          type_parametre: 'number',
          categorie: 'general',
          description: 'Point de commande en jours'
        });
      }

      if (newSettings.safety_stock_percentage !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_safety_stock_percentage',
          valeur_parametre: newSettings.safety_stock_percentage.toString(),
          type_parametre: 'number',
          categorie: 'general',
          description: 'Pourcentage de stock de sécurité'
        });
      }

      if (newSettings.valuation_method !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_valuation_method',
          valeur_parametre: newSettings.valuation_method.toString(),
          type_parametre: 'string',
          categorie: 'general',
          description: 'Méthode de valorisation du stock'
        });
      }

      if (newSettings.rounding_precision !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_rounding_precision',
          valeur_parametre: newSettings.rounding_precision.toString(),
          type_parametre: 'number',
          categorie: 'general',
          description: 'Précision d\'arrondi pour les calculs'
        });
      }

      if (newSettings.allow_negative_stock !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_allow_negative_stock',
          valeur_parametre: newSettings.allow_negative_stock.toString(),
          type_parametre: 'boolean',
          categorie: 'general',
          description: 'Autoriser les stocks négatifs'
        });
      }

      if (newSettings.track_expiration_dates !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_track_expiration_dates',
          valeur_parametre: newSettings.track_expiration_dates.toString(),
          type_parametre: 'boolean',
          categorie: 'general',
          description: 'Suivre les dates d\'expiration'
        });
      }

      if (newSettings.auto_generate_lots !== undefined) {
        upsertData.push({
          tenant_id: personnel.tenant_id,
          cle_parametre: 'stock_auto_generate_lots',
          valeur_parametre: newSettings.auto_generate_lots.toString(),
          type_parametre: 'boolean',
          categorie: 'general',
          description: 'Générer automatiquement les numéros de lot'
        });
      }

      if (upsertData.length > 0) {
        const { error } = await supabase
          .from('parametres_systeme')
          .upsert(upsertData, {
            onConflict: 'tenant_id,cle_parametre',
            ignoreDuplicates: false
          });

        if (error) throw error;
      }

      // Update local state
      setSettings(prev => ({ ...prev, ...newSettings }));

      // Invalider le cache des paramètres de pricing pour forcer le rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['unified-pricing-params'] });

      toast({
        title: "Succès",
        description: "Paramètres de stock mis à jour",
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    updateSettings,
    refetch: loadSettings,
  };
};