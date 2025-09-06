import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockSettings {
  oneLotPerReception: boolean;
  automaticReceptionValidation: boolean;
  requireLotNumbers: boolean;
  alertOnExpirationDays: number;
  criticalExpirationDays: number;
}

export const useStockSettings = () => {
  const [settings, setSettings] = useState<StockSettings>({
    oneLotPerReception: false,
    automaticReceptionValidation: false,
    requireLotNumbers: true,
    alertOnExpirationDays: 90,
    criticalExpirationDays: 30,
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
          'stock_critical_expiration_days'
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
        alertOnExpirationDays: parseInt(paramMap.stock_alert_expiration_days) || 90,
        criticalExpirationDays: parseInt(paramMap.stock_critical_expiration_days) || 30,
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