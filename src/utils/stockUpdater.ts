/**
 * Utilitaires pour la mise à jour du stock selon FIFO
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface représentant l'utilisation d'un lot lors d'une vente
 */
export interface LotUsage {
  lot_id: string;
  numero_lot: string;
  quantite_deduite: number;
  date_peremption: string;
  prix_vente_ht?: number;
  prix_vente_ttc?: number;
}

/**
 * Met à jour le stock après une vente en utilisant la méthode FIFO
 * et retourne les détails des lots utilisés pour la traçabilité
 */
export async function updateStockAfterSale(
  productId: string,
  quantityToSell: number,
  tenantId: string,
  referenceId?: string,
  motif?: string
): Promise<LotUsage[]> {
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

  // 2. Déduire la quantité selon FIFO et collecter les lots utilisés
  let remainingQty = quantityToSell;
  const updates: Array<{ id: string; new_quantity: number }> = [];
  const lotsUsed: LotUsage[] = [];

  for (const lot of lots) {
    if (remainingQty <= 0) break;

    const qtyToDeduct = Math.min(lot.quantite_restante, remainingQty);
    updates.push({
      id: lot.id,
      new_quantity: lot.quantite_restante - qtyToDeduct
    });

    // Ajouter aux lots utilisés pour la traçabilité
    lotsUsed.push({
      lot_id: lot.id,
      numero_lot: lot.numero_lot,
      quantite_deduite: qtyToDeduct,
      date_peremption: lot.date_peremption,
      prix_vente_ht: lot.prix_vente_ht,
      prix_vente_ttc: lot.prix_vente_ttc
    });

    remainingQty -= qtyToDeduct;
  }

  if (remainingQty > 0) {
    throw new Error(`Stock insuffisant: manque ${remainingQty} unités`);
  }

  // 3. Mettre à jour les lots via RPC pour enregistrer dans mouvements_lots
  for (const lotUsage of lotsUsed) {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('rpc_stock_record_movement', {
      p_lot_id: lotUsage.lot_id,
      p_produit_id: productId,
      p_type_mouvement: 'sortie',
      p_quantite_mouvement: lotUsage.quantite_deduite,
      p_motif: motif || 'Vente POS',
      p_reference_type: 'vente',
      p_reference_id: referenceId || null
    });

    if (rpcError) throw rpcError;

    // Vérifier le résultat de la RPC
    const result = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult;
    if (result && !result.success) {
      throw new Error(result.error || 'Erreur lors de la mise à jour du stock');
    }
  }

  // 4. Retourner les lots utilisés pour la traçabilité
  return lotsUsed;
}
