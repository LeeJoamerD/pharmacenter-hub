/**
 * File d'attente offline pour les transactions POS
 * Stocke les ventes dans IndexedDB quand hors ligne, synchronise au retour
 */
import { get, set, del, keys, createStore } from 'idb-keyval';

const offlineStore = createStore('pharmasoft-offline', 'sync-queue');

export interface OfflineTransaction {
  id: string;
  timestamp: number;
  tenantId: string;
  sessionId: string;
  agentId: string;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  retryCount: number;
  // Données de la vente
  payload: {
    cart: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPriceTTC: number;
      unitPriceHT: number;
      tvaRate: number;
      tvaMontant: number;
      centimeRate: number;
      centimeMontant: number;
      lotId?: string;
      lotNumero?: string;
      lotExpiration?: string;
      discount: number;
      totalTTC: number;
      totalHT: number;
    }>;
    customer: {
      id?: string;
      type: string;
      name?: string;
      discountRate: number;
      assureurId?: string;
      assureurLibelle?: string;
      tauxAgent?: number;
      tauxAyantDroit?: number;
      tauxTicketModerateur?: number;
      societeId?: string;
      personnelId?: string;
      typeTauxCouverture?: string;
      caution?: number;
      utiliserCaution?: boolean;
    };
    payment: {
      method: string;
      amountReceived: number;
      change: number;
      reference?: string;
    };
    totals: {
      totalTTC: number;
      totalHT: number;
      totalTVA: number;
      totalCentime: number;
      remiseGlobale: number;
      montantNet: number;
      tauxCouvertureAssurance: number;
      montantPartAssurance: number;
      montantPartPatient: number;
    };
    offlineInvoiceNumber: string; // Numéro temporaire offline
  };
}

export class OfflineSyncQueue {
  /**
   * Ajouter une transaction à la file d'attente
   */
  static async enqueue(transaction: Omit<OfflineTransaction, 'status' | 'retryCount'>): Promise<string> {
    const entry: OfflineTransaction = {
      ...transaction,
      status: 'pending',
      retryCount: 0,
    };
    await set(transaction.id, entry, offlineStore);
    console.log('📦 Transaction offline enregistrée:', transaction.id);
    return transaction.id;
  }

  /**
   * Récupérer toutes les transactions en attente
   */
  static async getPending(): Promise<OfflineTransaction[]> {
    const allKeys = await keys(offlineStore);
    const transactions: OfflineTransaction[] = [];
    for (const key of allKeys) {
      const tx = await get<OfflineTransaction>(key, offlineStore);
      if (tx && (tx.status === 'pending' || tx.status === 'error')) {
        transactions.push(tx);
      }
    }
    // Trier par timestamp (FIFO)
    return transactions.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Mettre à jour le statut d'une transaction
   */
  static async updateStatus(
    id: string,
    status: OfflineTransaction['status'],
    errorMessage?: string
  ): Promise<void> {
    const tx = await get<OfflineTransaction>(id, offlineStore);
    if (tx) {
      tx.status = status;
      tx.errorMessage = errorMessage;
      if (status === 'error') tx.retryCount++;
      await set(id, tx, offlineStore);
    }
  }

  /**
   * Supprimer une transaction synchronisée
   */
  static async remove(id: string): Promise<void> {
    await del(id, offlineStore);
  }

  /**
   * Compter les transactions en attente
   */
  static async getPendingCount(): Promise<number> {
    const pending = await this.getPending();
    return pending.length;
  }

  /**
   * Récupérer toutes les transactions (y compris synced)
   */
  static async getAll(): Promise<OfflineTransaction[]> {
    const allKeys = await keys(offlineStore);
    const transactions: OfflineTransaction[] = [];
    for (const key of allKeys) {
      const tx = await get<OfflineTransaction>(key, offlineStore);
      if (tx) transactions.push(tx);
    }
    return transactions.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Nettoyer les transactions synchronisées (garder 24h pour historique)
   */
  static async cleanup(): Promise<void> {
    const allKeys = await keys(offlineStore);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const key of allKeys) {
      const tx = await get<OfflineTransaction>(key, offlineStore);
      if (tx && tx.status === 'synced' && tx.timestamp < cutoff) {
        await del(key, offlineStore);
      }
    }
  }

  /**
   * Générer un numéro de facture offline temporaire
   */
  static generateOfflineInvoiceNumber(tenantPrefix: string = 'OFF'): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${tenantPrefix}-${dateStr}-${timeStr}-${random}`;
  }
}
