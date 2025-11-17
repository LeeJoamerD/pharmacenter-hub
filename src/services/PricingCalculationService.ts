/**
 * ÉTAPE 5: Service Centralisé de Calcul des Prix
 * 
 * Ce service fournit des méthodes pour:
 * - Calculer les prix d'un produit individuellement
 * - Recalculer tous les prix des produits via RPC
 * - Recalculer les prix_vente_suggere des lots via RPC
 * - Effectuer un recalcul complet (produits + lots)
 */

import { supabase } from '@/integrations/supabase/client';

export interface PriceCalculationResult {
  prix_vente_ht: number;
  tva: number;
  centime_additionnel: number;
  prix_vente_ttc: number;
}

export interface RecalculationResult {
  success: boolean;
  products_updated?: number;
  lots_updated?: number;
  message?: string;
  error?: string;
}

class PricingCalculationService {
  /**
   * Calcule les prix d'un produit basé sur son prix d'achat et sa catégorie
   */
  calculatePrice(
    prixAchat: number,
    coefficientPrixVente: number,
    tauxTva: number,
    tauxCentimeAdditionnel: number
  ): PriceCalculationResult {
    // Calculer prix HT (prix achat × coefficient)
    const prix_vente_ht = prixAchat * coefficientPrixVente;
    
    // Calculer centime additionnel (sur HT)
    const centime_additionnel = prix_vente_ht * (tauxCentimeAdditionnel / 100);
    
    // Calculer TVA (sur HT + centime additionnel)
    const tva = (prix_vente_ht + centime_additionnel) * (tauxTva / 100);
    
    // Calculer prix TTC
    const prix_vente_ttc = prix_vente_ht + centime_additionnel + tva;

    return {
      prix_vente_ht,
      tva,
      centime_additionnel,
      prix_vente_ttc
    };
  }

  /**
   * Recalcule tous les prix des produits via la fonction RPC Supabase
   */
  async recalculateAllProductPrices(): Promise<RecalculationResult> {
    try {
      const { data, error } = await supabase.rpc('recalculer_prix_produits');

      if (error) {
        console.error('Erreur lors du recalcul des prix produits:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return data as unknown as RecalculationResult;
    } catch (err) {
      console.error('Exception lors du recalcul des prix produits:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Recalcule tous les prix_vente_suggere des lots via la fonction RPC Supabase
   */
  async recalculateLotPrices(): Promise<RecalculationResult> {
    try {
      const { data, error } = await supabase.rpc('recalculer_prix_lots');

      if (error) {
        console.error('Erreur lors du recalcul des prix des lots:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return data as unknown as RecalculationResult;
    } catch (err) {
      console.error('Exception lors du recalcul des prix des lots:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Effectue un recalcul complet : produits puis lots
   */
  async recalculateAll(): Promise<{
    success: boolean;
    productResult: RecalculationResult;
    lotResult: RecalculationResult;
  }> {
    const productResult = await this.recalculateAllProductPrices();
    const lotResult = await this.recalculateLotPrices();

    return {
      success: productResult.success && lotResult.success,
      productResult,
      lotResult
    };
  }
}

// Export une instance unique du service
export const pricingCalculationService = new PricingCalculationService();
export default pricingCalculationService;
