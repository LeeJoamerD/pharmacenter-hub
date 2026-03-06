/**
 * Hook pour gérer les ventes POS en mode offline
 */
import { useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { OfflineSyncQueue, OfflineTransaction } from '@/services/OfflineSyncQueue';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import type { CartItemWithLot, CustomerInfo, PaymentInfo } from '@/types/pos';

interface OfflineSaleParams {
  cart: CartItemWithLot[];
  customer: CustomerInfo;
  payment: PaymentInfo;
  sessionId: string;
  agentId: string;
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
}

export const usePOSOffline = () => {
  const { isOnline } = useOnlineStatus();
  const { tenantId } = useTenant();
  const { toast } = useToast();

  /**
   * Enregistrer une vente offline
   */
  const saveOfflineSale = useCallback(async (params: OfflineSaleParams): Promise<{
    success: boolean;
    offlineId: string;
    offlineInvoiceNumber: string;
  }> => {
    const offlineInvoiceNumber = OfflineSyncQueue.generateOfflineInvoiceNumber('OFF');

    const transaction: Omit<OfflineTransaction, 'status' | 'retryCount'> = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      tenantId,
      sessionId: params.sessionId,
      agentId: params.agentId,
      payload: {
        cart: params.cart.map(item => ({
          productId: item.product.id,
          productName: item.product.libelle_produit || item.product.name,
          quantity: item.quantity,
          unitPriceTTC: item.product.prix_vente_ttc || item.unitPrice,
          unitPriceHT: item.product.prix_vente_ht || item.product.price_ht || 0,
          tvaRate: item.product.taux_tva || 0,
          tvaMontant: item.product.tva_montant || 0,
          centimeRate: item.product.taux_centime_additionnel || 0,
          centimeMontant: item.product.centime_additionnel_montant || 0,
          lotId: item.lot?.id,
          lotNumero: item.lot?.numero_lot,
          lotExpiration: item.lot?.date_peremption?.toString(),
          discount: item.discount || 0,
          totalTTC: item.total,
          totalHT: (item.product.prix_vente_ht || 0) * item.quantity,
        })),
        customer: {
          id: params.customer.id,
          type: params.customer.type,
          name: params.customer.name,
          discountRate: params.customer.discount_rate || params.customer.discountRate || 0,
          assureurId: params.customer.assureur_id,
          assureurLibelle: params.customer.assureur_libelle,
          tauxAgent: params.customer.taux_agent,
          tauxAyantDroit: params.customer.taux_ayant_droit,
          tauxTicketModerateur: params.customer.taux_ticket_moderateur,
          societeId: params.customer.societe_id,
          personnelId: params.customer.personnel_id,
          typeTauxCouverture: params.customer.type_taux_couverture,
          caution: params.customer.caution,
          utiliserCaution: params.customer.utiliser_caution,
        },
        payment: {
          method: params.payment.method,
          amountReceived: params.payment.amount_received,
          change: params.payment.change,
          reference: params.payment.reference,
        },
        totals: params.totals,
        offlineInvoiceNumber,
      },
    };

    try {
      const id = await OfflineSyncQueue.enqueue(transaction);

      toast({
        title: '📦 Vente enregistrée hors ligne',
        description: `N° ${offlineInvoiceNumber} — sera synchronisée au retour de la connexion.`,
      });

      return { success: true, offlineId: id, offlineInvoiceNumber };
    } catch (error: any) {
      console.error('Erreur sauvegarde offline:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la vente hors ligne.',
        variant: 'destructive',
      });
      return { success: false, offlineId: '', offlineInvoiceNumber: '' };
    }
  }, [tenantId, toast]);

  return {
    isOnline,
    saveOfflineSale,
  };
};
