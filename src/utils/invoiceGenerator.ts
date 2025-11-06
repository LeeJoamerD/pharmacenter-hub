/**
 * Générateur de numéros de facture
 */
import { supabase } from '@/integrations/supabase/client';

export async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const today = new Date();
  const datePrefix = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  
  // Définir le début et la fin de la journée
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Compter les ventes du jour
  const { count, error } = await supabase
    .from('ventes')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('date_vente', startOfDay.toISOString())
    .lte('date_vente', endOfDay.toISOString());

  if (error) {
    console.error('Erreur comptage ventes:', error);
    // Fallback en cas d'erreur
    return `POS-${datePrefix}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
  }

  const sequence = String((count || 0) + 1).padStart(4, '0');
  return `POS-${datePrefix}-${sequence}`;
}
