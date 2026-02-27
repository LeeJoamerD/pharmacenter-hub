/**
 * Hook centralisé pour les calculs POS
 * Gère la couverture assureur, ticket modérateur, remises, caution
 */
import { useMemo } from 'react';
import { CustomerInfo } from '@/types/pos';

interface CartItem {
  product: any;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

interface POSCalculationsResult {
  // Montants de base
  totalHT: number;
  montantTVA: number;
  montantCentime: number;
  sousTotalTTC: number;
  
  // Couverture assureur
  estAssure: boolean;
  tauxCouverture: number;
  partAssurance: number;
  partClient: number;
  
  // Ticket modérateur (si non assuré)
  tauxTicketModerateur: number;
  montantTicketModerateur: number;
  
  // Remise automatique
  tauxRemise: number;
  montantRemise: number;
  
  // Total final
  totalAPayer: number;
  
  // Caution
  cautionDisponible: number;
  cautionUtilisable: boolean;
  peutPayerParCaution: boolean;
  
  // Validations
  peutPrendreBon: boolean;
}

export const usePOSCalculations = (
  cart: CartItem[],
  customer: CustomerInfo
): POSCalculationsResult => {
  return useMemo(() => {
    // 1. Calculer les montants de base
    const totalHT = cart.reduce((total, item) => {
      const priceHT = item.product.prix_vente_ht || item.product.price_ht || 0;
      return total + (priceHT * item.quantity);
    }, 0);

    const montantTVA = cart.reduce((total, item) => {
      let tvaMontant = item.product.tva_montant || 0;
      
      // Fallback: calculer depuis taux_tva si tva_montant manque
      if (tvaMontant === 0 && (item.product.taux_tva || 0) > 0) {
        const prixHT = item.product.prix_vente_ht || item.product.price_ht || 0;
        const prixTTC = item.product.prix_vente_ttc || item.product.price || item.unitPrice;
        const tauxTVA = item.product.taux_tva || 0;
        const tauxCentime = item.product.taux_centime_additionnel || 0;
        
        if (prixHT > 0) {
          tvaMontant = Math.round(prixHT * tauxTVA / 100);
        } else if (prixTTC > 0 && tauxTVA > 0) {
          // Calcul inverse depuis TTC
          const diviseur = 1 + (tauxTVA / 100) + (tauxCentime / 100);
          const calculatedHT = Math.round(prixTTC / diviseur);
          tvaMontant = Math.round(calculatedHT * tauxTVA / 100);
        }
      }
      
      return total + (tvaMontant * item.quantity);
    }, 0);

    const montantCentime = cart.reduce((total, item) => {
      let centimeMontant = item.product.centime_additionnel_montant || 0;
      
      // Fallback: calculer depuis taux_centime_additionnel si montant manque
      if (centimeMontant === 0 && (item.product.taux_centime_additionnel || 0) > 0) {
        const prixHT = item.product.prix_vente_ht || item.product.price_ht || 0;
        const prixTTC = item.product.prix_vente_ttc || item.product.price || item.unitPrice;
        const tauxTVA = item.product.taux_tva || 0;
        const tauxCentime = item.product.taux_centime_additionnel || 0;
        
        let tvaMontant = item.product.tva_montant || 0;
        if (tvaMontant === 0 && tauxTVA > 0) {
          if (prixHT > 0) {
            tvaMontant = Math.round(prixHT * tauxTVA / 100);
          } else if (prixTTC > 0) {
            const diviseur = 1 + (tauxTVA / 100) + (tauxCentime / 100);
            const calculatedHT = Math.round(prixTTC / diviseur);
            tvaMontant = Math.round(calculatedHT * tauxTVA / 100);
          }
        }
        
        if (tvaMontant > 0) {
          centimeMontant = Math.round(tvaMontant * tauxCentime / 100);
        }
      }
      
      return total + (centimeMontant * item.quantity);
    }, 0);

    const sousTotalTTC = cart.reduce((total, item) => total + item.total, 0);

    // 2. Vérifier si le client est assuré
    // Un client est assuré s'il a un assureur_id ET un taux_agent > 0
    const estAssure = !!(customer.assureur_id && (customer.taux_ayant_droit ?? 0) > 0);
    const tauxCouverture = estAssure ? (customer.taux_ayant_droit ?? 0) : 0;

    // 3. Calculer la part assurance et part client
    let partAssurance = 0;
    let partClient = sousTotalTTC;

    if (estAssure && tauxCouverture > 0) {
      partAssurance = Math.round(sousTotalTTC * tauxCouverture / 100);
      partClient = sousTotalTTC - partAssurance;
    }

    // 4. Ticket modérateur (appliqué seulement si NON assuré)
    // Note: Le ticket modérateur est une réduction, pas un supplément
    const tauxTicketModerateur = !estAssure ? (customer.taux_ticket_moderateur ?? 0) : 0;
    const montantTicketModerateur = !estAssure && tauxTicketModerateur > 0
      ? Math.round(partClient * tauxTicketModerateur / 100)
      : 0;

    // 5. Remise automatique (appliquée sur la part client)
    const tauxRemise = customer.taux_remise_automatique ?? customer.discount_rate ?? 0;
    // Appliquer la remise sur la part client après ticket modérateur
    const baseRemise = partClient - montantTicketModerateur;
    const montantRemise = tauxRemise > 0 ? Math.round(baseRemise * tauxRemise / 100) : 0;

    // 6. Total à payer par le client
    // = Part client - Ticket modérateur - Remise automatique
    const totalAPayer = Math.max(0, partClient - montantTicketModerateur - montantRemise);

    // 7. Caution
    const cautionDisponible = customer.caution ?? 0;
    const cautionUtilisable = (customer.utiliser_caution === true) && cautionDisponible > 0;
    const peutPayerParCaution = cautionUtilisable && cautionDisponible >= totalAPayer;

    // 8. Validations
    const peutPrendreBon = customer.peut_prendre_bon ?? false;

    return {
      // Montants de base
      totalHT,
      montantTVA,
      montantCentime,
      sousTotalTTC,
      
      // Couverture assureur
      estAssure,
      tauxCouverture,
      partAssurance,
      partClient,
      
      // Ticket modérateur
      tauxTicketModerateur,
      montantTicketModerateur,
      
      // Remise automatique
      tauxRemise,
      montantRemise,
      
      // Total final
      totalAPayer,
      
      // Caution
      cautionDisponible,
      cautionUtilisable,
      peutPayerParCaution,
      
      // Validations
      peutPrendreBon,
    };
  }, [cart, customer]);
};

export default usePOSCalculations;
