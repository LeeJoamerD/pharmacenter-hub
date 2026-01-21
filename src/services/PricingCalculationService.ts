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
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';

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

// Devises sans décimales (depuis configuration centralisée)
const NO_DECIMAL_CURRENCIES = DEFAULT_SETTINGS.currency.noDecimalCurrencies;

class PricingCalculationService {
  /**
   * Vérifie si une devise nécessite un arrondi à l'entier
   */
  private isNoDecimalCurrency(currencyCode?: string): boolean {
    const code = currencyCode || DEFAULT_SETTINGS.currency.code;
    return NO_DECIMAL_CURRENCIES.includes(code);
  }

  /**
   * Arrondit un montant selon la devise
   * - XAF/XOF/FCFA : arrondi à l'entier
   * - Autres devises : 2 décimales
   */
  private roundForCurrency(amount: number, currencyCode?: string): number {
    if (this.isNoDecimalCurrency(currencyCode)) {
      return Math.round(amount);
    }
    return Math.round(amount * 100) / 100;
  }

  /**
   * Calcule les prix d'un produit basé sur son prix d'achat et sa catégorie
   * @param prixAchat Prix d'achat du produit
   * @param coefficientPrixVente Coefficient de la catégorie de tarification
   * @param tauxTva Taux de TVA en pourcentage
   * @param tauxCentimeAdditionnel Taux du centime additionnel en pourcentage
   * @param currencyCode Code devise (optionnel, défaut: XAF)
   */
  calculatePrice(
    prixAchat: number,
    coefficientPrixVente: number,
    tauxTva: number,
    tauxCentimeAdditionnel: number,
    currencyCode?: string
  ): PriceCalculationResult {
    // Calculer prix HT (prix achat × coefficient) avec arrondi selon devise
    const prix_vente_ht = this.roundForCurrency(prixAchat * coefficientPrixVente, currencyCode);
    
    // Calculer centime additionnel (sur HT) avec arrondi selon devise
    const centime_additionnel = this.roundForCurrency(prix_vente_ht * (tauxCentimeAdditionnel / 100), currencyCode);
    
    // Calculer TVA (sur HT + centime additionnel) avec arrondi selon devise
    const tva = this.roundForCurrency((prix_vente_ht + centime_additionnel) * (tauxTva / 100), currencyCode);
    
    // Calculer prix TTC avec arrondi selon devise
    const prix_vente_ttc = this.roundForCurrency(prix_vente_ht + centime_additionnel + tva, currencyCode);

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
   * Recalcule les prix TTC des lots avec arrondi configurable
   * @param precision Multiple d'arrondi (ex: 25 = arrondir au multiple de 25)
   * @param method Méthode d'arrondi ('ceil', 'floor', 'round')
   */
  async recalculateLotPricesWithRounding(
    precision: number = 25,
    method: 'ceil' | 'floor' | 'round' = 'ceil'
  ): Promise<RecalculationResult> {
    try {
      const { data, error } = await supabase.rpc('recalculer_prix_lots_avec_arrondi', {
        p_precision: precision,
        p_method: method
      });

      if (error) {
        console.error('Erreur lors du recalcul des prix des lots avec arrondi:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return data as unknown as RecalculationResult;
    } catch (err) {
      console.error('Exception lors du recalcul des prix des lots avec arrondi:', err);
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
