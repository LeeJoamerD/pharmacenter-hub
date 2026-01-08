import { supabase } from '@/integrations/supabase/client';

export interface PharmaMLSendResult {
  success: boolean;
  message: string;
  transmissionId?: string;
  orderNumber?: string;
  status?: string;
}

export interface SupplierPharmaMLConfig {
  pharmaml_enabled: boolean;
  pharmaml_url: string | null;
  pharmaml_code_repartiteur: string | null;
  pharmaml_id_repartiteur: string | null;
  pharmaml_cle_secrete: string | null;
  pharmaml_id_officine: string | null;
  pharmaml_pays: string | null;
}

export class PharmaMLService {
  /**
   * Check if a supplier has PharmaML configured and enabled
   */
  static async isSupplierConfigured(supplierId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('pharmaml_enabled, pharmaml_url, pharmaml_id_officine')
        .eq('id', supplierId)
        .single();

      if (error || !data) return false;

      return !!(
        data.pharmaml_enabled &&
        data.pharmaml_url &&
        data.pharmaml_id_officine
      );
    } catch {
      return false;
    }
  }

  /**
   * Get PharmaML configuration for a supplier
   */
  static async getSupplierConfig(supplierId: string): Promise<SupplierPharmaMLConfig | null> {
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('pharmaml_enabled, pharmaml_url, pharmaml_code_repartiteur, pharmaml_id_repartiteur, pharmaml_cle_secrete, pharmaml_id_officine, pharmaml_pays')
        .eq('id', supplierId)
        .single();

      if (error || !data) return null;

      return data as SupplierPharmaMLConfig;
    } catch {
      return null;
    }
  }

  /**
   * Send an order via PharmaML
   */
  static async sendOrder(
    orderId: string,
    supplierId: string,
    tenantId: string
  ): Promise<PharmaMLSendResult> {
    try {
      // First check if supplier is configured
      const isConfigured = await this.isSupplierConfigured(supplierId);
      if (!isConfigured) {
        return {
          success: false,
          message: 'PharmaML non configuré pour ce fournisseur'
        };
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('pharmaml-order', {
        body: {
          commande_id: orderId,
          fournisseur_id: supplierId,
          tenant_id: tenantId
        }
      });

      if (error) {
        return {
          success: false,
          message: error.message || 'Erreur lors de l\'envoi PharmaML'
        };
      }

      return {
        success: data?.success || false,
        message: data?.message || 'Envoi terminé',
        transmissionId: data?.transmission_id,
        orderNumber: data?.pharmaml_order_number,
        status: data?.status
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Erreur inattendue'
      };
    }
  }

  /**
   * Check if an order has already been sent via PharmaML
   */
  static async hasBeenSent(orderId: string): Promise<{ sent: boolean; lastStatus?: string }> {
    try {
      const { data, error } = await supabase
        .from('pharmaml_transmissions')
        .select('statut')
        .eq('commande_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return { sent: false };
      }

      return {
        sent: true,
        lastStatus: data[0].statut
      };
    } catch {
      return { sent: false };
    }
  }
}
