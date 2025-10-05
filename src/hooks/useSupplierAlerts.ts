import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantQuery } from './useTenantQuery';

export interface SupplierAlert {
  id: string;
  fournisseur_id: string;
  produits_ids: string[];
  type_alerte: 'rupture_stock' | 'delai_livraison' | 'qualite_produit' | 'urgence';
  message: string;
  statut: 'envoyee' | 'vue' | 'repondue' | 'resolue';
  canal_envoi: 'email' | 'sms' | 'telephone' | 'plateforme';
  metadata?: any;
  date_envoi: string;
  date_reponse?: string;
  reponse_fournisseur?: string;
}

export interface AlertRecipient {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
}

export const useSupplierAlerts = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer toutes les alertes
  const { data: alerts = [], refetch } = useTenantQueryWithCache(
    ['supplier-alerts'],
    'alertes_fournisseurs',
    '*',
    {}
  );

  // Envoyer une alerte à un fournisseur
  const sendSupplierAlert = async (
    fournisseurId: string,
    produitsIds: string[],
    typeAlerte: SupplierAlert['type_alerte'],
    message: string,
    canalEnvoi: SupplierAlert['canal_envoi'] = 'email',
    metadata?: any
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('id, tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!personnel) throw new Error('Personnel non trouvé');

      // Créer l'alerte
      const { data: alert, error: alertError } = await supabase
        .from('alertes_fournisseurs')
        .insert({
          tenant_id: personnel.tenant_id,
          fournisseur_id: fournisseurId,
          produits_ids: produitsIds,
          type_alerte: typeAlerte,
          message,
          canal_envoi: canalEnvoi,
          metadata: metadata || {},
          created_by: personnel.id,
          statut: 'envoyee',
        })
        .select()
        .single();

      if (alertError) throw alertError;

      // Logger l'action
      await supabase.from('audit_logs').insert({
        tenant_id: personnel.tenant_id,
        user_id: user.id,
        personnel_id: personnel.id,
        action: 'SUPPLIER_ALERT_SENT',
        table_name: 'alertes_fournisseurs',
        record_id: alert.id,
        new_values: {
          fournisseur_id: fournisseurId,
          type_alerte: typeAlerte,
          produits_count: produitsIds.length,
        },
      });

      await refetch();
      queryClient.invalidateQueries({ queryKey: ['supplier-alerts'] });
      return true;
    } catch (error: any) {
      console.error('Error sending supplier alert:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Envoyer des alertes à plusieurs fournisseurs
  const sendMultipleSupplierAlerts = async (
    alerts: Array<{
      fournisseurId: string;
      produitsIds: string[];
      typeAlerte: SupplierAlert['type_alerte'];
      message: string;
      canalEnvoi?: SupplierAlert['canal_envoi'];
    }>
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const alert of alerts) {
      try {
        await sendSupplierAlert(
          alert.fournisseurId,
          alert.produitsIds,
          alert.typeAlerte,
          alert.message,
          alert.canalEnvoi
        );
        success++;
      } catch (error) {
        failed++;
        console.error('Failed to send alert:', error);
      }
    }

    return { success, failed };
  };

  // Marquer une alerte comme vue
  const markAlertAsViewed = async (alertId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('alertes_fournisseurs')
        .update({ statut: 'vue' })
        .eq('id', alertId);

      if (error) throw error;

      await refetch();
      return true;
    } catch (error) {
      console.error('Error marking alert as viewed:', error);
      return false;
    }
  };

  // Enregistrer la réponse du fournisseur
  const recordSupplierResponse = async (
    alertId: string,
    response: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('alertes_fournisseurs')
        .update({
          statut: 'repondue',
          reponse_fournisseur: response,
          date_reponse: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      await refetch();
      return true;
    } catch (error) {
      console.error('Error recording supplier response:', error);
      return false;
    }
  };

  // Résoudre une alerte
  const resolveAlert = async (alertId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('alertes_fournisseurs')
        .update({ statut: 'resolue' })
        .eq('id', alertId);

      if (error) throw error;

      await refetch();
      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  };

  // Récupérer les alertes par fournisseur
  const getAlertsBySupplier = async (fournisseurId: string): Promise<SupplierAlert[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!personnel) return [];

      const { data, error } = await supabase
        .from('alertes_fournisseurs')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .eq('fournisseur_id', fournisseurId)
        .order('date_envoi', { ascending: false });

      if (error) throw error;
      return (data || []) as SupplierAlert[];
    } catch (error) {
      console.error('Error fetching alerts by supplier:', error);
      return [];
    }
  };

  // Récupérer les statistiques des alertes
  const getAlertStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!personnel) return null;

      const { data: allAlerts } = await supabase
        .from('alertes_fournisseurs')
        .select('*')
        .eq('tenant_id', personnel.tenant_id);

      if (!allAlerts) return null;

      const stats = {
        total: allAlerts.length,
        envoyees: allAlerts.filter((a) => a.statut === 'envoyee').length,
        vues: allAlerts.filter((a) => a.statut === 'vue').length,
        repondues: allAlerts.filter((a) => a.statut === 'repondue').length,
        resolues: allAlerts.filter((a) => a.statut === 'resolue').length,
        byType: {
          rupture_stock: allAlerts.filter((a) => a.type_alerte === 'rupture_stock').length,
          urgence: allAlerts.filter((a) => a.type_alerte === 'urgence').length,
          delai_livraison: allAlerts.filter((a) => a.type_alerte === 'delai_livraison').length,
          qualite_produit: allAlerts.filter((a) => a.type_alerte === 'qualite_produit').length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Error fetching alert stats:', error);
      return null;
    }
  };

  return {
    alerts,
    isLoading,
    sendSupplierAlert,
    sendMultipleSupplierAlerts,
    markAlertAsViewed,
    recordSupplierResponse,
    resolveAlert,
    getAlertsBySupplier,
    getAlertStats,
    refetch,
  };
};