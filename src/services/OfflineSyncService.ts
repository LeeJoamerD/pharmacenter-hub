/**
 * Service de synchronisation des transactions offline vers Supabase
 */
import { supabase } from '@/integrations/supabase/client';
import { OfflineSyncQueue, OfflineTransaction } from './OfflineSyncQueue';

const MAX_RETRIES = 3;

export class OfflineSyncService {
  private static isSyncing = false;
  private static listeners: Set<() => void> = new Set();

  static onStatusChange(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private static notifyListeners() {
    this.listeners.forEach(cb => cb());
  }

  /**
   * Synchroniser toutes les transactions en attente
   */
  static async syncAll(): Promise<{ synced: number; failed: number; errors: string[] }> {
    if (this.isSyncing) return { synced: 0, failed: 0, errors: ['Sync déjà en cours'] };
    if (!navigator.onLine) return { synced: 0, failed: 0, errors: ['Hors ligne'] };

    this.isSyncing = true;
    this.notifyListeners();

    const results = { synced: 0, failed: 0, errors: [] as string[] };

    try {
      const pending = await OfflineSyncQueue.getPending();
      console.log(`🔄 Sync: ${pending.length} transaction(s) en attente`);

      for (const tx of pending) {
        if (tx.retryCount >= MAX_RETRIES) {
          console.warn(`⚠️ Transaction ${tx.id} ignorée (max retries atteint)`);
          results.failed++;
          results.errors.push(`${tx.payload.offlineInvoiceNumber}: trop de tentatives`);
          continue;
        }

        try {
          await this.syncTransaction(tx);
          results.synced++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${tx.payload.offlineInvoiceNumber}: ${error.message}`);
        }
      }

      // Nettoyage des anciennes transactions synced
      await OfflineSyncQueue.cleanup();
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    console.log(`✅ Sync terminée: ${results.synced} ok, ${results.failed} erreurs`);
    return results;
  }

  /**
   * Synchroniser une seule transaction
   */
  private static async syncTransaction(tx: OfflineTransaction): Promise<void> {
    await OfflineSyncQueue.updateStatus(tx.id, 'syncing');
    this.notifyListeners();

    try {
      // 1. Vérifier le stock pour chaque produit
      const stockIssues = await this.checkStockAvailability(tx);
      if (stockIssues.length > 0) {
        const msg = `Stock insuffisant: ${stockIssues.join(', ')}`;
        await OfflineSyncQueue.updateStatus(tx.id, 'error', msg);
        this.notifyListeners();
        throw new Error(msg);
      }

      // 2. Créer la vente dans Supabase via RPC ou insertion directe
      const { data: vente, error: venteError } = await supabase
        .from('ventes')
        .insert({
          tenant_id: tx.tenantId,
          session_caisse_id: tx.sessionId,
          agent_id: tx.agentId,
          date_vente: new Date(tx.timestamp).toISOString(),
          montant_total_ttc: tx.payload.totals.totalTTC,
          montant_total_ht: tx.payload.totals.totalHT,
          montant_tva: tx.payload.totals.totalTVA,
          montant_centime_additionnel: tx.payload.totals.totalCentime,
          remise_globale: tx.payload.totals.remiseGlobale,
          montant_net: tx.payload.totals.montantNet,
          taux_couverture_assurance: tx.payload.totals.tauxCouvertureAssurance,
          montant_part_assurance: tx.payload.totals.montantPartAssurance,
          montant_part_patient: tx.payload.totals.montantPartPatient,
          mode_paiement: tx.payload.payment.method,
          montant_recu: tx.payload.payment.amountReceived,
          montant_rendu: tx.payload.payment.change,
          reference_paiement: tx.payload.payment.reference,
          client_id: tx.payload.customer.id || null,
          statut: 'Payée',
          source: 'offline',
          metadata: {
            offline_id: tx.id,
            offline_invoice: tx.payload.offlineInvoiceNumber,
            offline_timestamp: tx.timestamp,
            synced_at: new Date().toISOString(),
            client_info: {
              type: tx.payload.customer.type,
              name: tx.payload.customer.name,
              assureur_id: tx.payload.customer.assureurId,
              assureur_libelle: tx.payload.customer.assureurLibelle,
              taux_agent: tx.payload.customer.tauxAgent,
              taux_ayant_droit: tx.payload.customer.tauxAyantDroit,
              taux_ticket_moderateur: tx.payload.customer.tauxTicketModerateur,
              societe_id: tx.payload.customer.societeId,
              personnel_id: tx.payload.customer.personnelId,
            },
          },
        })
        .select('id, numero_vente')
        .single();

      if (venteError) throw venteError;

      // 3. Créer les lignes de vente
      const lignes = tx.payload.cart.map(item => ({
        tenant_id: tx.tenantId,
        vente_id: vente.id,
        produit_id: item.productId,
        quantite: item.quantity,
        prix_unitaire_ttc: item.unitPriceTTC,
        prix_unitaire_ht: item.unitPriceHT,
        taux_tva: item.tvaRate,
        montant_tva: item.tvaMontant,
        taux_centime_additionnel: item.centimeRate,
        montant_centime_additionnel: item.centimeMontant,
        montant_ligne_ttc: item.totalTTC,
        montant_ligne_ht: item.totalHT,
        remise: item.discount,
        lot_id: item.lotId || null,
        numero_lot: item.lotNumero || null,
        date_peremption_lot: item.lotExpiration || null,
      }));

      const { error: lignesError } = await supabase
        .from('lignes_ventes')
        .insert(lignes);

      if (lignesError) throw lignesError;

      // 4. Mettre à jour les stocks (décrémenter les lots)
      for (const item of tx.payload.cart) {
        if (item.lotId) {
          const { error: stockError } = await supabase.rpc('decrement_lot_quantity', {
            p_lot_id: item.lotId,
            p_quantity: item.quantity,
            p_tenant_id: tx.tenantId,
          });

          if (stockError) {
            console.warn(`⚠️ Erreur décrémentation lot ${item.lotId}:`, stockError);
            // On continue quand même, la vente est créée
          }
        }
      }

      // 5. Marquer comme synchronisé
      await OfflineSyncQueue.updateStatus(tx.id, 'synced');
      this.notifyListeners();

      console.log(`✅ Transaction ${tx.payload.offlineInvoiceNumber} → ${vente.numero_vente}`);
    } catch (error: any) {
      await OfflineSyncQueue.updateStatus(tx.id, 'error', error.message);
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Vérifier la disponibilité du stock avant synchronisation
   */
  private static async checkStockAvailability(tx: OfflineTransaction): Promise<string[]> {
    const issues: string[] = [];

    for (const item of tx.payload.cart) {
      if (!item.lotId) continue;

      const { data: lot } = await supabase
        .from('lots')
        .select('quantite_restante')
        .eq('id', item.lotId)
        .eq('tenant_id', tx.tenantId)
        .single();

      if (!lot || lot.quantite_restante < item.quantity) {
        const available = lot?.quantite_restante ?? 0;
        issues.push(
          `${item.productName}: demandé ${item.quantity}, disponible ${available}`
        );
      }
    }

    return issues;
  }

  static getIsSyncing(): boolean {
    return this.isSyncing;
  }
}
