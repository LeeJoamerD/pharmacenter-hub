/**
 * Générateur de numéros de facture
 */
import { supabase } from '@/integrations/supabase/client';

export async function generateInvoiceNumber(tenantId: string): Promise<string> {
  try {
    // Appeler la fonction PostgreSQL atomique
    const { data, error } = await supabase.rpc('generate_pos_invoice_number', {
      p_tenant_id: tenantId
    });

    if (error) {
      console.error('Erreur génération numéro facture:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Aucun numéro de facture généré');
    }

    return data;
  } catch (error) {
    console.error('Erreur critique génération facture:', error);
    
    // Fallback ultime : utiliser timestamp + random pour garantir unicité
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `POS-ERR-${timestamp}-${random}`;
  }
}
