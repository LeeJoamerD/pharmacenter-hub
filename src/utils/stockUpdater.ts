/**
 * Utilitaires pour la mise à jour du stock selon FIFO
 */
import { supabase } from '@/integrations/supabase/client';

export async function updateStockAfterSale(
  productId: string,
  quantityToSell: number,
  tenantId: string
): Promise<void> {
  // 1. Récupérer les lots disponibles (FIFO: date_peremption ASC)
  const { data: lots, error } = await supabase
    .from('lots')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('produit_id', productId)
    .gt('quantite_restante', 0)
    .order('date_peremption', { ascending: true });

  if (error) throw error;
  
  if (!lots || lots.length === 0) {
    throw new Error(`Stock insuffisant pour le produit ${productId}`);
  }

  // 2. Déduire la quantité selon FIFO
  let remainingQty = quantityToSell;
  const updates: Array<{ id: string; new_quantity: number }> = [];

  for (const lot of lots) {
    if (remainingQty <= 0) break;

    const qtyToDeduct = Math.min(lot.quantite_restante, remainingQty);
    updates.push({
      id: lot.id,
      new_quantity: lot.quantite_restante - qtyToDeduct
    });

    remainingQty -= qtyToDeduct;
  }

  if (remainingQty > 0) {
    throw new Error(`Stock insuffisant: manque ${remainingQty} unités`);
  }

  // 3. Mettre à jour les lots
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('lots')
      .update({ quantite_restante: update.new_quantity })
      .eq('id', update.id);

    if (updateError) throw updateError;
  }
}
